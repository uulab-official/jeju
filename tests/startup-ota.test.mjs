import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStartupGate, manifestCandidate, attemptKey } from '../src/startup/startup-ota.ts';
const project = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const running = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const next = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const other = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const candidate = { id: next, runtimeVersion: 'sdk56-pilot-1' };
const deferred = () => { let resolve, reject; const promise = new Promise((a,b)=>{resolve=a; reject=b;}); return {promise,resolve,reject}; };
const flush = async () => { for(let i=0;i<30;i++) await Promise.resolve(); };
function fixture(overrides = {}, factsOverride = {}) {
  let time = 0, scheduled;
  const counts = {check:0, fetch:0, reload:0};
  const stored = new Map();
  const facts = {supported:true, projectId:project, runtimeVersion:candidate.runtimeVersion, runningUpdateId:running,
    emergency:false, restartCount:0, checkAutomatically:'NEVER', ...factsOverride};
  let safe = true;
  let native = {working:false, pending:false, candidate:null, error:false};
  const adapter = {
    facts:()=>({...facts}), prepare:async()=>{}, check:async()=>{counts.check++;return candidate;},
    fetch:async()=>{counts.fetch++;return candidate;}, reload:async()=>{counts.reload++;},
    storage:{get:async k=>stored.get(k)??null, set:async(k,v)=>{stored.set(k,v);}},
    nativeSnapshot:()=>native, canReload:()=>safe, ...overrides,
  };
  const gate = createStartupGate(adapter, {deadlineMs:8000, clock:{now:()=>time,
    setTimeout:fn=>{scheduled=fn;return 1;}, clearTimeout:()=>{scheduled=undefined;}}});
  return {gate,adapter,facts,counts,stored, setSafe:v=>safe=v, setNative:v=>native=v,
    tick:async ms=>{time=ms;scheduled?.();await flush();}};
}

test('manual NEVER policy checks, fetches and requests one guarded reload', async()=>{
  const f=fixture(); f.gate.start(); await flush(); assert.equal(f.counts.reload,1); assert.equal(f.counts.fetch,1);
  assert.equal(f.gate.snapshot().phase,'applying'); assert.equal(f.stored.size,1);
  await f.tick(8000); assert.equal((await f.gate.start()).phase,'ready');
});
test('one deadline spans preparation, check, fetch, guard and reload', async()=>{
  const prep=deferred(); const f=fixture({prepare:()=>prep.promise}); const promise=f.gate.start();
  await f.tick(8000); assert.equal((await promise).reason,'deadline'); prep.resolve(); await flush(); assert.equal(f.counts.check,0);
});
test('late fetch after deadline stays cached without reloading or another fetch', async()=>{
  const download=deferred(); const f=fixture({fetch:()=>{f.counts.fetch++;return download.promise;}});
  const p=f.gate.start(); await flush(); await f.tick(8000); assert.equal((await p).reason,'deadline');
  download.resolve(candidate); await flush(); f.gate.observeNative(); f.gate.start(); await flush();
  assert.equal(f.counts.fetch,1); assert.equal(f.counts.reload,0);
});
test('late check after deadline does not start download', async()=>{
  const check=deferred(); const f=fixture({check:()=>check.promise}); f.gate.start(); await f.tick(8000);
  check.resolve(candidate); await flush(); assert.equal(f.counts.fetch,0);
});
test('critical auth becomes unsafe while storage writes and prevents reload', async()=>{
  const writing=deferred(); const f=fixture({storage:{get:async()=>null,set:()=>writing.promise}});
  f.gate.start(); await flush(); f.setSafe(false); writing.resolve(); await flush();
  assert.equal(f.counts.reload,0); assert.equal((await f.gate.start()).reason,'critical-flow');
});
test('native ALWAYS ownership never duplicates check or fetch', async()=>{
  const f=fixture({}, {checkAutomatically:'ALWAYS'}); f.setNative({working:true,pending:false,candidate:null,error:false});
  f.gate.start(); await flush(); assert.deepEqual(f.counts,{check:0,fetch:0,reload:0});
  f.setNative({working:false,pending:true,candidate,error:false}); f.gate.observeNative(); await flush(); assert.equal(f.counts.reload,1);
});
test('manifest without runtime metadata uses only trusted native runtime fallback',()=>{
  assert.deepEqual(manifestCandidate({id:next},candidate.runtimeVersion),candidate);
  assert.equal(manifestCandidate({id:next}),null);
  assert.equal(manifestCandidate({id:next,runtimeVersion:42},candidate.runtimeVersion),null);
});
test('embedded launch with no update id is valid and can update once',async()=>{
  const f=fixture({}, {runningUpdateId:null,isEmbeddedLaunch:true}); f.gate.start(); await flush(); assert.equal(f.counts.reload,1);
});

for(const policy of ['NEVER','ERROR_RECOVERY_ONLY','ON_ERROR_RECOVERY']) test(`manual policy ${policy} supports one owner`,async()=>{
 const f=fixture({}, {checkAutomatically:policy}); const a=f.gate.start(); assert.equal(f.gate.start(),a); await flush();
 assert.deepEqual(f.counts,{check:1,fetch:1,reload:1}); await f.tick(8000); await a;
});
for(const policy of ['ALWAYS','ON_LOAD','WIFI_ONLY']) test(`native policy ${policy} opens app without new network call when idle`,async()=>{
 const f=fixture({}, {checkAutomatically:policy}); assert.equal((await f.gate.start()).reason,'no-native-pending-update');
 assert.deepEqual(f.counts,{check:0,fetch:0,reload:0});
});
for(const reason of ['background','unmount','entry']) test(`${reason} closes gate before late native work resolves`,async()=>{
 const download=deferred(); const f=fixture({fetch:()=>download.promise}); f.gate.start(); await flush(); f.gate.close(reason);
 download.resolve(candidate); await flush(); assert.equal(f.counts.reload,0); assert.equal((await f.gate.start()).reason,reason);
});
for(const step of ['prepare','check','fetch','reload']) test(`${step} rejects without stranding splash`,async()=>{
 const f=fixture({[step]:async()=>{throw Error('offline or rejected');}}); const state=await f.gate.start();
 assert.equal(state.phase,'ready'); assert.equal(state.reason,step==='reload'?'reload-rejected':'startup-error');
});
test('reload may throw synchronously and app still enters',async()=>{
 const f=fixture({reload:()=>{throw Error('native failure');}}); assert.equal((await f.gate.start()).reason,'startup-error');
});
for(const method of ['get','set']) test(`persistent ${method} rejects and suppresses unsafe reload`,async()=>{
 const f=fixture({storage:{get:async()=>null,set:async()=>{},[method]:async()=>{throw Error('storage failure');}}});
 assert.equal((await f.gate.start()).reason,'startup-error'); assert.equal(f.counts.reload,0);
});
for(const method of ['get','set']) test(`persistent ${method} stalls only until the total deadline`,async()=>{
 const stuck=deferred(); const f=fixture({storage:{get:async()=>null,set:async()=>{},[method]:()=>stuck.promise}});
 const p=f.gate.start(); await flush(); await f.tick(8000); assert.equal((await p).reason,'deadline');
 stuck.resolve(method==='get'?null:undefined); await flush(); assert.equal(f.counts.reload,0);
});
test('auth transition during guard read never records an unattempted reload',async()=>{
 const reading=deferred(); let reads=0;
 const f=fixture({storage:{get:async()=>++reads===1?null:reading.promise,set:async(k,v)=>f.stored.set(k,v)}});
 f.gate.start(); await flush(); f.setSafe(false); reading.resolve(null); await flush();
 assert.equal(f.counts.reload,0); assert.equal(f.stored.size,0); assert.equal((await f.gate.start()).reason,'critical-flow');
});
test('applying subscriber can synchronously veto reload',async()=>{
 const f=fixture(); f.gate.subscribe(s=>{if(s.phase==='applying') f.setSafe(false);});
 assert.equal((await f.gate.start()).reason,'critical-flow'); assert.equal(f.counts.reload,0);
});
test('applying subscriber can synchronously background app',async()=>{
 const f=fixture(); f.gate.subscribe(s=>{if(s.phase==='applying') f.gate.close('background');});
 assert.equal((await f.gate.start()).reason,'background'); assert.equal(f.counts.reload,0);
});
test('broken rendering subscriber cannot strand readiness',async()=>{
 const f=fixture({check:async()=>null}); f.gate.subscribe(()=>{throw Error('render error');});
 assert.equal((await f.gate.start()).reason,'no-update');
});
test('no update enters current app and never fetches',async()=>{
 const f=fixture({check:async()=>null}); assert.equal((await f.gate.start()).reason,'no-update'); assert.equal(f.counts.fetch,0);
});
test('fetch no longer new must not reload the running app',async()=>{
 const f=fixture({fetch:async()=>null}); assert.equal((await f.gate.start()).reason,'candidate-changed-during-download'); assert.equal(f.counts.reload,0);
});
for(const stage of ['check','fetch']) for(const change of [{runtimeVersion:'different'},{projectId:other}]) test(`${stage} candidate mismatch ${Object.keys(change)[0]} opens app safely`,async()=>{
 const f=fixture({[stage]:async()=>({...candidate,...change})}); assert.equal((await f.gate.start()).phase,'ready');
 assert.equal(f.counts.reload,0); if(stage==='check')assert.equal(f.counts.fetch,0);
});
test('changed candidate between check and download stays staged for next cold start',async()=>{
 const f=fixture({fetch:async()=>({...candidate,id:other})}); assert.equal((await f.gate.start()).reason,'candidate-changed-during-download'); assert.equal(f.counts.reload,0);
});
for(const change of [{supported:false},{emergency:true},{restartCount:1},{restartCount:NaN},{runtimeVersion:null},{projectId:null},{checkAutomatically:null},{runningUpdateId:null}]) test(`untrusted launch fact ${JSON.stringify(change)} enters without reload`,async()=>{
 const f=fixture({},change); assert.equal((await f.gate.start()).phase,'ready'); assert.equal(f.counts.reload,0);
});
test('facts changed while downloading do not permit a stale reload',async()=>{
 const download=deferred(); const f=fixture({fetch:()=>download.promise}); f.gate.start(); await flush();
 f.facts.runtimeVersion='new-native-runtime'; download.resolve(candidate); await flush();
 assert.equal((await f.gate.start()).reason,'launch-facts-changed'); assert.equal(f.counts.reload,0);
});
test('already-running candidate never refetches or reloads',async()=>{
 const f=fixture({check:async()=>({...candidate,id:running})}); assert.equal((await f.gate.start()).reason,'already-running'); assert.equal(f.counts.fetch,0);
});
test('persisted prior attempt prevents loop in a new JS startup',async()=>{
 const f=fixture(); const key=attemptKey(f.facts,next); f.stored.set(key,'even malformed state suppresses retry');
 assert.equal((await f.gate.start()).reason,'candidate-already-attempted'); assert.equal(f.counts.fetch,0); assert.equal(f.counts.reload,0);
});
test('native cached pending update activates without check/fetch',async()=>{
 const f=fixture(); f.setNative({working:false,pending:true,candidate,error:false}); f.gate.start(); await flush();
 assert.deepEqual(f.counts,{check:0,fetch:0,reload:1}); await f.tick(8000);
});
test('native work taking too long does not reload when pending arrives after entry',async()=>{
 const f=fixture({}, {checkAutomatically:'ALWAYS'}); f.setNative({working:true,pending:false,candidate:null,error:false});
 f.gate.start(); await flush(); await f.tick(8000); f.setNative({working:false,pending:true,candidate,error:false}); f.gate.observeNative(); await flush(); assert.equal(f.counts.reload,0);
});
test('next cold start running downloaded candidate records entry without another reload',async()=>{
 const f=fixture({check:async()=>candidate},{runningUpdateId:next}); const key=attemptKey(f.facts,next);
 f.stored.set(key,JSON.stringify({state:'attempted',projectId:project,runtimeVersion:candidate.runtimeVersion,candidateId:next}));
 await f.gate.start(); await f.gate.markAppEntered(); await f.gate.markAppEntered();
 assert.equal(JSON.parse(f.stored.get(key)).state,'entered'); assert.equal(f.counts.reload,0);
});
test('download progress is real, finite and never moves backwards',async()=>{
 const download=deferred(); const f=fixture({fetch:()=>download.promise}); f.gate.start(); await flush();
 for(const v of [.8,.2,NaN,Infinity,-1,2]) { f.setNative({working:true,pending:false,candidate:null,error:false,downloadProgress:v}); f.gate.observeNative(); }
 assert.equal(f.gate.snapshot().downloadProgress,.8); assert.equal(f.gate.snapshot().progress,.4+.8*.4);
 f.gate.close('entry'); download.resolve(candidate); await flush();
});
test('malformed manifest and hostile getters never throw',()=>{
 for(const m of [null,[],{}, {id:next,runtimeVersion:''},{id:next,runtimeVersion:'x',extra:[]},{id:next,runtimeVersion:'x',extra:{eas:{projectId:'bad'}}}]) assert.equal(manifestCandidate(m),null);
 assert.equal(manifestCandidate({get id(){throw Error('hostile');}}),null);
});
for(const deadlineMs of [0,-1,Infinity,NaN]) test(`invalid budget ${deadlineMs} rejects configuration`,()=>{
 const f=fixture(); assert.throws(()=>createStartupGate(f.adapter,{deadlineMs}),/finite positive/);
});
test('native observation during progress publish cannot lose a pending update wake',async()=>{
 const f=fixture({}, {checkAutomatically:'ALWAYS'});
 f.setNative({working:true,pending:false,candidate:null,error:false,downloadProgress:.3});
 f.gate.subscribe(s=>{ if(s.phase==='downloading' && !s.candidateId) {
  f.setNative({working:false,pending:true,candidate,error:false}); f.gate.observeNative();
 }});
 f.gate.start(); await flush(); assert.equal(f.counts.reload,1); await f.tick(8000);
});
test('known critical auth or first-launch flow skips network before interaction',async()=>{
 const f=fixture(); f.setSafe(false); assert.equal((await f.gate.start()).reason,'critical-flow');
 assert.deepEqual(f.counts,{check:0,fetch:0,reload:0});
});
