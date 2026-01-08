import Foundation
import UIKit
import React
import ImageIO

@objc(DynamicSplashNative)
public class DynamicSplashNative: NSObject, RCTBridgeModule {
  private static var overlayWindow: UIWindow?
  private static var storageKey: String = "DYNAMIC_SPLASH_META_V1"
  private static var lastLoadedMetaRaw: String?

  public static func moduleName() -> String! {
    return "DynamicSplashNative"
  }

  public static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // Maximum number of animation frames to prevent memory issues with large GIFs
  private static let maxAnimationFrames = 200

  private static func loadAnimatedImage(from path: String) -> (images: [UIImage], duration: TimeInterval)? {
    // Guard against empty path
    guard !path.isEmpty else {
      return nil
    }

    // Safely create URL and image source
    let url = URL(fileURLWithPath: path)
    guard let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil) else {
      return nil
    }

    let frameCount = CGImageSourceGetCount(imageSource)
    guard frameCount > 1 else { return nil }

    // Limit frame count to prevent memory issues
    let effectiveFrameCount = min(frameCount, maxAnimationFrames)

    var images: [UIImage] = []
    var totalDuration: TimeInterval = 0

    for i in 0..<effectiveFrameCount {
      // Safely create CGImage at index
      guard let cgImage = CGImageSourceCreateImageAtIndex(imageSource, i, nil) else { 
        continue 
      }
      
      let image = UIImage(cgImage: cgImage)
      images.append(image)
      
      // Safely extract frame duration with proper error handling
      var frameDuration: TimeInterval = 0.1
      
      if let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, i, nil) as? [String: Any] {
        // Try GIF properties first
        if let gifInfo = properties[kCGImagePropertyGIFDictionary as String] as? [String: Any] {
          frameDuration = gifInfo[kCGImagePropertyGIFUnclampedDelayTime as String] as? TimeInterval
            ?? gifInfo[kCGImagePropertyGIFDelayTime as String] as? TimeInterval
            ?? 0.1
        }
        // Try APNG properties if GIF properties not found
        else if let pngInfo = properties[kCGImagePropertyPNGDictionary as String] as? [String: Any] {
          frameDuration = pngInfo[kCGImagePropertyAPNGUnclampedDelayTime as String] as? TimeInterval
            ?? pngInfo[kCGImagePropertyAPNGDelayTime as String] as? TimeInterval
            ?? 0.1
        }
      }
      
      // Ensure duration is positive and reasonable
      if frameDuration <= 0 || frameDuration > 10.0 {
        frameDuration = 0.1
      }
      
      totalDuration += frameDuration
    }
    
    return images.isEmpty ? nil : (images, totalDuration)
  }
  
  private static func overlayView(imagePath: String?, backgroundColor: UIColor?) -> UIView {
    // Get screen bounds - this is always called from main thread via show()
    let container = UIView(frame: UIScreen.main.bounds)
    container.backgroundColor = backgroundColor ?? .white

    if let imagePath = imagePath, !imagePath.isEmpty {
      // Verify file exists before attempting to load
      guard FileManager.default.fileExists(atPath: imagePath) else {
        return container
      }
      
      let imageView = UIImageView(frame: container.bounds)
      imageView.contentMode = .scaleAspectFill
      imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      
      // Try loading animated image first
      if let animatedData = loadAnimatedImage(from: imagePath) {
        imageView.animationImages = animatedData.images
        imageView.animationDuration = animatedData.duration
        imageView.animationRepeatCount = 0
        imageView.startAnimating()
      } 
      // Fallback to static image
      else if let staticImage = UIImage(contentsOfFile: imagePath) {
        imageView.image = staticImage
      }
      // If both fail, return container without image
      
      container.addSubview(imageView)
    }

    return container
  }

  private static func parseDate(_ value: Any?) -> Date? {
    guard let text = value as? String, !text.isEmpty else { 
      return nil 
    }

    // Try with fractional seconds first
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = formatter.date(from: text) {
      return date
    }

    // Fallback to without fractional seconds
    let fallback = ISO8601DateFormatter()
    fallback.formatOptions = [.withInternetDateTime]
    return fallback.date(from: text)
  }

  private static func parseColor(_ value: Any?) -> UIColor? {
    guard let hex = value as? String, !hex.isEmpty else { 
      return nil 
    }
    
    var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    if cleaned.hasPrefix("#") {
      cleaned.removeFirst()
    }
    
    // Only accept 6 or 8 character hex codes
    guard cleaned.count == 6 || cleaned.count == 8 else { 
      return nil 
    }

    var hexValue: UInt64 = 0
    guard Scanner(string: cleaned).scanHexInt64(&hexValue) else { 
      return nil 
    }

    if cleaned.count == 6 {
      let r = CGFloat((hexValue & 0xFF0000) >> 16) / 255.0
      let g = CGFloat((hexValue & 0x00FF00) >> 8) / 255.0
      let b = CGFloat(hexValue & 0x0000FF) / 255.0
      return UIColor(red: r, green: g, blue: b, alpha: 1.0)
    }

    // 8 character hex with alpha
    let a = CGFloat((hexValue & 0xFF000000) >> 24) / 255.0
    let r = CGFloat((hexValue & 0x00FF0000) >> 16) / 255.0
    let g = CGFloat((hexValue & 0x0000FF00) >> 8) / 255.0
    let b = CGFloat(hexValue & 0x000000FF) / 255.0
    return UIColor(red: r, green: g, blue: b, alpha: a)
  }

  private struct ReadyMeta {
    let imagePath: String
    let backgroundColor: UIColor?
    let enableFade: Bool
    let fadeDurationMs: Double
    let minDurationMs: Double?
    let maxDurationMs: Double?
    let scale: ScaleAnimation?
  }

  private struct ScaleAnimation {
    let startScale: CGFloat
    let endScale: CGFloat
    let durationMs: Double
    let easing: String?
  }

  private static func loadReadyMeta() -> ReadyMeta? {
    // Safely load from UserDefaults
    guard let raw = UserDefaults.standard.string(forKey: storageKey),
          !raw.isEmpty,
          let data = raw.data(using: .utf8) else {
      lastLoadedMetaRaw = nil
      return nil
    }
    
    // Safely parse JSON
    guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      lastLoadedMetaRaw = nil
      return nil
    }

    lastLoadedMetaRaw = raw
    
    // Check status
    guard let status = json["status"] as? String, status == "READY" else { 
      return nil 
    }

    // Validate dates
    let now = Date()
    guard let start = parseDate(json["startAt"]),
          let end = parseDate(json["endAt"]),
          now >= start,
          now <= end else {
      return nil
    }

    // Validate local path
    guard let localPath = json["localPath"] as? String,
          !localPath.isEmpty else { 
      return nil 
    }
    
    // Verify file exists
    guard FileManager.default.fileExists(atPath: localPath) else { 
      return nil 
    }

    // Parse optional display settings with safe defaults
    let backgroundColor = parseColor(json["backgroundColor"])
    let enableFade = json["enableFade"] as? Bool ?? true
    let fadeDurationMs = json["fadeDurationMs"] as? Double ?? 200.0
    
    // Parse optional timing constraints
    var minDurationMs: Double? = nil
    if let min = json["minDurationMs"] as? Double, min > 0 {
      minDurationMs = min
    }
    
    var maxDurationMs: Double? = nil
    if let max = json["maxDurationMs"] as? Double, max > 0 {
      maxDurationMs = max
    }
    
    let scale = parseScaleAnimation(
      start: json["scaleStart"],
      end: json["scaleEnd"],
      durationMs: json["scaleDurationMs"],
      easing: json["scaleEasing"]
    )

    return ReadyMeta(
      imagePath: localPath,
      backgroundColor: backgroundColor,
      enableFade: enableFade,
      fadeDurationMs: fadeDurationMs,
      minDurationMs: minDurationMs,
      maxDurationMs: maxDurationMs,
      scale: scale
    )
  }

  private static func parseScaleAnimation(
    start: Any?,
    end: Any?,
    durationMs: Any?,
    easing: Any?
  ) -> ScaleAnimation? {
    let startValue = numberValue(start)
    let endValue = numberValue(end)
    let durationValue = numberValue(durationMs)
    let easingValue = easingValue(easing)

    if startValue == nil && endValue == nil && durationValue == nil {
      return nil
    }

    guard let startScale = startValue,
          let endScale = endValue,
          let duration = durationValue,
          duration > 0 else {
      return nil
    }

    return ScaleAnimation(
      startScale: CGFloat(startScale),
      endScale: CGFloat(endScale),
      durationMs: duration,
      easing: easingValue
    )
  }

  private static func numberValue(_ value: Any?) -> Double? {
    if let number = value as? NSNumber {
      return number.doubleValue
    }
    if let doubleValue = value as? Double {
      return doubleValue
    }
    if let intValue = value as? Int {
      return Double(intValue)
    }
    return nil
  }

  private static func easingValue(_ value: Any?) -> String? {
    if let easing = value as? String, !easing.isEmpty {
      return easing
    }
    return nil
  }

  private static func scaleAnimationOptions(_ easing: String?) -> UIView.AnimationOptions {
    switch easing {
    case "linear":
      return .curveLinear
    case "easeIn":
      return .curveEaseIn
    case "easeOut":
      return .curveEaseOut
    case "easeInOut":
      return .curveEaseInOut
    default:
      return .curveEaseInOut
    }
  }

  private static var fadeEnabled: Bool = true
  private static var fadeDuration: Double = 0.2
  private static var showStartTime: Date?
  private static var maxDurationTimer: Timer?
  private static var isHiding: Bool = false
  private static var cachedMinDurationMs: Double?
  
  @objc
  public static func show() {
    DispatchQueue.main.async {
      // Prevent showing multiple overlays
      if overlayWindow != nil { 
        return 
      }
      
      // Load metadata safely
      guard let meta = loadReadyMeta() else { 
        return 
      }

      // Store fade settings and timing constraints
      fadeEnabled = meta.enableFade
      fadeDuration = meta.fadeDurationMs / 1000.0
      showStartTime = Date()
      cachedMinDurationMs = meta.minDurationMs
      isHiding = false
      
      // Create overlay view safely
      let overlayContentView = overlayView(imagePath: meta.imagePath, backgroundColor: meta.backgroundColor)
      
      // Create window and view controller
      let window = UIWindow(frame: UIScreen.main.bounds)
      window.windowLevel = UIWindow.Level.statusBar + 1
      let viewController = UIViewController()
      viewController.view = overlayContentView
      window.rootViewController = viewController
      window.makeKeyAndVisible()
      overlayWindow = window

      if let scale = meta.scale {
        overlayContentView.transform = CGAffineTransform(scaleX: scale.startScale, y: scale.startScale)
        UIView.animate(
          withDuration: scale.durationMs / 1000.0,
          delay: 0,
          options: scaleAnimationOptions(scale.easing),
          animations: {
            overlayContentView.transform = CGAffineTransform(scaleX: scale.endScale, y: scale.endScale)
          }
        )
      }
      
      // Set up auto-hide timer if maxDurationMs is specified
      if let maxDurationMs = meta.maxDurationMs, maxDurationMs > 0 {
        maxDurationTimer?.invalidate()
        maxDurationTimer = Timer.scheduledTimer(withTimeInterval: maxDurationMs / 1000.0, repeats: false) { _ in
          hide()
        }
      }
    }
  }

  @objc
  public static func hide() {
    DispatchQueue.main.async {
      // Prevent duplicate hide calls from queuing multiple operations
      guard !isHiding else {
        return
      }

      // Check if window exists
      guard let window = overlayWindow else {
        return
      }

      isHiding = true

      // Cancel max duration timer if it exists
      maxDurationTimer?.invalidate()
      maxDurationTimer = nil

      let performHide = {
        var pendingAnimations = 0

        let finalize = {
          window.isHidden = true
          window.rootViewController = nil
          overlayWindow = nil
          showStartTime = nil
          cachedMinDurationMs = nil
          isHiding = false

          // Restore app window safely
          if let appDelegate = UIApplication.shared.delegate,
             let appWindow = appDelegate.window as? UIWindow {
            appWindow.makeKeyAndVisible()
          }
        }

        let finishIfNeeded = {
          pendingAnimations -= 1
          if pendingAnimations <= 0 {
            finalize()
          }
        }

        if fadeEnabled && fadeDuration > 0 {
          pendingAnimations += 1
          UIView.animate(withDuration: fadeDuration, animations: {
            window.alpha = 0
          }, completion: { _ in
            finishIfNeeded()
          })
        }

        if pendingAnimations == 0 {
          finalize()
        }
      }

      // Check if minimum duration has elapsed using cached value
      if let minDurationMs = cachedMinDurationMs,
         let startTime = showStartTime,
         minDurationMs > 0 {
        let elapsed = Date().timeIntervalSince(startTime) * 1000.0
        let remaining = minDurationMs - elapsed

        if remaining > 0 {
          // Schedule hide after remaining time
          DispatchQueue.main.asyncAfter(deadline: .now() + (remaining / 1000.0)) {
            performHide()
          }
          return
        }
      }

      // No minimum duration or already elapsed
      performHide()
    }
  }

  @objc
  public func show() {
    Self.show()
  }

  @objc
  public func hide() {
    Self.hide()
  }
  
  @objc
  public static func isShowing() -> Bool {
    return overlayWindow != nil
  }
  
  @objc(isShowing:rejecter:)
  public func isShowing(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      resolve(Self.isShowing())
    }
  }

  @objc
  public static func setStorageKey(_ key: String?) {
    if let key, !key.isEmpty {
      storageKey = key
    }
  }

  @objc
  public static func getStorageKey() -> String {
    return storageKey
  }

  @objc
  public func setStorageKey(_ key: String?) {
    Self.setStorageKey(key)
  }

  @objc(getStorageKey:rejecter:)
  public func getStorageKey(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      resolve(Self.getStorageKey())
    }
  }

  @objc(getLastLoadedMeta:rejecter:)
  public func getLastLoadedMeta(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      resolve(Self.lastLoadedMetaRaw)
    }
  }
}
