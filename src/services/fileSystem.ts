import RNFS, {
	type DownloadFileOptions,
	type DownloadResult,
} from "react-native-fs";

export class SplashFileSystem {
	private baseDir: string;

	constructor(location: "document" | "cache" = "document") {
		this.baseDir =
			location === "cache"
				? RNFS.CachesDirectoryPath
				: RNFS.DocumentDirectoryPath;
	}

	async downloadImage(url: string, filename: string): Promise<string> {
		// Use CachesDirectoryPath for temporary downloads to ensure reliability on iOS/Android
		// and avoid potential issues with TemporaryDirectoryPath being cleaned up or non-existent.
		const cacheDir = RNFS.CachesDirectoryPath;
		const safeDir = cacheDir.endsWith("/") ? cacheDir : `${cacheDir}/`;
		const tempPath = `${safeDir}splash_temp_${Date.now()}_${filename}`;

		// Ensure temp file doesn't exist
		if (await RNFS.exists(tempPath)) {
			await RNFS.unlink(tempPath);
		}

		const options: DownloadFileOptions = {
			fromUrl: url,
			toFile: tempPath,
		};

		const result: DownloadResult = await RNFS.downloadFile(options).promise;

		if (result.statusCode !== 200) {
			// Try to delete if it was created
			if (await RNFS.exists(tempPath)) {
				await RNFS.unlink(tempPath);
			}
			throw new Error(`Download failed with status ${result.statusCode}`);
		}

		return tempPath;
	}

	async commitImage(tempPath: string, filename: string): Promise<string> {
		const base = this.baseDir.endsWith("/") ? this.baseDir : `${this.baseDir}/`;
		const destPath = `${base}${filename}`;

		// Delete existing if any
		if (await RNFS.exists(destPath)) {
			await RNFS.unlink(destPath);
		}

		await RNFS.moveFile(tempPath, destPath);
		return destPath;
	}

	async exists(path: string): Promise<boolean> {
		return await RNFS.exists(path);
	}

	async delete(path: string) {
		if (await RNFS.exists(path)) {
			await RNFS.unlink(path);
		}
	}
}
