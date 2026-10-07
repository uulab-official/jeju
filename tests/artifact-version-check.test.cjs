/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { Buffer } = require('node:buffer');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const guardPath = path.join(root, 'scripts/artifact-version-check.js');
const guard = fs.existsSync(guardPath) ? require(guardPath) : {};
const appId = 'kr.co.uulab.jeju';
const expected = { applicationId: appId, marketingVersion: '7.2.1', buildVersion: '12345' };
const pythonZip = `import json,plistlib,sys,zipfile\ns=json.loads(sys.stdin.read())\nwith zipfile.ZipFile(sys.argv[1], 'w') as z:\n for name,value in s['entries']:\n  z.writestr(name, plistlib.dumps(value, fmt=plistlib.FMT_BINARY if s['binary'] else plistlib.FMT_XML) if isinstance(value,dict) else value)\n`;
function fixture(t, { ext = 'ipa', info = {}, entries, binary = false, name } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jeju-candidate-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const artifactPath = path.join(dir, name || `candidate.${ext}`);
  const plist = { CFBundleIdentifier: appId, CFBundleShortVersionString: expected.marketingVersion, CFBundleVersion: expected.buildVersion, CFBundlePackageType: 'APPL', CFBundleSupportedPlatforms: ['iPhoneOS'], ...info };
  const result = spawnSync('python3', ['-I', '-c', pythonZip, artifactPath], {
    encoding: 'utf8', input: JSON.stringify({ binary, entries: entries || (ext === 'ipa' ? [['Payload/Jeju.app/Info.plist', plist]] : [[ext === 'aab' ? 'base/manifest/AndroidManifest.xml' : 'AndroidManifest.xml', 'synthetic metadata; extractor mocked']]) }),
  });
  assert.equal(result.status, 0, result.stderr);
  const manifestPath = path.join(dir, 'candidate.json');
  const manifest = { schemaVersion: 1, purpose: 'store-submission', platform: ext === 'ipa' ? 'ios' : 'android', artifactPath: path.basename(artifactPath), ...expected, sha256: createHash('sha256').update(fs.readFileSync(artifactPath)).digest('hex') };
  const save = () => fs.writeFileSync(manifestPath, JSON.stringify(manifest)); save();
  return { dir, artifactPath, manifestPath, manifest, save, platform: manifest.platform };
}
function verify(f, options = {}) {
  assert.equal(typeof guard.verifyArtifact, 'function', 'selected artifact identity guard must exist');
  return guard.verifyArtifact({ platform: f.platform, artifactPath: f.artifactPath, manifestPath: f.manifestPath }, options);
}
function androidXml(overrides = '') {
  return `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${appId}" android:versionName="7.2.1" android:versionCode="12345"><application ${overrides}/></manifest>`;
}
function extractor(xml = androidXml(), mutate) {
  return (command, args, options) => {
    if (command === 'apkanalyzer' || command === 'bundletool') {
      mutate?.(); return { status: 0, stdout: xml, stderr: '' };
    }
    return spawnSync(command, args, options);
  };
}
function harness(f, extra = [], { dryRun = false, metadata = androidXml(), command = 'submit' } = {}) {
  const calls = [];
  const logs = [];
  const child = { spawnSync(command, args, options) {
    if (['python3', 'apkanalyzer', 'bundletool'].includes(command)) return extractor(metadata)(command, args, options);
    calls.push({ command, args, options }); return { status: 0 };
  } };
  const isolatedGuard = { exports: {} };
  if (fs.existsSync(guardPath)) vm.runInNewContext(fs.readFileSync(guardPath, 'utf8'), {
    require: name => name === 'node:child_process' || name === 'child_process' ? child : require(name),
    module: isolatedGuard, exports: isolatedGuard.exports, process, __dirname: path.dirname(guardPath), Buffer, console,
  }, { filename: guardPath });
  const sandbox = {
    require: name => name === 'child_process' || name === 'node:child_process' ? child : name === './artifact-version-check' || name === './artifact-version-check.js' ? isolatedGuard.exports : require(name),
    process: { argv: ['node', 'harness', command, f.platform, ...(f.artifactPath ? ['--path', f.artifactPath] : []), ...(f.manifestPath ? ['--manifest', f.manifestPath] : []), ...(dryRun ? ['--dry-run'] : []), ...extra], cwd: () => root, env: { UULAB_BINARY_REASON: command === 'release' ? 'native-change' : 'existing-artifact' }, exit: code => { throw Error(`exit ${code}`); } },
    console: { log: value => logs.push(value), error: value => logs.push(value) },
  };
  let error; try { vm.runInNewContext(fs.readFileSync(path.join(root, 'scripts/uulab-expo-harness.js'), 'utf8'), sandbox); } catch (caught) { error = caught; }
  return { calls, logs, error };
}
test('guard requires explicit path and manifest, never a default directory', () => {
  assert.equal(typeof guard.parseSubmissionArgs, 'function', 'strict argument parser must exist');
  for (const argv of [[], ['--path', 'x.ipa'], ['--manifest', 'x.json'], ['--path'], ['--latest'], ['--path', 'a', '--path', 'b', '--manifest', 'm'], ['--path', 'a', '--manifest', 'm', '--id', 'x']]) {
    assert.throws(() => guard.parseSubmissionArgs(argv));
  }
  assert.deepEqual(guard.parseSubmissionArgs(['--path', 'a.ipa', '--manifest', 'a.json', '--dry-run']), { artifactPath: 'a.ipa', manifestPath: 'a.json', dryRun: true });
});
for (const binary of [false, true]) test(`reads embedded ${binary ? 'binary' : 'XML'} IPA identity and exact hash`, t => {
  const f = fixture(t, { binary });
  const result = verify(f);
  for (const field of ['platform', 'applicationId', 'marketingVersion', 'buildVersion', 'sha256']) assert.equal(result[field], f.manifest[field]);
  assert.equal(result.artifactPath, fs.realpathSync(f.artifactPath));
});
for (const field of ['platform', 'applicationId', 'marketingVersion', 'buildVersion', 'sha256']) test(`rejects wrong expected ${field}`, t => {
  const f = fixture(t); f.manifest[field] = field === 'sha256' ? 'a'.repeat(64) : field === 'platform' ? 'android' : field === 'buildVersion' ? '99999' : 'wrong'; f.save();
  assert.throws(() => verify(f), new RegExp(field, 'i'));
});
test('does not use current app config or filename as the expected embedded version', t => {
  const f = fixture(t, { info: { CFBundleVersion: '99', CFBundleShortVersionString: '1.0.0' }, name: 'jeju-ios-production-12345.ipa' });
  assert.throws(() => verify(f), /marketingVersion|buildVersion/);
});
for (const field of ['schemaVersion', 'purpose', 'platform', 'artifactPath', 'applicationId', 'marketingVersion', 'buildVersion', 'sha256']) test(`rejects missing manifest ${field}`, t => {
  const f = fixture(t); delete f.manifest[field]; f.save(); assert.throws(() => verify(f), /manifest|schema|purpose/i);
});
for (const purpose of ['test', 'local-fixture', 'preview', '']) test(`rejects manifest purpose ${JSON.stringify(purpose)}`, t => {
  const f = fixture(t); f.manifest.purpose = purpose; f.save(); assert.throws(() => verify(f), /purpose/);
});
test('rejects unknown manifest fields instead of silently treating fixtures as production', t => {
  const f = fixture(t); f.manifest.fixture = true; f.save(); assert.throws(() => verify(f), /manifest|unknown/i);
});
test('rejects array, malformed JSON and non-string expected build version', t => {
  const f = fixture(t);
  for (const value of ['[]', '{', JSON.stringify({ ...f.manifest, buildVersion: 12345 })]) {
    fs.writeFileSync(f.manifestPath, value); assert.throws(() => verify(f));
  }
});
test('requires manifest path to identify the exact selected artifact', t => {
  const f = fixture(t); fs.copyFileSync(f.artifactPath, path.join(f.dir, 'other.ipa'));
  f.manifest.artifactPath = 'other.ipa'; f.save(); assert.throws(() => verify(f), /artifactPath/);
});
test('rejects missing artifact, directory, symlink and fixture path', t => {
  const f = fixture(t);
  for (const candidate of [path.join(f.dir, 'missing.ipa'), f.dir]) assert.throws(() => verify({ ...f, artifactPath: candidate }));
  const link = path.join(f.dir, 'linked.ipa'); fs.symlinkSync(f.artifactPath, link);
  assert.throws(() => verify({ ...f, artifactPath: link }), /regular|symlink/i);
  const fixtureDir = path.join(f.dir, '__fixtures__'); fs.mkdirSync(fixtureDir);
  const nested = path.join(fixtureDir, 'candidate.ipa'); fs.copyFileSync(f.artifactPath, nested);
  f.manifest.artifactPath = nested; f.save(); assert.throws(() => verify({ ...f, artifactPath: nested }), /fixture/i);
});
for (const info of [ { CFBundleVersion: null }, { CFBundleVersion: 12345 }, { CFBundleSupportedPlatforms: ['iPhoneSimulator'] }, { CFBundlePackageType: 'FMWK' }, { UULABLocalTestFixture: true } ]) test(`rejects invalid/local IPA metadata ${JSON.stringify(info)}`, t => {
  // plistlib cannot represent null; omit required field instead.
  const f = fixture(t, { info: info.CFBundleVersion === null ? { CFBundleVersion: '' } : info }); assert.throws(() => verify(f));
});
test('rejects no top-level app plist, multiple apps, duplicate plist and corrupt IPA', t => {
  for (const entries of [[], [['Payload/A.app/Info.plist', {}], ['Payload/B.app/Info.plist', {}]], [['Payload/A.app/Info.plist', {}], ['Payload/A.app/Info.plist', {}]], [['Payload/A.app/PlugIns/Extension.appex/Info.plist', {}]]]) assert.throws(() => verify(fixture(t, { entries })), /metadata|plist|extract/i);
  const f = fixture(t); fs.writeFileSync(f.artifactPath, 'not a zip'); f.manifest.sha256 = createHash('sha256').update(fs.readFileSync(f.artifactPath)).digest('hex'); f.save(); assert.throws(() => verify(f), /metadata|extract/i);
});
for (const ext of ['apk', 'aab']) test(`extracts ${ext} manifest using a shell-free platform tool`, t => {
  const f = fixture(t, { ext }); const calls = [];
  const result = verify(f, { spawnSync: (command, args, options) => { calls.push({ command, args, options }); return extractor()(command, args, options); } });
  assert.equal(result.applicationId, appId); assert.equal(result.buildVersion, '12345');
  const toolCall = calls.find(call => call.command === (ext === 'apk' ? 'apkanalyzer' : 'bundletool'));
  assert.ok(toolCall); assert.ok(toolCall.args.some(arg => arg.includes(f.artifactPath))); assert.notEqual(toolCall.options.shell, true);
});
for (const xml of ['', 'not xml', androidXml('android:debuggable="true"'), androidXml('android:testOnly="true"'), androidXml().replace('12345', '54321'), androidXml().replace(appId, 'other.app'), androidXml().replace('7.2.1', '7.2.0'), androidXml().replace(' android:versionName="7.2.1"', ''), androidXml().replace('<application', '<application/><application')]) test(`rejects invalid Android metadata ${xml.slice(0, 55)}`, t => {
  const f = fixture(t, { ext: 'aab' }); assert.throws(() => verify(f, { spawnSync: extractor(xml) }));
});
test('tool absence/failure and mutation during extraction fail closed', t => {
  const f = fixture(t, { ext: 'apk' });
  for (const result of [{ status: null, error: Error('ENOENT') }, { status: 1, stdout: androidXml() }, { status: null, signal: 'SIGTERM' }]) assert.throws(() => verify(f, { spawnSync: () => result }), /extract|tool|metadata/i);
  assert.throws(() => verify(f, { spawnSync: extractor(androidXml(), () => fs.appendFileSync(f.artifactPath, 'changed')) }), /sha256|changed/i);
});
test('package submit commands route through the guarded harness without --latest', () => {
  const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).scripts;
  for (const platform of ['ios', 'android']) {
    assert.match(scripts[`submit:${platform}`], new RegExp(`node scripts/uulab-expo-harness\\.js submit ${platform}`));
    assert.doesNotMatch(scripts[`submit:${platform}`], /--latest|eas submit/);
  }
});
test('harness rejects missing selectors and all before any submission spawn, including dry-run', () => {
  for (const platform of ['ios', 'android', 'all', 'garbage']) for (const dryRun of [false, true]) {
    const result = harness({ platform }, [], { dryRun }); assert.ok(result.error, result.logs.join('\n')); assert.equal(result.calls.length, 0);
  }
});
test('harness rejects a mismatched candidate before any submission spawn', t => {
  const f = fixture(t); f.manifest.buildVersion = '99999'; f.save();
  for (const dryRun of [false, true]) { const result = harness(f, [], { dryRun }); assert.ok(result.error); assert.equal(result.calls.length, 0); }
});
test('harness submits only the validated explicit artifact without shell interpolation', t => {
  const f = fixture(t, { name: 'candidate with spaces;$(touch never).ipa' });
  const result = harness(f); assert.ifError(result.error);
  const submit = result.calls.find(call => call.command === 'eas'); assert.ok(submit, result.logs.join('\n'));
  assert.deepEqual(Array.from(submit.args), ['submit', '--profile', 'production', '--platform', 'ios', '--path', fs.realpathSync(f.artifactPath), '--non-interactive']);
  assert.notEqual(submit.options.shell, true);
});
test('harness dry-run validates selected bytes but never invokes submission', t => {
  const f = fixture(t); const result = harness(f, [], { dryRun: true }); assert.ifError(result.error); assert.equal(result.calls.length, 0); assert.match(result.logs.join('\n'), /eas/);
});
test('standalone CLI rejects no selection without reading configuration or logging in', () => {
  const result = spawnSync(process.execPath, [guardPath, 'ios'], { encoding: 'utf8', cwd: root }); assert.notEqual(result.status, 0); assert.match(result.stderr, /path|manifest/i);
});

test('combined release rejects before any build side effects', () => {
  for (const platform of ['all', 'ios', 'android']) {
    const result = harness({ platform }, [], { command: 'release' });
    assert.ok(result.error);
    assert.equal(result.calls.length, 0, 'release must not build before rejecting implicit submission');
    assert.match(result.logs.join('\n'), /separat|explicit|candidate/i);
  }
});
