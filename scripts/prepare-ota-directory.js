#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist-update');

if (path.dirname(output) !== root || path.basename(output) !== 'dist-update') {
  throw new Error(`Refusing to clean unexpected OTA path: ${output}`);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
console.log(`Prepared ${output}`);
