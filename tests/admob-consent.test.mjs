import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

async function loadController() {
  const path = new URL('../src/features/ads/consent-controller.ts', import.meta.url);
  assert.ok(existsSync(path), 'consent controller must exist before ads can request');
  return import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(readFileSync(path,'utf8'))).toString('base64'));
}
function fixture(create, overrides = {}) {
  const calls = {gather:0,initialize:0,privacy:0};
  let allowed = true;
  const sdk = {
    gatherConsent:async () => {calls.gather++;return {canRequestAds:allowed};},
    getConsentInfo:async () => ({canRequestAds:allowed}),
    initialize:async () => {calls.initialize++;},
    requestInfoUpdate:async () => ({privacyOptionsRequirementStatus:'REQUIRED'}),
    showPrivacyOptionsForm:async () => {calls.privacy++;allowed=false;},
    ...overrides,
  };
  return {controller:create(sdk), calls, allow:value=>{allowed=value;}};
}
test('concurrent mounts share consent and SDK initialization',async () => {
  const {createConsentController}=await loadController(); const f=fixture(createConsentController);
  assert.deepEqual(await Promise.all([f.controller.prepare(),f.controller.prepare()]),[true,true]);
  assert.equal(f.calls.gather,1); assert.equal(f.calls.initialize,1);
});
test('denial prevents initialization and later requests can retry',async () => {
  const {createConsentController}=await loadController(); const f=fixture(createConsentController);f.allow(false);
  assert.equal(await f.controller.prepare(),false);assert.equal(f.calls.initialize,0);
  f.allow(true);assert.equal(await f.controller.prepare(),true);assert.equal(f.calls.gather,2);
});
test('consent network errors fail closed then recover',async () => {
  const {createConsentController}=await loadController();let fail=true;
  const f=fixture(createConsentController,{gatherConsent:async()=>{if(fail)throw Error('offline');return {canRequestAds:true};}});
  assert.equal(await f.controller.prepare(),false);assert.equal(f.calls.initialize,0);
  fail=false;assert.equal(await f.controller.prepare(),true);
});
test('a human consent form remains pending until the user finishes',async () => {
  const {createConsentController}=await loadController();let finish;
  const f=fixture(createConsentController,{gatherConsent:()=>new Promise(r=>{finish=r;})});
  const result=f.controller.prepare(); await Promise.resolve();assert.equal(f.calls.initialize,0);
  finish({canRequestAds:true});assert.equal(await result,true);
});
test('privacy change invalidates permission and notifies loaded ad owners',async () => {
  const {createConsentController}=await loadController();const f=fixture(createConsentController);
  assert.equal(await f.controller.prepare(),true);let changes=0;
  const unsubscribe=f.controller.subscribe(()=>{changes++;});
  assert.equal(await f.controller.showPrivacyOptions(),'shown');assert.ok(changes>=1);
  assert.equal(await f.controller.prepare(),false);assert.equal(f.calls.initialize,1);unsubscribe();
});
test('privacy invalidation during the final native permission read vetoes the request',async () => {
  const {createConsentController}=await loadController();
  let finishRead;
  const f=fixture(createConsentController,{getConsentInfo:()=>new Promise(resolve=>{finishRead=resolve;})});
  const preparation=f.controller.prepare();
  for(let i=0;i<10&&!finishRead;i++) await Promise.resolve();
  assert.equal(typeof finishRead,'function');
  const privacy=f.controller.showPrivacyOptions();
  finishRead({canRequestAds:true});
  assert.equal(await preparation,false);
  assert.equal(await privacy,'shown');
});
