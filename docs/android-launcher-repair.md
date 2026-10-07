# Android launcher repair

## Source defect

At source commit `5352d3fb186091f97910b6375a263522df0ccac0`, Android explicitly selects `assets/images/android-icon-foreground.png`. Its Git blob is `79e1b6aa3205e56956295ce65e5236e853a772b8`: a 1024×1024 PNG with exactly one visible RGB color (white) and a solid 620×620 square at x/y 202–821. The alpha-padding checks passed because they checked size and centering, not artwork content.

The defective foreground and monochrome blobs entered the repository in [75570c0](https://github.com/uulab-official/jeju/commit/75570c019edb4c14f49597e9c1431b87ad67e794) on 2026-07-25. No tracked Android native directory or icon-generation script explains an additional transformation: the source asset itself is already blank.

The approved mountain/sun/waves artwork remains in `assets/images/icon.png` (Git blob `2fdd028cc0f32a3be940df6e15476791ebd3d446`) and the Korean/English Google Play icons (Git blob `829080e2fd615295c98fdfa84413c1783f323710`).

## Minimal repair

Remove the `android.adaptiveIcon` override and let Expo use the unchanged root `icon`. This preserves the approved raster artwork byte-for-byte. The installed Expo prebuild plugin explicitly supports standard-icon fallback, disables adaptive layering, and removes stale `mipmap-anydpi-v26/ic_launcher.xml`, `ic_launcher_round.xml`, round raster files, and the manifest's `android:roundIcon` reference. Keeping an empty adaptiveIcon object would still enable layering, so the entire object is removed.

The source preflight must inspect the active Android launcher image's visible RGB content. A transparent border cannot make a solid square count as branded artwork. The historical source foreground remains as a regression fixture, but is no longer referenced by app configuration.

## Verification on 2026-10-07

- Reproduced the original defect: all three new launcher regressions failed before the configuration/checker changes, while the old visual-assets check incorrectly passed
- `node --test tests/*.cjs tests/*.mjs functions/collect-jeju-tourism/test/collector.test.mjs functions/collect-jeju-culture/test/collector.test.mjs`: 187 passed, 0 failed
- Typecheck, lint, startup configuration, visual-assets check, and Expo public-config evaluation passed
- Exercised the installed Expo 57.0.8 / prebuild-config 57.0.9 icon generator on both clean and previously adaptive output; all five density variants match the unchanged approved artwork, stale adaptive XML/round resources are removed, and manifest roundIcon cleanup passes
- Viewed the actual generated launcher pixels, not only the source configuration; no Gradle/native compilation or signing was performed in cloud
- Original root PNG remains Git blob `2fdd028cc0f32a3be940df6e15476791ebd3d446`, SHA-256 `b417459fa3f3fed41e8fa22a9409b730d45fdb8cba23a46381ec0504522fae71`

The full `npm run verify` is **not green**: Expo Doctor passes 20/21 checks and flags the existing Expo 57.0.8 / Hermes V1 250829098.0.14 memory regression. Dependency/runtime upgrades are intentionally separate. The server-only Appwrite configuration check is also blocked in the credential-free cloud checkout because `.env` / `APPWRITE_API_KEY` is absent; no credentials were copied or fabricated. Online `expo install --check` timed out at the HTTP proxy; its offline check reports dependencies up to date but explicitly warns that offline validation is unreliable. These are release-preflight limitations, not evidence of a ready-to-submit binary.

## Required binary acceptance

This is a native resource/configuration change. Source tests and Expo resource generation are not a signed AAB, an installed-device check, or Play approval. Do not attempt to deliver it through OTA. The existing 1.0.1 / 26082709 artifact is not repaired by this source commit.

On the authorized Mac build path:

1. Pull the exact repaired commit into a clean build checkout and confirm no stale native configuration overrides it
2. Choose release version/build values through the existing release procedure, preserving the intended runtime; do not reuse an already uploaded Android versionCode
3. Run the full production preflight and build a fresh signed AAB
4. Extract the fresh artifact's manifest/resources, prove `kr.co.uulab.jeju`, version/build/runtime, launcher references, and matching mountain/sun/waves pixels
5. Install the exact generated APK on an Android 8+ device/emulator and verify the launcher visually; retain artifact SHA-256, source SHA, and screenshots
6. Run the existing artifact submission guard against the exact candidate before any separately authorized store action

## Separate defects, unchanged here

The same source audit also found these solid-square assets. They need their own approved-artwork repair and native validation; they are not fixed by the launcher fallback:

- `android-icon-monochrome.png`: 432×432, one black visible RGB color, filled bounds x/y 85–345; no longer selected by launcher configuration after this repair
- `splash-mark.png` / `splash-icon.png`: 1024×1024, one white visible RGB color, filled bounds x/y 128–895
- `notification-icon.png`: 96×96, one white visible RGB color, filled bounds x/y 19–76

No image pixels, SDK versions, runtime settings, secrets, ads, live services, OTA releases, or store submissions are changed by this repair.
