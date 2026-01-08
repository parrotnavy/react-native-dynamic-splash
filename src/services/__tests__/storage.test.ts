import { NativeModules } from "react-native";
import { SplashStorage } from "../storage";
import type { InitOptions, StoredMeta } from "../../types";

describe("SplashStorage", () => {
  const mockConfigProvider = jest.fn().mockResolvedValue({});

  const createOptions = (overrides: Partial<InitOptions> = {}): InitOptions => ({
    configProvider: mockConfigProvider,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("uses default storage key when not specified", () => {
      const options = createOptions();
      new SplashStorage(options);

      expect(NativeModules.DynamicSplashNative.setStorageKey).toHaveBeenCalledWith(
        "DYNAMIC_SPLASH_META_V1"
      );
    });

    it("uses custom storage key when specified", () => {
      const options = createOptions({ storageKey: "CUSTOM_KEY" });
      new SplashStorage(options);

      expect(NativeModules.DynamicSplashNative.setStorageKey).toHaveBeenCalledWith(
        "CUSTOM_KEY"
      );
    });

    it("uses getStringSync when available", () => {
      const storedMeta: StoredMeta = {
        status: "READY",
        imageName: "test",
      };
      (NativeModules.DynamicSplashStorage.getStringSync as jest.Mock).mockReturnValue(
        JSON.stringify(storedMeta)
      );

      const options = createOptions();
      const storage = new SplashStorage(options);

      expect(NativeModules.DynamicSplashStorage.getStringSync).toHaveBeenCalled();
      expect(storage.getMeta()).toEqual(storedMeta);
    });

    it("returns EMPTY when getStringSync returns null", () => {
      (NativeModules.DynamicSplashStorage.getStringSync as jest.Mock).mockReturnValue(
        null
      );

      const options = createOptions();
      const storage = new SplashStorage(options);

      expect(storage.getMeta()).toEqual({ status: "EMPTY" });
    });

    it("returns EMPTY when JSON parsing fails", () => {
      (NativeModules.DynamicSplashStorage.getStringSync as jest.Mock).mockReturnValue(
        "invalid-json"
      );

      const options = createOptions();
      const storage = new SplashStorage(options);

      expect(storage.getMeta()).toEqual({ status: "EMPTY" });
    });
  });

  describe("getMeta", () => {
    it("returns cached metadata", () => {
      const storedMeta: StoredMeta = {
        status: "READY",
        imageName: "test-image",
        localPath: "/path/to/image.png",
      };
      (NativeModules.DynamicSplashStorage.getStringSync as jest.Mock).mockReturnValue(
        JSON.stringify(storedMeta)
      );

      const storage = new SplashStorage(createOptions());

      expect(storage.getMeta()).toEqual(storedMeta);
    });
  });

  describe("setMeta", () => {
    it("updates cache and persists to native storage", () => {
      (NativeModules.DynamicSplashStorage.getStringSync as jest.Mock).mockReturnValue(
        null
      );

      const storage = new SplashStorage(createOptions());
      const newMeta: StoredMeta = {
        status: "READY",
        imageName: "new-image",
        localPath: "/path/to/new-image.png",
      };

      storage.setMeta(newMeta);

      expect(storage.getMeta()).toEqual(newMeta);
      expect(NativeModules.DynamicSplashStorage.setString).toHaveBeenCalledWith(
        "DYNAMIC_SPLASH_META_V1",
        JSON.stringify(newMeta)
      );
    });

    it("uses custom storage key for persistence", () => {
      (NativeModules.DynamicSplashStorage.getStringSync as jest.Mock).mockReturnValue(
        null
      );

      const storage = new SplashStorage(createOptions({ storageKey: "CUSTOM_KEY" }));
      const newMeta: StoredMeta = { status: "READY" };

      storage.setMeta(newMeta);

      expect(NativeModules.DynamicSplashStorage.setString).toHaveBeenCalledWith(
        "CUSTOM_KEY",
        JSON.stringify(newMeta)
      );
    });
  });

  describe("clear", () => {
    it("resets to EMPTY and removes from native storage", () => {
      const storedMeta: StoredMeta = { status: "READY", imageName: "test" };
      (NativeModules.DynamicSplashStorage.getStringSync as jest.Mock).mockReturnValue(
        JSON.stringify(storedMeta)
      );

      const storage = new SplashStorage(createOptions());
      storage.clear();

      expect(storage.getMeta()).toEqual({ status: "EMPTY" });
      expect(NativeModules.DynamicSplashStorage.remove).toHaveBeenCalledWith(
        "DYNAMIC_SPLASH_META_V1"
      );
    });
  });

  describe("ready", () => {
    it("resolves immediately when already ready (sync)", async () => {
      (NativeModules.DynamicSplashStorage.getStringSync as jest.Mock).mockReturnValue(
        null
      );

      const storage = new SplashStorage(createOptions());
      const result = await storage.ready();

      expect(result).toBe(true);
    });

    it("resolves with false on timeout", async () => {
      // Remove getStringSync to force async path
      const originalGetStringSync = NativeModules.DynamicSplashStorage.getStringSync;
      delete (NativeModules.DynamicSplashStorage as any).getStringSync;

      // Make getString never resolve
      (NativeModules.DynamicSplashStorage.getString as jest.Mock).mockReturnValue(
        new Promise(() => {})
      );

      const storage = new SplashStorage(createOptions());
      const result = await storage.ready({ timeoutMs: 10 });

      expect(result).toBe(false);

      // Restore
      (NativeModules.DynamicSplashStorage as any).getStringSync = originalGetStringSync;
    });
  });

  describe("without native module", () => {
    it("warns and returns EMPTY when native storage is unavailable", () => {
      const originalStorage = NativeModules.DynamicSplashStorage;
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      delete (NativeModules as any).DynamicSplashStorage;

      const storage = new SplashStorage(createOptions());

      expect(storage.getMeta()).toEqual({ status: "EMPTY" });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Native storage module not available")
      );

      (NativeModules as any).DynamicSplashStorage = originalStorage;
      consoleWarnSpy.mockRestore();
    });
  });
});
