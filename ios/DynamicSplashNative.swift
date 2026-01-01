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

  private static func loadAnimatedImage(from path: String) -> (images: [UIImage], duration: TimeInterval)? {
    guard let imageSource = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil) else {
      return nil
    }
    
    let frameCount = CGImageSourceGetCount(imageSource)
    guard frameCount > 1 else { return nil }
    
    var images: [UIImage] = []
    var totalDuration: TimeInterval = 0
    
    for i in 0..<frameCount {
      guard let cgImage = CGImageSourceCreateImageAtIndex(imageSource, i, nil) else { continue }
      
      let image = UIImage(cgImage: cgImage)
      images.append(image)
      
      if let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, i, nil) as? [String: Any],
         let gifInfo = properties[kCGImagePropertyGIFDictionary as String] as? [String: Any] {
        let frameDuration = gifInfo[kCGImagePropertyGIFUnclampedDelayTime as String] as? TimeInterval
          ?? gifInfo[kCGImagePropertyGIFDelayTime as String] as? TimeInterval
          ?? 0.1
        totalDuration += frameDuration
      } else if let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, i, nil) as? [String: Any],
                let pngInfo = properties[kCGImagePropertyPNGDictionary as String] as? [String: Any] {
        let frameDuration = pngInfo[kCGImagePropertyAPNGUnclampedDelayTime as String] as? TimeInterval
          ?? pngInfo[kCGImagePropertyAPNGDelayTime as String] as? TimeInterval
          ?? 0.1
        totalDuration += frameDuration
      } else {
        totalDuration += 0.1
      }
    }
    
    return images.isEmpty ? nil : (images, totalDuration)
  }
  
  private static func overlayView(imagePath: String?, backgroundColor: UIColor?) -> UIView {
    let container = UIView(frame: UIScreen.main.bounds)
    container.backgroundColor = backgroundColor ?? .white

    if let imagePath {
      let imageView = UIImageView(frame: container.bounds)
      imageView.contentMode = .scaleAspectFill
      imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      
      if let animatedData = loadAnimatedImage(from: imagePath) {
        imageView.animationImages = animatedData.images
        imageView.animationDuration = animatedData.duration
        imageView.animationRepeatCount = 0
        imageView.startAnimating()
      } else if let staticImage = UIImage(contentsOfFile: imagePath) {
        imageView.image = staticImage
      }
      
      container.addSubview(imageView)
    }

    return container
  }

  private static func parseDate(_ value: Any?) -> Date? {
    guard let text = value as? String else { return nil }

    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = formatter.date(from: text) {
      return date
    }

    let fallback = ISO8601DateFormatter()
    fallback.formatOptions = [.withInternetDateTime]
    return fallback.date(from: text)
  }

  private static func parseColor(_ value: Any?) -> UIColor? {
    guard let hex = value as? String else { return nil }
    var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    if cleaned.hasPrefix("#") {
      cleaned.removeFirst()
    }
    guard cleaned.count == 6 || cleaned.count == 8 else { return nil }

    var hexValue: UInt64 = 0
    guard Scanner(string: cleaned).scanHexInt64(&hexValue) else { return nil }

    if cleaned.count == 6 {
      let r = CGFloat((hexValue & 0xFF0000) >> 16) / 255.0
      let g = CGFloat((hexValue & 0x00FF00) >> 8) / 255.0
      let b = CGFloat(hexValue & 0x0000FF) / 255.0
      return UIColor(red: r, green: g, blue: b, alpha: 1.0)
    }

    let a = CGFloat((hexValue & 0xFF000000) >> 24) / 255.0
    let r = CGFloat((hexValue & 0x00FF0000) >> 16) / 255.0
    let g = CGFloat((hexValue & 0x0000FF00) >> 8) / 255.0
    let b = CGFloat(hexValue & 0x000000FF) / 255.0
    return UIColor(red: r, green: g, blue: b, alpha: a)
  }

  private static func loadReadyMeta() -> (imagePath: String, backgroundColor: UIColor?, enableFade: Bool, fadeDurationMs: Double, minDurationMs: Double?, maxDurationMs: Double?)? {
    guard
      let raw = UserDefaults.standard.string(forKey: storageKey),
      let data = raw.data(using: .utf8),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      lastLoadedMetaRaw = nil
      return nil
    }

    lastLoadedMetaRaw = raw
    guard (json["status"] as? String) == "READY" else { return nil }

    let now = Date()
    guard
      let start = parseDate(json["startAt"]),
      let end = parseDate(json["endAt"]),
      now >= start,
      now <= end
    else {
      return nil
    }

    guard let localPath = json["localPath"] as? String else { return nil }
    guard FileManager.default.fileExists(atPath: localPath) else { return nil }

    let backgroundColor = parseColor(json["backgroundColor"])
    let enableFade = json["enableFade"] as? Bool ?? true
    let fadeDurationMs = json["fadeDurationMs"] as? Double ?? 200.0
    let minDurationMs = json["minDurationMs"] as? Double
    let maxDurationMs = json["maxDurationMs"] as? Double
    return (localPath, backgroundColor, enableFade, fadeDurationMs, minDurationMs, maxDurationMs)
  }

  private static var fadeEnabled: Bool = true
  private static var fadeDuration: Double = 0.2
  private static var showStartTime: Date?
  private static var maxDurationTimer: Timer?
  
  @objc
  public static func show() {
    DispatchQueue.main.async {
      if overlayWindow != nil { return }
      guard let meta = loadReadyMeta() else { return }

      fadeEnabled = meta.enableFade
      fadeDuration = meta.fadeDurationMs / 1000.0
      showStartTime = Date()
      
      let window = UIWindow(frame: UIScreen.main.bounds)
      window.windowLevel = UIWindow.Level.statusBar + 1
      let viewController = UIViewController()
      viewController.view = overlayView(imagePath: meta.imagePath, backgroundColor: meta.backgroundColor)
      window.rootViewController = viewController
      window.makeKeyAndVisible()
      overlayWindow = window
      
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
      guard let window = overlayWindow else { return }
      
      // Cancel max duration timer if it exists
      maxDurationTimer?.invalidate()
      maxDurationTimer = nil
      
      let performHide = {
        if fadeEnabled {
          UIView.animate(withDuration: fadeDuration, animations: {
            window.alpha = 0
          }, completion: { _ in
            window.isHidden = true
            window.rootViewController = nil
            overlayWindow = nil
            showStartTime = nil
            
            if let appDelegate = UIApplication.shared.delegate,
               let appWindow = appDelegate.window as? UIWindow {
              appWindow.makeKeyAndVisible()
            }
          })
        } else {
          window.isHidden = true
          window.rootViewController = nil
          overlayWindow = nil
          showStartTime = nil
          
          if let appDelegate = UIApplication.shared.delegate,
             let appWindow = appDelegate.window as? UIWindow {
            appWindow.makeKeyAndVisible()
          }
        }
      }
      
      // Check if minimum duration has elapsed
      if let meta = loadReadyMeta(),
         let minDurationMs = meta.minDurationMs,
         let startTime = showStartTime,
         minDurationMs > 0 {
        let elapsed = Date().timeIntervalSince(startTime) * 1000.0
        let remaining = minDurationMs - elapsed
        
        if remaining > 0 {
          DispatchQueue.main.asyncAfter(deadline: .now() + (remaining / 1000.0)) {
            performHide()
          }
          return
        }
      }
      
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
  public func isShowing(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(Self.isShowing())
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
  public func getStorageKey(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(Self.getStorageKey())
  }

  @objc(getLastLoadedMeta:rejecter:)
  public func getLastLoadedMeta(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(Self.lastLoadedMetaRaw)
  }
}
