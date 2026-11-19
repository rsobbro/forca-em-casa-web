import test from 'node:test';
import assert from 'node:assert/strict';
import {GOOGLE_DRIVE_SCOPE,GOOGLE_AUTH_SCOPES,GOOGLE_LOGIN_SCOPES,googleClientIdConfigured,authorizeIdentity,authorizeDrive,createGoogleDriveClient,detectDataConflicts,drivePhotoName,escapeDriveQuery,driveOperation,describeDriveFailure} from '../google-drive-sync.js';

const CLIENT_ID='123456789012-this-is-an-oauth-app.apps.googleusercontent.com';
function mockDrive(){
 let next=0;const files=[];const content=new Map(),calls=[];
 const json=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
 const fetchImpl=async(url,opts={})=>{
  const u=new URL(url),method=opts.method||'GET';calls.push({url:u.toString(),method});
  if(u.pathname==='/drive/v3/about')return json({user:{permissionId:'owner-1',displayName:'Teste',emailAddress:'teste@gmail.com'}});
  if(u.pathname==='/oauth2/v3/userinfo')return json({sub:'12345678901234567890',email:'teste@gmail.com',email_verified:true});
  if(u.pathname==='/drive/v3/files'&&method==='GET'){
   const q=u.searchParams.get('q')||'';
   const parent=q.match(/'([^']+)' in parents/)?.[1];
   const name=q.match(/name = '([^']+)'/)?.[1];
   return json({files:files.filter(f=>(f.parents||[]).includes(parent)&&(!name||f.name===name))});
  }
  if(u.pathname==='/drive/v3/files'&&method==='POST'){
   const meta=JSON.parse(opts.body),file={id:'id-'+(++next),...meta};
   files.push(file);return json(file);
  }
  if(u.pathname.startsWith('/upload/drive/v3/files/')&&method==='PATCH'){
   const id=u.pathname.split('/').at(-1);
   const f=files.find(f=>f.id===id);
   const blob=opts.body instanceof Blob?opts.body:new Blob([opts.body||'']);
   content.set(id,blob);
   f.size=String(blob.size);
   return json({id,name:f.name,size:f.size});
  }
  if(u.pathname.startsWith('/drive/v3/files/')&&method==='PATCH'){
   const id=u.pathname.split('/').at(-1),f=files.find(f=>f.id===id);
   Object.assign(f,JSON.parse(opts.body));return json(f);
  }
  if(u.pathname.startsWith('/drive/v3/files/')&&method==='GET'&&u.searchParams.get('alt')==='media'){
   const id=u.pathname.split('/').at(-1),blob=content.get(id);
   return new Response(blob,{status:200,headers:{'Content-Type':blob.type}});
  }
  return new Response('Not found',{status:404});
 };
 return {fetchImpl,files,content,calls};
}
test('OAuth público configurável e permissão mínima',()=>{
 assert.equal(googleClientIdConfigured(''),false);
 assert.equal(googleClientIdConfigured(CLIENT_ID),true);
 assert.equal(googleClientIdConfigured('secret_here'),false);
 assert.equal(GOOGLE_DRIVE_SCOPE,'https://www.googleapis.com/auth/drive.file');
 assert.equal(drivePhotoName('med-123','front'),'med-123__front.jpg');
 assert.throws(()=>drivePhotoName('../x','front'));
 assert.equal(escapeDriveQuery("O'Brian"),"O\\'Brian");
});
test('autorização usa popup e token em memória sem segredo',async()=>{
 let received;
 const fake={accounts:{oauth2:{initTokenClient(options){received=options;return {requestAccessToken(){options.callback({access_token:'access-abc',scope:options.scope})}}}}}};
 const token=await authorizeDrive(CLIENT_ID,fake);
 assert.equal(token,'access-abc');
 assert.equal(received.scope,GOOGLE_AUTH_SCOPES);
 await assert.rejects(authorizeDrive('',fake),/Client ID/);
});
test('cria pastas e historico.json no Drive do usuário autorizado, lê novamente',async()=>{
 const mock=mockDrive(),client=createGoogleDriveClient('token-abc',{fetchImpl:mock.fetchImpl});
 const about=await client.about();
 assert.equal(about.emailAddress,'teste@gmail.com');
 assert.equal(about.sub,'12345678901234567890');
 assert.equal(about.email_verified,true);
 const dirs=await client.folders();
 assert.ok(dirs.root&&dirs.data&&dirs.photos);
 assert.equal(mock.files.filter(x=>x.mimeType==='application/vnd.google-apps.folder').length,3);
 const again=await client.folders();
 assert.deepEqual(again,dirs);
 const snapshot={version:1,profile:{startDate:'2026-11-16'},sessions:[],activities:[],measurements:[],active:null};
 assert.equal(await client.readHistory(dirs.data),null);
 await client.writeHistory(dirs.data,snapshot);
 assert.deepEqual(await client.readHistory(dirs.data),{...snapshot,deleted:{sessions:[],activities:[],measurements:[]}});
 assert.equal(mock.files.filter(x=>x.name==='historico.json').length,1);
 const profile={version:1,googleSub:'12345678901234567890',googlePermissionId:'owner-1',email:'teste@gmail.com',name:'Nome Teste',birthDate:'1985-04-12',sex:'masculino',consentVersion:'1.0',createdAt:'2026-11-18T10:00:00.000Z',updatedAt:'2026-11-18T10:00:00.000Z'};
 assert.equal(await client.readProfile(dirs.data),null);
 await client.writeProfile(dirs.data,profile);
 assert.deepEqual(await client.readProfile(dirs.data),profile);
 assert.equal(mock.files.filter(x=>x.name==='perfil.json').length,1);
});
test('faz upload de foto privada separada de historico.json, sem sobrescrever sem consentimento',async()=>{
 const mock=mockDrive(),client=createGoogleDriveClient('token',{fetchImpl:mock.fetchImpl});
 const dirs=await client.folders();
 const photo=new Blob(['imagem fake'],{type:'image/jpeg'});
 const r=await client.writePhoto(dirs.photos,'assessment-1','front',photo);
 assert.equal(r.skipped,false);
 const list=await client.listPhotos(dirs.photos);
 assert.equal(list.length,1);
 assert.equal(list[0].name,'assessment-1__front.jpg');
 const again=await client.writePhoto(dirs.photos,'assessment-1','front',photo);
 assert.equal(again.skipped,true);
 assert.equal(again.conflict,false);
 const modified=await client.writePhoto(dirs.photos,'assessment-1','front',new Blob(['outra imagem'],{type:'image/jpeg'}));
 assert.equal(modified.conflict,true);
 assert.equal((await client.downloadPhoto(list[0])).size,photo.size);
});
test('detecta conflitos de mesmo ID sem sobrescrever os dados',()=>{
 const base={sessions:[{id:'a',date:'2026-11-16',sets:{ex:[{done:true,reps:12}]}}],activities:[],measurements:[]};
 assert.deepEqual(detectDataConflicts(base,structuredClone(base)),[]);
 const different=structuredClone(base);different.sessions[0].sets.ex[0].reps=10;
 assert.deepEqual(detectDataConflicts(base,different),[{section:'sessions',id:'a'}]);
});

test('login básico solicita somente openid email profile e não cria pastas',async()=>{
 let scope;
 const google={accounts:{oauth2:{initTokenClient(opts){
  scope=opts.scope;return {requestAccessToken(){opts.callback({access_token:'token-login'})}};
 }}}};
 const identity=await authorizeIdentity(CLIENT_ID,google,async(url,options)=>{
  assert.match(url,/userinfo$/);
  assert.equal(options.headers.Authorization,'Bearer token-login');
  return new Response(JSON.stringify({sub:'12345678901234567890',email:'pessoa@gmail.com',email_verified:true}),{status:200});
 });
 assert.equal(scope,GOOGLE_LOGIN_SCOPES);
 assert.equal(scope.includes('drive.file'),false);
 assert.equal(identity.user.email,'pessoa@gmail.com');
});

test('falha da API desativada identifica a etapa e mantém o motivo visível',async()=>{
 const client=createGoogleDriveClient('test-token',{fetchImpl:async()=>new Response(JSON.stringify({
  error:{code:403,status:'PERMISSION_DENIED',message:'Google Drive API has not been used in project 949578637962 before or it is disabled.',
  details:[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason:'SERVICE_DISABLED'}]}
 }),{status:403,headers:{'Content-Type':'application/json'}})});
 await assert.rejects(client.folders(),err=>{
  assert.match(err.message,/busca de pastas e arquivos/);
  assert.match(err.message,/API não está ativada/);
  assert.match(err.message,/HTTP 403/);
  assert.doesNotMatch(err.message,/test-token|949578637962/);
  return true;
 });
});
test('diferencia falta de escopo, quota de espaço e parâmetros inválidos',()=>{
 assert.match(describeDriveFailure(403,'insufficientPermissions','','upload'),/permissão suficiente/);
 assert.match(describeDriveFailure(403,'storageQuotaExceeded','','upload'),/sem espaço livre/);
 assert.match(describeDriveFailure(429,'rateLimitExceeded','','upload'),/limite de requisições/);
 assert.match(describeDriveFailure(400,'invalidArgument','','upload'),/parâmetros/);
 assert.match(describeDriveFailure(401,'','','upload'),/expirou/);
 assert.equal(driveOperation('https://www.googleapis.com/upload/drive/v3/files/123','PATCH'),'envio de conteúdo ao Drive');
});
test('mensagem de erro da API nunca ecoa dados privados nem credenciais',()=>{
 const error=describeDriveFailure(403,'forbidden','Bearer ABCD_SENSITIVE_NAME ABCD_SENSITIVE_TOKEN','envio de conteúdo ao Drive');
 assert.doesNotMatch(error,/ABCD_SENSITIVE/);
 assert.match(error,/HTTP 403/);
});
