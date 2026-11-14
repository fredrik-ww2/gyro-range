/** Simplified game flight model. All control sources share the three-method contract.
 * Tuning lives in the params object so config.json and the menu can change it.
 * Defaults match the original Rotor Strike model exactly.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const HOVER_COLLECTIVE=.60;
export const DEFAULT_FLIGHT={
  hoverCollective:HOVER_COLLECTIVE,
  maxAttitudeDeg:30,
  attitudeRate:4.5,
  transLiftStartKnots:25,
  transLiftEndKnots:45,
  transLiftMax:.22,
  hoverBand:.085,
  hoverAltGain:.012,
  hoverVertGain:.055,
  horizontalDrag:.075,
  verticalDrag:.38,
  torqueGain:.95,
  yawRateGain:1.05,
  yawDamping:1.15,
  tiltYaw:2.5,
  yawCap:1.65,
  maxHeight:360,
  groundClearance:3,
  autoTorque:true,
  hoverAssist:false
};
const NUMERIC=Object.keys(DEFAULT_FLIGHT).filter(k=>k!=='autoTorque'&&k!=='hoverAssist');
export class FlightDynamics {
  constructor(options){
    this.params={...DEFAULT_FLIGHT};
    this.assists={autoTorque:DEFAULT_FLIGHT.autoTorque,hover:DEFAULT_FLIGHT.hoverAssist};
    this.reset();
    if(options)this.configure(options);
  }
  reset(){this.x=0;this.y=62;this.z=360;this.vx=0;this.vy=0;this.vz=0;this.pitch=0;this.roll=0;this.heading=0;this.yawRate=0;this.elapsed=0;this.effectiveCollective=.6;this.liftFactor=1;this.hoverAltitude=null;this.groundContact=false;this.impactSpeed=0;}
  setAssists(values){Object.assign(this.assists,values);this.hoverAltitude=null;}
  configure(partial={}){
    const next={...this.params};
    for(const [k,v] of Object.entries(partial)){
      if(!(k in DEFAULT_FLIGHT))throw new TypeError(`Unknown flight setting ${k}`);
      if(k==='autoTorque'||k==='hoverAssist'){if(typeof v!=='boolean')throw new TypeError(`${k} must be boolean`);next[k]=v;continue;}
      if(!Number.isFinite(v))throw new TypeError(`${k} must be finite`);
      next[k]=v;
    }
    if(next.hoverCollective<=0||next.hoverCollective>1)throw new RangeError('hover collective');
    if(next.maxAttitudeDeg<=0||next.maxAttitudeDeg>80)throw new RangeError('attitude');
    if(next.attitudeRate<0||next.transLiftMax<0||next.transLiftMax>1)throw new RangeError('lift');
    if(next.transLiftEndKnots<=next.transLiftStartKnots)throw new RangeError('translational lift range');
    if(next.hoverBand<0||next.groundClearance<0||next.maxHeight<=0)throw new RangeError('flight limits');
    for(const k of NUMERIC)if(!Number.isFinite(next[k]))throw new TypeError(k);
    this.params=next;
    if('autoTorque' in partial)this.assists.autoTorque=partial.autoTorque;
    if('hoverAssist' in partial)this.setAssists({hover:partial.hoverAssist});
  }
  update(dt,controls,groundHeight=0){
    const c=controls.getCyclic(),collective=controls.getCollective(),yaw=controls.getYaw();
    this.impactSpeed=0;
    let remaining=clamp(dt,0,.1);
    while(remaining>1e-8){const h=Math.min(remaining,1/120);this.step(h,c,collective,yaw,groundHeight);remaining-=h;}
  }
  step(dt,c,collective,yaw,ground){
    const p=this.params,rad=Math.PI/180,t=1-Math.exp(-dt*p.attitudeRate);
    let px=c.y*p.maxAttitudeDeg*rad,rz=c.x*p.maxAttitudeDeg*rad;
    const forwardV=this.vx*Math.sin(this.heading)-this.vz*Math.cos(this.heading);
    const rightV=this.vx*Math.cos(this.heading)+this.vz*Math.sin(this.heading);
    const neutral=Math.hypot(c.x,c.y)<.07;
    if(this.assists.hover&&neutral){px=clamp(-forwardV*.04,-.3,.3);rz=clamp(-rightV*.04,-.3,.3);}
    this.pitch+=(px-this.pitch)*t;this.roll+=(rz-this.roll)*t;
    const knots=Math.hypot(this.vx,this.vz)*1.94384;
    const span=p.transLiftEndKnots-p.transLiftStartKnots;
    const u=clamp((knots-p.transLiftStartKnots)/span,0,1);
    this.liftFactor=1+p.transLiftMax*u*u*(3-2*u);
    const verticalFraction=Math.cos(this.pitch)*Math.cos(this.roll);
    let effective=collective;
    if(this.assists.hover&&neutral&&Math.abs(collective-p.hoverCollective)<p.hoverBand){
      if(this.hoverAltitude===null)this.hoverAltitude=this.y;
      effective=clamp(p.hoverCollective/(this.liftFactor*verticalFraction)+(this.hoverAltitude-this.y)*p.hoverAltGain-this.vy*p.hoverVertGain,0,1);
    }else this.hoverAltitude=null;
    this.effectiveCollective=effective;
    const lift=9.81*effective/p.hoverCollective*this.liftFactor;
    const forward=lift*Math.sin(this.pitch),side=lift*Math.sin(this.roll);
    this.vx+=(Math.sin(this.heading)*forward+Math.cos(this.heading)*side-this.vx*p.horizontalDrag)*dt;
    this.vz+=(-Math.cos(this.heading)*forward+Math.sin(this.heading)*side-this.vz*p.horizontalDrag)*dt;
    this.vy+=(lift*verticalFraction-9.81-this.vy*p.verticalDrag)*dt;
    const torque=this.assists.autoTorque?0:(effective-p.hoverCollective)*p.torqueGain;
    // Vänster kant upp ger positiv roll och positiv spak i x, och nosen går åt höger.
    const tilt=(p.tiltYaw||0)*(c.x*1.4+Math.sin(this.roll)*.4);
    this.yawRate+=(yaw*p.yawRateGain+tilt+torque-this.yawRate*p.yawDamping)*dt;
    this.yawRate=clamp(this.yawRate,-(p.yawCap||1.65),p.yawCap||1.65);
    this.heading+=this.yawRate*dt;
    this.x+=this.vx*dt;this.z+=this.vz*dt;this.y+=this.vy*dt;
    this.groundContact=this.y<ground+p.groundClearance;
    if(this.groundContact){this.impactSpeed=Math.max(this.impactSpeed,0,-this.vy);this.y=ground+p.groundClearance;this.vy=Math.max(0,this.vy);this.vx*=Math.exp(-dt*2);this.vz*=Math.exp(-dt*2);}
    if(this.y>p.maxHeight){this.y=p.maxHeight;this.vy=Math.min(0,this.vy);}
    this.elapsed+=dt;
  }
}
