module.exports = {
	preset: "react-native",
	setupFiles: ["./jest.setup.ts"],
	moduleNameMapper: {
		"^../../dist$": "<rootDir>/__mocks__/dist.ts",
	},
};
