const assert = require("node:assert/strict");
const { mkdtempSync, existsSync, rmSync, readFileSync, writeFileSync, realpathSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { acquireLock, runGuard } = require("../scripts/ios-host-guard.cjs");

test("host lock prevents another app's concurrent signing without stealing its lock", () => {
  const root = mkdtempSync(path.join(tmpdir(), "jeju-ios-lock-"));
  const directory = path.join(root, "lock");
  const release = acquireLock(directory);
  try {
    assert.throws(() => acquireLock(directory), /signing is locked/);
    assert.equal(existsSync(path.join(directory, "owner.json")), true);
  } finally { release(); rmSync(root, { recursive: true }); }
});

test("existing xcodebuild prevents keychain changes and releases only our new lock", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "jeju-ios-active-"));
  const directory = path.join(root, "lock");
  let securityCalled = false;
  try {
    await assert.rejects(runGuard(process.execPath, ["-e", "process.exit(0)"], {
      directory,
      processSnapshot: () => "123 /usr/bin/xcodebuild\n",
      security: () => { securityCalled = true; return ""; },
    }), /Another xcodebuild/);
    assert.equal(securityCalled, false);
    assert.equal(existsSync(directory), false);
  } finally { rmSync(root, { recursive: true }); }
});

test("failed build restores the original keychain list including spaces", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "jeju-ios-restore-"));
  const directory = path.join(root, "lock");
  const calls = [];
  try {
    const status = await runGuard(process.execPath, ["-e", "process.exit(7)"], {
      directory, processSnapshot: () => "",
      security: (args) => { calls.push(args); return '"/tmp/Original User.keychain-db"\n'; },
    });
    assert.equal(status, 7);
    assert.deepEqual(calls[1], ["list-keychains", "-d", "user", "-s", "/tmp/Original User.keychain-db"]);
    assert.equal(existsSync(directory), false);
  } finally { rmSync(root, { recursive: true }); }
});

test("failed restoration retains lock and snapshot to prevent unsafe subsequent signing", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "jeju-ios-retain-"));
  const directory = path.join(root, "lock");
  try {
    await assert.rejects(runGuard(process.execPath, ["-e", "process.exit(0)"], {
      directory, processSnapshot: () => "",
      security: (args) => {
        if (args.includes("-s")) throw new Error("simulated restoration failure");
        return '"/tmp/original.keychain-db"\n';
      },
    }), /restoration failed/);
    assert.equal(existsSync(path.join(directory, "keychains.json")), true);
    assert.throws(() => acquireLock(directory), /signing is locked/);
  } finally { rmSync(root, { recursive: true }); }
});

test('a changed owner or unexpected contents never get removed by release', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'jeju-ios-owner-'));
  const directory = path.join(root, 'lock');
  const release = acquireLock(directory);
  try {
    const file = path.join(directory, 'owner.json');
    const owner = JSON.parse(readFileSync(file, 'utf8'));
    writeFileSync(file, JSON.stringify({ ...owner, token: 'another-owner' }));
    assert.throws(release, /ownership changed/);
    assert.equal(existsSync(file), true);
    writeFileSync(file, JSON.stringify(owner));
    writeFileSync(path.join(directory, 'foreign-evidence'), 'keep');
    assert.throws(release, /Unexpected signing lock contents/);
    assert.equal(readFileSync(path.join(directory, 'foreign-evidence'), 'utf8'), 'keep');
  } finally { rmSync(root, { recursive: true }); }
});

test('failed host inspection does not access keychains or launch a child', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'jeju-ios-inspect-'));
  const directory = path.join(root, 'lock');
  let securityCalls = 0;
  try {
    await assert.rejects(runGuard('/not-an-executable', [], {
      directory, processSnapshot: () => { throw new Error('blocked'); },
      security: () => { securityCalls++; return ''; },
    }), /Host build inspection failed/);
    assert.equal(securityCalls, 0);
    assert.equal(existsSync(directory), false);
  } finally { rmSync(root, { recursive: true }); }
});

test('spawn failure restores even an empty original keychain list', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'jeju-ios-spawn-'));
  const directory = path.join(root, 'lock');
  const calls = [];
  try {
    await assert.rejects(runGuard('/not-an-executable', [], {
      directory, processSnapshot: () => '',
      security: (args) => { calls.push(args); return ''; },
    }), /ENOENT/);
    assert.deepEqual(calls[1], ['list-keychains', '-d', 'user', '-s']);
    assert.equal(existsSync(directory), false);
  } finally { rmSync(root, { recursive: true }); }
});

test('child receives the explicit checkout and pinned environment', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'jeju-ios-env-'));
  const directory = path.join(root, 'lock');
  try {
    const code = await runGuard(process.execPath, ['-e', 'process.exit(process.cwd()===process.env.EXPECTED_ROOT && process.env.EAS_CLI_VERSION==="22.2.0" ? 0 : 4)'], {
      directory, cwd: root, env: { ...process.env, EXPECTED_ROOT: realpathSync(root), EAS_CLI_VERSION: '22.2.0' },
      processSnapshot: () => '', security: () => '',
    });
    assert.equal(code, 0);
    assert.equal(existsSync(directory), false);
  } finally { rmSync(root, { recursive: true }); }
});

test('a surviving child process group retains the lock and does not restore keychains', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'jeju-ios-descendant-'));
  const directory = path.join(root, 'lock');
  const pidFile = path.join(root, 'fixture-pid');
  const calls = [];
  try {
    await assert.rejects(runGuard(process.execPath, ['-e', `
      const {spawn}=require('node:child_process');
      const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
      require('node:fs').writeFileSync(process.env.FIXTURE_PID,String(child.pid));
      child.unref();
    `], {
      directory, env: { ...process.env, FIXTURE_PID: pidFile }, processSnapshot: () => '',
      security: (args) => { calls.push(args); return '"/tmp/fixture.keychain"\n'; },
    }), /process group is still active/);
    assert.equal(calls.length, 1);
    assert.equal(existsSync(path.join(directory, 'keychains.json')), true);
    assert.throws(() => acquireLock(directory), /signing is locked/);
  } finally {
    if (existsSync(pidFile)) {
      try { process.kill(Number(readFileSync(pidFile, 'utf8')), 'SIGTERM'); }
      catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
    rmSync(root, { recursive: true });
  }
});
