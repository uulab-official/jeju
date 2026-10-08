import { createConsentController } from './consent-controller';

type GoogleMobileAdsModule = typeof import('react-native-google-mobile-ads');
let controller: ReturnType<typeof createConsentController> | null = null;
function getController() {
  if (controller) return controller;
  try {
    // Expo Go has no ad module. Production config always includes the native SDK.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ads = require('react-native-google-mobile-ads') as GoogleMobileAdsModule;
    controller = createConsentController({
      gatherConsent: () => ads.AdsConsent.gatherConsent(),
      getConsentInfo: () => ads.AdsConsent.getConsentInfo(),
      initialize: () => ads.default().initialize(),
      requestInfoUpdate: () => ads.AdsConsent.requestInfoUpdate(),
      showPrivacyOptionsForm: () => ads.AdsConsent.showPrivacyOptionsForm(),
    });
  } catch { return null; }
  return controller;
}
export async function initializeMobileAds() { return getController()?.prepare() ?? false; }
export async function showMobileAdsPrivacyOptions(): Promise<'shown' | 'not-required' | 'error'> {
  return getController()?.showPrivacyOptions() ?? 'error';
}
export function subscribeToAdPrivacyChanges(listener: () => void) {
  return getController()?.subscribe(listener) ?? (() => {});
}
