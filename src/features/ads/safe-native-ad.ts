import type { NativeAd } from 'react-native-google-mobile-ads';

/** NativeAd is a SharedObject; cleanup must remain best-effort and never crash JS. */
export function safeDestroyNativeAd(ad: NativeAd | null | undefined) {
  try {
    ad?.destroy();
  } catch {
    // The native object may already be released by the SDK or an unmount race.
  }
}
