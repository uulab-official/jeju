const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { parseArgs, invocation } = require('../scripts/ios-local-build.cjs');

function fixture(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'jeju-runner-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  fs.mkdirSync(path.join(workspace, 'scripts'));
  for (const name of ['uulab-eas-run.cjs', 'uulab-eas-managed-ruby.cjs']) {
    fs.writeFileSync(path.join(workspace, 'scripts', name), '// unused test runner');
  }
  return { UULAB_EXPO_WORKSPACE: workspace, UULAB_BINARY_REASON: 'sdk-upgrade' };
}

test('production invocation forces local iOS, managed central runner and pinned EAS', (t) => {
  const env = fixture(t);
  const call = invocation(parseArgs(['--profile', 'production', '--output', '/tmp/Jeju candidate.ipa']), env);
  assert.equal(call.command, '/bin/bash');
  assert.equal(call.env.EAS_CLI_VERSION, '22.2.0');
  assert.match(call.args[0], /with-uulab-credentials\.sh$/);
  assert.deepEqual(call.args.slice(1), [process.execPath, path.join(env.UULAB_EXPO_WORKSPACE, 'scripts/uulab-eas-run.cjs'), 'build', '--profile', 'production', '--platform', 'ios', '--local', '--non-interactive', '--output', '/tmp/Jeju candidate.ipa']);
});

test('toolchain check calls real managed Ruby probes without EAS build or account request', (t) => {
  const call = invocation(parseArgs(['--check']), fixture(t));
  assert.deepEqual(call.args.slice(1, 5), ['mise', 'exec', 'ruby@3.3.4', '--']);
  assert.match(call.args[6], /uulab-eas-managed-ruby\.cjs$/);
  assert.equal(call.args.at(-1), '--toolchain-probe');
  assert.equal(call.args.includes('build'), false);
});

test('invalid reason, missing runner, alternate pin and existing artifact fail closed', (t) => {
  const env = fixture(t);
  const options = { profile: 'production', output: '/tmp/jeju-unused-candidate.ipa' };
  assert.throws(() => invocation(options, { ...env, UULAB_BINARY_REASON: 'existing-artifact' }), /native UULAB_BINARY_REASON/);
  assert.throws(() => invocation(options, { ...env, EAS_CLI_VERSION: 'latest' }), /22\.2\.0/);
  assert.throws(() => invocation(options, { ...env, UULAB_EXPO_WORKSPACE: path.join(env.UULAB_EXPO_WORKSPACE, 'absent') }), /no global EAS fallback/);
  const artifact = path.join(env.UULAB_EXPO_WORKSPACE, 'keep.ipa');
  fs.writeFileSync(artifact, 'preserve');
  assert.throws(() => invocation({ ...options, output: artifact }, env), /Output already exists/);
  assert.equal(fs.readFileSync(artifact, 'utf8'), 'preserve');
});

test('argument overrides cannot select cloud build, another platform or omit the output', () => {
  for (const args of [[], ['--profile', 'production'], ['--profile', 'production', '--output', 'x', '--local', 'false'], ['--profile', 'production', '--profile', 'screenshot', '--output', 'x'], ['--check', '--output', 'x']]) {
    assert.throws(() => parseArgs(args));
  }
});

test('all repository EAS iOS build entrypoints route through the protected wrapper', () => {
  const pkg = require('../package.json');
  for (const name of ['build:local:ios', 'build:testflight:ios', 'build:screenshot:ios']) {
    assert.match(pkg.scripts[name], /node scripts\/ios-local-build\.cjs/);
    assert.doesNotMatch(pkg.scripts[name], /(?:^|\s)eas build/);
  }
  const harness = fs.readFileSync(path.join(__dirname, '../scripts/uulab-expo-harness.js'), 'utf8');
  assert.match(harness, /runArgs\(process\.execPath, \['scripts\/ios-local-build\.cjs'/);
  assert.doesNotMatch(harness, /eas build[^\n]*--platform ios/);
});
