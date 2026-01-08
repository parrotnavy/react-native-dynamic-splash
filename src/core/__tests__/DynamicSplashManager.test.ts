import { NativeModules } from "react-native";
import type { InitOptions, SplashConfig } from "../../types";
import { DynamicSplashManagerImpl } from "../DynamicSplashManager";

// Mock the services
jest.mock("../../services/storage");
jest.mock("../../services/fileSystem");
jest.mock("../../services/sync");

import { SplashFileSystem } from "../../services/fileSystem";
import { SplashStorage } from "../../services/storage";
import * as sync from "../../services/sync";

describe("DynamicSplashManagerImpl", () => {
	const validConfig: SplashConfig = {
		imageName: "test-image",
		alt: "Test Image",
		startAt: "2020-01-01T00:00:00Z",
		endAt: "2030-12-31T23:59:59Z",
		imageUrl: "https://example.com/image.png",
		configVersion: "v1",
	};

	const createOptions = (
		overrides: Partial<InitOptions> = {},
	): InitOptions => ({
		configProvider: jest.fn().mockResolvedValue(validConfig),
		...overrides,
	});

	beforeEach(() => {
		jest.clearAllMocks();
		// Set up sync mocks before each test
		(sync.performBackgroundUpdate as jest.Mock).mockResolvedValue(undefined);
		(sync.processSplashConfig as jest.Mock).mockResolvedValue(undefined);
	});

	describe("constructor", () => {
		it("creates storage and fileSystem instances", () => {
			const options = createOptions();
			new DynamicSplashManagerImpl(options);

			expect(SplashStorage).toHaveBeenCalledWith(options);
			expect(SplashFileSystem).toHaveBeenCalledWith(undefined);
		});

		it("passes fileLocation to fileSystem", () => {
			const options = createOptions({ fileLocation: "cache" });
			new DynamicSplashManagerImpl(options);

			expect(SplashFileSystem).toHaveBeenCalledWith("cache");
		});
	});

	describe("mount()", () => {
		it("calls performBackgroundUpdate when no initialConfig", async () => {
			const options = createOptions();
			const manager = new DynamicSplashManagerImpl(options);

			await manager.mount();

			expect(sync.performBackgroundUpdate).toHaveBeenCalled();
			expect(sync.processSplashConfig).not.toHaveBeenCalled();
		});

		it("calls processSplashConfig when initialConfig is provided", async () => {
			const options = createOptions({
				initialConfig: validConfig,
			});
			const manager = new DynamicSplashManagerImpl(options);

			await manager.mount();

			expect(sync.processSplashConfig).toHaveBeenCalledWith(
				validConfig,
				options,
				expect.any(Object),
				expect.any(Object),
			);
			expect(sync.performBackgroundUpdate).not.toHaveBeenCalled();
		});

		it("logs when logger is provided", async () => {
			const mockLogger = jest.fn();
			const options = createOptions({ logger: mockLogger });
			const manager = new DynamicSplashManagerImpl(options);

			await manager.mount();

			expect(mockLogger).toHaveBeenCalledWith(
				expect.stringContaining("Mount called"),
			);
		});

		it("catches and logs errors from performBackgroundUpdate", async () => {
			const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
			(sync.performBackgroundUpdate as jest.Mock).mockRejectedValue(
				new Error("Test error"),
			);

			const options = createOptions();
			const manager = new DynamicSplashManagerImpl(options);

			await manager.mount();

			// Give time for the async error handler
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining("Unhandled error"),
				expect.any(Error),
			);

			consoleErrorSpy.mockRestore();
		});
	});

	describe("hide()", () => {
		it("calls native hide()", async () => {
			const options = createOptions();
			const manager = new DynamicSplashManagerImpl(options);

			await manager.hide();

			expect(NativeModules.DynamicSplashNative.hide).toHaveBeenCalled();
		});

		it("logs when logger is provided", async () => {
			const mockLogger = jest.fn();
			const options = createOptions({ logger: mockLogger });
			const manager = new DynamicSplashManagerImpl(options);

			await manager.hide();

			expect(mockLogger).toHaveBeenCalledWith(
				expect.stringContaining("Hide requested"),
			);
		});
	});

	describe("isVisible()", () => {
		it("returns true when native isShowing returns true", async () => {
			(
				NativeModules.DynamicSplashNative.isShowing as jest.Mock
			).mockResolvedValue(true);

			const options = createOptions();
			const manager = new DynamicSplashManagerImpl(options);
			const result = await manager.isVisible();

			expect(result).toBe(true);
		});

		it("returns false when native isShowing returns false", async () => {
			(
				NativeModules.DynamicSplashNative.isShowing as jest.Mock
			).mockResolvedValue(false);

			const options = createOptions();
			const manager = new DynamicSplashManagerImpl(options);
			const result = await manager.isVisible();

			expect(result).toBe(false);
		});

		it("returns false when native isShowing throws", async () => {
			(
				NativeModules.DynamicSplashNative.isShowing as jest.Mock
			).mockRejectedValue(new Error("Native error"));

			const options = createOptions();
			const manager = new DynamicSplashManagerImpl(options);
			const result = await manager.isVisible();

			expect(result).toBe(false);
		});
	});
});
