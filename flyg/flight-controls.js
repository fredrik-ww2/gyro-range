// Flygspecifik axelmappning. Skjutbanans delade gyro.js är oförändrad.
// Expo skickar vinkelhastigheter, inte absolut lutning. Centrera sätter referensen.
export class FlightInput {
 constructor(gyro, config, settings){this.gyro=gyro;this.c=config;this.settings=settings;this.active=false;this.native=false;this.web=null;this.origin=null;this.reset();
  addEventListener('ww2-native-gyro',e=>{if(!this.active||!window.ReactNativeWebView)return;const d=e.detail;if(!d||![d.x,d.y,d.z,d.t].every(Number.isFinite))return;this.native=true;
   if(this.t!==null){const dt=Math.min(.05,Math.max(0,d.t-this.t)),a=(screen.orientation?.angle??window.orientation??0)*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a);const clean=v=>Math.abs(v)<this.c.gyro_brus_rad_s?0:v;
    this.pose.pitch+=clean(d.x*cs-d.y*sn)*dt;this.pose.yaw+=clean(d.x*sn+d.y*cs)*dt;this.pose.roll-=clean(d.z)*dt;
   }this.t=d.t;
  });
  addEventListener('deviceorientation',e=>{if(!this.active||this.native||e.beta==null||e.gamma==null)return;this.web={pitch:e.beta*Math.PI/180,roll:-e.gamma*Math.PI/180,yaw:(e.alpha??0)*Math.PI/180};if(!this.origin)this.origin={...this.web};});
 }
 reset(){this.t=null;this.pose={pitch:0,roll:0,yaw:0};this.origin=this.web?{...this.web}:null;}
 center(){this.reset();this.gyro.center();}
 read(){let p=this.pose;if(!this.native&&this.web&&this.origin){const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));p={pitch:wrap(this.web.pitch-this.origin.pitch),roll:wrap(this.web.roll-this.origin.roll),yaw:wrap(this.web.yaw-this.origin.yaw)};}
  const dead=x=>Math.abs(x)<this.c.neutral_rad?0:x,clamp=(x,m)=>Math.max(-m,Math.min(m,x)),gain=this.settings.kanslighet;
  // Vridning runt lodrät axel = sidroder (pedaler). Fullt utslag vid roder_vinkel_rad, återgår till noll när telefonen vrids tillbaka.
  const rv=this.c.roder_vinkel_rad||0.35,roder=this.active&&(this.native||this.web)?clamp(dead(p.yaw)/rv,1):0;
  return {pitch:clamp(dead(p.pitch+this.gyro.drag.y)*gain,this.c.max_pitch),roll:clamp(dead(p.roll+(this.c.yaw_andel||0)*p.yaw+this.gyro.drag.x)*gain*this.c.bank_forstarkning,this.c.max_roll),roder,pose:{...p},source:this.native?'native':this.web?'webb':'finger'};
 }
}
// Exakt kritiskt dämpad fjäder för konstant mål per tidssteg: inga Euler-överslängar.
export function dampCritical(state,target,dt,omega){const x=state.x-target,j=state.v+omega*x,e=Math.exp(-omega*dt);state.x=target+(x+j*dt)*e;state.v=(state.v-omega*j*dt)*e;if(target===0&&Math.abs(state.x)<.001&&Math.abs(state.v)<.01)state.x=state.v=0;return state.x;}
