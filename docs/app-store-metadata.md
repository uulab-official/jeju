# 소랑제주 스토어 등록 정보

## 등록 식별자

- 런처 이름: 소랑제주
- 한국어 스토어 이름: 소랑제주 & 제주여행·지도·제주어
- 영문 스토어 이름: Sorang Jeju & Travel Guide
- iOS Bundle ID / Android package: `kr.co.uulab.jeju`
- App Store Connect 앱 ID: `6793418676`
- Apple SKU: `kr.co.uulab.jeju`
- 기본 언어: 한국어 (`ko` / `ko-KR`)
- 최초 Apple/Google 심사 버전: `1.0.0`
- iOS build / Android versionCode: `26072201`
- 기본 카테고리 제안: 여행
- 보조 카테고리 제안: 교육
- 가격 제안: 무료
- 리뷰 연락처: 최태호 / `uulab.official@gmail.com` / `+82 10-5054-5654`
- 로그인: 없음, 리뷰용 계정 불필요

## 제품 포지셔닝

소랑제주는 액티비티·테마 여행 가이드·여행지·지도·저장 기능과 제주 역사·제주어·문화 자료를 함께 제공하는 제주 탐색 앱이다. `소랑`은 제주어로 사랑을 뜻한다. 외부 서비스 후기나 사진을 크롤링하지 않으며, 앱에 구현되지 않은 일정·커뮤니티·개인화 기능은 스토어 문구와 스크린샷에서 주장하지 않는다.

상세 문구의 단일 소스는 `store.config.json`이며 Fastlane 폴더는 플랫폼별 자동화 호환본이다.

## 스크린샷 기획

실제 릴리스 빌드에서 아래 다섯 상태를 각각 촬영한다.

1. 홈 — `액티비티와 테마 가이드로, 제주를 더 깊이`
2. 발견 — `취향에 맞는 제주 여행과 체험을 한눈에`
3. 지도 — `가고 싶은 곳을 지도에서 바로 확인`
4. 저장 — `여행지와 제주어를 나만의 보관함에`
5. 전체/제주 문화 — `탐라부터 제주어까지, 섬의 시간과 삶을 가까이`

Apple 한국어 결과물은 `1242x2688`, Google 한국어 결과물은 `1080x1920` 세로 캔버스로 구성한다. 동일 화면을 문구만 바꿔 재사용하지 않는다. Expo Go, 개발 메뉴, 권한 팝업, 빈 지도, 잘린 텍스트가 포함된 캡처는 사용하지 않는다.

실제 iOS Release 빌드에서 5개 상태를 자동 촬영했으며, 한국어·영어 Apple 10장과 Google 10장을 생성했다.

- Apple: `fastlane/screenshots/ko`, `fastlane/screenshots/en-US`
- Google: `fastlane/metadata/android/ko-KR/images/phoneScreenshots`, `fastlane/metadata/android/en-US/images/phoneScreenshots`
- 원본 캡처 자동화: `.maestro/store-screenshots.yaml`
- 스토어 캔버스 생성: `npm run screenshots:compose`

## 제출 전 소유자 확인이 필요한 항목

다음은 코드만으로 단정하지 않고 콘솔 제출 전에 최종 확인한다.

- Apple 콘텐츠 권리: 비짓제주 및 제주특별자치도 OpenAPI 사용 조건과 표시 방식
- Apple App Privacy / Google Data safety: Naver Maps SDK, Expo Notifications, FCM이 처리하는 진단·기기 식별 데이터의 최종 선언
- 연령 등급과 대상 연령
- 광고 없음, 인앱결제 없음, 건강·금융·정부 앱 아님 선언
- 무료 가격과 전체 국가/지역 배포 범위
- Google Managed publishing 사용 여부

## 현재 제출 차단 요소

- 마케팅·지원 URL은 우선 `https://uulab.co.kr`, 개인정보 URL은 `https://uulab.co.kr/privacy`를 사용한다. 노션 지원 페이지가 준비되면 지원 URL만 교체한다.
- Google Play Console의 신규 앱 생성 버튼은 소유자 확인 후 최종 클릭해야 한다.
- Apple/Google 개인정보·콘텐츠 권리·등급 선언은 소유자 확인 후 콘솔에 저장해야 한다.
