#import "RNDynamicSplash.h"
#import <objc/runtime.h>

@implementation RNDynamicSplash

+ (void)show {
  @try {
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
  @catch (NSException *exception) {
    // Silently fail to prevent crashes
    NSLog(@"[DynamicSplash] Exception in show: %@", exception);
  }
}

+ (void)hide {
  @try {
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
  @catch (NSException *exception) {
    // Silently fail to prevent crashes
    NSLog(@"[DynamicSplash] Exception in hide: %@", exception);
  }
}

+ (BOOL)isShowing {
  @try {
    Class dynamicSplashClass = NSClassFromString(@"DynamicSplashNative");
    if (dynamicSplashClass) {
      SEL isShowingSelector = NSSelectorFromString(@"isShowing");
      if ([dynamicSplashClass respondsToSelector:isShowingSelector]) {
        #pragma clang diagnostic push
        #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        NSNumber *result = [dynamicSplashClass performSelector:isShowingSelector];
        #pragma clang diagnostic pop
        if (result && [result isKindOfClass:[NSNumber class]]) {
          return [result boolValue];
        }
      }
    }
  }
  @catch (NSException *exception) {
    // Silently fail to prevent crashes
    NSLog(@"[DynamicSplash] Exception in isShowing: %@", exception);
  }
  return NO;
}

+ (void)setStorageKey:(NSString *)key {
  @try {
    Class dynamicSplashClass = NSClassFromString(@"DynamicSplashNative");
    if (dynamicSplashClass && key && [key isKindOfClass:[NSString class]]) {
      SEL setStorageKeySelector = NSSelectorFromString(@"setStorageKey:");
      if ([dynamicSplashClass respondsToSelector:setStorageKeySelector]) {
        #pragma clang diagnostic push
        #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        [dynamicSplashClass performSelector:setStorageKeySelector withObject:key];
        #pragma clang diagnostic pop
      }
    }
  }
  @catch (NSException *exception) {
    // Silently fail to prevent crashes
    NSLog(@"[DynamicSplash] Exception in setStorageKey: %@", exception);
  }
}

+ (NSString *)getStorageKey {
  @try {
    Class dynamicSplashClass = NSClassFromString(@"DynamicSplashNative");
    if (dynamicSplashClass) {
      SEL getStorageKeySelector = NSSelectorFromString(@"getStorageKey");
      if ([dynamicSplashClass respondsToSelector:getStorageKeySelector]) {
        #pragma clang diagnostic push
        #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        NSString *result = [dynamicSplashClass performSelector:getStorageKeySelector];
        #pragma clang diagnostic pop
        if (result && [result isKindOfClass:[NSString class]]) {
          return result;
        }
      }
    }
  }
  @catch (NSException *exception) {
    // Silently fail to prevent crashes
    NSLog(@"[DynamicSplash] Exception in getStorageKey: %@", exception);
  }
  return @"DYNAMIC_SPLASH_META_V1";
}

@end
