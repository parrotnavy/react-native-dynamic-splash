import { NativeModules } from "react-native";

NativeModules.DynamicSplashNative = {
	show: jest.fn(),
	hide: jest.fn(),
	isShowing: jest.fn().mockResolvedValue(false),
	setStorageKey: jest.fn(),
	getStorageKey: jest.fn().mockResolvedValue("DYNAMIC_SPLASH_META_V1"),
	getLastLoadedMeta: jest.fn().mockResolvedValue(null),
};

NativeModules.DynamicSplashStorage = {
	getStringSync: jest.fn(),
	getString: jest.fn(),
	setString: jest.fn(),
	remove: jest.fn(),
};

(globalThis as any).fetch = jest.fn().mockResolvedValue({
	ok: true,
	json: jest.fn().mockResolvedValue([]),
});
