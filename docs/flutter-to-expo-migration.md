# Flutter → Expo migration

## Xcode 26.1 compatibility

Expo SDK 57.0.7의 `expo-modules-jsi` 57.0.3 배포본에는 Xcode 26.1 Swift 컴파일러가 거부하는 `weak let runtime` 선언과 날짜 코덱의 타입 추론 충돌이 남아 있다. `scripts/patch-expo-modules-jsi.mjs`가 설치 후 해당 약한 런타임 참조만 `nonisolated(unsafe) weak var runtime`으로 바꾸고, 날짜 코덱의 타입·범위 비교·반올림 규칙을 명시한다. `weak` 참조의 가변성은 유지하되 Swift 6의 `Sendable` 격리 검사에서 명시적으로 제외하는 보정이다. Expo 패키지에서 수정되면 스크립트는 변경 없이 종료하므로, 이후 SDK 업그레이드 때 이 보정의 제거 가능 여부를 다시 확인한다.

## Migrated surfaces

| Flutter feature | Expo destination | Status |
| --- | --- | --- |
| 홈 카테고리 4종 | `src/features/home/jeju-home-screen.tsx` | 여행지·지도·제주 문화 홈으로 확장 |
| 개별 사전 목록/검색 | `app/library/[kind].tsx` | 완료, 공통 목록·오류·캐시·새로고침 추가 |
| 개별 상세 | `app/detail/[kind]/[id].tsx` | 완료, 저장·공유·발음 재생 추가 |
| 미작동 통합 검색 | `src/features/language/language-search-screen.tsx` | 네 자료 통합 검색으로 수정 |
| 표기법 | `src/features/language/notation-screen.tsx` | 접이식 장/항 구조와 이미지 상태로 개선 |
| 즐겨찾기 자리 | `src/features/saved/saved-screen.tsx` | 여행지와 제주어 통합 저장으로 완성 |
| 설정/앱 정보 | `app/settings/*` | 테마, FAQ, 법적 문서, 동적 앱 정보로 확장 |

## Data migration

Flutter의 Provider별 XML 파서를 `src/services/jejuApi.ts`의 단일 타입 안전 파서로 통합했습니다. 방언사전만 `list.item`, 나머지는 `items.item`을 반환하는 API 차이를 모두 처리하며 숫자 XML 엔티티와 상대 미디어 URL을 정규화합니다.

## Legacy source

기존 Flutter 소스와 관리형이 아닌 `ios/`, `android/`, `web/` 폴더는 `legacy/flutter/`에 보존했습니다. Expo 빌드에는 포함되지 않으며 기존 앱을 유지하기 위한 참고 원본입니다. 새 Expo 앱은 기존 패키지를 덮어쓰지 않고 `kr.co.uulab.jeju`로 별도 출시합니다.

## 완료된 외부 연결

- UULab EAS `@uulab/jeju`와 OTA URL
- Android Firebase/FCM V1, iOS APNs, 배포 인증서와 프로비저닝
- 네이버 Maps `jeju` Dynamic Map과 Android/iOS `kr.co.uulab.jeju`
- 카카오 Developers 앱과 Android/iOS 플랫폼 식별자 (콘솔 표시 이름은 출시 전 `소랑제주`로 최종 확인)

## Remaining release work

- 카카오 로그인을 사용할 경우 Supabase 세션 교환 백엔드와 네이티브 로그인 UI 구현
- 운영 support/privacy/marketing URL 공개 및 메타데이터 URL 교체
- 실제 기기에서 iOS/Android 냉간 실행, 발음 재생, 네트워크 차단/복구 검증
- 스토어 스크린샷 생성과 로컬 서명 바이너리 빌드
