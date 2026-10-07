const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'jeju-env-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const app = path.join(temp, 'app');
  const credentials = path.join(temp, 'Documents/workspace/uulab/.credentials');
  fs.mkdirSync(path.join(app, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(credentials, 'expo'), { recursive: true });
  const script = path.join(app, 'scripts/with-uulab-credentials.sh');
  fs.copyFileSync(path.join(__dirname, '../scripts/with-uulab-credentials.sh'), script);
  return { temp, app, credentials, script };
}

test('current HOME default and Jeju env load literal values without evaluating shell code', (t) => {
  const f = fixture(t);
  const marker = path.join(f.temp, 'must-not-exist');
  fs.writeFileSync(path.join(f.credentials, 'uulab-secrets.env'), `EXAMPLE_CENTRAL="present"\nEXAMPLE_LITERAL='$(touch ${marker})'\n`);
  fs.writeFileSync(path.join(f.credentials, 'expo/jeju.env'), 'EXAMPLE_JEJU=present\n');
  const result = spawnSync('/bin/bash', [f.script, process.execPath, '-e', 'console.log(JSON.stringify([process.env.EXAMPLE_CENTRAL,process.env.EXAMPLE_JEJU,process.env.EXAMPLE_LITERAL]))'], { env: { PATH: process.env.PATH, HOME: f.temp }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), ['present', 'present', `$(touch ${marker})`]);
  assert.equal(fs.existsSync(marker), false);
});

test('process overrides win, followed by app env before central env; explicit root works', (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.app, '.env'), 'VALUE=app\nSECOND=app\n');
  fs.writeFileSync(path.join(f.credentials, 'uulab-secrets.env'), 'VALUE=central\nSECOND=central\n');
  const result = spawnSync('/bin/bash', [f.script, process.execPath, '-e', 'console.log(JSON.stringify([process.env.VALUE,process.env.SECOND]))'], { env: { PATH: process.env.PATH, HOME: '/unused', UULAB_CREDENTIALS_DIR: f.credentials, VALUE: 'process' }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), ['process', 'app']);
});

test('malformed entries fail before command execution without echoing their value', (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.credentials, 'uulab-secrets.env'), 'BAD-NAME=private-sentinel\n');
  const result = spawnSync('/bin/bash', [f.script, process.execPath, '-e', 'console.log("command ran")'], { env: { PATH: process.env.PATH, HOME: f.temp }, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.doesNotMatch(result.stderr, /private-sentinel/);
});
