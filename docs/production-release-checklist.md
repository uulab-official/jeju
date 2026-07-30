# 소랑제주 1.0.0 프로덕션 출시 체크리스트

> `package.json`의 `expo.install.exclude`는 현재 제출된 1.0.0 바이너리에
> 포함된 네이티브 패키지 패치 버전으로 검증 기준을 고정한다. 다음 교체
> 바이너리를 만들 때만 이 목록을 제거하고 `npx expo install --fix` 후 OTA
> 네이티브 기준선을 새로 기록한다. OTA 작업 중에는 해당 패키지를 올리지 않는다.

최종 점검일: 2026-07-27 (Asia/Seoul)

최종 자동 점검 결과: 전체 통과

- Production OTA 최신 배포: iOS `019fa1a4-52ca-766a-8065-6d76039bf5ee`, Android `019fa1a4-52ca-735c-b1a0-f65f2252f9e6`
- 최신 Android Store 바이너리: versionCode `26072602`, EAS production AAB 빌드 완료
- App Store Connect: 새 앱의 첫 버전 심사 대기(아직 공개 버전 없음)
- Apple 대응: `ITMS-90683` 위치 권한 purpose string 누락 수정, iOS build `26072701` 재제출 완료
- Google Play: 제출 ID `3`이 현재 `검토 중`; 이전 제출 ID `1`, `2`는 거절이 아닌 취소 상태

## 자동 검증

- [x] TypeScript, ESLint, Expo Doctor 20/20
- [x] 앱 시작·fallback·네이티브 splash 검사
- [x] iOS/Android 아이콘·adaptive icon·알림 아이콘·favicon 검사
- [x] Appwrite 클라이언트 및 서버 전용 키 설정 검사
- [x] 제주 관광·문화 수집기 테스트 5건
- [x] 데이터 수집 상태 확인: 장소 301건, 문화 콘텐츠 5,000건
- [x] 릴리스 자산 무결성 및 스크린샷 격리 검사
- [x] 최신 production OTA 번들 export·무결성 검사·양 플랫폼 publish

실행 명령:

```bash
npm run verify
npm run preflight:production
npm run data:health
npm run release:assets:check
npx expo install --check
npx expo config --type public
```

## 제품 기능

- [x] 5개 탭 IA: 홈·발견·지도·저장·전체
- [x] 제주 관광·문화·역사·액티비티 가이드
- [x] 지도 상세 보기 및 외부 지도 연결
- [x] 로컬 저장·테마·여행 준비 체크리스트 유지
- [x] 푸시 알림 수신함 및 읽음 상태 유지
- [x] 네트워크 실패 시 캐시 유지, 완료된 조회 후에만 빈 상태 노출
- [x] safe-area 및 접근성 검색 입력/삭제 동작

## 데이터·보안

- [x] TourAPI/공공데이터 기반 서버 수집 구조
- [x] 변경분 중심 수집 및 체크포인트 재시도
- [x] Appwrite 관리자 키는 서버 함수 전용
- [x] 공개 API 키와 비밀 키 분리
- [x] 제3자 후기 무단 수집·재게시 없음
- [ ] 운영 중 실제 수집 함수 로그/실패율 모니터링 연결 (출시 후)

## 스토어·서명

- [x] iOS bundle ID / Android package: `kr.co.uulab.jeju`
- [x] 앱 이름: 소랑제주
- [x] 버전: 1.0.0
- [x] iOS build: 26072601
- [x] Android versionCode: 26072602
- [x] Apple/Google 서명 자격 증명 연결
- [x] 개인정보처리방침: https://uulab.co.kr/privacy
- [x] EAS production 프로필 및 OTA runtime 1.0.0
- [x] iOS 빌드 제출 완료(심사 대기)
- [x] Android 프로덕션 제출 완료(Version code 26072602)
- [x] Production OTA 배포 완료(iOS/Android, runtime 1.0.0)
- [ ] Apple 심사 승인 및 출시
- [ ] Google 심사 승인 및 출시

## 출시 후 운영

- [ ] TestFlight/Play 내부 테스터에서 로그인·지도·푸시·저장·오프라인 확인
- [ ] 크래시/ANR 및 데이터 수집 실패율 24시간 모니터링
- [ ] 첫 OTA는 네이티브 변경 없는 버그 수정만 허용
- [ ] 네이티브 변경 시 buildNumber/versionCode 증가 후 새 바이너리 제출
