import test from 'node:test';
import assert from 'node:assert/strict';
import {BODY_FIELDS,VISIBLE_BODY_FIELDS,BODY_PHOTO_VIEWS,parsePtNumber,normalizeHeightCm,validBodyMeasurement,chestExcursion,estimateRFM,estimateNavyMale,estimatesFor} from '../measurements.js';
test('aceita peso em três casas e altura tanto em metros quanto cm',()=>{
 assert.equal(parsePtNumber('83,300'),83.3);
 assert.equal(normalizeHeightCm(parsePtNumber('1,73')),173);
 assert.equal(normalizeHeightCm(parsePtNumber('173')),173);
 assert.ok(Number.isNaN(parsePtNumber('83,3,00')));
});
test('separa todos os quatro grupos corporais entre direita e esquerda',()=>{
 const keys=VISIBLE_BODY_FIELDS.map(x=>x.key);
 for(const base of ['arm','leg','thigh','calf']){
  assert.ok(keys.includes(base+'RightCm'));
  assert.ok(keys.includes(base+'LeftCm'));
 }
 assert.ok(keys.includes('chestCm'));
 assert.ok(keys.includes('chestExpandedCm'));
 assert.equal(BODY_PHOTO_VIEWS.length,3);
 assert.deepEqual(BODY_PHOTO_VIEWS.map(x=>x.key),['front','back','side']);
 assert.equal(BODY_FIELDS.filter(x=>x.group==='legacy').length,3);
});
test('avaliações antigas com campos de braço genéricos continuam válidas',()=>{
 const old={id:'old',date:'2026-11-16',notes:'',weightKg:83.3,heightCm:173,waistCm:99,chestCm:101,hipsCm:103,armCm:32,thighCm:null,calfCm:null,neckCm:null,bodyFatPct:null};
 assert.ok(validBodyMeasurement(old));
 const fresh={id:'fresh',date:'2026-11-18',notes:'',weightKg:83.3,heightCm:173,waistCm:99,chestCm:101,chestExpandedCm:105,armRightCm:34,armLeftCm:33.5,legRightCm:95,legLeftCm:95,thighRightCm:56,thighLeftCm:55,calfRightCm:37,calfLeftCm:36.5};
 assert.ok(validBodyMeasurement(fresh));
 assert.equal(chestExcursion(fresh),4);
 assert.equal(validBodyMeasurement({...fresh,chestExpandedCm:99}),false);
});
test('RFM é estimativa automática; resultado do US Navy depende de pescoço',()=>{
 assert.equal(estimateRFM(173,99,'male'),29.1);
 assert.equal(estimateRFM(0,99),null);
 assert.equal(estimateNavyMale(173,99,null),null);
 const navy=estimateNavyMale(173,99,39);
 assert.ok(Number.isFinite(navy)&&navy>0&&navy<75);
 const m=[{id:'a',date:'2026-11-18',notes:'',weightKg:83.3,heightCm:173,waistCm:99,neckCm:39}];
 assert.deepEqual(estimatesFor(m),{rfm:29.1,navy});
});
