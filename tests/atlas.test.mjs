import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterConfigurations,fieldValues,toggleSelection,normalizeSelection} from '../src/data/filter.mjs';
const data=JSON.parse(readFileSync(new URL('../src/data/atlas.json',import.meta.url)));
const {methods,configurations,sources}=data;
test('method, configuration and source identifiers are unique and references resolve',()=>{
 for(const records of [methods,configurations,sources])assert.equal(new Set(records.map(r=>r.id)).size,records.length);
 const mids=new Set(methods.map(m=>m.id)),sids=new Set(sources.map(s=>s.id));
 for(const c of configurations){assert(mids.has(c.methodId));for(const v of Object.values(c)){if(v&&typeof v==='object'&&'sourceId' in v){assert(sids.has(v.sourceId));assert(v.locator.length>0);assert(['reported','inferred','unknown','not_reported'].includes(v.status));}}}
 for(const m of methods){assert(sids.has(m.sourceId));if(m.code==='Public')assert(sids.has(m.codeSourceId));}
});
test('combined filters match within one configuration, not across a method',()=>{
 assert.deepEqual(filterConfigurations(configurations,methods,{inputState:'Apo',inputs:'Holo protein'},'').map(c=>c.id),['apo2mol-pair']);
 assert.deepEqual(filterConfigurations(configurations,methods,{representations:'Voxel density',inputs:'Reference ligand'},'').map(c=>c.id),['voxbind-seed']);
 assert.equal(filterConfigurations(configurations,methods,{task:'De novo',inputs:'Reference ligand'},'VoxBind').length,0);
});
test('Unknown is an explicit searchable category and code is method-scoped',()=>{
 const list=filterConfigurations(configurations,methods,{code:'Unknown'},'');assert(list.length>=2);assert(list.every(c=>fieldValues(c,'code',methods)[0]==='Unknown'));
 assert(filterConfigurations(configurations,methods,{pocketTreatment:'Unknown'},'').some(c=>c.methodId==='pidiff'));
});
test('search trims whitespace and ignores case',()=>{assert.equal(filterConfigurations(configurations,methods,{},'  APO2MOL  ').length,2);});
test('selection permits 2–4 unique configuration IDs and removes stale entries',()=>{
 let selected=[];configurations.slice(0,5).forEach(c=>selected=toggleSelection(selected,c.id));assert.equal(selected.length,4);
 assert.equal(toggleSelection(selected,selected[0]).length,3);
 assert.deepEqual(normalizeSelection([configurations[0].id,configurations[0].id,'missing'],configurations),[configurations[0].id]);
});
test('SeFMol is not classified as flexible protein; benchmark resources are not methods',()=>{
 assert.equal(configurations.find(c=>c.methodId==='sefmol').pocketTreatment.value,'Fixed pocket / ligand flexibility');
 for(const id of ['posebusters','plinder','molgenbench'])assert(!methods.some(m=>m.id===id));
});
test('served JSON equals the curated source and exact docking modes are never fabricated',()=>{
 assert.deepEqual(JSON.parse(readFileSync(new URL('../public/data/atlas.json',import.meta.url))),data);
 assert(configurations.every(c=>c.dockingProtocol.status==='unknown'));
});
