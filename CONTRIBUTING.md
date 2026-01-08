# Contributing to react-native-dynamic-splash

Thank you for your interest in contributing!

## Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Lint and format
npm run lint
npm run format
```

## Architecture

### Native Layer (iOS/Android)

**Responsibilities:**
- Display/hide overlay window
- Read stored metadata from native storage
- Apply `minDurationMs` and `maxDurationMs` timing constraints
- Handle fade and scale animations (based on `animation` settings)
- Support animated images (GIF/APNG)
- Manage overlay lifecycle independently of JavaScript

**iOS Implementation:**
- Uses `UIWindow` with `UIImageView` for overlay
- `ImageIO` framework for GIF/APNG frame extraction
- `UIView.animate` for fade effects
- Timer-based auto-hide for `maxDurationMs`

**Android Implementation:**
- Uses `Dialog` with `AnimatedImageView` for overlay
- `AnimatedImageDrawable` (API 28+) for GIF/APNG support
- `View.animate()` for fade effects
- Handler-based auto-hide for `maxDurationMs`

### JavaScript Layer

**Responsibilities:**
- Fetch splash configuration from remote source
- Download and cache images
- Store metadata in native storage
- Provide API to hide overlay (`DynamicSplash.hide()`)
- Check overlay visibility (`DynamicSplash.isVisible()`)

**NOT Responsible For:**
- Displaying the overlay (native handles this)
- Managing display state (native handles this)
- Timing constraints (native handles this)

## Pull Request Guidelines

1. Create a feature branch from `main`
2. Ensure all tests pass (`npm test`)
3. Update documentation if needed
4. Follow the existing code style
