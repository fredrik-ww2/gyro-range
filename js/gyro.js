import * as THREE from 'three';
import {tolkaOrientering} from './riktning.js';
const rad=THREE.MathUtils.degToRad;
// Samma orienteringskonvention som DeviceOrientationControls: YXZ, kamerans -Z,
// -90 grader runt X och skärmens vinkel runt Z. Alla alpha/beta/gamma används.
export class GyroAim {
 constructor(canvas, settings, config) {
  this.settings=settings;this.config=config;this.active=false;this.received=false;this.pendingCenter=true;
  this.raw=new THREE.Quaternion();this.origin=new THREE.Quaternion();this.target=new THREE.Quaternion();this.smooth=new THREE.Quaternion();this.relative=new THREE.Quaternion();
  this.euler=new THREE.Euler();this.fix=new THREE.Quaternion(-Math.SQRT1_2,0,0,Math.SQRT1_2);this.screen=new THREE.Quaternion();this.axis=new THREE.Vector3(0,0,1);this.vector=new THREE.Vector3();
  this.nativeSource=false;this.prevRaw=new THREE.Quaternion();this.inv=new THREE.Quaternion();this.movedAt=0;this.nativeTime=null;this.nativeDelta=new THREE.Quaternion();
  this.values={alpha:null,beta:null,gamma:null,acc:{x:0,y:0,z:0},rotationRate:{alpha:0,beta:0,gamma:0},interval:0,pitchNedDps:0,vridHogerDps:0};this.drag={x:0,y:0};this.dragQuat=new THREE.Quaternion();this.lastEvent=0;this.lastMotion=0;
  this.aimHold=new THREE.Quaternion();this.heldRelative=new THREE.Quaternion();this.rateQ=new THREE.Quaternion();this.aimHeld=false;this.snap=false;this.fartRedo=false;
  this.vinklar={pitch:0,roll:0,yaw:0};this.up=new THREE.Vector3(0,1,0);this.tvungenVinkel=null;
  addEventListener('deviceorientation',e=>{
   if(this.nativeSource)return;
   if (![e.alpha,e.beta,e.gamma].every(Number.isFinite)) return;
   this.lasOrientering(e.alpha,e.beta,e.gamma);
  },{passive:true});
  addEventListener('devicemotion',e=>{
   if(this.nativeSource)return;
   // acceleration, inte accelerationIncludingGravity: inga tyngdkraftsvärden integreras.
   for(const k of ['x','y','z']) this.values.acc[k]=Number.isFinite(e.acceleration?.[k])?e.acceleration[k]:0;
   for(const k of ['alpha','beta','gamma'])this.values.rotationRate[k]=Number.isFinite(e.rotationRate?.[k])?e.rotationRate[k]:0;
   this.values.interval=e.interval||0;this.lastMotion=performance.now();
  },{passive:true});
  // Expo Gyroscope: x/y/z är rad/s. Samma axelnamn som rotationRate alpha/beta/gamma.
  // Forskningsunderlaget 13.3–13.4: pitch=+x och yaw=-y efter skärmremappning.
  addEventListener('ww2-native-gyro',e=>{
   if(!window.ReactNativeWebView)return;
   const d=e.detail;if(!d||![d.x,d.y,d.z,d.t].every(Number.isFinite))return;
   if(!this.nativeSource){this.nativeSource=true;this.raw.identity();this.origin.identity();this.pendingCenter=false;this.nativeTime=null;this.values.acc={x:0,y:0,z:0};this.lastMotion=0;this.fartRedo=false;}
   const elapsed=this.nativeTime===null?0:d.t-this.nativeTime;this.nativeTime=d.t;
   this.lastEvent=performance.now();this.received=true;
   this.values.rotationRate={alpha:d.x*180/Math.PI,beta:d.y*180/Math.PI,gamma:d.z*180/Math.PI};this.values.interval=elapsed*1000;
   if(!this.active||elapsed<=0||elapsed>.25)return;
   const a=rad(screen.orientation?.angle??window.orientation??0),c=Math.cos(a),s=Math.sin(a);
   this.vector.set((d.x*c-d.y*s)*elapsed,-(d.x*s+d.y*c)*elapsed,-d.z*elapsed);
   const len=this.vector.length();if(len)this.raw.multiply(this.nativeDelta.setFromAxisAngle(this.vector.normalize(),len)).normalize();
  });
  addEventListener('ww2-native-status',e=>{if(window.ReactNativeWebView&&!e.detail?.available)this.values.nativeStatus='saknas/nekades';});
  let pointer=null,last=null;
  canvas.addEventListener('pointerdown',e=>{pointer=e.pointerId;last=[e.clientX,e.clientY];canvas.setPointerCapture(pointer);});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;this.drag.x-=(e.clientX-last[0])*config.dra_rad_px;this.drag.y-=(e.clientY-last[1])*config.dra_rad_px;this.drag.y=THREE.MathUtils.clamp(this.drag.y,-1.4,1.4);last=[e.clientX,e.clientY];});
  const end=()=>{pointer=null;};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 }
 stop(){this.active=false;if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'gyro-stop'}));}
 async start(){
  if(window.ReactNativeWebView){this.active=true;this.center();window.ReactNativeWebView.postMessage(JSON.stringify({type:'gyro-start'}));return {orientation:'granted',motion:'granted'};}
  // Båda anropen görs direkt i samma användartryck, före första await.
  const permission=T=>{try{return typeof T?.requestPermission==='function'?T.requestPermission():Promise.resolve(T?'granted':'unavailable');}catch(e){return Promise.reject(e);}};
  const orientation=permission(window.DeviceOrientationEvent);const motion=permission(window.DeviceMotionEvent);
  const [a,b]=await Promise.allSettled([orientation,motion]);
  this.active=a.status==='fulfilled'&&a.value==='granted';this.center();
  return {orientation:a.status==='fulfilled'?a.value:'denied',motion:b.status==='fulfilled'?b.value:'denied'};
 }
 center(){
  this.nativeTime=null;this.fartRedo=false;this.nollAlpha=this.values.alpha;this.nollBeta=this.values.beta;this.nollGamma=this.values.gamma;this._foreBeta=null;
  if(this.nativeSource){this.raw.identity();this.origin.identity();this.pendingCenter=false;}else if(this.received){this.origin.copy(this.raw).invert();this.pendingCenter=false;}else this.pendingCenter=true;
  this.drag={x:0,y:0};this.smooth.identity();this.aimHeld=false;this.vinklar.pitch=this.vinklar.yaw=this.vinklar.roll=0;
 }
 lasOrientering(alpha,beta,gamma){
  Object.assign(this.values,{alpha,beta,gamma});this.lastEvent=performance.now();this.received=true;
  const angle=screen.orientation?.angle ?? window.orientation ?? 0;
  this.euler.set(rad(beta),rad(alpha),-rad(gamma),'YXZ');
  this.raw.setFromEuler(this.euler).multiply(this.fix).multiply(this.screen.setFromAxisAngle(this.axis,-rad(angle)));
  if(this.pendingCenter){this.origin.copy(this.raw).invert();this.pendingCenter=false;}
 }
 // Test och köade gester matar samma fält som sensorn. Positiv tipp är framåt/nedåt, positiv vridning är åt höger.
 mataGest(pitchNedDps,vridHogerDps){this._injPitch=pitchNedDps;this._injTwist=vridHogerDps;this._inj=true;}
 // Tar bort yaw mot neutralläget så en dykvridning inte blir en sväng.
 nollaGira(){
  if(Number.isFinite(this.values.alpha))this.nollAlpha=this.values.alpha;
  this.vinklar.yaw=0;
  if(!this.received)return;
  this.relative.multiplyQuaternions(this.origin,this.raw).normalize();
  this.euler.setFromQuaternion(this.relative,'YXZ');
  this.euler.y=0;this.relative.setFromEuler(this.euler);
  this.origin.copy(this.relative).multiply(this.inv.copy(this.raw).invert()).normalize();
 }
 hallSikte(){if(this.aimHeld)return;this.aimHeld=true;this.aimHold.copy(this.smooth);this.heldRelative.copy(this.relative);}
 bekraftaSikte(){if(!this.aimHeld)return;this.inv.copy(this.raw).invert();this.origin.copy(this.heldRelative).multiply(this.inv).normalize();this.smooth.copy(this.aimHold);this.target.copy(this.aimHold);this.aimHeld=false;this.prevRaw.copy(this.raw);this.fartRedo=true;this.nollaGira();}
 slappSikte(){if(!this.aimHeld)return;this.aimHeld=false;this.snap=true;this.prevRaw.copy(this.raw);}
 skarmVinkel(){
  if(Number.isFinite(this.tvungenVinkel))return this.tvungenVinkel;
  const v=screen.orientation?.angle??window.orientation??0;
  return Number.isFinite(+v)?+v:0;
 }
 mataFart(dt){
  if(this._inj){this.values.pitchNedDps=this._injPitch;this.values.vridHogerDps=this._injTwist;this._inj=false;return Math.max(Math.abs(this._injPitch),this._injTwist);}
  if(!this.nativeSource&&Number.isFinite(this.values.beta)){
   if(!Number.isFinite(this._foreBeta)){this._foreBeta=this.values.beta;this._foreGamma=this.values.gamma||0;this._foreAlpha=this.values.alpha||0;this.values.pitchNedDps=0;this.values.vridHogerDps=0;return 0;}
   const fore={alpha:this._foreAlpha,beta:this._foreBeta,gamma:this._foreGamma};
   const v=tolkaOrientering(this.values.alpha,this.values.beta,this.values.gamma,fore,this.skarmVinkel());
   this._foreBeta=this.values.beta;this._foreAlpha=this.values.alpha||0;this._foreGamma=this.values.gamma||0;
   if(!(dt>0)){this.values.pitchNedDps=0;this.values.vridHogerDps=0;return 0;}
   const deg=180/Math.PI;
   // Positiv tipp är blick ned. Positiv vridning är åt höger, samma tecken som vinklar.yaw.
   this.values.pitchNedDps=-v.pitch*deg/dt;this.values.vridHogerDps=Math.max(v.yaw*deg/dt,Math.abs(v.roll)*deg/dt);
   return Math.max(Math.abs(this.values.pitchNedDps),Math.abs(v.yaw)*deg/dt,Math.abs(v.roll)*deg/dt);
  }
  if(!this.received||!(dt>0)){this.values.pitchNedDps=0;this.values.vridHogerDps=0;return 0;}
  if(!this.fartRedo){this.prevRaw.copy(this.raw);this.fartRedo=true;this.values.pitchNedDps=0;this.values.vridHogerDps=0;return 0;}
  this.rateQ.copy(this.prevRaw).invert().multiply(this.raw);
  if(this.rateQ.w<0)this.rateQ.set(-this.rateQ.x,-this.rateQ.y,-this.rateQ.z,-this.rateQ.w);
  const w=THREE.MathUtils.clamp(this.rateQ.w,-1,1),ang=2*Math.acos(w);this.prevRaw.copy(this.raw);
  if(ang>1.2){this.values.pitchNedDps=0;this.values.vridHogerDps=0;return 0;}
  const sin=Math.sqrt(Math.max(0,1-w*w)),k=(sin>1e-6?ang/sin:2)*(180/Math.PI)/dt;
  this.values.pitchNedDps=this.rateQ.x*k;this.values.vridHogerDps=Math.max(-this.rateQ.y*k,Math.abs(this.rateQ.z*k));
  return THREE.MathUtils.radToDeg(ang)/dt;
 }
 update(dt){
  const s=this.settings;
  const speed=this.mataFart(dt),nowMs=performance.now();
  if(speed>(s.aterga_trosk_dps??5))this.movedAt=nowMs;
  if(this.aimHeld){this.smooth.copy(this.aimHold);return this.smooth;}
  const jump=this.snap;this.snap=false;
  if(this.active&&this.received){
   // Absolut mot neutralläget. Pitch är fram/bak, roll är sidlutning. Yaw styr kroppen, inte siktet.
   this.relative.multiplyQuaternions(this.origin,this.raw).normalize();
   if(this.relative.w<0)this.relative.set(-this.relative.x,-this.relative.y,-this.relative.z,-this.relative.w);
   this.euler.setFromQuaternion(this.relative,'YXZ');
   this.kalla='euler';
  if(!this.nativeSource&&Number.isFinite(this.nollBeta)&&Number.isFinite(this.values.beta)){
   this.kalla='vinkel';
    const ang=this.skarmVinkel();
    const v=tolkaOrientering(this.values.alpha,this.values.beta,this.values.gamma,{alpha:this.nollAlpha,beta:this.nollBeta,gamma:this.nollGamma},ang);
    this.vinklar.pitch=v.pitch;this.vinklar.roll=v.roll;this.vinklar.yaw=v.yaw;
   }else{this.vinklar.pitch=this.euler.x;this.vinklar.yaw=this.euler.y;this.vinklar.roll=this.euler.z;}
   const sp=THREE.MathUtils.clamp(this.vinklar.pitch*s.kanslighet*(s.inverteraX?-1:1),-1.15,1.15);
   const sr=THREE.MathUtils.clamp(this.vinklar.roll*s.kanslighet*(s.inverteraZ?-1:1),-.95,.95);
   this.euler.set(sp,-sr,0,'YXZ');this.target.setFromEuler(this.euler);
  }else{this.vinklar.pitch=this.vinklar.yaw=this.vinklar.roll=0;this.target.identity();}
  this.target.multiply(this.dragQuat.setFromEuler(this.euler.set(this.drag.y,this.drag.x,0,'YXZ')));
  // Rak horisont: ta bort all lutning åt sidan (roll), så bilden aldrig känns sned efter rörelser.
  if(s.brytare?.horisont!==false){this.euler.setFromQuaternion(this.target,'YXZ');this.euler.z=0;this.target.setFromEuler(this.euler);}
  if(jump)this.smooth.copy(this.target);else this.smooth.slerp(this.target,1-Math.exp(-dt/s.utjamning_s));return this.smooth;
 }
}
