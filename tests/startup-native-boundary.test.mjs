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

test('native owner starting during manual check is observed without duplicate fetch',async()=>{
 const checked=deferred(); const f=fixture({check:()=>{f.counts.check++;return checked.promise;}});
 f.gate.start(); await flush(); f.setNative({working:true,pending:false,candidate:null,error:false});
 checked.resolve(candidate); await flush(); assert.equal(f.counts.fetch,0); assert.equal(f.counts.reload,0);
 f.setNative({working:false,pending:true,candidate,error:false}); f.gate.observeNative(); await flush();
 assert.deepEqual(f.counts,{check:1,fetch:0,reload:1}); f.gate.close('entry');
});
test('iOS own successful check waits for its idle event and then fetches once',async()=>{
 const checked=deferred(); const f=fixture({check:()=>{f.counts.check++;return checked.promise;}});
 f.gate.start(); await flush(); f.setNative({working:true,pending:false,candidate:null,error:false});
 checked.resolve(candidate); await flush(); assert.equal(f.counts.fetch,0);
 f.setNative({working:false,pending:false,candidate:null,error:false}); f.gate.observeNative(); await flush();
 assert.deepEqual(f.counts,{check:1,fetch:1,reload:1}); f.gate.close('entry');
});
test('iOS own successful fetch waits for its idle event before reload',async()=>{
 const fetched=deferred(); const f=fixture({fetch:()=>{f.counts.fetch++;return fetched.promise;}});
 f.gate.start(); await flush(); f.setNative({working:true,pending:false,candidate:null,error:false});
 fetched.resolve(candidate); await flush(); assert.equal(f.counts.reload,0);
 f.setNative({working:false,pending:true,candidate,error:false}); f.gate.observeNative(); await flush();
 assert.equal(f.counts.reload,1); assert.equal(f.counts.fetch,1); f.gate.close('entry');
});
test('native download beginning during prefetch ledger read prevents a duplicate API',async()=>{
 const ledger=deferred(); let reads=0; const f=fixture({storage:{get:()=>++reads===1?ledger.promise:Promise.resolve(null),set:async()=>{}}});
 f.gate.start(); await flush(); f.setNative({working:true,pending:false,candidate:null,error:false});
 ledger.resolve(null); await flush(); assert.equal(f.counts.fetch,0);
 f.setNative({working:false,pending:true,candidate,error:false}); f.gate.observeNative(); await flush();
 assert.equal(f.counts.fetch,0); assert.equal(f.counts.reload,1); f.gate.close('entry');
});
test('native cache arriving during a no-update check can activate with exact pending provenance',async()=>{
 const checked=deferred(); const writing=deferred(); const f=fixture({check:()=>checked.promise,storage:{get:async()=>null,set:()=>writing.promise}});
 f.gate.start(); await flush(); f.setNative({working:false,pending:true,candidate,error:false});
 checked.resolve(null); await flush(); assert.equal(f.gate.snapshot().candidateId,next);
 f.setNative({working:false,pending:false,candidate:null,error:false}); writing.resolve(); await flush();
 assert.equal(f.counts.fetch,0); assert.equal(f.counts.reload,0);
 assert.equal((await f.gate.start()).reason,'candidate-no-longer-pending');
});
test('initial cached candidate while native is busy waits for final native selection',async()=>{
 const f=fixture(); f.setNative({working:true,pending:true,candidate,error:false}); f.gate.start(); await flush();
 assert.equal(f.counts.reload,0); assert.equal(f.stored.size,0);
 f.setNative({working:false,pending:true,candidate:{...candidate,id:other},error:false}); f.gate.observeNative(); await flush();
 assert.equal(f.gate.snapshot().candidateId,other); assert.equal(f.counts.reload,1); assert.equal(f.counts.fetch,0); f.gate.close('entry');
});
test('native work starting during activation write is observed before revalidation',async()=>{
 const writing=deferred(); const f=fixture({storage:{get:async()=>null,set:()=>writing.promise}});
 f.gate.start(); await flush(); f.setNative({working:true,pending:false,candidate:null,error:false});
 writing.resolve(); await flush(); assert.equal(f.counts.reload,0);
 f.setNative({working:false,pending:true,candidate:{...candidate,id:other},error:false}); f.gate.observeNative(); await flush();
 assert.equal(f.counts.reload,0); assert.equal((await f.gate.start()).reason,'native-candidate-changed');
});
test('synchronous applying observer busy transition cannot race a native reload',async()=>{
 const f=fixture(); f.gate.subscribe(state=>{if(state.phase==='applying')f.setNative({working:true,pending:false,candidate:null,error:false});});
 f.gate.start(); await flush(); assert.equal(f.counts.reload,0);
 f.setNative({working:false,pending:true,candidate,error:false}); f.gate.observeNative(); await flush();
 assert.equal(f.counts.reload,1); f.gate.close('entry');
});
for(const closure of ['deadline','background','unmount','entry']) test(`${closure} permanently closes an idle-event drain without a late fetch`,async()=>{
 const checked=deferred(); const f=fixture({check:()=>checked.promise}); f.gate.start(); await flush();
 f.setNative({working:true,pending:false,candidate:null,error:false}); checked.resolve(candidate); await flush();
 assert.equal(f.counts.fetch,0); if(closure==='deadline') await f.tick(8000); else f.gate.close(closure);
 f.setNative({working:false,pending:false,candidate:null,error:false}); f.gate.observeNative(); await flush();
 assert.equal(f.counts.fetch,0); assert.equal(f.counts.reload,0); assert.equal((await f.gate.start()).reason,closure);
});

test('manual no-new fetch adopts exact native pending cache without weakening its provenance',async()=>{
 const fetched=deferred();const writing=deferred();const f=fixture({fetch:()=>{f.counts.fetch++;return fetched.promise;},storage:{get:async()=>null,set:()=>writing.promise}});
 f.gate.start();await flush();f.setNative({working:false,pending:true,candidate,error:false});fetched.resolve(null);await flush();
 assert.equal(f.gate.snapshot().candidateId,next);f.setNative({working:false,pending:false,candidate:null,error:false});writing.resolve();await flush();
 assert.equal(f.counts.fetch,1);assert.equal(f.counts.reload,0);assert.equal((await f.gate.start()).reason,'candidate-no-longer-pending');
});
