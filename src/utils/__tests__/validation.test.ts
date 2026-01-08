import { isWithinTimeWindow, validateSplashConfig } from "../validation";

describe("validateSplashConfig", () => {
	const validConfig = {
		imageName: "test-image",
		alt: "Test Image",
		startAt: "2020-01-01T00:00:00Z",
		endAt: "2030-12-31T23:59:59Z",
		imageUrl: "https://example.com/image.png",
		configVersion: "v1",
	};

	it("returns true for valid config", () => {
		expect(validateSplashConfig(validConfig)).toBe(true);
	});

	it("returns true for valid config with optional fields", () => {
		const config = {
			...validConfig,
			backgroundColor: "#FF0000",
			weight: 5,
		};
		expect(validateSplashConfig(config)).toBe(true);
	});

	describe("rejects invalid input types", () => {
		it("rejects null", () => {
			expect(validateSplashConfig(null)).toBe(false);
		});

		it("rejects undefined", () => {
			expect(validateSplashConfig(undefined)).toBe(false);
		});

		it("rejects non-object", () => {
			expect(validateSplashConfig("string")).toBe(false);
			expect(validateSplashConfig(123)).toBe(false);
			expect(validateSplashConfig([])).toBe(false);
		});
	});

	describe("imageName validation", () => {
		it("rejects empty imageName", () => {
			const config = { ...validConfig, imageName: "" };
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects non-string imageName", () => {
			const config = { ...validConfig, imageName: 123 };
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects missing imageName", () => {
			const { imageName, ...config } = validConfig;
			expect(validateSplashConfig(config)).toBe(false);
		});
	});

	describe("imageUrl validation", () => {
		it("rejects non-http URL", () => {
			const config = {
				...validConfig,
				imageUrl: "ftp://example.com/image.png",
			};
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects empty imageUrl", () => {
			const config = { ...validConfig, imageUrl: "" };
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("accepts https URL", () => {
			const config = {
				...validConfig,
				imageUrl: "https://example.com/image.png",
			};
			expect(validateSplashConfig(config)).toBe(true);
		});

		it("accepts http URL", () => {
			const config = {
				...validConfig,
				imageUrl: "http://example.com/image.png",
			};
			expect(validateSplashConfig(config)).toBe(true);
		});
	});

	describe("configVersion validation", () => {
		it("rejects empty configVersion", () => {
			const config = { ...validConfig, configVersion: "" };
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects non-string configVersion", () => {
			const config = { ...validConfig, configVersion: 123 };
			expect(validateSplashConfig(config)).toBe(false);
		});
	});

	describe("date validation", () => {
		it("rejects invalid startAt", () => {
			const config = { ...validConfig, startAt: "invalid-date" };
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects invalid endAt", () => {
			const config = { ...validConfig, endAt: "invalid-date" };
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects non-string startAt", () => {
			const config = { ...validConfig, startAt: 123 };
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects startAt >= endAt", () => {
			const config = {
				...validConfig,
				startAt: "2025-01-01T00:00:00Z",
				endAt: "2020-01-01T00:00:00Z",
			};
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects startAt == endAt", () => {
			const config = {
				...validConfig,
				startAt: "2025-01-01T00:00:00Z",
				endAt: "2025-01-01T00:00:00Z",
			};
			expect(validateSplashConfig(config)).toBe(false);
		});
	});

	describe("weight validation", () => {
		it("accepts undefined weight", () => {
			const { weight: _weight, ...config } = { ...validConfig, weight: 1 };
			expect(validateSplashConfig(config)).toBe(true);
		});

		it("accepts zero weight", () => {
			const config = { ...validConfig, weight: 0 };
			expect(validateSplashConfig(config)).toBe(true);
		});

		it("accepts positive weight", () => {
			const config = { ...validConfig, weight: 10 };
			expect(validateSplashConfig(config)).toBe(true);
		});

		it("rejects negative weight", () => {
			const config = { ...validConfig, weight: -1 };
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects NaN weight", () => {
			const config = { ...validConfig, weight: NaN };
			expect(validateSplashConfig(config)).toBe(false);
		});

		it("rejects non-number weight", () => {
			const config = { ...validConfig, weight: "5" };
			expect(validateSplashConfig(config)).toBe(false);
		});
	});

	describe("backgroundColor validation", () => {
		it("accepts undefined backgroundColor", () => {
			expect(validateSplashConfig(validConfig)).toBe(true);
		});

		it("accepts string backgroundColor", () => {
			const config = { ...validConfig, backgroundColor: "#FF0000" };
			expect(validateSplashConfig(config)).toBe(true);
		});

		it("rejects non-string backgroundColor", () => {
			const config = { ...validConfig, backgroundColor: 123 };
			expect(validateSplashConfig(config)).toBe(false);
		});
	});
});

describe("isWithinTimeWindow", () => {
	const now = Date.now();
	const pastDate = new Date(now - 1000 * 60 * 60 * 24).toISOString(); // 1 day ago
	const futureDate = new Date(now + 1000 * 60 * 60 * 24).toISOString(); // 1 day later
	const farPast = new Date(now - 1000 * 60 * 60 * 24 * 365).toISOString(); // 1 year ago
	const farFuture = new Date(now + 1000 * 60 * 60 * 24 * 365).toISOString(); // 1 year later

	it("returns true when current time is within window", () => {
		expect(isWithinTimeWindow(pastDate, futureDate)).toBe(true);
	});

	it("returns false when current time is before start", () => {
		expect(isWithinTimeWindow(futureDate, farFuture)).toBe(false);
	});

	it("returns false when current time is after end", () => {
		expect(isWithinTimeWindow(farPast, pastDate)).toBe(false);
	});

	it("returns true at exact start time", () => {
		const exactNow = new Date(now).toISOString();
		jest.useFakeTimers().setSystemTime(now);
		expect(isWithinTimeWindow(exactNow, futureDate)).toBe(true);
		jest.useRealTimers();
	});

	it("returns true at exact end time", () => {
		const exactNow = new Date(now).toISOString();
		jest.useFakeTimers().setSystemTime(now);
		expect(isWithinTimeWindow(pastDate, exactNow)).toBe(true);
		jest.useRealTimers();
	});
});
