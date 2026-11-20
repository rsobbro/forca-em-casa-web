import test from 'node:test';
import assert from 'node:assert/strict';
import {GoogleDriveController,DRIVE_OWNER_KEY,mergeDriveHistories} from '../google-drive-controller.js';
const CLIENT_ID='123456789012-example.apps.googleusercontent.com';
const identity={accounts:{oauth2:{initTokenClient(options){return {requestAccessToken(){options.callback({access_token:'my-token',scope:options.scope})}}}}}};
const storage=(entries={})=>{const m=new Map(Object.entries(entries));return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),has:k=>m.has(k)}};
const validEmpty={version:1,profile:{startDate:'2026-11-16'},sessions:[],activities:[],measurements:[],active:null};
test('conectar não envia nada antes de consentimento, e bloqueia outra conta no mesmo navegador',async()=>{
 let calls=0;
 const fetchImpl=async(url)=>{
  calls++;
  if(url.includes('/about?'))return new Response(JSON.stringify({user:{permissionId:'different-owner',emailAddress:'someone@gmail.com'}}),{status:200});
  if(url.includes('/userinfo'))return new Response(JSON.stringify({sub:'12345678901234567890',email:'someone@gmail.com',email_verified:true}),{status:200});
  throw new Error('Sem permissão para chamar mais APIs.');
 };
 const store=storage({[DRIVE_OWNER_KEY]:'original-owner'});
 const controller=new GoogleDriveController({clientId:CLIENT_ID,storage:store,fetchImpl,googleApi:identity});
 await controller.authenticate();
 assert.equal(calls,1); // login não solicita Drive
 await assert.rejects(controller.connect(),/outra conta/);
 assert.equal(calls,3);
 assert.equal(controller.connected,false);
});
test('não declara conexão ativa sem OAuth Client ID válido',async()=>{
 const controller=new GoogleDriveController({clientId:'',storage:storage(),googleApi:identity});
 await assert.rejects(controller.authenticate(),/Client ID/);
 await assert.rejects(controller.connect(),/Primeiro faça login/);
 assert.equal(controller.connected,false);
});

test('a exclusão num dispositivo não ressuscita quando outro tem registro antigo',()=>{
 const existing={...validEmpty,sessions:[{id:'one',date:'2026-11-16',dayId:'A',sets:{},manual:true}]};
 const removed={...validEmpty,deleted:{sessions:['one'],activities:[],measurements:[]}};
 const output=mergeDriveHistories(removed,existing,existing);
 assert.equal(output.db.sessions.length,0);
 assert.deepEqual(output.db.deleted.sessions,['one']);
 assert.equal(output.conflicts.length,0);
});
test('uma edição local após o último sync é aceita quando o cloud não mudou',()=>{
 const original={id:'one',date:'2026-11-16',dayId:'A',sets:{a1:[{done:true,reps:'10'}]}};
 const updated={...original,sets:{a1:[{done:true,reps:'12'}]}};
 const base={...validEmpty,sessions:[original]};
 const local={...validEmpty,sessions:[updated]};
 const output=mergeDriveHistories(local,base,base);
 assert.equal(output.conflicts.length,0);
 assert.equal(output.db.sessions[0].sets.a1[0].reps,'12');
});
test('não sobrescreve alterações simultâneas do mesmo registro',()=>{
 const make=reps=>({...validEmpty,sessions:[{id:'one',date:'2026-11-16',dayId:'A',sets:{a1:[{done:true,reps}]}}]});
 const output=mergeDriveHistories(make('11'),make('12'),make('10'));
 assert.equal(output.conflicts.length,1);
 assert.equal(output.conflicts[0].section,'sessions');
});
test('preserva histórico do Drive em um celular vazio na primeira conexão',()=>{
 const cloud={...validEmpty,sessions:[{id:'one',date:'2026-11-16',dayId:'A',sets:{},manual:true}]};
 const output=mergeDriveHistories(validEmpty,cloud);
 assert.equal(output.conflicts.length,0);
 assert.equal(output.db.sessions.length,1);
});

test('não permite domínio não-Gmail mesmo quando o token OAuth é válido',async()=>{
 let posts=0;
 const fetchImpl=async(url,options={})=>{
  if(options.method==='POST')posts++;
  if(url.includes('/about?'))return new Response(JSON.stringify({user:{permissionId:'owner',emailAddress:'teste@empresa.com'}}),{status:200});
  if(url.includes('/userinfo'))return new Response(JSON.stringify({sub:'12345678901234567890',email:'teste@empresa.com',email_verified:true}),{status:200});
  throw new Error('Endpoint inesperado');
 };
 const ctrl=new GoogleDriveController({clientId:CLIENT_ID,storage:storage(),fetchImpl,googleApi:identity});
 await assert.rejects(ctrl.authenticate(),/Somente Gmail verificado/);
 assert.equal(posts,0);
 assert.equal(ctrl.connected,false);
});

test('primeira sincronização preserva contexto de window.confirm e não produz Illegal invocation',async()=>{
 const previous=globalThis.confirm;
 let approvals=0,writes=0;
 globalThis.confirm=function(message){
  assert.equal(this,globalThis,'A função nativa requer contexto Window');
  assert.match(message,/Vincular os dados/);
  approvals++;return true;
 };
 try{
  const store=storage();
  const controller=new GoogleDriveController({
   clientId:CLIENT_ID,storage:store,
   photos:{getAssessmentPhotos:async()=>({}),saveAssessmentPhotos:async()=>{}}
  });
  const account={sub:'12345678901234567890',email:'exemplo@gmail.com',
   email_verified:true,permissionId:'drive-owner-test',emailAddress:'exemplo@gmail.com'};
  controller.identity=account;controller.user=account;
  controller.folders={root:'root',data:'data',photos:'photos'};
  controller.client={
   readHistory:async()=>null,
   listPhotos:async()=>[],
   writeHistory:async(folder,snapshot)=>{
    assert.equal(folder,'data');
    assert.equal(snapshot.measurements.length,1);
    writes++;
   }
  };
  const local={...validEmpty,measurements:[{id:'assessment-test',date:'2026-11-16',weightKg:83.3}]};
  const result=await controller.sync(local);
  assert.equal(approvals,1);
  assert.equal(writes,1);
  assert.equal(store.getItem(DRIVE_OWNER_KEY),account.permissionId);
  assert.equal(result.db.measurements.length,1);
  assert.ok(result.lastSync);
 }finally{
  if(previous===undefined)delete globalThis.confirm;
  else globalThis.confirm=previous;
 }
});
test('o fetch nativo mantém seu receptor Window durante o login Google',async()=>{
 const previous=globalThis.fetch;
 let requested=0;
 globalThis.fetch=function(url,options){
  assert.equal(this,globalThis,'A função nativa requer contexto Window');
  assert.match(url,/oauth2\/v3\/userinfo/);
  assert.match(options.headers.Authorization,/Bearer my-token/);
  requested++;
  return Promise.resolve(new Response(JSON.stringify({
   sub:'12345678901234567890',email:'testador@gmail.com',email_verified:true
  }),{status:200,headers:{'Content-Type':'application/json'}}));
 };
 try{
  const controller=new GoogleDriveController({clientId:CLIENT_ID,storage:storage(),googleApi:identity});
  const result=await controller.authenticate();
  assert.equal(requested,1);
  assert.equal(result.user.email,'testador@gmail.com');
 }finally{
  globalThis.fetch=previous;
 }
});
test('interface reabilita o botão de sincronizar mesmo após uma exceção',async()=>{
 const {readFileSync}=await import('node:fs');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(app,/finally\{\s*cloudBusy=false;[\s\S]*?refreshCloudSyncView\(\);\s*\}/);
});
