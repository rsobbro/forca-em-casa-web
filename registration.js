/** Validação de cadastro em conta Google confirmada por API autenticada. */
export const REGISTRATION_VERSION=1;
export const SEX_OPTIONS=[
 {value:'masculino',label:'Masculino'},
 {value:'feminino',label:'Feminino'},
 {value:'nao_informar',label:'Prefiro não informar'}
];
export function isGmailAddress(email){
 return typeof email==='string'&&/^[^\s@]+@gmail\.com$/i.test(email.trim());
}
export function getAge(birthDate,now=new Date()){
 if(typeof birthDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(birthDate))return null;
 const [year,month,day]=birthDate.split('-').map(Number);
 const check=new Date(Date.UTC(year,month-1,day));
 if(check.getUTCFullYear()!==year||check.getUTCMonth()+1!==month||check.getUTCDate()!==day)return null;
 const current=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));
 let age=current.getUTCFullYear()-year;
 if(current.getUTCMonth()+1<month||current.getUTCMonth()+1===month&&current.getUTCDate()<day)age--;
 return age>=0&&age<=120?age:null;
}
export function validGoogleIdentity(identity){
 return !!identity&&typeof identity.sub==='string'&&/^[0-9]{8,40}$/.test(identity.sub)
  &&identity.email_verified===true&&isGmailAddress(identity.email)
;
}
export function registerAccount(data,identity,now=new Date()){
 if(!validGoogleIdentity(identity))throw new Error('É necessário autenticar uma conta Gmail confirmada pelo Google.');
 const name=String(data?.name||'').trim().replace(/\s+/g,' ');
 if(name.length<3||name.length>100)throw new Error('Informe nome completo com 3 a 100 caracteres.');
 if(!name.includes(' '))throw new Error('Informe também o sobrenome.');
 const birthDate=String(data?.birthDate||'');
 const age=getAge(birthDate,now);
 if(age===null)throw new Error('Informe uma data de nascimento válida.');
 if(age<18)throw new Error('Nesta versão, o cadastro é destinado a pessoas com 18 anos ou mais.');
 const sex=String(data?.sex||'');
 if(!SEX_OPTIONS.some(x=>x.value===sex))throw new Error('Selecione uma opção no campo sexo.');
 if(data?.consent!==true)throw new Error('É necessário aceitar o cadastro e o armazenamento local, antes de autorizar o Drive separadamente.');
 if(data?.emailConfirmation?.trim().toLowerCase()!==identity.email.trim().toLowerCase())
  throw new Error('O Gmail confirmado deve ser exatamente a conta autenticada.');
 return {
  version:REGISTRATION_VERSION,
  googleSub:identity.sub,
  googlePermissionId:identity.permissionId||null,
  email:identity.email.toLowerCase(),
  name,birthDate,sex,
  consentVersion:'1.0',
  createdAt:now.toISOString(),
  updatedAt:now.toISOString()
 };
}
export function validRegistration(profile,identity,now=new Date()){
 if(!validGoogleIdentity(identity)||!profile||profile.version!==REGISTRATION_VERSION)return false;
 if(profile.googleSub!==identity.sub||profile.email?.toLowerCase()!==identity.email.toLowerCase())return false;
 if(profile.googlePermissionId&&identity.permissionId&&profile.googlePermissionId!==identity.permissionId)return false;
 if(typeof profile.name!=='string'||profile.name.trim().length<3||profile.name.length>100)return false;
 const age=getAge(profile.birthDate,now);
 if(age===null||age<18)return false;
 if(!SEX_OPTIONS.some(x=>x.value===profile.sex))return false;
 return profile.consentVersion==='1.0'&&typeof profile.createdAt==='string';
}
export function accountStorageKey(sub){
 if(typeof sub!=='string'||!/^[0-9]{8,40}$/.test(sub))throw new Error('Identificador da conta inválido.');
 return 'forca-em-casa-user-'+sub+'-v1';
}
