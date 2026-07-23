const fs = require('node:fs');

const clientSource = fs.readFileSync('src/lib/appwrite.ts', 'utf8');
if (!clientSource.includes("APPWRITE_ENDPOINT = 'https://appwrite.uulab.co.kr/v1'")) {
  console.error('Hardcoded Appwrite endpoint is missing from src/lib/appwrite.ts.');
  process.exit(1);
}
if (!clientSource.includes("APPWRITE_PROJECT_ID = '6a615d4e00392e50bbd8'")) {
  console.error('Hardcoded Appwrite project ID is missing from src/lib/appwrite.ts.');
  process.exit(1);
}
if (!clientSource.includes(".setPlatform('kr.co.uulab.jeju')")) {
  console.error('React Native Appwrite platform is missing.');
  process.exit(1);
}

const envSource = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const apiKey = envSource.match(/^APPWRITE_API_KEY=(.+)$/m)?.[1]?.trim();
if (!apiKey || !apiKey.startsWith('standard_')) {
  console.error('APPWRITE_API_KEY is missing from the server-only .env file.');
  process.exit(1);
}
if (/^EXPO_PUBLIC_APPWRITE_API_KEY=/m.test(envSource)) {
  console.error('Appwrite server API key must never use an EXPO_PUBLIC_ name.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync('appwrite.config.json', 'utf8'));
const places = config.tables?.find((table) => table.$id === 'places');
const cultureItems = config.tables?.find((table) => table.$id === 'culture_items');
const syncRuns = config.tables?.find((table) => table.$id === 'sync_runs');
const pushInstallations = config.tables?.find((table) => table.$id === 'push_installations');
const collector = config.functions?.find((fn) => fn.$id === 'collect-jeju-tourism');
const cultureCollector = config.functions?.find((fn) => fn.$id === 'collect-jeju-culture');
const pushRegistration = config.functions?.find((fn) => fn.$id === 'register-push-installation');
if (!places || !cultureItems || !pushInstallations || !syncRuns || !collector || !cultureCollector || !pushRegistration) {
  console.error('Appwrite tourism table/function definition is missing.');
  process.exit(1);
}
if (!places.$permissions?.includes('read("any")')) {
  console.error('The places table must be publicly readable without allowing public writes.');
  process.exit(1);
}
if (places.$permissions.some((permission) => /create|update|delete|write/.test(permission))) {
  console.error('The places table must not grant public write permissions.');
  process.exit(1);
}
if (!syncRuns.columns?.some((column) => column.key === 'runId')) {
  console.error('sync_runs must include an optional runId column so every collection run is retained.');
  process.exit(1);
}
if (!syncRuns.columns?.some((column) => column.key === 'checkpointJson')) {
  console.error('sync_runs must include checkpointJson for incremental collection.');
  process.exit(1);
}
if (syncRuns.indexes?.some((index) => index.key === 'idx_sync_source' && index.type === 'unique')) {
  console.error('sync_runs source index must not be unique; collection history is append-only.');
  process.exit(1);
}
if (!cultureItems.$permissions?.includes('read("any")') || cultureItems.$permissions.some((permission) => /create|update|delete|write/.test(permission))) {
  console.error('The culture_items table must be publicly readable without allowing public writes.');
  process.exit(1);
}
if (!cultureItems.columns?.some((column) => column.key === 'searchText') || !cultureItems.indexes?.some((index) => index.key === 'idx_culture_search' && index.type === 'fulltext')) {
  console.error('culture_items must include a fulltext searchText index.');
  process.exit(1);
}
if ((pushInstallations.$permissions || []).length > 0) {
  console.error('push_installations must not grant direct client permissions.');
  process.exit(1);
}
if (!pushRegistration.execute?.includes('any') || !pushRegistration.scopes?.includes('rows.write')) {
  console.error('register-push-installation must allow execution through its validated Function and have rows.write scope.');
  process.exit(1);
}

console.log('Appwrite React Native client and server-only admin config check passed.');
