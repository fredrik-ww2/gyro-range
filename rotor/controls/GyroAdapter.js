/** Maps a phone orientation sensor to helicopter degrees.
 * pitch > 0 when the top of the screen tips forward (away from the pilot),
 * roll > 0 when the right side tips down, yaw > 0 clockwise.
 * Screen rotation is part of the quaternion, so portrait and landscape agree.
 * Deadzone, sensitivity and smoothing belong to ControlModule, not here.
 *
 * The same quaternion chain as vagn-test and panorama is used: YXZ, then a
 * fixed -90° roll so the screen looks along -Z, then the screen angle around Z.
 * Two-zone roll from flyg/ is an airplane rate command and is not used. A
 * helicopter cyclic is a stick position, so degrees of tilt become stick
 * deflection after the module's deadzone.
 */

const RAD=Math.PI/180;
const FIX=axisAngle(1,0,0,-Math.PI/2);

function axisAngle(x,y,z,angle){
  const h=angle/2,s=Math.sin(h);
  return {x:x*s,y:y*s,z:z*s,w:Math.cos(h)};
}
function mul(a,b){
  return {
    x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,
    y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,
    z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w,
    w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z
  };
}
function norm(q){
  const n=Math.hypot(q.x,q.y,q.z,q.w)||1;
  return {x:q.x/n,y:q.y/n,z:q.z/n,w:q.w/n};
}
function invert(q){return {x:-q.x,y:-q.y,z:-q.z,w:q.w};}
export function wrapDeg(d){return ((d+180)%360+360)%360-180;}

export function screenAngle(scope=globalThis){
  const v=scope.screen?.orientation?.angle??scope.window?.orientation??scope.orientation??0;
  return Number.isFinite(+v)?+v:0;
}

/** DeviceOrientation euler → unit quaternion in the screen's frame. Degrees in, screen angle in degrees. */
export function deviceQuaternion(alpha,beta,gamma,screenDeg=0){
  let q=norm(mul(eulerToQuat(beta*RAD,alpha*RAD,-gamma*RAD),FIX));
  if(screenDeg)q=norm(mul(q,axisAngle(0,0,1,-screenDeg*RAD)));
  return q;
}

function eulerToQuat(x,y,z){
  const c1=Math.cos(x/2),c2=Math.cos(y/2),c3=Math.cos(z/2);
  const s1=Math.sin(x/2),s2=Math.sin(y/2),s3=Math.sin(z/2);
  return {
    x:s1*c2*c3+c1*s2*s3,
    y:c1*s2*c3-s1*c2*s3,
    z:c1*c2*s3-s1*s2*c3,
    w:c1*c2*c3+s1*s2*s3
  };
}

/** YXZ euler in radians, matching three.js Euler.setFromRotationMatrix. */
export function quatToEulerYXZ(q){
  const x=q.x,y=q.y,z=q.z,w=q.w;
  const x2=x+x,y2=y+y,z2=z+z;
  const xx=x*x2,xy=x*y2,xz=x*z2;
  const yy=y*y2,yz=y*z2,zz=z*z2;
  const wx=w*x2,wy=w*y2,wz=w*z2;
  const m11=1-(yy+zz),m13=xz+wy,m21=xy+wz,m22=1-(xx+zz),m23=yz-wx,m31=xz-wy,m33=1-(xx+yy);
  const clamp=v=>Math.max(-1,Math.min(1,v));
  const ex=Math.asin(-clamp(m23));
  if(Math.abs(m23)<0.9999999)return {x:ex,y:Math.atan2(m13,m33),z:Math.atan2(m21,m22)};
  return {x:ex,y:Math.atan2(-m31,m11),z:0};
}

export function relativeAngles(origin,q){
  const e=quatToEulerYXZ(norm(mul(invert(origin),q)));
  return {pitch:wrapDeg(-e.x/RAD),roll:wrapDeg(e.z/RAD),yaw:wrapDeg(-e.y/RAD)};
}

export function quaternionForAngles({pitch=0,roll=0,yaw=0}){
  return eulerToQuat(-pitch*RAD,-yaw*RAD,roll*RAD);
}

/** New origin so the current device pose still reports the same stick angles. */
export function rebaseOrigin(deviceQ,angles){
  return norm(mul(deviceQ,invert(quaternionForAngles(angles))));
}

export function quatAngleDeg(a,b){
  const d=Math.abs(a.x*b.x+a.y*b.y+a.z*b.z+a.w*b.w);
  return 2*Math.acos(Math.min(1,d))/RAD;
}

/** Angles of `sample` relative to `zero`. Each is {alpha,beta,gamma,screen}. */
export function anglesBetween(zero,sample){
  const origin=deviceQuaternion(zero.alpha,zero.beta,zero.gamma,zero.screen||0);
  const q=deviceQuaternion(sample.alpha,sample.beta,sample.gamma,sample.screen||0);
  return relativeAngles(origin,q);
}

export class GyroAdapter {
  constructor(options={}){
    this.staleSeconds=options.staleSeconds??.5;
    this.glitchEulerDeg=options.glitchEulerDeg??40;
    this.glitchPhysicalDeg=options.glitchPhysicalDeg??20;
    this.now=options.now||(()=>globalThis.performance?.now?.()??Date.now());
    this.origin=null;
    this.lastQ=null;
    this.lastAngles={pitch:0,roll:0,yaw:0};
    this.lastSampleAt=-Infinity;
    this.pending=false;
    this.seen=false;
    this.listening=false;
    this.permission='unknown';
    this.allowed=false;
    this._onDevice=e=>this._handle(e);
  }
  listen(target=globalThis){
    if(this.listening||typeof target.addEventListener!=='function')return;
    target.addEventListener('deviceorientation',this._onDevice,{passive:true});
    this.listening=true;
    this._target=target;
  }
  /** Call from a tap. Starts requestPermission synchronously so iOS accepts the gesture. */
  async requestPermission(){
    const ask=T=>{
      try{return typeof T?.requestPermission==='function'?T.requestPermission():Promise.resolve(T?'granted':'unavailable');}
      catch(e){return Promise.reject(e);}
    };
    const orientation=ask(globalThis.DeviceOrientationEvent);
    const motion=ask(globalThis.DeviceMotionEvent);
    const [a,b]=await Promise.allSettled([orientation,motion]);
    const ov=a.status==='fulfilled'?a.value:'denied';
    const mv=b.status==='fulfilled'?b.value:'denied';
    this.allowed=ov==='granted'||mv==='granted'||ov==='unavailable';
    this.permission=this.allowed?(ov==='denied'?mv:ov):'denied';
    if(this.allowed)this.listen();
    return {orientation:ov,motion:mv,allowed:this.allowed};
  }
  _handle(e){
    if(![e.alpha,e.beta,e.gamma].every(Number.isFinite))return;
    this.ingest(e.alpha,e.beta,e.gamma,screenAngle(),this.now());
  }
  ingest(alpha,beta,gamma,screenDeg=0,timeMs=this.now()){
    const q=deviceQuaternion(alpha,beta,gamma,screenDeg);
    if(!this.origin||!this.lastQ){
      this.origin=q;this.lastQ=q;this.lastAngles={pitch:0,roll:0,yaw:0};
    }else{
      const physical=quatAngleDeg(this.lastQ,q);
      const rel=relativeAngles(this.origin,q);
      const jump=Math.hypot(wrapDeg(rel.pitch-this.lastAngles.pitch),wrapDeg(rel.roll-this.lastAngles.roll),wrapDeg(rel.yaw-this.lastAngles.yaw));
      if(physical<this.glitchPhysicalDeg&&jump>this.glitchEulerDeg&&jump>physical*4){
        this.origin=rebaseOrigin(q,this.lastAngles);
      }else this.lastAngles=rel;
      this.lastQ=q;
    }
    this.lastSampleAt=timeMs;this.pending=true;this.seen=true;
    return this.read(timeMs);
  }
  calibrate(timeMs=this.now()){
    if(this.lastQ){this.origin=this.lastQ;this.lastAngles={pitch:0,roll:0,yaw:0};this.lastSampleAt=timeMs;this.pending=true;}
    else this.origin=null;
  }
  fresh(now=this.now()){return this.seen&&(now-this.lastSampleAt)/1000<=this.staleSeconds;}
  read(now=this.now()){
    const fresh=this.fresh(now);
    return {pitch:this.lastAngles.pitch,roll:this.lastAngles.roll,yaw:this.lastAngles.yaw,fresh,age:this.seen?(now-this.lastSampleAt)/1000:Infinity};
  }
  /** One new sample, or null. Callers must not feed the module again until the next sample. */
  take(){
    if(!this.pending)return null;
    this.pending=false;
    return {pitch:this.lastAngles.pitch,roll:this.lastAngles.roll,yaw:this.lastAngles.yaw};
  }
}
