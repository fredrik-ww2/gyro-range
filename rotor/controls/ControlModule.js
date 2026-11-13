/** Engine-independent control module. Flight consumes getCyclic, getCollective and getYaw.
 * The sight consumes getAimOffset. Optional aim/view state stays inside this module.
 * Flight angles: degrees, pitch forward+, roll right+, yaw clockwise+.
 * Aim angles: radians, yaw right+, pitch up+. No DOM, sensor or renderer code.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=v=>((v+180)%360+360)%360-180;
const finite=(v,name)=>{if(!Number.isFinite(v))throw new TypeError(`${name} must be finite`);return v;};
export const CONTROL_MODES=['gyro-flight','gyro-aim','gyro-both','touch'];
const MODE_PRESETS={
  'gyro-flight':{tiltEnabled:true,aimEnabled:true,aimRouting:'separate'},
  'gyro-aim':{tiltEnabled:false,aimEnabled:true,aimRouting:'separate'},
  'gyro-both':{tiltEnabled:true,aimEnabled:true,aimRouting:'shared'},
  'touch':{tiltEnabled:false,aimEnabled:true,aimRouting:'separate'}
};
export class ControlModule {
 constructor(options={}){
  this.settings={
   controlMode:'gyro-flight',deadzoneDeg:5,fullScaleDeg:30,sensitivity:1,smoothingSeconds:.16,yawFullScaleDeg:35,tiltEnabled:true,yawMode:'pedals',inputTimeoutSeconds:.6,
   aimEnabled:true,aimRouting:'separate',aimSensitivity:1,aimDeadzoneDeg:.5,aimSmoothingSeconds:.09,aimYawLimitDeg:35,aimPitchLimitDeg:25,cockpitEnabled:true,view:'cockpit',viewTransitionSeconds:.75
  };
  this.raw={pitch:0,roll:0,yaw:0};this.zero={...this.raw};this.direct={x:0,y:0};this.filtered={x:0,y:0,yaw:0};this.collective=.6;this.pedals=0;this.age=Infinity;
  this.aimRaw={pitch:0,yaw:0};this.aimZero={...this.aimRaw};this.aimDirect={x:0,y:0};this.aimFiltered={x:0,y:0};this.aimSource='direct';this.aimAge=Infinity;this.clutch=null;this.viewBlend=this.settings.view==='cockpit'?0:0;this.lookDown=false;
  this.configure(options);
 }
 configure(options={}){
  const preset=options.controlMode?MODE_PRESETS[options.controlMode]:null;
  if(options.controlMode&&!preset)throw new RangeError('Unknown mode');
  const n={...this.settings,...(preset||{}),...options};
  for(const k of ['deadzoneDeg','fullScaleDeg','sensitivity','smoothingSeconds','yawFullScaleDeg','inputTimeoutSeconds','aimSensitivity','aimDeadzoneDeg','aimSmoothingSeconds','aimYawLimitDeg','aimPitchLimitDeg','viewTransitionSeconds'])finite(n[k],k);
  if(n.deadzoneDeg<0||n.deadzoneDeg>=n.fullScaleDeg||n.fullScaleDeg>90)throw new RangeError('Require 0 ≤ deadzone < full scale ≤ 90');
  if(n.sensitivity<=0||n.sensitivity>4||n.smoothingSeconds<0||n.yawFullScaleDeg<=n.deadzoneDeg||n.yawFullScaleDeg>180||n.inputTimeoutSeconds<=0)throw new RangeError('Invalid flight settings');
  if(n.aimSensitivity<=0||n.aimSensitivity>4||n.aimDeadzoneDeg<0||n.aimDeadzoneDeg>=Math.min(n.aimYawLimitDeg,n.aimPitchLimitDeg)||n.aimYawLimitDeg>80||n.aimPitchLimitDeg>60||n.aimSmoothingSeconds<0||n.viewTransitionSeconds<=0)throw new RangeError('Invalid aim/view settings');
  if(!['pedals','orientation'].includes(n.yawMode)||!['separate','shared'].includes(n.aimRouting)||!['external','cockpit'].includes(n.view)||!CONTROL_MODES.includes(n.controlMode))throw new RangeError('Unknown mode');
  for(const k of ['tiltEnabled','aimEnabled','cockpitEnabled'])if(typeof n[k]!=='boolean')throw new TypeError(`${k} must be boolean`);
  if(this.clutch&&(!n.aimEnabled||n.aimRouting!==this.settings.aimRouting))this.setAimClutch(false);
  if(!n.cockpitEnabled)n.view='external';this.settings=n;
  if(!n.aimEnabled)this.centerAim();
 }
 setControlMode(mode){this.configure({controlMode:mode});}
 /** One sensor sample in flight degrees. The active mode decides whether it flies or aims. */
 feedOrientation({pitch,roll,yaw=0}){
  finite(pitch,'pitch');finite(roll,'roll');finite(yaw,'yaw');
  const mode=this.settings.controlMode;
  if(mode==='touch'){
   if(this.settings.yawMode==='orientation')this.setOrientation({pitch:0,roll:0,yaw});
   return;
  }
  if(mode==='gyro-aim'){
   // Forward tilt looks down. Right tilt looks right. Twist can still yaw the helicopter.
   this.setAimOrientation({pitch:-pitch,yaw:roll});
   if(this.settings.yawMode==='orientation')this.setOrientation({pitch:0,roll:0,yaw});
   return;
  }
  this.setOrientation({pitch,roll,yaw});
 }
 setOrientation({pitch,roll,yaw=0}){finite(pitch,'pitch');finite(roll,'roll');finite(yaw,'yaw');this.raw={pitch:wrap(pitch),roll:wrap(roll),yaw:wrap(yaw)};this.age=0;}
 setCyclic({x,y}){finite(x,'x');finite(y,'y');this.direct={x:clamp(x,-1,1),y:clamp(y,-1,1)};}
 setCollective(v){this.collective=clamp(finite(v,'collective'),0,1);}
 setYaw(v){this.pedals=clamp(finite(v,'yaw'),-1,1);}
 setAim({x,y}){finite(x,'aim x');finite(y,'aim y');this.aimDirect={x:clamp(x,-1,1),y:clamp(y,-1,1)};this.aimSource='direct';}
 setAimOrientation({pitch,yaw}){finite(pitch,'aim pitch');finite(yaw,'aim yaw');this.aimRaw={pitch:wrap(pitch),yaw:wrap(yaw)};this.aimSource='orientation';this.aimAge=0;}
 calibrateAim(){this.aimZero={...this.aimRaw};this.aimDirect={x:0,y:0};this.aimFiltered={x:0,y:0};if(this.clutch){this.clutch.raw={...this.raw};this.clutch.aim={x:0,y:0};}}
 centerAim(){this.calibrateAim();}
 setView(view){this.configure({view});}
 setLookDown(value){this.lookDown=!!value;}
 setAimClutch(pressed){
  if(pressed){if(!this.settings.aimEnabled||this.settings.aimRouting!=='shared'||this.clutch)return;
   this.clutch={raw:{...this.raw},cyclic:this.getCyclic(),yaw:this.getYaw(),aim:{...this.aimFiltered}};
  }else if(this.clutch){
   const h=this.clutch;const inverse=(v,full)=>v===0?0:Math.sign(v)*(this.settings.deadzoneDeg+Math.abs(v)*(full-this.settings.deadzoneDeg)/this.settings.sensitivity);
   this.zero.roll=wrap(this.raw.roll-inverse(h.cyclic.x,this.settings.fullScaleDeg));this.zero.pitch=wrap(this.raw.pitch-inverse(h.cyclic.y,this.settings.fullScaleDeg));
   if(this.settings.yawMode==='orientation')this.zero.yaw=wrap(this.raw.yaw-inverse(h.yaw,this.settings.yawFullScaleDeg));
   this.direct={...h.cyclic};this.aimDirect={...this.aimFiltered};this.aimSource='direct';this.clutch=null;
  }
 }
 calibrate(){this.clutch=null;this.zero={...this.raw};this.filtered={x:0,y:0,yaw:0};this.calibrateAim();}
 releaseMomentaryInputs(){this.setAimClutch(false);this.direct={x:0,y:0};this.pedals=0;this.age=Infinity;this.filtered={x:0,y:0,yaw:0};this.lookDown=false;}
 normalize(degrees,full=this.settings.fullScaleDeg){const d=wrap(degrees),s=this.settings;return Math.sign(d)*clamp((Math.abs(d)-s.deadzoneDeg)/(full-s.deadzoneDeg)*s.sensitivity,0,1);}
 aimNormalize(degrees,full){const d=wrap(degrees),s=this.settings;return Math.sign(d)*clamp((Math.abs(d)-s.aimDeadzoneDeg)/(full-s.aimDeadzoneDeg)*s.aimSensitivity,0,1);}
 update(dt){
  finite(dt,'dt');if(dt<0)throw new RangeError('dt must be nonnegative');this.age+=dt;this.aimAge+=dt;const s=this.settings,fresh=this.age<=s.inputTimeoutSeconds;
  let target=s.tiltEnabled?{x:fresh?this.normalize(this.raw.roll-this.zero.roll):0,y:fresh?this.normalize(this.raw.pitch-this.zero.pitch):0}:this.direct;
  let yaw=s.yawMode==='pedals'?this.pedals:(fresh?this.normalize(this.raw.yaw-this.zero.yaw,s.yawFullScaleDeg):0);
  if(this.clutch){target=fresh?this.clutch.cyclic:{x:0,y:0};if(s.yawMode==='orientation')yaw=fresh?this.clutch.yaw:0;}
  const t=s.smoothingSeconds===0?1:1-Math.exp(-dt/s.smoothingSeconds);
  this.filtered.x+=(target.x-this.filtered.x)*t;this.filtered.y+=(target.y-this.filtered.y)*t;this.filtered.yaw+=(yaw-this.filtered.yaw)*t;
  let a={x:0,y:0};
  if(s.aimEnabled){a=this.aimSource==='direct'?this.aimDirect:(this.aimAge<=s.inputTimeoutSeconds?{x:this.aimNormalize(this.aimRaw.yaw-this.aimZero.yaw,s.aimYawLimitDeg),y:this.aimNormalize(this.aimRaw.pitch-this.aimZero.pitch,s.aimPitchLimitDeg)}:{x:0,y:0});
   if(this.clutch){
    const yawPart=fresh?this.aimNormalize(this.raw.yaw-this.clutch.raw.yaw,s.aimYawLimitDeg):0;
    const rollPart=fresh?this.aimNormalize(this.raw.roll-this.clutch.raw.roll,s.aimYawLimitDeg):0;
    a=fresh?{x:clamp(this.clutch.aim.x+yawPart+rollPart,-1,1),y:clamp(this.clutch.aim.y-this.aimNormalize(this.raw.pitch-this.clutch.raw.pitch,s.aimPitchLimitDeg),-1,1)}:{x:0,y:0};
   }
  }
  const at=s.aimSmoothingSeconds===0?1:1-Math.exp(-dt/s.aimSmoothingSeconds);this.aimFiltered.x+=(a.x-this.aimFiltered.x)*at;this.aimFiltered.y+=(a.y-this.aimFiltered.y)*at;
  const goal=s.cockpitEnabled&&s.view==='cockpit'?1:0;const step=dt/s.viewTransitionSeconds;this.viewBlend=clamp(this.viewBlend+clamp(goal-this.viewBlend,-step,step),0,1);
 }
 getCyclic(){return{x:this.filtered.x,y:this.filtered.y};}
 getCollective(){return this.collective;}
 getYaw(){return this.filtered.yaw;}
 /** Sight offset in radians. Yaw is right+, pitch is up+. A fresh object every call. */
 getAimOffset(){const s=this.settings;return{yaw:this.aimFiltered.x*s.aimYawLimitDeg*Math.PI/180,pitch:this.aimFiltered.y*s.aimPitchLimitDeg*Math.PI/180};}
 getAim(){return this.getAimOffset();}
 getViewState(){const b=this.viewBlend;return{view:this.settings.view,blend:b*b*(3-2*b),cockpitEnabled:this.settings.cockpitEnabled,lookDown:this.lookDown,aimEnabled:this.settings.aimEnabled,aimClutch:!!this.clutch,controlMode:this.settings.controlMode};}
}
