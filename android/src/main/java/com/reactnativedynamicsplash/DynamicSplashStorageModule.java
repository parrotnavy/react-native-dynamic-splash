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
    Context context = getReactApplicationContext();
    return context.getSharedPreferences(StorageConstants.PREFS_NAME, Context.MODE_PRIVATE);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getStringSync(String key) {
    return getPrefs().getString(key, null);
  }

  @ReactMethod
  public void getString(String key, Promise promise) {
    promise.resolve(getPrefs().getString(key, null));
  }

  @ReactMethod
  public void setString(String key, String value) {
    SharedPreferences.Editor editor = getPrefs().edit();
    if (value == null) {
      editor.remove(key);
    } else {
      editor.putString(key, value);
    }
    editor.apply();
  }

  @ReactMethod
  public void remove(String key) {
    getPrefs().edit().remove(key).apply();
  }
}
