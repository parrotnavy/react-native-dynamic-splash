import { Platform } from "react-native";
import type { InitOptions, SplashConfig } from "../../dist";

// ─── Showcase Config Array ──────────────────────────────────────────────────
// Embedded config demonstrating multiple SplashConfig items with varying
// weights, date ranges, and background colors.
export const SHOWCASE_CONFIGS: SplashConfig[] = [
	{
		imageName: "showcase-welcome-2026",
		alt: "Welcome splash — grand opening promotional banner",
		startAt: "2025-01-01T00:00:00Z",
		endAt: "2099-12-31T23:59:59Z",
		imageUrl: "https://picsum.photos/seed/welcome/1080/1920",
		configVersion: "showcase.v1",
		backgroundColor: "#0B1220",
		weight: 5, // Highest weight → most likely to be selected
	},
	{
		imageName: "showcase-promo-spring",
		alt: "Spring promotion — seasonal campaign with pastel theme",
		startAt: "2025-03-01T00:00:00Z",
		endAt: "2099-06-30T23:59:59Z",
		imageUrl: "https://picsum.photos/seed/spring/1080/1920",
		configVersion: "showcase.v2",
		backgroundColor: "#1A2E1A",
		weight: 3, // Medium weight
	},
	{
		imageName: "showcase-animated-demo",
		alt: "Animated GIF demo — demonstrates GIF/APNG support",
		startAt: "2025-01-01T00:00:00Z",
		endAt: "2099-12-31T23:59:59Z",
		imageUrl:
			"https://www.easygifanimator.net/images/samples/video-to-gif-sample.gif",
		configVersion: "showcase.v3",
		backgroundColor: "#0A0F1F",
		weight: 2, // Lower weight
	},
];

// ─── Initial Config (Pre-seed Fallback) ─────────────────────────────────────
// Processed immediately on mount() before the configProvider fetch completes.
// Guarantees a splash is cached even if the network request fails.
export const INITIAL_CONFIG: SplashConfig = {
	imageName: "fallback-default",
	alt: "Default fallback splash — shown if network fetch fails on first launch",
	startAt: "2025-01-01T00:00:00Z",
	endAt: "2099-12-31T23:59:59Z",
	imageUrl: "https://picsum.photos/seed/fallback/1080/1920",
	configVersion: "fallback.v1",
	backgroundColor: "#101828",
	weight: 1,
};

// ─── InitOptions — All 11 properties demonstrated ───────────────────────────
export const splashConfig: InitOptions = {
	// 1. configProvider (required)
	// Returns the showcase config array from an embedded source.
	// This is called on every mount() to fetch the latest config.
	configProvider: async () => {
		return SHOWCASE_CONFIGS;
	},

	// ── Alternative: fetch from a mock server (uncomment to use) ──
	// configProvider: async () => {
	//   const url = Platform.select({
	//     android: 'http://10.0.2.2:3000/splash.json',
	//     default: 'http://localhost:3000/splash.json',
	//   });
	//   const response = await fetch(url);
	//   return response.json();
	// },

	// 2. minDurationMs
	// Splash stays visible for at least this duration (enforced by native).
	// Prevents flash-of-content if hide() is called too early.
	minDurationMs: 2000,

	// 3. maxDurationMs
	// Native auto-hides the splash after this duration, even if JS hasn't
	// called hide(). Acts as a safety net against frozen splash screens.
	maxDurationMs: 5000,

	// 4. animation.fade
	// Controls the fade-out transition when the splash is hidden.
	// enabled: true → smooth opacity transition; durationMs: 300 → 300ms fade.
	// 5. animation.scale
	// Applies a subtle zoom effect while the splash is displayed.
	// Starts at 1.0x and grows to 1.05x over 2000ms with easeInOut easing.
	animation: {
		fade: { enabled: true, durationMs: 300 },
		scale: {
			startScale: 1.0,
			endScale: 1.05,
			durationMs: 2000,
			easing: "easeInOut",
		},
	},

	// 6. storageKey
	// Custom key for persisting metadata in UserDefaults / SharedPreferences.
	// Defaults to "DYNAMIC_SPLASH_META_V1" if not specified.
	storageKey: "SAMPLE_APP_SPLASH_META",

	// 7. fileLocation
	// Where cached images are stored on the device filesystem.
	// "cache" → OS-managed cache directory (may be evicted).
	// "document" → persists across app restarts (default).
	fileLocation: "cache",

	// 8. initialConfig
	// Pre-seed fallback processed immediately on mount() before the
	// configProvider fetch resolves. Ensures a splash is ready even
	// on the very first launch with no network.
	initialConfig: INITIAL_CONFIG,

	// 9. logger
	// Debug logging hook — receives all internal library log messages.
	// Prefix with [Splash] for easy filtering in console output.
	logger: (msg: string, ...args: any[]) =>
		console.log("[Splash]", msg, ...args),

	// 10. storageReadyTimeoutMs
	// How long to wait for native storage to become ready before
	// skipping the dynamic splash entirely. Prevents blocking if
	// storage is slow or corrupted. Default: 0 (no wait).
	storageReadyTimeoutMs: 3000,

	// 11. showOnUpdate
	// If true, the splash is shown immediately after a successful
	// config update in the current session (not just on next launch).
	// Useful for testing — see the new splash without restarting.
	showOnUpdate: true,
};
