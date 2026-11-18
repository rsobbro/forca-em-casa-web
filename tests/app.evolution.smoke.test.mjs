import test from 'node:test';
import assert from 'node:assert/strict';
test('aba Evolução permite confirmar seg/ter, contabilizar 2/5 e manter séries em zero',async()=>{
 const elements={},handlers={},listeners={};
 const el=id=>elements[id] ||= {id,innerHTML:'',textContent:'',hidden:false,value:'',dataset:{},
  addEventListener(type,fn){if(id==='#app-content')handlers[type]=fn},click(){}};
 globalThis.document={querySelector:el,querySelectorAll:()=>[],createElement:()=>({click(){},remove(){}}),body:{append(){}}};
 const data={};
 globalThis.localStorage={getItem:k=>data[k]||null,setItem:(k,v)=>{data[k]=v}};
 const originalNow=Date;
 // Test the real date-dependent UI using the helper exposed through a fake Date.
 class MockDate extends originalNow{constructor(...args){super(...(args.length?args:['2026-11-18T12:00:00-03:00']));}static now(){return new originalNow('2026-11-18T15:00:00.000Z').getTime();}}
 globalThis.Date=MockDate;
 globalThis.location={hash:'#evolucao',protocol:'file:'};
 globalThis.window={addEventListener:(name,fn)=>listeners[name]=fn,scrollTo(){}};
 globalThis.confirm=()=>true;
 try{
  await import('../app.js');
  assert.match(el('#app-content').innerHTML,/Este navegador não possui registros/);
  assert.match(el('#app-content').innerHTML,/Mesclar backup JSON/);
  assert.match(el('#app-content').innerHTML,/Confirmar os 2 treinos/);
  const click=(action,props={})=>handlers.click({target:{closest:()=>({dataset:{action,...props}})}});
  click('mark-past-week');
  const state=JSON.parse(data['forca-em-casa-v1']);
  assert.equal(state.sessions.length,2);
  assert.equal(state.sessions.find(s=>s.dayId==='A').date,'2026-11-16');
  assert.equal(state.sessions.find(s=>s.dayId==='B').date,'2026-11-17');
  assert.match(el('#app-content').innerHTML,/2\/5/);
  assert.match(el('#app-content').innerHTML,/2 treino\(s\)/);
  assert.match(el('#app-content').innerHTML,/Séries efetivas/);
  assert.equal(state.sessions.reduce((sum,s)=>sum+Object.keys(s.sets).length,0),0);
 }finally{globalThis.Date=originalNow;}
});
