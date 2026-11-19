/** Fotos privadas das avaliações: apenas IndexedDB do navegador.
 * Nunca envia imagens ao GitHub, ao servidor ou a serviços externos.
 */
const DB_NAME='forca-em-casa-fotos-v1';
const DB_VERSION=1,STORE='photos';
export const PHOTO_VIEWS=['front','back','side'];
export const PHOTO_MAX_BYTES=12*1024*1024;
export const PHOTO_MIMES=['image/jpeg','image/png','image/webp'];
export function validPhotoFile(file){
 return !!file&&PHOTO_MIMES.includes(file.type)&&Number.isFinite(file.size)&&file.size>0&&file.size<=PHOTO_MAX_BYTES;
}
function openPhotoDB(){
 if(typeof indexedDB==='undefined')return Promise.reject(new Error('Armazenamento de fotos indisponível neste navegador.'));
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(STORE)){
    const st=db.createObjectStore(STORE,{keyPath:'id'});
    st.createIndex('assessmentId','assessmentId',{unique:false});
   }
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||new Error('Não foi possível abrir as fotos locais.'));
 });
}
async function withStore(mode,operation){
 const db=await openPhotoDB();
 try{
  return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,mode);
   const req=operation(tx.objectStore(STORE));
   tx.oncomplete=()=>resolve(req?.result);
   tx.onerror=()=>reject(tx.error||new Error('Falha ao salvar a foto.'));
   tx.onabort=()=>reject(tx.error||new Error('Operação de fotos cancelada.'));
  });
 }finally{db.close()}
}
async function compressPhoto(file){
 if(typeof createImageBitmap!=='function'||typeof document==='undefined')return file;
 let bitmap=null;
 try{
  bitmap=await createImageBitmap(file);
  const ratio=Math.min(1,1280/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*ratio));
  canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.82));
  return blob&&blob.size>0?blob:file;
 }catch{return file}
 finally{bitmap?.close?.()}
}
export async function saveAssessmentPhotos(assessmentId,files){
 if(typeof assessmentId!=='string'||!assessmentId)return 0;
 let count=0;
 for(const view of PHOTO_VIEWS){
  const file=files?.[view];
  if(!file)continue;
  if(!validPhotoFile(file))throw new Error('Foto '+view+': envie JPEG, PNG ou WebP com até 12 MB.');
  const blob=await compressPhoto(file);
  await withStore('readwrite',store=>store.put({
   id:assessmentId+':'+view,assessmentId,view,blob,updatedAt:Date.now()
  }));
  count++;
 }
 return count;
}
export async function getAssessmentPhotos(assessmentId){
 const records=await withStore('readonly',store=>store.index('assessmentId').getAll(assessmentId));
 return Object.fromEntries((records||[]).map(item=>[item.view,item.blob]));
}
export async function removeAssessmentPhotos(assessmentId){
 for(const view of PHOTO_VIEWS)await withStore('readwrite',store=>store.delete(assessmentId+':'+view));
}
export async function clearAllAssessmentPhotos(){
 await withStore('readwrite',store=>store.clear());
}
async function photoToDataUrl(blob){
 return new Promise((resolve,reject)=>{
  const fr=new FileReader();
  fr.onload=()=>resolve(fr.result);
  fr.onerror=()=>reject(fr.error||new Error('Falha ao exportar fotografia.'));
  fr.readAsDataURL(blob);
 });
}
export async function exportAssessmentPhotoBackup(){
 if(typeof indexedDB==='undefined')return {available:false,photos:[]};
 const all=await withStore('readonly',store=>store.getAll());
 const photos=[];
 for(const p of all||[]){
  if(!PHOTO_VIEWS.includes(p.view)||!(p.blob instanceof Blob))continue;
  photos.push({assessmentId:p.assessmentId,view:p.view,dataUrl:await photoToDataUrl(p.blob)});
 }
 return {available:true,photos};
}
export function validPhotoBackupEntry(item){
 return !!item&&typeof item.assessmentId==='string'&&item.assessmentId.length>0&&item.assessmentId.length<=128&&PHOTO_VIEWS.includes(item.view)&&
 typeof item.dataUrl==='string'&&item.dataUrl.length<=18*1024*1024&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(item.dataUrl);
}
function blobFromDataUrl(dataUrl){
 const [meta,base64]=dataUrl.split(',');
 const mime=meta.slice(5).split(';')[0];
 const binary=atob(base64),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return new Blob([bytes],{type:mime});
}
export async function importAssessmentPhotoBackup(entries,assessmentIds,{replaceExisting=false}={}){
 if(!entries?.length)return 0;
 if(typeof indexedDB==='undefined')throw new Error('Fotos não podem ser importadas neste navegador.');
 if(entries.length>6000||entries.some(x=>!validPhotoBackupEntry(x)))throw new Error('Backup contém fotos inválidas.');
 const allowed=new Set(assessmentIds),seen=new Set();
 let count=0;
 for(const item of entries){
  if(!allowed.has(item.assessmentId))continue;
  const id=item.assessmentId+':'+item.view;
  if(seen.has(id))continue;
  seen.add(id);
  const blob=blobFromDataUrl(item.dataUrl);
  if(blob.size>PHOTO_MAX_BYTES)continue;
  if(!replaceExisting){
   const old=await withStore('readonly',store=>store.get(id));
   if(old)continue;
  }
  await withStore('readwrite',store=>store.put({id,assessmentId:item.assessmentId,view:item.view,blob,updatedAt:Date.now()}));
  count++;
 }
 return count;
}
