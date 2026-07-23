#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const args = process.argv.slice(2);
const command = args[0] || 'audit';
const platform = args[1] || 'all';
const dryRun = args.includes('--dry-run');
const binaryReasons = new Set([
  'native-change',
  'sdk-upgrade',
  'first-store-release',
  'review-native-fix',
  'existing-artifact',
]);

function readJson(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function run(cmd, options = {}) {
  console.log(`$ ${cmd}`);
  if (dryRun) return 0;
  const result = spawnSync(cmd, {
    cwd: root,
    shell: true,
    stdio: options.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
  });
  if (options.capture) return result;
  if (result.status !== 0) process.exit(result.status || 1);
  return 0;
}

function runArgs(command, commandArgs, options = {}) {
  console.log(`$ ${[command, ...commandArgs].map((value) => JSON.stringify(value)).join(' ')}`);
  if (dryRun) return 0;
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...options.env },
  });
  if (result.status !== 0) process.exit(result.status || 1);
  return 0;
}

function scriptExists(name) {
  const pkg = readJson('package.json');
  return Boolean(pkg?.scripts?.[name]);
}

function requireBinaryReason(action) {
  if (dryRun) return;
  const reason = String(process.env.UULAB_BINARY_REASON || '').trim();
  if (binaryReasons.has(reason) && !(action === 'build' && reason === 'existing-artifact')) return;

  console.error(`Refusing to ${action} a store binary without a valid UULAB_BINARY_REASON.`);
  console.error(`Allowed reasons: ${Array.from(binaryReasons).join(', ')}`);
  console.error('Use OTA for compatible JS/assets and no deployment for docs/tooling/metadata-only changes.');
  console.error('Internal iOS/Android build-number alignment is never a valid reason.');
  if (action === 'build') console.error('existing-artifact is submit-only and cannot authorize a new build.');
  process.exit(1);
}

function appSlug() {
  const pkg = readJson('package.json');
  const config = readJson('app.base.json') || readJson('app.json');
  return (
    config?.expo?.slug ||
    pkg?.name?.split('/').pop()?.replace(/^@/, '') ||
    path.basename(root)
  ).replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
}

function configSummary() {
  const eas = readJson('eas.json');
  const credentials = readJson('credentials.json');
  const app = readJson('app.base.json') || readJson('app.json');
  return {
    slug: appSlug(),
    version: app?.expo?.version || readJson('package.json')?.version || null,
    ios: {
      bundleIdentifier: app?.expo?.ios?.bundleIdentifier || null,
      buildNumber: app?.expo?.ios?.buildNumber || null,
      credentialsSource: eas?.build?.production?.ios?.credentialsSource || null,
      ascAppId: eas?.submit?.production?.ios?.ascAppId || null,
    },
    android: {
      package: app?.expo?.android?.package || null,
      versionCode: app?.expo?.android?.versionCode || null,
      credentialsSource: eas?.build?.production?.android?.credentialsSource || null,
      keystorePath: credentials?.android?.keystore?.keystorePath || null,
      keyAlias: credentials?.android?.keystore?.keyAlias || null,
      submitKeyPath: eas?.submit?.production?.android?.serviceAccountKeyPath || null,
      track: eas?.submit?.production?.android?.track || null,
    },
    updates: {
      url: app?.expo?.updates?.url || null,
      runtimeVersion: app?.expo?.runtimeVersion || null,
      channel: eas?.build?.production?.channel || null,
    },
  };
}

function checkAndroidKeystore() {
  const credentials = readJson('credentials.json');
  const keystore = credentials?.android?.keystore;
  if (!keystore) return { status: 'missing_credentials' };

  const keystorePath = path.resolve(root, keystore.keystorePath);
  if (!fs.existsSync(keystorePath)) return { status: 'missing_file', keystorePath };

  const result = spawnSync('keytool', [
    '-list',
    '-v',
    '-keystore',
    keystorePath,
    '-storepass',
    keystore.keystorePassword,
    '-alias',
    keystore.keyAlias,
  ], { encoding: 'utf8' });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  return {
    status: result.status === 0 ? 'ok' : 'invalid',
    keystorePath,
    alias: keystore.keyAlias,
    sha256: output.match(/SHA256:\s*([A-F0-9:]+)/)?.[1] || null,
    error: result.status === 0 ? null : output.split('\n').slice(0, 3).join(' '),
  };
}

function audit() {
  console.log(JSON.stringify({ config: configSummary(), androidKeystore: checkAndroidKeystore() }, null, 2));
}

function verify() {
  if (scriptExists('typecheck')) run('npm run typecheck');
  if (scriptExists('lint')) run('npm run lint -- --quiet');
  if (scriptExists('test:ci')) run('npm run test:ci');
  run('npx expo install --check');
  run('npx expo-doctor@latest');
}

function preflight(target) {
  if (fs.existsSync(path.join(root, 'scripts/production-config-check.js'))) {
    run(`node scripts/production-config-check.js build ${target}`);
  }
  verify();
  run('npx expo config --type public > /tmp/uulab-expo-harness-config.txt');
}

function build(target) {
  requireBinaryReason('build');
  const slug = appSlug();
  if (target === 'all') {
    build('ios');
    build('android');
    return;
  }
  preflight(target);
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  if (target === 'ios') {
    run(`eas build --profile production --platform ios --local --non-interactive --output ./dist/${slug}-ios-production.ipa`);
  } else if (target === 'android') {
    run(`GRADLE_OPTS='-Dorg.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=2g -Dfile.encoding=UTF-8' ANDROID_HOME=\${ANDROID_HOME:-$HOME/Library/Android/sdk} ANDROID_SDK_ROOT=\${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk} eas build --profile production --platform android --local --non-interactive --output ./dist/${slug}-android-production.aab`);
  } else {
    throw new Error(`Unknown build platform: ${target}`);
  }
}

function submit(target) {
  requireBinaryReason('submit');
  const slug = appSlug();
  if (target === 'all') {
    submit('ios');
    submit('android');
    return;
  }
  const ext = target === 'ios' ? 'ipa' : 'aab';
  const artifact = `./dist/${slug}-${target}-production.${ext}`;
  if (!dryRun && !fs.existsSync(path.join(root, artifact))) {
    console.error(`Missing artifact: ${artifact}`);
    process.exit(1);
  }
  run(`eas submit --profile production --platform ${target} --path ${artifact} --non-interactive`);
}

function ota() {
  const messageIndex = args.findIndex((arg) => arg === '--message' || arg === '-m');
  const message = messageIndex >= 0 ? args[messageIndex + 1] : args.slice(1).filter((arg) => arg !== '--dry-run').join(' ');
  if (!message || message.trim().length < 8) {
    console.error('A descriptive OTA message is required (at least 8 characters).');
    console.error('Usage: npm run update:msg -- "Describe the production fix"');
    process.exit(1);
  }
  if (!['all', 'ios', 'android'].includes(platform)) {
    console.error(`Unsupported OTA platform: ${platform}`);
    process.exit(1);
  }
  if (scriptExists('preflight:update')) run('npm run preflight:update');
  if (scriptExists('guard:update')) run('npm run guard:update');
  run('node scripts/prepare-ota-directory.js');
  run(`npx expo export --platform ${platform} --output-dir dist-update`);
  run('node scripts/verify-ota-bundle.js', { env: { OTA_PLATFORM: platform } });
  runArgs('scripts/with-uulab-credentials.sh', [
    'eas',
    'update',
    '--channel',
    'production',
    '--platform',
    platform,
    '--input-dir',
    './dist-update',
    '--message',
    message,
    '--environment',
    'production',
    '--non-interactive',
    '--json',
  ]);
}

try {
  if (command === 'audit') audit();
  else if (command === 'verify') verify();
  else if (command === 'build') build(platform);
  else if (command === 'submit') submit(platform);
  else if (command === 'release') {
    build(platform);
    submit(platform);
  } else if (command === 'ota' || command === 'update') ota();
  else {
    console.error('Usage: uulab-expo-harness <audit|verify|build|submit|release|ota> [ios|android|all] [--dry-run]');
    process.exit(1);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
