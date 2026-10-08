import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('historic routes and branded splash are guarded by essential NanumOld readiness', () => {
  const root = read('app/_layout.tsx');
  assert.ok(root.includes("state.phase === 'recovery'"));
  assert.ok(root.includes('if (!state.fontsReady) return null'));
  assert.ok(!root.includes('loaded || Boolean(error) || fontWaitExpired'));
});
test('native hide works on committed recovery/ready screens and custom splash layout', () => {
  const root = read('app/_layout.tsx'), splash = read('src/components/StartupSplash.tsx');
  assert.ok(root.includes('hideStartupNativeSplash()'));
  assert.ok(root.includes('onLayout={hideStartupNativeSplash}'));
  assert.ok(splash.includes('onLayout={onLayout}'));
});
test('recovery uses the approved mark/palette with modern Korean system text and accessible retry', () => {
  const path = new URL('../src/startup/StartupRecovery.tsx', import.meta.url);
  assert.ok(existsSync(path), 'missing essential-font recovery screen');
  const source = readFileSync(path, 'utf8');
  assert.ok(source.includes('splash-mark.png')); assert.ok(source.includes('#FFFCF7'));
  assert.ok(source.includes('accessibilityRole="button"')); assert.ok(source.includes('다시 준비하기'));
  assert.ok(!source.includes('fontFamily')); assert.ok(!source.includes('vector-icons'));
});
test('root keeps provider tree intact and delegates only startup acquisition and OTA', () => {
  const root = read('app/_layout.tsx');
  for (const tag of ['SafeAreaProvider', 'AppThemeProvider', 'JejuDataProvider', 'PlaceDataProvider', 'FavoritesProvider', 'SavedPlacesProvider', 'PushNotificationsProvider']) assert.ok(root.includes('<' + tag));
  assert.ok(root.includes('initialMode={state.theme}'));
  assert.ok(!root.includes('Updates.reloadAsync()'));
});
test('custom splash is byte-identical to the pinned brand after removing the layout callback', () => {
  const source = read('src/components/StartupSplash.tsx').replace('  onLayout?: () => void;\n', '').replace('{ message, progress, onLayout }', '{ message, progress }').replace(' onLayout={onLayout}', '').trimEnd() + '\n';
  const bytes = Buffer.from(source);
  const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(hash, 'f5246d33e377950cf6b51d412811e9425fe12b4a');
});
test('existing navigation and theme remain pinned alongside the new ad privacy route', () => {
  const root = read('app/_layout.tsx');
  const adPrivacyRoute = '        <Stack.Screen name="settings/ad-privacy" />\n';
  assert.equal(root.split(adPrivacyRoute).length - 1, 1);
  const source = root.slice(root.indexOf('function Navigation()')).replace(adPrivacyRoute, '').trim() + '\n';
  assert.equal(createHash('sha256').update(source).digest('hex'), 'f90a304f32e7fc91bf98c18439af6505005d4f6153a580258742dc91ba0cec02');
});
test('all eleven original font assets and the essential NanumOld family are retained', () => {
  const source = read('src/startup/StartupRuntime.ts');
  const assets = [...source.matchAll(/require\('([^']+\.(?:otf|ttf))'\)/g)].map(match => match[1].replace('../../assets/fonts/', '')).sort();
  assert.deepEqual(assets, ['NanumBarunGothicBold.ttf', 'NanumMyeongjo-YetHangul.ttf', ...['Thin', 'ExtraLight', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'].map(weight => `pretendard/Pretendard-${weight}.otf`)].sort());
  assert.ok(source.includes("Font.isLoaded('NanumOld')"));
});
