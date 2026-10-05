import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterConfigurations} from '../src/data/filter.mjs';
import {reviewThemes} from '../src/content/reviewThemes.ts';
const {methods,configurations,sources}=JSON.parse(readFileSync(new URL('../src/data/atlas.json',import.meta.url)));
test('multi-select matches any selected input while preserving configuration intersection',()=>{
 const result=filterConfigurations(configurations,methods,{inputs:['Reference ligand','Fragment vocabulary'],task:['Fragment-based generation']},'');
 assert.deepEqual(result.map(c=>c.id).sort(),['fraggen-dihedral','fraggen-geomgnn','fraggen-geomopt']);
});
test('receptor conditions never cross configuration boundaries under multi-select',()=>{
 const result=filterConfigurations(configurations,methods,{inputs:['Reference ligand','Ligand atom count'],inputState:['Apo'],pocketTreatment:['Joint pocket adjustment']},'');
 assert.equal(result.length,2);assert(result.every(c=>c.methodId==='apo2mol'));
 assert.equal(filterConfigurations(configurations,methods,{inputs:['Reference ligand'],task:['De novo']},'VoxBind').length,0);
});
test('review map examples resolve to configurations with source trails',()=>{
 assert.equal(reviewThemes.length,3);
 for(const theme of reviewThemes)for(const e of theme.examples){const c=configurations.find(c=>c.id===e.configurationId);assert(c);assert(sources.some(s=>s.id===c.pocketTreatment.sourceId));}
 assert(reviewThemes.find(t=>t.id==='fields').boundary.includes('not verified physical-field generators'));
});
