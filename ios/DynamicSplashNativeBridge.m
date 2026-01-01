#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DynamicSplashNative, NSObject)

RCT_EXTERN_METHOD(show)
RCT_EXTERN_METHOD(hide)
RCT_EXTERN_METHOD(isShowing:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setStorageKey:(NSString *)key)
RCT_EXTERN_METHOD(getStorageKey:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getLastLoadedMeta:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
