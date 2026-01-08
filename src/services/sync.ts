import { NativeModules } from "react-native";
import type { InitOptions, SplashConfig, StoredMeta } from "../types";
import { isWithinTimeWindow, validateSplashConfig } from "../utils/validation";
import type { SplashFileSystem } from "./fileSystem";
import type { SplashStorage } from "./storage";

export async function performBackgroundUpdate(
	options: InitOptions,
	storage: SplashStorage,
	fs: SplashFileSystem,
): Promise<void> {
	const { logger, configProvider } = options;

	try {
		logger?.("[DynamicSplash] Starting background update");

		// 1. Use injected config provider
		const json = await configProvider();
		logger?.("[DynamicSplash] JSON fetched", json);

		// 2. Validate Schema
		if (Array.isArray(json)) {
			// Validate each item if array
			const valid = json.every((item) => validateSplashConfig(item));
			if (!valid) throw new Error("Invalid JSON schema in array");
		} else {
			if (!validateSplashConfig(json)) {
				throw new Error("Invalid JSON schema");
			}
		}

		// 3. Process Config (Download/Cache)
		// Logic handles both single object and array
		await processSplashConfig(
			json as SplashConfig | SplashConfig[],
			options,
			storage,
			fs,
		);
	} catch (error: any) {
		logger?.("[DynamicSplash] Background update failed", error);

		// Failures at any step result in ERROR and no display on next launch.
		const errorMeta: StoredMeta = {
			status: "ERROR",
			lastError: error.message,
			updatedAt: Date.now(),
		};
		storage.setMeta(errorMeta);
	}
}

export async function processSplashConfig(
	inputConfig: SplashConfig | SplashConfig[],
	options: InitOptions,
	storage: SplashStorage,
	fs: SplashFileSystem,
): Promise<void> {
	const { logger } = options;

	// Resolve Input: If array, pick one based on weights
	let config: SplashConfig;

	if (Array.isArray(inputConfig)) {
		if (inputConfig.length === 0) {
			throw new Error("Config array is empty");
		}
		const eligible = inputConfig.filter((item) => {
			return (
				item?.startAt &&
				item.endAt &&
				isWithinTimeWindow(item.startAt, item.endAt)
			);
		});
		if (eligible.length === 0) {
			throw new Error("No config within time window");
		}
		config = selectConfigByWeight(eligible);
		logger?.(
			"[DynamicSplash] Selected config from array",
			config.imageName,
			"weight:",
			config.weight,
		);
	} else {
		if (!isWithinTimeWindow(inputConfig.startAt, inputConfig.endAt)) {
			throw new Error("Config is outside time window");
		}
		config = inputConfig;
	}

	// Check if we already have this image ready?
	const currentMeta = storage.getMeta();
	let destPath: string;

	if (
		currentMeta.status === "READY" &&
		currentMeta.imageName === config.imageName &&
		currentMeta.configVersion === config.configVersion &&
		currentMeta.imageUrl === config.imageUrl &&
		currentMeta.localPath &&
		(await fs.exists(currentMeta.localPath))
	) {
		logger?.(
			"[DynamicSplash] Image already exists and valid, skipping download",
			config.imageName,
		);
		destPath = currentMeta.localPath;
	} else {
		// Download Image
		logger?.("[DynamicSplash] Downloading image", config.imageUrl);
		const tempPath = await fs.downloadImage(config.imageUrl, config.imageName);

		// Commit File
		destPath = await fs.commitImage(tempPath, config.imageName);
		logger?.("[DynamicSplash] Image saved to", destPath);
	}

	// Update Metadata
	const now = Date.now();
	const fadeOptions = normalizeFadeOptions(options);
	const scale = normalizeScaleOptions("scale", options.animation?.scale);
	const newMeta: StoredMeta = {
		status: "READY",
		imageName: config.imageName,
		startAt: config.startAt,
		endAt: config.endAt,
		imageUrl: config.imageUrl,
		alt: config.alt,
		localPath: destPath,
		updatedAt: now,
		fetchedAt: now,
		backgroundColor: config.backgroundColor,
		configVersion: config.configVersion,
		enableFade: fadeOptions.enabled,
		fadeDurationMs: fadeOptions.durationMs,
		scaleStart: scale?.startScale,
		scaleEnd: scale?.endScale,
		scaleDurationMs: scale?.durationMs,
		scaleEasing: scale?.easing,
		minDurationMs: options.minDurationMs,
		maxDurationMs: options.maxDurationMs,
	};

	storage.setMeta(newMeta);
	logger?.("[DynamicSplash] Config processed and saved. READY for next launch");
	if (options.showOnUpdate) {
		try {
			NativeModules.DynamicSplashNative?.show?.();
		} catch (e) {
			console.warn("[DynamicSplash] Failed to call native show()", e);
		}
	}
}

function selectConfigByWeight(configs: SplashConfig[]): SplashConfig {
	// Filter out bad inputs just in case
	const candidates = configs.filter((c) => c?.imageUrl);
	if (candidates.length === 0) throw new Error("No valid configs candidates");

	// 1. Calculate total weight
	// Default weight is 1 if undefined.
	const totalWeight = candidates.reduce((sum, item) => {
		return sum + (item.weight ?? 1);
	}, 0);

	// 2. Pick random number
	let random = Math.random() * totalWeight;

	// 3. Find winner
	for (const item of candidates) {
		const w = item.weight ?? 1;
		if (random < w) {
			return item;
		}
		random -= w;
	}

	// Fallback (rounding errors)
	return candidates[candidates.length - 1];
}

function normalizeFadeOptions(options: InitOptions): {
	enabled?: boolean;
	durationMs?: number;
} {
	if (options.animation?.fade) {
		return {
			enabled: options.animation.fade.enabled,
			durationMs: options.animation.fade.durationMs,
		};
	}
	return {
		enabled: options.animation?.fade?.enabled,
		durationMs: options.animation?.fade?.durationMs,
	};
}

function normalizeScaleOptions(
	label: "scale",
	scale?: {
		startScale?: number;
		endScale?: number;
		durationMs?: number;
		easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
	},
):
	| {
			startScale: number;
			endScale: number;
			durationMs: number;
			easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
	  }
	| undefined {
	if (!scale) return undefined;
	const { startScale, endScale, durationMs, easing } = scale;
	const hasStart = typeof startScale === "number" && !Number.isNaN(startScale);
	const hasEnd = typeof endScale === "number" && !Number.isNaN(endScale);
	const hasDuration =
		typeof durationMs === "number" && !Number.isNaN(durationMs);

	if (hasStart !== hasEnd) {
		throw new Error(
			`Invalid ${label}: startScale and endScale must be provided together`,
		);
	}
	if (hasStart && hasEnd && !hasDuration) {
		throw new Error(`Invalid ${label}: durationMs must be provided`);
	}
	if (!hasStart || !hasEnd || !hasDuration) return undefined;
	if (durationMs <= 0) {
		throw new Error(`Invalid ${label}: durationMs must be > 0`);
	}
	return {
		startScale,
		endScale,
		durationMs,
		easing,
	};
}
