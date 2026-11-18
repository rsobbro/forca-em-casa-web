/** Diário de atividades complementares — separado da musculação. */
export const ACTIVITY_TYPES = [
  {id:'corrida',label:'Corrida',emoji:'🏃',distance:true},
  {id:'ciclismo',label:'Bicicleta',emoji:'🚴',distance:true},
  {id:'karate',label:'Karatê',emoji:'🥋',distance:false},
  {id:'natacao',label:'Natação',emoji:'🏊',distance:true},
  {id:'caminhada',label:'Caminhada',emoji:'🚶',distance:true},
  {id:'outra',label:'Outra atividade',emoji:'🏅',distance:false}
];
export const ACTIVITY_INTENSITIES=['Leve','Moderada','Intensa'];
export const activityType=id=>ACTIVITY_TYPES.find(t=>t.id===id);
export function validISO(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return false;
  const [y,m,d]=date.split('-').map(Number);
  const stamp=new Date(y,m-1,d,12);
  return stamp.getFullYear()===y&&stamp.getMonth()===m-1&&stamp.getDate()===d;
}
export function validActivity(a){
  if(!a||typeof a!=='object'||typeof a.id!=='string'||!a.id||a.id.length>120)return false;
  if(!activityType(a.type)||!validISO(a.date))return false;
  if(!Number.isInteger(a.durationMin)||a.durationMin<1||a.durationMin>1440)return false;
  if(!(a.distanceKm===null||(typeof a.distanceKm==='number'&&Number.isFinite(a.distanceKm)&&a.distanceKm>=0&&a.distanceKm<=1000)))return false;
  if(!ACTIVITY_INTENSITIES.includes(a.intensity))return false;
  return typeof a.notes==='string'&&a.notes.length<=500;
}
export function activitySummary(activities,from,to){
  const chosen=(activities||[]).filter(a=>a.date>=from&&a.date<=to);
  return {count:chosen.length,minutes:chosen.reduce((total,a)=>total+a.durationMin,0),km:Math.round(chosen.reduce((total,a)=>total+(a.distanceKm||0),0)*100)/100,days:new Set(chosen.map(a=>a.date)).size};
}
