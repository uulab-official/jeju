# 명시적 바이너리 후보 확인 후 제출

`submit:ios`, `submit:android`, `harness submit`은 플랫폼 하나, 실제 파일 경로,
후보 manifest를 모두 명시해야 한다. EAS의 `--latest`, `dist`/`artifacts` 자동 탐색,
기본 파일명이나 이전 후보로의 fallback은 사용하지 않는다. `--dry-run`도 같은
파일·manifest·내장 메타데이터 검사를 실행하며 EAS 제출만 생략한다.

이 검사는 **선택한 파일의 식별 정보와 바이트 해시 일치**만 증명한다.
소스 커밋/빌드 출처, 서명·프로비저닝, Google OAuth 매핑, 네이티브 호환성,
아이콘 픽셀, 리뷰어 로그인, 동의 흐름 QA, 심사 승인 또는 제출 상태는 증명하지 않는다.
직접 실행하는 EAS/Fastlane 명령과 다른 배포 경로는 이 가드의 적용 범위가 아니다.

## 후보 manifest

실제 제출 대상으로 독립적으로 확인한 파일에 대해 JSON 파일을 준비한다.
현재 `app.base.json`이나 파일명에서 버전/빌드 번호를 추정하거나, 오래된 파일을
새 후보로 간주해 manifest를 자동 생성하지 않는다. 아래 값은 형식을 설명하는
자리표시자이며 사용 가능한 후보가 아니다. 실제 후보 값은 이 문서에 기록하지 않는다.

```json
{
  "schemaVersion": 1,
  "purpose": "store-submission",
  "platform": "ios",
  "artifactPath": "./SELECTED-CANDIDATE.ipa",
  "applicationId": "kr.co.uulab.jeju",
  "marketingVersion": "VERIFIED-MARKETING-VERSION",
  "buildVersion": "VERIFIED-EMBEDDED-BUILD",
  "sha256": "VERIFIED-64-HEX-SHA256"
}
```

- 정확히 위 8개 필드를 사용한다. `schemaVersion`은 숫자 `1`, 나머지는 문자열이다
- `purpose`는 `store-submission`이어야 한다. `test`, `local-fixture`, `preview`와 알 수 없는 필드는 거부한다
- `artifactPath`는 manifest 파일 기준 상대 경로 또는 절대 경로다. CLI `--path`는 현재 디렉터리 기준이며 두 경로가 같은 실제 파일을 가리켜야 한다
- `platform`은 `ios` 또는 `android`이며 명령의 플랫폼과 일치해야 한다
- `applicationId`는 새 Expo 앱 식별자 `kr.co.uulab.jeju`여야 한다
- iOS: `marketingVersion` = `CFBundleShortVersionString`, `buildVersion` = `CFBundleVersion`
- Android: `marketingVersion` = `android:versionName`, `buildVersion` = `android:versionCode` (문자열)
- `sha256`은 승인된 후보의 바이트 해시다. 검사 전후의 파일 해시가 모두 manifest와 일치해야 한다

manifest와 바이너리는 로컬 릴리스 증거로 함께 보관한다. 잘못된 후보에 맞춰
manifest를 바꾸는 행위는 가드가 판별할 수 없다. 후보의 출처·권한·QA는 별도 확인한다.

## 오프라인 확인

Node.js와 Python 3 표준 라이브러리가 필요하다. iOS는 ZIP 내부의 정확히 하나인
최상위 `Payload/*.app/Info.plist`를 직접 읽으며 XML/binary plist 모두 지원한다.
시뮬레이터와 명시적으로 표시된 로컬 테스트 fixture는 거부한다.

Android APK는 Android SDK 명령행 도구의 `apkanalyzer manifest print`를,
AAB는 로컬 `bundletool dump manifest --module=base`를 사용한다. 둘 다 PATH에
설치된 공식 도구를 사용한다. 도구가 없거나 실패하면 제출하지 않는다. XML의 패키지,
버전명, 버전 코드를 읽으며 debug/test-only, 모호한 application, 비정상 메타데이터를
거부한다. 도구를 자동 설치하거나 EAS에 로그인하지 않는다.

공식 도구 설명: [apkanalyzer](https://developer.android.com/tools/apkanalyzer),
[bundletool dump 구현](https://github.com/google/bundletool/blob/master/src/main/java/com/android/tools/build/bundletool/commands/DumpCommand.java).

```bash
node scripts/artifact-version-check.js ios \
  --path /absolute/path/SELECTED-CANDIDATE.ipa \
  --manifest /absolute/path/SELECTED-CANDIDATE.json

node scripts/uulab-expo-harness.js submit android --dry-run \
  --path /absolute/path/SELECTED-CANDIDATE.aab \
  --manifest /absolute/path/SELECTED-CANDIDATE.json
```

`tests`, `__tests__`, `fixtures`, `__fixtures__`, `test-fixtures` 디렉터리의 후보,
파일 대신 디렉터리/심볼릭 링크, 누락·불일치·지원하지 않는 확장자는 거부한다.
이 규칙은 알려진 fixture 오용 방지이며 임의로 조작한 archive의 진위를 증명하지 않는다.

## 승인된 제출 시에만

아래 명령은 실제 스토어 제출을 시작한다. 별도의 제출 승인을 받은 후 Mac에서
후보, 서명, 네이티브 QA 및 스토어 대상/트랙을 확인하고 실행한다.
기존 `release:assets:check`를 유지하며 실패 시 제출하지 않는다.

```bash
UULAB_BINARY_REASON=existing-artifact npm run submit:ios -- \
  --path /absolute/path/SELECTED-CANDIDATE.ipa \
  --manifest /absolute/path/SELECTED-CANDIDATE.json

UULAB_BINARY_REASON=existing-artifact npm run submit:android -- \
  --path /absolute/path/SELECTED-CANDIDATE.aab \
  --manifest /absolute/path/SELECTED-CANDIDATE.json
```

두 플랫폼은 각각 다른 manifest와 별도 명령을 사용한다. `harness submit all`은
허용하지 않는다. `release:local`/`harness release`의 build→submit 자동 연결은
빌드를 시작하기 전에 거부한다. 빌드와 후보 확인·제출을 분리한다. 이 문서 변경은 빌드나
스토어 제출을 승인하지 않으며, 기존 이력 문서의 빌드 번호를 현재 후보로 취급하지 않는다.

## 회귀 테스트

```bash
node --test tests/artifact-version-check.test.cjs
```

테스트는 임시 synthetic IPA/APK/AAB와 mocked Android extractor/제출 subprocess를
사용한다. EAS 로그인·실제 스토어 쓰기·네이티브 빌드·실제 광고 요청을 하지 않는다.
synthetic 성공 사례는 가드의 데이터 흐름 검증이며 실제 릴리스 적합성 증거가 아니다.
