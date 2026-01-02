
import { type JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, NativeModules, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StoredMeta } from '../../dist';
import { createDynamicSplash, DynamicSplash } from '../../dist';
import { splashConfig } from './splashConfig';

const DEFAULT_STORAGE_KEY = 'DYNAMIC_SPLASH_META_V1';

function App(): JSX.Element {
  const [storedMeta, setStoredMeta] = useState<StoredMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [nativeMeta, setNativeMeta] = useState<string | null>(null);
  const [nativeMetaError, setNativeMetaError] = useState<string | null>(null);
  const [storageKey, setStorageKey] = useState<string>(DEFAULT_STORAGE_KEY);
  const manager = useMemo(() => createDynamicSplash(splashConfig), []);

  const loadStorageKey = useCallback(async () => {
    const fallbackKey = splashConfig.storageKey ?? DEFAULT_STORAGE_KEY;
    try {
      const getNativeKey = NativeModules.DynamicSplashNative?.getStorageKey;
      if (typeof getNativeKey === 'function') {
        const nativeKey = await getNativeKey();
        if (typeof nativeKey === 'string' && nativeKey.length > 0) {
          setStorageKey(nativeKey);
          return;
        }
      }
    } catch {
      // ignore and fallback
    }
    setStorageKey(fallbackKey);
  }, []);

  const loadStoredMeta = useCallback(async () => {
    try {
      const getStringSync = NativeModules.DynamicSplashStorage?.getStringSync;
      const getStringAsync = NativeModules.DynamicSplashStorage?.getString;
      let raw: string | null = null;
      if (typeof getStringSync === 'function') {
        raw = getStringSync(storageKey);
      } else if (typeof getStringAsync === 'function') {
        raw = await getStringAsync(storageKey);
      } else {
        setStoredMeta(null);
        setMetaError('DynamicSplashStorage.getString is unavailable');
        return;
      }
      if (!raw) {
        setStoredMeta(null);
        setMetaError(null);
        return;
      }
      setStoredMeta(JSON.parse(raw) as StoredMeta);
      setMetaError(null);
    } catch (error) {
      setStoredMeta(null);
      setMetaError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [storageKey]);

  const loadNativeMeta = useCallback(async () => {
    try {
      const getLastLoadedMeta = NativeModules.DynamicSplashNative?.getLastLoadedMeta;
      console.log('[SampleApp] getLastLoadedMeta', NativeModules?.DynamicSplashNative);
      if (typeof getLastLoadedMeta !== 'function') {
        setNativeMeta(null);
        setNativeMetaError('DynamicSplashNative.getLastLoadedMeta is unavailable');
        return;
      }
      const value = await getLastLoadedMeta();
      setNativeMeta(typeof value === 'string' ? value : null);
      setNativeMetaError(null);
    } catch (error) {
      setNativeMeta(null);
      setNativeMetaError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    void manager.mount();
  }, [manager]);

  useEffect(() => {
    void loadStorageKey();
  }, [loadStorageKey]);

  useEffect(() => {
    void loadStoredMeta();
  }, [loadStoredMeta]);

  useEffect(() => {
    void loadNativeMeta();
  }, [loadNativeMeta]);

  useEffect(() => {
    const hasNativeStorage = !!NativeModules.DynamicSplashStorage;
    const hasNativeOverlay = !!NativeModules.DynamicSplashNative;
    console.log('[SampleApp] Native module link check', {
      hasNativeStorage,
      hasNativeOverlay,
    });

    // console.log(Object.keys(NativeModules.DynamicSplashStorage || {}));
    console.log("keys", Object.keys(NativeModules.DynamicSplashStorage || {}));

    setTimeout(() => {
      DynamicSplash.hide();
    }, 3000);
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Dynamic Splash Sample</Text>

        <View style={styles.card}>
          <Text>This app demonstrates the dynamic splash library.</Text>
          <Text>Edit splash.json to change the splash image.</Text>
        </View>

        <Button
          title="Refresh StoredMeta"
          onPress={() => {
            void loadStoredMeta();
          }}
        />

        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>StoredMeta</Text>
          {metaError ? (
            <Text style={styles.metaError}>{metaError}</Text>
          ) : (
            <Text style={styles.metaText}>
              {storedMeta ? JSON.stringify(storedMeta, null, 2) : 'No stored meta'}
            </Text>
          )}
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>Native LastLoadedMeta</Text>
          {nativeMetaError ? (
            <Text style={styles.metaError}>{nativeMetaError}</Text>
          ) : (
            <Text style={styles.metaText}>
              {nativeMeta ?? 'No native meta'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 24,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  metaCard: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
  },
  metaTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  metaText: {
    color: '#E5E7EB',
    fontFamily: 'Menlo',
    fontSize: 12,
  },
  metaError: {
    color: '#FCA5A5',
    fontSize: 12,
  },
});

export default App;
