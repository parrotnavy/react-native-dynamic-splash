import { NativeModules } from "react-native";
import type { InitOptions, SplashConfig, StoredMeta } from "../../types";
import type { SplashFileSystem } from "../fileSystem";
import type { SplashStorage } from "../storage";
import { performBackgroundUpdate, processSplashConfig } from "../sync";

describe("sync", () => {
	const now = Date.now();
	const pastDate = new Date(now - 1000 * 60 * 60 * 24).toISOString();
	const futureDate = new Date(now + 1000 * 60 * 60 * 24 * 365).toISOString();

	const validConfig: SplashConfig = {
		imageName: "test-image",
		alt: "Test Image",
		startAt: pastDate,
		endAt: futureDate,
		imageUrl: "https://example.com/image.png",
		configVersion: "v1",
	};

	let mockStorage: jest.Mocked<SplashStorage>;
	let mockFs: jest.Mocked<SplashFileSystem>;
	let mockLogger: jest.Mock;

	const createOptions = (
		overrides: Partial<InitOptions> = {},
	): InitOptions => ({
		configProvider: jest.fn().mockResolvedValue(validConfig),
		logger: mockLogger,
		...overrides,
	});

	beforeEach(() => {
		jest.clearAllMocks();

		mockStorage = {
			getMeta: jest.fn().mockReturnValue({ status: "EMPTY" }),
			setMeta: jest.fn(),
			clear: jest.fn(),
			ready: jest.fn().mockResolvedValue(true),
		} as unknown as jest.Mocked<SplashStorage>;

		mockFs = {
			downloadImage: jest.fn().mockResolvedValue("/temp/image.png"),
			commitImage: jest.fn().mockResolvedValue("/documents/test-image"),
			exists: jest.fn().mockResolvedValue(false),
			delete: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<SplashFileSystem>;

		mockLogger = jest.fn();
	});

	describe("performBackgroundUpdate", () => {
		it("saves READY status on successful update", async () => {
			const options = createOptions();

			await performBackgroundUpdate(options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "READY",
					imageName: "test-image",
					configVersion: "v1",
				}),
			);
		});

		it("saves ERROR status when configProvider throws", async () => {
			const options = createOptions({
				configProvider: jest.fn().mockRejectedValue(new Error("Network error")),
			});

			await performBackgroundUpdate(options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "ERROR",
					lastError: "Network error",
				}),
			);
		});

		it("saves ERROR status for invalid schema", async () => {
			const options = createOptions({
				configProvider: jest.fn().mockResolvedValue({ invalid: "config" }),
			});

			await performBackgroundUpdate(options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "ERROR",
					lastError: "Invalid JSON schema",
				}),
			);
		});

		it("saves ERROR status for empty array", async () => {
			const options = createOptions({
				configProvider: jest.fn().mockResolvedValue([]),
			});

			await performBackgroundUpdate(options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "ERROR",
					lastError: "Config array is empty",
				}),
			);
		});

		it("processes array of configs", async () => {
			const configs: SplashConfig[] = [
				{ ...validConfig, imageName: "image-1", weight: 1 },
				{ ...validConfig, imageName: "image-2", weight: 1 },
			];
			const options = createOptions({
				configProvider: jest.fn().mockResolvedValue(configs),
			});

			await performBackgroundUpdate(options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "READY",
				}),
			);
		});

		it("saves ERROR when no configs within time window", async () => {
			const farFuture = new Date(
				now + 1000 * 60 * 60 * 24 * 365 * 10,
			).toISOString();
			const farFuturePlus = new Date(
				now + 1000 * 60 * 60 * 24 * 365 * 11,
			).toISOString();
			const configs: SplashConfig[] = [
				{ ...validConfig, startAt: farFuture, endAt: farFuturePlus },
			];
			const options = createOptions({
				configProvider: jest.fn().mockResolvedValue(configs),
			});

			await performBackgroundUpdate(options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "ERROR",
					lastError: "No config within time window",
				}),
			);
		});
	});

	describe("processSplashConfig", () => {
		it("downloads and commits image on cache miss", async () => {
			const options = createOptions();

			await processSplashConfig(validConfig, options, mockStorage, mockFs);

			expect(mockFs.downloadImage).toHaveBeenCalledWith(
				"https://example.com/image.png",
				"test-image",
			);
			expect(mockFs.commitImage).toHaveBeenCalled();
			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "READY",
					localPath: "/documents/test-image",
				}),
			);
		});

		it("skips download when cache is valid", async () => {
			mockStorage.getMeta.mockReturnValue({
				status: "READY",
				imageName: "test-image",
				configVersion: "v1",
				imageUrl: "https://example.com/image.png",
				localPath: "/documents/test-image",
			});
			mockFs.exists.mockResolvedValue(true);

			const options = createOptions();
			await processSplashConfig(validConfig, options, mockStorage, mockFs);

			expect(mockFs.downloadImage).not.toHaveBeenCalled();
			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "READY",
					localPath: "/documents/test-image",
				}),
			);
		});

		it("re-downloads when configVersion changes", async () => {
			mockStorage.getMeta.mockReturnValue({
				status: "READY",
				imageName: "test-image",
				configVersion: "v0", // Different version
				imageUrl: "https://example.com/image.png",
				localPath: "/documents/test-image",
			});
			mockFs.exists.mockResolvedValue(true);

			const options = createOptions();
			await processSplashConfig(validConfig, options, mockStorage, mockFs);

			expect(mockFs.downloadImage).toHaveBeenCalled();
		});

		it("re-downloads when local file is missing", async () => {
			mockStorage.getMeta.mockReturnValue({
				status: "READY",
				imageName: "test-image",
				configVersion: "v1",
				imageUrl: "https://example.com/image.png",
				localPath: "/documents/test-image",
			});
			mockFs.exists.mockResolvedValue(false); // File doesn't exist

			const options = createOptions();
			await processSplashConfig(validConfig, options, mockStorage, mockFs);

			expect(mockFs.downloadImage).toHaveBeenCalled();
		});

		it("selects config by weight from array", async () => {
			// Run multiple times to test probability
			const configs: SplashConfig[] = [
				{ ...validConfig, imageName: "high-weight", weight: 100 },
				{ ...validConfig, imageName: "low-weight", weight: 1 },
			];
			const options = createOptions();

			const selectedNames: string[] = [];
			for (let i = 0; i < 100; i++) {
				jest.clearAllMocks();
				await processSplashConfig(configs, options, mockStorage, mockFs);

				const setMetaCall = mockStorage.setMeta.mock.calls[0][0] as StoredMeta;
				selectedNames.push(setMetaCall.imageName ?? "");
			}

			// High weight should be selected more often
			const highWeightCount = selectedNames.filter(
				(n) => n === "high-weight",
			).length;
			expect(highWeightCount).toBeGreaterThan(80); // Should be ~99%
		});

		it("normalizes fade options from animation config", async () => {
			const options = createOptions({
				animation: {
					fade: {
						enabled: true,
						durationMs: 500,
					},
				},
			});

			await processSplashConfig(validConfig, options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					enableFade: true,
					fadeDurationMs: 500,
				}),
			);
		});

		it("normalizes scale options from animation config", async () => {
			const options = createOptions({
				animation: {
					scale: {
						startScale: 1.0,
						endScale: 1.2,
						durationMs: 1000,
						easing: "easeInOut",
					},
				},
			});

			await processSplashConfig(validConfig, options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					scaleStart: 1.0,
					scaleEnd: 1.2,
					scaleDurationMs: 1000,
					scaleEasing: "easeInOut",
				}),
			);
		});

		it("throws error when scale options are incomplete", async () => {
			const options = createOptions({
				animation: {
					scale: {
						startScale: 1.0,
						// Missing endScale and durationMs
					} as any,
				},
			});

			await expect(
				processSplashConfig(validConfig, options, mockStorage, mockFs),
			).rejects.toThrow("startScale and endScale must be provided together");
		});

		it("throws error when scale durationMs is missing", async () => {
			const options = createOptions({
				animation: {
					scale: {
						startScale: 1.0,
						endScale: 1.2,
						// Missing durationMs
					} as any,
				},
			});

			await expect(
				processSplashConfig(validConfig, options, mockStorage, mockFs),
			).rejects.toThrow("durationMs must be provided");
		});

		it("throws error when scale durationMs is zero or negative", async () => {
			const options = createOptions({
				animation: {
					scale: {
						startScale: 1.0,
						endScale: 1.2,
						durationMs: 0,
					},
				},
			});

			await expect(
				processSplashConfig(validConfig, options, mockStorage, mockFs),
			).rejects.toThrow("durationMs must be > 0");
		});

		it("stores minDurationMs and maxDurationMs", async () => {
			const options = createOptions({
				minDurationMs: 2000,
				maxDurationMs: 5000,
			});

			await processSplashConfig(validConfig, options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					minDurationMs: 2000,
					maxDurationMs: 5000,
				}),
			);
		});

		it("calls native show() when showOnUpdate is true", async () => {
			const options = createOptions({
				showOnUpdate: true,
			});

			await processSplashConfig(validConfig, options, mockStorage, mockFs);

			expect(NativeModules.DynamicSplashNative.show).toHaveBeenCalled();
		});

		it("does not call native show() when showOnUpdate is false", async () => {
			const options = createOptions({
				showOnUpdate: false,
			});

			await processSplashConfig(validConfig, options, mockStorage, mockFs);

			expect(NativeModules.DynamicSplashNative.show).not.toHaveBeenCalled();
		});

		it("stores backgroundColor from config", async () => {
			const configWithBg: SplashConfig = {
				...validConfig,
				backgroundColor: "#FF0000",
			};
			const options = createOptions();

			await processSplashConfig(configWithBg, options, mockStorage, mockFs);

			expect(mockStorage.setMeta).toHaveBeenCalledWith(
				expect.objectContaining({
					backgroundColor: "#FF0000",
				}),
			);
		});

		it("throws error when single config is outside time window", async () => {
			const farFuture = new Date(
				now + 1000 * 60 * 60 * 24 * 365 * 10,
			).toISOString();
			const farFuturePlus = new Date(
				now + 1000 * 60 * 60 * 24 * 365 * 11,
			).toISOString();
			const futureConfig: SplashConfig = {
				...validConfig,
				startAt: farFuture,
				endAt: farFuturePlus,
			};
			const options = createOptions();

			await expect(
				processSplashConfig(futureConfig, options, mockStorage, mockFs),
			).rejects.toThrow("Config is outside time window");
		});
	});
});
