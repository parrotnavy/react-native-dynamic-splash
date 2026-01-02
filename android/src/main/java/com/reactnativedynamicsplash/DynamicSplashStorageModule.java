package com.reactnativedynamicsplash;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class DynamicSplashStorageModule extends ReactContextBaseJavaModule {
  private static final String MODULE_NAME = "DynamicSplashStorage";

  public DynamicSplashStorageModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return MODULE_NAME;
  }

  private SharedPreferences getPrefs() {
    try {
      Context context = getReactApplicationContext();
      if (context == null) {
        return null;
      }
      return context.getSharedPreferences(StorageConstants.PREFS_NAME, Context.MODE_PRIVATE);
    } catch (Exception e) {
      return null;
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getStringSync(String key) {
    try {
      SharedPreferences prefs = getPrefs();
      if (prefs == null) {
        return null;
      }
      return prefs.getString(key, null);
    } catch (Exception e) {
      return null;
    }
  }

  @ReactMethod
  public void getString(String key, Promise promise) {
    try {
      SharedPreferences prefs = getPrefs();
      if (prefs == null) {
        promise.resolve(null);
        return;
      }
      promise.resolve(prefs.getString(key, null));
    } catch (Exception e) {
      promise.reject("ERROR", "Failed to get string from storage", e);
    }
  }

  @ReactMethod
  public void setString(String key, String value) {
    try {
      SharedPreferences prefs = getPrefs();
      if (prefs == null) {
        return;
      }
      SharedPreferences.Editor editor = prefs.edit();
      if (value == null) {
        editor.remove(key);
      } else {
        editor.putString(key, value);
      }
      editor.apply();
    } catch (Exception e) {
      // Silently fail - storage operations are non-critical
    }
  }

  @ReactMethod
  public void remove(String key) {
    try {
      SharedPreferences prefs = getPrefs();
      if (prefs == null) {
        return;
      }
      prefs.edit().remove(key).apply();
    } catch (Exception e) {
      // Silently fail - storage operations are non-critical
    }
  }
}
