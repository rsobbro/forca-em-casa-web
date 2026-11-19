/**
 * Portão de acesso obrigatório ao sistema.
 * A UI de treinos só é carregada APÓS autenticação Google + cadastro válido.
 * OAuth é gerenciado pelo Google; nenhuma senha é pedida pelo aplicativo.
 */
import {GOOGLE_OAUTH_CLIENT_ID} from './google-config.js';
import {googleClientIdConfigured} from './google-drive-sync.js';
import {GoogleDriveController,DRIVE_OWNER_KEY} from './google-drive-controller.js';
import {registerAccount,validRegistration,getAge,SEX_OPTIONS,accountStorageKey} from './registration.js';

const root=document.querySelector('#app-content');
const controller=new GoogleDriveController({clientId:GOOGLE_OAUTH_CLIENT_ID});
const LEGACY_KEY='forca-em-casa-v1';
let stage='login',currentProfile=null,authorizedUser=null,working=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function present(message=''){
 document.body.classList?.add('auth-locked');
 root.innerHTML=`<section class="auth-layout"><div class="auth-card">
  <div class="auth-brand"><span class="brand-symbol">F.</span><div><small>ACESSO PRIVADO</small><h1>Força em Casa</h1></div></div>
  ${stage==='login'?loginMarkup(message):stage==='registration'?registrationMarkup(message):loadingMarkup(message)}
 </div></section>`;
}
function loginMarkup(message){
 const available=googleClientIdConfigured(GOOGLE_OAUTH_CLIENT_ID);
 return `<h2>Entre para acessar seu treinamento</h2><p>Você precisa ter uma conta Gmail autenticada e um cadastro pessoal para acompanhar seus treinos, avaliações e fotografias.</p>
  ${message?`<p class="auth-error" role="alert">${esc(message)}</p>`:''}
  ${available?`<button class="button primary auth-google-button" type="button" data-gate="login">Entrar com Google</button>`:
   `<p class="auth-warning">O cadastro ainda aguarda a configuração do OAuth Client ID do Google pelo administrador. Nenhum login está ativo nesta versão beta.</p>
    <p class="auth-muted">A versão pública anterior permanece funcionando sem alterações.</p>`}
  <p class="auth-disclaimer">A conta Google confirma o e-mail. Seus dados ficam na sua pasta privada do Google Drive, e o aplicativo não solicita nem armazena a senha do Gmail.</p>`;
}
function registrationMarkup(message){
 const user=authorizedUser;
 return `<h2>Complete seu cadastro</h2><p>Identidade Google confirmada. Estes dados são necessários para criar seu perfil pessoal.</p>
  ${message?`<p class="auth-error" role="alert">${esc(message)}</p>`:''}
  <form id="registration-form" class="auth-form">
   <div class="form-field"><label for="reg-name">Nome completo *</label><input id="reg-name" name="fullName" autocomplete="name" maxlength="100" minlength="3" required placeholder="Seu nome e sobrenome"></div>
   <div class="form-field"><label for="reg-birthDate">Data de nascimento *</label><input id="reg-birthDate" name="birthDate" type="date" min="1900-01-01" required><small id="reg-age-hint">Sua idade será calculada automaticamente.</small></div>
   <div class="form-field"><label for="reg-sex">Sexo *</label><select id="reg-sex" name="sex" required><option value="">Selecione</option>${SEX_OPTIONS.map(x=>`<option value="${x.value}">${esc(x.label)}</option>`).join('')}</select></div>
   <div class="form-field"><label for="reg-email">Gmail autenticado *</label><input id="reg-email" name="email" type="email" required value="${esc(user?.email||'')}" readonly autocomplete="email"><small>Este campo é obtido diretamente do Google e não pode ser alterado. Para usar outro Gmail, saia e autentique outra conta.</small></div>
   <label class="auth-consent"><input id="reg-consent" type="checkbox" required><span>Autorizo o armazenamento das minhas informações de cadastro, treinos, avaliações e fotografias na minha conta Google Drive. Compreendo que as informações corporais são pessoais e sensíveis.</span></label>
   <button class="button primary auth-google-button" type="submit">Criar cadastro e continuar</button>
  </form>
  <button class="button outline auth-back" data-gate="back">Voltar para login</button>
  <p class="auth-disclaimer">O cadastro é destinado a pessoas com 18 anos ou mais nesta versão. A idade é calculada a partir da data de nascimento.</p>`;
}
function loadingMarkup(message){return `<h2>Confirmando seus dados</h2><p>${esc(message||'Verificando cadastro e restaurando dados privados…')}</p>`;}
async function enter(){
 if(working)return;
 working=true;stage='loading';present('Solicitando autenticação ao Google…');
 try{
  const {user}=await controller.connect();
  authorizedUser=user;
  const profile=await controller.loadProfile();
  if(!profile){stage='registration';present();return}
  if(!validRegistration(profile,user))throw new Error('Seu cadastro está inválido ou não corresponde ao Gmail selecionado.');
  currentProfile=profile;
  await boot();
 }catch(err){
  controller.disconnect();authorizedUser=null;currentProfile=null;stage='login';present(err.message||'Não foi possível autenticar.');
 }finally{working=false}
}
async function register(event){
 event.preventDefault();
 if(working||stage!=='registration'||!authorizedUser)return;
 const form=root.querySelector('#registration-form');
 const data={
  name:form.querySelector('#reg-name').value,
  birthDate:form.querySelector('#reg-birthDate').value,
  sex:form.querySelector('#reg-sex').value,
  emailConfirmation:form.querySelector('#reg-email').value,
  consent:form.querySelector('#reg-consent').checked
 };
 let profile;
 try{profile=registerAccount(data,authorizedUser)}catch(err){present(err.message);return}
 working=true;stage='loading';present('Criando seu cadastro privado no Drive…');
 try{
  await controller.saveProfile(profile); // acesso bloqueado até confirmação do Drive
  currentProfile=profile;
  await boot();
 }catch(err){
  stage='registration';present('Falha ao salvar no Google Drive: '+err.message+'. Tente novamente.');
 }finally{working=false}
}
async function boot(){
 if(!controller.connected||!currentProfile||!validRegistration(currentProfile,authorizedUser))
  throw new Error('Login e cadastro Google obrigatórios.');
 const cacheKey=accountStorageKey(authorizedUser.sub);
 let local=null;
 try{local=JSON.parse(localStorage.getItem(cacheKey)||'null')}catch{}
 if(!local){
  const legacy=localStorage.getItem(LEGACY_KEY);
  if(legacy&&window.confirm('Há um histórico antigo salvo neste navegador. Você confirma que esses registros são seus e deseja vinculá-los à conta '+authorizedUser.email+'?')){
   try{const old=JSON.parse(legacy);if(old?.version===1&&Array.isArray(old.sessions)&&Array.isArray(old.activities)&&Array.isArray(old.measurements))local=old;}catch{}
  }
 }
 if(!local)local={version:1,profile:{startDate:new Date().toISOString().slice(0,10)},sessions:[],activities:[],measurements:[],active:null,deleted:{sessions:[],activities:[],measurements:[]}};
 stage='loading';present('Carregando treinos e avaliações do seu Google Drive…');
 // Ensure the scoped cache is never persisted to a different Google account.
 const result=await controller.sync(local);
 const state=result.db;
 localStorage.setItem(cacheKey,JSON.stringify(state));
 localStorage.setItem(DRIVE_OWNER_KEY,authorizedUser.permissionId);
 globalThis.__FORCA_AUTH_CONTEXT={controller,user:authorizedUser,profile:currentProfile,cacheKey};
 globalThis.__FORCA_AUTH_LOGOUT=()=>{
  controller.disconnect();delete globalThis.__FORCA_AUTH_CONTEXT;
  delete globalThis.__FORCA_AUTH_LOGOUT;
  window.location.reload();
 };
 document.body.classList?.remove('auth-locked');
 stage='ready';
 await import('./app.js');
}
root.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-gate]');
 if(!button)return;
 if(button.dataset.gate==='login')enter();
 if(button.dataset.gate==='back'){controller.disconnect();authorizedUser=null;currentProfile=null;stage='login';present();}
});
root.addEventListener('submit',e=>{if(e.target.id==='registration-form')register(e)});
root.addEventListener('change',e=>{
 if(e.target.id!=='reg-birthDate')return;
 const hint=root.querySelector('#reg-age-hint');
 const age=getAge(e.target.value);
 if(hint)hint.textContent=age===null?'Informe uma data válida.':age+' anos';
});
present();
