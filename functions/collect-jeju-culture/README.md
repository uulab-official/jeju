# collect-jeju-culture

제주특별자치도 제주어 OpenAPI 네 가지 리소스를 Appwrite `jeju/culture_items`에 수집합니다.

- `JejuLifeDialectService`
- `JejuAdageService`
- `JejuDialectService`
- `JejuAdageIndexService`

외부 API는 Function에서만 호출하고, 앱은 Appwrite 공개 읽기 테이블만 조회합니다. 최초 수집은 `page=1..n`, `pageSize=1000`으로 진행합니다. 이후에는 API가 신규 항목을 앞쪽에 내림차순으로 반환하는 특성을 이용해 `sync_runs.checkpointJson`의 마지막 `seq` 이후 페이지만 읽고, 기존 항목을 다시 저장하지 않습니다. 신규 항목이 없는 날에는 리소스별 첫 페이지에서 중단합니다. 실행별 상태와 체크포인트는 `sync_runs`에 `source=jeju-openapi`로 기록합니다.

Appwrite 내부 Endpoint가 일시적으로 연결되지 않거나 재시도 가능한 응답을 반환하면 공개 Endpoint로 전환합니다. 일부 저장이 실패한 실행은 이전 체크포인트를 유지해 다음 실행에서 누락된 항목을 다시 처리합니다.
