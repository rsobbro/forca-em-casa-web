import test from 'node:test';
import assert from 'node:assert/strict';
import {PROGRAM} from '../plan.js';
import {EXERCISE_MEDIA,getExerciseMedia,PHOTO_SOURCE} from '../exercise-media.js';
import {readFileSync} from 'node:fs';
test('todos os 32 exercícios possuem duas fotografias de referência',()=>{
  const exercises=PROGRAM.days.flatMap(day=>day.exercises);
  assert.equal(exercises.length,32);
  for(const e of exercises){
    const media=getExerciseMedia(e.id);
    assert.ok(media,'Foto ausente: '+e.id);
    assert.equal(media.urls.length,2);
    assert.ok(media.urls.every(url=>url.startsWith('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/')));
    assert.equal(typeof media.sameEquipment,'boolean');
  }
  assert.equal(Object.keys(EXERCISE_MEDIA).length,32);
  assert.ok(PHOTO_SOURCE.includes('free-exercise-db'));
});
test('interface importa módulos de atividades e imagens e preserva dados',()=>{
  const js=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  assert.ok(js.includes('exercisePhotos(ex)'));
  assert.ok(js.includes('exercisePhotos(ex,true)'));
  assert.ok(js.includes('activities:Array.isArray(d.activities)?d.activities.filter(validActivity):[]'));
  assert.ok(js.includes('activities:imported.activities||[]'));
});
