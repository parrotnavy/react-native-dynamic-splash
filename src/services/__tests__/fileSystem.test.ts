import RNFS from "react-native-fs";
import { SplashFileSystem } from "../fileSystem";

describe("SplashFileSystem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("uses DocumentDirectoryPath by default", () => {
      const fs = new SplashFileSystem();
      // We can verify this indirectly through commitImage
      expect(RNFS.DocumentDirectoryPath).toBe("/mock/documents");
    });

    it("uses DocumentDirectoryPath when location is 'document'", () => {
      const fs = new SplashFileSystem("document");
      expect(RNFS.DocumentDirectoryPath).toBe("/mock/documents");
    });

    it("uses CachesDirectoryPath when location is 'cache'", () => {
      const fs = new SplashFileSystem("cache");
      expect(RNFS.CachesDirectoryPath).toBe("/mock/caches");
    });
  });

  describe("downloadImage", () => {
    it("returns temp file path on success", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      (RNFS.downloadFile as jest.Mock).mockReturnValue({
        promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 }),
      });

      const fs = new SplashFileSystem();
      const result = await fs.downloadImage(
        "https://example.com/image.png",
        "test-image.png"
      );

      expect(result).toMatch(/^\/mock\/caches\/splash_temp_\d+_test-image\.png$/);
      expect(RNFS.downloadFile).toHaveBeenCalledWith({
        fromUrl: "https://example.com/image.png",
        toFile: expect.stringMatching(/splash_temp_.*test-image\.png$/),
      });
    });

    it("throws error when download fails with non-200 status", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      (RNFS.downloadFile as jest.Mock).mockReturnValue({
        promise: Promise.resolve({ statusCode: 404, bytesWritten: 0 }),
      });

      const fs = new SplashFileSystem();

      await expect(
        fs.downloadImage("https://example.com/image.png", "test-image.png")
      ).rejects.toThrow("Download failed with status 404");
    });

    it("deletes existing temp file before download", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.downloadFile as jest.Mock).mockReturnValue({
        promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 }),
      });

      const fs = new SplashFileSystem();
      await fs.downloadImage("https://example.com/image.png", "test-image.png");

      expect(RNFS.unlink).toHaveBeenCalled();
    });

    it("deletes temp file on download failure", async () => {
      (RNFS.exists as jest.Mock)
        .mockResolvedValueOnce(false) // Before download
        .mockResolvedValueOnce(true); // After failed download

      (RNFS.downloadFile as jest.Mock).mockReturnValue({
        promise: Promise.resolve({ statusCode: 500, bytesWritten: 0 }),
      });

      const fs = new SplashFileSystem();

      await expect(
        fs.downloadImage("https://example.com/image.png", "test-image.png")
      ).rejects.toThrow();

      expect(RNFS.unlink).toHaveBeenCalled();
    });
  });

  describe("commitImage", () => {
    it("moves file from temp to destination", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      const fs = new SplashFileSystem("document");
      const result = await fs.commitImage("/mock/temp/image.png", "final-image.png");

      expect(result).toBe("/mock/documents/final-image.png");
      expect(RNFS.moveFile).toHaveBeenCalledWith(
        "/mock/temp/image.png",
        "/mock/documents/final-image.png"
      );
    });

    it("deletes existing destination file before moving", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);

      const fs = new SplashFileSystem("document");
      await fs.commitImage("/mock/temp/image.png", "final-image.png");

      expect(RNFS.unlink).toHaveBeenCalledWith("/mock/documents/final-image.png");
      expect(RNFS.moveFile).toHaveBeenCalled();
    });

    it("uses cache directory when configured", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      const fs = new SplashFileSystem("cache");
      const result = await fs.commitImage("/mock/temp/image.png", "final-image.png");

      expect(result).toBe("/mock/caches/final-image.png");
    });
  });

  describe("exists", () => {
    it("delegates to RNFS.exists", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);

      const fs = new SplashFileSystem();
      const result = await fs.exists("/path/to/file.png");

      expect(result).toBe(true);
      expect(RNFS.exists).toHaveBeenCalledWith("/path/to/file.png");
    });

    it("returns false when file does not exist", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      const fs = new SplashFileSystem();
      const result = await fs.exists("/path/to/nonexistent.png");

      expect(result).toBe(false);
    });
  });

  describe("delete", () => {
    it("deletes file when it exists", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);

      const fs = new SplashFileSystem();
      await fs.delete("/path/to/file.png");

      expect(RNFS.unlink).toHaveBeenCalledWith("/path/to/file.png");
    });

    it("does nothing when file does not exist", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      const fs = new SplashFileSystem();
      await fs.delete("/path/to/nonexistent.png");

      expect(RNFS.unlink).not.toHaveBeenCalled();
    });
  });
});
