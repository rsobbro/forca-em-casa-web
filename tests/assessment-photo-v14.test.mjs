import test from 'node:test';
import assert from 'node:assert/strict';
import {PHOTO_VIEWS,PHOTO_MAX_BYTES,validPhotoFile,validPhotoBackupEntry,exportAssessmentPhotoBackup} from '../assessment-photos.js';
import {readFileSync} from 'node:fs';
test('cada avaliação admite três posições individuais e somente tipos de imagem',()=>{
 assert.deepEqual(PHOTO_VIEWS,['front','back','side']);
 assert.equal(validPhotoFile(new Blob(['abc'],{type:'image/jpeg'})),true);
 assert.equal(validPhotoFile(new Blob(['abc'],{type:'image/png'})),true);
 assert.equal(validPhotoFile(new Blob(['abc'],{type:'image/webp'})),true);
 assert.equal(validPhotoFile(new Blob(['abc'],{type:'image/svg+xml'})),false);
 assert.equal(validPhotoFile({type:'image/jpeg',size:PHOTO_MAX_BYTES+1}),false);
});
test('valida backup de fotografias e rejeita conteúdos de outros formatos',()=>{
 const entry={assessmentId:'test-id',view:'front',dataUrl:'data:image/jpeg;base64,YWJj'};
 assert.equal(validPhotoBackupEntry(entry),true);
 assert.equal(validPhotoBackupEntry({...entry,view:'fourth'}),false);
 assert.equal(validPhotoBackupEntry({...entry,dataUrl:'data:text/html;base64,YWJj'}),false);
});
test('na ausência do IndexedDB, backup informa que não há fotos disponíveis',async()=>{
 const backup=await exportAssessmentPhotoBackup();
 assert.deepEqual(backup,{available:false,photos:[]});
});
test('a aplicação integra três inputs e permite editar fotos de registros anteriores',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(app,/bodyPhotoInputs\(\)/);
 assert.match(app,/edit-assessment-photos/);
 assert.match(app,/save-assessment-photos/);
 assert.match(app,/importAssessmentPhotoBackup/);
 assert.match(app,/exportAssessmentPhotoBackup/);
});
