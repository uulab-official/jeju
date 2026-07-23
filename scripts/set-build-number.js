/**
 * Bump buildNumber / versionCode only.
 * Does NOT change `version` or `runtimeVersion`.
 * Use before TestFlight / Play internal-test builds between App Store releases.
 *
 * Usage: npm run release:build -- <ios|android|all> <buildNumber>
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const [platform, build] = process.argv.slice(2);
if (process.env.UULAB_NATIVE_BINARY !== '1') {
  console.error('Refusing to change build codes without UULAB_NATIVE_BINARY=1.');
  console.error('A platform build-code mismatch is not a valid binary reason.');
  process.exit(1);
}

if (!['ios', 'android', 'all'].includes(platform) || !build) {
  console.error('Usage: npm run release:build -- <ios|android|all> <buildNumber>');
  console.error('  e.g. npm run release:build -- ios 26051101');
  console.error('NOTE: use release:version only for App Store releases (version bump).');
  process.exit(1);
}

const buildNumber = String(build);
const versionCode = Number(build);
if (!/^\d{8}$/.test(buildNumber) || !Number.isInteger(versionCode) || versionCode >= 2100000000) {
  console.error('buildNumber must use YYMMDDNN and remain below 2100000000.');
  process.exit(1);
}

const configPath = fs.existsSync(path.join(root, 'app.base.json'))
  ? path.join(root, 'app.base.json')
  : path.join(root, 'app.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const prevIosBuild = config.expo.ios?.buildNumber ?? '(none)';
const prevAndroidBuild = config.expo.android?.versionCode ?? '(none)';
const currentIosBuild = Number(config.expo.ios?.buildNumber || 0);
const currentAndroidBuild = Number(config.expo.android?.versionCode || 0);
const version = config.expo.version;

if ((platform === 'ios' || platform === 'all') && versionCode <= currentIosBuild) {
  console.error(`iOS buildNumber must exceed ${currentIosBuild}.`);
  process.exit(1);
}
if ((platform === 'android' || platform === 'all') && versionCode <= currentAndroidBuild) {
  console.error(`Android versionCode must exceed ${currentAndroidBuild}.`);
  process.exit(1);
}

if (platform === 'ios' || platform === 'all') {
  config.expo.ios = { ...config.expo.ios, buildNumber };
}
if (platform === 'android' || platform === 'all') {
  config.expo.android = { ...config.expo.android, versionCode };
}

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`version:        ${version}  (unchanged)`);
console.log(`runtimeVersion: ${config.expo.runtimeVersion}  (unchanged)`);
console.log(`buildNumber:    ${prevIosBuild} → ${config.expo.ios?.buildNumber ?? '(none)'}`);
console.log(`versionCode:    ${prevAndroidBuild} → ${config.expo.android?.versionCode ?? '(none)'}`);
