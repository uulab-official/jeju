import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { AppState, Platform } from 'react-native';

import { pingAppwrite } from '../lib/appwrite';
import { readThemePreference } from '../providers/AppThemeProvider';
import { createJejuStartupRuntime } from './jeju-startup';
import { manifestCandidate } from './startup-ota';

export const STARTUP_DECISION_MS = 12_000;
export const STARTUP_OTA_MS = 10_000;
let runtime: ReturnType<typeof createJejuStartupRuntime> | undefined;
let optionalFontsStarted = false;
let nativeSplashHidden = false;

function loadFonts() {
  if (!optionalFontsStarted) {
    optionalFontsStarted = true;
    void Font.loadAsync({
      'Pretendard-100': require('../../assets/fonts/pretendard/Pretendard-Thin.otf'),
      'Pretendard-200': require('../../assets/fonts/pretendard/Pretendard-ExtraLight.otf'),
      'Pretendard-300': require('../../assets/fonts/pretendard/Pretendard-Light.otf'),
      'Pretendard-400': require('../../assets/fonts/pretendard/Pretendard-Regular.otf'),
      'Pretendard-500': require('../../assets/fonts/pretendard/Pretendard-Medium.otf'),
      'Pretendard-600': require('../../assets/fonts/pretendard/Pretendard-SemiBold.otf'),
      'Pretendard-700': require('../../assets/fonts/pretendard/Pretendard-Bold.otf'),
      'Pretendard-800': require('../../assets/fonts/pretendard/Pretendard-ExtraBold.otf'),
      'Pretendard-900': require('../../assets/fonts/pretendard/Pretendard-Black.otf'),
      NanumBold: require('../../assets/fonts/NanumBarunGothicBold.ttf'),
    }).catch(() => {});
  }
  // Historic/private-use Jeju characters have no valid system-font fallback.
  return Font.loadAsync({ NanumOld: require('../../assets/fonts/NanumMyeongjo-YetHangul.ttf') });
}

export function getStartupRuntime() {
  if (runtime) return runtime;
  runtime = createJejuStartupRuntime({
    facts: () => ({
      supported: !__DEV__ && Platform.OS !== 'web' && Constants.appOwnership !== 'expo' && Updates.isEnabled,
      projectId: Constants.easConfig?.projectId ?? null,
      runtimeVersion: Updates.runtimeVersion,
      runningUpdateId: Updates.updateId,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      emergency: Updates.isEmergencyLaunch,
      restartCount: Updates.latestContext?.isRestarting
        ? Math.max(1, Updates.latestContext.restartCount)
        : Updates.latestContext?.restartCount ?? Number.NaN,
      checkAutomatically: Updates.checkAutomatically,
    }),
    prepare: async () => {},
    check: async () => {
      const result = await Updates.checkForUpdateAsync();
      return result.isAvailable ? manifestCandidate(result.manifest, Updates.runtimeVersion) : null;
    },
    fetch: async () => {
      const result = await Updates.fetchUpdateAsync();
      return result.isNew ? manifestCandidate(result.manifest, Updates.runtimeVersion) : null;
    },
    reload: () => Updates.reloadAsync(),
    storage: { get: key => AsyncStorage.getItem(key), set: (key, value) => AsyncStorage.setItem(key, value) },
    nativeSnapshot: () => {
      // Re-read synchronous context at each guard boundary. A React hook snapshot
      // alone can be stale immediately before native reload selection.
      const context = Updates.latestContext;
      return {
        working: !!context && (context.isStartupProcedureRunning || context.isChecking || context.isDownloading),
        pending: context?.isUpdatePending ?? false,
        candidate: manifestCandidate(context?.downloadedManifest, Updates.runtimeVersion),
        downloadProgress: context?.isDownloading ? context.downloadProgress : undefined,
        error: !context || !!(context.rollback || context.checkError || context.downloadError),
      };
    },
    canReload: () => AppState.currentState === 'active',
  }, {
    loadFonts,
    essentialFontsReady: () => Font.isLoaded('NanumOld'),
    readTheme: readThemePreference,
    ping: pingAppwrite,
  }, { deadlineMs: STARTUP_DECISION_MS, otaWindowMs: STARTUP_OTA_MS });
  const created = runtime;
  Updates.addUpdatesStateChangeListener(() => created.observeNative());
  AppState.addEventListener('change', state => {
    if (state === 'background' || state === 'inactive') created.closeOta('background');
  });
  return created;
}

export function hideStartupNativeSplash() {
  if (nativeSplashHidden) return;
  try {
    SplashScreen.hide();
    nativeSplashHidden = true;
  } catch {
    // Fire and observe the compatibility API; never await native hiding in boot.
    try { void SplashScreen.hideAsync().then(() => { nativeSplashHidden = true; }).catch(() => {}); } catch { /* Native splash remains retryable. */ }
  }
}
