# iOS local build 실행 경로

`Gemfile.lock`에 2.237.0이 설치돼 있어도 Gemfile 선언이 `~> 2.236`이면
UULab 관리형 실행기는 거부한다. Gemfile과 lockfile을 모두 Fastlane2.237.0으로
고정하며 `.mise.toml`은 Ruby3.3.4를 선택한다.

빌드 없이 실제 Ruby/Fastlane/CocoaPods 경로만 검사:

```sh
npm run ios:toolchain:check
npm run test:ios-build
```

첫 명령은 설치된 중앙 managed-Ruby 실행기의 bundle/pod 검사를 수행한다.
EAS 계정 조회, native build, credential export, keychain 변경, host lock 획득을
실행하지 않는다. Node 테스트는 임시 디렉터리와 가짜 keychain 함수를 사용한다.

## 환경과 도구

`scripts/with-uulab-credentials.sh`는 현재 사용자 HOME 아래
`Documents/workspace/uulab/.credentials`를 기본으로 사용한다.
별도 기존 위치는 `UULAB_CREDENTIALS_DIR`로 지정한다. 프로세스 환경을 우선하고,
프로젝트 `.env`, `.env.local`, 중앙 `uulab-secrets.env`, `expo/jeju.env` 순으로
누락된 값만 읽는다. 값은 shell code로 평가하거나 출력하지 않는다.
일반적인 한 줄 `NAME=value`와 따옴표로 감싼 값을 지원한다.

iOS build 진입점은 `scripts/ios-local-build.cjs`를 거친다:

1. 명시한 profile/output과 native 변경 이유를 검사하고 기존 output 덮어쓰기를 거부한다.
2. 프로젝트 `ios-host-guard.cjs`가 공용 `~/.cache/uulab/ios-signing.lock`을
   atomic mkdir로 획득한다. PID/nonce를 기록하며 기존 lock을 훔치거나 삭제하지 않는다.
3. 현재 xcodebuild가 있거나 프로세스 검사가 실패하면 keychain 접근 전에 중단한다.
4. 현재 keychain search list를 기록하고 기존 중앙 EAS22.2.0 실행기를 호출한다.
   중앙 실행기는 관리형 Ruby3.3.4, bundled Fastlane2.237.0과 CocoaPods를 검사한다.
5. 성공/실패/중단 후 자식 프로세스 그룹 종료를 확인하고 원래 search list를
   복원한 뒤 자기 lock만 해제한다. EAS 부모가 종료돼도 하위 프로세스 그룹이
   살아 있거나 종료 확인/복원이 실패하면 snapshot과 lock을 보존한다.

중앙 도구 기본 위치는 `$HOME/Documents/workspace/uulab/expo/scripts/`이며,
기존 설치 위치가 다르면 `UULAB_EXPO_WORKSPACE`로 지정한다. 필요한 파일은
`uulab-eas-run.cjs`, `uulab-eas-managed-ruby.cjs`다. EAS22.2.0을 고정하고 도구가
없으면 중단한다. global EAS/system Ruby나 다른 앱의 서명 경로로 대체하지 않는다.

이 경로는 `build:local:ios`, `build:testflight:ios`, `build:screenshot:ios`와
`harness build ios/all`의 EAS iOS 호출에 적용한다. legacy Fastlane store/signing
lane의 별도 인증·동작을 표준화한 변경은 아니다. 명시적 artifact submit guard는 유지한다.

## 실제 빌드는 별도 native 릴리스 작업

소스/테스트/문서 수정만으로 빌드하거나 버전/runtime을 증가시키지 않는다.
향후 native 릴리스 범위가 확정된 경우에만 다음 형태를 사용한다:

```sh
UULAB_BINARY_REASON=sdk-upgrade npm run build:testflight:ios
```

실제 빌드 전 정확한 release-source SHA, store 번호 충돌 확인, 새 graph의 runtime,
기존 앱 전용 `credentials.json`/p12/profile, 디스크·메모리·다른 native 작업,
build-time provenance를 따로 확인한다. wrapper 통과는 서명/WWDR trust/아카이브
성공 증명이 아니다. 실제 artifact와 keychain trust 결과는 빌드에서 검증해야 한다.

Android30GiB/iOS40GiB는 이전 Mac 준비 단계의 보수적인 계획 예산이며
저장소에 정해진 절대 최소가 아니다. 실제 여유 공간과 동시 작업을 다시 측정하고
다른 작업의 파일/cache/process/lock을 지워서 맞추지 않는다. 폰 QA는 수행하지 않는다.
