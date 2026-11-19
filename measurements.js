import {validISO} from './activities.js';
/** Medidas antropométricas, com migração de campos legados sem perda de dados.
 * O comprimento da perna é a distância do quadril (ponto lateral) ao tornozelo,
 * não a circunferência da coxa ou panturrilha.
 */
export const BODY_FIELDS=[
 {key:'weightKg',label:'Peso',unit:'kg',min:20,max:350,step:'0.001',group:'basic'},
 {key:'heightCm',label:'Altura',unit:'cm',min:100,max:240,step:'0.1',group:'basic'},
 {key:'waistCm',label:'Cintura (na altura do umbigo)',unit:'cm',min:35,max:250,step:'0.1',group:'trunk'},
 {key:'chestCm',label:'Tórax em repouso',unit:'cm',min:35,max:250,step:'0.1',group:'trunk'},
 {key:'chestExpandedCm',label:'Tórax em inspiração máxima',unit:'cm',min:35,max:250,step:'0.1',group:'trunk'},
 {key:'hipsCm',label:'Quadril',unit:'cm',min:35,max:250,step:'0.1',group:'trunk'},
 {key:'neckCm',label:'Pescoço',unit:'cm',min:15,max:90,step:'0.1',group:'trunk'},
 {key:'armRightCm',label:'Braço direito (circunferência)',unit:'cm',min:10,max:100,step:'0.1',group:'right'},
 {key:'armLeftCm',label:'Braço esquerdo (circunferência)',unit:'cm',min:10,max:100,step:'0.1',group:'left'},
 {key:'legRightCm',label:'Perna direita (comprimento: quadril ao tornozelo)',unit:'cm',min:35,max:130,step:'0.1',group:'right'},
 {key:'legLeftCm',label:'Perna esquerda (comprimento: quadril ao tornozelo)',unit:'cm',min:35,max:130,step:'0.1',group:'left'},
 {key:'thighRightCm',label:'Coxa direita (circunferência)',unit:'cm',min:15,max:140,step:'0.1',group:'right'},
 {key:'thighLeftCm',label:'Coxa esquerda (circunferência)',unit:'cm',min:15,max:140,step:'0.1',group:'left'},
 {key:'calfRightCm',label:'Panturrilha direita (circunferência)',unit:'cm',min:10,max:100,step:'0.1',group:'right'},
 {key:'calfLeftCm',label:'Panturrilha esquerda (circunferência)',unit:'cm',min:10,max:100,step:'0.1',group:'left'},
 {key:'bodyFatPct',label:'Gordura corporal medida em exame (opcional)',unit:'%',min:1,max:75,step:'0.1',group:'optional'},
 {key:'armCm',label:'Braço (registro antigo)',unit:'cm',min:10,max:100,step:'0.1',group:'legacy'},
 {key:'thighCm',label:'Coxa (registro antigo)',unit:'cm',min:15,max:140,step:'0.1',group:'legacy'},
 {key:'calfCm',label:'Panturrilha (registro antigo)',unit:'cm',min:10,max:100,step:'0.1',group:'legacy'}
];
export const VISIBLE_BODY_FIELDS=BODY_FIELDS.filter(x=>x.group!=='legacy');
export const BODY_PHOTO_VIEWS=[
 {key:'front',label:'De frente',instruction:'Corpo inteiro, em pé e câmera à altura do tronco.'},
 {key:'back',label:'De costas',instruction:'Mantenha a mesma distância e postura.'},
 {key:'side',label:'De lado · braços estendidos à frente',instruction:'De perfil, ambos os braços estendidos horizontalmente à frente.'}
];
export const round1=n=>Math.round(n*10)/10;
export function parsePtNumber(value){
 if(value===null||value===undefined||String(value).trim()==='')return null;
 const normalized=String(value).trim().replace(',','.');
 if(!/^\d+(?:\.\d{1,3})?$/.test(normalized))return NaN;
 return Number(normalized);
}
export function normalizeHeightCm(value){
 return typeof value==='number'&&Number.isFinite(value)&&value>=1&&value<=2.4?Math.round(value*10000)/100:value;
}
export function validBodyMeasurement(x){
 if(!x||typeof x!=='object'||typeof x.id!=='string'||x.id.length<1||x.id.length>128||!validISO(x.date)||typeof x.notes!=='string'||x.notes.length>500)return false;
 let count=0;
 for(const field of BODY_FIELDS){
  const value=x[field.key];
  if(value===null||value===undefined)continue; // preserve records written by older versions
  if(typeof value!=='number'||!Number.isFinite(value)||value<field.min||value>field.max)return false;
  if(field.key!=='heightCm')count++;
 }
 if(typeof x.chestCm==='number'&&typeof x.chestExpandedCm==='number'&&x.chestExpandedCm<x.chestCm)return false;
 return count>0;
}
export function seriesFor(measurements,key){
 return (measurements||[]).filter(x=>typeof x[key]==='number'&&Number.isFinite(x[key])).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).map(x=>({date:x.date,value:x[key]}));
}
export function compareMeasure(measurements,key){
 const data=seriesFor(measurements,key);
 if(!data.length)return {first:null,last:null,delta:null,date:null};
 const first=data[0],last=data.at(-1);
 return {first:first.value,last:last.value,delta:data.length>1?Math.round((last.value-first.value)*100)/100:null,date:last.date};
}
export function latestValue(measurements,key){
 const arr=seriesFor(measurements,key);return arr.length?arr[arr.length-1].value:null;
}
export function calculateBMI(measurements){
 const kg=latestValue(measurements,'weightKg'),cm=latestValue(measurements,'heightCm');
 return kg!==null&&cm!==null?round1(kg/(cm/100)**2):null;
}
export function chestExcursion(measurement){
 const rest=measurement?.chestCm,deep=measurement?.chestExpandedCm;
 return typeof rest==='number'&&typeof deep==='number'&&deep>=rest?round1(deep-rest):null;
}
/** RFM de Woolcott & Bergman, 2018. Para homens: 64 - 20*(altura/cintura).
 * Estimativa populacional, não medida direta. Altura e cintura na mesma unidade.
 */
export function estimateRFM(heightCm,waistCm,sex='male'){
 if(![heightCm,waistCm].every(x=>Number.isFinite(x))||heightCm<100||heightCm>240||waistCm<35||waistCm>250)return null;
 if(!['male','female'].includes(sex))return null;
 const pct=64-20*(heightCm/waistCm)+(sex==='female'?12:0);
 return pct>0&&pct<75?round1(pct):null;
}
/** Formula circunferencial de Hodgdon/US Navy (masculina).
 * Diferença abdômen-pescoço e altura devem ser em polegadas.
 */
export function estimateNavyMale(heightCm,waistCm,neckCm){
 if(![heightCm,waistCm,neckCm].every(Number.isFinite)||heightCm<100||heightCm>240||waistCm<35||waistCm>250||neckCm<15||neckCm>90||waistCm<=neckCm)return null;
 const inch=2.54;
 const pct=86.010*Math.log10((waistCm-neckCm)/inch)-70.041*Math.log10(heightCm/inch)+36.76;
 return pct>0&&pct<75?round1(pct):null;
}
/**
 * Estimativas vinculadas a UMA avaliação. A cintura/pescoço/peso nunca
 * vêm de outra data; a altura pode ser herdada da última avaliação anterior
 * porque, em adultos, costuma ser estável no intervalo observado.
 */
export function estimateBodyFatForAssessment(record,history=[]){
 if(!record||typeof record!=='object')return {rfm:null,navy:null,fatMassKg:null,leanMassKg:null,heightSource:null};
 const candidates=(history||[]).filter(x=>x&&x.date<=record.date&&typeof x.heightCm==='number'&&Number.isFinite(x.heightCm))
   .slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
 const height=typeof record.heightCm==='number'?record.heightCm:(candidates[0]?.heightCm??null);
 const source=typeof record.heightCm==='number'?'mesma avaliação':height!==null?'avaliação anterior':null;
 const waist=typeof record.waistCm==='number'?record.waistCm:null;
 const neck=typeof record.neckCm==='number'?record.neckCm:null;
 const rfm=estimateRFM(height,waist,'male');
 const navy=estimateNavyMale(height,waist,neck);
 const kg=typeof record.weightKg==='number'?record.weightKg:null;
 const fatMassKg=rfm!==null&&kg!==null?round1(kg*rfm/100):null;
 const leanMassKg=rfm!==null&&kg!==null?round1(kg*(1-rfm/100)):null;
 return {rfm,navy,fatMassKg,leanMassKg,heightSource:source};
}
export function estimatedBodyFatSeries(measurements,method='rfm'){
 if(!['rfm','navy'].includes(method))return [];
 return (measurements||[]).filter(x=>x&&typeof x.date==='string')
  .slice().sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)))
  .map(x=>({date:x.date,value:estimateBodyFatForAssessment(x,measurements)[method]}))
  .filter(x=>x.value!==null);
}
export function estimatesFor(measurements){
 const sorted=(measurements||[]).filter(x=>x&&typeof x.date==='string').slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
 const rfmEvaluation=sorted.find(x=>estimateBodyFatForAssessment(x,measurements).rfm!==null);
 const navyEvaluation=sorted.find(x=>estimateBodyFatForAssessment(x,measurements).navy!==null);
 return {rfm:rfmEvaluation?estimateBodyFatForAssessment(rfmEvaluation,measurements).rfm:null,
 navy:navyEvaluation?estimateBodyFatForAssessment(navyEvaluation,measurements).navy:null};
}
