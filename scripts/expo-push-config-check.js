#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const appRoot = path.resolve(process.argv[2] || process.cwd());
const requireRemote = process.argv.includes('--require-remote');
const failures = [];
const warnings = [];

function read(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function collectSourceFiles(root) {
  if (!fs.existsSync(root)) return [];
  const output = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (['node_modules', '.git', '.expo', 'dist', 'build', 'android', 'ios', '__tests__'].includes(entry.name)) continue;
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...collectSourceFiles(absolute));
    else if (/\.(?:js|jsx|mjs|cjs|ts|tsx)$/.test(entry.name) && !/\.(?:test|spec)\.[^.]+$/.test(entry.name)) {
      output.push(absolute);
    }
  }
  return output;
}

function staticExpoConfig() {
  for (const name of ['app.base.json', 'app.json']) {
    const filePath = path.join(appRoot, name);
    if (!fs.existsSync(filePath)) continue;
    const parsed = readJson(filePath);
    return parsed.expo || parsed;
  }
  return {};
}

function resolvedExpoConfig() {
  const expoBin = path.join(appRoot, 'node_modules', 'expo', 'bin', 'cli');
  if (!fs.existsSync(expoBin)) return staticExpoConfig();

  const result = spawnSync(process.execPath, [expoBin, 'config', '--type', 'public', '--json'], {
    cwd: appRoot,
    encoding: 'utf8',
    env: { ...process.env, EXPO_NO_TELEMETRY: '1' },
  });
  if (result.status !== 0) {
    warnings.push(`Expo config could not be resolved; using static config: ${result.stderr.trim() || 'unknown error'}`);
    return staticExpoConfig();
  }

  const jsonStart = result.stdout.indexOf('{');
  if (jsonStart < 0) return staticExpoConfig();
  try {
    return JSON.parse(result.stdout.slice(jsonStart));
  } catch (error) {
    warnings.push(`Expo config JSON could not be parsed; using static config: ${error.message}`);
    return staticExpoConfig();
  }
}

const packagePath = path.join(appRoot, 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error(`Missing package.json: ${packagePath}`);
  process.exit(1);
}

const pkg = readJson(packagePath);
const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
const sourceRoots = ['app', 'src', 'lib', 'components', 'features', 'hooks', 'services']
  .map((name) => path.join(appRoot, name));
const sourceFiles = [...new Set(sourceRoots.flatMap(collectSourceFiles))];
const sourceEntries = sourceFiles.map((file) => ({ file, source: read(file) }));
const remoteTokenFiles = sourceEntries.filter(({ source }) => source.includes('getExpoPushTokenAsync'));
const directNativeTokenFiles = sourceEntries.filter(({ source }) => source.includes('getDevicePushTokenAsync'));
const remoteRegistrationFiles = sourceEntries.filter(
  ({ source }) => source.includes('functions.createExecution') && source.includes('APPWRITE_PUSH_FUNCTION_ID'),
);
const remoteEnabled = requireRemote || remoteTokenFiles.length > 0;
const hasNotifications = Boolean(dependencies['expo-notifications']);

if (!remoteEnabled) {
  const mode = hasNotifications ? 'local notifications only' : 'notifications disabled';
  console.log(`Expo Push configuration check passed: ${mode}.`);
  process.exit(0);
}

const expo = resolvedExpoConfig();
const pluginNames = (expo.plugins || []).map((plugin) => Array.isArray(plugin) ? plugin[0] : plugin);
const googleServicesFile = expo.android?.googleServicesFile;
const androidPackage = expo.android?.package;
const easProjectId = expo.extra?.eas?.projectId;

if (!hasNotifications) failures.push('Remote Expo Push requires the expo-notifications package.');
if (!pluginNames.includes('expo-notifications')) failures.push('Remote Expo Push requires the expo-notifications config plugin.');
if (!easProjectId) failures.push('Remote Expo Push requires extra.eas.projectId for project-scoped Expo push tokens.');
if (!androidPackage) failures.push('Remote Expo Push requires expo.android.package.');
if (!googleServicesFile) {
  failures.push('Android Expo Push requires expo.android.googleServicesFile. This is the public FCM transport config, not a Firebase application backend.');
} else {
  const filePath = path.resolve(appRoot, googleServicesFile);
  if (!fs.existsSync(filePath)) {
    failures.push(`Android Expo Push config file is missing: ${googleServicesFile}`);
  } else {
    try {
      const googleServices = readJson(filePath);
      const clients = googleServices.client || [];
      const packageMatches = clients.some(
        (client) => client.client_info?.android_client_info?.package_name === androidPackage,
      );
      if (!packageMatches) failures.push(`google-services.json has no Android client for ${androidPackage}.`);
      if (!googleServices.project_info?.project_id || !googleServices.project_info?.project_number) {
        failures.push('google-services.json is missing its public Firebase project ID or project number.');
      }
      if (googleServices.private_key || googleServices.client_email) {
        failures.push('expo.android.googleServicesFile must not point to a private service-account key.');
      }
    } catch (error) {
      failures.push(`google-services.json is invalid: ${error.message}`);
    }
  }
}

if (dependencies['@react-native-firebase/messaging']) {
  failures.push('UULab remote push uses Expo Push Service; remove the direct React Native Firebase messaging client unless the product has an approved exception.');
}
if (directNativeTokenFiles.length) {
  failures.push('UULab remote push must register ExpoPushToken values with getExpoPushTokenAsync, not direct FCM/APNs tokens.');
}
if (dependencies.firebase) {
  warnings.push('The Firebase JavaScript SDK is installed. Expo Push does not require it; keep it only when the product uses another Firebase feature.');
}
if (!sourceEntries.some(({ source }) => source.includes('addPushTokenListener'))) {
  warnings.push('No push-token rotation listener was found. Register refreshed Expo push tokens without creating duplicate device ownership.');
}
if (!remoteRegistrationFiles.length) {
  failures.push('Expo Push tokens must be registered with the Appwrite push-installation Function, not kept only on the device.');
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
if (failures.length) {
  console.error('Expo Push configuration check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Expo Push configuration check passed: ${androidPackage}, project=${easProjectId}, transport=FCM/APNs via Expo.`,
);
