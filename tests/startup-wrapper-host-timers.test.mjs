import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require(process.env.STARTUP_TEST_TYPESCRIPT || 'typescript');
const paths={'src/startup/jeju-startup.ts':fileURLToPath(new URL('../src/startup/jeju-startup.ts',import.meta.url))};
function clocks(path){const source=readFileSync(path,'utf8'),file=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true);const initializers=[];
 function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(file)==='clock'&&node.initializer)initializers.push(node.initializer.getText(file));ts.forEachChild(node,visit);}visit(file);
 return initializers.map(expr=>{const code=ts.transpileModule(`export function clock(options:any){return ${expr};}`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;const exports={};new Function('exports',code)(exports);return exports.clock;});}
for(const [name,path]of Object.entries(paths))test(`${name} exact-source default wrapper clocks invoke host timers globally and preserve injected receivers`,()=>{
 const set=globalThis.setTimeout,clear=globalThis.clearTimeout;let count=0;
 globalThis.setTimeout=function(){assert.ok(this===undefined||this===globalThis,'browser host receiver');count++;return 17;};
 globalThis.clearTimeout=function(id){assert.ok(this===undefined||this===globalThis,'browser host receiver');assert.equal(id,17);count++;};
 try{const factories=clocks(path);assert.ok(factories.length>0);for(const create of factories){const c=create({});c.setTimeout(()=>{},1);c.clearTimeout(17);
 const injected={setTimeout(){assert.equal(this,injected);return 23;},clearTimeout(id){assert.equal(this,injected);assert.equal(id,23);},now(){assert.equal(this,injected);return 100;}};const custom=create({clock:injected});assert.equal(custom,injected);custom.setTimeout(()=>{},1);custom.clearTimeout(23);assert.equal(custom.now(),100);}assert.equal(count,factories.length*2);}
 finally{globalThis.setTimeout=set;globalThis.clearTimeout=clear;}
});
