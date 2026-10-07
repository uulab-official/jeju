const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const semver = require('semver');

const root = path.resolve(__dirname, '..');
const manifest = require('../package.json');
const lock = require('../package-lock.json');
const installed = (name) => JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8'));

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

test('all direct SDK packages match the installed Expo bundle, including install.exclude entries', () => {
  const bundled = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/expo/bundledNativeModules.json'), 'utf8'));
  for (const [name, declared] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })) {
    if (!bundled[name]) continue;
    const version = installed(name).version;
    assert.ok(semver.satisfies(version, declared), `${name}@${version} must satisfy package.json ${declared}`);
    assert.ok(semver.satisfies(version, bundled[name]), `${name}@${version} must satisfy Expo's ${bundled[name]}`);
    assert.equal(lock.packages[`node_modules/${name}`]?.version, version, `${name} must match the lockfile`);
  }
});
