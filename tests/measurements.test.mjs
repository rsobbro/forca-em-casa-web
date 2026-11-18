import test from 'node:test';
import assert from 'node:assert/strict';
import {BODY_FIELDS,parsePtNumber,validBodyMeasurement,seriesFor,compareMeasure,calculateBMI} from '../measurements.js';
const empty=()=>Object.fromEntries(BODY_FIELDS.map(x=>[x.key,null]));
const sample=(id,date,overrides={})=>({id,date,notes:'',...empty(),...overrides});
test('campos corporais e formato decimal brasileiro',()=>{
 assert.ok(BODY_FIELDS.length>=10);
 assert.equal(parsePtNumber('85,3'),85.3);
 assert.equal(parsePtNumber(''),null);
 assert.ok(Number.isNaN(parsePtNumber('85,3,2')));
 assert.ok(Number.isNaN(parsePtNumber('<script>')));
 assert.ok(validBodyMeasurement(sample('a','2026-11-16',{weightKg:85.3})));
 assert.equal(validBodyMeasurement(sample('b','2026-11-16',{heightCm:173})),false);
 assert.equal(validBodyMeasurement(sample('c','2026-11-16',{waistCm:92})),true);
 assert.equal(validBodyMeasurement(sample('d','2026-11-16',{weightKg:500})),false);
 assert.equal(validBodyMeasurement(sample('e','2026-02-30',{weightKg:85})),false);
 assert.equal(validBodyMeasurement(sample('f','2026-11-16',{weightKg:85,notes:'x'.repeat(501)})),false);
});
test('comparativo entre primeira e última medição não inventa valores',()=>{
 const arr=[sample('2','2026-11-18',{weightKg:84,waistCm:90}),sample('1','2026-11-16',{weightKg:85,waistCm:92,heightCm:173})];
 assert.deepEqual(compareMeasure(arr,'weightKg'),{first:85,last:84,delta:-1,date:'2026-11-18'});
 assert.deepEqual(compareMeasure(arr,'waistCm'),{first:92,last:90,delta:-2,date:'2026-11-18'});
 assert.equal(compareMeasure(arr,'chestCm').delta,null);
 assert.equal(seriesFor(arr,'weightKg').length,2);
 assert.equal(calculateBMI(arr),28.1);
});
