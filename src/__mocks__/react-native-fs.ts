const mockRNFS = {
	DocumentDirectoryPath: "/mock/documents",
	CachesDirectoryPath: "/mock/caches",
	TemporaryDirectoryPath: "/mock/temp",
	exists: jest.fn().mockResolvedValue(false),
	unlink: jest.fn().mockResolvedValue(undefined),
	moveFile: jest.fn().mockResolvedValue(undefined),
	downloadFile: jest.fn().mockReturnValue({
		promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 }),
	}),
};

export default mockRNFS;

export const DocumentDirectoryPath = mockRNFS.DocumentDirectoryPath;
export const CachesDirectoryPath = mockRNFS.CachesDirectoryPath;
export const TemporaryDirectoryPath = mockRNFS.TemporaryDirectoryPath;
export const exists = mockRNFS.exists;
export const unlink = mockRNFS.unlink;
export const moveFile = mockRNFS.moveFile;
export const downloadFile = mockRNFS.downloadFile;

export type DownloadFileOptions = {
	fromUrl: string;
	toFile: string;
};

export type DownloadResult = {
	statusCode: number;
	bytesWritten: number;
};
