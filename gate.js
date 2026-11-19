/**
 * Autenticação básica + cadastro local, sem solicitar Drive no login.
 * Ao salvar a primeira avaliação, o usuário autoriza Drive separadamente.
 */
import {GOOGLE_OAUTH_CLIENT_ID} from './google-config.js';
import {googleClientIdConfigured,normalizeDeleted} from './google-drive-sync.js';
import {GoogleDriveController,DRIVE_OWNER_KEY} from './google-drive-controller.js';
import {registerAccount,validRegistration,getAge,SEX_OPTIONS,accountStorageKey} from './registration.js';

const root=document.querySelector('#app-content');
const controller=new GoogleDriveController({clientId:GOOGLE_OAUTH_CLIENT_ID});
const LEGACY_KEY='forca-em-casa-v1';
const PROFILE_PREFIX='forca-em-casa-profile-';
const BROWSER_OWNER='forca-em-casa-browser-owner-sub';
let stage='login',currentProfile=null,authorizedUser=null,working=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const profileKey=sub=>PROFILE_PREFIX+sub;
function present(message=''){
 document.body.classList?.add('auth-locked');
 root.innerHTML=`<section class="auth-layout"><div class="auth-card">
 <div class="auth-brand"><span class="brand-symbol">F.</span><div><small>ACESSO PRIVADO</small><h1>Força em Casa</h1></div></div>
 ${stage==='login'?loginMarkup(message):stage==='registration'?registrationMarkup(message):loadingMarkup(message)}
 </div></section>`;
}
function loginMarkup(message){
 const available=googleClientIdConfigured(GOOGLE_OAUTH_CLIENT_ID);
 return `<h2>Entrar ou criar cadastro</h2>
  <p>Entre com sua conta Gmail para criar seu perfil de treino. Nesta etapa solicitamos <strong>somente a confirmação da sua identidade</strong>, não acesso aos seus arquivos do Google Drive.</p>
  ${message?`<p class="auth-error" role="alert">${esc(message)}</p>`:''}
  ${available?`<button class="button primary auth-google-button" type="button" data-gate="login">Continuar com Google</button>`:
    `<p class="auth-warning">Esta versão beta aguarda o Client ID OAuth público do Google Cloud. O login real permanece desativado.</p>`}
  <p class="auth-disclaimer">Nunca solicitamos sua senha do Gmail. A autorização para salvar avaliações no Google Drive será apresentada separadamente no momento do primeiro salvamento.</p>`;
}
function registrationMarkup(message){
 const user=authorizedUser;
 return `<h2>Crie seu cadastro</h2>
 <p>Gmail confirmado: <strong>${esc(user?.email)}</strong>. Cadastre seus dados agora. As avaliações e fotografias exigirão sua autorização do Drive somente quando você decidir salvar na nuvem.</p>
 ${message?`<p class="auth-error" role="alert">${esc(message)}</p>`:''}
 <form id="registration-form" class="auth-form">
  <div class="form-field"><label for="reg-name">Nome completo *</label><input id="reg-name" autocomplete="name" maxlength="100" minlength="3" required placeholder="Nome e sobrenome"></div>
  <div class="form-field"><label for="reg-birthDate">Data de nascimento *</label><input id="reg-birthDate" type="date" min="1900-01-01" required><small id="reg-age-hint">A idade será calculada automaticamente.</small></div>
  <div class="form-field"><label for="reg-sex">Sexo *</label><select id="reg-sex" required><option value="">Selecione</option>${SEX_OPTIONS.map(o=>`<option value="${o.value}">${esc(o.label)}</option>`).join('')}</select></div>
  <div class="form-field"><label for="reg-email">Conta Gmail autenticada *</label><input id="reg-email" type="email" readonly value="${esc(user?.email||'')}"></div>
  <label class="auth-consent"><input id="reg-consent" type="checkbox" required><span>Concordo com o cadastro e o armazenamento temporário dos meus registros neste dispositivo. Sei que o acesso ao Google Drive será solicitado separadamente quando eu salvar minha primeira avaliação.</span></label>
  <button class="button primary auth-google-button" type="submit">Criar cadastro e entrar</button>
 </form>
 <div class="auth-recover">
  <p>Já tem cadastro e avaliações em outro dispositivo?</p>
  <button class="button outline" type="button" data-gate="recover">Recuperar do meu Google Drive</button>
  <small>A recuperação solicita sua permissão para ler os arquivos que o Força em Casa criou na sua conta.</small>
 </div>
 <button class="button outline auth-back" data-gate="back">Voltar para login</button>
 <p class="auth-disclaimer">O cadastro beta está disponível para maiores de 18 anos.</p>`;
}
function loadingMarkup(message){return `<h2>Verificando sua conta</h2><p>${esc(message||'Preparando seus dados privados...')}</p>`}
async function enter(){
 if(working)return;
 working=true;stage='loading';present('Confirmando seu Gmail com o Google...');
 try{
  const {user}=await controller.authenticate(); // Sem drive.file!
  const bound=localStorage.getItem(BROWSER_OWNER);
  if(bound&&bound!==user.sub)throw new Error('Este navegador pertence a outro perfil. Utilize outro perfil do navegador para preservar fotos e históricos privados.');
  authorizedUser=user;
  let local=null;
  try{local=JSON.parse(localStorage.getItem(profileKey(user.sub))||'null')}catch{}
  if(local&&validRegistration(local,user)){currentProfile=local;await boot();return}
  stage='registration';present();
 }catch(err){
  controller.disconnect();authorizedUser=null;currentProfile=null;
  stage='login';present(err.message||'Não foi possível autenticar.');
 }finally{working=false}
}
async function register(event){
 event.preventDefault();
 if(working||stage!=='registration'||!authorizedUser)return;
 const form=root.querySelector('#registration-form');
 let profile;
 try{
  profile=registerAccount({
   name:form.querySelector('#reg-name').value,
   birthDate:form.querySelector('#reg-birthDate').value,
   sex:form.querySelector('#reg-sex').value,
   emailConfirmation:form.querySelector('#reg-email').value,
   consent:form.querySelector('#reg-consent').checked
  },authorizedUser);
 }catch(err){present(err.message);return}
 working=true;stage='loading';present('Criando seu perfil de acesso...');
 try{
  localStorage.setItem(profileKey(authorizedUser.sub),JSON.stringify(profile));
  currentProfile=profile;
  await boot();
 }catch(err){stage='registration';present(err.message||'Erro ao criar cadastro.')}
 finally{working=false}
}
async function recover(){
 if(working||!authorizedUser)return;
 working=true;stage='loading';present('Solicitando autorização para recuperar seu histórico no Drive...');
 try{
  // Called directly by a button interaction; the OAuth popup is opened synchronously.
  await controller.connect();
  const profile=await controller.loadProfile();
  if(!profile)throw new Error('Nenhum cadastro anterior foi encontrado no Google Drive desta conta.');
  if(!validRegistration(profile,controller.user))throw new Error('Cadastro anterior pertence a outra conta.');
  currentProfile=profile;
  localStorage.setItem(profileKey(authorizedUser.sub),JSON.stringify(profile));
  await boot();
 }catch(err){
  stage='registration';present('Não foi possível recuperar: '+err.message+' Nenhum registro local foi apagado.');
 }finally{working=false}
}
async function boot(){
 if(!controller.authenticated||!currentProfile||!validRegistration(currentProfile,authorizedUser))
  throw new Error('Cadastro e login Gmail são obrigatórios.');
 const cacheKey=accountStorageKey(authorizedUser.sub);
 let local=null;
 try{local=JSON.parse(localStorage.getItem(cacheKey)||'null')}catch{}
 if(!local){
  const raw=localStorage.getItem(LEGACY_KEY);
  if(raw&&window.confirm('Encontramos registros antigos neste navegador. Você confirma que são seus e deseja associá-los ao Gmail '+authorizedUser.email+'?')){
   try{const old=JSON.parse(raw);if(old?.version===1&&Array.isArray(old.sessions)&&Array.isArray(old.activities)&&Array.isArray(old.measurements))local=old;}catch{}
  }
 }
 if(!local)local={version:1,profile:{startDate:new Date().toISOString().slice(0,10)},sessions:[],activities:[],measurements:[],active:null,deleted:normalizeDeleted(null)};
 stage='loading';present(controller.connected?'Recuperando registros autorizados no Drive...':'Carregando seus treinos locais...');
 if(controller.connected){
  const result=await controller.sync(local);
  local=result.db;
 }
 localStorage.setItem(cacheKey,JSON.stringify(local));
 localStorage.setItem(BROWSER_OWNER,authorizedUser.sub);
 if(controller.connected)localStorage.setItem(DRIVE_OWNER_KEY,controller.user.permissionId);
 globalThis.__FORCA_AUTH_CONTEXT={controller,user:authorizedUser,profile:currentProfile,cacheKey,profileKey:profileKey(authorizedUser.sub)};
 globalThis.__FORCA_AUTH_LOGOUT=()=>{
  controller.disconnect();delete globalThis.__FORCA_AUTH_CONTEXT;delete globalThis.__FORCA_AUTH_LOGOUT;
  window.location.reload();
 };
 document.body.classList?.remove('auth-locked');
 stage='ready';
 await import('./app.js');
}
root.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-gate]');
 if(!button)return;
 if(button.dataset.gate==='login')enter();
 if(button.dataset.gate==='back'){controller.disconnect();authorizedUser=null;currentProfile=null;stage='login';present()}
 if(button.dataset.gate==='recover')recover();
});
root.addEventListener('submit',event=>{if(event.target.id==='registration-form')register(event)});
root.addEventListener('change',event=>{
 if(event.target.id!=='reg-birthDate')return;
 const age=getAge(event.target.value);
 const hint=root.querySelector('#reg-age-hint');
 if(hint)hint.textContent=age===null?'Informe uma data válida.':age+' anos';
});
present();
