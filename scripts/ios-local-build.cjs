#!/usr/bin/env node
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { runGuard } = require('./ios-host-guard.cjs');

const root = path.resolve(__dirname, '..');
const reasons = new Set(['native-change', 'sdk-upgrade', 'first-store-release', 'review-native-fix']);

function parseArgs(args) {
  if (args.length === 1 && args[0] === '--check') return { check: true };
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i];
    if (!['--profile', '--output'].includes(name) || options[name] || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw new Error('Use --check, or --profile <production|production-local|screenshot> --output <artifact>.');
    }
    options[name] = args[i + 1];
  }
  if (!['production', 'production-local', 'screenshot'].includes(options['--profile']) || !options['--output']) {
    throw new Error('An explicit iOS build profile and output path are required.');
  }
  return { profile: options['--profile'], output: options['--output'] };
}

function invocation(options, env = process.env) {
  if (!options.check && options.profile !== 'screenshot' && !reasons.has(env.UULAB_BINARY_REASON)) {
    throw new Error('A production iOS build requires a native UULAB_BINARY_REASON.');
  }
  if (env.EAS_CLI_VERSION && env.EAS_CLI_VERSION !== '22.2.0') {
    throw new Error('This iOS build path requires EAS CLI 22.2.0.');
  }
  const workspace = path.resolve(env.UULAB_EXPO_WORKSPACE || path.join(os.homedir(), 'Documents/workspace/uulab/expo'));
  const runner = path.join(workspace, 'scripts/uulab-eas-run.cjs');
  const managedRuby = path.join(workspace, 'scripts/uulab-eas-managed-ruby.cjs');
  for (const file of [runner, managedRuby]) {
    if (!fs.existsSync(file)) throw new Error('Required UULab EAS/managed-Ruby runner is unavailable; no global EAS fallback.');
  }
  const gemfile = fs.readFileSync(path.join(root, 'Gemfile'), 'utf8');
  const lock = fs.readFileSync(path.join(root, 'Gemfile.lock'), 'utf8');
  if (!/^gem "fastlane", "2\.237\.0"$/m.test(gemfile) || !/^    fastlane \(2\.237\.0\)$/m.test(lock)) {
    throw new Error('Pin Fastlane 2.237.0 in Gemfile and Gemfile.lock.');
  }
  const args = [path.join(root, 'scripts/with-uulab-credentials.sh')];
  if (options.check) {
    // Exercises the real bundled Ruby/Fastlane/pod probes without EAS, signing,
    // authentication, keychain access or a shared host lock.
    args.push('mise', 'exec', 'ruby@3.3.4', '--', process.execPath, managedRuby, __filename, '--toolchain-probe');
  } else {
    const output = path.resolve(root, options.output);
    if (fs.existsSync(output)) throw new Error('Output already exists; preserve the artifact and choose a new path.');
    args.push(process.execPath, runner, 'build', '--profile', options.profile, '--platform', 'ios', '--local', '--non-interactive', '--output', output);
  }
  return { command: '/bin/bash', args, env: { ...env, EAS_CLI_VERSION: '22.2.0' } };
}

async function main(args) {
  if (args.length === 1 && args[0] === '--toolchain-probe') {
    process.stdout.write('Managed iOS toolchain probe completed; no build performed.\n');
    return 0;
  }
  const options = parseArgs(args);
  if (process.platform !== 'darwin') throw new Error('The iOS local build path requires macOS.');
  const call = invocation(options);
  if (options.check) {
    const result = spawnSync(call.command, call.args, { cwd: root, env: call.env, stdio: 'inherit' });
    return result.status ?? 1;
  }
  return runGuard(call.command, call.args, { cwd: root, env: call.env });
}

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`[Jeju iOS] ${error.message}\n`);
    process.exitCode = 1;
  });
}
module.exports = { parseArgs, invocation };
