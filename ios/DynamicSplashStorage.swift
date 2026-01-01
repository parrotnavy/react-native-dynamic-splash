import Foundation
import React

@objcMembers
@objc(DynamicSplashStorage)
public class DynamicSplashStorage: NSObject, RCTBridgeModule {
  public static func moduleName() -> String! {
    return "DynamicSplashStorage"
  }

  public static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(getStringSync:)
  public func getStringSync(_ key: String) -> String? {
    return UserDefaults.standard.string(forKey: key)
  }

  @objc(getString:resolver:rejecter:)
  public func getString(_ key: String, resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(UserDefaults.standard.string(forKey: key))
  }

  @objc(setString:value:)
  public func setString(_ key: String, value: String) {
    UserDefaults.standard.set(value, forKey: key)
  }

  @objc(remove:)
  public func remove(_ key: String) {
    UserDefaults.standard.removeObject(forKey: key)
  }
}
