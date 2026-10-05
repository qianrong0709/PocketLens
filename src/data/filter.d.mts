import type {Configuration,Method} from './atlas';
export const filterDefinitions:string[][];
export function fieldValues(c:Configuration,f:string,m:Method[]):string[];
export function filterConfigurations(c:Configuration[],m:Method[],f:Record<string,string|string[]>,q:string):Configuration[];
export function toggleSelection(s:string[],id:string,max?:number):string[];
export function normalizeSelection(s:string[],c:Configuration[]):string[];
