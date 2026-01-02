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
    guard !key.isEmpty else {
      return nil
    }
    
    return UserDefaults.standard.string(forKey: key)
  }

  @objc(getString:resolver:rejecter:)
  public func getString(_ key: String, resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard !key.isEmpty else {
      resolve(nil)
      return
    }
    
    let value = UserDefaults.standard.string(forKey: key)
    resolve(value)
  }

  @objc(setString:value:)
  public func setString(_ key: String, value: String) {
    guard !key.isEmpty else {
      return
    }
    
    UserDefaults.standard.set(value, forKey: key)
  }

  @objc(remove:)
  public func remove(_ key: String) {
    guard !key.isEmpty else {
      return
    }
    
    UserDefaults.standard.removeObject(forKey: key)
  }
}
