import test from 'node:test';
import assert from 'node:assert/strict';
import {PROGRAM,BASE_PROGRAM} from '../plan.js';
import {validSetup,personalizedProgram} from '../personal-training.js';
import {validMeal,validWater,mealTotals,dailyNutrition,dailyWater,lookupOpenFoodFacts} from '../nutrition.js';
import {importWatchCsv,SMARTWATCH_CSV_TEMPLATE} from '../wearables.js';
import {activitySummary,validActivity} from '../activities.js';
import {mergeDriveHistories} from '../google-drive-controller.js';
import {normalizeCloudData,normalizeDeleted} from '../google-drive-sync.js';
import {readFileSync} from 'node:fs';

const setup=(overrides={})=>({
 complete:true,goal:'hipertrofia',daysPerWeek:3,sessionsPerDay:1,setsPerGroup:2,
 equipment:[{id:'device-123',brand:'TOPSAND',model:'Kit extensores',photoConfirmed:true,features:['TOPSAND_TUBES']}],
 assessmentId:'baseline-123',...overrides
});
test('primeiro acesso cria plano apenas com funcionalidades confirmadas',()=>{
 const p=personalizedProgram(PROGRAM,setup());
 assert.equal(validSetup(setup()),true);
 assert.equal(p.days.length,3);
 assert.equal(p.weeklyTarget,3);
 for(const day of p.days){
  assert.ok(day.exercises.length>=1);
  for(const ex of day.exercises){
   assert.ok(ex.requires.every(k=>['TOPSAND_TUBES','FLOOR'].includes(k)));
   assert.equal(ex.sets,2);
   assert.ok(ex.setup.length>0);
  }
 }
 assert.equal(BASE_PROGRAM.days.length,5,'Plano-base original precisa permanecer intacto.');
});
test('usuário pode solicitar duas sessões curtas por dia sem duplicar IDs',()=>{
 const p=personalizedProgram(BASE_PROGRAM,setup({daysPerWeek:2,sessionsPerDay:2,setsPerGroup:3}));
 assert.equal(p.weeklyTarget,4);
 assert.equal(p.days.length,4);
 assert.equal(new Set(p.days.map(x=>x.id)).size,4);
 assert.equal(new Set(p.days.map(x=>x.weekday)).size,2);
 assert.ok(p.days.every(x=>x.exercises.length>=1&&x.exercises.every(e=>e.sets===3)));
});
test('inventário não identificado gera apenas exercícios de solo, sem presumir funções do aparelho',()=>{
 const p=personalizedProgram(BASE_PROGRAM,setup({
  daysPerWeek:1,equipment:[{id:'device-unknown',brand:'Fabricante',model:'Equipamento não conhecido',photoConfirmed:true,features:['OTHER_UNVERIFIED']}]
 }));
 assert.ok(p.days[0].exercises.every(e=>e.requires.every(k=>k==='FLOOR')));
 assert.equal(validSetup(setup({equipment:[{id:'bad',brand:'',model:'Sem modelo',photoConfirmed:false,features:['WCT_PRESS']}]})),false);
});
test('refeição com dois alimentos calcula energia e macros pela porção declarada',()=>{
 const meal={id:'meal-01',kind:'almoco',date:'2026-11-23',notes:'',
 foods:[
  {name:'Alimento A',grams:150,kcalPer100:100,proteinPer100:5,carbsPer100:20,fatPer100:1,source:'rótulo'},
  {name:'Alimento B',grams:80,kcalPer100:250,proteinPer100:10,carbsPer100:4,fatPer100:20,source:'tabela'}
 ]};
 assert.equal(validMeal(meal),true);
 assert.deepEqual(mealTotals(meal),{kcal:350,proteinG:15.5,carbsG:33.2,fatG:17.5});
 assert.equal(dailyNutrition([meal],'2026-11-23').kcal,350);
 assert.equal(dailyNutrition([meal],'2026-11-22').meals,0);
 assert.equal(validMeal({...meal,foods:[{...meal.foods[0],grams:0}]}),false);
});
test('água contabiliza os registros por data sem prescrever meta automática',()=>{
 const records=[{id:'a',date:'2026-11-23',ml:250},{id:'b',date:'2026-11-23',ml:500},{id:'c',date:'2026-11-22',ml:200}];
 assert.ok(records.every(validWater));
 assert.equal(dailyWater(records,'2026-11-23'),750);
 assert.equal(dailyWater(records,'2026-11-22'),200);
 assert.equal(validWater({...records[0],ml:-100}),false);
});
test('Open Food Facts retorna nutrientes por 100 g, não infere valores por imagem',async()=>{
 const fake=async(url)=>{
  assert.match(url,/api\/v2\/product\/7891234567890/);
  return new Response(JSON.stringify({status:1,product:{product_name:'Produto alimentício',
   nutriments:{'energy-kcal_100g':150,proteins_100g:5,carbohydrates_100g:24,fat_100g:3}}}),
   {status:200,headers:{'Content-Type':'application/json'}});
 };
 const food=await lookupOpenFoodFacts('7891234567890',fake);
 assert.equal(food.kcalPer100,150);
 assert.equal(food.grams,100);
 assert.equal(food.source,'Open Food Facts');
 assert.equal(food.proteinPer100,5);
 await assert.rejects(lookupOpenFoodFacts('123',fake),/código de barras/);
});
test('importação CSV de smartwatch gera atividades e FC/calorias separadas',()=>{
 const result=importWatchCsv(SMARTWATCH_CSV_TEMPLATE);
 assert.equal(result.length,1);
 const x=result[0];
 assert.ok(validActivity(x));
 assert.equal(x.date,'2026-11-23');
 assert.equal(x.type,'corrida');
 assert.equal(x.durationMin,35);
 assert.equal(x.distanceKm,5.1);
 assert.equal(x.caloriesKcal,320);
 assert.equal(x.heartRateAvg,135);
 assert.equal(x.heartRateMax,164);
 assert.equal(x.steps,6300);
 const summary=activitySummary(result,'2026-11-23','2026-11-29');
 assert.equal(summary.count,1);
 assert.equal(summary.caloriesKcal,320);
 assert.equal(summary.withHeartRate,1);
});
test('importação não duplica atividades idênticas e rejeita FC incompatível',()=>{
 assert.equal(importWatchCsv(SMARTWATCH_CSV_TEMPLATE+SMARTWATCH_CSV_TEMPLATE.split('\n')[1]+'\n').length,1);
 const invalid='data;atividade;duracao_min;distancia_km;calorias_kcal;fc_media;fc_max;passos\n2026-11-23;corrida;30;5;200;180;140;6000';
 assert.throws(()=>importWatchCsv(invalid),/FC média maior/);
});
test('Drive preserva refeições, água e plano pessoal na mesclagem entre dispositivos',()=>{
 const previous={version:1,profile:{startDate:'2026-11-16',setup:setup()},
  sessions:[],activities:[],measurements:[],meals:[
  {id:'meal',date:'2026-11-23',kind:'almoco',foods:[{name:'A',grams:100,kcalPer100:100}],notes:''}
 ],water:[{id:'water',date:'2026-11-23',ml:300}],active:null};
 const initial={version:1,profile:{startDate:'2026-11-23'},sessions:[],activities:[],measurements:[],meals:[],water:[],active:null};
 const restored=mergeDriveHistories(initial,previous);
 assert.equal(restored.conflicts.length,0);
 assert.equal(restored.db.meals.length,1);
 assert.equal(restored.db.water.length,1);
 assert.equal(restored.db.profile.setup.daysPerWeek,3);
 const normalized=normalizeCloudData(restored.db);
 assert.equal(normalized.meals.length,1);
 assert.equal(normalized.water.length,1);
 assert.deepEqual(normalizeDeleted(null),{sessions:[],activities:[],measurements:[],meals:[],water:[]});
});
test('telas e ações estão integradas, sem fingir reconhecimento de imagens',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const cache=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(index,/href="#nutricao"/);
 assert.match(index,/href="#agua"/);
 assert.match(app,/function onboardingPage\(/);
 assert.match(app,/function saveAssessmentEdit\(/);
 assert.match(app,/function nutritionPage\(/);
 assert.match(app,/function waterPage\(/);
 assert.match(app,/function saveWater\(/);
 assert.match(app,/playRestSound\(\)/);
 assert.match(app,/importWatchCsv\(await file.text\(\)\)/);
 assert.match(app,/function completeOnboarding\(/);
 assert.match(app,/sem reconhecimento automático/);
 for(const mod of ['nutrition.js','wearables.js','personal-training.js','rest-alert.js'])
  assert.ok(cache.includes(mod));
});
