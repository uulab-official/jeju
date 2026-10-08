import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { StartupSplash } from '@/src/components/StartupSplash';
import { AppThemeProvider, useAppTheme } from '@/src/providers/AppThemeProvider';
import { FavoritesProvider } from '@/src/providers/FavoritesProvider';
import { JejuDataProvider } from '@/src/providers/JejuDataProvider';
import { PlaceDataProvider } from '@/src/providers/PlaceDataProvider';
import { PushNotificationsProvider } from '@/src/providers/PushNotificationsProvider';
import { SavedPlacesProvider } from '@/src/providers/SavedPlacesProvider';
import { type JejuStartupState } from '@/src/startup/jeju-startup';
import { StartupRecovery } from '@/src/startup/StartupRecovery';
import { getStartupRuntime, hideStartupNativeSplash } from '@/src/startup/StartupRuntime';

export { ErrorBoundary } from 'expo-router';

void SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 180, fade: true });

export default function RootLayout() {
  const [state, setState] = useState<JejuStartupState>({ phase: 'loading', fontsReady: false, theme: 'system', progress: 0.08, message: '제주를 준비하고 있어요' });
  const mountRef = useRef<ReturnType<ReturnType<typeof getStartupRuntime>['mount']> | null>(null);

  useEffect(() => {
    // A fresh effect owner also handles StrictMode cleanup/setup. The OTA owner
    // stays sealed while real per-mount font/theme acquisition can refresh.
    const mount = getStartupRuntime().mount();
    mountRef.current = mount;
    const unsubscribe = mount.subscribe(setState);
    void mount.start();
    return () => { unsubscribe(); mount.close('unmount'); if (mountRef.current === mount) mountRef.current = null; };
  }, []);

  useEffect(() => {
    // Committed ready/recovery roots can bypass custom-splash layout entirely.
    if (state.fontsReady || state.phase === 'recovery') hideStartupNativeSplash();
    if (state.phase === 'ready') getStartupRuntime().markAppEntered();
  }, [state.fontsReady, state.phase]);

  if (state.phase === 'recovery') return <StartupRecovery retrying={state.retrying} onLayout={hideStartupNativeSplash} onRetry={() => { void mountRef.current?.retry(); }} />;
  if (!state.fontsReady) return null;
  if (state.phase !== 'ready') return <StartupSplash message={state.message} progress={state.progress} onLayout={hideStartupNativeSplash} />;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppThemeProvider initialMode={state.theme}>
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
    </SafeAreaProvider>
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
        <Stack.Screen name="settings/ad-privacy" />
        <Stack.Screen name="settings/terms" />
      </Stack>
    </ThemeProvider>
  );
}
