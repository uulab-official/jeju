import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { AdsRuntimeConfig, resolveNativeDiscoverAdUnitId } from './model';

type ExpoExtra = {
  admob?: Partial<AdsRuntimeConfig>;
};

export function getAdsRuntimeConfig(): AdsRuntimeConfig | null {
  const raw = (Constants.expoConfig?.extra as ExpoExtra | undefined)?.admob;
  if (!raw) return null;
  return {
    productionReady: raw.productionReady === true,
    testMode: raw.testMode !== false,
    nativeDiscoverIos: typeof raw.nativeDiscoverIos === 'string' ? raw.nativeDiscoverIos : null,
    nativeDiscoverAndroid: typeof raw.nativeDiscoverAndroid === 'string' ? raw.nativeDiscoverAndroid : null,
  };
}

export function getNativeDiscoverAdUnitId() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  return resolveNativeDiscoverAdUnitId(Platform.OS, getAdsRuntimeConfig());
}
