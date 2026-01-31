export const mockManager = {
	mount: jest.fn().mockResolvedValue(undefined),
	hide: jest.fn().mockResolvedValue(undefined),
	isVisible: jest.fn().mockResolvedValue(false),
};

export const createDynamicSplash = jest.fn(() => mockManager);

export const DynamicSplash = {
	hide: jest.fn().mockResolvedValue(undefined),
	isVisible: jest.fn().mockResolvedValue(false),
};
