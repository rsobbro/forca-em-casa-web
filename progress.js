/** Indicadores determinísticos: força, atividades complementares e dias ativos. */
const validDate = date => typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
const inRange = (date,from,to) => validDate(date)&&date>=from&&date<=to;
export function weeklyProgress(sessions,activities,from,to){
 const strength=(sessions||[]).filter(s=>inRange(s.date,from,to));
 const extra=(activities||[]).filter(a=>inRange(a.date,from,to));
 const series=strength.reduce((n,s)=>n+Object.values(s.sets||{}).flat().filter(x=>x.done===true).length,0);
 const reps=strength.reduce((n,s)=>n+Object.values(s.sets||{}).flat().filter(x=>x.done===true).reduce((sum,x)=>sum+(Number(x.reps)||0),0),0);
 const days=new Set([...strength,...extra].map(x=>x.date));
 return {
   strengthSessions:strength.length,
   strengthDays:new Set(strength.map(x=>x.dayId)).size,
   recordedSets:series,
   recordedReps:reps,
   otherActivities:extra.length,
   otherMinutes:extra.reduce((sum,a)=>sum+(Number(a.durationMin)||0),0),
   totalActiveDays:days.size
 };
}
export function totalProgress(sessions,activities){
 const ss=sessions||[], aa=activities||[];
 return {
   strengthSessions:ss.length,
   manualSessions:ss.filter(s=>s.manual===true).length,
   recordedSets:ss.reduce((sum,s)=>sum+Object.values(s.sets||{}).flat().filter(x=>x.done===true).length,0),
   recordedReps:ss.reduce((sum,s)=>sum+Object.values(s.sets||{}).flat().filter(x=>x.done===true).reduce((sum,x)=>sum+(Number(x.reps)||0),0),0),
   otherActivities:aa.length,
   otherMinutes:aa.reduce((sum,a)=>sum+(Number(a.durationMin)||0),0)
 };
}
export function mergeHistory(current,incoming){
 const a=Array.isArray(current.sessions)?current.sessions:[],b=Array.isArray(incoming.sessions)?incoming.sessions:[];
 const mergedSessions=a.map(x=>({...x}));
 const ids=new Set(mergedSessions.map(x=>x.id));
 let addedSessions=0,updatedSessions=0;
 for(const session of b){
   const idx=mergedSessions.findIndex(s=>s.date===session.date&&s.dayId===session.dayId&&s.manual===true);
   const hasDetailed=session.manual!==true && Object.values(session.sets||{}).some(sets=>Array.isArray(sets)&&sets.some(set=>set.done===true));
   if(ids.has(session.id))continue;
   if(idx>=0&&hasDetailed){
     ids.delete(mergedSessions[idx].id);
     mergedSessions.splice(idx,1);
     updatedSessions++;
   }else if(mergedSessions.some(s=>s.date===session.date&&s.dayId===session.dayId&&s.manual===true) && session.manual===true)continue;
   else if(session.manual===true && mergedSessions.some(s=>s.date===session.date&&s.dayId===session.dayId))continue;
   mergedSessions.push(session);
   ids.add(session.id);
   addedSessions++;
 }
 const mergeItems=(a,b)=>{
   const result=[...a],known=new Set(a.map(x=>x.id));
   let added=0;
   for(const item of b){if(known.has(item.id))continue;known.add(item.id);result.push(item);added++}
   return {items:result,added};
 };
 const extra=mergeItems(current.activities||[],incoming.activities||[]);
 const body=mergeItems(current.measurements||[],incoming.measurements||[]);
 const startDate=[current.profile?.startDate,incoming.profile?.startDate].filter(validDate).sort()[0];
 return {
   db:{
     version:1,profile:{startDate},
     sessions:mergedSessions.sort((a,b)=>b.date.localeCompare(a.date)),
     activities:extra.items,
     measurements:body.items,
     active:current.active||incoming.active||null
   },
   addedSessions,updatedSessions,addedActivities:extra.added,addedMeasurements:body.added
 };
}
