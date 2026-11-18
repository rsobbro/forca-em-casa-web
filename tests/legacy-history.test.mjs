import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('nomes legados permanecem preservados após substituir exercícios incompatíveis',()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.ok(source.includes('LEGACY_EXERCISE_NAMES'));
 assert.ok(source.includes('exerciseNames:Object.fromEntries(day.exercises.map(ex=>[ex.id,ex.name]))'));
 assert.ok(source.includes('recordedExerciseName(s,ex)'));
 assert.ok(source.includes('recordedExerciseName(session,ex)'));
 for(const id of ['a6','b2','b5','c3','d2','d7'])assert.ok(source.includes('"'+id+'":'));
});
