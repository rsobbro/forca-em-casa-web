import {validISO} from './activities.js';
/** Registro de avaliação corporal: não sincroniza com servidores. */
export const BODY_FIELDS=[
 {key:'weightKg',label:'Peso',unit:'kg',min:20,max:350,step:'0.1'},
 {key:'heightCm',label:'Altura',unit:'cm',min:100,max:240,step:'0.1'},
 {key:'waistCm',label:'Cintura (umbigo)',unit:'cm',min:35,max:250,step:'0.1'},
 {key:'chestCm',label:'Peitoral',unit:'cm',min:35,max:250,step:'0.1'},
 {key:'hipsCm',label:'Quadril',unit:'cm',min:35,max:250,step:'0.1'},
 {key:'armCm',label:'Braço',unit:'cm',min:10,max:100,step:'0.1'},
 {key:'thighCm',label:'Coxa',unit:'cm',min:15,max:140,step:'0.1'},
 {key:'calfCm',label:'Panturrilha',unit:'cm',min:10,max:100,step:'0.1'},
 {key:'neckCm',label:'Pescoço',unit:'cm',min:15,max:90,step:'0.1'},
 {key:'bodyFatPct',label:'Gordura corporal (opcional)',unit:'%',min:1,max:75,step:'0.1'}
];
export function parsePtNumber(value){
 if(value===null||value===undefined||String(value).trim()==='')return null;
 const normalized=String(value).trim().replace(',','.');
 if(!/^\d+(?:\.\d{1,2})?$/.test(normalized))return NaN;
 return Number(normalized);
}
export function validBodyMeasurement(x){
 if(!x||typeof x!=='object'||typeof x.id!=='string'||x.id.length<1||x.id.length>128||!validISO(x.date)||typeof x.notes!=='string'||x.notes.length>500)return false;
 let count=0;
 for(const field of BODY_FIELDS){
  const value=x[field.key];
  if(value===null){continue}
  if(typeof value!=='number'||!Number.isFinite(value)||value<field.min||value>field.max)return false;
  if(field.key!=='heightCm')count++;
 }
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
export function calculateBMI(measurements){
 const kg=compareMeasure(measurements,'weightKg').last;
 const cm=compareMeasure(measurements,'heightCm').last;
 return kg!==null&&cm!==null?Math.round(kg/(cm/100)**2*10)/10:null;
}
