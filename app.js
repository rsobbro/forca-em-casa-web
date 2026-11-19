import {PROGRAM,prescribedSets,findDay} from './plan.js';
import {weeklyProgress,totalProgress,mergeHistory} from './progress.js';
import {EQUIPMENT,INVENTORY_NOTICE,validateProgramEquipment} from './equipment-audit.js';
import {exerciseVideo} from './exercise-videos.js';
import {BODY_FIELDS,VISIBLE_BODY_FIELDS,BODY_PHOTO_VIEWS,parsePtNumber,normalizeHeightCm,validBodyMeasurement,seriesFor,compareMeasure,calculateBMI,chestExcursion,estimatesFor,round1} from './measurements.js';
import {PHOTO_VIEWS,validPhotoFile,saveAssessmentPhotos,getAssessmentPhotos,removeAssessmentPhotos,clearAllAssessmentPhotos,exportAssessmentPhotoBackup,validPhotoBackupEntry,importAssessmentPhotoBackup} from './assessment-photos.js';
import {getExerciseMedia,PHOTO_SOURCE} from './exercise-media.js';
import {ACTIVITY_TYPES,ACTIVITY_INTENSITIES,activityType,validActivity,validISO,activitySummary} from './activities.js';
import {parseCompletionHash,mergeCompletedSessions,getMissingScheduledSessions} from './completion-import.js';

const STORAGE_KEY='forca-em-casa-v1';
const $=sel=>document.querySelector(sel);
const app=$('#app-content');
const icons={
 dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 treinos:'<path d="m6.5 6.5 11 11m-14-7 7-7m3 17 7-7M2 9l7-7m6 20 7-7M5 12l7-7m7 7-7 7"/>',
 evolucao:'<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
 activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
 avaliacao:'<circle cx="12" cy="12" r="9"/><path d="M7 15l3-4 3 2 4-5"/>',
 configuracoes:'<path d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z"/><path d="M19.4 15.1a1.8 1.8 0 0 0 .4 2l-1.6 1.6a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.2 1.6h-2.3a1.8 1.8 0 0 0-1.2-1.6 1.8 1.8 0 0 0-2 .4L7.9 17a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1.2v-2.3a1.8 1.8 0 0 0 1.6-1.2 1.8 1.8 0 0 0-.4-2L9.5 6a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1.2-1.6H15a1.8 1.8 0 0 0 1.2 1.6 1.8 1.8 0 0 0 2-.4l1.6 1.6a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1.2v2.3a1.8 1.8 0 0 0-1.6 1.2Z" transform="translate(-1 -1) scale(.92)"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
 layers:'<path d="m12 2-9 5 9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 arrow:'<path d="M4 12h16m-7-7 7 7-7 7"/>',
 dumbbell:'<path d="m6.5 6.5 11 11M3 8l5-5m8 18 5-5M1 11l10-10m2 22 10-10"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 upload:'<path d="M12 17V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 trash:'<path d="M4 7h16m-14 0 1 14h10l1-14M9 7V4h6v3M10 11v6m4-6v6"/>',
 play:'<path d="m8 5 11 7-11 7V5Z"/>',
 shield:'<path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z"/><path d="m9 12 2 2 4-4"/>',
 pulse:'<path d="M2 12h4l3-7 5 14 3-7h5"/>',
 chevron:'<path d="m6 9 6 6 6-6"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 box:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16m-10 0v10"/>'
};
const ico=(id,size=18)=>`<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${icons[id]||icons.info}</svg>`;
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const todayISO=(date=new Date())=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
const dateAtLocal=s=>{const [y,m,d]=(s||todayISO()).split('-').map(Number);return new Date(y,m-1,d,12)};
const fmtDate=s=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(dateAtLocal(s));
const weekday=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
const nowWeekDay=()=>new Date().getDay();
const startOfWeek=(date=new Date())=>{const d=new Date(date.getFullYear(),date.getMonth(),date.getDate(),12);d.setDate(d.getDate() - (d.getDay()===0?6:d.getDay()-1));return d;};
const daysDiff=(a,b)=>Math.round((dateAtLocal(a)-dateAtLocal(b))/(1000*60*60*24));
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const initialData=()=>({version:1,profile:{startDate:todayISO()},sessions:[],activities:[],measurements:[],active:null});
function loadDB(){try{const d=JSON.parse(localStorage.getItem(STORAGE_KEY));if(d&&d.version===1&&Array.isArray(d.sessions)&&d.profile&&typeof d.profile.startDate==='string'){return {version:1,profile:{startDate:d.profile.startDate},sessions:d.sessions,activities:Array.isArray(d.activities)?d.activities.filter(validActivity):[],measurements:Array.isArray(d.measurements)?d.measurements.filter(validBodyMeasurement):[],active:d.active||null}}}catch{}return initialData()}
let db=loadDB();
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(db))}catch{toast('Não foi possível salvar. Verifique o espaço ou o modo privado do navegador.')}}
let selectedDay='A';
let expandedSession=null;
let pendingImportMode='replace';
let photoEditId=null;
let photoObjectUrls=[];
let timerEnd=0;
let timerLabel='Descanso';
let toastTimeout=null;
const weekNum=()=>Math.max(1,Math.floor(daysDiff(todayISO(),db.profile.startDate)/7)+1);
const weekInPlan=()=>clamp(weekNum(),1,8);
const currentPhase=()=>PROGRAM.phases[weekInPlan()-1];
const totalSets=s=>Object.values(s.sets||{}).flat().filter(x=>x.done).length;
const plannedSets=s=>Object.values(s.sets||{}).flat().length;
/** Nomes de exercícios em sessões anteriores à auditoria do inventário. */
const LEGACY_EXERCISE_NAMES={"a5":"Tríceps na polia alta","a6":"Flexão de braços","b2":"Remada baixa sentada","b5":"Rosca direta","c2":"Afundo estático","c3":"Extensão unilateral de joelho","d2":"Remada baixa","d6":"Tríceps na polia alta","d7":"Rosca direta","e2":"Afundo reverso"};
const recordedExerciseName=(session,exercise)=>session.exerciseNames?.[exercise.id]||LEGACY_EXERCISE_NAMES[exercise.id]||exercise.name;
const sessionReps=s=>Object.values(s.sets||{}).flat().filter(x=>x.done).reduce((n,x)=>n+(Number(x.reps)||0),0);
const sessionsThisWeek=()=>{const monday=startOfWeek();const end=new Date(monday);end.setDate(end.getDate()+6);const from=todayISO(monday),to=todayISO(end);return db.sessions.filter(s=>s.date>=from&&s.date<=to)};
const completedThisWeek=()=>new Set(sessionsThisWeek().map(s=>s.dayId)).size;
const activityThisWeek=()=>{const monday=startOfWeek();const end=new Date(monday);end.setDate(end.getDate()+6);return activitySummary(db.activities,todayISO(monday),todayISO(end));};
const dayCompletedThisWeek=id=>sessionsThisWeek().some(s=>s.dayId===id);
function toast(msg){const el=$('#toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>{el.hidden=true},3900)}
function getRoute(){const r=location.hash.replace('#','');return ['dashboard','treinos','atividades','avaliacao','evolucao','configuracoes','sessao'].includes(r)?r:'dashboard'}
function go(route){location.hash='#'+route;render();window.scrollTo({top:0,behavior:'smooth'})}
function setActiveNav(route){document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===(route==='sessao'?'treinos':route)));const labels={dashboard:'VISÃO GERAL',treinos:'MEUS TREINOS',atividades:'ATIVIDADES',avaliacao:'AVALIAÇÃO CORPORAL',evolucao:'EVOLUÇÃO',configuracoes:'CONFIGURAÇÕES',sessao:'SESSÃO ATIVA'};$('#breadcrumb-label').textContent=labels[route];}
function header(eyebrow,title,desc,button=''){return `<div class="heading-row"><div><div class="eyebrow">${escapeHTML(eyebrow)}</div><h1 class="page-title">${escapeHTML(title)}</h1><p class="page-desc">${desc}</p></div>${button}</div>`}
function metric(icon,label,value,foot){return `<div class="metric"><div class="metric-top"><span class="metric-label">${label}</span><span class="metric-icon">${ico(icon)}</span></div><div class="metric-value">${escapeHTML(value)}</div><div class="metric-foot">${foot}</div></div>`}
function schedule(){let cells='';const mon=startOfWeek();for(let i=0;i<7;i++){const date=new Date(mon);date.setDate(date.getDate()+i);const w=date.getDay();const dayId=PROGRAM.schedule[w];const day=dayId&&findDay(dayId);const done=dayId&&dayCompletedThisWeek(dayId);const activityToday=db.activities.filter(a=>a.date===todayISO(date));const today=todayISO(date)===todayISO();cells+=`<div class="week-day ${done?'completed':''} ${today?'today':''} ${!day?'rest':''}"><span>${weekday[w]}</span><b>${done?ico('check',15):(day?day.label:'DESC.')}</b><small>${pad(date.getDate())}/${pad(date.getMonth()+1)}</small>${activityToday.length?`<small class="activity-day-tag" title="${activityToday.length} atividade(s)">+${activityToday.length} atividade${activityToday.length!==1?'s':''}</small>`:''}</div>`}return `<div class="panel"><div class="section-head"><h3 class="section-title">Agenda semanal</h3><span class="section-kicker">5 dias de treino / 2 de descanso</span></div><div class="week-grid">${cells}</div></div>`}
function missedTrainingPanel(){
  const missing=getMissingScheduledSessions(PROGRAM,db.sessions,todayISO());
  if(!missing.length)return '';
  const labels=missing.map(e=>`${weekday[dateAtLocal(e.date).getDay()]} ${fmtDate(e.date)} · Treino ${e.dayId}`).join(' / ');
  return `<section class="panel" style="margin:18px 0" aria-label="Registrar treinos anteriores"><div class="section-head"><h3 class="section-title">Registrar treinos anteriores</h3><span class="section-kicker">Histórico da semana</span></div><p style="margin:12px 0">Dias programados sem registro: ${escapeHTML(labels)}.</p><p class="disclaimer">Marque somente os treinos que você realmente realizou. O sistema não cria séries, cargas nem repetições fictícias; o registro permanece neste navegador. A data inicial do ciclo será alinhada ao primeiro treino, se necessário.</p><div class="setting-actions" style="margin-top:15px">${missing.map(e=>`<button class="button outline" data-action="mark-past-day" data-day="${e.dayId}" data-date="${e.date}">${ico('check',14)} Marcar ${weekday[dateAtLocal(e.date).getDay()]} ${fmtDate(e.date)} como realizado</button>`).join('')}${missing.length>1?`<button class="button primary" data-action="mark-past-week">${ico('check',16)} Confirmar os ${missing.length} treinos</button>`:''}</div></section>`;
}
function saveManualEntries(entries){
  if(!entries.length){toast('Nenhum treino anterior pendente.');return}
  const result=mergeCompletedSessions(db.sessions,entries,db.profile.startDate);
  if(!result.added){toast('Estes treinos já estão registrados.');return}
  db.sessions=result.sessions;
  const earliest=entries.map(e=>e.date).sort()[0];
  if(earliest<db.profile.startDate)db.profile.startDate=earliest;
  save();go(getRoute()==='evolucao'?'evolucao':'dashboard');
  toast(`${result.added} ${result.added===1?'treino registrado':'treinos registrados'} com sucesso.`);
}
function completionBanner(){
  const entries=parseCompletionHash(location.hash,PROGRAM,todayISO());
  if(!entries.length)return '';
  const missing=entries.filter(e=>!db.sessions.some(s=>s.date===e.date&&s.dayId===e.dayId));
  const named=entries.map(e=>`Treino ${e.dayId} (${fmtDate(e.date)})`).join(' e ');
  return `<section class="panel" aria-label="Registro retroativo de treinos" style="margin-bottom:20px"><div class="section-head"><h3 class="section-title">Confirmar treinos realizados</h3><span class="section-kicker">Registro retroativo</span></div><p style="margin:12px 0"> ${escapeHTML(named)}.</p><p class="disclaimer">Serão registrados somente os dias informados como realizados, sem inventar séries, repetições, cargas ou duração. Dados salvos apenas neste navegador.</p><div class="setting-actions" style="margin-top:15px">${missing.length?`<button class="button primary" data-action="apply-history-link">${ico('check')} Confirmar ${missing.length} ${missing.length===1?'treino':'treinos'}</button>`:`<button class="button primary" data-action="cancel-history-link">Treinos já registrados · Ver painel</button>`}<button class="button outline" data-action="cancel-history-link">Voltar</button></div></section>`;
}
function dashboard(){const day=findDay(PROGRAM.schedule[nowWeekDay()]);const week=weekNum();const phase=currentPhase();const isDone=day&&dayCompletedThisWeek(day.id);const total=db.sessions.reduce((s,x)=>s+totalSets(x),0);const last=db.sessions[0];const dayMsg=day?`${day.label} · ${day.name}`:'Recuperação e mobilidade';const cta=db.active?`<button class="button primary" data-action="resume">${ico('play')} Continuar sessão ${db.active.dayId} ${ico('arrow')}</button>`:day?`<button class="button primary" data-action="start" data-day="${day.id}">${ico('play')} ${isDone?'Novo treino':'Iniciar treino'} ${day.id} ${ico('arrow')}</button>`:`<button class="button primary" data-action="view-plans">${ico('layers')} Ver meus treinos ${ico('arrow')}</button>`;
return `${header('PAINEL DE DESEMPENHO','Seu treino, sua evolução.','Um plano de 8 semanas, preparado para seus equipamentos e sua rotina.')}${completionBanner()}
<section class="hero"><div class="hero-content"><div class="eyebrow">${day?'TREINO PROGRAMADO PARA HOJE':'HOJE É DIA DE RECUPERAÇÃO'}</div><h2>${day?`Hora de ficar <span>mais forte.</span>`:`Recupere para <span>evoluir.</span>`}</h2><p>${escapeHTML(dayMsg)}. ${day?'Priorize execução controlada, técnica e progressão gradual.':'Caminhada leve e mobilidade são opcionais. O descanso faz parte do treinamento.'}</p><div class="hero-actions">${cta}<span class="subtle">${escapeHTML(phase.label)} · RPE ${phase.rpe}</span></div></div><span class="hero-mark">F.</span></section>${missedTrainingPanel()}
<div class="body-home"><div><span class="active-label">AVALIAÇÃO CORPORAL</span><h3>Registre peso e medidas para acompanhar sua evolução</h3><p>${db.measurements.length?`Último registro: ${fmtDate(db.measurements.slice().sort((a,b)=>b.date.localeCompare(a.date))[0].date)} · ${db.measurements.length} avaliação(ões)`:'Nenhuma avaliação salva neste dispositivo.'}</p></div><button class="button outline" data-action="view-assessment">${ico('avaliacao',16)} Avaliar corpo</button></div>
<div class="activity-home"><div><span class="active-label">ATIVIDADES COMPLEMENTARES</span><h3>Corrida, bike, karatê ou natação no seu dia</h3><p>Registre suas atividades, mesmo nos dias em que faz musculação.</p><small>${activityThisWeek().count} atividade(s) · ${activityThisWeek().minutes} minutos nesta semana</small></div><button class="button outline" data-action="view-activities">${ico('activity',17)} Registrar atividade</button></div>
<div class="grid4">${metric('calendar','Treinos na semana',`${completedThisWeek()}/5`,'Dias distintos concluídos')}${metric('check','Sessões concluídas',db.sessions.length,'Histórico salvo neste dispositivo')}${metric('layers','Séries realizadas',total,'Total em todas as sessões')}${metric('target','Semana do ciclo',week>8?'8+':`${week}/8`,week>8?'Ciclo inicial encerrado':phase.label)}</div>
<div class="section grid2"><div>${schedule()}</div><div class="stack"><div class="phase"><div class="phase-top"><span class="mini-label">PERIODIZAÇÃO</span><span class="phase-pill">SEMANA ${week>8?'8+':week}</span></div><strong>${escapeHTML(phase.label)}</strong><p>${escapeHTML(phase.detail)}</p><div class="progress-track"><div class="progress-fill" style="width:${clamp(week/8*100,0,100)}%"></div></div><div class="phase-foot"><span>Início: ${fmtDate(db.profile.startDate)}</span><span>${Math.min(8,week)} de 8 semanas</span></div></div><div class="tip-box"><div class="tip-heading">${ico('info',17)} Próximo passo</div><p>${last?`Último treino: ${escapeHTML(findDay(last.dayId)?.label||last.dayId)}, em ${fmtDate(last.date)}. Foram registradas ${totalSets(last)} séries.`:'Nenhuma sessão registrada ainda. Abra o treino do dia e acompanhe cada série com a carga ou cor do elástico utilizado.'}</p></div></div></div>
<div class="section"><div class="section-head"><h3 class="section-title">Sua divisão de treino</h3><button class="button small outline" data-action="view-plans">Ver ficha completa ${ico('arrow',14)}</button></div><div class="grid2">${PROGRAM.days.map(d=>`<button class="micro-card" style="text-align:left;cursor:pointer;color:inherit" data-action="choose-day" data-day="${d.id}"><span class="active-label">TREINO ${d.id} · ${d.label}</span><strong>${escapeHTML(d.name)}</strong><small>${d.exercises.length} exercícios · ${d.duration}</small></button>`).join('')}</div></div><p class="disclaimer">Orientação geral: a ficha não substitui avaliação profissional presencial. Se sentir dor aguda, tontura ou desconforto torácico, interrompa a sessão.</p>`}
function exercisePhotos(ex,compact=false){
 const media=getExerciseMedia(ex.id);
 const video=exerciseVideo(ex);
 const url=escapeHTML(video.url);
 const photos=media?media.urls.map((img,i)=>`<figure class="photo-frame"><a href="${escapeHTML(img)}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar ${escapeHTML(ex.name)}: ${i?'final':'inicial'}"><img src="${escapeHTML(img)}" alt="${escapeHTML(ex.name)}: ${i?'posição final':'posição inicial'}" loading="lazy" decoding="async" width="260" height="160"></a><figcaption>${i?'Posição final':'Posição inicial'}</figcaption></figure>`).join(''):'';
 const notice=media?(media.sameEquipment?'Referência de execução; confira tensão e posicionamento do seu equipamento.':'Foto ilustrativa de um movimento equivalente. O aparelho mostrado pode ser diferente do equipamento indicado na ficha.'):'Não existe foto verificada para esta variação.';
 const req=(ex.requires||[]).map(key=>EQUIPMENT[key]).filter(Boolean).join(' + ');
 const videoLabel=video.verified?'▶ Ver vídeo no YouTube':'Buscar vídeo no YouTube';
 const status=video.verified?'Vídeo identificado com referência do movimento':'Nenhum vídeo específico verificado para esta variante';
 const body=`<div class="exercise-photo-guide">
  <div class="exercise-equipment-guide"><strong>Equipamento disponível:</strong> ${escapeHTML(req)}<p><strong>Como preparar:</strong> ${escapeHTML(ex.setup||'Confira as orientações do equipamento.')}</p></div>
  ${photos?`<div class="photo-pair">${photos}</div><p>${escapeHTML(notice)} <a href="${PHOTO_SOURCE}" target="_blank" rel="noopener noreferrer">Fotos: free-exercise-db (Unlicense)</a>.</p>`:`<p>${escapeHTML(notice)}</p>`}
  <div class="exercise-video"><a class="button small outline" href="${url}" target="_blank" rel="noopener noreferrer">${videoLabel}</a><div><strong>${escapeHTML(status)}</strong><small>${escapeHTML(video.note)}</small></div></div>
 </div>`;
 return compact?`<details class="exercise-photo-toggle"><summary>${ico('info',14)} Fotos, montagem e vídeo do exercício</summary>${body}</details>`:body;
}
function trainingList(day){const week=weekInPlan();return `<div class="day-panel"><div class="day-hero"><div><span class="active-label">TREINO ${day.id} · ${day.label}</span><h2>${escapeHTML(day.name)}</h2><p>${escapeHTML(day.intro)}</p><div class="day-meta" style="margin-top:10px">${day.exercises.length} exercícios · ${day.duration} · RPE previsto ${currentPhase().rpe}</div></div><button class="button primary" data-action="start" data-day="${day.id}">${ico('play')} Iniciar sessão</button></div><div class="exercise-list">${day.exercises.map((ex,i)=>`<div class="exercise"><div class="exercise-top"><span class="exercise-number">${pad(i+1)}</span><div class="exercise-main"><h3>${escapeHTML(ex.name)}</h3><p>${escapeHTML(ex.focus)}</p></div><div class="exercise-prescription"><div><b>${prescribedSets(ex.sets,week)} × ${escapeHTML(ex.reps)}</b><small>SÉRIES × REPS</small></div><div><b>${ex.rest}s</b><small>DESCANSO</small></div><div><b>RPE ${escapeHTML(week<=2?currentPhase().rpe:ex.rpe)}</b><small>ESFORÇO</small></div></div></div><div class="exercise-details"><div><span class="equipment-tag">${ico('box',11)} ${escapeHTML(ex.equipment)}</span><div>${ico('info',12)} ${escapeHTML(ex.tip)}</div></div></div>${exercisePhotos(ex)}</div>`).join('')}</div></div>`}
function treinos(){const day=findDay(selectedDay)||PROGRAM.days[0];return `${header('PLANO PERSONALIZADO','Meus treinos','Treinos revisados para WCT 80 kg, extensores TOPSAND e minibands Alegria. Cada exercício informa como preparar o equipamento e disponibiliza fotos e referências de vídeo.',db.active?`<button class="button primary" data-action="resume">${ico('play')} Continuar sessão</button>`:'')}
<div class="inventory-notice"><strong>Inventário verificado:</strong> ${escapeHTML(INVENTORY_NOTICE)}<p>Não adicione pesos, polias ou adaptações não previstas no manual WCT. As referências de vídeo e foto podem mostrar variações de equipamento.</p></div><div class="day-tabs" role="tablist" aria-label="Escolha o treino">${PROGRAM.days.map(d=>`<button class="day-tab ${d.id===day.id?'active':''}" data-action="choose-day" data-day="${d.id}" role="tab" aria-selected="${d.id===day.id}"><b>${d.id}</b>${d.label}</button>`).join('')}</div>${trainingList(day)}<div class="section tip-box"><div class="tip-heading">${ico('info')} Regras de execução</div><p>Faça 5–8 minutos de aquecimento geral e 1–2 séries preparatórias do primeiro exercício. Série efetiva não exige falha: mantenha as repetições em reserva indicadas pelo RPE. Nos exercícios unilaterais, a meta de repetições se aplica a cada lado.</p></div>`}
function makeSession(day){const week=weekInPlan();const sets={};for(const ex of day.exercises){sets[ex.id]=Array.from({length:prescribedSets(ex.sets,week)},()=>({reps:'',load:'',rpe:week<=2?'7':'8',done:false}));}return {id:crypto.randomUUID?.()||`s-${Date.now()}`,dayId:day.id,date:todayISO(),startedAt:new Date().toISOString(),week,sets,exerciseNames:Object.fromEntries(day.exercises.map(ex=>[ex.id,ex.name]))}}
function startSession(dayId){const day=findDay(dayId);if(!day)return;if(db.active){if(db.active.dayId===dayId){go('sessao');return}if(!confirm(`Existe uma sessão ${db.active.dayId} em andamento. Descartá-la e iniciar o treino ${dayId}?`))return;}db.active=makeSession(day);save();go('sessao');toast(`Treino ${dayId} iniciado. Bom treino!`)}
function renderSession(){if(!db.active)return `${header('SESSÃO','Nenhum treino em andamento','Abra Meus treinos para iniciar uma nova sessão.',`<button class="button primary" data-action="view-plans">Ver treinos</button>`)}`;const s=db.active;const day=findDay(s.dayId);if(!day)return '<p>Não foi possível localizar este treino.</p>';const completed=totalSets(s),planned=plannedSets(s),pct=planned?Math.round(completed/planned*100):0;return `${header('SESSÃO ATIVA',`Treino ${day.id} · ${day.label}`,'Digite o número de repetições de cada série antes de concluir. Os textos cinza são apenas exemplos e não representam dados salvos.')}
<div class="session-entry-help"><strong>Como registrar:</strong> digite as repetições realmente executadas, ajuste carga/faixa e RPE, depois toque em <b>Feito</b>. Os números cinza dentro dos campos são apenas exemplos.</div>
<div class="workout-banner"><div><span class="active-label">EM ANDAMENTO · SEMANA ${s.week}</span><h2>${escapeHTML(day.name)}</h2><p>${fmtDate(s.date)} · ${day.exercises.length} exercícios</p></div><div class="workout-progress"><b data-workout-progress-pct>${pct}%</b><div class="progress-track"><div data-workout-progress-fill class="progress-fill" style="width:${pct}%"></div></div><p style="margin-top:8px" data-workout-progress-count>${completed}/${planned} séries</p></div></div>
${day.exercises.map((ex,index)=>`<div class="session-exercise"><div class="session-exercise-head"><div><span class="mini-label">${pad(index+1)} / ${pad(day.exercises.length)} · ${escapeHTML(ex.focus)}</span><h3>${escapeHTML(ex.name)}</h3><p>${escapeHTML(ex.equipment)} · ${escapeHTML(ex.reps)} reps · RPE ${s.week<=2?currentPhase().rpe:ex.rpe}</p></div><button class="button small outline" data-action="timer" data-rest="${ex.rest}" data-ex="${escapeHTML(ex.name)}">${ico('clock',14)} ${ex.rest}s</button></div>${exercisePhotos(ex,true)}<div style="overflow-x:auto"><table class="set-table"><thead><tr><th>Série</th><th style="min-width:80px">Reps / s</th><th style="min-width:115px">Carga / faixa</th><th style="min-width:67px">RPE</th><th>Feito</th></tr></thead><tbody>${s.sets[ex.id].map((set,i)=>`<tr class="${set.done?'checked':''}"><td class="set-n">${i+1}</td><td><input aria-label="Repetições da série ${i+1} em ${escapeHTML(ex.name)}" type="number" inputmode="numeric" min="0" max="999" step="1" value="${escapeHTML(set.reps)}" data-edit="reps" data-exid="${ex.id}" data-index="${i}" placeholder="Digite reps" aria-required="true" title="Digite as repetições realizadas; este campo é obrigatório para concluir a série" /></td><td><input aria-label="Carga ou faixa da série ${i+1} em ${escapeHTML(ex.name)}" maxlength="40" value="${escapeHTML(set.load)}" data-edit="load" data-exid="${ex.id}" data-index="${i}" placeholder="Ex.: 20 kg / azul" title="Registre a carga ou a resistência do elástico utilizado" /></td><td><select aria-label="RPE da série ${i+1}" data-edit="rpe" data-exid="${ex.id}" data-index="${i}">${[6,7,8,9,10].map(n=>`<option value="${n}" ${String(set.rpe)===String(n)?'selected':''}>${n}</option>`).join('')}</select></td><td><button class="done-btn ${set.done?'checked':''}" aria-label="${set.done?'Desmarcar':'Concluir'} série ${i+1}" aria-pressed="${Boolean(set.done)}" data-action="set-done" data-exid="${ex.id}" data-index="${i}">${set.done?ico('check',17):'○'}</button></td></tr>`).join('')}</tbody></table></div><div class="set-feedback" data-set-feedback="${ex.id}" role="alert" hidden></div><div class="set-tip">${ico('info',14)} <span>${escapeHTML(ex.tip)}</span></div></div>`).join('')}
<div class="workout-bottom"><button class="button danger" data-action="discard">${ico('trash')} Descartar sessão</button><small>O registro só entra no histórico após finalizar.</small><button class="button primary" data-action="finish" data-finish-button>${ico('check')} Finalizar treino (${completed}/${planned})</button></div>`}
function finish(){const s=db.active;if(!s)return;const finished=totalSets(s);if(!finished){toast('Registre pelo menos uma série antes de finalizar.');return;}if(finished<plannedSets(s)&&!confirm(`Você concluiu ${finished} de ${plannedSets(s)} séries. Finalizar esta sessão parcial?`))return;s.finishedAt=new Date().toISOString();s.durationMin=Math.max(1,Math.round((Date.now()-Date.parse(s.startedAt))/60000));db.sessions.unshift(s);db.active=null;save();timerEnd=0;go('evolucao');toast(`Treino ${s.dayId} salvo: ${finished} séries concluídas.`)}
function periodChart(mode='strength'){
 const today=new Date();const weeks=[];
 for(let i=7;i>=0;i--){
  const monday=startOfWeek(today);monday.setDate(monday.getDate()-i*7);
  const sunday=new Date(monday);sunday.setDate(sunday.getDate()+6);
  const stats=weeklyProgress(db.sessions,db.activities,todayISO(monday),todayISO(sunday));
  weeks.push({value:mode==='strength'?stats.strengthDays:stats.otherActivities,label:`${pad(monday.getDate())}/${pad(monday.getMonth()+1)}`});
 }
 const max=mode==='strength'?5:Math.max(1,...weeks.map(w=>w.value));
 const title=mode==='strength'?'Musculação':'Atividades complementares';
 return `<div class="bar-chart" role="img" aria-label="${title} nas últimas 8 semanas: ${weeks.map(w=>`${w.label}: ${w.value}`).join('; ')}">${weeks.map(w=>`<div class="bar-col"><b>${w.value}</b><div class="bar-wrap"><div class="bar ${mode==='strength'?'':'bar-extra'}" style="height:${Math.min(100,w.value/max*100)}%"></div></div><small>${w.label}</small></div>`).join('')}</div><p class="disclaimer">${mode==='strength'?'Dias da divisão A–E concluídos, até 5 por semana. Registros manuais contam como treino concluído, mas não geram séries fictícias.':'Cada corrida, pedalada, aula de karatê, natação ou outra atividade registrada conta separadamente.'}</p>`;
}
function sessionDetail(s){if(s.manual)return '<p>Treino concluído por informação do usuário. Não foram informados exercícios, séries, cargas ou repetições.</p>';const day=findDay(s.dayId);if(!day)return '<p>Treino não encontrado.</p>';return day.exercises.map(ex=>{const performed=(s.sets?.[ex.id]||[]).filter(x=>x.done);if(!performed.length)return '';return `<h4>${escapeHTML(recordedExerciseName(s,ex))}</h4><div>${performed.map(x=>`${escapeHTML(x.reps)} reps${x.load?` · ${escapeHTML(x.load)}`:''} · RPE ${escapeHTML(x.rpe)}`).join('<br>')}</div>`}).join('')}

function deviceHistoryNotice(){
 const hasStrength=db.sessions.length>0,hasActivities=db.activities.length>0;
 return `<section class="panel evolution-data-notice" aria-label="Origem dos dados"><div class="section-head"><h3 class="section-title">Histórico deste dispositivo</h3><span class="section-kicker">Armazenamento local</span></div>
 <p>${hasStrength||hasActivities?'Os números abaixo representam os registros guardados neste navegador.':'Este navegador não possui registros de musculação nem de atividades adicionais. Isso não significa que os treinos não ocorreram: eles podem estar em outro aparelho, perfil ou navegador.'}</p>
 <p class="disclaimer">O GitHub Pages publica somente o aplicativo. Não sincroniza seu histórico automaticamente entre celular e computador. Para trazer dados de outro dispositivo, exporte um backup JSON nele e importe aqui pela opção <strong>Mesclar backup</strong>.</p>
 <div class="setting-actions"><button class="button outline" data-action="import-merge">${ico('upload',16)} Mesclar backup JSON</button><button class="button outline" data-action="export-json">${ico('download',16)} Baixar backup deste dispositivo</button></div></section>`;
}
function evolucao(){
 const total=totalProgress(db.sessions,db.activities);
 const monday=startOfWeek(),sunday=new Date(monday);sunday.setDate(sunday.getDate()+6);
 const week=weeklyProgress(db.sessions,db.activities,todayISO(monday),todayISO(sunday));
 return `${header('DADOS DE TREINO','Sua evolução','Musculação e atividades complementares contabilizadas separadamente, com histórico privado neste navegador.',`<button class="button outline" data-action="export-csv">${ico('download')} Exportar CSV</button>`)}
 ${deviceHistoryNotice()}
 <div class="evolution-group-title"><h3>Musculação</h3><small>Treinos concluídos · séries informadas separadamente</small></div>
 <div class="grid4">${metric('check','Sessões de força',total.strengthSessions,'Concluídas neste navegador')}${metric('layers','Séries efetivas',total.recordedSets,'Não inclui conclusão manual sem séries')}${metric('pulse','Repetições registradas',total.recordedReps,'Somente séries preenchidas')}${metric('calendar','Semana atual',`${week.strengthDays}/5`,'Divisões A–E nesta semana')}</div>
 ${total.manualSessions?`<p class="disclaimer manual-count-notice">${total.manualSessions} treino(s) foram marcados como realizados sem detalhamento: contam na frequência e nas sessões, mas não acrescentam séries ou repetições.</p>`:''}
 <div class="evolution-group-title"><h3>Outras atividades</h3><small>Corrida, bike, karatê, natação e demais atividades</small></div>
 <div class="grid4">${metric('activity','Atividades no histórico',total.otherActivities,'Todas as atividades adicionais')}${metric('clock','Minutos no histórico',total.otherMinutes,'Total informado')}${metric('calendar','Atividades na semana',week.otherActivities,'Além da musculação')}${metric('target','Dias ativos na semana',week.totalActiveDays,'Dias únicos de força ou atividade')}</div>
 <div class="activity-evolution-summary"><span>Registre a musculação e outras atividades no mesmo dia sem duplicar seus indicadores.</span><div class="evolution-links"><button class="button small outline" data-action="view-activities">${ico('activity',14)} Diário de atividades</button><button class="button small outline" data-action="view-assessment">${ico('avaliacao',14)} Avaliação corporal</button></div></div>
 ${missedTrainingPanel()}
 <div class="section grid2"><div class="panel"><div class="section-head"><h3 class="section-title">Musculação · últimas 8 semanas</h3></div>${periodChart('strength')}</div><div class="panel"><div class="section-head"><h3 class="section-title">Outras atividades · últimas 8 semanas</h3></div>${periodChart('activities')}</div></div>
 <div class="section tip-box"><div class="tip-heading">${ico('target')} Progressão de carga</div><p>Quando atingir o limite superior das repetições com boa técnica e RPE adequado, progrida a resistência conforme sua recuperação. Um treino marcado retroativamente sem séries não acrescenta carga ou repetições à evolução.</p></div>
 <div class="section"><div class="section-head"><h3 class="section-title">Histórico de sessões</h3><span class="section-kicker">${total.strengthSessions} ${total.strengthSessions===1?'registro':'registros'}</span></div>${!total.strengthSessions?`<div class="empty">${ico('calendar',34)}<h3>Sem sessões de força neste navegador</h3><p>Se já treinou, marque os dias anteriores no painel acima ou mescle um backup do outro dispositivo. Nenhum registro será criado automaticamente.</p><button class="button primary" data-action="view-plans">${ico('arrow')} Ver meus treinos</button></div>`:`<div class="history-list">${db.sessions.map(s=>`<div><div class="history-entry"><div><span class="active-label">TREINO ${escapeHTML(s.dayId)} · ${escapeHTML(findDay(s.dayId)?.label||'')}</span><h3>${escapeHTML(findDay(s.dayId)?.name||'Treino')} · ${fmtDate(s.date)}</h3><p>${s.manual?'Treino realizado · sem séries, cargas e duração informadas':`${totalSets(s)} séries · ${sessionReps(s)} repetições · ${Number(s.durationMin)||0} min registrados`}</p></div><div class="history-actions"><button class="button small outline" data-action="expand" data-id="${escapeHTML(s.id)}">${expandedSession===s.id?'Ocultar':'Detalhes'} ${ico('chevron',13)}</button><button class="button small danger icon-btn" title="Excluir este treino" aria-label="Excluir treino" data-action="delete-session" data-id="${escapeHTML(s.id)}">${ico('trash',14)}</button></div></div>${expandedSession===s.id?`<div class="history-detail">${sessionDetail(s)}</div>`:''}</div>`).join('')}</div>`}</div>`;
}
function activitiesPage(){
 const monday=startOfWeek(),sunday=new Date(monday);sunday.setDate(sunday.getDate()+6);
 const week=activitySummary(db.activities,todayISO(monday),todayISO(sunday));
 const list=[...db.activities].sort((a,b)=>b.date.localeCompare(a.date));
 return `${header('DIÁRIO DE MOVIMENTO','Outras atividades','Corrida, bicicleta, karatê, natação e outras atividades. Registros independentes da musculação.')}
 <div class="grid4">${metric('activity','Atividades na semana',week.count,'Além da musculação')}${metric('clock','Minutos ativos',week.minutes,'Total na semana')}${metric('target','Distância registrada',week.km.toLocaleString('pt-BR')+' km','Quando informada')}${metric('calendar','Dias com atividade',week.days,'Nesta semana')}</div>
 <section class="panel section" aria-label="Registrar atividade"><div class="section-head"><h3 class="section-title">Registrar atividade</h3><span class="section-kicker">Pode ser no mesmo dia da musculação</span></div>
 <div class="activity-type-grid">${ACTIVITY_TYPES.map(t=>`<div class="activity-type-chip"><span>${t.emoji}</span><span>${escapeHTML(t.label)}</span></div>`).join('')}</div>
 <div class="activity-form-grid">
  <div class="form-field"><label for="activity-kind">Atividade</label><select id="activity-kind">${ACTIVITY_TYPES.map(t=>`<option value="${t.id}">${t.emoji} ${escapeHTML(t.label)}</option>`).join('')}</select></div>
  <div class="form-field"><label for="activity-date">Data</label><input id="activity-date" type="date" value="${todayISO()}" max="${todayISO()}" /></div>
  <div class="form-field"><label for="activity-minutes">Duração (minutos)</label><input id="activity-minutes" type="number" min="1" max="1440" step="1" inputmode="numeric" placeholder="Ex.: 45" /></div>
  <div class="form-field"><label for="activity-distance">Distância (km, opcional)</label><input id="activity-distance" type="text" inputmode="decimal" maxlength="12" placeholder="Ex.: 5,2" /></div>
  <div class="form-field"><label for="activity-intensity">Intensidade percebida</label><select id="activity-intensity">${ACTIVITY_INTENSITIES.map(x=>`<option value="${x}" ${x==='Moderada'?'selected':''}>${x}</option>`).join('')}</select></div>
  <div class="form-field"><label for="activity-notes">Observações</label><input id="activity-notes" maxlength="500" placeholder="Ex.: aula de karatê ou corrida leve" /></div>
 </div>
 <div class="setting-actions"><button type="button" class="button primary" data-action="save-activity">${ico('check')} Salvar atividade</button></div><p class="disclaimer">Distância e duração são inseridas por você. Não estimamos calorias. Histórico privado neste navegador, incluído nos backups JSON.</p></section>
 <section class="section"><div class="section-head"><h3 class="section-title">Histórico de atividades</h3><span class="section-kicker">${list.length} registro(s)</span></div>${list.length?`<div class="history-list">${list.map(a=>{const t=activityType(a.type);return `<div class="history-entry activity-entry"><div class="activity-entry-info"><span class="activity-entry-icon">${t.emoji}</span><div><span class="active-label">${escapeHTML(t.label)} · ${fmtDate(a.date)}</span><h3>${a.durationMin} minutos${a.distanceKm!==null?' · '+a.distanceKm.toLocaleString('pt-BR')+' km':''}</h3><p>Intensidade: ${escapeHTML(a.intensity)}${a.notes?' · '+escapeHTML(a.notes):''}</p></div></div><button class="button small danger icon-btn" title="Excluir atividade" aria-label="Excluir atividade" data-action="delete-activity" data-id="${escapeHTML(a.id)}">${ico('trash',14)}</button></div>`}).join('')}</div>`:`<div class="empty"><h3>Nenhuma atividade registrada.</h3><p>Preencha o formulário acima para iniciar o diário.</p></div>`}</section>`;
}
function saveActivity(){
 const type=$('#activity-kind')?.value,date=$('#activity-date')?.value;
 const minutes=Number($('#activity-minutes')?.value);
 const distanceText=String($('#activity-distance')?.value||'').trim().replace(',','.');
 const distanceKm=distanceText===''?null:Number(distanceText);
 const intensity=$('#activity-intensity')?.value,notes=String($('#activity-notes')?.value||'').trim();
 if(!validISO(date)||date>todayISO()){toast('Data inválida ou no futuro.');return}
 if(!Number.isInteger(minutes)||minutes<1||minutes>1440){toast('Duração deve estar entre 1 e 1440 minutos.');return}
 if(distanceText!==''&&!/^\d+(?:\.\d{1,3})?$/.test(distanceText)){toast('Use distância em km, por exemplo 5,2.');return}
 const id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`atividade-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const record={id,type,date,durationMin:minutes,distanceKm,intensity,notes};
 if(!validActivity(record)){toast('Verifique os campos da atividade.');return}
 db.activities.push(record);save();go('atividades');toast('Atividade registrada com sucesso.');
}
function bodyTrend(key,title,unit){
 const points=seriesFor(db.measurements,key);
 if(points.length<2)return `<div class="panel body-trend"><h3>${escapeHTML(title)}</h3><p class="disclaimer">O gráfico aparecerá após pelo menos duas medições de ${escapeHTML(title.toLowerCase())}.</p></div>`;
 const values=points.map(p=>p.value),min=Math.min(...values),max=Math.max(...values),spread=Math.max(max-min,0.5);
 const n=points.length;
 const coords=points.map((p,i)=>[25+i*310/(n-1),112-(p.value-min)/spread*76]);
 const d=coords.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(1)).join(',')).join(' ');
 return `<div class="panel body-trend"><div class="section-head"><h3 class="section-title">${escapeHTML(title)}</h3><span class="section-kicker">${points.length} medições</span></div><svg viewBox="0 0 360 142" role="img" aria-label="Evolução de ${escapeHTML(title)}: de ${points[0].value} a ${points.at(-1).value} ${escapeHTML(unit)}"><path d="M25 112H335" stroke="#39474c" fill="none"/><path d="${d}" stroke="#c8f86c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>${coords.map(([x,y])=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#c8f86c"/>`).join('')}</svg><div class="body-trend-foot"><span>${fmtDate(points[0].date)} · ${points[0].value.toLocaleString('pt-BR')} ${escapeHTML(unit)}</span><span>${fmtDate(points.at(-1).date)} · ${points.at(-1).value.toLocaleString('pt-BR')} ${escapeHTML(unit)}</span></div></div>`;
}
function bodyComparison(key,title,unit){
 const m=compareMeasure(db.measurements,key);
 const value=m.last===null?'—':m.last.toLocaleString('pt-BR')+' '+unit;
 const delta=m.delta===null?'Sem comparação ainda':(m.delta>0?'+':'')+m.delta.toLocaleString('pt-BR')+' '+unit+' desde o primeiro registro';
 return `<div class="metric"><div class="metric-label">${escapeHTML(title)}</div><div class="metric-value body-value">${escapeHTML(value)}</div><div class="metric-foot">${escapeHTML(delta)}</div></div>`;
}

function measurementPairRow(title,rightKey,leftKey,unit='cm'){
 const right=compareMeasure(db.measurements,rightKey).last;
 const left=compareMeasure(db.measurements,leftKey).last;
 const delta=right!==null&&left!==null?round1(right-left):null;
 const show=x=>x===null?'—':x.toLocaleString('pt-BR')+' '+unit;
 return `<tr><th scope="row">${escapeHTML(title)}</th><td>${show(right)}</td><td>${show(left)}</td><td>${delta===null?'—':(delta>0?'+':'')+delta.toLocaleString('pt-BR')+' '+unit}</td></tr>`;
}
function bodyPhotoInputs(prefix='body-photo'){
 return `<div class="body-photo-slots">${BODY_PHOTO_VIEWS.map(p=>`<div class="body-photo-slot"><label for="${prefix}-${p.key}"><strong>${escapeHTML(p.label)}</strong><small>${escapeHTML(p.instruction)}</small></label><input id="${prefix}-${p.key}" data-photo-input="${p.key}" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Foto ${escapeHTML(p.label)}"/><div class="body-photo-preview" id="${prefix}-${p.key}-preview" hidden></div></div>`).join('')}</div>`;
}
function collectBodyPhotos(prefix='body-photo'){
 const files={};
 for(const view of PHOTO_VIEWS){
  const file=$('#'+prefix+'-'+view)?.files?.[0];
  if(!file)continue;
  if(!validPhotoFile(file)){toast('Foto '+view+': use JPEG, PNG ou WebP de até 12 MB.');return null}
  files[view]=file;
 }
 return files;
}
function photoGallery(id){
 return `<div class="body-gallery" data-photo-gallery="${escapeHTML(id)}"><small>Carregando fotos privadas deste navegador...</small></div>`;
}
async function renderBodyPhotos(){
 for(const url of photoObjectUrls){try{URL.revokeObjectURL(url)}catch{}}
 photoObjectUrls=[];
 const galleries=app.querySelectorAll?.('[data-photo-gallery]')||[];
 for(const gallery of galleries){
  const id=gallery.getAttribute('data-photo-gallery');
  try{
   const photos=await getAssessmentPhotos(id);
   if(gallery.isConnected===false)continue;
   gallery.innerHTML=BODY_PHOTO_VIEWS.map(view=>{
    const blob=photos[view.key];
    if(!blob)return `<div class="body-gallery-slot"><strong>${escapeHTML(view.label)}</strong><small>Foto ainda não registrada</small></div>`;
    const url=URL.createObjectURL(blob);photoObjectUrls.push(url);
    return `<div class="body-gallery-slot"><strong>${escapeHTML(view.label)}</strong><a href="${url}" target="_blank" rel="noopener noreferrer"><img alt="Avaliação ${escapeHTML(view.label)}" src="${url}" loading="lazy"></a></div>`;
   }).join('');
  }catch{
   gallery.textContent='Fotos não disponíveis neste navegador. Os dados de medidas continuam preservados.';
  }
 }
}
function photoEditor(id){
 return `<div class="body-photo-editor"><h4>Adicionar ou substituir fotos desta avaliação</h4>${bodyPhotoInputs('photo-edit')}<div class="setting-actions"><button class="button primary" data-action="save-assessment-photos" data-id="${escapeHTML(id)}">Salvar fotos</button><button class="button outline" data-action="cancel-photo-editor">Cancelar</button></div></div>`;
}
function assessmentPage(){
 const values=[...db.measurements].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
 const previousHeight=compareMeasure(db.measurements,'heightCm').last;
 const bmi=calculateBMI(db.measurements);
 const estimated=estimatesFor(db.measurements),latest=values[0],expansion=latest?chestExcursion(latest):null;
 const lastMeasured=compareMeasure(db.measurements,'bodyFatPct').last;
 return `${header('ACOMPANHAMENTO CORPORAL','Avaliação corporal','Avalie medidas dos dois lados, evolução e fotografias privadas. Use sempre o mesmo método e horário aproximado.')}
 <div class="grid4">${bodyComparison('weightKg','Peso','kg')}${bodyComparison('waistCm','Cintura','cm')}${bodyComparison('chestCm','Tórax em repouso','cm')}${bodyComparison('chestExpandedCm','Tórax expandido','cm')}</div>
 <div class="body-assessment-note">IMC calculado: <strong>${bmi===null?'—':String(bmi).replace('.',',')}</strong> · Amplitude inspiratória (repouso → inspiração máxima): <strong>${expansion===null?'—':expansion.toLocaleString('pt-BR')+' cm'}</strong>. O IMC não indica diretamente gordura corporal. A amplitude não substitui avaliação clínica de expansibilidade torácica.</div>
 <section class="panel section body-fat-panel"><div class="section-head"><h3 class="section-title">Gordura corporal — estimativas por medidas</h3><span class="section-kicker">Sem necessidade de balança de bioimpedância</span></div>
 <div class="grid3 body-fat-results"><div><small>Método RFM · altura + cintura</small><strong>${estimated.rfm===null?'—':estimated.rfm.toLocaleString('pt-BR')+'%'}</strong></div><div><small>Método US Navy · altura + cintura + pescoço</small><strong>${estimated.navy===null?'—':estimated.navy.toLocaleString('pt-BR')+'%'}</strong></div><div><small>Percentual informado por exame</small><strong>${lastMeasured===null?'—':lastMeasured.toLocaleString('pt-BR')+'%'}</strong></div></div>
 <p class="disclaimer">RFM e US Navy são <strong>estimativas estatísticas</strong>, não medidas reais. Não calculamos gordura usando fotografias nem o IMC isoladamente. Para acompanhamento, repita as medidas no mesmo ponto e, quando possível, valide a estimativa com um profissional. O valor de exame é registrado separadamente, nunca preenchido automaticamente.</p></section>
 <section class="panel section"><div class="section-head"><h3 class="section-title">Nova avaliação</h3><span class="section-kicker">Peso em kg · demais medidas em cm</span></div>
 <div class="body-guidance">Na altura, digite <strong>173 cm</strong> ou <strong>1,73 m</strong>; o sistema converte para centímetros. Peso como <strong>83,300 kg</strong> também é aceito. Para comparar tórax, posicione a fita na mesma altura em repouso e na inspiração máxima.</div>
 <div class="body-form-grid"><div class="form-field"><label for="body-date">Data da avaliação</label><input id="body-date" type="date" value="${todayISO()}" max="${todayISO()}"></div>
 ${VISIBLE_BODY_FIELDS.map(f=>`<div class="form-field body-group-${f.group}"><label for="body-${f.key}">${escapeHTML(f.label)} (${f.unit})</label><input id="body-${f.key}" type="text" maxlength="9" inputmode="decimal" placeholder="${f.key==='weightKg'?'Ex.: 83,300':f.key==='heightCm'?'Ex.: 173 ou 1,73':'Opcional'}" value="${f.key==='heightCm'&&previousHeight!==null?escapeHTML(String(previousHeight).replace('.',',')):''}"></div>`).join('')}
 <div class="form-field body-notes"><label for="body-notes">Observações</label><textarea id="body-notes" rows="2" maxlength="500" placeholder="Ex.: medição pela manhã, mesma fita e postura"></textarea></div></div>
 <div class="body-guidance">Braços, coxas e panturrilhas são <strong>circunferências</strong>. O campo perna corresponde ao <strong>comprimento do quadril até o tornozelo</strong>, medido separadamente à direita e à esquerda. Para braços, mantenha o mesmo estado de relaxamento em todas as avaliações.</div>
 <div class="body-photo-section"><h3>Fotos da avaliação · 3 posições</h3><p>Opcional: use roupa semelhante, iluminação uniforme, câmera fixa e distância constante. Fotos de frente, costas e perfil com ambos os braços estendidos horizontalmente à frente.</p>
 ${bodyPhotoInputs()}<p class="disclaimer">As fotos serão comprimidas e salvas exclusivamente no armazenamento IndexedDB deste navegador. Não são enviadas ao GitHub. O backup JSON incluirá as fotos; proteja o arquivo, pois ele contém imagens pessoais.</p></div>
 <div class="setting-actions"><button class="button primary" data-action="save-assessment">${ico('check')} Salvar avaliação</button><button class="button outline" data-action="export-assessment-csv">${ico('download')} Exportar avaliações CSV</button></div>
 <p class="disclaimer">Preencha o peso ou pelo menos uma medida corporal. A altura isolada não constitui uma avaliação.</p></section>
 <section class="panel section"><div class="section-head"><h3 class="section-title">Comparação entre lados</h3><span class="section-kicker">Última medida registrada de cada lado</span></div><div class="body-comparison-overflow"><table class="body-comparison-table"><thead><tr><th>Região</th><th>Direita</th><th>Esquerda</th><th>Diferença D−E</th></tr></thead><tbody>
 ${measurementPairRow('Braço','armRightCm','armLeftCm')}${measurementPairRow('Comprimento da perna','legRightCm','legLeftCm')}${measurementPairRow('Coxa','thighRightCm','thighLeftCm')}${measurementPairRow('Panturrilha','calfRightCm','calfLeftCm')}</tbody></table></div></section>
 <div class="section grid2">${bodyTrend('weightKg','Evolução do peso','kg')}${bodyTrend('waistCm','Evolução da cintura','cm')}</div>
 <section class="section"><div class="section-head"><h3 class="section-title">Histórico de avaliações e fotos</h3><span class="section-kicker">${values.length} registro(s)</span></div>
 ${values.length?`<div class="history-list">${values.map(x=>`<div class="body-history-card"><div class="history-entry body-record"><div><span class="active-label">AVALIAÇÃO · ${fmtDate(x.date)}</span><h3>${BODY_FIELDS.filter(f=>typeof x[f.key]==='number').map(f=>`${escapeHTML(f.label)}: ${x[f.key].toLocaleString('pt-BR')} ${f.unit}`).join(' · ')}</h3>${x.notes?`<p>${escapeHTML(x.notes)}</p>`:''}</div><div class="body-history-actions"><button class="button small outline" data-action="edit-assessment-photos" data-id="${escapeHTML(x.id)}">Gerenciar fotos</button><button class="button small danger icon-btn" title="Excluir avaliação" aria-label="Excluir avaliação" data-action="delete-assessment" data-id="${escapeHTML(x.id)}">${ico('trash',14)}</button></div></div>${photoGallery(x.id)}${photoEditId===x.id?photoEditor(x.id):''}</div>`).join('')}</div>`:`<div class="empty"><h3>Nenhuma avaliação registrada ainda.</h3><p>Preencha as medidas acima para estabelecer sua primeira referência.</p></div>`}
 </section>`;
}
function saveAssessment(){
 const date=$('#body-date')?.value,notes=String($('#body-notes')?.value||'').trim();
 if(!validISO(date)||date>todayISO()){toast('Escolha uma data válida, sem datas futuras.');return}
 const values={};
 for(const field of VISIBLE_BODY_FIELDS){
  const raw=$('#body-'+field.key)?.value??'';
  let value=parsePtNumber(raw);
  if(field.key==='heightCm'&&value!==null&&Number.isFinite(value))value=normalizeHeightCm(value);
  if(Number.isNaN(value)||value!==null&&(value<field.min||value>field.max)){toast('Valor inválido: '+field.label+'. Confira a unidade.');return}
  values[field.key]=value;
 }
 if(values.chestCm!==null&&values.chestExpandedCm!==null&&values.chestExpandedCm<values.chestCm){
  toast('O tórax em inspiração máxima deve ser maior ou igual ao tórax em repouso.');return;
 }
 const photos=collectBodyPhotos();
 if(photos===null)return;
 const id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`avaliacao-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const record={id,date,notes,...values};
 if(!validBodyMeasurement(record)){toast('Informe peso ou pelo menos uma medida corporal.');return}
 if(db.measurements.some(x=>x.date===date)&&!confirm('Já existe avaliação nesta data. Deseja adicionar outra?'))return;
 db.measurements.push(record);save();go('avaliacao');
 if(Object.keys(photos).length){
  saveAssessmentPhotos(id,photos).then(()=>{renderBodyPhotos();toast('Avaliação e fotos salvas neste navegador.')}).catch(err=>toast('Medidas salvas, mas fotos falharam: '+err.message));
 }else toast('Avaliação salva somente neste navegador.');
}
function saveEditedAssessmentPhotos(id){
 if(!db.measurements.some(x=>x.id===id)){toast('Avaliação não localizada.');return}
 const files=collectBodyPhotos('photo-edit');
 if(!files)return;
 if(!Object.keys(files).length){toast('Selecione ao menos uma foto para salvar.');return}
 saveAssessmentPhotos(id,files).then(()=>{
  photoEditId=null;render();toast('Fotos desta avaliação atualizadas.');
 }).catch(err=>toast('Não foi possível salvar as fotos: '+err.message));
}
function exportAssessmentCSV(){
 const headers=['data',...BODY_FIELDS.map(x=>x.key),'observacoes'];
 const rows=[headers,...db.measurements.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(x=>[x.date,...BODY_FIELDS.map(f=>x[f.key]??''),x.notes])];
 download('\ufeff'+rows.map(row=>row.map(csvEsc).join(';')).join('\r\n'),`forca-em-casa-avaliacoes-${todayISO()}.csv`,'text/csv;charset=utf-8');
 toast('Avaliações exportadas em CSV.');
}
function configuracoes(){return `${header('PREFERÊNCIAS','Configurações','Personalize o início do ciclo e gerencie seus registros com segurança.')}
<div class="grid2"><div class="setting-card"><div class="active-label">01 · PROGRAMA</div><h3 style="margin-top:12px">Data de início do ciclo</h3><p>A semana de readaptação é calculada a partir desta data. Alterá-la não apaga os treinos existentes.</p><div class="form-field"><label for="cycle-start">Início das 8 semanas</label><input id="cycle-start" type="date" value="${escapeHTML(db.profile.startDate)}" /></div><div class="setting-actions"><button class="button primary" data-action="save-settings">${ico('check')} Salvar data</button></div><p style="margin-top:14px">Semana atual: ${weekNum()>8?'ciclo inicial concluído':weekNum()+' de 8'}. Ficha: cinco treinos e dois dias de recuperação.</p></div>
<div class="setting-card"><div class="active-label">02 · DADOS</div><h3 style="margin-top:12px">Backup e privacidade</h3><p>Seus treinos, atividades e avaliações corporais ficam no armazenamento local deste navegador. Não são enviados para o GitHub nem compartilhados entre dispositivos. Faça backups periódicos.</p><div class="setting-actions"><button class="button outline" data-action="export-json">${ico('download')} Exportar JSON</button><button class="button outline" data-action="import-json">${ico('upload')} Importar JSON</button></div><p style="margin-top:14px">Importar substitui seus registros atuais após confirmação.</p></div>
<div class="setting-card"><div class="active-label">03 · SEGURANÇA</div><h3 style="margin-top:12px">Boas práticas de treino</h3><div class="safety">Ajuste os elásticos apenas em pontos de ancoragem seguros. Não improvise mecanismos na estação WCT. Procure avaliação profissional presencial para corrigir a técnica e adaptar o treino quando necessário.</div><div class="separator"></div><p>Este sistema registra desempenho, mas não realiza avaliação médica nem prescrição automática de novas cargas.</p></div>
<div class="setting-card"><div class="active-label">04 · MANUTENÇÃO</div><h3 style="margin-top:12px">Restaurar dados locais</h3><p>Esta ação apaga o histórico de musculação, atividades e medidas corporais, a sessão em andamento e a data inicial do ciclo neste navegador. Um arquivo exportado pode ser importado depois.</p><div class="setting-actions"><button class="button danger" data-action="reset">${ico('trash')} Apagar todos os dados</button></div></div></div>
<div class="section tip-box"><div class="tip-heading">${ico('shield')} Arquitetura da V1</div><p>Aplicação web estática, sem contas e sem servidor de dados. Compatível com hospedagem por GitHub Pages. Para sincronizar entre dispositivos em uma futura versão, será necessário implantar autenticação e armazenamento seguro, com controles de acesso e privacidade.</p></div>`}
function render(){const route=getRoute();setActiveNav(route);const content={dashboard,treinos,atividades:activitiesPage,avaliacao:assessmentPage,evolucao,configuracoes,sessao:renderSession};app.innerHTML=content[route]();updateTimer();if(route==='avaliacao')renderBodyPhotos().catch(()=>{})}
function persistEdit(el){const s=db.active;if(!s)return;const arr=s.sets[el.dataset.exid];const index=Number(el.dataset.index);const set=arr?.[index];if(!set)return;if(el.dataset.edit==='reps'){if(el.value===''){set.reps=''}else{const n=Number(el.value);set.reps=Number.isFinite(n)?String(clamp(Math.round(n),0,999)):''}}else if(el.dataset.edit==='load'){set.load=String(el.value).slice(0,40)}else if(el.dataset.edit==='rpe'){set.rpe=String(el.value)}save()}
function toggleSet(exid,index,button){
 const set=db.active?.sets?.[exid]?.[Number(index)];if(!set)return;
 // Captura valores digitados mesmo quando o navegador não dispara blur antes do clique.
 const row=button?.closest?.('tr');
 row?.querySelectorAll?.('[data-edit]')?.forEach(persistEdit);
 const exercise=button?.closest?.('.session-exercise');
 const feedback=exercise?.querySelector?.('[data-set-feedback]');
 if(!set.done){
  if(!set.reps||!Number.isFinite(Number(set.reps))||Number(set.reps)<1){
   if(feedback){feedback.textContent='Série '+(Number(index)+1)+': digite as repetições realizadas. Os textos cinza são apenas exemplos.';feedback.hidden=false;}
   const repsInput=row?.querySelector?.('[data-edit="reps"]');
   row?.classList?.add('set-invalid');
   repsInput?.focus?.();
   toast('Digite as repetições para concluir esta série.');
   return;
  }
  set.done=true;
  const ex=findDay(db.active.dayId)?.exercises.find(x=>x.id===exid);
  if(ex)startTimer(ex.rest,ex.name);
 }else set.done=false;
 save();
 if(feedback)feedback.hidden=true;
 row?.classList?.remove('set-invalid');
 // Atualização pontual: não destrói os campos nem fecha os detalhes/fotos abertos.
 const count=totalSets(db.active),planned=plannedSets(db.active);
 const progress=app.querySelector?.('[data-workout-progress-count]');
 if(!progress){render();return;}
 row?.classList?.toggle?.('checked',set.done);
 if(button){
  button.classList?.toggle?.('checked',set.done);
  button.setAttribute?.('aria-label',(set.done?'Desmarcar':'Concluir')+' série '+(Number(index)+1));
  button.setAttribute?.('aria-pressed',String(set.done));
  button.innerHTML=set.done?ico('check',17):'○';
 }
 progress.textContent=count+'/'+planned+' séries';
 const pct=planned?Math.round(count/planned*100):0;
 const progressPct=app.querySelector?.('[data-workout-progress-pct]');
 const progressFill=app.querySelector?.('[data-workout-progress-fill]');
 const finishBtn=app.querySelector?.('[data-finish-button]');
 if(progressPct)progressPct.textContent=pct+'%';
 if(progressFill)progressFill.style.width=pct+'%';
 if(finishBtn)finishBtn.innerHTML=ico('check')+' Finalizar treino ('+count+'/'+planned+')';
}
function startTimer(seconds,label){timerEnd=Date.now()+Number(seconds)*1000;timerLabel=label;updateTimer()}
function updateTimer(){const el=$('#timer');if(!timerEnd){el.hidden=true;return}const left=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));if(!left){timerEnd=0;el.hidden=true;toast('Descanso concluído. Você pode iniciar a próxima série.');return}el.hidden=false;el.innerHTML=`${ico('clock',21)}<span>DESCANSO</span><strong class="timer-digit">${pad(Math.floor(left/60))}:${pad(left%60)}</strong><button data-action="stop-timer" aria-label="Cancelar contagem">Parar</button>`}
const timerInterval=setInterval(()=>{if(timerEnd)updateTimer()},500);
if(typeof timerInterval.unref==='function')timerInterval.unref();
function download(text,name,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
async function exportJSON(){
 try{
  const backup=await exportAssessmentPhotoBackup();
  download(JSON.stringify({...db,photoBackup:backup.photos,exportedAt:new Date().toISOString()},null,2),`forca-em-casa-backup-${todayISO()}.json`,'application/json');
  toast(backup.available?`Backup gerado com ${backup.photos.length} fotografia(s) privada(s). Proteja este arquivo.`:'Backup sem fotos: armazenamento de imagens não disponível.');
 }catch(err){toast('Não foi possível incluir as fotos no backup: '+err.message)}
}
function csvEsc(x){const s=String(x??'');return `"${s.replace(/"/g,'""')}"`}
function exportCSV(){
 const rows=[['tipo_registro','data','treino_ou_atividade','semana','exercicio','serie','reps','carga_ou_faixa','rpe','duracao_min','distancia_km','intensidade','observacoes']];
 for(const session of db.sessions){
  if(session.manual)rows.push(['musculacao',session.date,session.dayId,session.week,'Realizado sem séries informadas','','','','','','','','']);
  const day=findDay(session.dayId);
  for(const ex of day?.exercises||[]){(session.sets?.[ex.id]||[]).forEach((set,i)=>{if(set.done)rows.push(['musculacao',session.date,session.dayId,session.week,recordedExerciseName(session,ex),i+1,set.reps,set.load,set.rpe,'','','',''])})}
 }
 for(const a of db.activities)rows.push(['atividade',a.date,activityType(a.type)?.label||a.type,'','','','','','',a.durationMin,a.distanceKm??'',a.intensity,a.notes]);
 download('\ufeff'+rows.map(row=>row.map(csvEsc).join(';')).join('\r\n'),`forca-em-casa-evolucao-${todayISO()}.csv`,'text/csv;charset=utf-8');
 toast('CSV exportado com treinos e atividades.');
}
function validSetObject(x){return x&&typeof x==='object'&&typeof x.done==='boolean'&&(typeof x.reps==='string'||typeof x.reps==='number')&&(typeof x.load==='string'||typeof x.load==='number')&&(typeof x.rpe==='string'||typeof x.rpe==='number')}
function validSession(s){if(!s||typeof s!=='object'||!findDay(s.dayId)||typeof s.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s.date)||!s.sets||typeof s.sets!=='object'||typeof s.id!=='string')return false;for(const key of Object.keys(s.sets)){if(!PROGRAM.days.flatMap(d=>d.exercises).some(e=>e.id===key)||!Array.isArray(s.sets[key])||s.sets[key].length>5||!s.sets[key].every(validSetObject))return false}return true}
async function importJSON(file,mode='replace'){if(!file||file.size>80*1024*1024){toast('Selecione um arquivo JSON de até 80 MB, incluindo fotografias.');return}let imported;try{imported=JSON.parse(await file.text())}catch{toast('Não foi possível interpretar o arquivo JSON.');return}if(!imported||imported.version!==1||!imported.profile||typeof imported.profile.startDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(imported.profile.startDate)||!Array.isArray(imported.sessions)||imported.sessions.length>5000||!imported.sessions.every(validSession)||!(imported.active===null||imported.active===undefined||validSession(imported.active))||!(imported.activities===undefined||(Array.isArray(imported.activities)&&imported.activities.length<=10000&&imported.activities.every(validActivity)))||!(imported.measurements===undefined||(Array.isArray(imported.measurements)&&imported.measurements.length<=2000&&imported.measurements.every(validBodyMeasurement)))||!(imported.photoBackup===undefined||(Array.isArray(imported.photoBackup)&&imported.photoBackup.length<=6000&&imported.photoBackup.every(validPhotoBackupEntry)))){toast('O arquivo não tem o formato esperado para a V1.');return}if(mode==='merge'){
 const result=mergeHistory(db,imported);
 const summary=`${result.addedSessions} sessão(ões), ${result.addedActivities} atividade(s) e ${result.addedMeasurements} avaliação(ões) adicionais`;
 if(!confirm('Mesclar backup mantendo os registros atuais? Serão incluídos: '+summary+'. Registros repetidos não serão duplicados.'))return;
 db=result.db;save();expandedSession=null;go('evolucao');
 try{
  const recovered=await importAssessmentPhotoBackup(imported.photoBackup||[],db.measurements.map(x=>x.id));
  toast('Backup mesclado. '+recovered+' foto(s) restaurada(s).');
 }catch(err){toast('Dados mesclados; fotos não puderam ser importadas: '+err.message)}
 return;
}
if(!confirm(`Substituir dados locais por ${imported.sessions.length} sessões do backup? Os dados atuais serão sobrescritos. Faça um backup antes de continuar.`))return;
db={version:1,profile:{startDate:imported.profile.startDate},sessions:imported.sessions,activities:imported.activities||[],measurements:imported.measurements||[],active:imported.active||null};save();expandedSession=null;go('evolucao');
try{
 const recovered=await importAssessmentPhotoBackup(imported.photoBackup||[],db.measurements.map(x=>x.id),{replaceExisting:true});
 toast('Backup importado. '+recovered+' foto(s) restaurada(s).');
}catch(err){toast('Dados importados; fotos não puderam ser importadas: '+err.message)}
}
function delegatedClick(e){const btn=e.target.closest('[data-action]');if(!btn)return;const a=btn.dataset.action;if(a==='view-assessment'){go('avaliacao');return}if(a==='save-assessment'){saveAssessment();return}if(a==='export-assessment-csv'){exportAssessmentCSV();return}if(a==='edit-assessment-photos'){photoEditId=photoEditId===btn.dataset.id?null:btn.dataset.id;render();return}
if(a==='cancel-photo-editor'){photoEditId=null;render();return}
if(a==='save-assessment-photos'){saveEditedAssessmentPhotos(btn.dataset.id);return}
if(a==='delete-assessment'){if(confirm('Excluir esta avaliação corporal e suas fotos neste navegador?')){
 const id=btn.dataset.id;
 db.measurements=db.measurements.filter(x=>x.id!==id);save();photoEditId=null;render();toast('Avaliação excluída.');
 removeAssessmentPhotos(id).catch(()=>toast('As medidas foram apagadas, mas a exclusão das fotos não foi concluída.'));
}return}if(a==='view-activities'){go('atividades');return}if(a==='save-activity'){saveActivity();return}if(a==='delete-activity'){if(confirm('Excluir este registro de atividade?')){db.activities=db.activities.filter(x=>x.id!==btn.dataset.id);save();render();toast('Atividade excluída.')}return}if(a==='mark-past-week'){saveManualEntries(getMissingScheduledSessions(PROGRAM,db.sessions,todayISO()));return}if(a==='mark-past-day'){const item=getMissingScheduledSessions(PROGRAM,db.sessions,todayISO()).find(e=>e.dayId===btn.dataset.day&&e.date===btn.dataset.date);if(item)saveManualEntries([item]);return}if(a==='apply-history-link'){const entries=parseCompletionHash(location.hash,PROGRAM,todayISO());if(!entries.length){toast('O link de registro não é válido.');return}const result=mergeCompletedSessions(db.sessions,entries,db.profile.startDate);db.sessions=result.sessions;save();go('evolucao');toast(result.added?`${result.added} treino(s) concluído(s) registrado(s).`:'Os treinos já estavam registrados.');return}if(a==='cancel-history-link'){go('dashboard');return}if(a==='choose-day'){selectedDay=btn.dataset.day;go('treinos');return}if(a==='view-plans'){go('treinos');return}if(a==='start'){startSession(btn.dataset.day);return}if(a==='resume'){go('sessao');return}if(a==='set-done'){toggleSet(btn.dataset.exid,btn.dataset.index,btn);return}if(a==='timer'){startTimer(btn.dataset.rest,btn.dataset.ex);return}if(a==='stop-timer'){timerEnd=0;updateTimer();return}if(a==='discard'){if(db.active&&confirm('Descartar a sessão em andamento? Séries não finalizadas serão perdidas.')){db.active=null;save();timerEnd=0;go('treinos');}return}if(a==='finish'){finish();return}if(a==='expand'){expandedSession=expandedSession===btn.dataset.id?null:btn.dataset.id;render();return}if(a==='delete-session'){if(confirm('Excluir este registro de treino?')){db.sessions=db.sessions.filter(s=>s.id!==btn.dataset.id);save();render();toast('Registro excluído.')}return}if(a==='save-settings'){const v=$('#cycle-start')?.value;if(!v||!/^\d{4}-\d{2}-\d{2}$/.test(v)){toast('Informe uma data válida.');return}db.profile.startDate=v;save();render();toast('Data inicial atualizada.');return}if(a==='export-json'){exportJSON();return}if(a==='export-csv'){exportCSV();return}if(a==='import-merge'){pendingImportMode='merge';$('#import-file').click();return}if(a==='import-json'){pendingImportMode='replace';$('#import-file').click();return}if(a==='reset'){if(confirm('Apagar TODOS os seus dados de treino deste navegador? Esta operação não pode ser desfeita sem backup.')){db=initialData();selectedDay='A';expandedSession=null;timerEnd=0;save();go('dashboard');clearAllAssessmentPhotos().catch(()=>{});toast('Dados locais restaurados, incluindo o histórico de fotos quando disponível.')}return}}
app.addEventListener('click',delegatedClick);
$('#timer').addEventListener('click',delegatedClick);
app.addEventListener('input',e=>{if(e.target.matches('[data-edit]')){persistEdit(e.target);const container=e.target.closest?.('.session-exercise');const feedback=container?.querySelector?.('[data-set-feedback]');if(feedback)feedback.hidden=true;e.target.closest?.('tr')?.classList?.remove('set-invalid');}});
app.addEventListener('change',e=>{
 if(e.target.matches('[data-edit]'))persistEdit(e.target);
 if(e.target.dataset?.photoInput){
  const file=e.target.files?.[0];
  const preview=e.target.closest?.('.body-photo-slot')?.querySelector?.('.body-photo-preview');
  if(!preview)return;
  if(!file){preview.hidden=true;preview.innerHTML='';return}
  if(!validPhotoFile(file)){preview.textContent='Use JPEG, PNG ou WebP, com até 12 MB.';preview.hidden=false;return}
  const url=URL.createObjectURL(file);photoObjectUrls.push(url);
  preview.innerHTML=`<img src="${url}" alt="Prévia da fotografia selecionada"><small>${escapeHTML(file.name||'Foto selecionada')}</small>`;
  preview.hidden=false;
 }
});
// Grava o rascunho ao sair de um campo, sem redesenhar enquanto o usuário digita.
app.addEventListener('focusout',e=>{if(e.target.matches('[data-edit]'))persistEdit(e.target)});
$('#import-file').addEventListener('change',e=>{const file=e.target.files[0];if(file)importJSON(file,pendingImportMode);pendingImportMode='replace';e.target.value=''});
window.addEventListener('hashchange',()=>render());
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){db=loadDB();render();toast('Os dados foram atualizados por outra aba.')}});
window.addEventListener('beforeunload',()=>{if(db.active)save()});
for(const el of document.querySelectorAll('[data-nav-icon]'))el.innerHTML=ico(el.dataset.navIcon,20);
$('#top-date').textContent=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'short'}).format(new Date());
if(!location.hash)location.hash='#dashboard';
render();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
