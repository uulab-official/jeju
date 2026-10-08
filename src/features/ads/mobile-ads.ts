export async function initializeMobileAds() {
  return false;
}

export async function showMobileAdsPrivacyOptions(): Promise<'shown' | 'not-required' | 'error'> {
  return 'not-required';
}

export function subscribeToAdPrivacyChanges(_listener: () => void) { return () => {}; }
