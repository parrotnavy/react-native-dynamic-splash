# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Build TypeScript source
npm run build

# Lint with Biome
npm run lint

# Format with Biome
npm run format

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

The sample app in `samples/DynamicSplashSampleApp/` is for manual/integration testing.

## Architecture Overview

This is a React Native library that provides a **native-first dynamic splash screen** displayed between OS launch and app readiness. The key architectural principle is **"next-launch determinism"**: assets are fetched and cached during the current session but displayed on the *next* app launch.

### Layer Separation

**JavaScript Layer** (`src/`):
- Fetches splash configuration via `configProvider`
- Downloads and caches images to local filesystem
- Stores metadata in native storage (UserDefaults/SharedPreferences)
- Does NOT display the splash - only prepares assets for next launch

**Native Layer** (`ios/`, `android/src/`):
- Reads stored metadata at app startup
- Displays overlay window before React Native initializes
- Handles timing constraints (`minDurationMs`, `maxDurationMs`)
- Manages fade/scale animations and GIF/APNG playback

### Data Flow

1. Native `show()` called in AppDelegate/MainActivity reads `UserDefaults`/`SharedPreferences`
2. If metadata status is `READY` and within time window, displays cached image
3. JS `mount()` fetches new config, downloads assets, updates metadata
4. Next app launch uses newly cached assets

### Key Files

- `src/index.ts` - Public API (`createDynamicSplash`, `DynamicSplash.hide/isVisible`)
- `src/core/DynamicSplashManager.ts` - Manager instance coordinating storage and sync
- `src/services/sync.ts` - Background update logic, weighted config selection
- `src/types.ts` - TypeScript interfaces (`SplashConfig`, `StoredMeta`, `InitOptions`)
- `src/expo-plugin.ts` - Expo config plugin auto-injecting native code
- `ios/DynamicSplashNative.swift` - iOS native module (UIWindow overlay, GIF via ImageIO)
- `android/.../DynamicSplashNativeModule.java` - Android native module (Dialog overlay)

### Storage Keys

Default metadata key: `DYNAMIC_SPLASH_META_V1` (configurable via `storageKey` option)

iOS: `UserDefaults.standard`
Android: `SharedPreferences` with name `DYNAMIC_SPLASH_STORAGE`

### Expo Support

The library includes an Expo config plugin (`app.plugin.js` -> `src/expo-plugin.ts`) that auto-injects `DynamicSplashNative.show()` into AppDelegate (Swift/ObjC) and MainActivity (Kotlin/Java). Requires a development build (not Expo Go).
