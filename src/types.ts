export interface SplashConfig {
	/** Image identifier used as the cache key and file name. */
	imageName: string;
	/** Accessibility description for the image. */
	alt: string;
	/** Start time (ISO-8601). Splash is eligible only if now >= startAt. */
	startAt: string;
	/** End time (ISO-8601). Splash is eligible only if now <= endAt. */
	endAt: string;
	/** Download URL (http/https). Used to fetch the remote asset. */
	imageUrl: string;
	/** Per-image config version. If changed, cached image is invalidated. */
	configVersion: string;
	/** Background color shown behind the image if it does not fill the screen (default: none). */
	backgroundColor?: string;
	/** Relative weight (>= 0). Higher values increase selection probability (default: 1). */
	weight?: number;
}

export type SplashStatus = "EMPTY" | "READY" | "ERROR";

export interface StoredMeta {
	/** Stored metadata status that gates display eligibility. */
	status: SplashStatus;
	/** Image identifier of the last successful config. */
	imageName?: string;
	/** Stored start time (ISO-8601). */
	startAt?: string;
	/** Stored end time (ISO-8601). */
	endAt?: string;
	/** Stored download URL for cache comparison (default: none). */
	imageUrl?: string;
	/** Stored accessibility description (default: none). */
	alt?: string;
	/** Absolute local file path of the cached image. */
	localPath?: string;
	/** Last update time (epoch ms). */
	updatedAt?: number;
	/** Fetch time for the last successful config (epoch ms, default: none). */
	fetchedAt?: number;
	/** Error message recorded on failure. */
	lastError?: string;
	/** Stored background color (default: none). */
	backgroundColor?: string;
	/** Stored config version used for cache comparison. */
	configVersion?: string;
	/** Enable fade out animation when hiding (default: true). */
	enableFade?: boolean;
	/** Fade out animation duration in milliseconds (default: 200). */
	fadeDurationMs?: number;
	/** Scale animation start scale (default: none). */
	scaleStart?: number;
	/** Scale animation end scale (default: none). */
	scaleEnd?: number;
	/** Scale animation duration in milliseconds (default: none). */
	scaleDurationMs?: number;
	/** Scale animation easing (default: easeInOut). */
	scaleEasing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
	/** Minimum time to keep splash visible in milliseconds (from InitOptions). */
	minDurationMs?: number;
	/** Maximum time to keep splash visible in milliseconds (from InitOptions). */
	maxDurationMs?: number;
}

export interface DynamicSplashManager {
	/** Triggers background update to fetch and cache splash images. */
	mount(): Promise<void>;
	/** Requests native module to hide the splash overlay. */
	hide(): Promise<void>;
	/** Returns current visibility state from native module. */
	isVisible(): Promise<boolean>;
}

export interface InitOptions {
	/** Provides splash config objects from any source (required). */
	configProvider: () => Promise<SplashConfig | SplashConfig[]>;
	/** Minimum time to keep splash visible (ms). Default: no minimum. */
	minDurationMs?: number;
	/** Maximum time to keep splash visible (ms). Default: no maximum. */
	maxDurationMs?: number;
	/**
	 * Animation settings for show/hide.
	 * - fade: hide-only fade-out.
	 * - scale: applied on show.
	 */
	animation?: {
		fade?: {
			/** Enable fade out animation when hiding (default: true). */
			enabled?: boolean;
			/** Fade out animation duration in milliseconds (default: 200). */
			durationMs?: number;
		};
		scale?: {
			/** Start scale factor (e.g., 1.0). */
			startScale: number;
			/** End scale factor (e.g., 1.2). */
			endScale: number;
			/** Animation duration in milliseconds. */
			durationMs: number;
			/** Animation easing (default: easeInOut). */
			easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
		};
	};
	/** @deprecated Use animation.fade.enabled instead. */
	enableFade?: boolean;
	/** @deprecated Use animation.fade.durationMs instead. */
	fadeDurationMs?: number;
	/** Storage key for persisted metadata (default: "DYNAMIC_SPLASH_META_V1"). */
	storageKey?: string;
	/**
	 * Storage location for cached images.
	 * - "document": Persists across app restarts; better for long-lived assets.
	 * - "cache": Uses OS-managed cache; may be evicted by the system.
	 * Default: "document".
	 */
	fileLocation?: "document" | "cache";
	/** Optional config processed immediately on mount (pre-seeding, default: none). */
	initialConfig?: SplashConfig | SplashConfig[];
	/** Optional logging hook (default: none). */
	logger?: (msg: string, ...args: any[]) => void;
	/** Wait timeout for storage readiness before skipping dynamic splash (ms, default: 0). */
	storageReadyTimeoutMs?: number;
	/** If true, show the splash immediately after a successful update in the same session (default: false). */
	showOnUpdate?: boolean;
}
