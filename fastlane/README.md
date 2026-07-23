fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios match_appstore

```sh
[bundle exec] fastlane ios match_appstore
```

Sync App Store signing assets with fastlane match

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build locally and upload to TestFlight without EAS Cloud Build

### ios upload_xcode

```sh
[bundle exec] fastlane ios upload_xcode
```

Upload an existing local archive using the signed-in Xcode account

### ios metadata

```sh
[bundle exec] fastlane ios metadata
```

Upload App Store metadata and synchronize screenshots

### ios privacy

```sh
[bundle exec] fastlane ios privacy
```

Upload App Store privacy nutrition details as a draft unless IOS_PRIVACY_PUBLISH=1

### ios prepare_store_version

```sh
[bundle exec] fastlane ios prepare_store_version
```

Attach the processed build and fill App Review prerequisites without submitting

### ios pricing_status

```sh
[bundle exec] fastlane ios pricing_status
```

Report the current App Store base price without changing it

### ios set_free_price

```sh
[bundle exec] fastlane ios set_free_price
```

Set the App Store price schedule to free after an explicit release decision

### ios screenshots_audit

```sh
[bundle exec] fastlane ios screenshots_audit
```

Audit App Store screenshots without changing remote data

### ios screenshots_deduplicate

```sh
[bundle exec] fastlane ios screenshots_deduplicate
```

Delete exact duplicate App Store screenshots after explicit confirmation

### ios store_status

```sh
[bundle exec] fastlane ios store_status
```

Report live App Store availability, price, and review state without changing data

### ios cancel_review

```sh
[bundle exec] fastlane ios cancel_review
```

Cancel only an explicitly named waiting/in-review version; never an approved or live version

### ios submit_review

```sh
[bundle exec] fastlane ios submit_review
```

Submit the selected build without uploading screenshots again

----


## Android

### android metadata

```sh
[bundle exec] fastlane android metadata
```

Upload Google Play metadata and synchronize images without uploading an AAB

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
