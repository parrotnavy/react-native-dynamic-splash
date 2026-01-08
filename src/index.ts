import { NativeModules } from "react-native";
import { DynamicSplashManagerImpl } from "./core/DynamicSplashManager";
import type { InitOptions } from "./types";

export { DynamicSplashManagerImpl } from "./core/DynamicSplashManager";
export * from "./types";

let _manager: DynamicSplashManagerImpl | null = null;

export function createDynamicSplash(
	options: InitOptions,
): DynamicSplashManagerImpl {
	if (!_manager) {
		_manager = new DynamicSplashManagerImpl(options);
	}
	return _manager;
}

export const DynamicSplash = {
	hide: async (): Promise<void> => {
		if (_manager) {
			await _manager.hide();
		} else {
			console.warn(
				"[DynamicSplash] Manager not initialized. Make sure to call createDynamicSplash first.",
			);
		}
		try {
			NativeModules.DynamicSplashNative?.hide?.();
		} catch (e) {
			console.warn("[DynamicSplash] Failed to call native hide()", e);
		}
	},
	isVisible: async (): Promise<boolean> => {
		if (_manager) {
			return await _manager.isVisible();
		} else {
			try {
				const nativeShowing =
					await NativeModules.DynamicSplashNative?.isShowing?.();
				return nativeShowing === true;
			} catch {
				return false;
			}
		}
	},
};
