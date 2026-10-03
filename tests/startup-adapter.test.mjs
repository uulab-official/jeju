import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Native boundaries are injected; controller/storage/resource behavior stays real.
async function fixture({ mutateOnSet, nativePolicy = 'NEVER', noContext = false } = {}) {
  const counts = { check: 0, fetch: 0, reload: 0, hide: 0, essential: 0, decorative: 0 };
  const candidate = { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', runtimeVersion: '1.0.0' };
  const context = { isStartupProcedureRunning: false, isChecking: false, isDownloading: false, isUpdatePending: false, restartCount: 0 };
  let fontsReady = false, listener, appStateListener;
  const data = new Map();
  const Updates = {
    isEnabled: true, runtimeVersion: '1.0.0', updateId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', isEmbeddedLaunch: false,
    isEmergencyLaunch: false, checkAutomatically: nativePolicy, latestContext: noContext ? undefined : context,
    checkForUpdateAsync: async () => { counts.check++; return { isAvailable: true, manifest: candidate }; },
    fetchUpdateAsync: async () => { counts.fetch++; return { isNew: true, manifest: candidate }; },
    reloadAsync: async () => { counts.reload++; }, addUpdatesStateChangeListener: fn => { listener = fn; },
  };
  const mocks = {
    AsyncStorage: { getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); mutateOnSet?.({ Updates, AppState: mocks.AppState }); } },
    Constants: { appOwnership: 'standalone', easConfig: { projectId: '4674ac32-4c72-4f37-b339-51f4037870a3' } },
    Font: { isLoaded: () => fontsReady, loadAsync: async fonts => { if ('NanumOld' in fonts) { counts.essential++; fontsReady = true; } else counts.decorative++; } },
    SplashScreen: { hide: () => { counts.hide++; }, hideAsync: async () => { counts.hide++; } },
    Updates, AppState: { currentState: 'active', addEventListener: (_, fn) => { appStateListener = fn; } }, Platform: { OS: 'ios' },
    pingAppwrite: async () => {}, readThemePreference: async () => 'dark',
  };
  const key = '__jeju_native_test_' + Math.random().toString(36).slice(2);
  globalThis[key] = mocks;
  let source = stripTypeScriptTypes(readFileSync(new URL('../src/startup/StartupRuntime.ts', import.meta.url), 'utf8'));
  for (const name of ['AsyncStorage', 'Constants', 'Font', 'SplashScreen', 'Updates', 'pingAppwrite', 'readThemePreference']) source = source.replace(new RegExp(`import (?:\\* as )?(?:\\{ )?${name}(?: \\})? from '[^']+';`), `const ${name} = mocks.${name};`);
  source = source.replace("import { AppState, Platform } from 'react-native';", 'const { AppState, Platform } = mocks;');
  const startupSource = stripTypeScriptTypes(readFileSync(new URL('../src/startup/jeju-startup.ts', import.meta.url), 'utf8')).replace("'./startup-ota'", JSON.stringify(new URL('../src/startup/startup-ota.ts', import.meta.url).href));
  source = source.replace("'./jeju-startup'", JSON.stringify('data:text/javascript;base64,' + Buffer.from(startupSource).toString('base64'))).replace("'./startup-ota'", JSON.stringify(new URL('../src/startup/startup-ota.ts', import.meta.url).href));
  const module = await import('data:text/javascript;base64,' + Buffer.from(`const mocks = globalThis[${JSON.stringify(key)}]; const __DEV__ = false; const require = () => 1;\n${source}`).toString('base64'));
  delete globalThis[key];
  const runtime = module.getStartupRuntime(), mount = runtime.mount(); mount.start();
  const flush = async () => { for (let i = 0; i < 80; i++) await Promise.resolve(); };
  await flush();
  return { counts, Updates, context, runtime, mount, module, flush, native: () => listener?.(), appState: value => { mocks.AppState.currentState = value; appStateListener?.(value); }, cleanup: () => mount.close('unmount') };
}
test('installed adapter uses one manual fetch and a single durable reload request', async () => {
  const f = await fixture(); try { assert.equal(f.counts.check, 1); assert.equal(f.counts.fetch, 1); assert.equal(f.counts.reload, 1); assert.equal(f.counts.essential, 1); assert.equal(f.counts.decorative, 1); } finally { f.cleanup(); }
});
test('synchronous native candidate change during durable write vetoes the stale reload', async () => {
  const f = await fixture({ mutateOnSet: ({ Updates }) => { Updates.latestContext = { ...Updates.latestContext, isUpdatePending: true, downloadedManifest: { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', runtimeVersion: '1.0.0' } }; } });
  try { assert.equal(f.counts.reload, 0); } finally { f.cleanup(); }
});
test('live AppState veto between persistent write and native call prevents reload', async () => {
  const f = await fixture({ mutateOnSet: ({ AppState }) => { AppState.currentState = 'background'; } });
  try { assert.equal(f.counts.reload, 0); } finally { f.cleanup(); }
});
test('unknown native context never establishes safe reload facts', async () => {
  const f = await fixture({ noContext: true }); try { assert.equal(f.counts.check, 0); assert.equal(f.counts.reload, 0); } finally { f.cleanup(); }
});
test('native automatic policy never duplicates network work', async () => {
  const f = await fixture({ nativePolicy: 'ALWAYS' }); try { assert.equal(f.counts.check, 0); assert.equal(f.counts.fetch, 0); } finally { f.cleanup(); }
});
test('native hide helper is non-blocking and idempotent on ready/remount fallback', async () => {
  const f = await fixture(); try { f.module.hideStartupNativeSplash(); f.module.hideStartupNativeSplash(); assert.equal(f.counts.hide, 1); } finally { f.cleanup(); }
});
