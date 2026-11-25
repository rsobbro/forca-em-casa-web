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

test('celular novo recupera treinos avaliações e fotos sem publicar histórico vazio',async()=>{
 const remote={version:1,profile:{startDate:'2026-11-16'},
  sessions:[{id:'pc-workout',date:'2026-11-16',dayId:'A',manual:true,sets:{}}],
  activities:[{id:'pc-run',date:'2026-11-17',type:'corrida',durationMin:25}],
  measurements:[{id:'pc-assessment',date:'2026-11-18',weightKg:83.3,notes:''}],
  active:null,deleted:{sessions:[],activities:[],measurements:[]}};
 const stats={writes:0,downloads:0,saved:0};
 const localPhotos={};
 const phone=new GoogleDriveController({clientId:CLIENT_ID,storage:storage(),
  photos:{
   getAssessmentPhotos:async id=>localPhotos[id]||{},
   saveAssessmentPhotos:async(id,photos)=>{localPhotos[id]={...(localPhotos[id]||{}),...photos};stats.saved++;}
  }});
 const account={sub:'12345678901234567890',permissionId:'owner-google',
  email:'pessoa@gmail.com',emailAddress:'pessoa@gmail.com',email_verified:true};
 phone.identity=account;phone.user=account;phone.folders={root:'root',data:'data',photos:'photos'};
 phone.client={
  readHistory:async()=>structuredClone(remote),
  listPhotos:async()=>[{id:'photo1',name:'pc-assessment__front.jpg'}],
  downloadPhoto:async()=>{stats.downloads++;return new Blob(['sample'],{type:'image/jpeg'})},
  writeHistory:async()=>{stats.writes++}
 };
 const snapshot=JSON.stringify(validEmpty);
 const result=await phone.recover(validEmpty);
 assert.equal(JSON.stringify(validEmpty),snapshot,'A base local original não pode ser alterada durante recuperação');
 assert.equal(stats.writes,0,'Recuperação nunca escreve no Drive');
 assert.equal(result.db.sessions.length,1);
 assert.equal(result.db.activities.length,1);
 assert.equal(result.db.measurements.length,1);
 assert.deepEqual(result.remoteCounts,{sessions:1,activities:1,measurements:1});
 assert.equal(stats.downloads,1);
 assert.equal(stats.saved,1);
 assert.equal(result.photos.downloaded,1);
 assert.equal(result.needsUpload,false);
 assert.equal(phone.lastSync,null,'Leitura remota não é upload');
 assert.ok(phone.lastRead);
});
test('Drive sem histórico não substitui os dados do celular nem cria arquivo vazio',async()=>{
 const store=storage(),phone=new GoogleDriveController({clientId:CLIENT_ID,storage:store});
 const account={sub:'12345678901234567890',permissionId:'owner-google',email:'pessoa@gmail.com',email_verified:true};
 phone.identity=account;phone.user=account;phone.folders={data:'data',photos:'photos'};
 let writes=0;
 phone.client={readHistory:async()=>null,writeHistory:async()=>{writes++},listPhotos:async()=>[]};
 const original={...validEmpty,sessions:[{id:'local-workout',date:'2026-11-18',dayId:'A',sets:{},manual:true}]};
 await assert.rejects(phone.recover(original),/Nenhum historico.json/);
 assert.equal(writes,0);
 assert.equal(original.sessions.length,1);
 assert.equal(store.getItem(DRIVE_OWNER_KEY),null);
});
test('mesclagem remota adiciona dados sem apagar registros locais diferentes',async()=>{
 const remote={...validEmpty,sessions:[{id:'pc-workout',date:'2026-11-16',dayId:'A',sets:{},manual:true}]};
 const local={...validEmpty,sessions:[{id:'phone-workout',date:'2026-11-19',dayId:'B',sets:{},manual:true}]};
 const phone=new GoogleDriveController({clientId:CLIENT_ID,storage:storage(),
  photos:{getAssessmentPhotos:async()=>({}),saveAssessmentPhotos:async()=>{}}});
 const account={sub:'12345678901234567890',permissionId:'owner-google',email:'pessoa@gmail.com',email_verified:true};
 phone.identity=account;phone.user=account;phone.folders={data:'data',photos:'photos'};
 let writes=0;
 phone.client={readHistory:async()=>remote,listPhotos:async()=>[],writeHistory:async()=>{writes++}};
 const recovered=await phone.recover(local);
 assert.deepEqual(new Set(recovered.db.sessions.map(x=>x.id)),new Set(['phone-workout','pc-workout']));
 assert.equal(recovered.needsUpload,true);
 assert.equal(writes,0);
 assert.equal(local.sessions.length,1);
});
test('recuperação mantém dados estruturados mesmo se uma foto falhar',async()=>{
 const remote={...validEmpty,measurements:[{id:'pc-assessment',date:'2026-11-18',weightKg:83.3}]};
 const phone=new GoogleDriveController({clientId:CLIENT_ID,storage:storage(),
  photos:{getAssessmentPhotos:async()=>({}),saveAssessmentPhotos:async()=>{throw Error('Falha IndexedDB')}}});
 const account={sub:'12345678901234567890',permissionId:'owner-google',email:'pessoa@gmail.com',email_verified:true};
 phone.identity=account;phone.user=account;phone.folders={data:'data',photos:'photos'};
 phone.client={readHistory:async()=>remote,listPhotos:async()=>[{id:'photo',name:'pc-assessment__front.jpg'}],
  downloadPhoto:async()=>new Blob(['photo'],{type:'image/jpeg'})};
 const result=await phone.recover(validEmpty);
 assert.equal(result.db.measurements.length,1);
 assert.equal(result.photos.errors,1);
});
test('interfaces oferecem recuperação do Drive mesmo após cadastro existente',async()=>{
 const {readFileSync}=await import('node:fs');
 const gate=readFileSync(new URL('../gate.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(gate,/data-gate="recover"/);
 assert.match(gate,/await controller\.recover\(local\)/);
 assert.match(app,/data-action="drive-recover"/);
 assert.match(app,/async function recoverCloud\(/);
 assert.match(app,/cloud\.recover\(db\)/);
 assert.match(app,/function cloudRecoveryPanel\(/);
 assert.match(app,/markCloudPending\(\);scheduleCloudSync\(\)/);
});
