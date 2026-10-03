#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(process.argv[2] || process.cwd());
const configPath = path.join(appRoot, 'app.base.json');
const rootLayoutPath = path.join(appRoot, 'app', '_layout.tsx');
const startupSplashPath = path.join(appRoot, 'src', 'components', 'StartupSplash.tsx');
const runtimePath = path.join(appRoot, 'src', 'startup', 'StartupRuntime.ts');
const ownerPath = path.join(appRoot, 'src', 'startup', 'jeju-startup.ts');
const gatePath = path.join(appRoot, 'src', 'startup', 'startup-ota.ts');
const recoveryPath = path.join(appRoot, 'src', 'startup', 'StartupRecovery.tsx');
const failures = [];

// A small lexical/structural reader for this fixed startup contract. Comments,
// strings and template text cannot masquerade as executable ownership calls.
// It deliberately checks critical expressions and their function/call scope,
// rather than attempting to prove arbitrary JavaScript behavior from substrings.
function tokenize(source) {
  const result = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) { index++; continue; }
    if (source.startsWith('//', index)) { index = source.indexOf('\n', index); if (index < 0) break; continue; }
    if (source.startsWith('/*', index)) { const end = source.indexOf('*/', index + 2); if (end < 0) throw Error('Unterminated source comment.'); index = end + 2; continue; }
    if (char === "'" || char === '"' || char === '`') {
      const quote = char; let value = ''; let closed = false; let escaped = false; index++;
      while (index < source.length) {
        const next = source[index++];
        if (next === quote) { closed = true; break; }
        if (next === '\\') { escaped = true; value += source[index++] ?? ''; } else value += next;
      }
      if (!closed) throw Error('Unterminated source string.');
      result.push(quote === '`' ? `template:${value}` : escaped ? `escaped-string:${value}` : JSON.stringify(value)); continue;
    }
    const word = source.slice(index).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
    if (word) { result.push(word[0]); index += word[0].length; continue; }
    const number = source.slice(index).match(/^\d[\d_]*/);
    if (number) { result.push(number[0].replaceAll('_', '')); index += number[0].length; continue; }
    const operator = ['===', '!==', '=>', '?.', '??', '&&', '||', '==', '!=', '>=', '<=', '+=', '-=', '++', '--'].find(value => source.startsWith(value, index));
    result.push(operator ?? char); index += operator?.length ?? 1;
  }
  return result;
}
function sequenceIndex(tokens, sequence) {
  const expected = typeof sequence === 'string' ? tokenize(sequence) : sequence;
  return tokens.findIndex((_, index) => expected.every((token, offset) => tokens[index + offset] === token));
}
function hasSequence(tokens, sequence) { return sequenceIndex(tokens, sequence) >= 0; }
function block(tokens, start, open, close) {
  if (tokens[start] !== open) throw Error(`Expected ${open}.`);
  let depth = 0;
  for (let index = start; index < tokens.length; index++) {
    if (tokens[index] === open) depth++;
    if (tokens[index] === close && --depth === 0) return { contents: tokens.slice(start + 1, index), end: index };
  }
  throw Error(`Unclosed ${open}.`);
}
function functionBody(tokens, name) {
  const index = sequenceIndex(tokens, ['function', name, '(']);
  if (index < 0) return [];
  const parameters = block(tokens, index + 2, '(', ')');
  const bodyStart = tokens.indexOf('{', parameters.end + 1);
  return bodyStart < 0 ? [] : block(tokens, bodyStart, '{', '}').contents;
}
function splitTopLevel(tokens) {
  const parts = []; let start = 0, depth = 0;
  tokens.forEach((token, index) => {
    if (['(', '{', '['].includes(token)) depth++;
    if ([')', '}', ']'].includes(token)) depth--;
    if (token === ',' && depth === 0) { parts.push(tokens.slice(start, index)); start = index + 1; }
  });
  parts.push(tokens.slice(start)); return parts;
}
function callArguments(tokens, name) {
  const index = sequenceIndex(tokens, [name, '(']);
  return index < 0 ? [] : splitTopLevel(block(tokens, index + 1, '(', ')').contents);
}
function property(object, name) {
  if (object?.[0] !== '{' || object.at(-1) !== '}') return [];
  const entries = splitTopLevel(object.slice(1, -1)).filter(part => part.length);
  const properties = new Map();
  for (const entry of entries) {
    // This services object has a fixed literal/shorthand contract. Spreads,
    // computed keys, escaped literals and methods cannot establish its wiring.
    const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(entry[0]);
    const key = identifier ? entry[0] : entry[0].startsWith('"') ? JSON.parse(entry[0]) : null;
    if (key === null || properties.has(key)) return [];
    if (entry.length === 1 && identifier) properties.set(key, entry);
    else if (entry[1] === ':' && entry.length > 2) properties.set(key, entry.slice(2));
    else return [];
  }
  return properties.get(name) ?? [];
}
function sameExpression(actual, expected) { return actual.join(' ') === tokenize(expected).join(' '); }
function hasDirectCall(body, expression) {
  const expected = tokenize(expression); let depth = 0;
  for (let index = 0; index < body.length; index++) {
    if (depth === 0 && (index === 0 || body[index - 1] === ';' || body[index - 1] === '}') && expected.every((token, offset) => body[index + offset] === token)) return true;
    if (['(', '{', '['].includes(body[index])) depth++;
    if ([')', '}', ']'].includes(body[index])) depth--;
  }
  return false;
}

if (!fs.existsSync(configPath)) failures.push('app.base.json is missing.');
if (!fs.existsSync(rootLayoutPath)) failures.push('app/_layout.tsx is missing.');
if (!fs.existsSync(startupSplashPath)) failures.push('src/components/StartupSplash.tsx is missing.');
for (const file of [runtimePath, ownerPath, gatePath, recoveryPath]) if (!fs.existsSync(file)) failures.push(`${path.relative(appRoot, file)} is missing.`);

if (!failures.length) {
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const expo = parsed.expo || parsed;
  const rootLayout = fs.readFileSync(rootLayoutPath, 'utf8');
  const startupSplash = fs.readFileSync(startupSplashPath, 'utf8');
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const owner = fs.readFileSync(ownerPath, 'utf8');
  const gate = fs.readFileSync(gatePath, 'utf8');
  const recovery = fs.readFileSync(recoveryPath, 'utf8');
  const rootCode = tokenize(rootLayout), splashCode = tokenize(startupSplash), runtimeCode = tokenize(runtime), ownerCode = tokenize(owner), gateCode = tokenize(gate), recoveryCode = tokenize(recovery);
  const splashPlugin = (expo.plugins || []).find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  );
  const splashOptions = Array.isArray(splashPlugin) ? splashPlugin[1] || {} : {};

  if (!expo.updates?.enabled) failures.push('expo-updates must be enabled.');
  if (expo.updates?.checkAutomatically !== 'NEVER') {
    failures.push('Startup progress requires updates.checkAutomatically=NEVER and a bounded manual check.');
  }
  for (const call of ['Updates.checkForUpdateAsync()', 'Updates.fetchUpdateAsync()', 'Updates.reloadAsync()']) {
    if (!hasSequence(runtimeCode, call)) failures.push(`Extracted OTA adapter is missing executable ${call}.`);
  }
  if (!rootLayout.includes('<StartupSplash')) failures.push('Root layout does not render the custom startup splash.');
  for (const name of ['STARTUP_DECISION_MS', 'STARTUP_OTA_MS']) {
    const index = sequenceIndex(runtimeCode, ['const', name, '=']);
    const value = index < 0 || runtimeCode[index + 4] !== ';' ? NaN : Number(runtimeCode[index + 3]);
    if (!Number.isFinite(value) || value <= 0) failures.push(`${name} must be an explicit finite positive budget.`);
  }
  for (const token of ['createJejuStartupRuntime({', 'deadlineMs: STARTUP_DECISION_MS', 'otaWindowMs: STARTUP_OTA_MS', 'Updates.latestContext', 'AsyncStorage.setItem(key, value)', "AppState.currentState === 'active'"]) {
    if (!hasSequence(runtimeCode, token)) failures.push(`Startup adapter safety is missing executable ${token}.`);
  }
  const services = callArguments(runtimeCode, 'createJejuStartupRuntime')[1];
  if (!sameExpression(property(services, 'essentialFontsReady'), "() => Font.isLoaded('NanumOld')") ||
      !hasSequence(runtimeCode, "Font.loadAsync({ NanumOld: require('../../assets/fonts/NanumMyeongjo-YetHangul.ttf') })")) {
    failures.push('Essential readiness must query the actual NanumOld font backed by its bundled old-Hangul asset.');
  }
  const closeBody = functionBody(ownerCode, 'closeOta');
  const sealAssignments = ownerCode.filter((token, index) => token === 'otaSealed' && ownerCode[index + 1] === '=').length;
  if (!sameExpression(closeBody, 'otaSealed = true; gate?.close(reason);') || sealAssignments !== 2 || !hasSequence(ownerCode, 'let otaSealed = false;')) {
    failures.push('closeOta must permanently seal the single runtime owner and close its gate.');
  }
  const startBody = functionBody(ownerCode, 'start');
  if (!hasDirectCall(startBody, 'schedule(finish, deadlineMs);')) {
    failures.push('The actual startup attempt must directly schedule its whole-budget finish timer.');
  }
  for (const token of ['if (!gate && !otaSealed && !retry)', 'createStartupGate(', "closeOta('entry')", 'essentialFontsReady']) {
    if (!hasSequence(ownerCode, token)) failures.push(`Finite single startup owner is missing executable ${token}.`);
  }
  for (const token of ['attemptKey(', 'await adapter.storage.set(key', 'currentForActivation()', 'open = false', "finish('deadline')"]) {
    if (!hasSequence(gateCode, token)) failures.push(`Durable OTA gate is missing executable ${token}.`);
  }
  if (!hasSequence(rootCode, 'getStartupRuntime().mount()') || !hasSequence(rootCode, 'if (!state.fontsReady) return null')) {
    failures.push('Root must acquire per-mount readiness and guard essential historic fonts.');
  }
  if (!hasSequence(rootCode, 'hideStartupNativeSplash()') || !hasSequence(splashCode, 'onLayout={onLayout}')) {
    failures.push('Native splash requires both committed-root fallback and custom layout handoff.');
  }
  if (!hasSequence(rootCode, "import { StartupRecovery } from '@/src/startup/StartupRecovery'") ||
      !hasSequence(rootCode, "if (state.phase === 'recovery') return <StartupRecovery") ||
      !hasSequence(recoveryCode, 'export function StartupRecovery(') || !hasSequence(recoveryCode, 'onLayout={onLayout}')) {
    failures.push('Essential-font recovery must resolve to the actual rendered recovery module with native handoff.');
  }
  if (!splashOptions.image || !splashOptions.backgroundColor) {
    failures.push('Native splash image and background color must both be configured.');
  }
  for (const [name, code] of [['Custom startup splash', splashCode], ['Startup recovery', recoveryCode]]) {
    if (!hasSequence(code, "require('../../assets/images/splash-mark.png')")) failures.push(`${name} must use the approved splash mark.`);
    if (splashOptions.backgroundColor && !hasSequence(code, `backgroundColor: ${JSON.stringify(splashOptions.backgroundColor)}`)) failures.push(`${name} must use the configured native background color.`);
  }
  if (splashOptions.image && !splashOptions.image.endsWith('splash-mark.png')) {
    failures.push('Native and custom startup screens must use the same approved splash mark.');
  }
}

if (failures.length) {
  console.error('Startup configuration check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Startup configuration check passed: native splash, bounded manual OTA flow, and fallback app entry.');
