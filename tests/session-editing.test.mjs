import test from 'node:test';
import assert from 'node:assert/strict';
test('série com campo vazio não é concluída e mostra aviso local; digitação é salva',async()=>{
 const elements={},handlers={},winListeners={};
 const makeNode=()=>({textContent:'',hidden:true,style:{},classList:{toggle(){},remove(){},add(){}},setAttribute(){},addEventListener(){},focus(){this.focused=true}});
 const feedback=makeNode(),repInput=makeNode(),progress=makeNode(),progressPct=makeNode(),progressFill=makeNode(),finishBtn=makeNode();
 const row={classList:{toggle(){},add(){this.invalid=true},remove(){this.invalid=false}},querySelectorAll:()=>[],querySelector:()=>repInput};
 const group={querySelector:()=>feedback};
 const button={dataset:{action:'set-done',exid:'a1',index:'0'},closest(sel){return sel==='tr'?row:sel==='.session-exercise'?group:null},classList:{toggle(){}},setAttribute(){}};
 const els={ '#app-content': {innerHTML:'',hidden:false,addEventListener(type,cb){handlers[type]=cb},querySelector(selector){return {'[data-workout-progress-count]':progress,'[data-workout-progress-pct]':progressPct,'[data-workout-progress-fill]':progressFill,'[data-finish-button]':finishBtn}[selector]||null}},
 '#toast':{hidden:true,textContent:''},
 '#timer':{hidden:true,addEventListener(){}},
 '#breadcrumb-label':{textContent:''},'#top-date':{textContent:''}
 };
 globalThis.document={querySelector:selector=>els[selector]??(elements[selector]||=makeNode()),querySelectorAll:()=>[],createElement:()=>({click(){},remove(){}}),body:{append(){}}};
 const store={};
 globalThis.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
 globalThis.location={hash:'#dashboard',protocol:'file:'};
 globalThis.window={addEventListener:(k,cb)=>{winListeners[k]=cb},scrollTo(){}};
 globalThis.confirm=()=>true;
 await import('../app.js');
 const click=(action,props={})=>handlers.click({target:{closest:()=>({dataset:{action,...props}})}});
 click('view-plans');
 click('start',{day:'A'});
 const original=els['#app-content'].innerHTML;
 handlers.click({target:{closest:()=>button}});
 let active=JSON.parse(store['forca-em-casa-v1']).active;
 assert.equal(active.sets.a1[0].done,false);
 assert.equal(feedback.hidden,false);
 assert.match(feedback.textContent,/repetições realizadas/);
 assert.equal(repInput.focused,true);
 const type=(key,value)=>handlers.input({target:{matches:()=>true,dataset:{edit:key,exid:'a1',index:'0'},value,closest:()=>group}});
 type('reps','12');type('load','20 kg / azul');
 active=JSON.parse(store['forca-em-casa-v1']).active;
 assert.equal(active.sets.a1[0].reps,'12');
 assert.equal(active.sets.a1[0].load,'20 kg / azul');
 handlers.click({target:{closest:()=>button}});
 active=JSON.parse(store['forca-em-casa-v1']).active;
 assert.equal(active.sets.a1[0].done,true);
 assert.match(progress.textContent,/1\/\d+ séries/);
 assert.equal(feedback.hidden,true);
 assert.match(finishBtn.innerHTML,/Finalizar treino/);
 assert.equal(els['#app-content'].innerHTML,original,'A ficha não deve ser inteiramente redesenhada ao marcar uma série');
});
