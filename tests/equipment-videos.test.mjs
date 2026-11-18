import test from 'node:test';
import assert from 'node:assert/strict';
import {PROGRAM} from '../plan.js';
import {EQUIPMENT,INVENTORY_NOTICE,validateProgramEquipment} from '../equipment-audit.js';
import {exerciseVideo,VIDEO_REFERENCES} from '../exercise-videos.js';
test('32 exercícios só utilizam recursos presentes no inventário doméstico',()=>{
 const all=PROGRAM.days.flatMap(d=>d.exercises);
 assert.equal(all.length,32);
 assert.equal(new Set(all.map(x=>x.id)).size,32);
 assert.deepEqual(validateProgramEquipment(PROGRAM),[]);
 for(const ex of all){
  assert.ok(ex.requires.length>0);
  assert.ok(ex.setup.length>20);
  assert.ok(ex.requires.every(key=>key in EQUIPMENT));
  assert.doesNotMatch(ex.equipment,/WCT.*(?:polia inferior|polia baixa|leg press|cadeira extensora)/i);
 }
 assert.match(INVENTORY_NOTICE,/polia inferior/);
});
test('suporte a todas as referências de vídeo: 24 verificadas e 8 buscas sem validação',()=>{
 const all=PROGRAM.days.flatMap(d=>d.exercises);
 assert.equal(Object.keys(VIDEO_REFERENCES).length,24);
 let confirmed=0,searches=0;
 for(const ex of all){
  const video=exerciseVideo(ex);
  if(video.verified){
    confirmed++;
    assert.match(video.url,/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]+&t=\d+s$/);
    assert.ok(video.note);
  } else {
    searches++;
    assert.match(video.url,/^https:\/\/www\.youtube\.com\/results\?search_query=/);
    assert.match(video.note,/Não foi localizado um vídeo específico verificado/);
  }
 }
 assert.equal(confirmed,24);
 assert.equal(searches,8);
});
test('histórico mantém IDs estáveis apesar das correções de equipamento',()=>{
 const expected=['a1','a2','a3','a4','a5','a6','b1','b2','b3','b4','b5','b6','c1','c2','c3','c4','c5','c6','d1','d2','d3','d4','d5','d6','d7','e1','e2','e3','e4','e5','e6','e7'];
 assert.deepEqual(PROGRAM.days.flatMap(d=>d.exercises.map(x=>x.id)),expected);
});
