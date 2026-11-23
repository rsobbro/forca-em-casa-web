import test from 'node:test';
import assert from 'node:assert/strict';
import {getAge,validGoogleIdentity,registerAccount,validRegistration,accountStorageKey} from '../registration.js';
import {readFileSync} from 'node:fs';

const now=new Date('2026-11-18T15:00:00.000Z');
const user={sub:'123456789012345678901',permissionId:'google-drive-user-1',email:'personal@gmail.com',email_verified:true};
const entry={name:'Ana da Silva',birthDate:'1991-05-10',sex:'feminino',emailConfirmation:'personal@gmail.com',consent:true};
test('cadastro usa Gmail certificado pelo Google e exige nome, data, sexo e consentimento',()=>{
 const profile=registerAccount(entry,user,now);
 assert.equal(profile.googleSub,user.sub);
 assert.equal(profile.email,user.email);
 assert.equal(profile.name,'Ana da Silva');
 assert.equal(getAge(profile.birthDate,now),35);
 assert.equal(profile.consentVersion,'1.0');
 assert.equal(validRegistration(profile,user,now),true);
 assert.equal(accountStorageKey(user.sub),'forca-em-casa-user-'+user.sub+'-v1');
});
test('impede contas não-Gmail, identidade não verificada e conta diferente',()=>{
 assert.equal(validGoogleIdentity({...user,email:'pessoa@empresa.com'}),false);
 assert.equal(validGoogleIdentity({...user,email_verified:false}),false);
 assert.throws(()=>registerAccount(entry,{...user,email:'outro@gmail.com'},now),/Gmail confirmado/);
 const p=registerAccount(entry,user,now);
 assert.equal(validRegistration(p,{...user,sub:'99999999999999999999'},now),false);
 assert.equal(validRegistration(p,{...user,email:'outra@gmail.com'},now),false);
});
test('validação de idade e campos obrigatórios',()=>{
 assert.equal(getAge('1990-02-30',now),null);
 assert.equal(getAge('2008-11-19',now),17);
 assert.throws(()=>registerAccount({...entry,birthDate:'2008-11-19'},user,now),/18 anos/);
 assert.throws(()=>registerAccount({...entry,name:'Ana'},user,now),/sobrenome/);
 assert.throws(()=>registerAccount({...entry,sex:''},user,now),/sexo/);
 assert.throws(()=>registerAccount({...entry,consent:false},user,now),/autorizar|armazenamento/);
});
test('site importa o portão de acesso e só então carrega o aplicativo',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const gate=readFileSync(new URL('../gate.js',import.meta.url),'utf8');
 assert.ok(html.includes('src="./gate.js"'));
 assert.ok(!html.includes('src="./app.js"'));
 assert.ok(html.includes('class="auth-locked"'));
 assert.match(gate,/localStorage\.setItem\(profileKey\(authorizedUser\.sub\),JSON\.stringify\(profile\)\)/);
 assert.match(gate,/if\(controller\.connected\)/);
 assert.match(gate,/await controller\.recover\(local\)/);
 assert.match(gate,/await import\('\.\/app\.js'\)/);
 assert.match(gate,/validRegistration\(local,user\)/);
 assert.match(gate,/await controller\.authenticate\(\)/);
 assert.match(gate,/await controller\.connect\(\)/);
});
