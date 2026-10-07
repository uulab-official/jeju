#!/usr/bin/env node

// Identity-only guard: no EAS login, signing check, config-derived version or submission.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { Buffer } = require('node:buffer');
const { spawnSync } = require('node:child_process');

const APPLICATION_ID = 'kr.co.uulab.jeju';
const MANIFEST_FIELDS = ['schemaVersion', 'purpose', 'platform', 'artifactPath', 'applicationId', 'marketingVersion', 'buildVersion', 'sha256'];
const FIXTURE_PATH = /(?:^|[/\\])(?:__fixtures__|fixtures|test-fixtures|__tests__|tests)(?:[/\\]|$)/i;
const MAX_METADATA_BYTES = 1024 * 1024;

const IPA_METADATA = `
import json, plistlib, re, sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    entries = [entry for entry in archive.infolist() if re.fullmatch(r'Payload/[^/]+\\.app/Info\\.plist', entry.filename)]
    if len(entries) != 1:
        raise ValueError('Expected exactly one top-level app Info.plist')
    entry = entries[0]
    if entry.file_size > 1048576:
        raise ValueError('Info.plist is too large')
    info = plistlib.loads(archive.read(entry))
    if info.get('CFBundlePackageType') != 'APPL' or info.get('CFBundleSupportedPlatforms') != ['iPhoneOS']:
        raise ValueError('Expected an iPhoneOS app, not a simulator or non-app artifact')
    if info.get('UULABLocalTestFixture'):
        raise ValueError('Local test fixture is not a submission candidate')
    print(json.dumps({'platform': 'ios', 'applicationId': info.get('CFBundleIdentifier'), 'marketingVersion': info.get('CFBundleShortVersionString'), 'buildVersion': info.get('CFBundleVersion')}))
`;

const ANDROID_METADATA = `
import json, sys, xml.etree.ElementTree as ET
xml = sys.stdin.read()
if '<!DOCTYPE' in xml or '<!ENTITY' in xml:
    raise ValueError('Unsupported XML declaration')
root = ET.fromstring(xml)
ns = '{http://schemas.android.com/apk/res/android}'
if root.tag != 'manifest' or root.get('split'):
    raise ValueError('Expected the base Android manifest')
apps = root.findall('application')
if len(apps) != 1:
    raise ValueError('Expected exactly one Android application')
for name in ['debuggable', 'testOnly']:
    if apps[0].get(ns + name, 'false') not in ['false', '0']:
        raise ValueError('Debug/test-only or unresolved application flag: ' + name)
if root.get(ns + 'versionCodeMajor', '0') != '0':
    raise ValueError('Unsupported versionCodeMajor')
print(json.dumps({'platform': 'android', 'applicationId': root.get('package'), 'marketingVersion': root.get(ns + 'versionName'), 'buildVersion': root.get(ns + 'versionCode')}))
`;

function parseSubmissionArgs(args) {
  const result = { dryRun: false };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (!['--path', '--manifest', '--dry-run'].includes(flag) || seen.has(flag)) {
      throw new Error(`Unknown or duplicate submission option: ${flag}`);
    }
    seen.add(flag);
    if (flag === '--dry-run') { result.dryRun = true; continue; }
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    result[flag === '--path' ? 'artifactPath' : 'manifestPath'] = value;
  }
  if (!result.artifactPath || !result.manifestPath) {
    throw new Error('Explicit --path ARTIFACT and --manifest CANDIDATE.json are required; there is no latest/default selection.');
  }
  return result;
}

function regularFile(input, label) {
  if (typeof input !== 'string' || !input.trim() || /[\x00-\x1f]/.test(input)) throw new Error(`Missing or invalid ${label}`);
  const file = path.resolve(input);
  if (!fs.lstatSync(file).isFile()) throw new Error(`${label} must be a regular file, not a directory or symlink`);
  const resolved = fs.realpathSync(file);
  if (FIXTURE_PATH.test(file) || FIXTURE_PATH.test(resolved)) throw new Error(`${label} cannot be a local test fixture path`);
  return resolved;
}

function readManifest(file) {
  if (fs.statSync(file).size > 16 * 1024) throw new Error('Candidate manifest is too large');
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { throw new Error('Candidate manifest must contain valid JSON'); }
  if (!manifest || Array.isArray(manifest) || typeof manifest !== 'object' ||
      Object.keys(manifest).length !== MANIFEST_FIELDS.length ||
      MANIFEST_FIELDS.some(field => !Object.hasOwn(manifest, field))) {
    throw new Error(`Candidate manifest requires exactly: ${MANIFEST_FIELDS.join(', ')}`);
  }
  if (manifest.schemaVersion !== 1) throw new Error('Unsupported manifest schemaVersion');
  if (manifest.purpose !== 'store-submission') throw new Error('Manifest purpose must be store-submission; test/preview/local fixtures are forbidden');
  for (const field of MANIFEST_FIELDS.filter(field => field !== 'schemaVersion')) {
    if (typeof manifest[field] !== 'string' || !manifest[field].trim() || /[\x00-\x1f]/.test(manifest[field])) {
      throw new Error(`Invalid manifest ${field}: a nonempty string is required`);
    }
  }
  if (!/^[a-fA-F0-9]{64}$/.test(manifest.sha256)) throw new Error('Invalid manifest sha256');
  if (manifest.applicationId !== APPLICATION_ID) throw new Error(`Manifest applicationId must be ${APPLICATION_ID}`);
  if (!['ios', 'android'].includes(manifest.platform)) throw new Error('Invalid manifest platform');
  if (!(manifest.platform === 'ios' ? /^\d+(?:\.\d+){0,2}$/ : /^[1-9]\d*$/).test(manifest.buildVersion)) throw new Error('Invalid manifest buildVersion');
  return manifest;
}

function sha256(file) {
  const hash = createHash('sha256');
  const descriptor = fs.openSync(file, 'r');
  const buffer = Buffer.alloc(1024 * 1024);
  try {
    let count;
    while ((count = fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, count));
  } finally { fs.closeSync(descriptor); }
  return hash.digest('hex');
}

function extractMetadata(artifactPath, platform, execute) {
  function run(command, args, input) {
    const result = execute(command, args, { encoding: 'utf8', input, shell: false, timeout: 60_000, maxBuffer: MAX_METADATA_BYTES });
    if (result.error || result.status !== 0 || typeof result.stdout !== 'string' || !result.stdout.trim()) {
      throw new Error(`Artifact metadata extraction failed (${command}); install/check the local tool and candidate. No submission attempted.`);
    }
    return result.stdout;
  }
  let output;
  if (platform === 'ios') {
    output = run('python3', ['-I', '-c', IPA_METADATA, artifactPath]);
  } else {
    const xml = path.extname(artifactPath).toLowerCase() === '.apk'
      ? run('apkanalyzer', ['manifest', 'print', artifactPath])
      : run('bundletool', ['dump', 'manifest', `--bundle=${artifactPath}`, '--module=base']);
    output = run('python3', ['-I', '-c', ANDROID_METADATA], xml);
  }
  try { return JSON.parse(output); }
  catch { throw new Error('Artifact metadata extractor returned invalid JSON'); }
}

function verifyArtifact({ platform, artifactPath, manifestPath }, options = {}) {
  if (!['ios', 'android'].includes(platform)) throw new Error('Select exactly one submission platform: ios or android');
  const artifact = regularFile(artifactPath, 'artifactPath');
  const manifestFile = regularFile(manifestPath, 'manifestPath');
  const manifest = readManifest(manifestFile);
  if (manifest.platform !== platform) throw new Error('Candidate manifest platform does not match selected platform');
  const extension = path.extname(artifact).toLowerCase();
  if (!(platform === 'ios' ? ['.ipa'] : ['.apk', '.aab']).includes(extension)) throw new Error('Artifact extension does not match platform');
  const declaredPath = regularFile(path.resolve(path.dirname(manifestFile), manifest.artifactPath), 'manifest artifactPath');
  if (declaredPath !== artifact) throw new Error('Manifest artifactPath does not identify the explicitly selected artifact');
  const digest = sha256(artifact);
  if (digest !== manifest.sha256.toLowerCase()) throw new Error('Artifact sha256 does not match candidate manifest');
  const identity = extractMetadata(artifact, platform, options.spawnSync || spawnSync);
  for (const field of ['platform', 'applicationId', 'marketingVersion', 'buildVersion']) {
    if (typeof identity?.[field] !== 'string' || identity[field] !== manifest[field]) throw new Error(`Embedded ${field} does not match candidate manifest`);
  }
  if (sha256(artifact) !== digest) throw new Error('Artifact sha256 changed during metadata extraction');
  return { artifactPath: artifact, ...identity, sha256: digest };
}

module.exports = { parseSubmissionArgs, verifyArtifact };

if (require.main === module) {
  try {
    const [platform, ...args] = process.argv.slice(2);
    const result = verifyArtifact({ platform, ...parseSubmissionArgs(args) });
    console.log(JSON.stringify({ ...result, scope: 'Selected artifact identity only; not release approval or submission status.' }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
