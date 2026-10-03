import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const moduleUrl = new URL('../src/startup/jeju-startup.ts', import.meta.url);
let createJejuStartupRuntime;
if (existsSync(moduleUrl)) {
  const source = stripTypeScriptTypes(readFileSync(moduleUrl, 'utf8')).replace("'./startup-ota'", JSON.stringify(new URL('../src/startup/startup-ota.ts', import.meta.url).href));
  ({ createJejuStartupRuntime } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`));
}
const flush = async () => { for (let i = 0; i < 60; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const projectId = '4674ac32-4c72-4f37-b339-51f4037870a3';
const candidate = { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', runtimeVersion: '1.0.0', projectId };
function fixture({ service = {}, adapter: changes = {}, facts: factsChanges = {}, options = {} } = {}) {
  assert.equal(typeof createJejuStartupRuntime, 'function', 'Jeju needs a bounded, per-mount resource controller');
  let now = 0, timerId = 0, essential = false, foreground = true, theme = 'dark';
  const timers = new Map(), storage = new Map();
  const counts = { font: 0, theme: 0, check: 0, fetch: 0, reload: 0, ping: 0 };
  let native = { working: false, pending: false, candidate: null, error: false };
  const facts = { supported: true, projectId, runtimeVersion: '1.0.0', runningUpdateId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', isEmbeddedLaunch: false, emergency: false, restartCount: 0, checkAutomatically: 'NEVER', ...factsChanges };
  const clock = { now: () => now, setTimeout: (fn, ms) => { const id = ++timerId; timers.set(id, { fn, at: now + ms }); return id; }, clearTimeout: id => timers.delete(id) };
  const adapter = { facts: () => facts, prepare: async () => {}, check: async () => { counts.check++; return null; }, fetch: async () => { counts.fetch++; return candidate; }, reload: async () => { counts.reload++; }, storage: { get: async key => storage.get(key) ?? null, set: async (key, value) => { storage.set(key, value); } }, nativeSnapshot: () => native, canReload: () => foreground, ...changes };
  const services = { loadFonts: async () => { counts.font++; essential = true; }, essentialFontsReady: () => essential, readTheme: async () => { counts.theme++; return theme; }, ping: async () => { counts.ping++; }, ...service };
  const runtime = createJejuStartupRuntime(adapter, services, { ...options, clock });
  const mount = runtime.mount();
  async function tick(ms) {
    const target = now + ms; await flush();
    for (;;) {
      const due = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      now = due[1].at; timers.delete(due[0]); due[1].fn(); await flush();
    }
    now = target; await flush();
  }
  return { runtime, mount, counts, facts, storage, clock, tick, setNow: value => now = value, setEssential: value => essential = value, setTheme: value => theme = value, setForeground: value => foreground = value, setNative: value => { native = value; runtime.observeNative(); } };
}
test('ready launch preserves the 650ms minimum and 180ms finish', async () => {
  const f = fixture(); f.mount.start(); await f.tick(829); assert.equal(f.mount.snapshot().phase, 'loading');
  await f.tick(1); assert.equal(f.mount.snapshot().phase, 'ready'); assert.equal(f.mount.snapshot().theme, 'dark');
});
test('font acquisition time cannot consume the visible custom splash minimum', async () => {
  const font = deferred(); const f = fixture({ service: { loadFonts: () => font.promise } });
  f.mount.start(); await f.tick(4_000); f.setEssential(true); font.resolve(); await flush();
  await f.tick(829); assert.equal(f.mount.snapshot().phase, 'loading');
  await f.tick(1); assert.equal(f.mount.snapshot().phase, 'ready');
});
test('essential-font hang leads to recovery by five seconds without rendering historic text', async () => {
  const font = deferred(); const f = fixture({ service: { loadFonts: () => { f.counts.font++; return font.promise; } } });
  f.mount.start(); await f.tick(5_000); assert.equal(f.mount.snapshot().phase, 'recovery'); assert.equal(f.counts.check, 0); assert.equal(f.counts.reload, 0);
  f.setEssential(true); font.resolve(); await flush(); assert.equal(f.mount.snapshot().phase, 'recovery');
});
test('essential-font error gives a bounded retry with no second OTA owner', async () => {
  let attempt = 0; const f = fixture({ service: { loadFonts: async () => { f.counts.font++; if (++attempt === 1) throw Error('font'); f.setEssential(true); } } });
  f.mount.start(); await flush(); assert.equal(f.mount.snapshot().phase, 'recovery');
  f.mount.retry(); await f.tick(830); assert.equal(f.mount.snapshot().phase, 'ready'); assert.equal(f.counts.font, 2); assert.equal(f.counts.check, 0);
});
test('repeated retry while font/read remain pending never duplicates either native operation', async () => {
  const font = deferred(), theme = deferred(); const f = fixture({ service: { loadFonts: () => { f.counts.font++; return font.promise; }, readTheme: () => { f.counts.theme++; return theme.promise; } } });
  f.mount.start(); await f.tick(5_000); f.mount.retry(); f.mount.retry(); await f.tick(5_000);
  assert.equal(f.mount.snapshot().phase, 'recovery'); assert.equal(f.counts.font, 1); assert.equal(f.counts.theme, 1);
});
test('retry keeps the visible recovery screen rather than returning a blank root', async () => {
  const font = deferred(); const f = fixture({ service: { loadFonts: () => font.promise } });
  f.mount.start(); await f.tick(5_000); f.mount.retry(); await flush();
  assert.equal(f.mount.snapshot().phase, 'recovery'); assert.equal(f.mount.snapshot().retrying, true);
  await f.tick(5_000); assert.equal(f.mount.snapshot().retrying, false);
});
test('theme/read hang uses local system fallback and cannot mutate a mounted provider later', async () => {
  const theme = deferred(); const f = fixture({ service: { readTheme: () => { f.counts.theme++; return theme.promise; } } });
  f.mount.start(); await f.tick(2_180); assert.equal(f.mount.snapshot().phase, 'ready'); assert.equal(f.mount.snapshot().theme, 'system');
  theme.resolve('dark'); await flush(); assert.equal(f.mount.snapshot().theme, 'system');
});
test('genuine remount rereads current local theme rather than singleton cached initialMode', async () => {
  const f = fixture(); f.mount.start(); await f.tick(830); assert.equal(f.mount.snapshot().theme, 'dark');
  f.mount.close('unmount'); f.setTheme('light'); const next = f.runtime.mount(); next.start(); await f.tick(830);
  assert.equal(next.snapshot().theme, 'light'); assert.equal(f.counts.theme, 2); assert.equal(f.counts.font, 1); assert.equal(f.counts.check, 1);
});
test('remount waits for an old pending theme read then rereads, without applying its stale result', async () => {
  const old = deferred(); let reads = 0;
  const f = fixture({ service: { readTheme: () => { reads++; return reads === 1 ? old.promise : Promise.resolve('light'); } } });
  f.mount.start(); await flush(); f.mount.close('unmount'); const next = f.runtime.mount(); next.start(); await flush();
  assert.equal(reads, 1); old.resolve('dark'); await f.tick(830);
  assert.equal(next.snapshot().theme, 'light'); assert.equal(reads, 2);
});
test('an abandoned theme wait cannot initiate another local read after its mount deadline', async () => {
  const old = deferred(); let reads = 0;
  const f = fixture({ service: { readTheme: () => { reads++; return old.promise; } } });
  f.mount.start(); await flush(); f.mount.close('unmount'); const next = f.runtime.mount(); next.start(); await f.tick(2_180);
  old.resolve('dark'); await flush(); assert.equal(reads, 1); assert.equal(next.snapshot().theme, 'system');
});
test('serialized theme wait cannot start a fresh read after its own 2s budget while fonts remain pending', async () => {
  const old = deferred(), font = deferred(); let reads = 0;
  const f = fixture({ service: { loadFonts: () => font.promise, readTheme: () => { reads++; return reads === 1 ? old.promise : Promise.resolve('light'); } } });
  f.mount.start(); await flush(); f.mount.close('unmount'); const next = f.runtime.mount(); next.start(); await f.tick(2_500);
  old.resolve('dark'); await flush(); assert.equal(reads, 1); assert.equal(next.snapshot().theme, 'system'); next.close('unmount');
});
test('serialized theme wait respects the exact 2s boundary even if its timeout callback is delayed', async () => {
  const old = deferred(), font = deferred(); let reads = 0;
  const f = fixture({ service: { loadFonts: () => font.promise, readTheme: () => { reads++; return reads === 1 ? old.promise : Promise.resolve('light'); } } });
  f.mount.start(); await flush(); f.mount.close('unmount'); const next = f.runtime.mount(); next.start(); await flush();
  f.setNow(2_000); old.resolve('dark'); await flush(); assert.equal(reads, 1); assert.equal(next.snapshot().theme, 'system'); next.close('unmount');
});
test('a theme value resolving at its own deadline never publishes while the whole mount remains active', async () => {
  const theme = deferred(), font = deferred();
  const f = fixture({ service: { loadFonts: () => font.promise, readTheme: () => theme.promise } });
  f.mount.start(); await flush(); f.setNow(2_000); theme.resolve('dark'); await flush();
  assert.equal(f.mount.snapshot().theme, 'system'); f.mount.close('unmount');
});
test('queued native theme dispatch rechecks its own deadline before beginning a local read', async () => {
  const font = deferred(); const f = fixture({ service: { loadFonts: () => font.promise } });
  f.mount.start(); f.setNow(2_000); await flush();
  assert.equal(f.counts.theme, 0); assert.equal(f.mount.snapshot().theme, 'system'); f.mount.close('unmount');
});
test('a hanging ping is non-blocking and is not duplicated on retry/remount', async () => {
  const ping = deferred(); const f = fixture({ service: { ping: () => { f.counts.ping++; return ping.promise; } } });
  f.mount.start(); await f.tick(830); assert.equal(f.mount.snapshot().phase, 'ready'); f.mount.close('unmount');
  const next = f.runtime.mount(); next.start(); await f.tick(830); assert.equal(next.snapshot().phase, 'ready'); assert.equal(f.counts.ping, 1);
});
test('the 10s OTA decision window includes acquisition and late fetch can only cache', async () => {
  const fetch = deferred(); const f = fixture({ adapter: { check: async () => { f.counts.check++; return candidate; }, fetch: () => { f.counts.fetch++; return fetch.promise; } } });
  f.mount.start(); await f.tick(10_180); assert.equal(f.mount.snapshot().phase, 'ready');
  fetch.resolve(candidate); await flush(); assert.equal(f.counts.reload, 0); assert.equal(f.counts.fetch, 1);
});
test('whole startup is bounded at a configurable 12s even if native reload never settles', async () => {
  const reload = deferred(); const f = fixture({ adapter: { check: async () => candidate, reload: () => { f.counts.reload++; return reload.promise; } }, options: { deadlineMs: 12_000, otaWindowMs: 20_000 } });
  f.mount.start(); await f.tick(12_000); assert.equal(f.mount.snapshot().phase, 'ready'); assert.equal(f.counts.reload, 1);
});
test('background then foreground seals OTA permanently without skipping essential resources', async () => {
  const fetch = deferred(); const f = fixture({ adapter: { check: async () => candidate, fetch: () => { f.counts.fetch++; return fetch.promise; } } });
  f.mount.start(); await flush(); f.setForeground(false); f.runtime.closeOta('background'); f.setForeground(true);
  fetch.resolve(candidate); await f.tick(830); assert.equal(f.mount.snapshot().phase, 'ready'); assert.equal(f.counts.reload, 0);
});
test('unmount seals late reload and remount is allowed to refresh only resources', async () => {
  const fetch = deferred(); const f = fixture({ adapter: { check: async () => { f.counts.check++; return candidate; }, fetch: () => { f.counts.fetch++; return fetch.promise; } } });
  f.mount.start(); await flush(); f.mount.close('unmount'); const next = f.runtime.mount(); next.start();
  fetch.resolve(candidate); await f.tick(830); assert.equal(next.snapshot().phase, 'ready'); assert.equal(f.counts.reload, 0); assert.equal(f.counts.check, 1); assert.equal(f.counts.fetch, 1);
});
test('native automatic policy owns the fetch and pending handoff', async () => {
  const f = fixture({ facts: { checkAutomatically: 'ALWAYS' } });
  f.setNative({ working: false, pending: true, candidate, error: false }); f.mount.start(); await flush();
  assert.equal(f.counts.check, 0); assert.equal(f.counts.fetch, 0); assert.equal(f.counts.reload, 1);
});
test('persistent candidate attempt suppresses repeated reload after a new JS runtime', async () => {
  const f = fixture({ adapter: { check: async () => candidate } }); f.mount.start(); await flush(); assert.equal(f.counts.reload, 1);
  const second = fixture({ adapter: { check: async () => candidate, storage: { get: async k => f.storage.get(k) ?? null, set: async (k, v) => f.storage.set(k, v) } } });
  second.mount.start(); await second.tick(830); assert.equal(second.counts.reload, 0); assert.equal(second.counts.fetch, 0);
});
test('real entry vetoes reload before a pending guard write resolves', async () => {
  const write = deferred(); const f = fixture({ adapter: { check: async () => candidate, storage: { get: async () => null, set: () => write.promise } } });
  f.mount.start(); await flush(); f.runtime.markAppEntered(); write.resolve(); await f.tick(830); assert.equal(f.counts.reload, 0);
});
test('error in optional font load may enter only when NanumOld is confirmed loaded', async () => {
  const f = fixture({ service: { loadFonts: async () => { f.setEssential(true); throw Error('optional font'); } } });
  f.mount.start(); await f.tick(830); assert.equal(f.mount.snapshot().phase, 'ready');
});
