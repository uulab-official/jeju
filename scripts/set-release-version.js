#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ANDROID_VERSION_CODE_MAX = 2100000000;

function usage() {
  console.error('Usage: npm run release:version -- <app-version> <build-number>');
  console.error('Example: npm run release:version -- 1.0.2 26042801');
}

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(root, fileName), 'utf8'));
}

function writeJson(fileName, value) {
  fs.writeFileSync(path.join(root, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function parseArgs(argv) {
  const positional = [];
  let version;
  let build;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--version') {
      version = argv[++i];
    } else if (arg.startsWith('--version=')) {
      version = arg.slice('--version='.length);
    } else if (arg === '--build') {
      build = argv[++i];
    } else if (arg.startsWith('--build=')) {
      build = arg.slice('--build='.length);
    } else {
      positional.push(arg);
    }
  }

  return {
    version: version || positional[0],
    build: build || positional[1],
  };
}

const { version, build } = parseArgs(process.argv.slice(2));

if (process.env.UULAB_NEW_PUBLIC_RELEASE !== '1') {
  console.error('Refusing to change the public version without UULAB_NEW_PUBLIC_RELEASE=1.');
  console.error('Classify the diff first. OTA and no-op changes must keep version/runtime/build fields unchanged.');
  process.exit(1);
}

const publicReleaseReasons = new Set(['native-change', 'sdk-upgrade', 'first-store-release', 'review-native-fix']);
if (!publicReleaseReasons.has(process.env.UULAB_BINARY_REASON)) {
  console.error('Refusing to change the public version without a native or first-release UULAB_BINARY_REASON.');
  console.error(`Allowed reasons: ${Array.from(publicReleaseReasons).join(', ')}`);
  process.exit(1);
}

if (!version || !build) {
  usage();
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid app version: ${version}`);
  console.error('Use App Store compatible semver, for example 1.0.2.');
  process.exit(1);
}

if (!/^\d{8}$/.test(String(build))) {
  console.error(`Invalid build number: ${build}`);
  console.error('Use YYMMDDNN, for example 26042801.');
  process.exit(1);
}

const buildNumber = Number(build);
if (!Number.isSafeInteger(buildNumber) || buildNumber < 1 || buildNumber > ANDROID_VERSION_CODE_MAX) {
  console.error(`Invalid Android versionCode: ${build}`);
  console.error(`It must be between 1 and ${ANDROID_VERSION_CODE_MAX}.`);
  process.exit(1);
}

const configFile = fs.existsSync(path.join(root, 'app.base.json')) ? 'app.base.json' : 'app.json';
if (!fs.existsSync(path.join(root, configFile))) {
  console.error('Could not find app.base.json or app.json. Update Expo app version manually.');
  process.exit(1);
}

const appConfig = readJson(configFile);
appConfig.expo ||= {};
const currentIosBuild = Number(appConfig.expo.ios?.buildNumber || 0);
const currentAndroidBuild = Number(appConfig.expo.android?.versionCode || 0);
if (buildNumber <= currentIosBuild || buildNumber <= currentAndroidBuild) {
  console.error(`Build number must exceed both selected local values (iOS ${currentIosBuild}, Android ${currentAndroidBuild}).`);
  process.exit(1);
}
appConfig.expo.version = version;
appConfig.expo.runtimeVersion = version;
appConfig.expo.ios ||= {};
appConfig.expo.android ||= {};
appConfig.expo.ios.buildNumber = String(buildNumber);
appConfig.expo.android.versionCode = buildNumber;
writeJson(configFile, appConfig);

const pkg = readJson('package.json');
pkg.version = version;
writeJson('package.json', pkg);

if (fs.existsSync(path.join(root, 'package-lock.json'))) {
  const lock = readJson('package-lock.json');
  lock.version = version;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = version;
  }
  writeJson('package-lock.json', lock);
}

console.log(`Release version set to ${version} (${buildNumber}) for iOS and Android.`);
