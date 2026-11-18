import test from 'node:test';
import assert from 'node:assert/strict';
import {PROGRAM} from '../plan.js';
import {parseCompletionHash,mergeCompletedSessions,getMissingScheduledSessions} from '../completion-import.js';

const today='2026-11-18';
const link='#registrar-treinos=A@2026-11-16,B@2026-11-17';

test('identifica segunda Push e terça Pull informadas pelo usuário',()=>{
  assert.deepEqual(parseCompletionHash(link,PROGRAM,today),[
    {dayId:'A',date:'2026-11-16'},
    {dayId:'B',date:'2026-11-17'}
  ]);
});
test('rejeita datas futuras, inválidas e divisão trocada',()=>{
  assert.deepEqual(parseCompletionHash('#registrar-treinos=B@2026-11-16',PROGRAM,today),[]);
  assert.deepEqual(parseCompletionHash('#registrar-treinos=A@2026-11-31',PROGRAM,today),[]);
  assert.deepEqual(parseCompletionHash('#registrar-treinos=A@2026-11-23',PROGRAM,today),[]);
  assert.deepEqual(parseCompletionHash('#treinos',PROGRAM,today),[]);
});
test('preserva sessões existentes, registra duas conclusões e não duplica',()=>{
  const old=[{id:'outro',date:'2026-11-13',dayId:'D',sets:{d1:[{reps:'10',load:'20 kg',rpe:'8',done:true}]},week:1}];
  const entries=parseCompletionHash(link,PROGRAM,today);
  const result=mergeCompletedSessions(old,entries,'2026-11-16');
  assert.equal(result.added,2);
  assert.equal(result.sessions.length,3);
  assert.equal(result.sessions.find(s=>s.id==='outro').sets.d1[0].load,'20 kg');
  for(const session of result.sessions.filter(s=>s.manual)){
    assert.deepEqual(session.sets,{});
    assert.equal(session.week,1);
  }
  const again=mergeCompletedSessions(result.sessions,entries,'2026-11-16');
  assert.equal(again.added,0);
  assert.equal(again.sessions.length,3);
  assert.equal(old.length,1);
});
test('não sobrescreve sessão detalhada já registrada no mesmo dia',()=>{
  const existing={id:'real',date:'2026-11-16',dayId:'A',week:1,sets:{a1:[{reps:'10',load:'25 kg',rpe:'8',done:true}]}};
  const result=mergeCompletedSessions([existing],parseCompletionHash(link,PROGRAM,today),'2026-11-16');
  assert.equal(result.added,1);
  assert.equal(result.sessions.length,2);
  assert.deepEqual(result.sessions.find(s=>s.dayId==='A'),existing);
});

test('lista treinos anteriores da semana sem registrar automaticamente',()=>{
  const missing=getMissingScheduledSessions(PROGRAM,[],'2026-11-18');
  assert.deepEqual(missing,[{dayId:'A',date:'2026-11-16'},{dayId:'B',date:'2026-11-17'}]);
  assert.equal(missing.length,2);
});
test('evita duplicatas e não marca dias futuros no registro semanal',()=>{
  const recorded=[{dayId:'A',date:'2026-11-16',sets:{},id:'x'}];
  assert.deepEqual(getMissingScheduledSessions(PROGRAM,recorded,'2026-11-18'),[{dayId:'B',date:'2026-11-17'}]);
  assert.deepEqual(getMissingScheduledSessions(PROGRAM,recorded,'2026-11-17'),[]);
  assert.deepEqual(getMissingScheduledSessions(PROGRAM,recorded,'2026-11-23'),[]);
});
