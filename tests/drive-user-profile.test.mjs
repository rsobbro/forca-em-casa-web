import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../google-drive-sync.js',import.meta.url),'utf8');
const ctrl=readFileSync(new URL('../google-drive-controller.js',import.meta.url),'utf8');
test('OAuth solicita Drive e a identidade verificada separadamente',()=>{
 assert.ok(source.includes("GOOGLE_AUTH_SCOPES=GOOGLE_IDENTITY_SCOPES+' '+GOOGLE_DRIVE_SCOPE"));
 assert.ok(source.includes('oauth2/v3/userinfo'));
 assert.ok(source.includes("identity?.email_verified"));
 assert.ok(source.includes("drive.user.emailAddress.toLowerCase()!==identity.email.toLowerCase()"));
});
test('perfil é armazenado como arquivo privado, distinto do histórico',()=>{
 assert.match(source,/DRIVE_PROFILE_NAME='perfil\.json'/);
 assert.match(source,/async function readProfile/);
 assert.match(source,/async function writeProfile/);
 assert.match(ctrl,/validGoogleIdentity\(user\)/);
 assert.match(ctrl,/validRegistration\(profile,this\.user\)/);
});

test('login básico não solicita drive.file',()=>{assert.match(source,/GOOGLE_LOGIN_SCOPES=GOOGLE_IDENTITY_SCOPES/);assert.match(source,/export function authorizeIdentity/);});
