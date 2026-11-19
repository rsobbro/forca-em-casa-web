import {authorizeDrive,createGoogleDriveClient,detectDataConflicts,normalizeCloudData,normalizeDeleted,DELETE_CATEGORIES,drivePhotoName} from './google-drive-sync.js';
import {mergeHistory} from './progress.js';
import {PHOTO_VIEWS,getAssessmentPhotos,saveAssessmentPhotos} from './assessment-photos.js';

export const DRIVE_OWNER_KEY='forca-em-casa-drive-owner-v1';
export function mergeDriveHistories(local,remote){
 const localDeletes=normalizeDeleted(local?.deleted),remoteDeletes=normalizeDeleted(remote?.deleted);
 const deleted={};
 for(const kind of DELETE_CATEGORIES)deleted[kind]=[...new Set([...localDeletes[kind],...remoteDeletes[kind]])];
 const filter=(db)=>Object.fromEntries(DELETE_CATEGORIES.map(kind=>[kind,(db?.[kind]||[]).filter(x=>!deleted[kind].includes(x.id))]));
 const a={...local,...filter(local)},b=remote?{...remote,...filter(remote)}:null;
 const conflicts=b?detectDataConflicts(a,b):[];
 if(conflicts.length)return {db:null,deleted,conflicts};
 const merged=b?mergeHistory(a,b).db:a;
 return {db:{...merged,deleted},deleted,conflicts:[]};
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
  this.busy=false;this.lastSync=null;
 }
 get connected(){return !!this.client&&!!this.user&&!!this.folders}
 async connect(){
  const token=await authorizeDrive(this.clientId,this.googleApi);
  const client=createGoogleDriveClient(token,{fetchImpl:this.fetchImpl});
  const user=await client.about();
  const existingOwner=this.storage?.getItem(DRIVE_OWNER_KEY);
  if(existingOwner&&existingOwner!==user.permissionId){
   throw new Error('Este navegador já está vinculado a outra conta Google. Use um perfil de navegador separado; não misturamos registros pessoais.');
  }
  // Folder creation only after the user authorizes in the browser.
  const folders=await client.folders();
  this.client=client;this.user=user;this.folders=folders;
  return {user,folders};
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
   const resolved=mergeDriveHistories(db,data);
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
 disconnect(){this.client=null;this.user=null;this.folders=null;this.lastSync=null}
}
