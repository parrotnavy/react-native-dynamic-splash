const { splashConfig, SHOWCASE_CONFIG_DATA } = require("../splashConfig");

describe("splashConfig (InitOptions)", () => {
	it("exports splashConfig object", () => {
		expect(splashConfig).toBeDefined();
		expect(typeof splashConfig).toBe("object");
	});

	it("exports SHOWCASE_CONFIG_DATA array", () => {
		expect(SHOWCASE_CONFIG_DATA).toBeDefined();
		expect(Array.isArray(SHOWCASE_CONFIG_DATA)).toBe(true);
		expect(SHOWCASE_CONFIG_DATA.length).toBeGreaterThan(0);
	});

	describe("1. configProvider", () => {
		it("is a function", () => {
			expect(typeof splashConfig.configProvider).toBe("function");
		});

		it("returns a Promise", () => {
			const result = splashConfig.configProvider();
			expect(result).toBeInstanceOf(Promise);
		});

		it("resolves to an array of SplashConfig items", async () => {
			const configs = await splashConfig.configProvider();
			expect(Array.isArray(configs)).toBe(true);
			expect(configs.length).toBeGreaterThan(0);

			const first = configs[0];
			expect(first).toHaveProperty("imageName");
			expect(first).toHaveProperty("alt");
			expect(first).toHaveProperty("startAt");
			expect(first).toHaveProperty("endAt");
			expect(first).toHaveProperty("imageUrl");
			expect(first).toHaveProperty("configVersion");
		});
	});

	describe("2. minDurationMs", () => {
		it("is a positive number", () => {
			expect(typeof splashConfig.minDurationMs).toBe("number");
			expect(splashConfig.minDurationMs).toBeGreaterThan(0);
		});
	});

	describe("3. maxDurationMs", () => {
		it("is a number greater than minDurationMs", () => {
			expect(typeof splashConfig.maxDurationMs).toBe("number");
			expect(splashConfig.maxDurationMs).toBeGreaterThan(
				splashConfig.minDurationMs,
			);
		});
	});

	describe("4. animation.fade", () => {
		it("has enabled as a boolean", () => {
			expect(splashConfig.animation).toBeDefined();
			expect(splashConfig.animation.fade).toBeDefined();
			expect(typeof splashConfig.animation.fade.enabled).toBe("boolean");
		});

		it("has durationMs as a number", () => {
			expect(typeof splashConfig.animation.fade.durationMs).toBe("number");
			expect(splashConfig.animation.fade.durationMs).toBeGreaterThan(0);
		});
	});

	describe("5. animation.scale", () => {
		it("has startScale and endScale as numbers", () => {
			const { scale } = splashConfig.animation;
			expect(scale).toBeDefined();
			expect(typeof scale.startScale).toBe("number");
			expect(typeof scale.endScale).toBe("number");
		});

		it("has durationMs as a number", () => {
			expect(typeof splashConfig.animation.scale.durationMs).toBe("number");
			expect(splashConfig.animation.scale.durationMs).toBeGreaterThan(0);
		});

		it("has easing as a valid easing value", () => {
			expect(["linear", "easeIn", "easeOut", "easeInOut"]).toContain(
				splashConfig.animation.scale.easing,
			);
		});
	});

	describe("6. storageKey", () => {
		it("is a non-empty string", () => {
			expect(typeof splashConfig.storageKey).toBe("string");
			expect(splashConfig.storageKey.length).toBeGreaterThan(0);
		});
	});

	describe("7. fileLocation", () => {
		it("is 'document' or 'cache'", () => {
			expect(["document", "cache"]).toContain(splashConfig.fileLocation);
		});
	});

	describe("8. initialConfig", () => {
		it("is a valid SplashConfig object", () => {
			const ic = splashConfig.initialConfig;
			expect(ic).toBeDefined();
			expect(typeof ic.imageName).toBe("string");
			expect(typeof ic.alt).toBe("string");
			expect(typeof ic.startAt).toBe("string");
			expect(typeof ic.endAt).toBe("string");
			expect(typeof ic.imageUrl).toBe("string");
			expect(typeof ic.configVersion).toBe("string");
		});

		it("has valid ISO-8601 date strings", () => {
			const ic = splashConfig.initialConfig;
			expect(new Date(ic.startAt).getTime()).not.toBeNaN();
			expect(new Date(ic.endAt).getTime()).not.toBeNaN();
			expect(ic.startAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
			expect(ic.endAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});
	});

	describe("9. logger", () => {
		it("is a function", () => {
			expect(typeof splashConfig.logger).toBe("function");
		});

		it("can be called without errors", () => {
			const spy = jest.spyOn(console, "log").mockImplementation(() => {});
			expect(() => splashConfig.logger("test", { data: 1 })).not.toThrow();
			spy.mockRestore();
		});
	});

	describe("10. storageReadyTimeoutMs", () => {
		it("is a non-negative number", () => {
			expect(typeof splashConfig.storageReadyTimeoutMs).toBe("number");
			expect(splashConfig.storageReadyTimeoutMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe("11. showOnUpdate", () => {
		it("is a boolean", () => {
			expect(typeof splashConfig.showOnUpdate).toBe("boolean");
		});
	});

	describe("all 11 properties are present", () => {
		it("has exactly the 11 InitOptions properties", () => {
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
		});
	});

	describe("SHOWCASE_CONFIG_DATA items", () => {
		it("each item has required SplashConfig properties", () => {
			for (const config of SHOWCASE_CONFIG_DATA) {
				expect(typeof config.imageName).toBe("string");
				expect(typeof config.alt).toBe("string");
				expect(typeof config.startAt).toBe("string");
				expect(typeof config.endAt).toBe("string");
				expect(typeof config.imageUrl).toBe("string");
				expect(typeof config.configVersion).toBe("string");
			}
		});

		it("each item has valid ISO-8601 date strings", () => {
			for (const config of SHOWCASE_CONFIG_DATA) {
				expect(new Date(config.startAt).getTime()).not.toBeNaN();
				expect(new Date(config.endAt).getTime()).not.toBeNaN();
				expect(config.startAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
				expect(config.endAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
			}
		});

		it("each item has weight as a positive number", () => {
			for (const config of SHOWCASE_CONFIG_DATA) {
				expect(typeof config.weight).toBe("number");
				expect(config.weight).toBeGreaterThan(0);
			}
		});

		it("each item has backgroundColor as a string", () => {
			for (const config of SHOWCASE_CONFIG_DATA) {
				expect(typeof config.backgroundColor).toBe("string");
			}
		});
	});
});
