import * as THREE from 'three';
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
  addEventListener('deviceorientation',e=>{
   if(this.nativeSource)return;
   if (![e.alpha,e.beta,e.gamma].every(Number.isFinite)) return;
   Object.assign(this.values,{alpha:e.alpha,beta:e.beta,gamma:e.gamma});this.lastEvent=performance.now();this.received=true;
   const angle=screen.orientation?.angle ?? window.orientation ?? 0;
   this.euler.set(rad(e.beta),rad(e.alpha),-rad(e.gamma),'YXZ');
   this.raw.setFromEuler(this.euler).multiply(this.fix).multiply(this.screen.setFromAxisAngle(this.axis,-rad(angle)));
   if(this.pendingCenter){this.origin.copy(this.raw).invert();this.pendingCenter=false;}
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
 center(){this.nativeTime=null;this.fartRedo=false;if(this.nativeSource){this.raw.identity();this.origin.identity();this.pendingCenter=false;}else if(this.received){this.origin.copy(this.raw).invert();this.pendingCenter=false;}else this.pendingCenter=true;this.drag={x:0,y:0};this.smooth.identity();}
 // Test och köade gester matar samma fält som sensorn. Positiv tipp är framåt/nedåt, positiv vridning är åt höger.
 mataGest(pitchNedDps,vridHogerDps){this._injPitch=pitchNedDps;this._injTwist=vridHogerDps;this._inj=true;}
 hallSikte(){if(this.aimHeld)return;this.aimHeld=true;this.aimHold.copy(this.smooth);this.heldRelative.copy(this.relative);}
 bekraftaSikte(){if(!this.aimHeld)return;this.inv.copy(this.raw).invert();this.origin.copy(this.heldRelative).multiply(this.inv).normalize();this.smooth.copy(this.aimHold);this.target.copy(this.aimHold);this.aimHeld=false;this.prevRaw.copy(this.raw);this.fartRedo=true;}
 slappSikte(){if(!this.aimHeld)return;this.aimHeld=false;this.snap=true;this.prevRaw.copy(this.raw);}
 mataFart(dt){
  if(this._inj){this.values.pitchNedDps=this._injPitch;this.values.vridHogerDps=this._injTwist;this._inj=false;return Math.max(Math.abs(this._injPitch),this._injTwist);}
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
   // Återgång: när telefonen hållits still en stund glider utgångsläget mjukt mot nuvarande läge,
   // så siktet sakta återvänder till mitten. Rörelse mäts ur själva orienteringen (alla källor).
   if(s.brytare?.atergang!==false&&(s.aterga_s??0)>0&&nowMs-this.movedAt>(s.aterga_vila_s??.4)*1000){this.inv.copy(this.raw).invert();this.origin.slerp(this.inv,1-Math.exp(-dt/s.aterga_s)).normalize();}
   this.relative.multiplyQuaternions(this.origin,this.raw).normalize();
   if(this.relative.w<0)this.relative.set(-this.relative.x,-this.relative.y,-this.relative.z,-this.relative.w);
   // Kvaternionens rotationsvektor möjliggör känslighet/invertering utan Euler-gimbal.
   const angle=2*Math.acos(THREE.MathUtils.clamp(this.relative.w,-1,1));const sin=Math.sqrt(Math.max(0,1-this.relative.w*this.relative.w));
   this.vector.set(this.relative.x,this.relative.y,this.relative.z).multiplyScalar(sin>1e-6?angle/sin:2);
   this.vector.x*=s.kanslighet*(s.inverteraX?-1:1);this.vector.y*=s.kanslighet*(s.inverteraY?-1:1);this.vector.z*=s.kanslighet*(s.inverteraZ?-1:1);
   const len=this.vector.length();this.target.setFromAxisAngle(len?this.vector.normalize():this.axis,len);
  }else this.target.identity();
  this.target.multiply(this.dragQuat.setFromEuler(this.euler.set(this.drag.y,this.drag.x,0,'YXZ')));
  // Rak horisont: ta bort all lutning åt sidan (roll), så bilden aldrig känns sned efter rörelser.
  if(s.brytare?.horisont!==false){this.euler.setFromQuaternion(this.target,'YXZ');this.euler.z=0;this.target.setFromEuler(this.euler);}
  if(jump)this.smooth.copy(this.target);else this.smooth.slerp(this.target,1-Math.exp(-dt/s.utjamning_s));return this.smooth;
 }
}
