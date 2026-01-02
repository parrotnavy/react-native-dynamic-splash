package com.reactnativedynamicsplash;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.ImageDecoder;
import android.graphics.drawable.AnimatedImageDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.AttributeSet;
import android.widget.ImageView;

import java.io.File;
import java.io.IOException;

public class AnimatedImageView extends ImageView {
  private AnimatedImageDrawable animatedDrawable;

  public AnimatedImageView(Context context) {
    super(context);
  }

  public AnimatedImageView(Context context, AttributeSet attrs) {
    super(context, attrs);
  }

  public AnimatedImageView(Context context, AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
  }

  public void setImagePath(String path) {
    try {
      if (path == null || path.isEmpty()) {
        return;
      }

      File file = new File(path);
      if (!file.exists()) {
        return;
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        try {
          ImageDecoder.Source source = ImageDecoder.createSource(file);
          Drawable drawable = ImageDecoder.decodeDrawable(source);
          
          if (drawable instanceof AnimatedImageDrawable) {
            animatedDrawable = (AnimatedImageDrawable) drawable;
            animatedDrawable.setRepeatCount(AnimatedImageDrawable.REPEAT_INFINITE);
            setImageDrawable(animatedDrawable);
            animatedDrawable.start();
          } else {
            setImageDrawable(drawable);
          }
        } catch (IOException e) {
          // Silently handle IO errors - image loading is non-critical
        } catch (OutOfMemoryError e) {
          // Silently handle OOM - image might be too large
        }
      } else {
        try {
          android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeFile(path);
          if (bitmap != null) {
            setImageBitmap(bitmap);
          }
        } catch (OutOfMemoryError e) {
          // Silently handle OOM - image might be too large
        }
      }
    } catch (Exception e) {
      // Silently handle any other unexpected exceptions
    }
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    try {
      if (animatedDrawable != null) {
        animatedDrawable.stop();
      }
    } catch (Exception e) {
      // Silently ignore errors when stopping animation
    }
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    try {
      if (animatedDrawable != null) {
        animatedDrawable.start();
      }
    } catch (Exception e) {
      // Silently ignore errors when starting animation
    }
  }
}
