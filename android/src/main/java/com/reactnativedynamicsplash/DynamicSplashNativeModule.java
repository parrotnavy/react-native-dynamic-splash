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

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import org.json.JSONObject;

import java.io.File;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class DynamicSplashNativeModule extends ReactContextBaseJavaModule {
  private static final String MODULE_NAME = "DynamicSplashNative";
  private static Dialog overlayDialog;
  private static String storageKey = StorageConstants.DEFAULT_STORAGE_KEY;
  private static String lastLoadedMetaRaw;
  private static boolean fadeEnabled = true;
  private static int fadeDurationMs = 200;
  private static long showStartTime = 0;
  private static android.os.Handler maxDurationHandler;
  private static Runnable maxDurationRunnable;

  public DynamicSplashNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return MODULE_NAME;
  }

  private static View createOverlayView(Activity activity, String imagePath, String backgroundColor) {
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
  }

  private static String getStoredMeta(Activity activity) {
    return activity
      .getSharedPreferences(StorageConstants.PREFS_NAME, Activity.MODE_PRIVATE)
      .getString(storageKey, null);
  }

  private static long parseDate(String text) {
    if (text == null) return -1;
    String[] patterns = new String[] {
      "yyyy-MM-dd'T'HH:mm:ss.SSSX",
      "yyyy-MM-dd'T'HH:mm:ssX"
    };
    for (String pattern : patterns) {
      try {
        SimpleDateFormat format = new SimpleDateFormat(pattern, Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        Date date = format.parse(text);
        if (date != null) {
          return date.getTime();
        }
      } catch (ParseException ignored) {
      }
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

  public static void show(Activity activity) {
    if (activity == null || activity.isFinishing()) return;
    if (overlayDialog != null && overlayDialog.isShowing()) return;

    String raw = getStoredMeta(activity);
    lastLoadedMetaRaw = raw;
    if (raw == null) return;
    try {
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
      int minDurationMs = json.optInt("minDurationMs", 0);
      int maxDurationMs = json.optInt("maxDurationMs", 0);
      
      showStartTime = System.currentTimeMillis();

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
    } catch (Exception ignored) {
      return;
    }
  }

  private static void hideInternal() {
    if (overlayDialog != null && overlayDialog.isShowing()) {
      // Cancel max duration timer if it exists
      if (maxDurationHandler != null && maxDurationRunnable != null) {
        maxDurationHandler.removeCallbacks(maxDurationRunnable);
        maxDurationHandler = null;
        maxDurationRunnable = null;
      }
      
      // Check if minimum duration has elapsed
      String raw = overlayDialog.getContext() instanceof Activity ? 
        getStoredMeta((Activity) overlayDialog.getContext()) : null;
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
  }
  
  private static void performHide() {
    if (overlayDialog != null && overlayDialog.isShowing()) {
      if (fadeEnabled && fadeDurationMs > 0) {
        View decorView = overlayDialog.getWindow().getDecorView();
        decorView.animate()
          .alpha(0f)
          .setDuration(fadeDurationMs)
          .withEndAction(new Runnable() {
            @Override
            public void run() {
              overlayDialog.dismiss();
              overlayDialog = null;
              showStartTime = 0;
            }
          })
          .start();
      } else {
        overlayDialog.dismiss();
        overlayDialog = null;
        showStartTime = 0;
      }
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
    Activity activity = getCurrentActivity();
    show(activity);
  }

  @ReactMethod
  public void hide() {
    Activity activity = getCurrentActivity();
    if (activity == null) return;
    activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        DynamicSplashNativeModule.hideInternal();
      }
    });
  }

  @ReactMethod
  public void setStorageKey(String key) {
    DynamicSplashNativeModule.setStorageKeyInternal(key);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getStorageKey() {
    return getStorageKeyValue();
  }

  @ReactMethod
  public void getLastLoadedMeta(Promise promise) {
    promise.resolve(lastLoadedMetaRaw);
  }
  
  @ReactMethod
  public void isShowing(Promise promise) {
    boolean showing = overlayDialog != null && overlayDialog.isShowing();
    promise.resolve(showing);
  }
}
