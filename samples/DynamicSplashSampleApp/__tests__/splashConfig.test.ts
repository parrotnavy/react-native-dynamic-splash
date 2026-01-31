import {
	INITIAL_CONFIG,
	SHOWCASE_CONFIGS,
	splashConfig,
} from "../splashConfig";

describe("splashConfig", () => {
	it("has all 11 InitOptions properties", () => {
		const expectedKeys = [
			"configProvider",
			"minDurationMs",
			"maxDurationMs",
			"animation",
			"storageKey",
			"fileLocation",
			"initialConfig",
			"logger",
			"storageReadyTimeoutMs",
			"showOnUpdate",
		];
		for (const key of expectedKeys) {
			expect(splashConfig).toHaveProperty(key);
		}
		expect(splashConfig.animation).toHaveProperty("fade");
		expect(splashConfig.animation).toHaveProperty("scale");
	});

	it("configProvider is a function that returns a Promise", async () => {
		expect(typeof splashConfig.configProvider).toBe("function");
		const result = splashConfig.configProvider();
		expect(result).toBeInstanceOf(Promise);
		const configs = await result;
		expect(Array.isArray(configs)).toBe(true);
	});

	it("minDurationMs is a reasonable positive number", () => {
		expect(typeof splashConfig.minDurationMs).toBe("number");
		expect(splashConfig.minDurationMs).toBeGreaterThan(0);
		expect(splashConfig.minDurationMs).toBeLessThanOrEqual(10000);
	});

	it("maxDurationMs is a reasonable number greater than minDurationMs", () => {
		expect(typeof splashConfig.maxDurationMs).toBe("number");
		expect(splashConfig.maxDurationMs).toBeGreaterThan(0);
		expect(splashConfig.maxDurationMs).toBeLessThanOrEqual(30000);
		expect(splashConfig.maxDurationMs!).toBeGreaterThan(
			splashConfig.minDurationMs!,
		);
	});

	it("animation.fade is properly structured", () => {
		expect(splashConfig.animation).toBeDefined();
		expect(splashConfig.animation!.fade).toBeDefined();
		expect(typeof splashConfig.animation!.fade!.enabled).toBe("boolean");
		expect(typeof splashConfig.animation!.fade!.durationMs).toBe("number");
		expect(splashConfig.animation!.fade!.durationMs).toBeGreaterThan(0);
	});

	it("animation.scale is properly structured", () => {
		expect(splashConfig.animation).toBeDefined();
		expect(splashConfig.animation!.scale).toBeDefined();
		const scale = splashConfig.animation!.scale!;
		expect(typeof scale.startScale).toBe("number");
		expect(typeof scale.endScale).toBe("number");
		expect(typeof scale.durationMs).toBe("number");
		expect(scale.durationMs).toBeGreaterThan(0);
		expect(["linear", "easeIn", "easeOut", "easeInOut"]).toContain(
			scale.easing,
		);
	});

	it("storageKey is a non-empty string", () => {
		expect(typeof splashConfig.storageKey).toBe("string");
		expect(splashConfig.storageKey!.length).toBeGreaterThan(0);
	});

	it('fileLocation is "document" or "cache"', () => {
		expect(["document", "cache"]).toContain(splashConfig.fileLocation);
	});

	it("initialConfig is provided and valid", () => {
		expect(splashConfig.initialConfig).toBeDefined();
		const config = splashConfig.initialConfig as any;
		expect(typeof config.imageName).toBe("string");
		expect(typeof config.alt).toBe("string");
		expect(typeof config.startAt).toBe("string");
		expect(typeof config.endAt).toBe("string");
		expect(typeof config.imageUrl).toBe("string");
		expect(typeof config.configVersion).toBe("string");
	});

	it("logger is a function", () => {
		expect(typeof splashConfig.logger).toBe("function");
	});

	it("storageReadyTimeoutMs is a non-negative number", () => {
		expect(typeof splashConfig.storageReadyTimeoutMs).toBe("number");
		expect(splashConfig.storageReadyTimeoutMs).toBeGreaterThanOrEqual(0);
	});

	it("showOnUpdate is a boolean", () => {
		expect(typeof splashConfig.showOnUpdate).toBe("boolean");
	});
});

describe("SHOWCASE_CONFIGS", () => {
	it("is a non-empty array of valid SplashConfig items", () => {
		expect(Array.isArray(SHOWCASE_CONFIGS)).toBe(true);
		expect(SHOWCASE_CONFIGS.length).toBeGreaterThan(0);
		for (const config of SHOWCASE_CONFIGS) {
			expect(typeof config.imageName).toBe("string");
			expect(typeof config.imageUrl).toBe("string");
			expect(typeof config.configVersion).toBe("string");
		}
	});
});

describe("INITIAL_CONFIG", () => {
	it("is a valid SplashConfig item", () => {
		expect(typeof INITIAL_CONFIG.imageName).toBe("string");
		expect(typeof INITIAL_CONFIG.imageUrl).toBe("string");
		expect(typeof INITIAL_CONFIG.configVersion).toBe("string");
	});
});
