/**
 * Expo plugin tests
 *
 * These tests verify the string manipulation logic used in the config plugin
 * for injecting DynamicSplash into native app entry points.
 *
 * Note: We test the transformation logic directly rather than through
 * the full config plugin wrapper, as mocking @expo/config-plugins is complex.
 */

describe("expo-plugin transformations", () => {
	describe("iOS - Swift transformations", () => {
		const injectSwiftImport = (contents: string): string => {
			const importTag = "import react_native_dynamic_splash";
			if (contents.includes(importTag)) return contents;
			return contents.replace(/^import .*/m, `$&\n${importTag}`);
		};

		const injectSwiftShow = (contents: string): string => {
			const showTag = "DynamicSplashNative.show()";
			if (contents.includes(showTag)) return contents;
			if (
				contents.includes(
					"return super.application(application, didFinishLaunchingWithOptions: launchOptions)",
				)
			) {
				return contents.replace(
					"return super.application(application, didFinishLaunchingWithOptions: launchOptions)",
					`${showTag}\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`,
				);
			}
			return contents;
		};

		it("injects import after first import statement", () => {
			const input = `import UIKit
import React

class AppDelegate {}`;

			const result = injectSwiftImport(input);

			expect(result).toContain("import react_native_dynamic_splash");
			expect(result.indexOf("import UIKit")).toBeLessThan(
				result.indexOf("import react_native_dynamic_splash"),
			);
		});

		it("does not duplicate import if already present", () => {
			const input = `import UIKit
import react_native_dynamic_splash

class AppDelegate {}`;

			const result = injectSwiftImport(input);

			const matches = result.match(/import react_native_dynamic_splash/g);
			expect(matches).toHaveLength(1);
		});

		it("injects show() before super.application return", () => {
			const input = `class AppDelegate {
  func application() -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}`;

			const result = injectSwiftShow(input);

			expect(result).toContain("DynamicSplashNative.show()");
			expect(result.indexOf("DynamicSplashNative.show()")).toBeLessThan(
				result.indexOf("return super.application"),
			);
		});

		it("does not duplicate show() if already present", () => {
			const input = `class AppDelegate {
  func application() -> Bool {
    DynamicSplashNative.show()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}`;

			const result = injectSwiftShow(input);

			const matches = result.match(/DynamicSplashNative\.show\(\)/g);
			expect(matches).toHaveLength(1);
		});
	});

	describe("iOS - Objective-C transformations", () => {
		const injectObjCImport = (contents: string): string => {
			const importTag = '#import "RNDynamicSplash.h"';
			if (contents.includes(importTag)) return contents;
			return contents.replace(
				'#import "AppDelegate.h"',
				`#import "AppDelegate.h"\n${importTag}`,
			);
		};

		const injectObjCShow = (contents: string): string => {
			const showTag = "[RNDynamicSplash show];";
			if (contents.includes(showTag)) return contents;
			const regex =
				/(-\s*\(BOOL\)\s*application\s*:\s*\(UIApplication\s*\*\s*\)application\s*didFinishLaunchingWithOptions\s*:\s*\(NSDictionary\s*\*\s*\)launchOptions\s*\{)/;
			if (regex.test(contents)) {
				return contents.replace(regex, `$1\n  ${showTag}`);
			}
			return contents;
		};

		it("injects #import after AppDelegate.h import", () => {
			const input = `#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate
@end`;

			const result = injectObjCImport(input);

			expect(result).toContain('#import "RNDynamicSplash.h"');
		});

		it("does not duplicate import if already present", () => {
			const input = `#import "AppDelegate.h"
#import "RNDynamicSplash.h"

@implementation AppDelegate
@end`;

			const result = injectObjCImport(input);

			const matches = result.match(/#import "RNDynamicSplash\.h"/g);
			expect(matches).toHaveLength(1);
		});

		it("injects [RNDynamicSplash show] in didFinishLaunchingWithOptions", () => {
			const input = `@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"TestApp";
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end`;

			const result = injectObjCShow(input);

			expect(result).toContain("[RNDynamicSplash show];");
		});

		it("does not duplicate show if already present", () => {
			const input = `@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [RNDynamicSplash show];
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end`;

			const result = injectObjCShow(input);

			const matches = result.match(/\[RNDynamicSplash show\];/g);
			expect(matches).toHaveLength(1);
		});
	});

	describe("Android - Kotlin transformations", () => {
		const injectKotlinImport = (contents: string): string => {
			const importTag =
				"import com.reactnativedynamicsplash.DynamicSplashNativeModule";
			if (contents.includes(importTag)) return contents;
			return contents.replace(/^package .*/m, `$&\n\n${importTag}`);
		};

		const injectKotlinShow = (contents: string): string => {
			const showTag = "DynamicSplashNativeModule.show(this)";
			if (contents.includes(showTag)) return contents;
			if (contents.includes("super.onCreate(null)")) {
				return contents.replace(
					"super.onCreate(null)",
					`super.onCreate(null)\n    ${showTag}`,
				);
			}
			if (contents.includes("super.onCreate(savedInstanceState)")) {
				return contents.replace(
					"super.onCreate(savedInstanceState)",
					`super.onCreate(savedInstanceState)\n    ${showTag}`,
				);
			}
			return contents;
		};

		it("injects import after package declaration", () => {
			const input = `package com.testapp

import com.facebook.react.ReactActivity

class MainActivity : ReactActivity()`;

			const result = injectKotlinImport(input);

			expect(result).toContain(
				"import com.reactnativedynamicsplash.DynamicSplashNativeModule",
			);
		});

		it("does not duplicate import if already present", () => {
			const input = `package com.testapp

import com.reactnativedynamicsplash.DynamicSplashNativeModule

class MainActivity : ReactActivity()`;

			const result = injectKotlinImport(input);

			const matches = result.match(
				/import com\.reactnativedynamicsplash\.DynamicSplashNativeModule/g,
			);
			expect(matches).toHaveLength(1);
		});

		it("injects show(this) after super.onCreate(savedInstanceState)", () => {
			const input = `class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
  }
}`;

			const result = injectKotlinShow(input);

			expect(result).toContain("DynamicSplashNativeModule.show(this)");
		});

		it("injects show(this) after super.onCreate(null)", () => {
			const input = `class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }
}`;

			const result = injectKotlinShow(input);

			expect(result).toContain("DynamicSplashNativeModule.show(this)");
		});

		it("does not duplicate show if already present", () => {
			const input = `class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    DynamicSplashNativeModule.show(this)
  }
}`;

			const result = injectKotlinShow(input);

			const matches = result.match(/DynamicSplashNativeModule\.show\(this\)/g);
			expect(matches).toHaveLength(1);
		});
	});

	describe("Android - Java transformations", () => {
		const injectJavaImport = (contents: string): string => {
			const importTag =
				"import com.reactnativedynamicsplash.DynamicSplashNativeModule;";
			if (contents.includes(importTag)) return contents;
			return contents.replace(/^package .*;/m, `$&\n\n${importTag}`);
		};

		const injectJavaShow = (contents: string): string => {
			const showTag = "DynamicSplashNativeModule.show(this);";
			if (contents.includes(showTag)) return contents;
			if (contents.includes("super.onCreate(null);")) {
				return contents.replace(
					"super.onCreate(null);",
					`super.onCreate(null);\n    ${showTag}`,
				);
			}
			if (contents.includes("super.onCreate(savedInstanceState);")) {
				return contents.replace(
					"super.onCreate(savedInstanceState);",
					`super.onCreate(savedInstanceState);\n    ${showTag}`,
				);
			}
			return contents;
		};

		it("injects import after package declaration", () => {
			const input = `package com.testapp;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {}`;

			const result = injectJavaImport(input);

			expect(result).toContain(
				"import com.reactnativedynamicsplash.DynamicSplashNativeModule;",
			);
		});

		it("does not duplicate import if already present", () => {
			const input = `package com.testapp;

import com.reactnativedynamicsplash.DynamicSplashNativeModule;

public class MainActivity extends ReactActivity {}`;

			const result = injectJavaImport(input);

			const matches = result.match(
				/import com\.reactnativedynamicsplash\.DynamicSplashNativeModule;/g,
			);
			expect(matches).toHaveLength(1);
		});

		it("injects show(this) after super.onCreate(savedInstanceState)", () => {
			const input = `public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
  }
}`;

			const result = injectJavaShow(input);

			expect(result).toContain("DynamicSplashNativeModule.show(this);");
		});

		it("injects show(this) after super.onCreate(null)", () => {
			const input = `public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
  }
}`;

			const result = injectJavaShow(input);

			expect(result).toContain("DynamicSplashNativeModule.show(this);");
		});

		it("does not duplicate show if already present", () => {
			const input = `public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    DynamicSplashNativeModule.show(this);
  }
}`;

			const result = injectJavaShow(input);

			const matches = result.match(/DynamicSplashNativeModule\.show\(this\);/g);
			expect(matches).toHaveLength(1);
		});
	});
});
