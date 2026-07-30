#!/usr/bin/env node

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const baselinePath = path.join(__dirname, 'ota-native-baseline.json');
const nativeSensitivePatterns = [
  /^app\.json$/,
  /^app\.base\.json$/,
  /^app\.config\.(js|ts|mjs|cjs)$/,
  /^eas\.json$/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^yarn\.lock$/,
  /^pnpm-lock\.yaml$/,
  /^ios\//,
  /^android\//,
  /^plugins\//,
  /^credentials\.json$/,
  /^credentials\//,
  /^GoogleService-Info\.plist$/,
  /^google-services\.json$/,
  /^firebase\.json$/,
  /^assets\/images\/(icon|android-icon|adaptive-icon|splash|favicon)/,
];

function runGit(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function changedFiles() {
  const base = process.env.OTA_BASE_SHA || 'HEAD^';
  const head = process.env.OTA_HEAD_SHA || 'HEAD';
  const committed = runGit(['diff', '--name-only', base, head, '--', '.']);
  const working = runGit(['status', '--porcelain', '--untracked-files=all', '--', '.'])
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3))
    .join('\n');
  return [...new Set(`${committed}\n${working}`.split(/\r?\n/).filter(Boolean))];
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortJson(value[key])]));
}

function packageNativeConfigHash() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  // This validator-only setting pins checks to packages already embedded in the
  // submitted binary. Remove it when creating the next native baseline.
  if (packageJson.expo?.install) {
    delete packageJson.expo.install;
    if (Object.keys(packageJson.expo).length === 0) delete packageJson.expo;
  }
  const nativeKeys = [
    'version',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
    'overrides',
    'resolutions',
    'expo',
  ];
  const nativeConfig = Object.fromEntries(
    nativeKeys.filter((key) => packageJson[key] !== undefined).map((key) => [key, packageJson[key]]),
  );
  return crypto.createHash('sha256').update(JSON.stringify(sortJson(nativeConfig))).digest('hex');
}

function loadBaseline() {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  if (!baseline.runtimeVersion || !baseline.buildCode || !baseline.packageNativeConfigSha256 || !baseline.files) {
    throw new Error('OTA native baseline is incomplete');
  }
  return baseline;
}

function matchesBaseline(filePath, baseline) {
  if (filePath === 'package.json') {
    return packageNativeConfigHash() === baseline.packageNativeConfigSha256;
  }
  const absolutePath = path.join(root, filePath);
  if (!fs.existsSync(absolutePath)) {
    return (baseline.absentPrefixes || []).some((prefix) => filePath.startsWith(prefix));
  }
  const expected = baseline.files[filePath];
  if (filePath === 'app.base.json' && fs.existsSync(absolutePath)) {
    const current = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    delete current.expo?.ios?.buildNumber;
    delete current.expo?.android?.versionCode;
    const normalizedHash = crypto.createHash('sha256')
      .update(JSON.stringify(sortJson(current)))
      .digest('hex');
    return normalizedHash === expected;
  }
  return typeof expected === 'string' && sha256(absolutePath) === expected;
}

if (process.env.ALLOW_NATIVE_OTA === '1') {
  console.error('ALLOW_NATIVE_OTA is intentionally unsupported for this app. Build a compatible binary instead.');
  process.exit(1);
}

try {
  const baseline = loadBaseline();
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.base.json'), 'utf8')).expo;
  const platformBuildCodes = baseline.platformBuildCodes || {
    ios: baseline.buildCode,
    android: baseline.buildCode,
  };
  if (
    app.runtimeVersion !== baseline.runtimeVersion
    || String(app.ios?.buildNumber) !== String(platformBuildCodes.ios)
    || String(app.android?.versionCode) !== String(platformBuildCodes.android)
  ) {
    throw new Error('Expo runtime/build values do not match the verified store baseline');
  }

  const risky = changedFiles().filter((filePath) => nativeSensitivePatterns.some((pattern) => pattern.test(filePath)));
  const unmatched = risky.filter((filePath) => !matchesBaseline(filePath, baseline));

  if (unmatched.length) {
    console.error('Production OTA blocked because native-sensitive files differ from the submitted binary:');
    for (const filePath of unmatched) console.error(`- ${filePath}`);
    process.exit(1);
  }

  if (risky.length) {
    console.log(`Native-sensitive changes match submitted store baseline ${baseline.runtimeVersion} (${baseline.buildCode}).`);
  } else {
    console.log('No native-sensitive app files changed.');
  }
} catch (error) {
  console.error(`OTA native guard failed: ${error.message}`);
  process.exit(1);
}
