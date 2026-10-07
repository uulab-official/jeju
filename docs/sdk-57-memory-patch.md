# SDK 57 Hermes memory-regression patch

## Decision and sources

Baseline source: `52f8a24cda4e9e79293e824c3a590ea534755fd8`.

The baseline reproduces the official Expo Doctor 1.20.4 warning: 20/21 checks pass, but Expo 57.0.8 and Hermes V1 250829098.0.14 are affected by the Worklets/Reanimated memory regression.

Use the smallest official SDK 57 patch set for this production regression. [Expo's SDK 57 changelog](https://expo.dev/changelog/sdk-57#known-regressions) identifies Expo 57.0.9 with React Native 0.86.2 as the fix. The [React Native 0.86.2 release](https://github.com/react/react-native/releases/tag/v0.86.2) bumps Hermes V1 to 250829098.0.16. Exact supported companion versions come from `bundledNativeModules.json` inside the [official Expo 57.0.9 package](https://registry.npmjs.org/expo/57.0.9).

This does not upgrade the SDK major or select the latest patch indiscriminately. The later development-startup fix in Expo 57.0.17 is a separate change. Xcode 27/iOS 27 has an additional scene-lifecycle requirement; check the actual Mac toolchain before an iOS build rather than silently changing native flags here.

## Direct dependency matrix

Versions below are resolved lockfile versions. The ten updated direct declarations are exact pins to prevent those versions from drifting. Transitive requirements still contain ranges; use `npm ci` for reproducibility of the full release dependency graph.

| Package | Before | After |
| --- | --- | --- |
| expo | 57.0.8 | 57.0.9 |
| react-native | 0.86.0 | 0.86.2 |
| expo-asset | 57.0.7 | 57.0.8 |
| expo-constants | 57.0.7 | 57.0.8 |
| expo-notifications | 57.0.7 | 57.0.8 |
| expo-router | 57.0.8 | 57.0.9 |
| expo-updates | 57.0.10 | 57.0.11 |
| react-native-reanimated | 4.5.0 | 4.5.1 |
| react-native-worklets | 0.10.0 | 0.10.1 |
| eslint-config-expo | 57.0.0 | 57.0.1 |

Only 34 existing package-lock entries change version; the 916 package records and their paths are retained. The other 24 required transitive updates are:

- Hermes compiler: 250829098.0.14 → 250829098.0.16
- Fourteen React Native support packages: 0.86.0 → 0.86.2 (`assets-registry`, `babel-plugin-codegen`, `babel-preset`, `codegen`, `community-cli-plugin`, `debugger-frontend`, `debugger-shell`, `dev-middleware`, `gradle-plugin`, `js-polyfills`, `metro-babel-transformer`, `metro-config`, `normalize-colors`, `virtualized-lists`, all under `@react-native/`)
- `@expo/cli`: 57.0.10 → 57.0.11
- `@expo/inline-modules`: 0.1.3 → 0.1.4
- `@expo/local-build-cache-provider`: 57.0.4 → 57.0.5
- `@expo/log-box`: 57.0.1 → 57.0.2
- `@expo/metro-runtime`: 57.0.7 → 57.0.8
- `@expo/prebuild-config`: 57.0.9 → 57.0.10
- `@expo/ui`: 57.0.7 → 57.0.8
- `babel-preset-expo`: 57.0.4 → 57.0.5
- `expo-modules-core`: 57.0.7 → 57.0.8

The lockfile uses the official registry manifests and tarball integrity values for those versions. npm normalized the result, and a clean `npm ci` installed it successfully. No unrelated audit fix, additional direct dependency, or new override is included. The existing Appwrite file-system override and Expo validation exclusions remain unchanged. `test:sdk`, now part of `verify`, checks every direct SDK package against the installed Expo bundle even if it appears in those exclusions, and checks the native Hermes version as well as the compiler.

## Native change and release matrix

| Area | Result |
| --- | --- |
| Native dependency graph | Changed: React Native/Hermes, Reanimated/Worklets, Expo core/UI/log-box/assets/constants/notifications/router/updates and their build tooling |
| Expo SDK major, React/React DOM | Unchanged: SDK 57, React 19.2.3 |
| ExpoModulesJSI | Unchanged at 57.0.4; the existing postinstall Xcode compatibility patch remains unchanged |
| App configuration and feature flags | Unchanged, including Hermes defaults, New Architecture and launcher selection |
| App identity and account IDs | Unchanged |
| Marketing/runtime/build values | Unchanged: version/runtime 1.0.0, iOS 26072801, Android 26072602 |
| Approved artwork and launcher repair | Unchanged; launcher-generation regressions pass with the updated prebuild plugin |
| Artifact submission guard and OTA baseline | Unchanged; OTA guard rejects the changed package manifest and lockfile against the old binary |

This requires fresh native binaries and is **not OTA-compatible with the old binary**. On the authorized Mac build path, use the exact final source commit, a clean lockfile installation, and the existing release process to choose compatible runtime/build values. Do not reuse an uploaded Android versionCode. Do not regenerate the OTA baseline until the new binaries are independently verified. Cloud tests do not prove native compilation, signing, launch behavior, memory performance, or store acceptance.

## Verification on 2026-10-07

- Baseline: 187 Node tests pass; the new memory-regression guard fails on locked Expo 57.0.8; official Doctor reproduces 20/21
- Candidate: clean `npm ci` succeeds; `npm ls --all` exits 0
- Typecheck, lint, startup check, visual-assets check and public Expo configuration evaluation pass
- Official Expo Doctor: 21/21, including the Hermes regression check
- Expo autolinking resolves on Android and Apple: module counts stay 28 and 30 respectively, with nine Expo package versions changed; no package names or core-feature settings are added or removed
- Full Node suite: 189 pass, 0 fail, including launcher/artifact guards and both collectors
- `test:sdk`: checks locked/installed versions, RN's native Hermes version and all direct SDK companion versions without relying on `install.exclude`
- OTA guard exits 1 as intended, identifying `package.json` and `package-lock.json` as native-sensitive differences
- Offline `expo install --check` reports up to date but warns its validation is unreliable and lists the existing exclusions; this is not treated as standalone compatibility evidence
- Online `expo install --check` was attempted and fails with `HTTP Proxy timed out`; the Mac must repeat that network-dependent check

The aggregate `npm run verify` is **not fully green** in the credential-free cloud checkout: after the passing checks above it stops at the existing server-only `APPWRITE_API_KEY` requirement. The collector tests were run independently as part of the full Node suite. No `.env`, credentials, live-service calls, native build, deployment, OTA publication or store submission was performed.
