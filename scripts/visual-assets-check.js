#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const imagePath = (name) => path.join(root, 'assets', 'images', name);
const failures = [];

const assets = [
  { name: 'icon.png', width: 1024, height: 1024, opaque: true },
  { name: 'android-icon-background.png', width: 512, height: 512, opaque: true },
  { name: 'android-icon-foreground.png', width: 1024, height: 1024, alpha: true, minWidth: 0.5, maxWidth: 0.66 },
  { name: 'android-icon-monochrome.png', width: 432, height: 432, alpha: true, minWidth: 0.5, maxWidth: 0.66, solidRgb: '0,0,0' },
  { name: 'notification-icon.png', width: 96, height: 96, alpha: true, minWidth: 0.5, maxWidth: 0.66, solidRgb: '255,255,255' },
  { name: 'splash-mark.png', width: 1024, height: 1024, alpha: true, minWidth: 0.68, maxWidth: 0.8 },
  { name: 'splash-icon.png', width: 1024, height: 1024, alpha: true, minWidth: 0.68, maxWidth: 0.8 },
  { name: 'favicon.png', width: 48, height: 48, opaque: true },
];

async function inspectAsset(spec) {
  const file = imagePath(spec.name);
  if (!fs.existsSync(file)) {
    failures.push(`${spec.name} is missing.`);
    return;
  }

  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== spec.width || info.height !== spec.height) {
    failures.push(`${spec.name} must be ${spec.width}x${spec.height}, got ${info.width}x${info.height}.`);
  }

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let transparentPixels = 0;
  const visibleColors = new Set();
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        transparentPixels += 1;
      } else {
        visibleColors.add(`${data[offset]},${data[offset + 1]},${data[offset + 2]}`);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (spec.opaque && transparentPixels > 0) {
    failures.push(`${spec.name} must be fully opaque.`);
  }
  if (spec.alpha) {
    const corners = [
      data[3],
      data[(info.width - 1) * 4 + 3],
      data[((info.height - 1) * info.width) * 4 + 3],
      data[(info.height * info.width - 1) * 4 + 3],
    ];
    if (corners.some((alpha) => alpha !== 0)) {
      failures.push(`${spec.name} must have fully transparent corners.`);
    }
    if (maxX < minX || maxY < minY) {
      failures.push(`${spec.name} has no visible mark.`);
      return;
    }
    const widthRatio = (maxX - minX + 1) / info.width;
    if (widthRatio < spec.minWidth || widthRatio > spec.maxWidth) {
      failures.push(`${spec.name} visible width ratio ${widthRatio.toFixed(3)} is outside ${spec.minWidth}-${spec.maxWidth}.`);
    }
    const leftPadding = minX;
    const rightPadding = info.width - maxX - 1;
    if (Math.abs(leftPadding - rightPadding) > Math.max(4, info.width * 0.025)) {
      failures.push(`${spec.name} horizontal alpha bounds are unbalanced (${leftPadding}px/${rightPadding}px).`);
    }
    if (spec.solidRgb && (visibleColors.size !== 1 || !visibleColors.has(spec.solidRgb))) {
      failures.push(`${spec.name} must use one solid RGB color (${spec.solidRgb}).`);
    }
  }
}

async function main() {
  await Promise.all(assets.map(inspectAsset));

  const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.base.json'), 'utf8')).expo;
  const splashPlugin = appConfig.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  );
  const splashOptions = splashPlugin?.[1] || {};
  const notificationPlugin = appConfig.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications',
  );
  const notificationOptions = notificationPlugin?.[1] || {};

  if (appConfig.icon !== './assets/images/icon.png' || appConfig.ios?.icon !== './assets/images/icon.png') {
    failures.push('iOS and root launcher icon paths must use assets/images/icon.png.');
  }
  if (appConfig.android?.adaptiveIcon?.foregroundImage !== './assets/images/android-icon-foreground.png') {
    failures.push('Android adaptive foreground must use android-icon-foreground.png.');
  }
  if (appConfig.android?.adaptiveIcon?.monochromeImage !== './assets/images/android-icon-monochrome.png') {
    failures.push('Android monochrome icon must use android-icon-monochrome.png.');
  }
  if (notificationOptions.icon !== './assets/images/notification-icon.png') {
    failures.push('Expo notifications must use notification-icon.png.');
  }
  if (splashOptions.image !== './assets/images/splash-mark.png') {
    failures.push('Native splash must use splash-mark.png.');
  }
  if (!Number.isFinite(splashOptions.imageWidth) || splashOptions.imageWidth < 80 || splashOptions.imageWidth > 180) {
    failures.push('Native splash imageWidth must remain between 80 and 180.');
  }

  const startupSplash = fs.readFileSync(path.join(root, 'src', 'components', 'StartupSplash.tsx'), 'utf8');
  if (!startupSplash.includes("splash-mark.png")) {
    failures.push('Custom startup splash must use splash-mark.png.');
  }
  if (!startupSplash.includes(splashOptions.backgroundColor)) {
    failures.push('Native and custom startup splash background colors must match.');
  }

  if (failures.length) {
    console.error('Visual asset check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log('Visual asset check passed: launcher, adaptive, monochrome, notification, favicon, and splash assets.');
}

main().catch((error) => {
  console.error(`Visual asset check failed: ${error.message}`);
  process.exit(1);
});
