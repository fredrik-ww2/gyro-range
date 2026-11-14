/** Web Audio adapter. Call unlock() directly from a user gesture. */
function decodeBuffer(ctx,raw){
 const copy=raw.slice(0);
 return new Promise((resolve,reject)=>{
  let settled=false;
  const ok=b=>{if(!settled){settled=true;resolve(b);}};
  const bad=e=>{if(!settled){settled=true;reject(e);}};
  let pending;
  try{pending=ctx.decodeAudioData(copy,ok,bad);}catch(e){bad(e);return;}
  if(pending&&typeof pending.then==='function')pending.then(ok,bad);
 });
}
export class RotorAudio {
 constructor({baseURL=new URL('../audio/',import.meta.url),maxVoices=20,maxLoops=8,masterGain=.5,speedOfSound=false,context=null,preferMp3=false}={}){
  this.baseURL=new URL(baseURL,import.meta.url);this.maxVoices=maxVoices;this.maxLoops=maxLoops;this.masterGain=masterGain;this.speedOfSound=speedOfSound;this.context=context;this.ownsContext=!context;this.preferMp3=!!preferMp3;this.enabled=true;this.ducked=false;this.resumeFlight=false;this.buffers=new Map();this.pending=new Map();this.voices=new Set();this.loops=new Map();this.cooldowns=new Map();this.listener={x:0,y:0,z:0};this.cockpit=false;this.closed=false;this.engineGeneration=0;this.requestGeneration=0;this.flightState='stopped';
  this.visibility=()=>{if(globalThis.document?.hidden){this.resumeFlight=this.flightState==='running';this.suspend();}else this.afterHide();};
  globalThis.document?.addEventListener('visibilitychange',this.visibility);
  if(context)this.watchState();
 }
 watchState(){
  if(!this.context||this.stateBound)return;this.stateBound=true;
  this.context.addEventListener?.('statechange',()=>{
   const s=this.context.state;
   if(s==='interrupted'){if(this.flightState==='running')this.resumeFlight=true;this.flightState='stopped';for(const v of [...this.voices])this.cleanup(v);}
   if(!globalThis.document?.hidden&&(s==='interrupted'||s==='suspended')&&this.resumeFlight)this.context.resume?.().catch(()=>{});
   if(s==='running'&&this.resumeFlight&&this.enabled!==false&&this.flightState==='stopped'){this.resumeFlight=false;this.startFlight();}
  });
 }
 async afterHide(){
  if(this.closed||!this.context)return;
  try{await this.context.resume();}catch{}
  if(this.context.state==='running'&&this.resumeFlight&&this.enabled!==false){this.resumeFlight=false;this.flightState='stopped';await this.startFlight();}
 }
 async unlock(){
  if(this.closed)throw new Error('Audio disposed');
  if(!this.context){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)throw new Error('Web Audio is not supported');this.context=new C({latencyHint:'interactive'});this.ownsContext=true;this.watchState();}
  if(!this.master){const c=this.context;this.master=c.createGain();this.master.gain.value=this.masterGain;this.compressor=c.createDynamicsCompressor();this.compressor.threshold.value=-7;this.compressor.knee.value=5;this.compressor.ratio.value=8;this.compressor.attack.value=.003;this.compressor.release.value=.15;this.master.connect(this.compressor).connect(c.destination);this.flight=c.createGain();this.flight.connect(this.master)}
  if(this.context.state==='suspended'||this.context.state==='interrupted')await this.context.resume();
  if(!this.manifest){const r=await fetch(new URL('ljud.json',this.baseURL));if(!r.ok)throw new Error(`ljud.json HTTP ${r.status}`);this.manifest=await r.json();if(Number.isFinite(this.manifest.masterGain))this.masterGain=this.manifest.masterGain;this.master.gain.value=this.ducked?this.masterGain*.35:this.masterGain;}
  await this.preload(['kanon_skott','kanon_salva_loop','kanon_slut','robot_avfyr','explosion_nara','explosion_fjarran','traff_metall','traff_mark','vatten_plask','brand_loop','robot_flyg_loop','vrak_nedslag','varning_lasning','varning_lag_hojd','varning_grans','klick_brytare','pedal_tryck','spak_rorelse','skada_egen','hylsor']);return this;
 }
 async preload(names){return Promise.allSettled(names.map(n=>this.load(n)))}
 async load(name){
  if(this.buffers.has(name))return this.buffers.get(name);if(this.pending.has(name))return this.pending.get(name);
  const m=this.manifest?.events[name];if(!m)throw new Error(`Unknown sound ${name}`);
  const job=(async()=>{let error;const paths=(this.preferMp3?[m.fallback,m.file]:[m.file,m.fallback]).filter(Boolean);for(const path of paths){try{const r=await fetch(new URL(path,this.baseURL));if(!r.ok)throw new Error(`${r.status} ${path}`);const b=await decodeBuffer(this.context,await r.arrayBuffer());if(!this.closed)this.buffers.set(name,b);return b}catch(e){error=e}}throw error})();
  this.pending.set(name,job);try{return await job}finally{this.pending.delete(name)}
 }
 ramp(param,value,seconds=.025){const t=this.context.currentTime;param.cancelScheduledValues(t);param.setValueAtTime(param.value,t);param.linearRampToValueAtTime(value,t+seconds)}
 setListener(position,forward={x:0,y:0,z:-1},up={x:0,y:1,z:0}){
  this.listener={...position};const l=this.context?.listener;if(!l)return;const t=this.context.currentTime;
  if(l.positionX){for(const [prefix,p]of [['position',position],['forward',forward],['up',up]])for(const axis of ['X','Y','Z'])l[prefix+axis].setValueAtTime(p[axis.toLowerCase()],t)}else{l.setPosition(position.x,position.y,position.z);l.setOrientation(forward.x,forward.y,forward.z,up.x,up.y,up.z)}
 }
 distance(p){return p?Math.hypot(p.x-this.listener.x,p.y-this.listener.y,p.z-this.listener.z):0}
 setPosition(v,p){if(!v?.panner||!p)return;v.position={...p};const t=this.context.currentTime;for(const a of ['X','Y','Z'])v.panner['position'+a].setValueAtTime(p[a.toLowerCase()],t);const d=this.distance(p);this.ramp(v.filter.frequency,Math.max(700,16000/(1+d/150))*(this.cockpit?.6:1),.06)}
 setEnabled(on){this.enabled=!!on;if(!on){this.resumeFlight=false;this.stopFlight();for(const v of [...this.voices])this.stopVoice(v,.02);if(this.master)this.ramp(this.master.gain,0,.05);}else if(this.master)this.ramp(this.master.gain,this.ducked?this.masterGain*.35:this.masterGain,.08)}
 setDucked(on){this.ducked=!!on;if(!this.master||this.enabled===false)return;this.ramp(this.master.gain,on?this.masterGain*.35:this.masterGain,.08)}
 play(name,{position=null,gain=1,rate=1,loop=false,id=null,priority=1,when=null,bus='effects',delay=true}={}){
  if(this.enabled===false||this.closed||!this.context||this.context.state!=='running'||!this.manifest)return null;
  const distance=this.distance(position);if(distance>1800)return null;
  if(name==='explosion_nara'&&distance>180)name='explosion_fjarran';
  const m=this.manifest.events[name],b=this.buffers.get(name);if(!m)return null;
  // Do not queue late gunshots after download; prime cache and drop this stale event.
  if(!b){this.load(name).catch(()=>{});return null}
  const key=id??name;if(loop&&this.loops.has(key))return this.loops.get(key);
  if(loop&&this.loops.size>=this.maxLoops)return null;
  if(this.voices.size>=(priority<4?this.maxVoices-2:this.maxVoices))return null;
  const c=this.context,s=c.createBufferSource(),g=c.createGain(),filter=c.createBiquadFilter();s.buffer=b;s.loop=loop;s.playbackRate.value=Math.max(.5,Math.min(2,rate));if(loop){s.loopStart=m.loopStart||0;s.loopEnd=Math.min(m.loopEnd||b.duration,b.duration)}
  filter.type='lowpass';filter.frequency.value=Math.max(700,16000/(1+distance/150))*(this.cockpit?.6:1);
  const start=when??(c.currentTime+(this.speedOfSound&&delay&&!loop?Math.min(distance/343,4):0)),volume=m.volume*Math.max(0,Math.min(2,gain));
  g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(volume,start+(loop?.04:.002));s.connect(filter).connect(g);
  let panner=null;if(position){panner=c.createPanner();panner.panningModel='equalpower';panner.distanceModel='inverse';panner.refDistance=name.startsWith('explosion')?25:8;panner.rolloffFactor=.9;panner.maxDistance=1800;g.connect(panner).connect(bus==='flight'?this.flight:this.master)}else g.connect(bus==='flight'?this.flight:this.master);
  const v={source:s,gain:g,filter,panner,position,loop,id:key,name,priority,started:start,volume};this.voices.add(v);if(loop)this.loops.set(key,v);this.setPosition(v,position);
  s.onended=()=>this.cleanup(v);s.start(start);return v;
 }
 cleanup(v){this.voices.delete(v);if(this.loops.get(v.id)===v)this.loops.delete(v.id);for(const n of [v.source,v.filter,v.gain,v.panner])try{n?.disconnect()}catch{}}
 stopVoice(v,fade=.035){if(!v||v.stopping)return;v.stopping=true;if(this.loops.get(v.id)===v)this.loops.delete(v.id);const t=this.context.currentTime;this.ramp(v.gain.gain,0,fade);try{v.source.stop(t+fade+.003)}catch{this.cleanup(v)}}
 stop(id,fade=.035){this.stopVoice(this.loops.get(id),fade)}
 command(e){return this.play(e.name,{position:e.position,gain:e.gain,priority:e.priority})}
 async startFlight(){
  if(this.flightState!=='stopped')return;const generation=++this.engineGeneration;this.flightState='loading';
  await this.preload(['rotor_loop_lag','rotor_loop_hog','turbin_loop','vind_loop']);
  if(generation!==this.engineGeneration||this.closed||this.context.state!=='running')return;
  const when=this.context.currentTime+.04;for(const n of ['rotor_loop_lag','rotor_loop_hog','turbin_loop','vind_loop'])this.play(n,{loop:true,id:n,bus:'flight',gain:0,when,priority:3});this.flightState='running';this.setFlight({collective:.5,speed:0});
 }
 setFlight({collective=.5,speed=0,cockpit=false}={}){
  this.cockpit=cockpit;if(!this.context)return;const t=Math.max(0,Math.min(1,collective));
  // Same-phase rotor layers: linear crossfade avoids the +3 dB equal-power bump.
  for(const [key,weight]of [['rotor_loop_lag',1-t],['rotor_loop_hog',t],['turbin_loop',.55+.45*t],['vind_loop',Math.min(1,Math.max(0,speed)/70)]]){const v=this.loops.get(key);if(v)this.ramp(v.gain.gain,this.manifest.events[key].volume*weight*(cockpit?.65:1),.15)}
 }
 stopFlight(){this.engineGeneration++;this.flightState='stopped';for(const n of ['rotor_loop_lag','rotor_loop_hog','turbin_loop','vind_loop'])this.stop(n,.25)}
 startCannon(position){return this.play('kanon_salva_loop',{position,loop:true,id:'cannon',priority:3,delay:false})}
 stopCannon(position){if(!this.loops.has('cannon'))return;this.stop('cannon',.012);this.play('kanon_slut',{position,delay:false,priority:3})}
 warn(name){if(!this.context)return;const now=this.context.currentTime;if(now<(this.cooldowns.get(name)||0))return;this.cooldowns.set(name,now+2);this.play(name,{priority:5});this.ramp(this.flight.gain,.65,.025);this.flight.gain.setTargetAtTime(1,now+.8,.15)}
 suspend(){this.engineGeneration++;this.requestGeneration++;this.flightState='stopped';for(const v of [...this.voices])this.stopVoice(v,.01);for(const v of [...this.voices]){try{v.source.stop()}catch{}this.cleanup(v)}return this.context?.suspend()}
 reset(){this.engineGeneration++;this.requestGeneration++;this.flightState='stopped';for(const v of [...this.voices])this.stopVoice(v,.01);this.cooldowns.clear()}
 async dispose(){if(this.closed)return;this.reset();this.closed=true;globalThis.document?.removeEventListener('visibilitychange',this.visibility);for(const v of [...this.voices]){try{v.source.stop()}catch{}this.cleanup(v)}for(const n of [this.flight,this.master,this.compressor])n?.disconnect();if(this.ownsContext)await this.context?.close();this.buffers.clear();this.pending.clear()}
 stats(){return {voices:this.voices.size,loops:this.loops.size,decodedBytes:[...this.buffers.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0)}}
}
