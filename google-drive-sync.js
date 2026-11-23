/**
 * Integração opt-in com Drive pessoal, para sites estáticos HTTPS.
 * OAuth token fica APENAS em memória (nunca em localStorage/GitHub).
 * A conexão cria Força em Casa/{Dados,Fotos} no Drive do usuário autenticado.
 * Até a configuração do OAuth, a aplicação continua inteiramente local.
 */
export const GOOGLE_DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
export const GOOGLE_IDENTITY_SCOPES='openid email profile';
export const GOOGLE_AUTH_SCOPES=GOOGLE_IDENTITY_SCOPES+' '+GOOGLE_DRIVE_SCOPE;
export const GOOGLE_LOGIN_SCOPES=GOOGLE_IDENTITY_SCOPES;
export const DRIVE_PROFILE_NAME='perfil.json';
export const DRIVE_APP_FOLDER='Força em Casa';
export const DRIVE_DATA_FOLDER='Dados';
export const DRIVE_PHOTOS_FOLDER='Fotos';
export const DRIVE_HISTORY_NAME='historico.json';
const API='https://www.googleapis.com/drive/v3';
const UPLOAD='https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME='application/vnd.google-apps.folder';
const JSON_MIME='application/json';
export const DRIVE_PHOTO_VIEWS=['front','back','side'];
const validId = id=>typeof id==='string'&&/^[A-Za-z0-9._-]{1,150}$/.test(id);
export function googleClientIdConfigured(id){
 return typeof id==='string' && /^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/.test(id);
}
export function escapeDriveQuery(value){
 return String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}
export function drivePhotoName(assessmentId,view){
 if(!validId(assessmentId)||!DRIVE_PHOTO_VIEWS.includes(view))throw new Error('Nome de avaliação inválido para fotos.');
 return assessmentId+'__'+view+'.jpg';
}
function stableJSON(value){
 if(Array.isArray(value))return '['+value.map(stableJSON).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stableJSON(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export function detectDataConflicts(local,remote){
 const issues=[];
 for(const section of ['sessions','activities','measurements']){
  const a=new Map((local?.[section]||[]).map(x=>[x.id,x]));
  for(const item of remote?.[section]||[]){
   if(!a.has(item.id))continue;
   // Do not interpret JSON key order as a semantic conflict.
   if(stableJSON(a.get(item.id))!==stableJSON(item))issues.push({section,id:item.id});
  }
 }
 return issues;
}
export const DELETE_CATEGORIES=['sessions','activities','measurements'];
export function normalizeDeleted(deleted){
 const out={sessions:[],activities:[],measurements:[]};
 for(const kind of DELETE_CATEGORIES){
  const items=deleted?.[kind]||[];
  if(!Array.isArray(items)||items.length>5000||items.some(id=>typeof id!=='string'||!id||id.length>128)){
   throw new Error('Histórico contém exclusões inválidas.');
  }
  out[kind]=[...new Set(items)];
 }
 return out;
}
export function normalizeCloudData(data){
 if(!data||data.version!==1||!data.profile||typeof data.profile.startDate!=='string'
 ||!Array.isArray(data.sessions)||!Array.isArray(data.activities)||!Array.isArray(data.measurements))
 throw new Error('O histórico no Google Drive não está no formato esperado.');
 if(data.sessions.length>5000||data.activities.length>10000||data.measurements.length>2000)
 throw new Error('O histórico excede os limites de segurança.');
 return {version:1,profile:{startDate:data.profile.startDate},
  sessions:data.sessions,activities:data.activities,measurements:data.measurements,active:data.active||null,
  deleted:normalizeDeleted(data.deleted)};
}
/** Mensagens de OAuth sem incluir tokens ou informações da URL de consentimento. */
export function describeGoogleOAuthFailure(code=''){
 const safe=String(code||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,60);
 const explanations={
  popup_failed_to_open:'O navegador impediu a abertura da janela do Google. Autorize pop-ups para este site e tente novamente no Chrome.',
  popup_closed:'A janela do Google foi fechada antes de concluir o acesso. Retorne ao Força em Casa e use o botão novamente.',
  access_denied:'O Google não autorizou o acesso. Confirme o Gmail na lista de usuários de teste e as permissões solicitadas.',
  origin_mismatch:'A origem do site não está autorizada no projeto OAuth. Cadastre https://rsobbro.github.io em Authorized JavaScript origins.',
  redirect_uri_mismatch:'O cliente OAuth tem uma configuração de redirecionamento incompatível com o aplicativo.',
  invalid_request:'O Google rejeitou a solicitação OAuth. Confira o tipo Web application, as origens autorizadas e o Client ID.',
  invalid_client:'O Google não reconheceu o Client ID OAuth; confira a credencial Web application.',
  interaction_required:'É necessário interagir com a tela de consentimento do Google.'
 };
 return explanations[safe]||'O Google não concluiu a autenticação. Feche somente a guia de erro e tente novamente a partir do endereço do Força em Casa. Se persistir, verifique o aplicativo OAuth no Google Cloud.';
}
/** Login: solicita somente dados básicos, nunca acesso ao Drive. */
export function authorizeIdentity(clientId,googleApi=globalThis.google,fetchImpl=globalThis.fetch){
 if(!googleClientIdConfigured(clientId))return Promise.reject(new Error('Client ID OAuth não configurado.'));
 if(!googleApi?.accounts?.oauth2?.initTokenClient)return Promise.reject(new Error('Biblioteca de login Google não carregada.'));
 if(typeof fetchImpl!=='function')return Promise.reject(new Error('O navegador não permite validação do Gmail.'));
 return new Promise((resolve,reject)=>{
  let finished=false;
  const done=(error,value)=>{
   if(finished)return;finished=true;
   if(error)reject(error instanceof Error?error:new Error(String(error)));
   else resolve(value);
  };
  try{
   const client=googleApi.accounts.oauth2.initTokenClient({
    client_id:clientId,scope:GOOGLE_LOGIN_SCOPES,
    callback:async response=>{
     if(response?.error||!response?.access_token){done(new Error(describeGoogleOAuthFailure(response?.error)));return;}
     try{
      const reply=await fetchImpl('https://www.googleapis.com/oauth2/v3/userinfo',{
       headers:{Authorization:'Bearer '+response.access_token},cache:'no-store'
      });
      if(!reply.ok)throw new Error('O Google não confirmou o login.');
      const identity=await reply.json();
      if(identity?.email_verified!==true||typeof identity.sub!=='string'||!identity.email)
       throw new Error('Conta Google sem Gmail verificado.');
      done(null,{user:{sub:String(identity.sub),email:identity.email,email_verified:true,
       name:String(identity.name||'')},accessToken:response.access_token});
     }catch(error){done(error);}
    },
    error_callback:result=>done(new Error(describeGoogleOAuthFailure(result?.type)))
   });
   client.requestAccessToken({prompt:'select_account'});
  }catch(error){done(error)}
 });
}
/** Permissão adicional: somente quando o usuário solicitar salvar no Drive. */
export function authorizeDrive(clientId,googleApi=globalThis.google,loginHint=''){
 if(!googleClientIdConfigured(clientId))return Promise.reject(new Error('Google OAuth Client ID ainda não foi configurado.'));
 const oauth=googleApi?.accounts?.oauth2;
 if(!oauth?.initTokenClient)return Promise.reject(new Error('Biblioteca de autenticação Google não carregada. Atualize a página.'));
 return new Promise((resolve,reject)=>{
  let done=false;
  const succeed=value=>{if(!done){done=true;resolve(value)}};
  const fail=message=>{if(!done){done=true;reject(new Error(message))}};
  try{
   const client=oauth.initTokenClient({
    client_id:clientId,scope:GOOGLE_AUTH_SCOPES,
    // Hint provided by the previously verified Google login to avoid selecting
    // an unrelated account when authorizing Drive on mobile.
    ...(typeof loginHint==='string'&&/^[^\s@]+@gmail\.com$/i.test(loginHint)?{login_hint:loginHint}:{}),
    // Previously granted access is reused. Google shows consent if a new scope
    // (drive.file) is requested; never force another consent on every retry.
    prompt:'',
    callback:response=>{
     if(response?.error||!response?.access_token){fail(describeGoogleOAuthFailure(response?.error));return}
     if(!String(response.scope||'').split(/\s+/).includes(GOOGLE_DRIVE_SCOPE)){fail('A permissão para criar arquivos no Google Drive não foi concedida.');return}
     succeed(response.access_token);
    },
    error_callback:result=>fail(describeGoogleOAuthFailure(result?.type))
   });
   // Always invoked from a user click; no token is persisted.
   client.requestAccessToken();
  }catch{fail('Não foi possível abrir a autorização do Google.')}
 });
}
/**
 * Diagnóstico seguro: não exibe corpo bruto da API, tokens, IDs de arquivo,
 * nomes privados ou outras informações de requisição.
 */
export function driveOperation(url,method='GET'){
 const path=String(url);
 if(path.includes('/drive/v3/about'))return 'identificação da conta Google Drive';
 if(path.includes('/oauth2/v3/userinfo'))return 'verificação da conta Google';
 if(path.includes('/upload/drive/v3/files/'))return 'envio de conteúdo ao Drive';
 if(path.includes('/drive/v3/files/')){
  if(method==='DELETE')return 'exclusão de arquivo no Drive';
  if(method==='PATCH')return 'atualização do arquivo no Drive';
  return 'leitura de arquivo no Drive';
 }
 if(path.includes('/drive/v3/files')){
  if(method==='POST')return 'criação de pasta ou arquivo no Drive';
  return 'busca de pastas e arquivos no Drive';
 }
 return 'acesso ao Google Drive';
}
export function describeDriveFailure(status,reason='',providerMessage='',operation='acesso ao Google Drive'){
 const code=String(reason||'').replace(/[^a-zA-Z0-9._-]/g,'').slice(0,80);
 const phrase=String(providerMessage||'').toLowerCase().slice(0,500);
 const stage=String(operation||'Google Drive').slice(0,90);
 const suffix=' (HTTP '+status+(code?'; '+code:'')+').';
 let guidance='O Google Drive recusou a operação. Verifique a autorização e tente novamente.';
 if(status===401)guidance='A autorização expirou. Saia da conta e faça login novamente; depois autorize o Drive.';
 else if(/accessnotconfigured|service_disabled|api_not_enabled/i.test(code)||/api has not been used|api is disabled|api is not enabled|has not been enabled|service disabled/.test(phrase))
  guidance='A Google Drive API não está ativada no projeto Google Cloud do aplicativo. Ative a API na biblioteca do projeto.';
 else if(/insufficientpermissions|insufficientauthenticationscopes|access_denied|insufficientfilepermissions|forbidden/i.test(code)||/insufficient authentication scopes/.test(phrase))
  guidance='A conta não concedeu permissão suficiente para essa operação. Revise o consentimento do Drive e reconecte.';
 else if(/storagequotaexceeded|storage_limit|storagequotafull/i.test(code))guidance='O Google Drive desta conta está sem espaço livre.';
 else if(/rateLimitExceeded|userRateLimitExceeded|quotaExceeded|dailyLimitExceeded|resource_exhausted/i.test(code)||status===429)
  guidance='O limite de requisições do Google Drive foi atingido. Aguarde antes de tentar novamente.';
 else if(status===400)guidance='O Google Drive rejeitou os parâmetros da operação. O aplicativo precisa revisar a solicitação.';
 else if(status===404)guidance='Um arquivo ou pasta criado pelo aplicativo não foi encontrado no Drive. Verifique se foi excluído ou movido.';
 else if(status>=500)guidance='O Google Drive apresentou uma indisponibilidade temporária. Tente novamente depois.';
 return 'Falha em '+stage+': '+guidance+suffix;
}
export function createGoogleDriveClient(accessToken,{fetchImpl=globalThis.fetch}={}){
 if(typeof accessToken!=='string'||!accessToken)throw new Error('Token OAuth não informado.');
 if(typeof fetchImpl!=='function')throw new Error('A API fetch não está disponível neste navegador.');
 async function request(url,options={}){
  const headers={Authorization:'Bearer '+accessToken,...options.headers};
  const operation=driveOperation(url,options.method||'GET');
  let response;
  try{response=await fetchImpl(url,{...options,headers,cache:'no-store'});}
  catch{throw new Error('Falha de rede em '+operation+'. Verifique sua conexão; os dados locais foram preservados.')}
  if(!response.ok){
   let body=null;
   try{body=await response.json()}catch{}
   const reason=body?.error?.errors?.[0]?.reason||
    body?.error?.details?.find?.(x=>typeof x?.reason==='string')?.reason||
    body?.error?.status||'';
   throw new Error(describeDriveFailure(response.status,reason,body?.error?.message,operation));
  }
  return response;
 }
 const asJson=async(response)=>response.json();
 async function about(){
  const params=new URLSearchParams({fields:'user(emailAddress,displayName,permissionId)'});
  const drive=await asJson(await request(API+'/about?'+params));
  if(!drive?.user?.permissionId)throw new Error('Não foi possível confirmar a conta Google do Drive.');
  // The OAuth token comes from Google Identity Services; userinfo independently
  // verifies email, Google subject (sub) and email_verified on Google's servers.
  const identity=await asJson(await request('https://www.googleapis.com/oauth2/v3/userinfo'));
  if(!identity?.email_verified||!identity?.sub||!identity?.email)
   throw new Error('A identidade Google não foi confirmada.');
  if(!drive.user.emailAddress||drive.user.emailAddress.toLowerCase()!==identity.email.toLowerCase())
   throw new Error('Conta Google do Drive diferente da conta autenticada.');
  return {...drive.user,sub:String(identity.sub),email:identity.email,email_verified:true};
 }
 async function list(parent,name=null){
  const filters=["'"+escapeDriveQuery(parent)+"' in parents",'trashed = false'];
  if(name!==null)filters.push("name = '"+escapeDriveQuery(name)+"'");
  const found=[];let pageToken;
  do{
   const params=new URLSearchParams({
    q:filters.join(' and '),fields:'nextPageToken,files(id,name,mimeType,size,modifiedTime,appProperties)',
    pageSize:'500',spaces:'drive'
   });
   if(pageToken)params.set('pageToken',pageToken);
   const response=await asJson(await request(API+'/files?'+params));
   found.push(...(response.files||[]));
   pageToken=response.nextPageToken;
   if(found.length>2000)throw new Error('Muitos arquivos encontrados na pasta; verifique manualmente.');
  }while(pageToken);
  return found;
 }
 async function createFile(metadata){
  return asJson(await request(API+'/files?fields=id,name,mimeType',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(metadata)
  }));
 }
 async function ensureFolder(parent,name){
  const entries=await list(parent,name);
  const folder=entries.find(x=>x.mimeType===FOLDER_MIME);
  if(folder)return folder.id;
  const created=await createFile({name,mimeType:FOLDER_MIME,parents:[parent]});
  if(!created.id)throw new Error('O Drive não confirmou a criação da pasta '+name+'.');
  return created.id;
 }
 async function folders(){
  const root=await ensureFolder('root',DRIVE_APP_FOLDER);
  const data=await ensureFolder(root,DRIVE_DATA_FOLDER);
  const photos=await ensureFolder(root,DRIVE_PHOTOS_FOLDER);
  return {root,data,photos};
 }
 async function existingFolders(){
  // Recovery should never create an empty folder tree on another device.
  const roots=await list('root',DRIVE_APP_FOLDER);
  const root=roots.find(x=>x.mimeType===FOLDER_MIME);
  if(!root)throw new Error('Não encontrei a pasta Força em Casa neste Google Drive. No computador, confirme que a sincronização foi concluída.');
  const data=(await list(root.id,DRIVE_DATA_FOLDER)).find(x=>x.mimeType===FOLDER_MIME);
  if(!data)throw new Error('Não encontrei a pasta Dados neste Google Drive. Envie seu histórico pelo computador antes de recuperar no celular.');
  const photos=(await list(root.id,DRIVE_PHOTOS_FOLDER)).find(x=>x.mimeType===FOLDER_MIME);
  return {root:root.id,data:data.id,photos:photos?.id||null};
 }
 async function uploadBytes(id,bytes,mimeType){
  return asJson(await request(UPLOAD+'/files/'+encodeURIComponent(id)+'?'+new URLSearchParams({uploadType:'media',fields:'id,name,size,modifiedTime'}),{
   method:'PATCH',headers:{'Content-Type':mimeType},body:bytes
  }));
 }
 async function upsert(parent,name,bytes,mimeType=JSON_MIME,additionalMetadata={}){
  const existing=(await list(parent,name)).find(x=>x.mimeType===mimeType);
  let id=existing?.id;
  if(!id){
   const created=await createFile({name,mimeType,parents:[parent],...additionalMetadata});
   id=created.id;
  }
  if(!id)throw new Error('O Drive não confirmou a criação de '+name+'.');
  await uploadBytes(id,bytes,mimeType);
  // Metadata updates are separate from media updates with uploadType=media.
  if(additionalMetadata.appProperties)await request(API+'/files/'+encodeURIComponent(id)+'?fields=id',{
   method:'PATCH',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({appProperties:additionalMetadata.appProperties})
  });
  return id;
 }
 async function readHistory(folderId){
  const record=(await list(folderId,DRIVE_HISTORY_NAME)).find(x=>x.mimeType===JSON_MIME);
  if(!record)return null;
  if(Number(record.size)>30*1024*1024)throw new Error('Histórico do Drive excede 30 MB.');
  const response=await request(API+'/files/'+encodeURIComponent(record.id)+'?alt=media');
  let body;
  try{body=await response.json()}catch{throw new Error('O arquivo historico.json no Drive não contém JSON válido.')}
  return normalizeCloudData(body);
 }
 async function readProfile(folderId){
  const profileFile=(await list(folderId,DRIVE_PROFILE_NAME)).find(x=>x.mimeType===JSON_MIME);
  if(!profileFile)return null;
  if(Number(profileFile.size)>64*1024)throw new Error('Cadastro do Drive excede o limite de 64 KB.');
  let profile;
  try{profile=await asJson(await request(API+'/files/'+encodeURIComponent(profileFile.id)+'?alt=media'));}
  catch{throw new Error('Não foi possível interpretar o cadastro no Drive.')}
  return profile;
 }
 async function writeProfile(folderId,profile){
  const blob=new Blob([JSON.stringify(profile)],{type:JSON_MIME});
  if(blob.size>64*1024)throw new Error('Perfil excede limite de 64 KB.');
  return upsert(folderId,DRIVE_PROFILE_NAME,blob,JSON_MIME);
 }
 async function writeHistory(folderId,data){
  const blob=new Blob([JSON.stringify(normalizeCloudData(data))],{type:JSON_MIME});
  if(blob.size>30*1024*1024)throw new Error('Histórico excede 30 MB.');
  return upsert(folderId,DRIVE_HISTORY_NAME,blob,JSON_MIME);
 }
 async function listPhotos(folderId){return (await list(folderId)).filter(x=>x.mimeType?.startsWith('image/'))}
 async function downloadPhoto(file){
  const response=await request(API+'/files/'+encodeURIComponent(file.id)+'?alt=media');
  const blob=await response.blob();
  if(blob.size>12*1024*1024)throw new Error('Imagem excede 12 MB.');
  return blob;
 }
 async function fingerprint(blob){
  if(!globalThis.crypto?.subtle)throw new Error('É necessária conexão HTTPS com Web Crypto para verificar a integridade da foto.');
  const bytes=await blob.arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 }
 async function writePhoto(folderId,assessmentId,view,blob,{overwrite=false}={}){
  if(!blob||!['image/jpeg','image/png','image/webp'].includes(blob.type)||blob.size>12*1024*1024)
   throw new Error('Arquivo de foto não é JPEG, PNG ou WebP válido de até 12 MB.');
  const name=drivePhotoName(assessmentId,view);
  const hash=await fingerprint(blob);
  const existing=(await list(folderId,name))[0];
  if(existing&&!overwrite){
   return {id:existing.id,skipped:true,conflict:existing.appProperties?.sha256!==hash};
  }
  const id=await upsert(folderId,name,blob,blob.type,{appProperties:{assessmentId,view,sha256:hash}});
  return {id,skipped:false,conflict:false};
 }
 async function deleteFile(id){
  if(!id)throw new Error('ID de arquivo inválido.');
  await request(API+'/files/'+encodeURIComponent(id),{method:'DELETE'});
 }
 return {about,list,folders,existingFolders,readHistory,writeHistory,readProfile,writeProfile,listPhotos,downloadPhoto,writePhoto,deleteFile};
}
