const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const semver = require('semver');

const root = path.resolve(__dirname, '..');
const manifest = require('../package.json');
const lock = require('../package-lock.json');
const installed = (name) => JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8'));

// Live Expo SDK 57 recommendations observed on 2026-10-07. The baseline
// 57.0.9 bundled map was stale; these captured floors guard against that regression.
const companionMinima = {
  "expo": "57.0.27",
  "expo-asset": "57.0.19",
  "expo-audio": "57.0.5",
  "expo-constants": "57.0.21",
  "expo-device": "57.0.2",
  "expo-font": "57.0.4",
  "expo-haptics": "57.0.3",
  "expo-image": "57.0.5",
  "expo-linear-gradient": "57.0.2",
  "expo-linking": "57.0.12",
  "expo-notifications": "57.0.22",
  "expo-router": "57.0.25",
  "expo-splash-screen": "57.0.9",
  "expo-symbols": "57.0.3",
  "expo-updates": "57.0.25",
  "expo-web-browser": "57.0.3",
  "react-native": "0.86.3",
  "eslint-config-expo": "57.0.2"
};

for (const [name, minimum] of Object.entries(companionMinima)) {
  test(`${name} retains the verified SDK 57 companion minimum ${minimum}`, () => {
    const version = lock.packages[`node_modules/${name}`]?.version;
    assert.ok(semver.satisfies(version, `>=${minimum} <${name === 'react-native' ? '0.87' : '58'}`), `${name}@${version} is below ${minimum}`);
    const declared = manifest.dependencies[name] || manifest.devDependencies[name];
    assert.ok(semver.gte(semver.minVersion(declared), minimum), `${name} declaration permits an older patch`);
    assert.equal(installed(name).version, version, `${name} installation must match the lockfile`);
  });
}

test('SDK version validation no longer skips the repaired package set', () => {
  assert.deepEqual(manifest.expo?.install?.exclude || [], []);
});

test('Appwrite and Expo share one compatible SDK 57 file-system native module', () => {
  const entries = Object.keys(lock.packages).filter((name) => name.endsWith('node_modules/expo-file-system'));
  assert.deepEqual(entries, ['node_modules/expo-file-system']);
  const version = installed('expo-file-system').version;
  assert.ok(semver.satisfies(version, installed('expo').dependencies['expo-file-system']));
  assert.equal(manifest.overrides['react-native-appwrite']['expo-file-system'], version);
});

test('Expo Linking resolves one compatible native Expo Constants package', () => {
  const constantsEntries = Object.keys(lock.packages).filter((name) => name.endsWith('node_modules/expo-constants'));
  assert.deepEqual(constantsEntries, ['node_modules/expo-constants'], 'Do not introduce a second native Constants package');
  const expected = installed('expo-linking').dependencies['expo-constants'];
  assert.ok(semver.satisfies(installed('expo-constants').version, expected), `Expo Linking requires expo-constants ${expected}`);
});

test('SDK 57 lockfile cannot restore the known Hermes V1 memory regression', () => {
  for (const [name, range] of Object.entries({
    expo: '>=57.0.9 <58',
    'react-native': '>=0.86.2 <0.87',
    'hermes-compiler': '>=250829098.0.16',
  })) {
    const version = lock.packages[`node_modules/${name}`]?.version;
    assert.ok(semver.satisfies(version, range), `${name}@${version} must satisfy ${range}`);
    assert.equal(installed(name).version, version, `${name} installation must match the lockfile`);
  }
  assert.equal(installed('react-native').dependencies['hermes-compiler'], installed('hermes-compiler').version);
  const hermesVersion = installed('hermes-compiler').version;
  const nativeVersion = fs.readFileSync(path.join(root, 'node_modules/react-native/sdks/.hermesv1version'), 'utf8').trim();
  assert.equal(nativeVersion, `hermes-v${hermesVersion}`, 'React Native native Hermes must match the fixed compiler');
});

test('all direct SDK packages match the installed Expo bundle', () => {
  const bundled = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/expo/bundledNativeModules.json'), 'utf8'));
  for (const [name, declared] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })) {
    if (!bundled[name]) continue;
    const version = installed(name).version;
    assert.ok(semver.satisfies(version, declared), `${name}@${version} must satisfy package.json ${declared}`);
    assert.ok(semver.satisfies(version, bundled[name]), `${name}@${version} must satisfy Expo's ${bundled[name]}`);
    assert.equal(lock.packages[`node_modules/${name}`]?.version, version, `${name} must match the lockfile`);
  }
});
