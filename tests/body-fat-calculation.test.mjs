import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateBodyFatForAssessment,estimatedBodyFatSeries,estimatesFor} from '../measurements.js';

const historic={id:'old',date:'2026-11-16',heightCm:173,waistCm:99,neckCm:39,weightKg:83.3};
test('estima gordura com as medidas da própria avaliação, sem balança de bioimpedância',()=>{
 const x=estimateBodyFatForAssessment(historic,[historic]);
 assert.equal(x.rfm,29.1);
 assert.ok(x.navy>0&&x.navy<75);
 assert.equal(x.fatMassKg,24.2);
 assert.equal(x.leanMassKg,59.1);
 assert.equal(x.heightSource,'mesma avaliação');
});
test('não mistura cintura ou pescoço de avaliações diferentes; permite altura anterior',()=>{
 const recent={id:'new',date:'2026-11-18',heightCm:null,waistCm:94,neckCm:null,weightKg:82.5};
 const x=estimateBodyFatForAssessment(recent,[historic,recent]);
 assert.equal(x.rfm,27.2);
 assert.equal(x.navy,null);
 assert.equal(x.heightSource,'avaliação anterior');
 assert.equal(x.fatMassKg,22.4);
 assert.deepEqual(estimatesFor([recent,historic]),{rfm:27.2,navy:estimateBodyFatForAssessment(historic,[historic]).navy});
 assert.deepEqual(estimatedBodyFatSeries([recent,historic]),[{date:'2026-11-16',value:29.1},{date:'2026-11-18',value:27.2}]);
});
test('não infere gordura de outras circunferências sem altura e cintura',()=>{
 const noWaist={date:'2026-11-18',heightCm:173,waistCm:null,neckCm:39,weightKg:83.3,armRightCm:34,thighRightCm:53};
 assert.deepEqual(estimateBodyFatForAssessment(noWaist,[]),{rfm:null,navy:null,fatMassKg:null,leanMassKg:null,heightSource:'mesma avaliação'});
 assert.deepEqual(estimatedBodyFatSeries([noWaist]),[]);
});

test('estimativa feminina considera sexo e quadril, não aplica fórmula masculina indevidamente',async()=>{
 const m={id:'female',date:'2026-11-18',heightCm:165,waistCm:75,hipsCm:98,neckCm:33,weightKg:65};
 const {estimateNavyFemale}=await import('../measurements.js');
 const estimated=estimateBodyFatForAssessment(m,[m],'female');
 assert.equal(estimated.rfm,32.0);
 assert.equal(estimated.navy,estimateNavyFemale(165,75,98,33));
 assert.ok(estimated.navy>0&&estimated.navy<75);
 const unknown=estimateBodyFatForAssessment(m,[m],null);
 assert.equal(unknown.rfm,null);
 assert.equal(unknown.navy,null);
});
