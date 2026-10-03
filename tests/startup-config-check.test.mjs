import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url).pathname;
function check(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'jeju-startup-check-'));
  try {
    for (const path of ['app.base.json', 'app', 'src/startup', 'src/components/StartupSplash.tsx']) cpSync(join(root, path), join(dir, path), { recursive: true });
    mutate?.(dir);
    return spawnSync(process.execPath, [join(root, 'scripts/startup-config-check.js'), dir], { encoding: 'utf8' });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const replace = (dir, path, before, after) => { const file = join(dir, path); const source = readFileSync(file, 'utf8'); assert.ok(source.includes(before)); writeFileSync(file, source.replace(before, after)); };
test('configuration check recognizes the extracted finite owner and matching splash', () => {
  const result = check(); assert.equal(result.status, 0, result.stdout + result.stderr);
});
test('configuration check rejects missing durable OTA ownership', () => {
  const result = check(dir => replace(dir, 'src/startup/StartupRuntime.ts', 'createJejuStartupRuntime({', 'brokenOwner({'));
  assert.notEqual(result.status, 0);
});
test('configuration check rejects an unbounded whole budget', () => {
  const result = check(dir => replace(dir, 'src/startup/StartupRuntime.ts', 'STARTUP_DECISION_MS = 12_000', 'STARTUP_DECISION_MS = Infinity'));
  assert.notEqual(result.status, 0);
});
test('configuration check still rejects changed native splash color', () => {
  const result = check(dir => { const file = join(dir, 'app.base.json'); const config = JSON.parse(readFileSync(file, 'utf8')); config.expo.plugins.find(p => Array.isArray(p) && p[0] === 'expo-splash-screen')[1].backgroundColor = '#000000'; writeFileSync(file, JSON.stringify(config)); });
  assert.notEqual(result.status, 0);
});
test('configuration check rejects fabricated essential-font readiness', () => {
  const result = check(dir => replace(dir, 'src/startup/StartupRuntime.ts', "essentialFontsReady: () => Font.isLoaded('NanumOld')", 'essentialFontsReady: () => true'));
  assert.notEqual(result.status, 0);
});
test('configuration check rejects a false permanent seal even though its declaration is intact', () => {
  const result = check(dir => replace(dir, 'src/startup/jeju-startup.ts', 'otaSealed = true;', 'otaSealed = false;'));
  assert.notEqual(result.status, 0);
});
test('configuration check rejects a whole-budget timer present only inside a comment', () => {
  const result = check(dir => replace(dir, 'src/startup/jeju-startup.ts', 'schedule(finish, deadlineMs);', '// schedule(finish, deadlineMs);'));
  assert.notEqual(result.status, 0);
});
test('configuration check rejects a missing recovery module imported by the root', () => {
  const result = check(dir => rmSync(join(dir, 'src/startup/StartupRecovery.tsx')));
  assert.notEqual(result.status, 0);
});
test('real font readiness cannot be replaced by a comment next to a fabricated value', () => {
  const result = check(dir => replace(dir, 'src/startup/StartupRuntime.ts', "essentialFontsReady: () => Font.isLoaded('NanumOld')", "essentialFontsReady: () => true /* essentialFontsReady: () => Font.isLoaded('NanumOld') */"));
  assert.notEqual(result.status, 0);
});
test('a deadline call written in a string does not schedule the whole budget', () => {
  const result = check(dir => replace(dir, 'src/startup/jeju-startup.ts', 'schedule(finish, deadlineMs);', "void 'schedule(finish, deadlineMs);';"));
  assert.notEqual(result.status, 0);
});
test('a permanent seal written in a comment cannot repair an executable false assignment', () => {
  const result = check(dir => replace(dir, 'src/startup/jeju-startup.ts', 'otaSealed = true;', 'otaSealed = false; /* otaSealed = true; */'));
  assert.notEqual(result.status, 0);
});
test('a duplicate services property cannot override verified readiness with a fabricated value', () => {
  const result = check(dir => replace(dir, 'src/startup/StartupRuntime.ts', "essentialFontsReady: () => Font.isLoaded('NanumOld'),", "essentialFontsReady: () => Font.isLoaded('NanumOld'), essentialFontsReady: () => true,"));
  assert.notEqual(result.status, 0);
});
for (const override of ["'essentialFontsReady': () => true", "['essentialFontsReady']: () => true", '...{ essentialFontsReady: () => true }']) {
  test(`fixed services contract rejects readiness override through ${override}`, () => {
    const result = check(dir => replace(dir, 'src/startup/StartupRuntime.ts', "essentialFontsReady: () => Font.isLoaded('NanumOld'),", `essentialFontsReady: () => Font.isLoaded('NanumOld'), ${override},`));
    assert.notEqual(result.status, 0);
  });
}
test('fixed services contract normalizes a quoted real readiness key', () => {
  const result = check(dir => replace(dir, 'src/startup/StartupRuntime.ts', "essentialFontsReady: () => Font.isLoaded('NanumOld')", "'essentialFontsReady': () => Font.isLoaded('NanumOld')"));
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
test('fixed services contract rejects ambiguous escaped literal keys that could shadow readiness', () => {
  const result = check(dir => replace(dir, 'src/startup/StartupRuntime.ts', "essentialFontsReady: () => Font.isLoaded('NanumOld'),", "essentialFontsReady: () => Font.isLoaded('NanumOld'), '\\u0065ssentialFontsReady': () => true,"));
  assert.notEqual(result.status, 0);
});
test('fixed services contract rejects duplicates after normalizing another quoted services key', () => {
  const result = check(dir => replace(dir, 'src/startup/StartupRuntime.ts', 'readTheme: readThemePreference,', "readTheme: readThemePreference, 'readTheme': () => 'system',"));
  assert.notEqual(result.status, 0);
});
