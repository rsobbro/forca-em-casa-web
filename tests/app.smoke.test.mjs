import test from 'node:test';
import assert from 'node:assert/strict';

test('fluxo funcional: painel → treino → série → histórico', async()=>{
  const elements={};
  const handlers={};
  const windowListeners={};
  const el=id=>elements[id] ||= {
    id,innerHTML:'',textContent:'',hidden:false,value:'',dataset:{},
    addEventListener(type,callback){if(id==='#app-content')handlers[type]=callback},
    click(){}
  };
  globalThis.document={
    querySelector:el,
    querySelectorAll:()=>[],
    createElement:()=>({click(){},remove(){}}),
    body:{append(){}}
  };
  const data={};
  globalThis.localStorage={getItem:key=>data[key]||null,setItem:(key,value)=>{data[key]=value}};
  globalThis.location={hash:'#dashboard',protocol:'file:'};
  globalThis.window={addEventListener:(name,fn)=>windowListeners[name]=fn,scrollTo(){}};
  globalThis.confirm=()=>true;
  await import('../app.js');
  assert.match(el('#app-content').innerHTML,/Seu treino, sua evolução/);
  const click=(action,extra={})=>handlers.click({target:{closest:()=>({dataset:{action,...extra}})}});
  click('view-plans');
  assert.match(el('#app-content').innerHTML,/Meus treinos/);
  click('start',{day:'A'});
  assert.match(el('#app-content').innerHTML,/SESSÃO ATIVA/);
  const change=(edit,value)=>handlers.focusout({target:{matches:()=>true,dataset:{edit,exid:'a1',index:'0'},value}});
  change('reps','10');change('load','20 kg');change('rpe','7');
  click('set-done',{exid:'a1',index:'0'});
  assert.match(el('#app-content').innerHTML,/1\/\d+ séries/);
  click('finish');
  assert.match(el('#app-content').innerHTML,/Histórico de sessões/);
  const stored=JSON.parse(data['forca-em-casa-v1']);
  assert.equal(stored.sessions.length,1);
  assert.equal(stored.sessions[0].sets.a1[0].load,'20 kg');
  assert.equal(stored.sessions[0].sets.a1[0].reps,'10');
});
