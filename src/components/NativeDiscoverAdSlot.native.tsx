import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import type { NativeAd } from 'react-native-google-mobile-ads';

import { getNativeDiscoverAdUnitId } from '@/src/features/ads/config';
import { initializeMobileAds, subscribeToAdPrivacyChanges } from '@/src/features/ads/mobile-ads';
import { safeDestroyNativeAd } from '@/src/features/ads/safe-native-ad';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { layout, typography } from '@/src/theme/tokens';

type GoogleMobileAdsModule = typeof import('react-native-google-mobile-ads');
type LoadState = 'loading' | 'ready' | 'empty';

export const nativeAdLoadTimeoutMs = 8_000;

const SLOT_HEIGHT = 360;

function getGoogleMobileAds(): GoogleMobileAdsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-google-mobile-ads') as GoogleMobileAdsModule;
  } catch {
    return null;
  }
}

export function NativeDiscoverAdSlot() {
  const { colors } = useAppTheme();
  const ads = getGoogleMobileAds();
  const [privacyRevision, setPrivacyRevision] = useState(0);
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [loadState, setLoadState] = useState<LoadState>(() => ads ? 'loading' : 'empty');
  const cancelPendingAd = useRef<(() => void) | null>(null);
  useEffect(() => subscribeToAdPrivacyChanges(() => {
    // Invalidate synchronously: native promises can settle before React cleanup.
    cancelPendingAd.current?.();
    setNativeAd(null);
    setLoadState('empty');
    setPrivacyRevision(value => value + 1);
  }), []);

  useEffect(() => {
    if (!ads) return;
    const adsModule = ads;
    let active = true;
    let loadedAd: NativeAd | null = null;
    const cancel = () => {
      active = false;
      safeDestroyNativeAd(loadedAd);
      loadedAd = null;
    };
    cancelPendingAd.current = cancel;

    async function load() {
      const adUnitId = getNativeDiscoverAdUnitId();
      const initialized = await initializeMobileAds();
      const nativeAdComponents = resolveNativeAdComponents(adsModule);
      if (!adUnitId || !initialized || !nativeAdComponents || !active) {
        if (active) setLoadState('empty');
        return;
      }

      let requestTimedOut = false;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const request = adsModule.NativeAd.createForAdRequest(adUnitId, {
          adChoicesPlacement: adsModule.NativeAdChoicesPlacement.TOP_RIGHT,
          requestAgent: 'SorangJeju',
          requestNonPersonalizedAdsOnly: true,
          startVideoMuted: true,
        }).then((nativeAd) => {
          if (requestTimedOut || !active) {
            safeDestroyNativeAd(nativeAd);
            return null;
          }
          return nativeAd;
        });
        const timeout = new Promise<NativeAd | null>((resolve) => {
          timeoutId = setTimeout(() => {
            requestTimedOut = true;
            resolve(null);
          }, nativeAdLoadTimeoutMs);
        });
        loadedAd = await Promise.race([request, timeout]);
        if (!loadedAd || !active) {
          if (loadedAd) safeDestroyNativeAd(loadedAd);
          if (active) setLoadState('empty');
          return;
        }
        setNativeAd(loadedAd);
        setLoadState('ready');
      } catch {
        if (active) setLoadState('empty');
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }

    void load().catch(() => {
      if (active) setLoadState('empty');
    });
    return () => {
      cancel();
      if (cancelPendingAd.current === cancel) cancelPendingAd.current = null;
    };
  }, [ads, privacyRevision]);

  if (!ads || loadState !== 'ready' || !nativeAd) {
    return (
      <View
        accessibilityLabel={loadState === 'loading' ? '광고 불러오는 중' : '제주 여행 팁'}
        style={[styles.slot, styles.fallback, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      >
        {loadState === 'loading' ? (
          <>
            <ActivityIndicator color={colors.primaryStrong} size="small" />
            <Text style={[styles.fallbackText, { color: colors.muted }]}>여행 정보를 준비하고 있어요</Text>
          </>
        ) : (
          <>
            <Text style={[styles.tipEyebrow, { color: colors.primaryStrong }]}>소랑제주 여행 팁</Text>
            <Text style={[styles.tipTitle, { color: colors.text }]}>바람이 강한 날에는 해안보다 숲길을 먼저 살펴보세요</Text>
            <Text style={[styles.fallbackText, { color: colors.muted }]}>날씨와 현장 안내를 확인하고 여유 있는 동선으로 이동하면 좋아요.</Text>
          </>
        )}
      </View>
    );
  }

  const nativeAdComponents = resolveNativeAdComponents(ads);
  if (!nativeAdComponents) {
    return (
      <View
        accessibilityLabel="제주 여행 팁"
        style={[styles.slot, styles.fallback, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      >
        <Text style={[styles.tipEyebrow, { color: colors.primaryStrong }]}>소랑제주 여행 팁</Text>
        <Text style={[styles.tipTitle, { color: colors.text }]}>바람이 강한 날에는 해안보다 숲길을 먼저 살펴보세요</Text>
        <Text style={[styles.fallbackText, { color: colors.muted }]}>날씨와 현장 안내를 확인하고 여유 있는 동선으로 이동하면 좋아요.</Text>
      </View>
    );
  }

  const { NativeAdView, NativeMediaView, NativeAsset, NativeAssetType } = nativeAdComponents;
  return (
    <NativeAdView
      accessibilityLabel="광고"
      nativeAd={nativeAd}
      style={{ width: '100%' }}
    >
      <View collapsable={false} style={[styles.slot, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.nativeContent}>
          <View style={styles.heading}>
            {nativeAd.icon ? (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image source={{ uri: nativeAd.icon.url }} style={styles.icon} />
              </NativeAsset>
            ) : null}
            <View style={styles.headingCopy}>
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text numberOfLines={1} style={[styles.headline, { color: colors.text }]}>{nativeAd.headline}</Text>
              </NativeAsset>
              <View style={styles.sponsorRow}>
                <Text style={[styles.badge, { color: colors.primaryStrong, borderColor: colors.primaryStrong }]}>광고</Text>
                {nativeAd.advertiser ? (
                  <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                    <Text numberOfLines={1} style={[styles.advertiser, { color: colors.muted }]}>{nativeAd.advertiser}</Text>
                  </NativeAsset>
                ) : null}
              </View>
            </View>
          </View>
          {nativeAd.mediaContent ? <NativeMediaView resizeMode="contain" style={styles.media} /> : null}
          {nativeAd.body ? (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text numberOfLines={2} style={[styles.body, { color: colors.muted }]}>{nativeAd.body}</Text>
            </NativeAsset>
          ) : null}
          {nativeAd.callToAction ? (
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <Text numberOfLines={1} style={[styles.cta, { color: colors.onPrimary, backgroundColor: colors.primary }]}>{nativeAd.callToAction}</Text>
            </NativeAsset>
          ) : null}
        </View>
      </View>
    </NativeAdView>
  );
}

function resolveNativeAdComponents(ads: GoogleMobileAdsModule | null) {
  if (!ads || !ads.NativeAdView || !ads.NativeMediaView || !ads.NativeAsset || !ads.NativeAssetType) {
    return null;
  }

  return {
    NativeAdView: ads.NativeAdView,
    NativeMediaView: ads.NativeMediaView,
    NativeAsset: ads.NativeAsset,
    NativeAssetType: ads.NativeAssetType,
  };
}

const styles = StyleSheet.create({
  slot: { height: SLOT_HEIGHT, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  nativeContent: { flex: 1, paddingVertical: 12, gap: 6 },
  fallback: { justifyContent: 'center', paddingHorizontal: layout.screenPadding, paddingVertical: 12 },
  fallbackText: { ...typography.body, fontSize: 12, lineHeight: 17 },
  tipEyebrow: { ...typography.label, fontSize: 11, letterSpacing: 0.4 },
  tipTitle: { ...typography.subheading, fontSize: 15, lineHeight: 20 },
  heading: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 34 },
  media: { width: '100%', height: 180 },
  icon: { width: 36, height: 36, borderRadius: 9 },
  headingCopy: { flex: 1, gap: 3 },
  headline: { ...typography.subheading, fontSize: 14, lineHeight: 18 },
  sponsorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 4, fontSize: 10, lineHeight: 14, fontFamily: 'Pretendard-700' },
  advertiser: { flex: 1, ...typography.caption, fontSize: 11 },
  body: { ...typography.body, fontSize: 11, lineHeight: 15 },
  cta: { minHeight: 44, borderRadius: 12, paddingHorizontal: 14, fontFamily: 'Pretendard-800', fontSize: 14, lineHeight: 44, textAlign: 'center', overflow: 'hidden' },
});
