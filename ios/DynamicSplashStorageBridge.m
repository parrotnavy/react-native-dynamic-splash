#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DynamicSplashStorage, NSObject)

RCT_EXTERN_METHOD(getStringSync:(NSString *)key)
RCT_EXTERN_METHOD(getString:(NSString *)key resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setString:(NSString *)key value:(NSString *)value)
RCT_EXTERN_METHOD(remove:(NSString *)key)

@end
