import {
	type ConfigPlugin,
	WarningAggregator,
	withAppDelegate,
	withMainActivity,
} from "@expo/config-plugins";

const withIosDynamicSplash: ConfigPlugin = (config) => {
	return withAppDelegate(config, (config) => {
		const isSwift = config.modResults.language === "swift";

		if (isSwift) {
			if (config.modResults.contents.includes("DynamicSplashNative.show()")) {
				return config;
			}

			// For Swift (AppDelegate.swift)
			const importTag = "import react_native_dynamic_splash";
			const showTag = "DynamicSplashNative.show()";

			if (!config.modResults.contents.includes(importTag)) {
				config.modResults.contents = config.modResults.contents.replace(
					/import .*/,
					`$&\n${importTag}`,
				);
			}

			if (!config.modResults.contents.includes(showTag)) {
				// Find didFinishLaunchingWithOptions and inject after super.application
				if (
					config.modResults.contents.includes(
						"return super.application(application, didFinishLaunchingWithOptions: launchOptions)",
					)
				) {
					config.modResults.contents = config.modResults.contents.replace(
						"return super.application(application, didFinishLaunchingWithOptions: launchOptions)",
						`${showTag}\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`,
					);
				} else {
					WarningAggregator.addWarningIOS(
						"react-native-dynamic-splash",
						"Could not find didFinishLaunchingWithOptions in AppDelegate.swift. Please add DynamicSplashNative.show() manually.",
					);
				}
			}
		} else {
			if (config.modResults.contents.includes("[RNDynamicSplash show]")) {
				return config;
			}

			// For Objective-C (AppDelegate.mm)
			const importTag = '#import "RNDynamicSplash.h"';
			const showTag = "[RNDynamicSplash show];";

			if (!config.modResults.contents.includes(importTag)) {
				config.modResults.contents = config.modResults.contents.replace(
					'#import "AppDelegate.h"',
					`#import "AppDelegate.h"\n${importTag}`,
				);
			}

			if (!config.modResults.contents.includes(showTag)) {
				config.modResults.contents = config.modResults.contents.replace(
					/(- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions\s*\{)/,
					`$1\n  ${showTag}`,
				);
			}
		}

		return config;
	});
};

const withAndroidDynamicSplash: ConfigPlugin = (config) => {
	return withMainActivity(config, (config) => {
		const isKotlin = config.modResults.language === "kt";

		if (isKotlin) {
			if (
				config.modResults.contents.includes(
					"DynamicSplashNativeModule.show(this)",
				)
			) {
				return config;
			}

			// For Kotlin (MainActivity.kt)
			const importTag =
				"import com.reactnativedynamicsplash.DynamicSplashNativeModule";
			const showTag = "DynamicSplashNativeModule.show(this)";

			if (!config.modResults.contents.includes(importTag)) {
				config.modResults.contents = config.modResults.contents.replace(
					/package .*/,
					`$&\n\n${importTag}`,
				);
			}

			if (!config.modResults.contents.includes(showTag)) {
				if (config.modResults.contents.includes("super.onCreate(null)")) {
					config.modResults.contents = config.modResults.contents.replace(
						"super.onCreate(null)",
						`super.onCreate(null)\n    ${showTag}`,
					);
				} else if (
					config.modResults.contents.includes(
						"super.onCreate(savedInstanceState)",
					)
				) {
					config.modResults.contents = config.modResults.contents.replace(
						"super.onCreate(savedInstanceState)",
						`super.onCreate(savedInstanceState)\n    ${showTag}`,
					);
				} else {
					WarningAggregator.addWarningAndroid(
						"react-native-dynamic-splash",
						"Could not find super.onCreate in MainActivity.kt. Please add DynamicSplashNativeModule.show(this) manually.",
					);
				}
			}
		} else {
			if (
				config.modResults.contents.includes(
					"DynamicSplashNativeModule.show(this)",
				)
			) {
				return config;
			}

			// For Java (MainActivity.java)
			const importTag =
				"import com.reactnativedynamicsplash.DynamicSplashNativeModule;";
			const showTag = "DynamicSplashNativeModule.show(this);";

			if (!config.modResults.contents.includes(importTag)) {
				config.modResults.contents = config.modResults.contents.replace(
					/package .*;/,
					`$&\n\n${importTag}`,
				);
			}

			if (!config.modResults.contents.includes(showTag)) {
				if (
					config.modResults.contents.includes(
						"super.onCreate(savedInstanceState);",
					)
				) {
					config.modResults.contents = config.modResults.contents.replace(
						"super.onCreate(savedInstanceState);",
						`super.onCreate(savedInstanceState);\n    ${showTag}`,
					);
				} else {
					WarningAggregator.addWarningAndroid(
						"react-native-dynamic-splash",
						"Could not find super.onCreate(savedInstanceState) in MainActivity.java. Please add DynamicSplashNativeModule.show(this) manually.",
					);
				}
			}
		}

		return config;
	});
};

const withDynamicSplash: ConfigPlugin = (config) => {
	config = withIosDynamicSplash(config);
	config = withAndroidDynamicSplash(config);
	return config;
};

export default withDynamicSplash;
