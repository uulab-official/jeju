# 소랑제주

제주의 여행지·지도·문화·제주어를 사랑스럽게 이어 주는 UULab의 Expo 앱입니다. `소랑`은 제주어로 사랑을 뜻합니다.

## 앱 식별 정보

- Expo 프로젝트: `@uulab/jeju`
- iOS Bundle ID / Android package: `kr.co.uulab.jeju`
- URL scheme: `jeju`
- 웹/딥링크 호스트(웹 배포 후 활성화 예정): `uulab.co.kr`
- EAS project ID: `4674ac32-4c72-4f37-b339-51f4037870a3`

기존 Flutter 소스는 `legacy/flutter/`에 보존되어 있으며 새 앱의 빌드 대상은 저장소 루트의 Expo 프로젝트입니다.

## 현재 기능

- 홈: 계절별 제주 소개, 액티비티 바로가기, 공식 관광정보 기반 테마 여행 가이드, 제주 역사·문화 진입점
- 발견: 여행지 검색과 자연·바다·걷기·문화·시장·섬·액티비티 필터
- 지도: 네이버 지도 연결 전 대체 지도, 연결 후 네이티브 마커 지도
- 저장: 기기 저장소 기반 여행지와 제주어 북마크
- 장소 상세: 요약, 여행 팁, 공식 출처, 네이버 지도 열기, 공유
- 여행 가이드: 동쪽 하루·액티비티·비 오는 날·서쪽 노을 등 테마별 추천 동선
- 제주 역사: 탐라의 해상교류부터 고려·조선, 제주4·3과 평화까지 공식 자료와 관련 장소로 읽는 시간선
- 제주어: 생활방언·속담·사전·색인어 검색, 상세, 발음, 표기법, 오프라인 캐시
- 알림: Expo Push Token 동의·갱신·해제와 Appwrite 비공개 설치 레지스트리
- 시작 경험: 테마 사전 복원, 수동 OTA 확인·다운로드 진행률, 실패 시 저장 데이터로 진입
- 시스템/라이트/다크 테마, FAQ, 개인정보 처리방침, 이용약관

외부 서비스의 후기를 복제하거나 크롤링하지 않습니다. 커뮤니티 후기는 별도 백엔드에서 앱 사용자가 직접 작성하고 신고·삭제할 수 있는 구조로 추가할 예정입니다.

첫 심사 바이너리는 공개 웹 호스트가 준비되지 않아 Associated Domains와 HTTPS 앱 링크를 포함하지 않습니다. `uulab.co.kr` 기반 웹/지원 페이지를 확정하고 Apple 프로비저닝 프로파일을 갱신한 뒤 다음 바이너리에서 다시 활성화합니다.

## 개발

```bash
npm install
cp .env.example .env.local
npm run start
```

네이버 지도 애플리케이션 발급 후 `.env.local`에 클라이언트 ID를 설정해야 네이티브 지도가 빌드에 포함됩니다.

```dotenv
EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=
```

검증 명령:

```bash
npm run typecheck
npm run lint
npm run doctor
npm run startup:check
npm run push:check
```

`push:check`는 Expo Push 전송 설정과 Appwrite 설치 등록 경로가 모두 존재하는지 확인합니다. 실제 수신은 스토어 서명 바이너리를 설치한 iOS·Android 기기에서 최종 확인합니다.

## 데이터 원칙

- 관광정보: 한국관광공사 TourAPI 원문 출처와 이용 조건을 장소별로 명시합니다.
- 여행 가이드: Appwrite 장소 데이터의 지역·카테고리·태그를 조합하며 운영시간과 예약 여부를 확정적으로 주장하지 않습니다.
- 제주 역사: 국립제주박물관·국가유산포털·제주4·3평화재단의 공식 자료를 요약하고 원문을 연결합니다.
- 제주어: 제주특별자치도 제주어 OpenAPI 응답을 캐시해 사용합니다.
- 지도: 네이버 지도 클라이언트 ID가 없을 때도 장소 목록과 외부 지도 열기를 제공합니다.
- 후기: 네이버 등 제3자 후기를 수집하지 않고, 우리 서비스에서 작성된 콘텐츠만 제공합니다.

## 배포

서명 파일과 서비스 계정 키는 Git에서 제외됩니다. 로컬/CI에서는 UULab 중앙 자격 증명과 `credentials.json`을 사용합니다.

```bash
npm run preflight:production
npm run build:testflight:ios
npm run build:play:android
```

심사·배포된 바이너리와 호환되는 JS/스타일 수정은 검증, 네이티브 기준선 검사, 양 플랫폼 번들 생성·무결성 확인을 거쳐 OTA로 게시합니다.

```bash
npm run preflight:update
npm run guard:update
npm run update:msg -- "사용자에게 보이는 변경 내용을 구체적으로 작성"
```

네이티브 의존성, 앱 설정, 권한, 지도 SDK가 바뀌면 OTA가 아니라 새 바이너리를 빌드해야 합니다. 서버 관리자 키가 들어 있는 `.env`와 서명·서비스 계정 파일은 공개 저장소에 절대 커밋하지 않습니다.
