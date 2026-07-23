#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(process.argv[2] || process.cwd());
const configPath = path.join(appRoot, 'app.base.json');
const rootLayoutPath = path.join(appRoot, 'app', '_layout.tsx');
const startupSplashPath = path.join(appRoot, 'src', 'components', 'StartupSplash.tsx');
const failures = [];

if (!fs.existsSync(configPath)) failures.push('app.base.json is missing.');
if (!fs.existsSync(rootLayoutPath)) failures.push('app/_layout.tsx is missing.');
if (!fs.existsSync(startupSplashPath)) failures.push('src/components/StartupSplash.tsx is missing.');

if (!failures.length) {
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const expo = parsed.expo || parsed;
  const rootLayout = fs.readFileSync(rootLayoutPath, 'utf8');
  const startupSplash = fs.readFileSync(startupSplashPath, 'utf8');
  const splashPlugin = (expo.plugins || []).find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  );
  const splashOptions = Array.isArray(splashPlugin) ? splashPlugin[1] || {} : {};

  if (!expo.updates?.enabled) failures.push('expo-updates must be enabled.');
  if (expo.updates?.checkAutomatically !== 'NEVER') {
    failures.push('Startup progress requires updates.checkAutomatically=NEVER and a bounded manual check.');
  }
  for (const call of ['Updates.checkForUpdateAsync()', 'Updates.fetchUpdateAsync()', 'Updates.reloadAsync()']) {
    if (!rootLayout.includes(call)) failures.push(`Manual OTA startup flow is missing ${call}.`);
  }
  if (!rootLayout.includes('<StartupSplash')) failures.push('Root layout does not render the custom startup splash.');
  if (!rootLayout.includes('withTimeout(')) failures.push('Startup network work must use bounded timeouts.');
  if (!splashOptions.image || !splashOptions.backgroundColor) {
    failures.push('Native splash image and background color must both be configured.');
  }
  if (!startupSplash.includes('splash-mark.png')) failures.push('Custom startup splash must use the approved splash mark.');
  if (splashOptions.image && !splashOptions.image.endsWith('splash-mark.png')) {
    failures.push('Native and custom startup screens must use the same approved splash mark.');
  }
  if (splashOptions.backgroundColor && !startupSplash.includes(splashOptions.backgroundColor)) {
    failures.push('Native and custom startup screens must use the same background color.');
  }
}

if (failures.length) {
  console.error('Startup configuration check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Startup configuration check passed: native splash, bounded manual OTA flow, and fallback app entry.');
