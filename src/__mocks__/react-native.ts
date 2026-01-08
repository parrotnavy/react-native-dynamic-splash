export const NativeModules = {
	DynamicSplashStorage: {
		getStringSync: jest.fn(),
		getString: jest.fn(),
		setString: jest.fn(),
		remove: jest.fn(),
	},
	DynamicSplashNative: {
		show: jest.fn(),
		hide: jest.fn(),
		isShowing: jest.fn(),
		setStorageKey: jest.fn(),
		getStorageKey: jest.fn(),
		getLastLoadedMeta: jest.fn(),
	},
};
