import {authorizeIdentity,authorizeDrive,createGoogleDriveClient,normalizeCloudData,normalizeDeleted,DELETE_CATEGORIES,drivePhotoName} from './google-drive-sync.js';
import {PHOTO_VIEWS,getAssessmentPhotos,saveAssessmentPhotos} from './assessment-photos.js';
import {validGoogleIdentity,validRegistration} from './registration.js';

export const DRIVE_OWNER_KEY='forca-em-casa-drive-owner-v1';
export const BASELINE_PREFIX='forca-em-casa-drive-baseline-';
const stable=value=>{
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
 return JSON.stringify(value);
};
const same=(a,b)=>stable(a)===stable(b);
/**
 * Three-way merge: local, cloud and last successfully synced baseline.
 * Existing IDs can be updated when only one side diverges from baseline.
 * If both changed differently, stop rather than silently discard work.
 */
export function mergeDriveHistories(local,remote,baseline=null){
 const localDeletes=normalizeDeleted(local?.deleted),remoteDeletes=normalizeDeleted(remote?.deleted);
 const deleted={};
 for(const kind of DELETE_CATEGORIES)deleted[kind]=[...new Set([...localDeletes[kind],...remoteDeletes[kind]])];
 const conflicts=[],records={};
 for(const kind of DELETE_CATEGORIES){
  const localMap=new Map((local?.[kind]||[]).map(x=>[x.id,x]));
  const remoteMap=new Map((remote?.[kind]||[]).map(x=>[x.id,x]));
  const baseMap=new Map((baseline?.[kind]||[]).map(x=>[x.id,x]));
  const result=[];
  const removals=new Set(deleted[kind]);
  for(const id of new Set([...localMap.keys(),...remoteMap.keys()])){
   if(removals.has(id))continue;
   const a=localMap.get(id),b=remoteMap.get(id),old=baseMap.get(id);
   if(a===undefined){result.push(b);continue}
   if(b===undefined){result.push(a);continue}
   if(same(a,b)){result.push(a);continue}
   if(old!==undefined&&same(b,old)){result.push(a);continue}
   if(old!==undefined&&same(a,old)){result.push(b);continue}
   conflicts.push({section:kind,id});
  }
  records[kind]=result;
 }
 let active=local?.active||null;
 if(remote?.active&&active&&!same(active,remote.active)){
  if(baseline&&same(remote.active,baseline.active))active=local.active;
  else if(baseline&&same(local.active,baseline.active))active=remote.active;
  else conflicts.push({section:'active',id:'current'});
 }else if(!active&&remote?.active){
  if(!baseline||same(baseline.active,remote.active))active=baseline?null:remote.active;
  else active=remote.active;
 }
 // Prefer detailed workouts over a manual checkmark for the same day.
 const detailed=new Set(records.sessions.filter(x=>x.manual!==true).map(x=>x.date+':'+x.dayId));
 records.sessions=records.sessions.filter(x=>x.manual!==true||!detailed.has(x.date+':'+x.dayId));
 records.sessions.sort((a,b)=>b.date.localeCompare(a.date));
 const startDates=[local?.profile?.startDate,remote?.profile?.startDate].filter(x=>typeof x==='string').sort();
 return {db:{version:1,profile:{startDate:startDates[0]||'2026-11-16'},...records,active,deleted},deleted,conflicts};
}
export function hasRecords(db){
 return !!(db?.sessions?.length||db?.activities?.length||db?.measurements?.length||db?.active);
}
/**
 * A propriedade owner vincula ESTE perfil local à conta Drive. Uma tentativa
 * de usar outra conta é recusada para impedir upload cruzado de dados sensíveis.
 * Um dispositivo compartilhado exige um perfil/navegador separado por pessoa.
 */
export class GoogleDriveController {
 constructor({clientId,fetchImpl=globalThis.fetch,storage=globalThis.localStorage,photos={getAssessmentPhotos,saveAssessmentPhotos},
  confirmFn=globalThis.confirm,googleApi=globalThis.google}={}){
  this.clientId=clientId;this.fetchImpl=fetchImpl;this.storage=storage;this.photos=photos;
  this.confirmFn=confirmFn;this.googleApi=googleApi;this.client=null;this.user=null;this.folders=null;
  this.busy=false;this.lastSync=null;this.identity=null;
 }
 get authenticated(){return validGoogleIdentity(this.identity)}
 get connected(){return this.authenticated&&!!this.client&&!!this.folders}
 async authenticate(){
  const {user}=await authorizeIdentity(this.clientId,this.googleApi||globalThis.google,this.fetchImpl);
  if(!validGoogleIdentity(user))throw new Error('Somente Gmail verificado é aceito nesta versão.');
  this.identity=user;this.user=user;
  return {user};
 }
 async connect(){
  if(!this.authenticated)throw new Error('Primeiro faça login com seu Gmail.');
  // MUST be called directly from a real user click; no awaits before popup.
  const token=await authorizeDrive(this.clientId,this.googleApi||globalThis.google);
  const client=createGoogleDriveClient(token,{fetchImpl:this.fetchImpl});
  const user=await client.about();
  if(!validGoogleIdentity(user)||user.sub!==this.identity.sub||
    user.email.toLowerCase()!==this.identity.email.toLowerCase())
   throw new Error('A conta autorizada para o Drive é diferente do Gmail do login. A gravação foi cancelada.');
  const existingOwner=this.storage?.getItem(DRIVE_OWNER_KEY);
  if(existingOwner&&existingOwner!==user.permissionId)
   throw new Error('Este navegador tem um Drive vinculado a outra conta. Use um perfil separado de navegador.');
  // Pastas somente após o consentimento explícito para gravar arquivos.
  const folders=await client.folders();
  this.client=client;this.user=user;this.folders=folders;
  return {user,folders};
 }
 async loadProfile(){
  if(!this.connected)throw new Error('Faça login com Google para consultar seu cadastro.');
  const profile=await this.client.readProfile(this.folders.data);
  if(profile&&!validRegistration(profile,this.user))throw new Error('O cadastro no Drive está incompleto ou não corresponde à conta Gmail autenticada.');
  return profile;
 }
 async saveProfile(profile){
  if(!this.connected||!validRegistration(profile,this.user))throw new Error('Cadastro ou login Google inválido.');
  await this.client.writeProfile(this.folders.data,profile);
  return profile;
 }
 async sync(db){
  if(!this.connected)throw new Error('Conecte sua conta Google antes de sincronizar.');
  if(this.busy)throw new Error('Já existe uma sincronização em andamento.');
  this.busy=true;
  try{
   const owner=this.storage?.getItem(DRIVE_OWNER_KEY);
   if(owner&&owner!==this.user.permissionId)throw new Error('Conta Google diferente da conta vinculada.');
   const remote=await this.client.readHistory(this.folders.data);
   const data=remote?normalizeCloudData(remote):null;
   const baselineRaw=this.storage?.getItem(BASELINE_PREFIX+this.user.permissionId);
   let baseline=null;
   try{baseline=baselineRaw?normalizeCloudData(JSON.parse(baselineRaw)):null}catch{}
   const resolved=mergeDriveHistories(db,data,baseline);
   if(resolved.conflicts.length)throw new Error('Conflito entre dispositivos em '+resolved.conflicts.length+' registro(s). Faça backup local e resolva as diferenças antes de sobrescrever o Google Drive.');
   const localHas=hasRecords(db);
   if(!owner&&localHas&& !this.confirmFn('Vincular os dados deste navegador à conta '+this.user.emailAddress+'? Confirme apenas se todos os registros locais pertencem a esta pessoa.')){
    throw new Error('Sincronização cancelada; os dados locais foram preservados.');
   }
   // Cloud and local data are merged ADDITIVELY, never overwritten in a conflict.
   const merged=resolved.db;
   if(!owner)this.storage?.setItem(DRIVE_OWNER_KEY,this.user.permissionId);
   const photosResult=await this.syncPhotos(merged,resolved.deleted);
   // Do not make a cloud-history success claim until this write succeeds.
   await this.client.writeHistory(this.folders.data,merged);
   this.storage?.setItem(BASELINE_PREFIX+this.user.permissionId,JSON.stringify(merged));
   this.lastSync=new Date().toISOString();
   return {db:merged,lastSync:this.lastSync,photos:photosResult};
  }finally{this.busy=false}
 }
 async syncPhotos(db,deleted=normalizeDeleted(null)){
  const remote=await this.client.listPhotos(this.folders.photos);
  const remoteByName=new Map(remote.map(p=>[p.name,p]));
  const stats={uploaded:0,downloaded:0,deleted:0,conflicts:0};
  const removed=new Set(deleted.measurements||[]);
  for(const cloud of remote){
   const assessmentId=cloud.appProperties?.assessmentId;
   if(assessmentId&&removed.has(assessmentId)){
    await this.client.deleteFile(cloud.id);
    remoteByName.delete(cloud.name);
    stats.deleted++;
   }
  }
  for(const assessment of db.measurements||[]){
   const id=assessment.id;
   const local=await this.photos.getAssessmentPhotos(id).catch(()=>({}));
   for(const view of PHOTO_VIEWS){
    // The app constrains IDs to stable strings of at most 128 bytes.
    let name;try{name=drivePhotoName(id,view)}catch{continue}
    const cloud=remoteByName.get(name),blob=local[view];
    if(blob){
     const saved=await this.client.writePhoto(this.folders.photos,id,view,blob);
     if(saved.conflict)stats.conflicts++;
     else if(!saved.skipped)stats.uploaded++;
    }else if(cloud){
     const downloaded=await this.client.downloadPhoto(cloud);
     await this.photos.saveAssessmentPhotos(id,{[view]:downloaded});
     stats.downloaded++;
    }
   }
  }
  return stats;
 }
 disconnect(){this.client=null;this.user=null;this.identity=null;this.folders=null;this.lastSync=null}
}
