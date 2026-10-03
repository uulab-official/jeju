# Jeju startup update contract

## Scope and compatibility

This change is JavaScript-only startup ownership and recovery. It preserves the `kr.co.uulab.jeju` identity, existing native/runtime/EAS configuration, provider tree, local-only favorites/theme, all eleven bundled font assets, and the existing custom splash mark, colors, typography, text and reduced-motion implementation. `StartupSplash` changes only by accepting a native-hide layout callback.

The pinned source is `9689169a6476364ef8868bc585a240894b03d89a`. Despite the old SDK 56 wording in `AGENTS.md`, its lock actually resolves Expo 57.0.8, expo-updates 57.0.10, expo-font 57.0.1 and expo-splash-screen 57.0.5. No dependency upgrade is part of this change.

## Bounded readiness

- One JS-runtime OTA owner starts a 10-second decision window including font/theme acquisition, check/fetch and persistent candidate guarding. A per-mount 12-second whole decision budget includes the existing 650ms visible custom-splash minimum and 180ms finish; font acquisition does not consume the visible minimum, and neither finish nor stalled native reload extends the whole budget. Both budgets are configurable in the pure owner.
- NanumOld is essential. Its bundled NanumMyeongjo-YetHangul asset is acquired separately from decorative fonts and is confirmed with `Font.isLoaded('NanumOld')`. Historic/private-use old-Hangul content and the branded custom text never mount with missing essential font data.
- Essential font failure or a five-second wait produces a matching modern-Korean system-font recovery screen. Retry has another bounded acquisition window, remains visibly on recovery while pending, and never creates another OTA owner. A late successful font load cannot silently dismiss recovery; an explicit retry can then enter safely.
- Only pending font operations are shared. Retries do not start duplicates while native acquisition is still pending. Successful theme values are not cached by the singleton. Each genuine mount reads the current local preference, bounded at two seconds with `system` fallback. If a previous mount's read is pending, a fresh read is serialized after it completes, within the new mount's same budget; its old value is not reused as `initialMode`. This acquisition has its own absolute deadline, capped by whole-mount expiry, and is invalidated when its bounded wait settles. Read continuation, queued native dispatch and theme publication each recheck that deadline. Timer delays, an exact two-second boundary and still-pending fonts cannot extend theme acquisition or start another late read.
- Existing Appwrite ping stays best effort and runs once. Its result does not gate readiness or change account/theme behavior. No account/auth feature is added.
- Native splash hiding is fire-and-observe. Custom splash and recovery layout callbacks cover visible handoff; a committed-root effect independently covers quick-ready/remount paths. Native hiding is never awaited by the decision owner.

## OTA safety

The reviewed shared gate owns native/manual policy arbitration, candidate compatibility, runtime/project checks, monotonic progress and durable candidate attempts. The adapter reads synchronous `Updates.latestContext` at every safety boundary rather than relying on a stale React hook snapshot. A native automatic policy or ongoing native work owns its own check/download; JavaScript does not duplicate it.

Background/inactive, app entry, recovery interaction, unmount and decision expiry permanently seal OTA for this JS runtime. Font/theme readiness may refresh on a new mount without reopening OTA. Current AppState and mount/entry state are checked before reload. Candidate attempts are persisted before a single native reload request; running candidate plus actual app entry is the only success diagnostic. Storage/read/write errors fail open to safe readiness while suppressing unsafe reload.

Native work cannot be canceled. A late download may cache for a later cold start, but no closed continuation requests reload. An already-issued native reload also cannot be canceled, and its Promise resolving is not evidence that the downloaded bundle ran.

The former global progress number is no longer treated as activation state. Progress remains startup presentation; only the scoped durable candidate record prevents activation loops.

## Verification

Run `node --test tests/*.test.mjs` for the startup controller, shared gate, installed-API adapter boundary, exact splash wiring and configuration-check regressions. Native boundaries are injected in Node tests; these are not device tests. The configuration checker uses lexical/structural inspection of executable code: the real services object's NanumOld callback and asset, permanent `closeOta` body, direct per-attempt whole deadline call, and imported recovery screen dependency. Its fixed services contract normalizes plain quoted literal keys and rejects duplicate normalized names, computed/spread entries and escaped-key ambiguity. A genuine quoted readiness key is accepted; an overriding quoted/computed/spread callback is rejected. Comments and string lookalikes do not satisfy critical checks. This is a narrow source contract check, not a proof of arbitrary JavaScript or native behavior.

Cloud validation of this payload:

- 113 startup regressions pass, retaining all 95 original cases and adding local-theme absolute deadline/queued-dispatch and executable-checker/services-key mutations, alongside essential-font hang/error/retry, visible retry recovery, stale pending-theme remount, duplicate fetch/reload protection, policy ownership, synchronous native candidate/AppState vetoes, native-hide fallback, visible custom-splash minimum, total budget and exact splash/navigation/font invariants
- The unchanged independently authored exact-source React/native-boundary fixture has 20/20 passes after reproducing its 14-pass/6-fail review baseline. It verifies real root mounting, essential-font recovery/retry, theme remounts/deadline edges, native handoff/ownership, candidate/AppState/rollback/restart vetoes and checker safety mutations. Its native dependencies are test ports; it does not prove released-device behavior
- An unchanged independent supplemental checker fixture has 3/3 passes after reproducing its 0-pass/3-fail baseline for quoted, computed and spread readiness overrides. This final correction changes checker/tests/docs only; the verified runtime, UI, native/provider/dependency bytes are preserved
- Original `npm run test:data`: tourism collector 3/3 passes; culture collector is blocked before behavior tests by missing `fast-xml-parser`
- Original `npm run verify`, `npm run typecheck` and `npm run lint` cannot run in this partial cloud snapshot because the local TypeScript/Expo CLI dependency installation is absent
- Expo dependency/config checks were attempted with offline, no-install npm execution; both stop at `ENOTCACHED` because the Expo CLI is unavailable. No replacement CLI was installed or downloaded to run them
- The exact lock TypeScript 6.0.3 compiler passes strict checks for both pure owners. A separate scoped adapter check passes against exact locked Expo Updates/Font/Splash/Constants declarations, with explicit unrelated storage/RN/backend/provider type boundaries. It does not validate full application UI or missing transitive/native dependencies
- The six already-materialized official registry archives match their locked SHA512 integrity. An acquisition status poll was canceled; one authorized identical status retry found no process. No duplicate download, dependency install, install/lifecycle script, SDK/native build or authorization change was used to fill the gaps
- Pinned complete tree inspection contains only `.github/workflows/data-health.yml`, scheduled/manual data-health checking, and no `.eas/workflows` or source-push OTA trigger. This source work does not publish or invoke OTA

Before OTA, the coordinator must independently review the exact payload and run the original repository checks in a suitable existing dependency/native environment. Released-binary project/runtime linkage, custom-to-native splash appearance, actual old-Hangul rendering, reduced-motion behavior, background/foreground behavior and already-issued reload behavior still require release-build iOS/Android verification. JavaScript API/type evidence does not prove those installed-binary facts.

Official API references: [Expo SDK 57 Updates](https://docs.expo.dev/versions/v57.0.0/sdk/updates/), [Font](https://docs.expo.dev/versions/v57.0.0/sdk/font/) and [SplashScreen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/).
