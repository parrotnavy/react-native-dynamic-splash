# 💐 React Native Dynamic Splash

[![mit licence](https://img.shields.io/dub/l/vibe-d.svg?style=for-the-badge)](https://github.com/parrotnavy/react-native-dynamic-splash/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/@parrotnavy/react-native-dynamic-splash?style=for-the-badge)](https://www.npmjs.com/package/@parrotnavy/react-native-dynamic-splash)
[![npm downloads](https://img.shields.io/npm/dt/@parrotnavy/react-native-dynamic-splash.svg?label=downloads&style=for-the-badge)](https://www.npmjs.com/package/@parrotnavy/react-native-dynamic-splash)

[![platform - android](https://img.shields.io/badge/platform-Android-3ddc84.svg?logo=android&style=for-the-badge)](https://www.android.com)
[![platform - ios](https://img.shields.io/badge/platform-iOS-000.svg?logo=apple&style=for-the-badge)](https://developer.apple.com/ios)


> If this library saved you time, consider buying me a coffee. It really helps. 

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/parrotnavy)

<p>
  <img width="302" src="./docs/preview.gif" alt="Demo">
</p>

<br>

A native-first dynamic splash layer for React Native that intentionally occupies the moment between OS launch and app readiness.


## Overview

**react-native-dynamic-splash** is not a generic full-screen banner or in-app advertisement component.

> [!IMPORTANT]
> Its purpose is to provide a **dynamic, full-screen transition layer that appears immediately after the OS-level splash screen and before any app UI is rendered**.

This library intentionally targets the narrow but critical time window between:
1. The operating system’s mandatory static splash screen, and
2. The moment when the React Native application becomes interactive.

### What This Is

- A **dynamic splash / initial transition screen**
- Displayed **before app content**, not on top of it
- Controlled natively (iOS / Android), independent of JS readiness
- Capable of acting as:
  - A loading screen
  - A branded entry experience
  - A marketing / campaign surface

From a UX perspective, users perceive this as part of the app startup sequence — not as an interruptive ad.

### What This Is NOT

- ❌ A modal or screen rendered inside React Navigation
- ❌ A post-launch in-app advertisement
- ❌ A generic full-screen banner component
- ❌ A replacement for OS-level LaunchScreen assets


### Execution Model


The startup timeline is intentionally structured as:

```mermaid
sequenceDiagram
    participant OS as OS Splash
    participant DS as Dynamic Splash
    participant APP as App UI

    OS->>DS: 1. OS splash ends
    DS->>DS: 2. Show dynamic splash immediately
    DS->>DS: 3. App is loading in background
    DS->>APP: 4. App signals ready
    DS->>DS: 5. Hide splash (fade / timing)
    DS->>APP: 6. App UI becomes visible
```


1. **OS Static Splash**
   - Android launch theme
   - iOS `LaunchScreen.storyboard`
2. **Dynamic Splash (this library)**
   - Shown immediately after OS splash
   - Uses cached, pre-validated assets
   - Can be animated (GIF / APNG)
   - Enforced timing via native code
3. **App UI**
   - Hidden until JS signals readiness

This makes the dynamic splash a **first-class startup layer**, not an application screen.

### Architectural Principles

- **Native-first display**
  - Overlay window is fully managed by native modules
- **JS for data, not rendering**
  - JavaScript only fetches configs, downloads assets, and persists metadata
- **Next-launch determinism**
  - Assets are prepared ahead of time and only shown on the next app launch
- **Fail-closed behavior**
  - Any validation or IO failure results in no splash being shown
- **No coupling to navigation or app state**
  - The splash lifecycle is independent from React rendering

### Typical Use Cases

- Startup branding without rebuilding the app
- Campaign or promotion display at app launch
- Masking cold-start latency with intentional visuals
- Gradual replacement of static splash experiences

In short:

> **This library exists to intentionally design the moment between “app launched” and “app ready”.**

## Installation

### Bare React Native

```bash
npm install @parrotnavy/react-native-dynamic-splash react-native-fs && npx pod-install
# or
yarn add @parrotnavy/react-native-dynamic-splash react-native-fs && npx pod-install
```

### Expo (Managed Workflow)

```bash
npx expo install @parrotnavy/react-native-dynamic-splash react-native-fs
```

Add the plugin to your `app.json` (or `app.config.js`):

```json
{
  "expo": {
    "plugins": ["@parrotnavy/react-native-dynamic-splash"]
  }
}
```

> [!IMPORTANT]
> This library uses native code via a Config Plugin. It **requires a Development Build** and cannot be tested in the standard Expo Go app.

```bash
npx expo run:ios # or run:android
```

## Requirements

| Platform | Minimum Version |
|----------|-----------------|
| iOS | 12.0+ |
| Android | API 21+ (animated images require API 28+) |
| Node.js | 20.0.0+ |
| React Native | 0.70+ |

## Native Integration

Show the READY splash content natively (based on stored metadata), then hide it once JS is ready.
**This does not touch or reuse LaunchScreen assets.**

### iOS (Swift - AppDelegate.swift)

```swift
import react_native_dynamic_splash // <-- Add like this

@main
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    DynamicSplashNative.show() // <-- Add like this
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

### iOS (Objective-C - AppDelegate.m)

```objc
#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import "RNDynamicSplash.h" // <-- Add like this

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application 
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"YourAppName";
  self.initialProps = @{};
  
  [RNDynamicSplash show]; // <-- Add like this
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end
```

### Android (MainActivity)

```java
import com.reactnativedynamicsplash.DynamicSplashNativeModule; // <-- Add like this

@Override
protected void onCreate(Bundle savedInstanceState) {
  super.onCreate(savedInstanceState);
  DynamicSplashNativeModule.show(this); // <-- Add like this
}
```

Optional storage key override (use only if you changed `storageKey` in JS):

**Swift:**
```swift
// DynamicSplashNative.setStorageKey("MY_CUSTOM_KEY")  // Uncomment if using custom storageKey
DynamicSplashNative.show()
```

**Objective-C:**
```objc
// [RNDynamicSplash setStorageKey:@"MY_CUSTOM_KEY"];  // Uncomment if using custom storageKey
[RNDynamicSplash show];
```

**Android:**
```java
// DynamicSplashNativeModule.setStorageKey("MY_CUSTOM_KEY");  // Uncomment if using custom storageKey
DynamicSplashNativeModule.show(this);
```

Then, once JS is ready, you can hide the splash:

```js
import { DynamicSplash } from "@parrotnavy/react-native-dynamic-splash";

// Hide the splash (respects minDurationMs and fade settings)
DynamicSplash.hide();

// Check if splash is currently visible
const isVisible = await DynamicSplash.isVisible();
```

## Quick Start

### Step 1: Create a splash config file

```ts
// splashConfig.ts
import type { InitOptions } from "@parrotnavy/react-native-dynamic-splash";

export const splashConfig: InitOptions = {
  // Fetch config from your backend or CDN
  configProvider: async () => {
    const response = await fetch("https://your-api.com/splash.json");
    return response.json();
  },
  // Optional: Debug logging during development
  logger: (msg, ...args) => console.log("[Splash]", msg, ...args),
  // Timing constraints
  minDurationMs: 2000,
  maxDurationMs: 3000,
  // Animations
  animation: {
    fade: { enabled: true, durationMs: 200 },
    scale: { startScale: 1.0, endScale: 1.02, durationMs: 2000, easing: "linear" },
  },
};
```

### Step 2: Initialize in your App component

```tsx
// App.tsx
import { useEffect, useMemo } from "react";
import { createDynamicSplash, DynamicSplash } from "@parrotnavy/react-native-dynamic-splash";
import { splashConfig } from "./splashConfig";

function App() {
  // Create manager instance (singleton)
  const manager = useMemo(() => createDynamicSplash(splashConfig), []);

  useEffect(() => {
    // Start background update to fetch config and cache images
    manager.mount();
  }, [manager]);

  useEffect(() => {
    // Hide splash when your app is ready
    // (e.g., after data loading, auth check, etc.)
    const timer = setTimeout(() => {
      DynamicSplash.hide();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    // Your app content
  );
}
```

### Step 3: Host your splash config JSON

```json
[
  {
    "imageName": "welcome-offer-2026q1",
    "alt": "Welcome offer: 20% off your first order",
    "startAt": "2026-01-01T00:00:00Z",
    "endAt": "2026-03-31T23:59:59Z",
    "imageUrl": "https://cdn.example.com/splash/welcome.png",
    "configVersion": "2026.01.0",
    "backgroundColor": "#0B1220",
    "weight": 2
  },
  {
    "imageName": "spring-sale-2026",
    "alt": "Spring sale: Up to 50% off",
    "startAt": "2026-03-01T00:00:00Z",
    "endAt": "2026-04-30T23:59:59Z",
    "imageUrl": "https://cdn.example.com/splash/spring-sale.gif",
    "configVersion": "2026.03.0",
    "backgroundColor": "#101828",
    "weight": 3
  }
]
```

> [!IMPORTANT]
> Images are downloaded and cached on the device. The splash is displayed on the **next app launch** after a successful download.

## Configuration

### InitOptions

```ts
type InitOptions = {
	/** Provides splash config objects from any source (required). */
	configProvider: () => Promise<SplashConfig | SplashConfig[]>;
	/** Minimum time to keep splash visible (ms). Applied by native modules. Default: no minimum. */
	minDurationMs?: number;
	/** Maximum time to keep splash visible (ms). Native auto-hides after this duration. Default: no maximum. */
	maxDurationMs?: number;
	/**
	 * Animation settings for show/hide.
	 * - fade: hide-only fade-out.
	 * - scale: applied on show.
	 */
	animation?: {
		fade?: {
			/** Enable fade out animation when hiding (default: true). */
			enabled?: boolean;
			/** Fade out animation duration in milliseconds (default: 200). */
			durationMs?: number;
		};
		scale?: {
			/** Start scale factor (e.g., 1.0). */
			startScale: number;
			/** End scale factor (e.g., 1.2). */
			endScale: number;
			/** Animation duration in milliseconds. */
			durationMs: number;
			/** Animation easing (default: easeInOut). */
			easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
		};
	};
	/** @deprecated Use animation.fade.enabled instead. */
	enableFade?: boolean;
	/** @deprecated Use animation.fade.durationMs instead. */
	fadeDurationMs?: number;
	/** Storage key for persisted metadata (default: "DYNAMIC_SPLASH_META_V1"). */
	storageKey?: string;
	/**
	 * Storage location for cached images.
	 * - "document": Persists across app restarts; better for long-lived assets.
	 * - "cache": Uses OS-managed cache; may be evicted by the system.
	 * Default: "document".
	 */
	fileLocation?: "document" | "cache";
	/** Optional config processed immediately on mount (pre-seeding, default: none). */
	initialConfig?: SplashConfig | SplashConfig[];
	/** Optional logging hook (default: none). */
	logger?: (msg: string, ...args: any[]) => void;
	/** Wait timeout for storage readiness before skipping dynamic splash (ms, default: 0). */
	storageReadyTimeoutMs?: number;
	/** If true, show the splash immediately after a successful update in the same session (default: false). */
	showOnUpdate?: boolean;
};
```

## JSON Contract

Required properties are minimal and focused on determinism and caching.

```ts
type SplashConfig = {
  /** Image identifier used as the cache key and file name. */
	imageName: string;
	/** Accessibility description for the image. */
	alt: string;
	/** Start time (ISO-8601). Splash is eligible only if now >= startAt. */
	startAt: string;
	/** End time (ISO-8601). Splash is eligible only if now <= endAt. */
	endAt: string;
	/** Download URL (http/https). Used to fetch the remote asset. */
	imageUrl: string;
	/** Per-image config version. If changed, cached image is invalidated. */
	configVersion: string;
	/** Background color shown behind the image if it does not fill the screen (default: none). */
	backgroundColor?: string;
	/** Relative weight (>= 0). Higher values increase selection probability (default: 1). */
	weight?: number;
};
```

Example (array is supported; weight is a ratio):

```json
[
  {
    "imageName": "promo-pink",
    "alt": "Pink Hug",
    "startAt": "2023-01-01T00:00:00Z",
    "endAt": "2026-12-31T23:59:59Z",
    "imageUrl": "https://example.com/promo-pink.png",
    "configVersion": "promo-pink-v1",
    "backgroundColor": "#FFC0CB",
    "weight": 5
  },
  {
    "imageName": "promo-blue",
    "alt": "Blue Theme",
    "startAt": "2023-01-01T00:00:00Z",
    "endAt": "2026-12-31T23:59:59Z",
    "imageUrl": "https://example.com/promo-blue.png",
    "configVersion": "promo-blue-v3",
    "backgroundColor": "#ADD8E6",
    "weight": 3
  }
]
```

## Config Provider

Provide config objects from any source (HTTP endpoint, Firebase Remote Config, feature flags, etc.):

```ts
// From HTTP endpoint
createDynamicSplash({
  configProvider: async () => {
    const response = await fetch('https://api.example.com/splash.json');
    return response.json();
  },
});

// From Firebase Remote Config
createDynamicSplash({
  configProvider: async () => {
    await remoteConfig().fetchAndActivate();
    const config = remoteConfig().getString('splash_config');
    return JSON.parse(config);
  },
});

// Static config
createDynamicSplash({
  configProvider: async () => ({
    imageName: "promo-pink",
    alt: "Pink Hug",
    startAt: "2023-01-01T00:00:00Z",
    endAt: "2026-12-31T23:59:59Z",
    imageUrl: "https://example.com/promo-pink.png",
    configVersion: "promo-pink-v1",
    backgroundColor: "#FFC0CB",
    weight: 5,
  }),
});
```

## Update Rules (Practical)

- JSON is fetched on each launch (`mount()`).
- A cached asset is reused when:
  - `status === "READY"`
  - `imageName` matches
  - `configVersion` matches
  - local file exists
- Any failure results in `ERROR` and no display on next launch.

## API

### createDynamicSplash(options: InitOptions)

Creates a manager instance for background updates.

```ts
const manager = createDynamicSplash({
  configProvider: async () => ({ /* config */ }),
  minDurationMs: 2000,
  maxDurationMs: 5000,
  animation: {
    fade: { enabled: true, durationMs: 500 },
  },
});
```

### manager.mount()

Triggers background update to fetch and cache splash images. Call this once when your app starts.

```ts
useEffect(() => {
  manager.mount();
}, [manager]);
```

### DynamicSplash.hide()

Requests native module to hide the splash overlay. Respects `minDurationMs` and applies fade animation if enabled.

```ts
DynamicSplash.hide();
```

### DynamicSplash.isVisible()

Returns current visibility state from native module.

```ts
const isVisible = await DynamicSplash.isVisible();
console.log('Splash visible:', isVisible);
```

## Animated Images

### Supported Formats

- **GIF**: Fully supported on iOS (all versions) and Android (API 28+)
- **APNG**: Fully supported on iOS (all versions) and Android (API 28+)
- **Static images**: PNG, JPEG (all platforms)

### Fallback Behavior

- **Android < API 28**: Animated images display as static (first frame only)
- **iOS**: All formats fully supported via `ImageIO` framework

### Limits

- **Maximum frames**: 200 frames per animated image (to prevent memory issues)
- Images exceeding this limit will be truncated to the first 200 frames

### Usage

Simply provide a GIF or APNG URL in your config:

```json
{
  "imageName": "animated-promo",
  "imageUrl": "https://example.com/promo.gif",
  "configVersion": "v1"
}
```

The native modules automatically detect and animate the image.

## Fade Effects

Fade effects are configured globally in `InitOptions` (not per-splash-item):

```ts
createDynamicSplash({
  configProvider: async () => ({ /* ... */ }),
  animation: {
    fade: {
      enabled: true,       // Enable fade out animation
      durationMs: 500,     // 500ms fade duration
    },
  },
});
```

- `animation.fade.enabled: true` - Smooth fade out when hiding
- `animation.fade.enabled: false` - Instant hide (no animation)
- `animation.fade.durationMs` - Duration in milliseconds (default: 200)

Deprecated (still supported):

```ts
createDynamicSplash({
  configProvider: async () => ({ /* ... */ }),
  enableFade: true,
  fadeDurationMs: 500,
});
```

Fade settings are stored in metadata and applied by native modules on the next launch.

## Scale Effects

Scale effects are configured globally in `InitOptions`:

```ts
createDynamicSplash({
  configProvider: async () => ({ /* ... */ }),
  animation: {
    scale: {
      startScale: 1.0,
      endScale: 1.1,
      durationMs: 1000,
      easing: "easeInOut",
    },
  },
});
```

- `scale` runs when the splash is shown.
- `scale.easing` can be one of `linear`, `easeIn`, `easeOut`, `easeInOut`.

## Timing Control

Both `minDurationMs` and `maxDurationMs` are enforced by native modules:

```ts
createDynamicSplash({
  configProvider: async () => ({ /* ... */ }),
  minDurationMs: 2000,  // Splash shows for at least 2 seconds
  maxDurationMs: 5000,  // Auto-hide after 5 seconds
});
```

- **minDurationMs**: Native delays hide requests until minimum time has elapsed
- **maxDurationMs**: Native automatically hides splash after maximum time
- Both work even if JavaScript hasn't loaded yet

## License

MIT
