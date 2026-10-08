'use strict';

// Run the actual TSX async lifecycle with only React/native boundaries injected.
const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const repository = path.resolve(__dirname, '..');
const requireFromRepository = createRequire(path.join(repository, 'package.json'));
const ts = requireFromRepository('typescript');
const source = fs.readFileSync(path.join(repository, 'src/components/NativeDiscoverAdSlot.native.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

const effects = [];
const stateWrites = [];
let stateIndex = 0;
let privacyChanged;
let resolveAd;
let destroyed = 0;
const ads = {
  NativeAd: { createForAdRequest: () => new Promise(resolve => { resolveAd = resolve; }) },
  NativeAdChoicesPlacement: { TOP_RIGHT: 1 },
  NativeAdView: () => null,
  NativeMediaView: () => null,
  NativeAsset: () => null,
  NativeAssetType: {},
};
const modules = {
  react: {
    useState: initial => {
      const index = stateIndex++;
      return [typeof initial === 'function' ? initial() : initial, value => {
        stateWrites.push([index, typeof value === 'function' ? 'increment' : value]);
      }];
    },
    useRef: initial => ({ current: initial }),
    useEffect: callback => effects.push(callback),
  },
  'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
  'react-native': { StyleSheet: { create: value => value, hairlineWidth: 1 } },
  'react-native-google-mobile-ads': ads,
  '@/src/features/ads/config': { getNativeDiscoverAdUnitId: () => 'test-only' },
  '@/src/features/ads/mobile-ads': {
    initializeMobileAds: async () => true,
    subscribeToAdPrivacyChanges: callback => { privacyChanged = callback; return () => {}; },
  },
  '@/src/features/ads/safe-native-ad': { safeDestroyNativeAd: ad => ad?.destroy() },
  '@/src/providers/AppThemeProvider': { useAppTheme: () => ({ colors: {} }) },
  '@/src/theme/tokens': { layout: {}, typography: {} },
};
const sandbox = {
  exports: {}, setTimeout, clearTimeout,
  require: name => {
    if (!(name in modules)) throw new Error(`Unexpected module: ${name}`);
    return modules[name];
  },
};
vm.runInNewContext(compiled, sandbox);
sandbox.exports.NativeDiscoverAdSlot();
const cleanups = effects.map(effect => effect());

test('privacy invalidation immediately cancels a pending native ad before React cleanup', async () => {
  try {
    await new Promise(setImmediate);
    assert.equal(typeof resolveAd, 'function', 'the mocked ad request should be pending');
    // Deliberately defer React's next render/passive-effect cleanup. Native async
    // completions must be invalidated synchronously by the privacy notification.
    privacyChanged();
    const start = stateWrites.length;
    const oldAd = { destroy() { destroyed++; } };
    resolveAd(oldAd);
    await new Promise(setImmediate);
    const afterInvalidation = stateWrites.slice(start);
    console.log(JSON.stringify({
      writesAfterPrivacyInvalidation: afterInvalidation.map(([state, value]) => ({ state, value: value === oldAd ? 'oldAd' : value })),
      destroyedBeforeEffectCleanup: destroyed,
    }));
    assert.equal(afterInvalidation.some(([, value]) => value === oldAd || value === 'ready'), false,
      'a pre-privacy request must not restore an old ad before passive-effect cleanup');
    assert.equal(destroyed, 1, 'the stale ad must be destroyed before passive-effect cleanup');
  } finally {
    for (const cleanup of cleanups.reverse()) cleanup?.();
    console.log(JSON.stringify({ destroyedAfterEffectCleanup: destroyed }));
  }
});
