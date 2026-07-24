# collect-jeju-tourism

한국관광공사 국문 관광정보 서비스(TourAPI `KorService2`)에서 제주 법정동 시·도 코드 `lDongRegnCd=50`의 관광정보·상세 이용정보·공식 이미지를 수집해 Appwrite `jeju/places`에 upsert합니다. 최초 수집은 `areaBasedList2`, 이후 예약 실행은 `areaBasedSyncList2`를 사용하고 변경된 콘텐츠에만 `detailCommon2`, `detailIntro2`, `detailImage2`를 호출합니다. `detailCommon2`에는 2026년 명세에서 삭제된 선택 파라미터를 보내지 않습니다.

필수 Function 변수:

- `TOUR_API_SERVICE_KEY`: 공공데이터포털에서 발급한 한국관광공사 TourAPI 서비스 키

선택 변수:

- `APPWRITE_DATABASE_ID=jeju`
- `APPWRITE_PLACES_TABLE_ID=places`
- `APPWRITE_SYNC_TABLE_ID=sync_runs`
- `TOUR_API_MAX_ITEMS=300`
- `TOUR_API_MAX_SYNC_ITEMS=900`

Appwrite Function의 동적 키에는 `rows.read`, `rows.write` scope가 필요합니다. 기본 스케줄은 매일 02:30(KST 기준 서버 시간 확인 필요)입니다. 첫 실행은 `{"smoke":true}`로 연결만 검증한 다음 `{"full":true}`로 전체 수집합니다. 이후 빈 요청 본문은 `sync_runs.checkpointJson`의 날짜부터 변경분만 조회합니다.

- `showflag=1`: 신규 또는 변경 콘텐츠를 upsert
- `showflag=0`: 기존 행을 삭제하지 않고 `active=false`로 비활성화
- `oldContentid`: 콘텐츠 ID 변경 시 이전 행을 비활성화
- Appwrite에 저장된 `modifiedAt`과 원천 수정일이 같으면 상세·이미지 호출을 생략
- 체크포인트가 없는 기존 설치에 장소 데이터가 있으면 전날부터 증분 수집을 시작

제3자 후기·블로그·SNS 이미지 등은 수집하지 않습니다. 앱은 TourAPI가 개방한 이미지 URL과 저작권 구분 코드를 원본 메타데이터로 보존합니다.
