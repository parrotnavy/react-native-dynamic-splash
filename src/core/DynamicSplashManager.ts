import { NativeModules } from "react-native";
import { SplashFileSystem } from "../services/fileSystem";
import { SplashStorage } from "../services/storage";
import { performBackgroundUpdate, processSplashConfig } from "../services/sync";
import type { DynamicSplashManager, InitOptions } from "../types";

export class DynamicSplashManagerImpl implements DynamicSplashManager {
	private options: InitOptions;
	private storage: SplashStorage;
	private fs: SplashFileSystem;

	constructor(options: InitOptions) {
		this.options = options;
		this.storage = new SplashStorage(options);
		this.fs = new SplashFileSystem(options.fileLocation);
	}

	async mount(): Promise<void> {
		this.options.logger?.("[DynamicSplash] Mount called");

		// Trigger background update to fetch and cache splash images
		if (this.options.initialConfig) {
			this.options.logger?.("[DynamicSplash] Processing initial configuration");
			processSplashConfig(
				this.options.initialConfig,
				this.options,
				this.storage,
				this.fs,
			).catch((e) => {
				console.error(
					"[DynamicSplash] Unhandled error in processing initial config",
					e,
				);
			});
		} else {
			performBackgroundUpdate(this.options, this.storage, this.fs).catch(
				(e) => {
					console.error(
						"[DynamicSplash] Unhandled error in background update",
						e,
					);
				},
			);
		}
	}

	async hide(): Promise<void> {
		this.options.logger?.("[DynamicSplash] Hide requested");
		NativeModules.DynamicSplashNative?.hide?.();
	}

	async isVisible(): Promise<boolean> {
		try {
			const nativeShowing =
				await NativeModules.DynamicSplashNative?.isShowing?.();
			return nativeShowing === true;
		} catch {
			return false;
		}
	}
}
