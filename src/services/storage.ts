import { NativeModules } from "react-native";
import type { InitOptions, StoredMeta } from "../types";

const DEFAULT_KEY = "DYNAMIC_SPLASH_META_V1";
const EMPTY_META: StoredMeta = { status: "EMPTY" };

type NativeStorageModule = {
	getStringSync?: (key: string) => string | null;
	getString?: (key: string) => Promise<string | null>;
	setString: (key: string, value: string) => void;
	remove: (key: string) => void;
};

export class SplashStorage {
	private nativeStorage?: NativeStorageModule;
	private key: string;
	private cache: StoredMeta = EMPTY_META;
	private hasLocalOverride = false;
	private readyResolved = false;
	private readyPromise: Promise<boolean>;
	private resolveReady!: (value: boolean) => void;

	constructor(options: InitOptions) {
		this.key = options.storageKey || DEFAULT_KEY;
		this.nativeStorage = NativeModules.DynamicSplashStorage as
			| NativeStorageModule
			| undefined;
		NativeModules.DynamicSplashNative?.setStorageKey?.(this.key);
		this.readyPromise = new Promise<boolean>((resolve) => {
			this.resolveReady = resolve;
		});
		if (this.nativeStorage?.getStringSync) {
			this.primeCacheSync();
		} else if (this.nativeStorage?.getString) {
			void this.primeCacheAsync();
		} else {
			this.cache = EMPTY_META;
			this.resolveReadyOnce();
			console.warn(
				"[DynamicSplash] Native storage module not available. Metadata will not persist.",
			);
		}
	}

	private primeCacheSync() {
		try {
			const json = this.nativeStorage?.getStringSync?.(this.key);
			if (this.hasLocalOverride) return;
			if (!json) {
				this.cache = EMPTY_META;
				return;
			}
			this.cache = JSON.parse(json) as StoredMeta;
		} catch {
			if (!this.hasLocalOverride) {
				this.cache = EMPTY_META;
			}
		} finally {
			this.resolveReadyOnce();
		}
	}

	private async primeCacheAsync() {
		try {
			const json = await this.nativeStorage?.getString?.(this.key);
			if (this.hasLocalOverride) return;
			if (!json) {
				this.cache = EMPTY_META;
				return;
			}
			this.cache = JSON.parse(json) as StoredMeta;
		} catch {
			if (!this.hasLocalOverride) {
				this.cache = EMPTY_META;
			}
		} finally {
			this.resolveReadyOnce();
		}
	}

	private resolveReadyOnce() {
		if (!this.readyResolved) {
			this.readyResolved = true;
			this.resolveReady(true);
		}
	}

	async ready(options?: { timeoutMs?: number }): Promise<boolean> {
		if (this.readyResolved) return true;
		const timeoutMs = options?.timeoutMs;
		if (!timeoutMs) return this.readyPromise;

		return Promise.race([
			this.readyPromise,
			new Promise<boolean>((resolve) => {
				setTimeout(() => resolve(false), timeoutMs);
			}),
		]);
	}

	getMeta(): StoredMeta {
		return this.cache;
	}

	setMeta(meta: StoredMeta) {
		this.setCache(meta);
		this.persistMeta(meta);
	}

	clear() {
		this.setCache(EMPTY_META);
		this.persistClear();
	}

	private setCache(meta: StoredMeta) {
		this.hasLocalOverride = true;
		this.cache = meta;
	}

	private persistMeta(meta: StoredMeta) {
		if (this.nativeStorage?.setString) {
			try {
				this.nativeStorage.setString(this.key, JSON.stringify(meta));
			} catch (e) {
				console.warn("[DynamicSplash] Failed to save metadata", e);
			}
			return;
		}
		console.warn(
			"[DynamicSplash] Native storage module not available. Metadata not saved.",
		);
	}

	private persistClear() {
		if (this.nativeStorage?.remove) {
			try {
				this.nativeStorage.remove(this.key);
			} catch (e) {
				console.warn("[DynamicSplash] Failed to clear metadata", e);
			}
			return;
		}
		console.warn(
			"[DynamicSplash] Native storage module not available. Metadata not cleared.",
		);
	}
}
