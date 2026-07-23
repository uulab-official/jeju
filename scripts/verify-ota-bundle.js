#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist-update');
const metadataPath = path.join(output, 'metadata.json');
const target = process.env.OTA_PLATFORM || 'all';
const platforms = target === 'all' ? ['ios', 'android'] : [target];
const failures = [];

function resolveOutput(relativePath, label) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    failures.push(`${label} has an invalid path`);
    return null;
  }
  const resolved = path.resolve(output, relativePath);
  if (!resolved.startsWith(`${output}${path.sep}`)) {
    failures.push(`${label} escapes dist-update`);
    return null;
  }
  return resolved;
}

if (!['all', 'ios', 'android'].includes(target)) {
  failures.push(`unsupported platform ${target}`);
} else if (!fs.existsSync(metadataPath)) {
  failures.push('dist-update/metadata.json is missing');
} else {
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  if (metadata.bundler !== 'metro') failures.push(`unexpected bundler: ${metadata.bundler}`);
  for (const platform of platforms) {
    const platformMetadata = metadata.fileMetadata?.[platform];
    const bundlePath = resolveOutput(platformMetadata?.bundle, `${platform} bundle`);
    if (!bundlePath || !fs.existsSync(bundlePath) || fs.statSync(bundlePath).size < 100_000) {
      failures.push(`${platform} bundle is missing or unexpectedly small`);
    }
    for (const asset of platformMetadata?.assets || []) {
      const assetPath = resolveOutput(asset?.path, `${platform} asset`);
      if (!assetPath || !fs.existsSync(assetPath)) failures.push(`${platform} asset is missing`);
    }
  }
}

if (failures.length) {
  console.error('OTA bundle verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`OTA bundle passed for ${platforms.join(', ')}.`);
