const SHOWCASE_CONFIGS = [
	{
		imageName: "mobility-welcome-2026q1",
		alt: "Mobility app splash: Welcome offer - 20% off your first ride.",
		startAt: "2026-01-01T00:00:00Z",
		endAt: "2026-03-31T23:59:59Z",
		imageUrl: "https://picsum.photos/seed/taxi/1080/1920",
		configVersion: "2026.01.0",
		backgroundColor: "#0B1220",
		weight: 2,
	},
	{
		imageName: "mobility-commute-pass-2026q1",
		alt: "Mobility app splash: Commute Pass - save on weekday rides.",
		startAt: "2026-01-10T00:00:00Z",
		endAt: "2099-02-29T23:59:59Z",
		imageUrl: "https://picsum.photos/seed/hello/1080/1920",
		configVersion: "2026.01.0",
		backgroundColor: "#101828",
		weight: 3,
	},
	{
		imageName: "mobility-safety-update-2026q1",
		alt: "Mobility app splash: Safety update - improved driver verification.",
		startAt: "2026-01-01T00:00:00Z",
		endAt: "2080-04-30T23:59:59Z",
		imageUrl:
			"https://www.easygifanimator.net/images/samples/video-to-gif-sample.gif",
		configVersion: "2026.01.0",
		backgroundColor: "#0A0F1F",
		weight: 1,
	},
];

const INITIAL_CONFIG = {
	imageName: "expo-default-splash",
	alt: "Default splash for Expo sample app",
	startAt: "2025-01-01T00:00:00Z",
	endAt: "2099-12-31T23:59:59Z",
	imageUrl: "https://picsum.photos/seed/expo-splash/1080/1920",
	configVersion: "expo-default-v1",
	backgroundColor: "#0B1220",
	weight: 1,
};

/** @type {import('@parrotnavy/react-native-dynamic-splash').InitOptions} */
export const splashConfig = {
	// 1. configProvider
	configProvider: async () => SHOWCASE_CONFIGS,
	// 2. minDurationMs
	minDurationMs: 2000,
	// 3. maxDurationMs
	maxDurationMs: 5000,
	// 4. animation.fade + 5. animation.scale
	animation: {
		fade: { enabled: true, durationMs: 200 },
		scale: {
			startScale: 1.0,
			endScale: 1.02,
			durationMs: 2000,
			easing: "linear",
		},
	},
	// 6. storageKey
	storageKey: "DYNAMIC_SPLASH_META_V1",
	// 7. fileLocation
	fileLocation: "document",
	// 8. initialConfig
	initialConfig: INITIAL_CONFIG,
	// 9. logger
	logger: (msg, ...args) => console.log("[ExpoSample]", msg, ...args),
	// 10. storageReadyTimeoutMs
	storageReadyTimeoutMs: 3000,
	// 11. showOnUpdate
	showOnUpdate: false,
};

export const SHOWCASE_CONFIG_DATA = SHOWCASE_CONFIGS;
