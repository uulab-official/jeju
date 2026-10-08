import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../src/features/ads/model.ts',import.meta.url),'utf8'));
const {shouldInsertDiscoverAd,resolveNativeDiscoverAdUnitId}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('one ad follows the fifth place only when another organic place follows',()=>{
  assert.deepEqual(Array.from({length:12},(_,index)=>index).filter(index=>shouldInsertDiscoverAd({index,itemCount:12})),[4]);
  assert.equal(shouldInsertDiscoverAd({index:4,itemCount:5}),false);
  assert.equal(shouldInsertDiscoverAd({index:4,itemCount:6,query:'숲'}),false);
  assert.equal(shouldInsertDiscoverAd({index:4,itemCount:6,hasError:true}),false);
});
test('unconfigured production cannot request ads and platform IDs stay separate',()=>{
  assert.equal(resolveNativeDiscoverAdUnitId('android',null),null);
  const config={testMode:false,productionReady:false,nativeDiscoverIos:'ios-unit',nativeDiscoverAndroid:'android-unit'};
  assert.equal(resolveNativeDiscoverAdUnitId('android',config),null);
  assert.equal(resolveNativeDiscoverAdUnitId('ios',{...config,productionReady:true}),'ios-unit');
});
