# Jeju AdMob candidate — release gates

This change restores the existing Jeju native Discover placement from the preserved Mac worktree. It does not establish ad serving, revenue, or store approval. The already-built `1.0.1 / 26100801` Android AAB has no Google Mobile Ads SDK and must not be submitted as the ad-complete candidate.

## Implemented scope

- Reuse the four issued Jeju app/unit IDs via the existing credential wrapper. Their SHA-256 fingerprints match the central `uulab.official` registry; values are not committed. Production EAS profiles reject missing, malformed, Google sample, or forced-test configuration. Local profiles use Google's sample IDs.
- Pin `react-native-google-mobile-ads` to the existing integration's `16.0.3` and Expo-compatible `expo-build-properties` to `57.0.22`. Expo `57.0.27`, React Native `0.86.3`, and Hermes remain unchanged.
- One labelled native ad follows five organic Discover cards, only when at least six places are present, no search is active, and there is no data error. Include registered assets, media, AdChoices space, muted video, non-personalized requests, timeout cleanup, and an organic fallback.
- Gather UMP consent before SDK initialization/ad requests, delay measurement, share concurrent initialization, retry failed/denied attempts, and recheck permission after privacy changes. Human consent forms are not limited to the ad-load timeout. The app remains usable independently of ads.
- Restore R8 minification/resource shrinking and the optimized ProGuard file with the UMP keep rule. Current ad-free AAB has neither minification nor an R8 mapping. Android recommends release optimization; this investigation did not establish R8-off alone as a Google Play submission blocker.
- New native runtime: `jeju-sdk57.0.27-rn0.86.3-20261008-admob16`. This is required because the native module graph changed. Old ad-free runtime overrides are rejected. Existing build numbers are deliberately unchanged pending a fresh store maximum check and one coordinated candidate allocation; do not build this commit as-is with the old candidate's number.

No applicable shared ads package was found in the checked Expo package manifests. The existing project-local Jeju implementation and central ID registry are reused. Do not import the unrelated games ads package or modify other apps.

## Before one final native candidate

1. Read the current Jeju AdMob console using an existing authenticated session: Android store association, app readiness, native unit binding, and published applicable UMP messages for both platforms. The dated 2026-09-16 checkpoint says Android `STORE_LINK_BLOCKED`, iOS `READY`; this is historical, not a current readback. The existing Mac credential wrapper exposes no AdMob OAuth refresh credentials. No new OAuth/account/key was created.
2. Confirm the intended iOS ATT/privacy-message behavior against the app's actual non-personalized configuration. A localized tracking usage description is included for UMP's ATT path, but no ATT permission or consent outcome is fabricated. Confirm Android advertising-ID and ads-present declarations.
3. Reconcile live Play Data safety and App Store privacy with the exact bundled SDKs and observed data handling. The existing local App Store payload declares only `DEVICE_ID / APP_FUNCTIONALITY`; it is not an ad-complete declaration and has not been uploaded. The public privacy policy mentions Google Mobile Ads, but that does not prove the store forms match. The current Google disclosure guide covers SDK 25.5.0, while this pinned wrapper declares Android Mobile Ads 24.9.0, so do not mechanically copy the latest guide as a certified declaration for this build.
4. Check the registered publisher in public `app-ads.txt` and AdMob's crawler status. The Mac read returned HTTP 403; this does not prove the file is absent or that Google's crawler is blocked.
5. Parent confirms exact source, ad/config scope, remaining disk and no competing native build. Fresh store readback determines unique iOS/Android build numbers. Atomically acquire the shared native lock using this run's PID and nonce, then build sequentially with existing signing material. No native build was started for this ads change.

## Validation and submission sequence

- Source checks: ads behavior tests, full existing tests, typecheck/lint, Expo Doctor, Expo dependency alignment, public config and Expo plugin introspection. Inspect both app IDs by fingerprints, delayed measurement, platform unit mapping, R8 flags, optimized ProGuard transformation and consent keep rule.
- The source checks do not replace device testing. Build the exact production candidate once after the gates above. Verify signing, package/version/runtime, Google Ads/UMP presence, release R8 mapping, and generated manifest/Info.plist. Use the exact AAB/IPA and explicit artifact manifest for upload; never `--latest`.
- On a test device/emulator recognized by Google, verify native test creatives, ad disclosure/AdChoices/media, consent required/denied/unavailable, privacy choice changes, offline/no-fill fallback, navigation away during load, and all five app tabs. Do not click live ads. Keep the core app usable when advertising fails.
- Submit only after candidate QA and store metadata are agreed. Android review submission and iOS binary/upload/review are separate gates; none was performed by this source change.
- Revenue completion requires post-release AdMob delivery/impression/revenue readback. Store review and ad readiness timing are external; neither a review completion date nor revenue is promised here.

## Reference guidance

- [Android release optimization](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization)
- [UMP consent handling](https://developers.google.com/admob/android/privacy)
- [React Native Google Mobile Ads consent and ProGuard configuration](https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent)
- [Google Mobile Ads data disclosure guide](https://developers.google.com/admob/android/privacy/play-data-disclosure)
- [Native ad assets and lifecycle](https://developers.google.com/admob/android/native/advanced)
- [Current UULab privacy policy](https://uulab.co.kr/privacy/)
