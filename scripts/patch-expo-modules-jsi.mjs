import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const sourceRoot = join(process.cwd(), 'node_modules', 'expo-modules-jsi', 'apple', 'Sources', 'ExpoModulesJSI');

async function swiftFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return swiftFiles(path);
    return entry.isFile() && entry.name.endsWith('.swift') ? [path] : [];
  }));
  return nested.flat();
}

let patched = 0;

try {
  for (const path of await swiftFiles(sourceRoot)) {
    const source = await readFile(path, 'utf8');
    let updated = source.replace(
      /(?<!nonisolated\(unsafe\) )\bweak (?:let|var) runtime\b/g,
      'nonisolated(unsafe) weak var runtime',
    );
    if (path.endsWith('JavaScriptCodable+Date.swift')) {
      updated = updated
        .replace('extension Date: JavaScriptCodable', 'extension Foundation.Date: JavaScriptCodable')
        .replaceAll('throws -> Date', 'throws -> Foundation.Date')
        .replace('encode(_ value: Date,', 'encode(_ value: Foundation.Date,')
        .replace('return Date(timeIntervalSince1970:', 'return Foundation.Date(timeIntervalSince1970:')
        .replace(
          'guard milliseconds.isFinite, abs(milliseconds) <= maxJavaScriptDateMilliseconds else {',
          'guard milliseconds.isFinite, milliseconds >= -maxJavaScriptDateMilliseconds, milliseconds <= maxJavaScriptDateMilliseconds else {',
        )
        .replace(
          'milliseconds.rounded(.towardZero)',
          'milliseconds.rounded(FloatingPointRoundingRule.towardZero)',
        );
    }
    if (updated !== source) {
      await writeFile(path, updated);
      patched += 1;
    }
  }
  console.log(patched > 0
    ? `Patched ExpoModulesJSI weak runtime isolation in ${patched} Swift files for Xcode 26.1.`
    : 'ExpoModulesJSI Xcode 26.1 patch is not needed.');
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    console.log('ExpoModulesJSI is not installed; skipping the Xcode 26.1 compatibility patch.');
  } else {
    throw error;
  }
}
