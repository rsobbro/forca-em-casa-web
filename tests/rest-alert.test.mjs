import test from 'node:test';
import assert from 'node:assert/strict';
import {unlockRestSound,playRestSound} from '../rest-alert.js';

test('alerta de descanso usa Web Audio original após gesto e vibra quando disponível',async()=>{
 const called={oscillators:0,starts:0,stops:0,vibrations:0};
 class FakeAudioContext {
  state='running';currentTime=0;destination={};
  createOscillator(){
   called.oscillators++;
   return {frequency:{value:0},type:'sine',connect(){},start(){called.starts++},stop(){called.stops++}};
  }
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}
 }
 const scope={AudioContext:FakeAudioContext,navigator:{vibrate(){called.vibrations++}}};
 assert.equal(await unlockRestSound(scope),true);
 assert.equal(playRestSound(scope),true);
 assert.deepEqual(called,{oscillators:3,starts:3,stops:3,vibrations:1});
});
