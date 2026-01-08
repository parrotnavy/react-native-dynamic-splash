package com.reactnativedynamicsplash;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import org.json.JSONObject;

import java.io.File;
import java.lang.ref.WeakReference;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class DynamicSplashNativeModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private static final String MODULE_NAME = "DynamicSplashNative";
  private static Dialog overlayDialog;
  private static WeakReference<Activity> overlayActivityRef;
  private static String storageKey = StorageConstants.DEFAULT_STORAGE_KEY;
  private static String lastLoadedMetaRaw;
  private static boolean fadeEnabled = true;
  private static int fadeDurationMs = 200;
  private static Float scaleStart;
  private static Float scaleEnd;
  private static Integer scaleDurationMs;
  private static String scaleEasing;
  private static long showStartTime = 0;
  private static android.os.Handler maxDurationHandler;
  private static Runnable maxDurationRunnable;
  private static boolean isHiding = false;

  public DynamicSplashNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public void onHostResume() {
    // No action needed on resume
  }

  @Override
  public void onHostPause() {
    // No action needed on pause
  }

  @Override
  public void onHostDestroy() {
    // Clean up dialog when host activity is destroyed to prevent memory leaks
    cleanupDialog();
  }

  private static void cleanupDialog() {
    try {
      if (maxDurationHandler != null && maxDurationRunnable != null) {
        maxDurationHandler.removeCallbacks(maxDurationRunnable);
        maxDurationHandler = null;
        maxDurationRunnable = null;
      }
      if (overlayDialog != null) {
        if (overlayDialog.isShowing()) {
          overlayDialog.dismiss();
        }
        overlayDialog = null;
      }
      overlayActivityRef = null;
      showStartTime = 0;
      isHiding = false;
    } catch (Exception e) {
      // Ensure cleanup even if errors occur
      overlayDialog = null;
      overlayActivityRef = null;
      showStartTime = 0;
      isHiding = false;
    }
  }

  @NonNull
  @Override
  public String getName() {
    return MODULE_NAME;
  }

  private static View createOverlayView(Activity activity, String imagePath, String backgroundColor) {
    try {
      FrameLayout container = new FrameLayout(activity);
      int color = parseColor(backgroundColor);
      container.setBackgroundColor(color);

      AnimatedImageView imageView = new AnimatedImageView(activity);
      imageView.setScaleType(ImageView.ScaleType.CENTER_CROP);
      imageView.setImagePath(imagePath);
      imageView.setLayoutParams(
        new FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.MATCH_PARENT,
          FrameLayout.LayoutParams.MATCH_PARENT
        )
      );
      container.addView(imageView);
      return container;
    } catch (Exception e) {
      // Return a simple fallback view to prevent crashes
      FrameLayout fallback = new FrameLayout(activity);
      fallback.setBackgroundColor(Color.WHITE);
      return fallback;
    }
  }

  private static String getStoredMeta(Activity activity) {
    try {
      if (activity == null) return null;
      return activity
        .getSharedPreferences(StorageConstants.PREFS_NAME, Activity.MODE_PRIVATE)
        .getString(storageKey, null);
    } catch (Exception e) {
      return null;
    }
  }

  private static long parseDate(String text) {
    if (text == null || text.isEmpty()) return -1;

    // Normalize 'Z' suffix to '+00:00' for better compatibility across Android versions
    String normalizedText = text;
    if (text.endsWith("Z")) {
      normalizedText = text.substring(0, text.length() - 1) + "+00:00";
    }

    String[] patterns = new String[] {
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
      "yyyy-MM-dd'T'HH:mm:ssXXX",
      "yyyy-MM-dd'T'HH:mm:ss.SSSX",
      "yyyy-MM-dd'T'HH:mm:ssX"
    };
    for (String pattern : patterns) {
      try {
        SimpleDateFormat format = new SimpleDateFormat(pattern, Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        Date date = format.parse(normalizedText);
        if (date != null) {
          return date.getTime();
        }
      } catch (ParseException ignored) {
      } catch (IllegalArgumentException ignored) {
        // Some Android versions may not support X/XXX patterns
      }
    }

    // Fallback: try parsing without timezone (assume UTC)
    try {
      String withoutTz = normalizedText.replaceAll("[+-]\\d{2}:\\d{2}$", "");
      SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS", Locale.US);
      format.setTimeZone(TimeZone.getTimeZone("UTC"));
      Date date = format.parse(withoutTz);
      if (date != null) {
        return date.getTime();
      }
    } catch (ParseException ignored) {
    }

    try {
      String withoutTz = normalizedText.replaceAll("[+-]\\d{2}:\\d{2}$", "");
      SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
      format.setTimeZone(TimeZone.getTimeZone("UTC"));
      Date date = format.parse(withoutTz);
      if (date != null) {
        return date.getTime();
      }
    } catch (ParseException ignored) {
    }

    return -1;
  }

  private static int parseColor(String value) {
    if (value == null || value.isEmpty()) return Color.WHITE;
    try {
      return Color.parseColor(value);
    } catch (IllegalArgumentException e) {
      return Color.WHITE;
    }
  }

  private static android.view.animation.Interpolator getScaleInterpolator() {
    if (scaleEasing == null) {
      return new android.view.animation.AccelerateDecelerateInterpolator();
    }
    switch (scaleEasing) {
      case "linear":
        return new android.view.animation.LinearInterpolator();
      case "easeIn":
        return new android.view.animation.AccelerateInterpolator();
      case "easeOut":
        return new android.view.animation.DecelerateInterpolator();
      case "easeInOut":
      default:
        return new android.view.animation.AccelerateDecelerateInterpolator();
    }
  }

  public static void show(Activity activity) {
    try {
      if (activity == null || activity.isFinishing()) return;
      if (overlayDialog != null && overlayDialog.isShowing()) return;

      String raw = getStoredMeta(activity);
      lastLoadedMetaRaw = raw;
      if (raw == null) return;
      
      JSONObject json = new JSONObject(raw);
      if (!"READY".equals(json.optString("status"))) return;

      long start = parseDate(json.optString("startAt"));
      long end = parseDate(json.optString("endAt"));
      long now = System.currentTimeMillis();
      if (start <= 0 || end <= 0 || now < start || now > end) return;

      String localPath = json.optString("localPath", null);
      if (localPath == null) return;
      File file = new File(localPath);
      if (!file.exists()) return;

      String backgroundColor = json.optString("backgroundColor", null);
      fadeEnabled = json.optBoolean("enableFade", true);
      fadeDurationMs = json.optInt("fadeDurationMs", 200);
      scaleStart = json.has("scaleStart") ? (float) json.optDouble("scaleStart") : null;
      scaleEnd = json.has("scaleEnd") ? (float) json.optDouble("scaleEnd") : null;
      scaleDurationMs = json.has("scaleDurationMs") ? json.optInt("scaleDurationMs") : null;
      scaleEasing = json.has("scaleEasing") ? json.optString("scaleEasing", null) : null;
      if (scaleEasing != null && scaleEasing.isEmpty()) {
        scaleEasing = null;
      }
      int minDurationMs = json.optInt("minDurationMs", 0);
      int maxDurationMs = json.optInt("maxDurationMs", 0);
      
      showStartTime = System.currentTimeMillis();
      overlayActivityRef = new WeakReference<>(activity);

      overlayDialog = new Dialog(activity, android.R.style.Theme_Translucent_NoTitleBar_Fullscreen);
      overlayDialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
      overlayDialog.setContentView(createOverlayView(activity, localPath, backgroundColor));
      overlayDialog.setCancelable(false);
      Window window = overlayDialog.getWindow();
      if (window != null) {
        window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
        window.addFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
      }
      overlayDialog.show();

      // Apply scale-in animation if configured
      if (scaleStart != null && scaleEnd != null && scaleDurationMs != null) {
        if (window != null) {
          View decorView = window.getDecorView();
          if (decorView != null) {
            decorView.setScaleX(scaleStart);
            decorView.setScaleY(scaleStart);
            if (scaleDurationMs > 0) {
              decorView.animate()
                .scaleX(scaleEnd)
                .scaleY(scaleEnd)
                .setDuration(scaleDurationMs)
                .setInterpolator(getScaleInterpolator())
                .start();
            } else {
              decorView.setScaleX(scaleEnd);
              decorView.setScaleY(scaleEnd);
            }
          }
        }
      }
      
      // Set up auto-hide timer if maxDurationMs is specified
      if (maxDurationMs > 0) {
        if (maxDurationHandler != null && maxDurationRunnable != null) {
          maxDurationHandler.removeCallbacks(maxDurationRunnable);
        }
        maxDurationHandler = new android.os.Handler(android.os.Looper.getMainLooper());
        maxDurationRunnable = new Runnable() {
          @Override
          public void run() {
            hideInternal();
          }
        };
        maxDurationHandler.postDelayed(maxDurationRunnable, maxDurationMs);
      }
    } catch (Exception e) {
      // Silently fail to prevent crashes - splash is optional
      overlayDialog = null;
      overlayActivityRef = null;
      showStartTime = 0;
    }
  }

  private static void hideInternal() {
    try {
      // Prevent duplicate hide calls from queuing multiple operations
      if (isHiding) {
        return;
      }
      if (overlayDialog != null && overlayDialog.isShowing()) {
        isHiding = true;

        // Cancel max duration timer if it exists
        if (maxDurationHandler != null && maxDurationRunnable != null) {
          maxDurationHandler.removeCallbacks(maxDurationRunnable);
          maxDurationHandler = null;
          maxDurationRunnable = null;
        }

        // Check if minimum duration has elapsed using WeakReference
        Activity activity = overlayActivityRef != null ? overlayActivityRef.get() : null;
        String raw = activity != null ? getStoredMeta(activity) : null;
        int minDurationMs = 0;
        if (raw != null) {
          try {
            JSONObject json = new JSONObject(raw);
            minDurationMs = json.optInt("minDurationMs", 0);
          } catch (Exception ignored) {}
        }

        long elapsed = System.currentTimeMillis() - showStartTime;
        long remaining = minDurationMs - elapsed;

        if (remaining > 0) {
          new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
              performHide();
            }
          }, remaining);
        } else {
          performHide();
        }
      }
    } catch (Exception e) {
      // Ensure cleanup even if hiding fails
      cleanupDialog();
    }
  }
  
  private static void performHide() {
    try {
      if (overlayDialog != null && overlayDialog.isShowing()) {
        if (fadeEnabled && fadeDurationMs > 0) {
          Window window = overlayDialog.getWindow();
          if (window != null) {
            View decorView = window.getDecorView();
            if (decorView != null) {
              decorView.animate()
                .alpha(0f)
                .setDuration(fadeDurationMs)
                .withEndAction(new Runnable() {
                  @Override
                  public void run() {
                    try {
                      if (overlayDialog != null) {
                        overlayDialog.dismiss();
                      }
                    } catch (Exception e) {
                      // Ignore dismiss errors
                    }
                    overlayDialog = null;
                    overlayActivityRef = null;
                    showStartTime = 0;
                    isHiding = false;
                  }
                })
                .start();
              return;
            }
          }
        }
        // Fallback to direct dismiss if fade fails or is disabled
        overlayDialog.dismiss();
        overlayDialog = null;
        overlayActivityRef = null;
        showStartTime = 0;
        isHiding = false;
      }
    } catch (Exception e) {
      // Ensure cleanup even if animation or dismiss fails
      cleanupDialog();
    }
  }

  private static void setStorageKeyInternal(String key) {
    if (key != null && !key.isEmpty()) {
      storageKey = key;
    }
  }

  public static String getStorageKeyValue() {
    return storageKey;
  }

  @ReactMethod
  public void show() {
    try {
      Activity activity = getCurrentActivity();
      show(activity);
    } catch (Exception e) {
      // Silently fail - splash is optional
    }
  }

  @ReactMethod
  public void hide() {
    try {
      Activity activity = getCurrentActivity();
      if (activity == null) return;
      activity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          DynamicSplashNativeModule.hideInternal();
        }
      });
    } catch (Exception e) {
      // Silently fail - if runOnUiThread fails, we cannot safely call hideInternal
      // as it manipulates UI elements and must run on the UI thread
    }
  }

  @ReactMethod
  public void setStorageKey(String key) {
    try {
      DynamicSplashNativeModule.setStorageKeyInternal(key);
    } catch (Exception e) {
      // Silently fail
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getStorageKey() {
    try {
      return getStorageKeyValue();
    } catch (Exception e) {
      return StorageConstants.DEFAULT_STORAGE_KEY;
    }
  }

  @ReactMethod
  public void getLastLoadedMeta(Promise promise) {
    try {
      promise.resolve(lastLoadedMetaRaw);
    } catch (Exception e) {
      promise.reject("META_ERROR", "Failed to get last loaded meta", e);
    }
  }
  
  @ReactMethod
  public void isShowing(Promise promise) {
    try {
      boolean showing = overlayDialog != null && overlayDialog.isShowing();
      promise.resolve(showing);
    } catch (Exception e) {
      promise.reject("STATUS_ERROR", "Failed to check if showing", e);
    }
  }
}
