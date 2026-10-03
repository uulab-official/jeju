import assert from 'node:assert/strict';
import test from 'node:test';
import { createStartupGate } from '../src/startup/startup-ota.ts';

const adapter = {
  facts: () => ({ supported: false, runningUpdateId: null }),
  prepare: () => new Promise(() => {}),
  nativeSnapshot: () => ({ working: false, pending: false, candidate: null }),
};

test('default startup timers do not pass the clock object to browser host functions', async () => {
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  let scheduled = false;
  let cleared = false;
  globalThis.setTimeout = function () {
    assert.ok(this === undefined || this === globalThis, 'browser host timer receiver');
    scheduled = true;
    return 17;
  };
  globalThis.clearTimeout = function (timer) {
    assert.ok(this === undefined || this === globalThis, 'browser host timer receiver');
    assert.equal(timer, 17);
    cleared = true;
  };
  try {
    const gate = createStartupGate(adapter, { deadlineMs: 8000 });
    const result = gate.start();
    gate.close('entry');
    assert.equal((await result).reason, 'entry');
    assert.equal(scheduled, true);
    assert.equal(cleared, true);
  } finally {
    globalThis.setTimeout = originalSet;
    globalThis.clearTimeout = originalClear;
  }
});

test('injected stateful clock retains its receiver for deadline and cleanup', async () => {
  const clock = {
    time: 100,
    scheduled: false,
    cleared: false,
    now() { assert.equal(this, clock); return this.time; },
    setTimeout() { assert.equal(this, clock); this.scheduled = true; return 23; },
    clearTimeout(timer) { assert.equal(this, clock); assert.equal(timer, 23); this.cleared = true; },
  };
  const gate = createStartupGate(adapter, { deadlineMs: 8000, clock });
  const result = gate.start();
  clock.time += 8000;
  gate.observeNative();
  assert.equal((await result).reason, 'deadline');
  assert.equal(clock.scheduled, true);
  assert.equal(clock.cleared, true);
});

