import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM,prescribedSets,findDay } from '../plan.js';

test('a divisão semanal contém cinco sessões distintas',()=>{
  assert.equal(PROGRAM.days.length,5);
  assert.deepEqual(PROGRAM.days.map(d=>d.id),['A','B','C','D','E']);
  assert.deepEqual(Object.values(PROGRAM.schedule),['A','B','C','D','E']);
  assert.deepEqual(PROGRAM.days.map(d=>d.weekday),[1,2,3,5,6]);
});

test('cada exercício tem parâmetros biomecânicos e equipamento',()=>{
  const all=PROGRAM.days.flatMap(d=>d.exercises);
  assert.equal(new Set(all.map(e=>e.id)).size,all.length);
  assert.equal(all.length,32);
  for(const e of all){
    assert.ok(e.name&&e.equipment&&e.tip&&e.focus);
    assert.ok(Number.isInteger(e.sets)&&e.sets>=2&&e.sets<=3);
    assert.ok(e.rest>=45&&e.rest<=120);
    assert.ok(e.rpe);
  }
  assert.equal(findDay('C').label,'LEGS A');
});

test('readaptação e semana de descarga reduzem o volume previsto',()=>{
  assert.equal(PROGRAM.phases.length,8);
  assert.equal(prescribedSets(3,1),2);
  assert.equal(prescribedSets(3,2),2);
  assert.equal(prescribedSets(3,3),3);
  assert.equal(prescribedSets(3,7),3);
  assert.equal(prescribedSets(3,8),2);
  assert.equal(prescribedSets(2,8),1);
});
