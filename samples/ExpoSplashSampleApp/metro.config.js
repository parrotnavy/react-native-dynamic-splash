const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the library directory
config.watchFolders = [libraryRoot];

// 2. Ignore the library's own node_modules to avoid duplication/conflicts
config.resolver.blockList = [new RegExp(`${libraryRoot}/node_modules/.*`)];

// 3. Force resolution of shared dependencies to the project's node_modules
config.resolver.extraNodeModules = {
	"@parrotnavy/react-native-dynamic-splash": libraryRoot,
	"react-native-fs": path.resolve(projectRoot, "node_modules/react-native-fs"),
	"@babel/runtime": path.resolve(projectRoot, "node_modules/@babel/runtime"),
	react: path.resolve(projectRoot, "node_modules/react"),
	"react-native": path.resolve(projectRoot, "node_modules/react-native"),
};

module.exports = config;
