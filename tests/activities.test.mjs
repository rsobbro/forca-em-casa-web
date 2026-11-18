import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVITY_TYPES,ACTIVITY_INTENSITIES,activitySummary,validActivity,validISO} from '../activities.js';
test('corrida, bicicleta, karatê e natação constam na lista',()=>{
  const codes=ACTIVITY_TYPES.map(x=>x.id);
  for (const code of ['corrida','ciclismo','karate','natacao'])assert.ok(codes.includes(code));
  assert.deepEqual(ACTIVITY_INTENSITIES,['Leve','Moderada','Intensa']);
});
test('validação de data, duração e distância',()=>{
  const good={id:'abc',type:'natacao',date:'2026-11-18',durationMin:45,distanceKm:1.2,intensity:'Moderada',notes:'Aula'};
  assert.ok(validActivity(good));
  assert.equal(validISO('2026-02-29'),false);
  assert.equal(validActivity({...good,durationMin:-2}),false);
  assert.equal(validActivity({...good,distanceKm:Infinity}),false);
  assert.equal(validActivity({...good,type:'inexistente'}),false);
  assert.equal(validActivity({...good,notes:'x'.repeat(501)}),false);
});
test('resumo semanal soma sessões e evita duplicar dias',()=>{
  const entries=[
    {date:'2026-11-16',durationMin:30,distanceKm:5},
    {date:'2026-11-16',durationMin:60,distanceKm:null},
    {date:'2026-11-18',durationMin:45,distanceKm:1.2},
    {date:'2026-11-09',durationMin:20,distanceKm:2}
  ];
  assert.deepEqual(activitySummary(entries,'2026-11-16','2026-11-22'),{count:3,minutes:135,km:6.2,days:2});
});
