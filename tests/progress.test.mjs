import test from 'node:test';
import assert from 'node:assert/strict';
import {weeklyProgress,totalProgress,mergeHistory} from '../progress.js';
const done=(reps)=>({reps:String(reps),done:true,load:'top',rpe:'7'});
const mon={id:'mon',date:'2026-11-16',dayId:'A',sets:{},manual:true,week:1};
const tue={id:'tue',date:'2026-11-17',dayId:'B',sets:{},manual:true,week:1};
test('treinos manuais contam na frequência, mas não inventam séries',()=>{
 const w=weeklyProgress([mon,tue],[],'2026-11-16','2026-11-22');
 assert.equal(w.strengthDays,2);
 assert.equal(w.strengthSessions,2);
 assert.equal(w.recordedSets,0);
 assert.equal(w.recordedReps,0);
 assert.equal(w.totalActiveDays,2);
 const totals=totalProgress([mon,tue],[]);
 assert.equal(totals.manualSessions,2);
 assert.equal(totals.recordedSets,0);
});
test('atividades complementares contabilizadas sem alterar meta 5 de força',()=>{
 const extra=[
   {id:'run',date:'2026-11-17',durationMin:30},
   {id:'karate',date:'2026-11-18',durationMin:75},
   {id:'old',date:'2026-11-01',durationMin:50}
 ];
 const w=weeklyProgress([mon,tue],extra,'2026-11-16','2026-11-22');
 assert.equal(w.strengthDays,2);
 assert.equal(w.otherActivities,2);
 assert.equal(w.otherMinutes,105);
 assert.equal(w.totalActiveDays,3);
 assert.equal(totalProgress([mon,tue],extra).otherActivities,3);
 assert.equal(totalProgress([mon,tue],extra).otherMinutes,155);
});
test('séries efetivamente preenchidas são computadas, sem dupla contagem de dia A',()=>{
 const detail={id:'new',dayId:'A',date:'2026-11-18',sets:{a1:[done(12),{reps:'11',done:false}],a2:[done(8)]}};
 const w=weeklyProgress([mon,tue,detail],[],'2026-11-16','2026-11-22');
 assert.equal(w.strengthDays,2);
 assert.equal(w.recordedSets,2);
 assert.equal(w.recordedReps,20);
});
test('mesclagem preserva histórico atual, medidas e atividades; reimportação não duplica',()=>{
 const current={version:1,profile:{startDate:'2026-11-18'},sessions:[mon],activities:[{id:'bike',date:'2026-11-16',durationMin:30}],measurements:[{id:'body',date:'2026-11-16'}],active:{id:'active'}};
 const incoming={version:1,profile:{startDate:'2026-11-16'},sessions:[mon,tue],activities:[{id:'bike',date:'2026-11-16',durationMin:30},{id:'swim',date:'2026-11-17',durationMin:50}],measurements:[{id:'body',date:'2026-11-16'},{id:'body2',date:'2026-11-18'}],active:null};
 const combined=mergeHistory(current,incoming);
 assert.equal(combined.db.sessions.length,2);
 assert.equal(combined.db.activities.length,2);
 assert.equal(combined.db.measurements.length,2);
 assert.equal(combined.db.profile.startDate,'2026-11-16');
 assert.equal(combined.db.active.id,'active');
 assert.equal(combined.addedSessions,1);
 const again=mergeHistory(combined.db,incoming);
 assert.equal(again.db.sessions.length,2);
 assert.equal(again.db.activities.length,2);
 assert.equal(again.db.measurements.length,2);
});
test('backup detalhado substitui marcação manual sem perder as séries',()=>{
 const filled={id:'detailed',date:'2026-11-16',dayId:'A',sets:{a1:[done(10)]},manual:false};
 const {db}=mergeHistory({version:1,profile:{startDate:'2026-11-16'},sessions:[mon],activities:[],measurements:[],active:null},
 {version:1,profile:{startDate:'2026-11-16'},sessions:[filled],activities:[],measurements:[],active:null});
 assert.equal(db.sessions.length,1);
 assert.equal(db.sessions[0].id,'detailed');
 assert.equal(totalProgress(db.sessions,[]).recordedSets,1);
});
