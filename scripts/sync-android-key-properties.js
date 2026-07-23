#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const credentialsPath = path.join(root, 'credentials.json');
const rootKeyPropertiesPath = path.join(root, 'key.properties');
const androidKeyPropertiesPath = path.join(root, 'android', 'key.properties');

function fail(message) {
  console.error(`android:keyprops: ${message}`);
  process.exit(1);
}

function normalizeRelativePath(value) {
  if (!value || typeof value !== 'string') {
    fail('credentials.json android.keystore.keystorePath is missing.');
  }

  return path.isAbsolute(value) ? path.relative(root, value) : value;
}

function loadKeystore() {
  if (!fs.existsSync(credentialsPath)) {
    fail('credentials.json was not found. Configure local EAS Android credentials first.');
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const keystore = credentials.android && credentials.android.keystore;

  if (!keystore) {
    fail('credentials.json does not contain android.keystore.');
  }

  for (const key of ['keystorePath', 'keystorePassword', 'keyAlias', 'keyPassword']) {
    if (!keystore[key]) {
      fail(`credentials.json android.keystore.${key} is missing.`);
    }
  }

  const storeFile = normalizeRelativePath(keystore.keystorePath);
  const resolvedStoreFile = path.resolve(root, storeFile);

  if (!fs.existsSync(resolvedStoreFile)) {
    fail(`configured keystore file does not exist: ${storeFile}`);
  }

  return {
    storeFile,
    storePassword: keystore.keystorePassword,
    keyAlias: keystore.keyAlias,
    keyPassword: keystore.keyPassword,
  };
}

function formatKeyProperties(values) {
  return [
    '# Generated from credentials.json. Do not commit this file.',
    `storeFile=${values.storeFile}`,
    `storePassword=${values.storePassword}`,
    `keyAlias=${values.keyAlias}`,
    `keyPassword=${values.keyPassword}`,
    '',
  ].join('\n');
}

function writeIfParentExists(targetPath, contents) {
  const parent = path.dirname(targetPath);
  if (!fs.existsSync(parent)) return false;
  fs.writeFileSync(targetPath, contents, { mode: 0o600 });
  return true;
}

const keystore = loadKeystore();
const contents = formatKeyProperties(keystore);

fs.writeFileSync(rootKeyPropertiesPath, contents, { mode: 0o600 });
const wroteAndroidCopy = writeIfParentExists(androidKeyPropertiesPath, contents);

console.log(`android:keyprops: wrote key.properties for alias "${keystore.keyAlias}"`);
console.log(`android:keyprops: store file ${keystore.storeFile}`);
if (wroteAndroidCopy) {
  console.log('android:keyprops: wrote android/key.properties');
}
