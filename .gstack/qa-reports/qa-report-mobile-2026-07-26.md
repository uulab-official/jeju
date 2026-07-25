# 기능 QA 보고서 — 소랑제주

## 범위

- Expo Router 5개 탭과 상세/설정/알림 라우트 정적 흐름 점검
- Appwrite·TourAPI 캐시/페이징 및 네트워크 실패 보존 흐름 점검
- Expo 푸시 권한·토큰 등록·알림 탭 이동 흐름 점검
- 실제 iOS/Android 기기 조작은 이 실행 환경에서 수행하지 못함

## 발견 및 조치

### ISSUE-001 — 수신한 푸시가 알림 화면에 표시되지 않음

- 재현 경로: 푸시 수신 또는 알림 탭 → `/notifications`
- 원인: 화면이 고정된 빈 상태만 렌더링하고 수신 이벤트를 저장하지 않음
- 조치: 수신/탭 이벤트를 최대 50건 로컬 보관하고, 제목·본문·수신 시각·허용된 내부 route를 표시하도록 수정
- 수정 커밋: `fa31b83`
- OTA: iOS `019f9bab-d707-7ce3-9066-9f8ed2b65f0a`, Android `019f9bab-d707-7b5e-9e7b-a69dbe8e0cc3`

## 검증 결과

- `npm run verify` 통과
- `npx expo install --check` 통과
- `npx expo config --type public` 통과
- `npm run guard:update` 통과 (네이티브 변경 없음)
- OTA 번들 iOS/Android 검증 통과 및 production 채널 게시 완료

## 남은 외부 검증

- 실제 기기에서 알림 권한 허용 → 테스트 푸시 수신 → 알림 목록 표시/내부 링크 이동 확인
- App Store Connect/Google Play에서 업로드된 1.0.0 빌드 처리 상태 확인
