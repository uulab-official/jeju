# 제주 앱 디자인 감사 · Round 4

- 대상: iOS 프로덕션 설치 바이너리 `kr.co.uulab.jeju`
- 범위: 설정 진입 이후 7개 화면, 수정 화면 4개
- 기준: UULab Expo Editorial Utility, Pretendard 100–900, iOS Safe Area
- 프로덕션 OTA: `e5fdd0bc-9a18-4014-b0c3-cbacbbfebb29`
- 소스: `5ec0a79974d87b537de82a27e8e932a1c9e9ee97`

## 결과

| 지표 | 수정 전 | 수정 후 |
|---|---:|---:|
| Design Score | B | A- |
| AI Slop Score | C | A- |
| Goodwill | 64/100 | 79/100 |

설정 화면의 큰 장식 아이콘, 중첩 카드, 과도한 라운드 박스를 걷어냈다. 정보 밀도와 스캔 속도가 좋아졌고, 앱바와 본문 글꼴이 한 체계로 연결된다. 데이터 상태·고객지원·앱 정보 화면에는 카드 밀도가 아직 남아 있어 A 등급은 보류한다.

## 카테고리

| 카테고리 | 최종 등급 | 판단 |
|---|---:|---|
| 시각 위계 | A- | 제목, 설명, 목록, 행동의 순서가 명확하다. |
| 타이포그래피 | A | 앱바까지 Pretendard 토큰을 사용한다. |
| 간격과 레이아웃 | A- | 18px 화면 여백과 1px 구분선 리듬이 유지된다. |
| 색상과 대비 | A- | 제주 오렌지는 상태와 선택에만 제한적으로 사용된다. |
| 상호작용 상태 | A | 라디오 선택, FAQ 확장 상태, 알림 busy 상태가 접근성 트리에 노출된다. |
| 반응형·Safe Area | A | 설치 시뮬레이터 1080×2340에서 앱바와 본문이 안전영역 안에 유지된다. |
| 콘텐츠 품질 | A | 정보 출처, 캐시, 외부 후기 비수집 원칙을 구체적으로 설명한다. |
| AI Slop | A- | 수정 화면의 장식형 카드와 아이콘 박스를 제거했다. |
| 모션 | B+ | FAQ LayoutAnimation과 햅틱은 유지되며 별도 장식 모션은 없다. |
| 체감 성능 | A- | 페이지 진입과 접기/펼치기가 지연 없이 동작한다. |

## 발견 및 조치

### FINDING-012 · 앱바 글꼴 예외

- 영향: 높음 · 타이포그래피
- 관찰: 공통 앱바 제목만 Nanum 계열을 직접 지정해 화면마다 제목의 폭과 무게가 달라 보였다.
- 조치: 공통 `typography.heading`의 Pretendard를 그대로 사용하도록 예외를 제거했다.
- 상태: verified
- 커밋: `891afcb`
- 파일: `src/components/AppHeader.tsx`

### FINDING-013 · 테마 선택 카드 스택

- 영향: 높음 · AI Slop / 레이아웃
- 관찰: 세 개 선택지만 거대한 둥근 카드와 아이콘 박스로 반복해 정보보다 장식이 컸다.
- 조치: 위·아래 규칙선이 있는 라디오 행으로 바꾸고 선택 상태와 레이블을 접근성 트리에 연결했다.
- 상태: verified
- 커밋: `0ed6dfa`
- 파일: `app/settings/theme.tsx`
- 전후: [before](</Users/bonjin/.gstack/projects/uulab-official-jeju/designs/design-audit-20260730-round4/before/theme.png>) · [after](</Users/bonjin/.gstack/projects/uulab-official-jeju/designs/design-audit-20260730-round4/after/theme.png>)

### FINDING-014 · 알림 설정의 장식형 히어로

- 영향: 높음 · 시각 위계 / AI Slop
- 관찰: 큰 아이콘 카드와 별도 원칙 카드가 화면 대부분을 차지해 현재 상태와 행동이 늦게 보였다.
- 조치: 상태, 세 가지 발송 원칙, 활성화 행동 순서로 평면화했다. 오류는 alert, 처리 중 상태는 busy/disabled로 노출한다.
- 상태: verified
- 커밋: `d3e9cb6`
- 파일: `app/settings/notifications.tsx`
- 전후: [before](</Users/bonjin/.gstack/projects/uulab-official-jeju/designs/design-audit-20260730-round4/before/notification-settings.png>) · [after](</Users/bonjin/.gstack/projects/uulab-official-jeju/designs/design-audit-20260730-round4/after/notifications.png>)

### FINDING-015 · FAQ 둥근 카드 반복

- 영향: 높음 · 시각 위계 / 간격
- 관찰: 질문마다 별도 카드가 있어 한 화면에 보이는 질문 수가 적고 목록 탐색이 느렸다.
- 조치: 번호형 아코디언 목록으로 바꿨다. 기존 LayoutAnimation과 햅틱, 확장 접근성 상태는 유지했다.
- 상태: verified
- 커밋: `5ec0a79`
- 파일: `app/settings/faq.tsx`
- 전후: [before](</Users/bonjin/.gstack/projects/uulab-official-jeju/designs/design-audit-20260730-round4/before/faq.png>) · [after](</Users/bonjin/.gstack/projects/uulab-official-jeju/designs/design-audit-20260730-round4/after/faq.png>)

### FINDING-016 · 데이터 상태 화면 카드 밀도

- 영향: 중간 · 시각 위계
- 관찰: 상태 히어로, 내부 상태 카드, 배지가 중첩되어 진단 정보의 우선순위가 흐려진다.
- 제안: 원천별 상태를 표 형태의 행으로 통합하고 최종 동기화·오류만 강조한다.
- 상태: deferred

### FINDING-017 · 고객지원·앱 정보의 중앙 장식 카드

- 영향: 중간 · AI Slop
- 관찰: 지원과 앱 정보 화면에 큰 중앙 아이콘 카드와 둥근 정보 카드가 남아 있다.
- 제안: 연락·정책·버전 정보를 편집형 목록으로 통합한다.
- 상태: deferred

## Litmus

- 핵심 행동이 3초 안에 보이는가: YES
- 같은 정보가 카드와 본문으로 중복되는가: NO
- 장식 아이콘 없이도 위계가 유지되는가: YES
- 기본 글꼴이 Pretendard로 통일됐는가: YES
- 선택·확장 상태가 보조기술에 노출되는가: YES
- 설치 바이너리 Safe Area에서 잘리지 않는가: YES

## 검증

- `npm run verify`: 통과
- `npx expo install --check`: 통과
- `npx expo config --type public`: 통과
- `npm run release:audit`: 통과
- Expo Doctor: 20/20
- 데이터 수집 테스트: 5/5
- Maestro 설치 바이너리 스모크: 테마 선택·복원, FAQ 접기·펼치기, 알림 핵심 요소 모두 통과
- OTA 역조회: production / runtime 1.0.0 / iOS+Android / group `e5fdd0bc-9a18-4014-b0c3-cbacbbfebb29`

디자인 목표 생성 서비스는 별도 OpenAI 키가 없어 이번 라운드에서 실행하지 못했다. 실제 프로덕션 설치 화면과 UULab 토큰을 기준으로 감사·수정·검증했으므로 배포 결과에는 영향이 없다.

## Quick Wins

1. 데이터 상태의 원천별 중첩 카드를 한 줄 상태 목록으로 축소한다.
2. 고객지원과 앱 정보의 큰 중앙 아이콘을 제거한다.
3. 설정 하위 화면의 섹션 레이블과 구분선 리듬을 공통 컴포넌트로 추출한다.

## 요약

- 발견 6건
- 검증 완료 4건
- best-effort 0건
- 되돌림 0건
- 보류 2건
- PR 문장: Design review found 6 issues, fixed 4. Design score B → A-, AI slop score C → A-.

