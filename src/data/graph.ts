import {configurations,getMethod} from './atlas';
export type NodeType='method'|'paradigm'|'task'|'representation';
export type Relation='Paradigm'|'Task'|'Representation';
export type GraphNode={id:string;label:string;type:NodeType;x:number;y:number;slug?:string};
export type GraphEdge={from:string;to:string;relation:Relation};
export const RELATIONS:Relation[]=['Paradigm','Task','Representation'];
export const NODE_COLORS={method:'#245a87',paradigm:'#9483ac',task:'#c88c55',representation:'#3a968d'};
export const NODE_TYPE_LABELS={method:'Configuration',paradigm:'Generative framework',task:'Task',representation:'Pocket representation'};
export const graphNodes:GraphNode[]=[], graphEdges:GraphEdge[]=[];
const labels:Record<string,Set<string>>={paradigm:new Set(),task:new Set(),representation:new Set()};
configurations.forEach((c,i)=>{
 graphNodes.push({id:c.id,label:getMethod(c.methodId).name+' / '+c.label,type:'method',slug:c.methodId,x:.5+.29*Math.cos(i/configurations.length*6.28),y:.5+.3*Math.sin(i/configurations.length*6.28)});
 const pairs:[NodeType,string[],Relation][]=[['paradigm',[c.framework.value],'Paradigm'],['task',[c.task.value],'Task'],['representation',c.representations.value,'Representation']];
 pairs.forEach(([type,values,relation])=>values.forEach(value=>{labels[type].add(value);graphEdges.push({from:c.id,to:type+':'+value,relation});}));
});
let i=0;const count=Object.values(labels).reduce((a,v)=>a+v.size,0);
Object.entries(labels).forEach(([type,values])=>values.forEach(label=>{const angle=i++/count*6.28;graphNodes.push({id:type+':'+label,label,type:type as NodeType,x:.5+.41*Math.cos(angle),y:.5+.4*Math.sin(angle)});}));
