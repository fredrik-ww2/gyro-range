/** Renderer-independent visual simulation. Metres, seconds, Y up. No damage logic. */
export const PRESETS = Object.freeze({mobile:{particles:360,marks:48,metalMarks:12,debris:40,fires:4},high:{particles:900,marks:100,metalMarks:24,debris:90,fires:8}});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const vec=(p={})=>({x:+p.x||0,y:+p.y||0,z:+p.z||0});
const length=p=>Math.hypot(p.x,p.y,p.z);
const normalize=p=>{const n=length(p)||1;return {x:p.x/n,y:p.y/n,z:p.z/n}};
export class EffectsCore {
 constructor({quality='mobile',seed=17431,groundQuery=()=>({height:0,surface:'dirt'}),onSound=()=>{},wind={x:.6,y:0,z:.2},reducedMotion=false,budget=null}={}){
  this.budget={...(PRESETS[quality]||PRESETS.mobile),...(budget||{})};this.seed=seed>>>0;this.groundQuery=groundQuery;this.onSound=onSound;this.wind=vec(wind);this.reducedMotion=reducedMotion;
  this.particles=[];this.marks=[];this.debris=[];this.fires=[];this.seen=new Map();this.destroyed=new Set();this.time=0;this.kick=0;this.enabled=true;this.dropped=0;
 }
 random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296}
 range(a,b){return a+(b-a)*this.random()}
 accept(id){if(id===undefined||id===null)return true;if(this.seen.has(id))return false;this.seen.set(id,this.time);if(this.seen.size>1024)this.seen.delete(this.seen.keys().next().value);return true}
 particle(p){if(this.particles.length>=this.budget.particles){this.dropped++;return}this.particles.push({age:0,life:1,size:.1,endSize:.5,alpha:1,color:[1,1,1],tile:0,glow:false,drag:1,gravity:0,wind:.2,spin:this.range(-.6,.6),rotation:this.range(0,6.28),vel:{x:0,y:0,z:0},...p,pos:vec(p.pos),vel:vec(p.vel)})}
 cloud(pos,n,{scale=1,color=[.42,.39,.34],rise=1,speed=2,life=3,glow=false,tile=0,gravity=0,normal={x:0,y:1,z:0}}={}){
  for(let i=0;i<n;i++){const a=this.range(0,6.283),r=this.range(.1,1)*speed;this.particle({pos,vel:{x:Math.cos(a)*r+normal.x*speed*.7,y:this.range(.2,1)*rise+normal.y*speed*.25,z:Math.sin(a)*r+normal.z*speed*.7},life:this.range(.6,1.3)*life,size:this.range(.12,.4)*scale,endSize:this.range(.7,1.8)*scale,alpha:glow?.95:.65,color,tile,glow,gravity,drag:glow?.4:1.1})}
 }
 mark(pos,size,{tile=6,life=100,normal={x:0,y:1,z:0},anchor=null,kind='scorch'}={}){
  if(kind==='metal'&&this.marks.filter(m=>m.kind==='metal').length>=this.budget.metalMarks)this.marks.splice(this.marks.findIndex(m=>m.kind==='metal'),1);if(this.marks.length>=this.budget.marks)this.marks.shift();const m={pos:vec(pos),normal:normalize(vec(normal)),size,rotation:this.range(0,6.283),age:0,life,tile,anchor,kind,opacity:.85};this.marks.push(m);return m;
 }
 chunks(pos,count,scale=1,metal=false){for(let i=0;i<count&&this.debris.length<this.budget.debris;i++){const a=this.range(0,6.28),s=this.range(2,8)*scale;this.debris.push({pos:vec(pos),vel:{x:Math.cos(a)*s,y:this.range(3,8)*scale,z:Math.sin(a)*s},age:0,life:this.range(1,3),size:this.range(.035,.13)*scale,rotation:this.range(0,6.28),spin:this.range(-9,9),metal,bounces:0})}}
 sound(name,e,gain=1){this.onSound({name,position:vec(e.position),gain,id:e.id,priority:e.type==='destroy'?3:2})}
 emit(e){
  if(!this.enabled||!e||!['shot','launch','impact','explosion','destroy'].includes(e.type))return false;
  if(!e.position||!['x','y','z'].every(k=>Number.isFinite(e.position[k])))throw new TypeError('event.position requires finite x/y/z');
  if(e.type==='destroy'&&e.targetId&&this.destroyed.has(e.targetId))return false;
  if(!this.accept(e.id))return false;
  const p=vec(e.position),n=normalize(vec(e.normal||{x:0,y:1,z:0})),surface=e.surface||'dirt';
  if(e.type==='shot'){
   this.particle({pos:p,life:.045,size:.18,endSize:.65,color:[1,.65,.2],tile:3,glow:true,alpha:.95});
   this.cloud(p,2,{scale:.12,speed:.5,rise:.2,life:.35,color:[.5,.51,.5]});if(!e.silent)this.sound('kanon_skott',e);this.kick=Math.min(.12,this.kick+.022);return true;
  }
  if(e.type==='launch'){
   this.cloud(p,8,{scale:.5,speed:2,rise:.3,life:.35,color:[1,.45,.1],tile:2,glow:true});this.cloud(p,8,{scale:.8,speed:2,life:1.6});this.sound('robot_avfyr',e);return true;
  }
  if(e.type==='impact'){
   if(surface==='water'){
    this.cloud(p,15,{scale:.25,speed:2,rise:4,life:.6,color:[.72,.88,.9],tile:5,gravity:9.81});this.mark(p,.22,{tile:8,life:2,kind:'ripple'});this.sound('vatten_plask',e,.5);
   }else if(surface==='metal'){
    this.cloud(p,14,{scale:.09,speed:6,rise:2,life:.28,color:[1,.62,.2],tile:4,glow:true,gravity:8,normal:n});this.cloud(p,3,{scale:.22,speed:1,life:.7,color:[.45,.46,.45],normal:n});
    this.mark(p,.10,{tile:7,normal:n,life:90,anchor:e.anchor,kind:'metal'});this.chunks(p,3,.3,true);this.sound('traff_metall',e);
   }else{
    this.cloud(p,10,{scale:.32,speed:1.5,rise:1.4,life:1.2,color:surface==='stone'?[.5,.51,.5]:[.48,.40,.28],normal:n});this.chunks(p,5,.3);this.mark(p,.18,{tile:7,normal:n,life:65,kind:'bullet'});this.sound('traff_mark',e);
   }return true;
  }
  const scale=clamp(e.scale??1,.25,3);
  if(e.type==='destroy'){
   if(e.targetId){this.destroyed.add(e.targetId);if(this.destroyed.size>4096)this.destroyed.delete(this.destroyed.values().next().value)}
   if(surface!=='water'&&e.burning!==false){if(this.fires.length>=this.budget.fires)this.fires.shift();this.fires.push({pos:p,age:0,life:28,acc:0,scale,anchor:e.anchor||null,id:e.targetId||e.id});}
  }
  const water=surface==='water';
  if(!water){
   this.particle({pos:p,life:.075,size:scale*.8,endSize:scale*4,alpha:.95,color:[1,.85,.5],tile:3,glow:true});
   this.cloud(p,22,{scale:scale*2,speed:6*scale,rise:3*scale,life:.48,color:[1,.42,.08],tile:2,glow:true});
   this.cloud(p,32,{scale:scale*2.4,speed:4*scale,rise:3*scale,life:5.5,color:[.19,.19,.18],tile:1});
   if(e.grounded!==false)this.cloud(p,26,{scale:scale*2,speed:7*scale,rise:.25,life:2.4,color:[.52,.44,.32]});
   this.chunks(p,22,scale,surface==='metal');
   if(e.grounded!==false&&surface!=='metal')this.mark(p,scale*2.1,{life:150,normal:n,kind:'crater'});
  }else{
   this.cloud(p,50,{scale:scale*1.5,speed:5*scale,rise:14*scale,life:2,color:[.72,.82,.82],tile:5,gravity:9.81});this.cloud(p,12,{scale:scale*2,speed:3,rise:1,life:2.8,color:[.7,.8,.82]});this.mark(p,scale*1.2,{tile:8,life:4,kind:'ripple'});
  }
  this.sound(e.sound||'explosion_nara',e);this.kick=Math.max(this.kick,.35*scale);return true;
 }
 releaseTarget(id){this.destroyed.delete(id)}
 update(dt){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.05);this.time+=dt;this.kick*=Math.exp(-dt*9);
  for(const [k,t]of this.seen)if(this.time-t>12)this.seen.delete(k);
  for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.age+=dt;if(p.age>=p.life){this.particles.splice(i,1);continue}const f=Math.exp(-p.drag*dt);p.vel.x*=f;p.vel.z*=f;p.vel.y=(p.vel.y-p.gravity*dt)*f;p.pos.x+=(p.vel.x+this.wind.x*p.wind)*dt;p.pos.y+=p.vel.y*dt;p.pos.z+=(p.vel.z+this.wind.z*p.wind)*dt;p.rotation+=p.spin*dt;}
  for(let i=this.marks.length-1;i>=0;i--){const m=this.marks[i];m.age+=dt;if(m.age>=m.life)this.marks.splice(i,1)}
  for(let i=this.debris.length-1;i>=0;i--){const d=this.debris[i];d.age+=dt;if(d.age>d.life){this.debris.splice(i,1);continue}d.vel.y-=9.81*dt;d.pos.x+=d.vel.x*dt;d.pos.y+=d.vel.y*dt;d.pos.z+=d.vel.z*dt;d.rotation+=d.spin*dt;const g=this.groundQuery(d.pos.x,d.pos.z);if(g&&d.pos.y<g.height+.03){d.pos.y=g.height+.03;d.vel.y=Math.abs(d.vel.y)*.23;d.vel.x*=.48;d.vel.z*=.48;d.bounces++;if(g.surface==='water'||d.bounces>2)d.age=d.life;}}
  for(let i=this.fires.length-1;i>=0;i--){const f=this.fires[i];f.age+=dt;if(f.age>f.life){this.fires.splice(i,1);continue}f.acc+=dt;while(f.acc>=.12){f.acc-=.12;const s=f.scale,fade=1-f.age/f.life;this.cloud(f.pos,1,{scale:2*s,speed:.35,rise:2.7,life:4.5,color:[.17,.18,.18],tile:1});if(fade>.2)this.cloud(f.pos,2,{scale:s*.8*fade,speed:.3,rise:1.8,life:.55,color:[1,.42,.08],glow:true,tile:2});}}
 }
 reset(){this.particles.length=this.marks.length=this.debris.length=this.fires.length=0;this.seen.clear();this.destroyed.clear();this.kick=0;this.time=0}
 get cameraKick(){return this.reducedMotion?0:this.kick}
 stats(){return {particles:this.particles.length,marks:this.marks.length,debris:this.debris.length,fires:this.fires.length,dropped:this.dropped}}
}
