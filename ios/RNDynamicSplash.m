#import "RNDynamicSplash.h"
#import <objc/runtime.h>

@implementation RNDynamicSplash

+ (void)show {
  Class dynamicSplashClass = NSClassFromString(@"DynamicSplashNative");
  if (dynamicSplashClass) {
    SEL showSelector = NSSelectorFromString(@"show");
    if ([dynamicSplashClass respondsToSelector:showSelector]) {
      #pragma clang diagnostic push
      #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
      [dynamicSplashClass performSelector:showSelector];
      #pragma clang diagnostic pop
    }
  }
}

+ (void)hide {
  Class dynamicSplashClass = NSClassFromString(@"DynamicSplashNative");
  if (dynamicSplashClass) {
    SEL hideSelector = NSSelectorFromString(@"hide");
    if ([dynamicSplashClass respondsToSelector:hideSelector]) {
      #pragma clang diagnostic push
      #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
      [dynamicSplashClass performSelector:hideSelector];
      #pragma clang diagnostic pop
    }
  }
}

+ (BOOL)isShowing {
  Class dynamicSplashClass = NSClassFromString(@"DynamicSplashNative");
  if (dynamicSplashClass) {
    SEL isShowingSelector = NSSelectorFromString(@"isShowing");
    if ([dynamicSplashClass respondsToSelector:isShowingSelector]) {
      #pragma clang diagnostic push
      #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
      NSNumber *result = [dynamicSplashClass performSelector:isShowingSelector];
      #pragma clang diagnostic pop
      return [result boolValue];
    }
  }
  return NO;
}

+ (void)setStorageKey:(NSString *)key {
  Class dynamicSplashClass = NSClassFromString(@"DynamicSplashNative");
  if (dynamicSplashClass && key) {
    SEL setStorageKeySelector = NSSelectorFromString(@"setStorageKey:");
    if ([dynamicSplashClass respondsToSelector:setStorageKeySelector]) {
      #pragma clang diagnostic push
      #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
      [dynamicSplashClass performSelector:setStorageKeySelector withObject:key];
      #pragma clang diagnostic pop
    }
  }
}

+ (NSString *)getStorageKey {
  Class dynamicSplashClass = NSClassFromString(@"DynamicSplashNative");
  if (dynamicSplashClass) {
    SEL getStorageKeySelector = NSSelectorFromString(@"getStorageKey");
    if ([dynamicSplashClass respondsToSelector:getStorageKeySelector]) {
      #pragma clang diagnostic push
      #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
      NSString *result = [dynamicSplashClass performSelector:getStorageKeySelector];
      #pragma clang diagnostic pop
      return result ?: @"DYNAMIC_SPLASH_META_V1";
    }
  }
  return @"DYNAMIC_SPLASH_META_V1";
}

@end
