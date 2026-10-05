export const filterDefinitions=[['task','Task'],['representations','Pocket representation'],['inputs','Inference input'],['inputState','Input structure state'],['pocketTreatment','Pocket / flexibility treatment'],['framework','Generative framework'],['code','Code availability']];
export function fieldValues(config,field,methods){if(field==='code')return [methods.find(m=>m.id===config.methodId)?.code??'Unknown'];const v=config[field]?.value;return Array.isArray(v)?v:[v??'Unknown'];}
export function filterConfigurations(configs,methods,filters={},query=''){
 const q=query.trim().toLowerCase();return configs.filter(c=>{const m=methods.find(m=>m.id===c.methodId);const text=[m?.name,m?.title,m?.summary,c.label,c.notes,...filterDefinitions.flatMap(([f])=>fieldValues(c,f,methods))].join(' ').toLowerCase();return (!q||text.includes(q))&&filterDefinitions.every(([f])=>{const selected=Array.isArray(filters[f])?filters[f]:filters[f]?[filters[f]]:[];return selected.length===0||selected.some(v=>fieldValues(c,f,methods).includes(v));});});
}
export function toggleSelection(selected,id,max=4){return selected.includes(id)?selected.filter(x=>x!==id):selected.length<max?[...selected,id]:selected;}
export function normalizeSelection(ids,configs){return [...new Set(ids)].filter(id=>configs.some(c=>c.id===id)).slice(0,4);}
