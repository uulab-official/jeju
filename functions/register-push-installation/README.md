# register-push-installation

소랑제주 앱의 Expo Push Token을 익명 설치 단위로 Appwrite `jeju/push_installations`에 등록하거나 비활성화합니다.

- 앱 계정이나 즐겨찾기와 연결하지 않습니다.
- Function만 테이블에 쓸 수 있고 앱 클라이언트에는 테이블 읽기·쓰기 권한이 없습니다.
- `installationId`, Expo 프로젝트 ID, 토큰 형식을 검증합니다.
- 알림 해제는 행을 삭제하지 않고 `active=false`로 기록합니다.
