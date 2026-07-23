# Repository Guidelines

## Active application

- The production app is the Expo SDK 56 project at the repository root.
- `legacy/flutter/` is read-only migration reference. Do not add new Flutter features or restore root-level Flutter native folders.
- Keep `app/` limited to Expo Router layouts and thin route shells. Put product implementation under `src/`.

## Product invariants

- Preserve the new Expo identity `kr.co.uulab.jeju`. The old Flutter app remains a separate legacy package.
- Preserve the five-tab IA: 홈, 발견, 지도, 저장, 전체. 제주어 검색과 표기법은 `전체 > 제주 문화` 및 홈의 문화 진입점에서 제공한다.
- Keep reviews as a place-detail subfeature until first-party authoring, moderation, reporting, and deletion are implemented. Do not scrape or republish third-party reviews.
- Keep all four Jeju OpenAPI resources supported and searchable.
- Numeric XML entities must be decoded without stripping old-Hangul private-use code points; keep the bundled `NanumMyeongjo-YetHangul.ttf` font.
- Network failure must retain cached content. Empty states may appear only after a completed query.
- Favorites and theme preference remain local-only unless a future product spec adds accounts.
- This project targets iOS and Android. The source API does not allow browser CORS, so do not claim production web support without a server proxy.

## Verification

Run before handoff:

```bash
npm run verify
npx expo install --check
npx expo config --type public
```

Native dependencies, app config, icon/splash, permissions, or signing changes require a binary build. Link the correct `uulab` EAS project before OTA or release work.
