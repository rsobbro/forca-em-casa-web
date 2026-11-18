/** Registra conclusões de dias anteriores sem inventar séries, cargas ou tempos. */
const linkPattern=/^#registrar-treinos=([A-E]@\d{4}-\d{2}-\d{2}(?:,[A-E]@\d{4}-\d{2}-\d{2}){0,4})$/;

function dateFromISO(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(year,month-1,day,12);
  return date.getFullYear()===year && date.getMonth()===month-1 && date.getDate()===day?date:null;
}

export function parseCompletionHash(hash,program,today){
  const found=linkPattern.exec(hash||'');
  if(!found)return [];
  const entries=[];
  const seen=new Set();
  for(const item of found[1].split(',')){
    const [dayId,date]=item.split('@');
    const when=dateFromISO(date);
    if(!when||date>today||program.schedule[when.getDay()]!==dayId)return [];
    const key=`${date}:${dayId}`;
    if(!seen.has(key)){entries.push({dayId,date});seen.add(key);}
  }
  return entries;
}

export function mergeCompletedSessions(sessions,entries,startDate){
  const oldKeys=new Set(sessions.map(s=>`${s.date}:${s.dayId}`));
  const start=dateFromISO(startDate);
  const added=[];
  for(const {dayId,date} of entries){
    const key=`${date}:${dayId}`;
    if(oldKeys.has(key))continue;
    const current=dateFromISO(date);
    if(!current)continue;
    const days=start?Math.round((current-start)/(24*60*60*1000)):0;
    added.push({
      id:`registro-manual-${dayId}-${date}`,
      dayId,date,
      week:Math.max(1,Math.floor(days/7)+1),
      sets:{},
      manual:true
    });
    oldKeys.add(key);
  }
  const merged=[...added,...sessions].sort((a,b)=>b.date.localeCompare(a.date));
  return {sessions:merged,added:added.length};
}
