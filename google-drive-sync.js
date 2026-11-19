/**
 * Integração opt-in com Drive pessoal, para sites estáticos HTTPS.
 * OAuth token fica APENAS em memória (nunca em localStorage/GitHub).
 * A conexão cria Força em Casa/{Dados,Fotos} no Drive do usuário autenticado.
 * Até a configuração do OAuth, a aplicação continua inteiramente local.
 */
export const GOOGLE_DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
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
export function authorizeDrive(clientId,googleApi=globalThis.google){
 if(!googleClientIdConfigured(clientId))return Promise.reject(new Error('Google OAuth Client ID ainda não foi configurado.'));
 const oauth=googleApi?.accounts?.oauth2;
 if(!oauth?.initTokenClient)return Promise.reject(new Error('Biblioteca de autenticação Google não carregada. Atualize a página.'));
 return new Promise((resolve,reject)=>{
  let done=false;
  const succeed=value=>{if(!done){done=true;resolve(value)}};
  const fail=message=>{if(!done){done=true;reject(new Error(message))}};
  try{
   const client=oauth.initTokenClient({
    client_id:clientId,scope:GOOGLE_DRIVE_SCOPE,
    callback:response=>{
     if(response?.error||!response?.access_token){fail('A autorização Google foi recusada ou expirou.');return}
     succeed(response.access_token);
    },
    error_callback:()=>fail('A janela de autorização foi fechada ou bloqueada.')
   });
   // Always invoked from a user click; no token is persisted.
   client.requestAccessToken({prompt:'select_account'});
  }catch{fail('Não foi possível abrir a autorização do Google.')}
 });
}
export function createGoogleDriveClient(accessToken,{fetchImpl=globalThis.fetch}={}){
 if(typeof accessToken!=='string'||!accessToken)throw new Error('Token OAuth não informado.');
 if(typeof fetchImpl!=='function')throw new Error('A API fetch não está disponível neste navegador.');
 async function request(url,options={}){
  const headers={Authorization:'Bearer '+accessToken,...options.headers};
  let response;
  try{response=await fetchImpl(url,{...options,headers,cache:'no-store'});}
  catch{throw new Error('Falha de rede. Os dados locais foram preservados.')}
  if(!response.ok){
   if(response.status===401)throw new Error('Autorização Google expirada. Reconecte sua conta para sincronizar.');
   if(response.status===403)throw new Error('Acesso ao Drive negado ou limite da API atingido.');
   if(response.status===404)throw new Error('Um arquivo ou pasta do Drive não foi encontrado.');
   throw new Error('Erro do Google Drive (HTTP '+response.status+').');
  }
  return response;
 }
 const asJson=async(response)=>response.json();
 async function about(){
  const params=new URLSearchParams({fields:'user(emailAddress,displayName,permissionId)'});
  const data=await asJson(await request(API+'/about?'+params));
  if(!data?.user?.permissionId)throw new Error('Não foi possível confirmar a conta Google.');
  return data.user;
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
 return {about,list,folders,readHistory,writeHistory,listPhotos,downloadPhoto,writePhoto,deleteFile};
}
