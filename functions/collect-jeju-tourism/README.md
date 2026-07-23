# collect-jeju-tourism

한국관광공사 국문 관광정보 서비스(TourAPI `KorService2`)에서 제주 법정동 시·도 코드 `lDongRegnCd=50`의 관광정보·상세 이용정보·공식 이미지를 수집해 Appwrite `jeju/places`에 upsert합니다. 호출은 `areaBasedList2`, `detailCommon2`, `detailIntro2`, `detailImage2`를 사용하며, `detailCommon2`는 2026년 명세에서 삭제된 선택 파라미터를 보내지 않습니다.

필수 Function 변수:

- `TOUR_API_SERVICE_KEY`: 공공데이터포털에서 발급한 한국관광공사 TourAPI 서비스 키

선택 변수:

- `APPWRITE_DATABASE_ID=jeju`
- `APPWRITE_PLACES_TABLE_ID=places`
- `APPWRITE_SYNC_TABLE_ID=sync_runs`
- `TOUR_API_MAX_ITEMS=300`

Appwrite Function의 동적 키에는 `rows.read`, `rows.write` scope가 필요합니다. 기본 스케줄은 매일 02:30(KST 기준 서버 시간 확인 필요)이며, 첫 실행은 `{"smoke":true}`로 연결만 검증한 다음 전체 수집을 실행합니다.

제3자 후기·블로그·SNS 이미지 등은 수집하지 않습니다. 앱은 TourAPI가 개방한 이미지 URL과 저작권 구분 코드를 원본 메타데이터로 보존합니다.
