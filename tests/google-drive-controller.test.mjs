import test from 'node:test';
import assert from 'node:assert/strict';
import {GoogleDriveController,DRIVE_OWNER_KEY} from '../google-drive-controller.js';
const CLIENT_ID='123456789012-example.apps.googleusercontent.com';
const identity={accounts:{oauth2:{initTokenClient(options){return {requestAccessToken(){options.callback({access_token:'my-token'})}}}}}};
const storage=(entries={})=>{const m=new Map(Object.entries(entries));return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),has:k=>m.has(k)}};
const validEmpty={version:1,profile:{startDate:'2026-11-16'},sessions:[],activities:[],measurements:[],active:null};
test('conectar não envia nada antes de consentimento, e bloqueia outra conta no mesmo navegador',async()=>{
 let calls=0;
 const fetchImpl=async(url)=>{
  calls++;
  if(url.includes('/about?'))return new Response(JSON.stringify({user:{permissionId:'different-owner',emailAddress:'someone@example.com'}}),{status:200});
  throw new Error('Sem permissão para chamar mais APIs.');
 };
 const store=storage({[DRIVE_OWNER_KEY]:'original-owner'});
 const controller=new GoogleDriveController({clientId:CLIENT_ID,storage:store,fetchImpl,googleApi:identity});
 await assert.rejects(controller.connect(),/outra conta Google/);
 assert.equal(calls,1); // about.get only; folder not created after mismatch
 assert.equal(controller.connected,false);
});
test('não declara conexão ativa sem OAuth Client ID válido',async()=>{
 const controller=new GoogleDriveController({clientId:'',storage:storage(),googleApi:identity});
 await assert.rejects(controller.connect(),/Client ID/);
 assert.equal(controller.connected,false);
});
