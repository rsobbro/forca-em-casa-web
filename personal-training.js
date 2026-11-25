import {EQUIPMENT} from './equipment-audit.js';

/** Rules-based, auditable plan selection. No unverified machine function
 * is inferred from an equipment photo. Photo is evidence; user confirms features.
 */
export const GOALS=[
 {id:'forca',label:'Força e condicionamento'},
 {id:'hipertrofia',label:'Ganho de massa muscular'},
 {id:'resistencia',label:'Resistência muscular'},
 {id:'saude',label:'Saúde e mobilidade'}
];
export const EQUIPMENT_FEATURES=Object.entries(EQUIPMENT).filter(([id])=>id!=='FLOOR').map(([id,name])=>({id,name}));
export const DAILY_SESSION_OPTIONS=[{value:1,label:'1 sessão por dia'},{value:2,label:'2 sessões curtas por dia (separadas no tempo)'}];
const validId=s=>typeof s==='string'&&/^[a-zA-Z0-9._-]{3,128}$/.test(s);
export function validSetup(setup){
 return !!setup&&setup.complete===true&&GOALS.some(g=>g.id===setup.goal)
 &&Number.isInteger(setup.daysPerWeek)&&setup.daysPerWeek>=1&&setup.daysPerWeek<=5
 &&[1,2].includes(setup.sessionsPerDay)
 &&Number.isInteger(setup.setsPerGroup)&&setup.setsPerGroup>=1&&setup.setsPerGroup<=4
 &&Array.isArray(setup.equipment)&&setup.equipment.length<=10
 &&setup.equipment.every(x=>validId(x.id)&&typeof x.brand==='string'&&x.brand.trim().length>0&&x.brand.length<=80
  &&typeof x.model==='string'&&x.model.trim().length>0&&x.model.length<=100
  &&x.photoConfirmed===true&&Array.isArray(x.features)&&x.features.length>0
  &&x.features.every(f=>f!=='FLOOR'&&Object.hasOwn(EQUIPMENT,f)))
 &&typeof setup.assessmentId==='string'&&setup.assessmentId.length>0;
}
const weekdayChoices={
 1:[1],2:[1,4],3:[1,3,5],4:[1,2,4,5],5:[1,2,3,5,6]
};
const bodyweight=[
 {id:'bw-squat',name:'Agachamento livre',equipment:'Peso corporal',sets:2,reps:'8–15',rest:75,rpe:'6–7',focus:'Composto · Pernas',tip:'Controle a amplitude e mantenha a coluna neutra.',requires:['FLOOR'],setup:'Pés afastados em posição confortável, joelhos alinhados e espaço livre.'},
 {id:'bw-pushup',name:'Flexão de braços adaptada',equipment:'Solo · peso corporal',sets:2,reps:'6–12',rest:90,rpe:'6–7',focus:'Composto · Peitoral',tip:'Apoie os joelhos no solo se necessário.',requires:['FLOOR'],setup:'Mãos no chão, alinhamento estável e amplitude confortável.'},
 {id:'bw-bridge',name:'Elevação pélvica',equipment:'Solo · peso corporal',sets:2,reps:'10–15',rest:75,rpe:'6–7',focus:'Composto · Glúteos',tip:'Evite arquear a lombar.',requires:['FLOOR'],setup:'Deitado, pés no solo e joelhos dobrados, eleve o quadril com controle.'},
 {id:'bw-bird-dog',name:'Bird dog',equipment:'Solo · peso corporal',sets:2,reps:'8–10/lado',rest:45,rpe:'6',focus:'Core · Estabilidade',tip:'Mantenha quadril e costas estáveis.',requires:['FLOOR'],setup:'Em quatro apoios, estenda braço e perna opostos lentamente.'},
 {id:'bw-calf',name:'Panturrilha em pé',equipment:'Solo · peso corporal',sets:2,reps:'12–20',rest:45,rpe:'6–7',focus:'Isolamento · Panturrilha',tip:'Sem saltos ou rebotes.',requires:['FLOOR'],setup:'Ao lado de uma parede, eleve os calcanhares lentamente.'}
];
const optionalEquipmentExercises=[
 {id:'db-row',name:'Remada unilateral com halter',equipment:'Halter próprio',sets:2,reps:'8–12/lado',rest:75,rpe:'7',focus:'Composto · Costas',tip:'Mantenha o tronco estável, sem rodar.',requires:['DUMBBELLS'],setup:'Use halter seguro, apoio estável e movimento controlado.'},
 {id:'db-squat',name:'Agachamento goblet com halter',equipment:'Halter próprio',sets:2,reps:'8–12',rest:90,rpe:'7',focus:'Composto · Quadríceps',tip:'Mantenha peso próximo do peito e coluna neutra.',requires:['DUMBBELLS'],setup:'Segure um halter com ambas as mãos e mantenha os pés apoiados.'},
 {id:'db-press',name:'Desenvolvimento com halteres',equipment:'Par de halteres',sets:2,reps:'8–12',rest:90,rpe:'7',focus:'Composto · Ombros',tip:'Comece com cargas confortáveis e evite arquear a lombar.',requires:['DUMBBELLS'],setup:'Em pé, pressione os halteres acima da cabeça com controle.'},
 {id:'kb-deadlift',name:'Levantamento terra com kettlebell',equipment:'Kettlebell próprio',sets:2,reps:'8–12',rest:90,rpe:'7',focus:'Composto · Posteriores',tip:'Use dobradiça de quadril com coluna neutra.',requires:['KETTLEBELL'],setup:'Coloque o kettlebell entre os pés e segure a alça com ambas as mãos.'},
 {id:'band-row',name:'Remada com faixa elástica',equipment:'Faixa elástica',sets:2,reps:'10–15',rest:60,rpe:'7',focus:'Composto · Costas',tip:'Não solte a faixa sob tensão.',requires:['RESISTANCE_BAND'],setup:'Sente-se no solo com a faixa posicionada sob os pés e puxe de forma controlada.'},
 {id:'db-floor-press',name:'Supino no solo com halteres',equipment:'Halteres e solo',sets:2,reps:'8–12',rest:75,rpe:'7',focus:'Composto · Peitoral',tip:'Amplitude limitada naturalmente pelo solo.',requires:['DUMBBELLS','FLOOR'],setup:'Deitado no solo, mantenha cotovelos e punhos alinhados.'},
 {id:'bench-step',name:'Subida em banco estável',equipment:'Banco próprio e estável',sets:2,reps:'8–10/lado',rest:75,rpe:'6–7',focus:'Composto · Pernas',tip:'Evite alturas excessivas e superfícies instáveis.',requires:['FLAT_BENCH'],setup:'Use apenas banco específico, firme e com suporte para carga corporal.'},
 {id:'bar-hang',name:'Suspensão assistida na barra',equipment:'Barra fixa segura',sets:2,reps:'15–30 s',rest:75,rpe:'6',focus:'Composto · Costas',tip:'Mantenha apoio dos pés se necessário.',requires:['PULLUP_BAR'],setup:'Confirme fixação e capacidade da barra antes de apoiar peso.'}
];
const focusCategory=exercise=>{
 const s=exercise.focus.toLowerCase();
 if(/peito|peitoral|tríceps|ombro|deltoide/.test(s))return 'upperPush';
 if(/costas|bíceps|braquial|posterior/.test(s)&&!/pernas|glúteos/.test(s))return 'upperPull';
 if(/perna|quadríceps|glúteos|panturrilha|posteriores/.test(s))return 'lower';
 return 'core';
};
export function personalizedProgram(base,setup){
 if(!validSetup(setup))return base;
 const allowed=new Set(['FLOOR',...setup.equipment.flatMap(e=>e.features)]);
 const library=[...base.days.flatMap(d=>d.exercises),...bodyweight,...optionalEquipmentExercises]
  .filter(ex=>ex.requires.every(key=>allowed.has(key)));
 const unique=[...new Map(library.map(ex=>[ex.name,ex])).values()];
 const byType={upperPush:[],upperPull:[],lower:[],core:[]};
 for(const ex of unique)byType[focusCategory(ex)].push(ex);
 const days=weekdayChoices[setup.daysPerWeek];
 const categories=setup.daysPerWeek>=4?
  [['upperPush','upperPull'],['lower','core'],['upperPush','upperPull'],['lower','core'],['upperPush','upperPull','lower']]:
  setup.daysPerWeek===3?
  [['upperPush','upperPull','core'],['lower','core'],['upperPush','upperPull','lower']]:
  [['upperPush','upperPull','lower','core'],['lower','upperPull','upperPush','core']];
 const splitSets=setup.goal==='resistencia'?'12–20':setup.goal==='forca'?'6–10':'8–15';
 const templates=base.days;
 const result=days.flatMap((weekday,i)=>{
  const sequence=categories[i]||categories.at(-1);
  const selected=[],names=new Set();
  for(const cat of sequence){
   const picks=byType[cat]||[];
   for(const ex of picks.slice(0,cat==='core'?1:2)){
    if(names.has(ex.name))continue;
    names.add(ex.name);selected.push(ex);
   }
  }
  for(const ex of unique){if(selected.length>=6)break;if(!names.has(ex.name)){names.add(ex.name);selected.push(ex)}}
  if(!selected.length)throw new Error('Nenhum exercício compatível foi encontrado.');
  const template=templates[i]||templates.at(-1);
  const parts=setup.sessionsPerDay===2?
   [selected.slice(0,Math.ceil(selected.length/2)),selected.slice(Math.ceil(selected.length/2),6)]:
   [selected.slice(0,6)];
  return parts.map((part,index)=>{
   const id=String.fromCharCode(65+i)+(setup.sessionsPerDay===2?index+1:'');
   return {...template,id,weekday,
    label:setup.daysPerWeek===1?'CORPO INTEIRO':'PERSONALIZADO',
    name:setup.daysPerWeek===1?'Treino de corpo inteiro '+(index+1):'Treino personalizado '+id,
    intro:'Seleção por funcionalidades confirmadas. Fotos documentam o equipamento, sem reconhecimento automático. '+(setup.sessionsPerDay===2?'Duas sessões menores, com intervalo de recuperação adequado.':''),
    exercises:part.map(ex=>({...ex,
     id:id.toLowerCase()+'-'+ex.id,
     sets:setup.setsPerGroup,reps:splitSets,rpe:setup.goal==='saude'?'6–7':'7–8'}))
   };
  });
 });
 const schedule=Object.fromEntries(result.filter((day,i)=>setup.sessionsPerDay===1||i%2===0).map(day=>[day.weekday,day.id]));
 return {...base,id:'personal-'+setup.goal+'-'+setup.daysPerWeek+'d',
  schedule,days:result,weeklyTarget:setup.daysPerWeek*setup.sessionsPerDay,goal:setup.goal};
}
