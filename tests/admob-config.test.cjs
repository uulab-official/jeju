const assert = require('node:assert/strict');
const { test } = require('node:test');
const makeConfig = require('../app.config');

const keys = ['IOS_APP_ID', 'ANDROID_APP_ID', 'NATIVE_DISCOVER_IOS_ID', 'NATIVE_DISCOVER_ANDROID_ID'].map(k => `EXPO_PUBLIC_ADMOB_${k}`);
function config(env = {}) {
  const names = [...keys, 'EAS_BUILD_PROFILE', 'EXPO_PUBLIC_ADMOB_ENV', 'EXPO_PUBLIC_ADMOB_FORCE_TEST_ADS', 'EXPO_OTA_RUNTIME_VERSION'];
  const previous = Object.fromEntries(names.map(k => [k, process.env[k]]));
  try { for (const k of names) delete process.env[k]; Object.assign(process.env, env); return makeConfig(); }
  finally { for (const k of names) { if (previous[k] === undefined) delete process.env[k]; else process.env[k] = previous[k]; } }
}
const production = Object.fromEntries(keys.map((k,i) => [k, `ca-app-pub-1111111111111111${i < 2 ? '~' : '/'}222222222${i}`]));
test('local config uses Google sample IDs and delayed measurement', () => {
  const c = config();
  assert.equal(c.extra.admob.testMode, true);
  assert.match(c.extra.admob.nativeDiscoverAndroid, /^ca-app-pub-3940256099942544\//);
  const plugin = c.plugins.find(p => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads');
  assert.equal(plugin[1].delayAppMeasurementInit, true);
});
test('production cannot silently ship missing, malformed, sample, or forced-test IDs', () => {
  for (const env of [{}, {...production,[keys[0]]:'malformed'}, {...production,[keys[2]]:'ca-app-pub-3940256099942544/2247696110'}, {...production,EXPO_PUBLIC_ADMOB_FORCE_TEST_ADS:'1'}]) {
    assert.throws(() => config({...env,EAS_BUILD_PROFILE:'production'}), /AdMob/);
  }
});
test('production maps the correct platform IDs without altering SDK release identity', () => {
  const c = config({...production,EAS_BUILD_PROFILE:'production'});
  assert.equal(c.extra.admob.productionReady,true);
  assert.equal(c.extra.admob.nativeDiscoverIos,production[keys[2]]);
  assert.equal(c.android.package,'kr.co.uulab.jeju');
  assert.notEqual(c.runtimeVersion,'jeju-sdk57.0.27-rn0.86.3-20261008');
});
test('R8 code/resource optimization keeps the UMP consent implementation', () => {
  const c = config();
  const android = c.plugins.find(p => Array.isArray(p) && p[0] === 'expo-build-properties')?.[1].android;
  assert.equal(android?.enableMinifyInReleaseBuilds,true);
  assert.equal(android?.enableShrinkResourcesInReleaseBuilds,true);
  assert.match(android?.extraProguardRules ?? '',/com\.google\.android\.gms\.internal\.consent_sdk/);
});
test('an OTA runtime override cannot target the built ad-free candidate', () => {
  assert.throws(() => config({EXPO_OTA_RUNTIME_VERSION:'jeju-sdk57.0.27-rn0.86.3-20261008'}), /AdMob.*runtime/);
});
