export type AdsRuntimeConfig = {
  productionReady: boolean;
  testMode: boolean;
  nativeDiscoverIos: string | null;
  nativeDiscoverAndroid: string | null;
};

export const DISCOVER_AD_AFTER_ORGANIC_COUNT = 5;
export const DISCOVER_AD_MINIMUM_ORGANIC_TOTAL = 6;

export function resolveNativeDiscoverAdUnitId(
  platform: 'ios' | 'android',
  config: AdsRuntimeConfig | null,
) {
  if (!config) return null;
  if (!config.testMode && !config.productionReady) return null;
  return platform === 'ios' ? config.nativeDiscoverIos : config.nativeDiscoverAndroid;
}

export function shouldInsertDiscoverAd({
  index,
  itemCount,
  query = '',
  hasError = false,
}: {
  index: number;
  itemCount: number;
  query?: string;
  hasError?: boolean;
}) {
  return itemCount >= DISCOVER_AD_MINIMUM_ORGANIC_TOTAL
    && index === DISCOVER_AD_AFTER_ORGANIC_COUNT - 1
    && !query.trim()
    && !hasError;
}
