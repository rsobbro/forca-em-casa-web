import test from 'node:test';
import assert from 'node:assert/strict';

test('editar avaliação altera medidas do mesmo ID sem duplicar histórico e preserva fotografias',async()=>{
 const elements={},handlers={};
 const el=selector=>elements[selector] ||= {innerHTML:'',textContent:'',hidden:false,value:'',dataset:{},
  addEventListener(type,handler){if(selector==='#app-content')handlers[type]=handler},
  querySelector(){return null},querySelectorAll(){return []},click(){}};
 const original={version:1,profile:{startDate:'2026-11-16'},
  sessions:[],activities:[],measurements:[{id:'eval-1',date:'2026-11-18',weightKg:83.3,
   heightCm:173,waistCm:99,notes:'Primeiro registro'}],
  active:null,deleted:{sessions:[],activities:[],measurements:[]}};
 const data={'forca-em-casa-v1':JSON.stringify(original)};
 globalThis.document={querySelector:el,querySelectorAll:()=>[],body:{append(){}},createElement:()=>({click(){},remove(){}})};
 globalThis.localStorage={getItem:k=>data[k]||null,setItem:(k,v)=>{data[k]=v},removeItem:k=>delete data[k]};
 globalThis.location={hash:'#avaliacao',protocol:'file:'};
 globalThis.window={addEventListener(){},scrollTo(){}};
 globalThis.confirm=()=>true;
 await import('../app.js');
 assert.match(el('#app-content').innerHTML,/Editar medidas e fotos/);
 const click=(action,id)=>handlers.click({target:{closest:()=>({dataset:{action,id}})}});
 click('edit-assessment','eval-1');
 assert.match(el('#app-content').innerHTML,/Mesmo registro, sem duplicação/);
 el('#edit-body-date').value='2026-11-18';
 el('#edit-body-weightKg').value='82,6';
 el('#edit-body-heightCm').value='173';
 el('#edit-body-waistCm').value='96';
 el('#edit-body-notes').value='Medição revisada';
 click('save-assessment-edit','eval-1');
 await Promise.resolve();
 const updated=JSON.parse(data['forca-em-casa-v1']);
 assert.equal(updated.measurements.length,1);
 assert.equal(updated.measurements[0].id,'eval-1');
 assert.equal(updated.measurements[0].weightKg,82.6);
 assert.equal(updated.measurements[0].waistCm,96);
 assert.equal(updated.measurements[0].notes,'Medição revisada');
 assert.deepEqual(updated.deleted.measurements,[]);
});
