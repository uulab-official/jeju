#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const projectId = 'uulab-jeju';
const accountId = 'expo-fcm';
const email = `${accountId}@${projectId}.iam.gserviceaccount.com`;
const credentialsRoot = process.env.UULAB_CREDENTIALS_DIR || '/Users/bonjin/Documents/workspace/uulab/.credentials';
const outputDir = path.join(credentialsRoot, 'firebase', 'jeju');
const outputPath = path.join(outputDir, 'fcm-v1-service-account.json');
const firebaseToken = process.env.FIREBASE_CLI_TOKEN;

if (!firebaseToken) {
  console.error('FIREBASE_CLI_TOKEN is required.');
  process.exit(1);
}

const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: firebaseToken,
    grant_type: 'refresh_token',
  }),
});
const tokenBody = await tokenResponse.json();
if (!tokenResponse.ok || !tokenBody.access_token) throw new Error('Could not refresh the Firebase CLI session.');
const accessToken = tokenBody.access_token;

async function googleRequest(url, init = {}, accepted = [200]) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!accepted.includes(response.status)) {
    throw new Error(`${response.status} ${body.error?.message || response.statusText}`);
  }
  return { status: response.status, body };
}

const serviceAccountName = `projects/${projectId}/serviceAccounts/${email}`;
const accountUrl = `https://iam.googleapis.com/v1/${serviceAccountName}`;
const existingAccount = await googleRequest(accountUrl, {}, [200, 404]);
if (existingAccount.status === 404) {
  await googleRequest(`https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts`, {
    method: 'POST',
    body: JSON.stringify({ accountId, serviceAccount: { displayName: 'Expo FCM V1 sender' } }),
  });
  console.log(`Created service account ${email}.`);
} else {
  console.log(`Using existing service account ${email}.`);
}

const policyResult = await googleRequest(
  `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy`,
  { method: 'POST', body: JSON.stringify({ options: { requestedPolicyVersion: 1 } }) },
);
const policy = policyResult.body;
policy.bindings ||= [];
const role = 'roles/firebasecloudmessaging.admin';
let binding = policy.bindings.find((item) => item.role === role);
if (!binding) {
  binding = { role, members: [] };
  policy.bindings.push(binding);
}
const member = `serviceAccount:${email}`;
if (!binding.members.includes(member)) binding.members.push(member);
await googleRequest(`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:setIamPolicy`, {
  method: 'POST',
  body: JSON.stringify({ policy }),
});
console.log(`Confirmed ${role} for ${email}.`);

await googleRequest(`https://serviceusage.googleapis.com/v1/projects/${projectId}/services/fcm.googleapis.com:enable`, {
  method: 'POST',
  body: '{}',
}, [200]);

if (!fs.existsSync(outputPath)) {
  const keyResult = await googleRequest(`https://iam.googleapis.com/v1/${serviceAccountName}/keys`, {
    method: 'POST',
    body: JSON.stringify({
      privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
      keyAlgorithm: 'KEY_ALG_RSA_2048',
    }),
  });
  fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(outputPath, Buffer.from(keyResult.body.privateKeyData, 'base64'), { mode: 0o600 });
  console.log(`Created FCM V1 key at ${outputPath}.`);
} else {
  console.log(`Kept existing FCM V1 key at ${outputPath}.`);
}
