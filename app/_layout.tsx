import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';
import 'react-native-reanimated';

import { StartupSplash } from '@/src/components/StartupSplash';
import { pingAppwrite } from '@/src/lib/appwrite';
import { AppThemeProvider, readThemePreference, ThemeMode, useAppTheme } from '@/src/providers/AppThemeProvider';
import { FavoritesProvider } from '@/src/providers/FavoritesProvider';
import { JejuDataProvider } from '@/src/providers/JejuDataProvider';
import { PlaceDataProvider } from '@/src/providers/PlaceDataProvider';
import { PushNotificationsProvider } from '@/src/providers/PushNotificationsProvider';
import { SavedPlacesProvider } from '@/src/providers/SavedPlacesProvider';

export { ErrorBoundary } from 'expo-router';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 180, fade: true });

const OTA_RELOAD_PROGRESS_KEY = '@jeju/startup/ota-progress/v1';
const FONT_LOAD_TIMEOUT_MS = 5_000;
const OTA_CHECK_TIMEOUT_MS = 6_000;
const OTA_FETCH_TIMEOUT_MS = 20_000;
const OTA_RELOAD_TIMEOUT_MS = 6_000;
const APPWRITE_PING_TIMEOUT_MS = 4_000;
const MINIMUM_SPLASH_MS = 650;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NanumOld: require('../assets/fonts/NanumMyeongjo-YetHangul.ttf'),
    NanumBold: require('../assets/fonts/NanumBarunGothicBold.ttf'),
  });
  const [fontWaitExpired, setFontWaitExpired] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('제주를 준비하고 있어요');
  const [progress, setProgress] = useState(0.08);
  const [initialTheme, setInitialTheme] = useState<ThemeMode>('system');
  const progressRef = useRef(0.08);
  const fontReady = loaded || Boolean(error) || fontWaitExpired;

  useEffect(() => {
    if (loaded || error) return;
    const timer = setTimeout(() => setFontWaitExpired(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [error, loaded]);

  useEffect(() => {
    if (!fontReady) return;
    let cancelled = false;
    const startedAt = Date.now();
    const advance = (next: number, nextMessage: string) => {
      if (cancelled) return;
      progressRef.current = Math.max(progressRef.current, Math.min(1, next));
      setProgress(progressRef.current);
      setMessage(nextMessage);
    };

    const boot = async () => {
      const restored = Number(await AsyncStorage.getItem(OTA_RELOAD_PROGRESS_KEY).catch(() => null));
      if (Number.isFinite(restored)) {
        progressRef.current = Math.max(progressRef.current, Math.min(0.94, restored));
        setProgress(progressRef.current);
      }

      await SplashScreen.hideAsync().catch(() => undefined);
      advance(0.28, '최신 업데이트를 확인하고 있어요');

      if (!__DEV__ && Updates.isEnabled) {
        try {
          const update = await withTimeout(Updates.checkForUpdateAsync(), OTA_CHECK_TIMEOUT_MS, 'OTA 업데이트 확인');
          if (update.isAvailable) {
            advance(0.68, '업데이트를 받고 있어요');
            await withTimeout(Updates.fetchUpdateAsync(), OTA_FETCH_TIMEOUT_MS, 'OTA 업데이트 다운로드');
            advance(0.94, '새로운 제주로 이동하고 있어요');
            await AsyncStorage.setItem(OTA_RELOAD_PROGRESS_KEY, String(progressRef.current)).catch(() => undefined);
            await withTimeout(Updates.reloadAsync(), OTA_RELOAD_TIMEOUT_MS, 'OTA 업데이트 적용');
            return;
          }
        } catch (cause) {
          if (__DEV__) console.warn('Startup OTA check failed', cause);
        }
      }

      await AsyncStorage.removeItem(OTA_RELOAD_PROGRESS_KEY).catch(() => undefined);
      advance(0.78, '저장된 제주와 연결하고 있어요');
      const [theme] = await Promise.all([
        readThemePreference().catch(() => 'system' as ThemeMode),
        withTimeout(pingAppwrite(), APPWRITE_PING_TIMEOUT_MS, 'Appwrite 연결').catch(() => undefined),
      ]);
      if (!cancelled) setInitialTheme(theme);
      advance(1, '준비 완료');

      const remaining = Math.max(0, MINIMUM_SPLASH_MS - (Date.now() - startedAt));
      await new Promise((resolve) => setTimeout(resolve, remaining + 180));
      if (!cancelled) setReady(true);
    };

    void boot().catch(async () => {
      await SplashScreen.hideAsync().catch(() => undefined);
      if (cancelled) return;
      setProgress(1);
      setMessage('저장된 제주로 시작해요');
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fontReady]);

  if (!fontReady) return null;
  if (!ready) return <StartupSplash message={message} progress={progress} />;

  return (
    <AppThemeProvider initialMode={initialTheme}>
      <JejuDataProvider>
        <PlaceDataProvider>
          <FavoritesProvider>
            <SavedPlacesProvider>
              <PushNotificationsProvider>
                <Navigation />
              </PushNotificationsProvider>
            </SavedPlacesProvider>
          </FavoritesProvider>
        </PlaceDataProvider>
      </JejuDataProvider>
    </AppThemeProvider>
  );
}

function Navigation() {
  const { colors, isDark } = useAppTheme();
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };
  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="library/[kind]" />
        <Stack.Screen name="detail/[kind]/[id]" />
        <Stack.Screen name="places/[id]" />
        <Stack.Screen name="guides/[id]" />
        <Stack.Screen name="trip-prep" />
        <Stack.Screen name="history/index" />
        <Stack.Screen name="history/[id]" />
        <Stack.Screen name="language/search" />
        <Stack.Screen name="language/notation" />
        <Stack.Screen name="media/[placeId]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/theme" />
        <Stack.Screen name="settings/notifications" />
        <Stack.Screen name="settings/data-status" />
        <Stack.Screen name="settings/support" />
        <Stack.Screen name="settings/about" />
        <Stack.Screen name="settings/notices" />
        <Stack.Screen name="settings/faq" />
        <Stack.Screen name="settings/privacy" />
        <Stack.Screen name="settings/terms" />
      </Stack>
    </ThemeProvider>
  );
}

async function withTimeout<T>(request: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`${label} 시간이 초과됐습니다.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
