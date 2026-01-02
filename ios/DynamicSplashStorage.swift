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
    
    do {
      return UserDefaults.standard.string(forKey: key)
    } catch {
      return nil
    }
  }

  @objc(getString:resolver:rejecter:)
  public func getString(_ key: String, resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard !key.isEmpty else {
      resolve(nil)
      return
    }
    
    do {
      let value = UserDefaults.standard.string(forKey: key)
      resolve(value)
    } catch {
      resolve(nil)
    }
  }

  @objc(setString:value:)
  public func setString(_ key: String, value: String) {
    guard !key.isEmpty else {
      return
    }
    
    do {
      UserDefaults.standard.set(value, forKey: key)
    } catch {
      // Silently fail to prevent crashes
    }
  }

  @objc(remove:)
  public func remove(_ key: String) {
    guard !key.isEmpty else {
      return
    }
    
    do {
      UserDefaults.standard.removeObject(forKey: key)
    } catch {
      // Silently fail to prevent crashes
    }
  }
}
