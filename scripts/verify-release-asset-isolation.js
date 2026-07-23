#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packagePath = path.join(root, 'package.json');
const fastfilePath = path.join(root, 'fastlane', 'Fastfile');
const appleHelperPath = path.join(root, 'fastlane', 'uulab_app_store_screenshots.rb');
const googleHelperPath = path.join(root, 'scripts', 'verify-google-play-remote-assets.rb');
const failures = [];

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) failures.push(`missing ${path.relative(root, filePath)}`);
}

requireFile(packagePath);
requireFile(fastfilePath);
requireFile(appleHelperPath);
requireFile(googleHelperPath);

if (failures.length) {
  console.error('Release asset isolation check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts || {};
const fastfile = fs.readFileSync(fastfilePath, 'utf8');

function expandScript(name, seen = new Set()) {
  if (seen.has(name)) return '';
  seen.add(name);
  const script = scripts[name] || '';
  const nested = [...script.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g)]
    .map((match) => match[1])
    .filter((nestedName) => nestedName !== 'release:assets:check')
    .map((nestedName) => expandScript(nestedName, seen));
  return [script, ...nested].join(' ');
}

for (const name of ['submit:ios', 'submit:android']) {
  if (!scripts[name]) {
    failures.push(`missing package script ${name}`);
    continue;
  }

  const command = expandScript(name);
  const forbidden = [
    '--metadata_path',
    '--sync_image_upload',
    'metadata:push',
    'ios:metadata',
    'android:metadata',
    'screenshots:deduplicate'
  ];
  for (const token of forbidden) {
    if (command.includes(token)) failures.push(`${name} must not invoke asset upload token: ${token}`);
  }

  if (command.includes('fastlane supply')) {
    for (const flag of [
      '--skip_upload_metadata true',
      '--skip_upload_images true',
      '--skip_upload_screenshots true',
      '--skip_upload_changelogs true'
    ]) {
      if (!command.includes(flag)) failures.push(`${name} supply command is missing ${flag}`);
    }
  }
}

for (const name of [
  'ios:metadata',
  'ios:screenshots:audit',
  'ios:screenshots:deduplicate',
  'ios:store-status',
  'ios:cancel-review',
  'ios:submit-review',
  'android:metadata',
  'android:screenshots:audit'
]) {
  if (!scripts[name]) failures.push(`missing package script ${name}`);
}

if (!fastfile.includes('overwrite_screenshots: true')) {
  failures.push('iOS metadata lane must replace the editable screenshot set');
}
if (!fastfile.includes('UulabAppStoreScreenshots.reconcile!')) {
  failures.push('iOS metadata lane must reconcile and stabilize the remote screenshot set');
}
if (!fastfile.includes('sync_image_upload: true')) {
  failures.push('Android metadata lane must synchronize the remote image set');
}
if (!fastfile.includes('lane :store_status')) {
  failures.push('missing read-only iOS store_status lane');
}
if (!fastfile.includes('lane :cancel_review')) {
  failures.push('missing guarded iOS cancel_review lane');
} else {
  for (const token of [
    'IOS_CONFIRM_CANCEL_REVIEW',
    'IOS_CANCEL_REVIEW_VERSION',
    'IOS_CANCEL_REVIEW_STATE',
    '%w[WAITING_FOR_REVIEW IN_REVIEW]',
    'target.reject!',
    'live_before.values_at(:version, :state, :downloadable)'
  ]) {
    if (!fastfile.includes(token)) failures.push(`iOS cancel_review lane is missing ${token}`);
  }
  if (fastfile.includes('reject_version_if_possible!')) {
    failures.push('iOS cancellation must not use reject_version_if_possible!');
  }
}

const submitReviewIndex = fastfile.indexOf('lane :submit_review');
const submitReview = submitReviewIndex >= 0 ? fastfile.slice(submitReviewIndex) : '';
if (!submitReview) {
  failures.push('missing iOS submit_review lane');
} else {
  if (!submitReview.includes('skip_screenshots: true')) {
    failures.push('iOS submit_review lane must skip screenshot upload');
  }
  if (!submitReview.includes('verify!')) {
    failures.push('iOS submit_review lane must audit screenshots before submission');
  }
  if (!submitReview.includes('required_clean_reads: 2')) {
    failures.push('iOS submit_review lane must require two consecutive stable screenshot reads');
  }
}

if (failures.length) {
  console.error('Release asset isolation check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Release asset isolation check passed.');
