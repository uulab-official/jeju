# 소랑제주 외부 서비스 연결

## 앱 식별자

- Expo: `@uulab/jeju`
- iOS/Android: `kr.co.uulab.jeju`
- URL scheme: `jeju`
- 웹·앱 링크(웹 배포 후 활성화 예정): `https://uulab.co.kr`

첫 심사 바이너리는 해당 호스트의 DNS/HTTPS 공개 전이므로 Associated Domains와 Android HTTPS intent filter를 포함하지 않습니다. 호스트를 배포하고 Apple 프로파일을 갱신한 뒤 재활성화합니다.

## 네이버 Maps

- Naver Cloud Maps Application: `jeju`
- 사용 API: Dynamic Map
- Android package와 iOS bundle ID 모두 `kr.co.uulab.jeju`
- 공개 Client ID는 Git에서 제외된 `.env.local`의 `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`로 주입
- Expo 설정은 값이 있을 때만 `@mj-studio/react-native-naver-map` 플러그인을 포함

## 카카오 Developers

- 출시 이름: `소랑제주`
- 현재 콘솔 표시 이름은 출시 전 `소랑제주`로 최종 확인
- 앱 ID: `1520714`
- 운영 계정: `uulab.official@gmail.com`
- 카테고리: 여행/지역 정보
- Android package와 iOS bundle ID 모두 `kr.co.uulab.jeju`
- 릴리스 JKS 키 해시 등록 완료
- 네이티브 앱 키는 Git에서 제외된 `.env.local`의 `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`로 보관

카카오 로그인은 네이티브 앱 키만으로 완성되지 않습니다. 로그인 SDK, Kakao access token을 검증·교환하는 백엔드, 세션 설치와 탈퇴/연결 해제 처리가 함께 구현된 뒤 사용자에게 노출해야 합니다.

## 푸시

앱은 Expo Push Token과 Expo Push Service를 사용합니다. Android FCM V1과 iOS APNs는 Expo 뒤의 플랫폼 전송 자격 증명이며 Firebase JavaScript SDK를 앱에 추가하지 않습니다.

- 사용자가 동의하면 앱이 익명 설치 ID와 Expo Push Token을 Appwrite `register-push-installation` Function으로 등록
- `push_installations` 테이블은 직접 클라이언트 권한이 없는 비공개 전송 대상 레지스트리
- 토큰 갱신 이벤트를 다시 등록하고, 사용자가 알림을 끄면 행을 삭제하지 않고 `active=false`로 비활성화
- Function은 Project ID·설치 ID·Expo Token·플랫폼 값을 검증하고 앱에 Appwrite 서버 API 키를 포함하지 않음
- `npm run push:check`는 Expo/Firebase 공개 전송 설정뿐 아니라 Appwrite 등록 코드 존재도 확인

실제 수신 확인은 스토어 서명 바이너리를 설치한 iOS/Android 기기에서 각각 수행해야 합니다.

## 시작 업데이트

프로덕션 앱은 `expo-updates`를 수동 확인합니다. 네이티브 시작 화면 뒤 같은 마크와 배경을 사용하는 React Native 시작 화면을 이어 보여 주고, 업데이트 확인·다운로드·재시작 진행률을 표시합니다. 네트워크 또는 Appwrite 연결 실패는 시작을 막지 않으며 저장된 데이터로 진입합니다.

## Appwrite 관광정보

- 기본 endpoint: `https://appwrite.uulab.co.kr/v1`
- Project ID: `6a615d4e00392e50bbd8`
- Database ID: `jeju`
- React Native SDK 싱글턴: `src/lib/appwrite.ts`
- 앱 진입 시 `client.ping()` 자동 실행
- 공개 읽기 테이블: `places`
- 예약 수집 Function: `collect-jeju-tourism`
- 원천: 한국관광공사 국문 관광정보 서비스 `KorService2`, 제주 지역 코드 `39`
- 앱은 Appwrite SDK → 마지막 정상 캐시 → 번들 기본 장소 순으로 사용
- 공공데이터 서비스 키와 Appwrite 서버 키는 Function 변수로만 보관
- 세부 스키마와 배포 절차: `docs/data-platform.md`
