// We need to reset the module state between tests
let createDynamicSplash: typeof import("../index").createDynamicSplash;
let DynamicSplash: typeof import("../index").DynamicSplash;
let mockNativeModules: any;

describe("index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Get fresh NativeModules mock
    mockNativeModules = require("react-native").NativeModules;

    // Re-import to get fresh singleton state
    const indexModule = require("../index");
    createDynamicSplash = indexModule.createDynamicSplash;
    DynamicSplash = indexModule.DynamicSplash;
  });

  describe("createDynamicSplash", () => {
    it("creates a manager instance", () => {
      const options = {
        configProvider: jest.fn().mockResolvedValue({}),
      };

      const manager = createDynamicSplash(options);

      expect(manager).toBeDefined();
      expect(typeof manager.mount).toBe("function");
      expect(typeof manager.hide).toBe("function");
      expect(typeof manager.isVisible).toBe("function");
    });

    it("returns the same instance on subsequent calls (singleton)", () => {
      const options1 = {
        configProvider: jest.fn().mockResolvedValue({}),
      };
      const options2 = {
        configProvider: jest.fn().mockResolvedValue({ different: true }),
      };

      const manager1 = createDynamicSplash(options1);
      const manager2 = createDynamicSplash(options2);

      expect(manager1).toBe(manager2);
    });
  });

  describe("DynamicSplash.hide()", () => {
    it("warns when manager is not initialized", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      await DynamicSplash.hide();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Manager not initialized")
      );

      consoleWarnSpy.mockRestore();
    });

    it("calls manager.hide() and native hide() when manager exists", async () => {
      const options = {
        configProvider: jest.fn().mockResolvedValue({}),
      };
      createDynamicSplash(options);

      await DynamicSplash.hide();

      expect(mockNativeModules.DynamicSplashNative.hide).toHaveBeenCalled();
    });

    it("always calls native hide() even without manager", async () => {
      jest.spyOn(console, "warn").mockImplementation();

      await DynamicSplash.hide();

      expect(mockNativeModules.DynamicSplashNative.hide).toHaveBeenCalled();
    });
  });

  describe("DynamicSplash.isVisible()", () => {
    it("calls native isShowing() when manager is not initialized", async () => {
      (mockNativeModules.DynamicSplashNative.isShowing as jest.Mock).mockResolvedValue(
        true
      );

      const result = await DynamicSplash.isVisible();

      expect(result).toBe(true);
      expect(mockNativeModules.DynamicSplashNative.isShowing).toHaveBeenCalled();
    });

    it("returns false when native call fails without manager", async () => {
      (mockNativeModules.DynamicSplashNative.isShowing as jest.Mock).mockRejectedValue(
        new Error("Native error")
      );

      const result = await DynamicSplash.isVisible();

      expect(result).toBe(false);
    });

    it("uses manager.isVisible() when manager exists", async () => {
      const options = {
        configProvider: jest.fn().mockResolvedValue({}),
      };
      createDynamicSplash(options);

      (mockNativeModules.DynamicSplashNative.isShowing as jest.Mock).mockResolvedValue(
        true
      );

      const result = await DynamicSplash.isVisible();

      expect(result).toBe(true);
    });
  });
});
