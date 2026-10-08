type ConsentInfo = { canRequestAds: boolean };
type ConsentSdk = {
  gatherConsent: () => Promise<ConsentInfo>;
  getConsentInfo: () => Promise<ConsentInfo>;
  initialize: () => Promise<unknown>;
  requestInfoUpdate: () => Promise<{ privacyOptionsRequirementStatus: string }>;
  showPrivacyOptionsForm: () => Promise<unknown>;
};

/** Consent is session-local; human interaction is never expired by an ad load timer. */
export function createConsentController(sdk: ConsentSdk) {
  let preparation: Promise<boolean> | null = null;
  let initialized = false;
  let gathered = false;
  let privacyOpen = false;
  let revision = 0;
  const listeners = new Set<() => void>();
  const changed = () => { revision++; for (const listener of listeners) listener(); };

  function prepare(): Promise<boolean> {
    if (privacyOpen) return Promise.resolve(false);
    if (preparation) return preparation;
    const startingRevision = revision;
    preparation = (async () => {
      const consent = gathered ? await sdk.getConsentInfo() : await sdk.gatherConsent();
      if (!consent.canRequestAds || privacyOpen || startingRevision !== revision) return false;
      gathered = true;
      if (!initialized) { await sdk.initialize(); initialized = true; }
      return !privacyOpen && startingRevision === revision && (await sdk.getConsentInfo()).canRequestAds;
    })().catch(() => false).finally(() => { preparation = null; });
    return preparation;
  }

  async function showPrivacyOptions(): Promise<'shown' | 'not-required' | 'error'> {
    if (privacyOpen) return 'error';
    privacyOpen = true;
    changed();
    try {
      // Avoid presenting two UMP forms concurrently.
      await preparation;
      const info = await sdk.requestInfoUpdate();
      if (info.privacyOptionsRequirementStatus !== 'REQUIRED') return 'not-required';
      await sdk.showPrivacyOptionsForm();
      return 'shown';
    } catch { return 'error'; }
    finally { gathered = false; privacyOpen = false; changed(); }
  }

  return { prepare, showPrivacyOptions, subscribe(listener: () => void) {
    listeners.add(listener); return () => { listeners.delete(listener); };
  } };
}
