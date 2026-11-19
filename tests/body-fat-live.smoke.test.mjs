import test from 'node:test';
import assert from 'node:assert/strict';

test('recalcula automaticamente ao digitar altura cintura peso e pescoço sem salvar',async()=>{
 const el={},listeners={},handlers={};
 const node=(id)=>el[id]||=({id,value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},addEventListener(type,fn){if(id==='#app-content')handlers[type]=fn},click(){}});
 const liveKeys=['rfm','navy','fatMassKg','leanMassKg'];
 const liveFields=Object.fromEntries(liveKeys.map(x=>[x,{textContent:'—'}]));
 const status={textContent:''};
 const liveRoot={querySelector(selector){
   const m=selector.match(/^\[data-live-body-fat="(.+)"\]$/);
   if(m)return liveFields[m[1]];
   if(selector==='[data-live-body-fat-status]')return status;
   return null;
 }};
 const content=node('#app-content');
 content.querySelector=(sel)=>sel==='.body-fat-live'?liveRoot:null;
 content.querySelectorAll=()=>[];
 globalThis.document={querySelector:node,querySelectorAll:()=>[],createElement:()=>({click(){},remove(){}}),body:{append(){}}};
 const data={};
 globalThis.localStorage={getItem:k=>data[k]||null,setItem:(k,v)=>{data[k]=v}};
 globalThis.location={hash:'#avaliacao',protocol:'file:'};
 globalThis.window={addEventListener:(name,fn)=>listeners[name]=fn,scrollTo(){}};
 globalThis.confirm=()=>true;
 await import('../app.js');
 assert.match(content.innerHTML,/Estimativa automática com as medidas preenchidas/);
 assert.equal(liveFields.rfm.textContent,'—');
 const change=(id,value)=>{
   node('#'+id).value=value;
   handlers.input({target:{id,matches:()=>false}});
 };
 change('body-heightCm','1,73');
 change('body-waistCm','99');
 assert.equal(liveFields.rfm.textContent,'29,1%');
 assert.equal(liveFields.navy.textContent,'—');
 change('body-weightKg','83,300');
 assert.equal(liveFields.fatMassKg.textContent,'24,2 kg');
 assert.equal(liveFields.leanMassKg.textContent,'59,1 kg');
 change('body-neckCm','39');
 assert.match(liveFields.navy.textContent,/\d+,?\d*%/);
 assert.match(status.textContent,/RFM e US Navy calculados/);
 // The medical/exam field must never be filled from a statistical estimate.
 assert.equal(node('#body-bodyFatPct').value,'');
 node('#body-date').value='2026-11-16';
 handlers.click({target:{closest:()=>({dataset:{action:'save-assessment'}})}});
 const stored=JSON.parse(data['forca-em-casa-v1']);
 assert.equal(stored.measurements.length,1);
 assert.equal(stored.measurements[0].heightCm,173);
 assert.equal(stored.measurements[0].waistCm,99);
 assert.equal(stored.measurements[0].weightKg,83.3);
 assert.equal(stored.measurements[0].bodyFatPct,null);
 assert.match(content.innerHTML,/RFM estimado: 29,1%/);
});
