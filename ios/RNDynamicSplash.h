#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Objective-C helper for DynamicSplash integration.
 * Use this in Objective-C projects to avoid Swift bridging header issues.
 */
@interface RNDynamicSplash : NSObject

/**
 * Show the dynamic splash screen.
 * Call this in application:didFinishLaunchingWithOptions:
 */
+ (void)show;

/**
 * Hide the dynamic splash screen.
 * Typically called from JavaScript, but can be called natively if needed.
 */
+ (void)hide;

/**
 * Check if the splash screen is currently visible.
 * @return YES if visible, NO otherwise.
 */
+ (BOOL)isShowing;

/**
 * Set a custom storage key.
 * Must be called before show() if you want to use a custom key.
 * @param key The storage key to use.
 */
+ (void)setStorageKey:(NSString *)key;

/**
 * Get the current storage key.
 * @return The current storage key.
 */
+ (NSString *)getStorageKey;

@end

NS_ASSUME_NONNULL_END
