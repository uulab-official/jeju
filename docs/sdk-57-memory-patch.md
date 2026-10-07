# SDK 57 live patch alignment

## Why the memory fix needed a follow-up

Base source: `81b7786e87352a4fcd88840374986f8505ade22e`. That commit fixed the Hermes memory-regression floor with Expo 57.0.9 / React Native 0.86.2. Its bundled version map was older than Expo's live recommendations, and ten existing dependency-validation exclusions hid other advisories.

Mac verification of that exact source on 2026-10-07 at 20:17:11–20:17:30 UTC reported ten visible companion mismatches and Doctor 20/21. The cloud baseline still reported Doctor 21/21 while its direct online install check timed out. A Doctor pass with fallback/cached metadata is therefore not sufficient evidence of current live alignment.

The follow-up uses two official HTTP 200 responses captured at **2026-10-07T20:32:12.797Z**:

- [SDK 57 native module recommendations](https://api.expo.dev/v2/sdks/57.0.0/native-modules)
- [SDK versions and related-package recommendations](https://api.expo.dev/v2/versions/latest)

The native map plus SDK 57 related packages identify 18 outdated direct packages across 30 checked SDK-related dependencies, including Expo's separate `~57.0.27` advisory. This stays within SDK 57. It is not a major upgrade or an unrelated audit fix.

## Direct dependency matrix

All 18 changed declarations are exact pins. Use `npm ci` to reproduce the full locked graph; transitive requirements still contain ranges.

| Package | Before | After |
| --- | --- | --- |
| expo | 57.0.9 | 57.0.27 |
| expo-asset | 57.0.8 | 57.0.19 |
| expo-audio | 57.0.3 | 57.0.5 |
| expo-constants | 57.0.8 | 57.0.21 |
| expo-device | 57.0.1 | 57.0.2 |
| expo-font | 57.0.1 | 57.0.4 |
| expo-haptics | 57.0.1 | 57.0.3 |
| expo-image | 57.0.1 | 57.0.5 |
| expo-linear-gradient | 57.0.1 | 57.0.2 |
| expo-linking | 57.0.4 | 57.0.12 |
| expo-notifications | 57.0.8 | 57.0.22 |
| expo-router | 57.0.9 | 57.0.25 |
| expo-splash-screen | 57.0.5 | 57.0.9 |
| expo-symbols | 57.0.1 | 57.0.3 |
| expo-updates | 57.0.11 | 57.0.25 |
| expo-web-browser | 57.0.2 | 57.0.3 |
| react-native | 0.86.2 | 0.86.3 |
| eslint-config-expo | 57.0.1 | 57.0.2 |

React/React DOM remain 19.2.3, Reanimated remains 4.5.1 and Worklets remains 0.10.1. The locked React types and React Native Web already satisfy the live recommendations and are unchanged.

## Validation exclusions and dependency closure

All ten obsolete `expo.install.exclude` entries were removed. No package version check is bypassed:

| Former exclusion | Resolution |
| --- | --- |
| expo | Aligned to 57.0.27 |
| expo-asset | Aligned to 57.0.19 |
| expo-constants | Aligned to 57.0.21 |
| expo-notifications | Aligned to 57.0.22 |
| expo-router | Aligned to 57.0.25 |
| expo-updates | Aligned to 57.0.25 |
| react-native | Aligned to 0.86.3 |
| react-native-reanimated | Already aligned at 4.5.1; now checked normally |
| react-native-worklets | Already aligned at 0.10.1; now checked normally |
| eslint-config-expo | Aligned to 57.0.2 |

The existing scoped Appwrite override remains scoped to `react-native-appwrite`, but its `expo-file-system` pin changes **57.0.1 → 57.0.7** because Expo 57.0.27 requires `~57.0.7`. This avoids duplicate native file-system installations. Linking 57.0.12 similarly requires one Constants installation at `~57.0.21`.

The normalized lockfile changes 82 existing package versions, adds the Expo CLI dependency `sandbox-cli-detector@0.2.0`, and prunes 20 packages no longer required by the updated graph: 916 → 897 package records. Official package manifests, tarball URLs and integrity values were used. Updates follow required dependency ranges, plus the React Native Metro configuration package's 0.86.3 cohort alignment. No unrelated direct dependencies or new override scopes are introduced.

## Native dependency and configuration matrix

React Native **0.86.2 → 0.86.3** carries Hermes **250829098.0.16 → 250829098.0.17**, with the matching React Native support packages. Beyond the direct packages above, Apple/Android autolinking identifies these changed Expo native dependencies (Glass Effect and JSI are Apple-only in this graph):

| Native dependency | Before | After |
| --- | --- | --- |
| @expo/log-box | 57.0.2 | 57.0.4 |
| @expo/ui | 57.0.8 | 57.0.22 |
| expo-application | 57.0.2 | 57.0.3 |
| expo-eas-client | 57.0.1 | 57.0.5 |
| expo-file-system | 57.0.1 | 57.0.7 |
| expo-glass-effect | 57.0.1 | 57.0.4 |
| expo-json-utils | 57.0.1 | 57.0.2 |
| expo-keep-awake | 57.0.1 | 57.0.2 |
| expo-manifests | 57.0.1 | 57.0.2 |
| expo-modules-core | 57.0.8 | 57.0.21 |
| expo-modules-jsi | 57.0.4 | 57.1.1 |
| expo-structured-headers | 57.0.0 | 57.0.1 |
| expo-updates-interface | 57.0.1 | 57.0.2 |

- Autolinked module names/counts are unchanged: Android 28, Apple 30. Versions change for 26 Android and 29 Apple Expo modules; `swiftui`/`compose` core-feature settings are unchanged
- Resolved public Expo config is exactly equal before/after. App identity, account IDs, feature flags, icon/splash configuration and declared permissions are unchanged
- Approved artwork, launcher fallback and artifact submission/OTA guards are unchanged. Launcher-resource generation regressions pass against the updated prebuild plugin
- Marketing/runtime/build values remain version/runtime **1.0.0**, iOS **26072801**, Android **26072602**. These are preserved source values, not proposed values for another store upload
- The existing ExpoModulesJSI compatibility postinstall script is unchanged. On JSI 57.1.1 it transforms 13 Swift files; two subsequent runs change no files. This is source/idempotence verification, not a Swift compilation result

The graph is **not OTA-compatible with the old binary**. The existing OTA guard rejects the changed manifest and lockfile. Build fresh native binaries on the authorized Mac path, choose compatible runtime/build values through the release procedure, and verify the exact artifacts before updating any native baseline. Do not reuse an uploaded Android versionCode.

Xcode 27/iOS 27 requires Expo's opt-in scene-lifecycle support; this patch does not enable that flag. Confirm the actual Mac toolchain before an iOS build. Source checks cannot establish native compilation, signing, launch behavior, permissions in the final manifests, memory performance or store acceptance.

## Verification on 2026-10-07

- Full cloud clone matched all 395 base repository blobs
- Before changes: 189 existing Node tests pass; new captured-version/exclusion regressions fail in 19 expected cases
- Clean `npm ci`: succeeds, 839 packages installed
- Full Node suite: **210 pass, 0 fail**, including launcher, startup, artifact guards and both collector suites
- Typecheck, lint, startup, visual-assets and public Expo config evaluation pass
- Doctor 1.20.4: **21/21**; `test:sdk`: **23/23**, including captured live minima, no exclusions, single compatible Constants/file-system modules and native/compiler Hermes agreement
- Independent direct comparison against the captured live APIs: **30 checked, 0 mismatches, 0 exclusions**
- An unexcluded online `expo install --check` invocation exits 0, reporting dependencies up to date; `EXPO_OFFLINE` and `EXPO_NO_DEPENDENCY_VALIDATION` are unset. A separate forced-fresh (`EXPO_NO_CACHE=1`) reviewer invocation reaches the remote-map fetch but fails with `HTTP Proxy timed out`. Cloud network/cache behavior is therefore not consistently reliable; the successful direct HTTP 200 map comparison is recorded separately, and Mac must repeat a fresh online CLI check
- Offline check also exits 0, but retains its unreliable-offline warning and is not used as proof of live compatibility
- `npm ls --all` exits 0; this is not a claim that npm emits no optional-package notices
- OTA guard exits 1 as intended, identifying `package.json` and `package-lock.json`

The aggregate `npm run verify` remains **blocked** at the existing server-only `APPWRITE_API_KEY` requirement after the preceding checks pass. Collector tests were also run independently in the full suite. No credentials were copied or fabricated. No native build, deployment, OTA publication or store submission was performed in cloud.
