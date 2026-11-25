/** Original short alert generated with Web Audio. No downloaded sounds.
 * AudioContext can only be activated from a direct user gesture on mobile.
 */
let context=null;
export async function unlockRestSound(scope=globalThis){
 const Audio=scope.AudioContext||scope.webkitAudioContext;
 if(typeof Audio!=='function')return false;
 try{
  if(!context)context=new Audio();
  if(context.state==='suspended')await context.resume();
  return context.state==='running';
 }catch{return false}
}
export function playRestSound(scope=globalThis){
 if(!context||context.state!=='running')return false;
 try{
  for(const [offset,freq] of [[0,740],[0.18,920],[0.36,740]]){
   const tone=context.createOscillator(),gain=context.createGain();
   tone.type='sine';tone.frequency.value=freq;
   tone.connect(gain);gain.connect(context.destination);
   const t=context.currentTime+offset;
   gain.gain.setValueAtTime(0.0001,t);
   gain.gain.exponentialRampToValueAtTime(0.16,t+0.014);
   gain.gain.exponentialRampToValueAtTime(0.0001,t+0.14);
   tone.start(t);tone.stop(t+0.15);
  }
  try{scope.navigator?.vibrate?.([100,60,100])}catch{}
  return true;
 }catch{return false}
}
