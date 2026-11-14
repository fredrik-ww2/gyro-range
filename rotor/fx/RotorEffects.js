import {EffectsCore} from './EffectsCore.js';
import {CollisionBridge} from './CollisionBridge.js';
import {createDecalGeometryClass} from './DecalGeometryFactory.js';

const vertex=`attribute vec3 center; attribute vec4 tint; attribute vec4 data;
varying vec2 vUv; varying vec4 vTint; varying float vDistance;
void main(){float a=data.y;vec2 p=position.xy; p=mat2(cos(a),-sin(a),sin(a),cos(a))*p*data.x;
vec4 view=modelViewMatrix*vec4(center,1.0);view.xy+=p;gl_Position=projectionMatrix*view;
float tile=data.z;vUv=(vec2(mod(tile,4.0),3.0-floor(tile/4.0))+uv*.98+.01)/4.0;vTint=tint;vDistance=-view.z;}`;
const fragment=`uniform sampler2D atlas;uniform vec3 fogColor;uniform float fogDensity;varying vec2 vUv;varying vec4 vTint;varying float vDistance;
void main(){vec4 s=texture2D(atlas,vUv);float a=s.a*vTint.a;if(a<.008)discard;
vec3 c=s.rgb*vTint.rgb;float fog=1.0-exp(-fogDensity*fogDensity*vDistance*vDistance);gl_FragColor=vec4(mix(c,fogColor,fog),a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
/** Modular renderer. Accept the host game's THREE instance; owns only its FX objects. */
export class RotorEffects {
 constructor({THREE,scene,camera,audio=null,atlas,bulletTexture=null,groundQuery=()=>({height:0,surface:'dirt'}),colliders=[],quality='mobile',reducedMotion=false,budget=null,limits={}}={}){
  if(!THREE||!scene||!camera||!atlas)throw new Error('THREE, scene, camera and atlas texture required');
  this.T=THREE;this.scene=scene;this.camera=camera;this.audio=audio;this.atlas=atlas;this.bulletTexture=bulletTexture;this.groundQuery=groundQuery;this.maxTraces=limits.tracers??32;this.maxTrails=limits.missileTrails??8;this.trailSpacing=limits.trailSpacing??1.3;this.ownedVoices=new Set();this.core=new EffectsCore({quality,reducedMotion,groundQuery,budget,onSound:e=>{const v=audio?.command(e);if(v)this.ownedVoices.add(v)}});this.bridge=new CollisionBridge({THREE,colliders,groundQuery});this.DecalGeometry=createDecalGeometryClass(THREE);
  this.root=new THREE.Group();this.root.name='Rotor Strike effects';scene.add(this.root);this.dummy=new THREE.Object3D();this.cameraWorld=new THREE.Vector3();this.v=new THREE.Vector3();this.w=new THREE.Vector3();this.normal=new THREE.Vector3();this.right=new THREE.Vector3();this.up=new THREE.Vector3();this.color=new THREE.Color();this.traces=[];this.wrecks=[];this.emitters=new Map();this.trails=new Map();this.metalMarks=new Map();this.disposed=false;
  const n=this.core.budget.particles;this.alpha=this.makeBatch(n,false,.00032);this.glow=this.makeBatch(n,true,.0007);this.root.add(this.alpha.mesh,this.glow.mesh);this.makeMarks();
  this.debris=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0x55534c,roughness:.85,metalness:.25}),this.core.budget.debris);this.debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.debris.frustumCulled=false;this.debris.count=0;this.root.add(this.debris);
  this.traceMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}),32);this.traceMesh.count=0;this.traceMesh.frustumCulled=false;this.root.add(this.traceMesh);
  this.lights=Array.from({length:2},()=>{const l=new THREE.PointLight(0xffbd6b,0,20,2);l.castShadow=false;this.root.add(l);return {light:l,life:0}});
 }
 makeBatch(count,additive,fogDensity=.00032){
  const T=this.T,base=new T.PlaneGeometry(1,1),g=new T.InstancedBufferGeometry();g.index=base.index;g.attributes.position=base.attributes.position;g.attributes.uv=base.attributes.uv;
  const center=new T.InstancedBufferAttribute(new Float32Array(count*3),3),tint=new T.InstancedBufferAttribute(new Float32Array(count*4),4),data=new T.InstancedBufferAttribute(new Float32Array(count*4),4);for(const a of [center,tint,data])a.setUsage(T.DynamicDrawUsage);g.setAttribute('center',center);g.setAttribute('tint',tint);g.setAttribute('data',data);g.instanceCount=0;
  const material=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{atlas:{value:this.atlas},fogColor:{value:additive?new T.Color(0):this.scene.fog?.color||new T.Color(0x9daaa9)},fogDensity:{value:fogDensity}},transparent:true,depthWrite:false,depthTest:true,blending:additive?T.AdditiveBlending:T.NormalBlending});
  const mesh=new T.Mesh(g,material);mesh.frustumCulled=false;mesh.renderOrder=additive?12:10;return {mesh,center,tint,data,items:[]};
 }
 makeMarks(){
  const T=this.T,n=this.core.budget.marks*5*5*6,g=new T.BufferGeometry();this.markPositions=new T.BufferAttribute(new Float32Array(n*3),3).setUsage(T.DynamicDrawUsage);this.markUV=new T.BufferAttribute(new Float32Array(n*2),2).setUsage(T.DynamicDrawUsage);this.markTint=new T.BufferAttribute(new Float32Array(n*4),4).setUsage(T.DynamicDrawUsage);g.setAttribute('position',this.markPositions);g.setAttribute('uv',this.markUV);g.setAttribute('tint',this.markTint);g.setDrawRange(0,0);
  this.marks=new T.Mesh(g,new T.ShaderMaterial({uniforms:{atlas:{value:this.atlas}},vertexShader:`attribute vec4 tint;varying vec4 vTint;varying vec2 vUv;void main(){vTint=tint;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform sampler2D atlas;varying vec4 vTint;varying vec2 vUv;void main(){vec4 s=texture2D(atlas,vUv);if(s.a*vTint.a<.005)discard;gl_FragColor=vec4(s.rgb*vTint.rgb,s.a*vTint.a);\n#include <colorspace_fragment>\n}`,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,side:T.DoubleSide}));this.marks.frustumCulled=false;this.marks.renderOrder=2;this.root.add(this.marks);
 }
 event(e){
  if(this.disposed)return false;const accepted=this.core.emit(e);if(!accepted)return false;
  if(e.type==='shot'||e.type==='launch'||e.type==='explosion'||e.type==='destroy'){const l=this.lights.find(l=>l.life<=0)||this.lights[0];l.light.position.copy(e.position);l.light.position.y+=.8;l.life=e.type==='shot'?.04:.11;l.light.intensity=e.type==='shot'?5:160*(e.scale||1);}
  return true;
 }
 tracer(from,to,{life=.055,width=.035}={}){if(!this.core.enabled||this.traces.length>=this.maxTraces)return;this.traces.push({from:{...from},to:{...to},age:0,life,width})}
 /** Emit trail by distance, not frame count. Stop/drop its loop with endTrail(id). */
 trail(id,position,opt={}){
  const spacing=Math.max(.8,opt.spacing??this.trailSpacing);
  if(!this.core.enabled)return;let t=this.trails.get(id);if(!t){if(this.trails.size>=this.maxTrails)return;t={previous:{...position},remainder:0,seen:this.core.time,dying:0};this.trails.set(id,t);this.audio?.play('robot_flyg_loop',{position,loop:true,id:'missile:'+id,gain:.7})}
  if(t.dying)return;
  t.seen=this.core.time;
  const dx=position.x-t.previous.x,dy=position.y-t.previous.y,dz=position.z-t.previous.z,d=Math.hypot(dx,dy,dz),count=Math.min(8,Math.floor((d+t.remainder)/spacing));
  for(let i=0;i<count;i++){const f=d?Math.min(1,(spacing-t.remainder+i*spacing)/d):1;this.core.particle({pos:{x:t.previous.x+dx*f,y:t.previous.y+dy*f+.2,z:t.previous.z+dz*f},life:this.core.range(3.2,4.6),size:opt.size??5.5,endSize:opt.endSize??15,color:[.93,.94,.92],alpha:.82,tile:0,trail:true,drag:.35,vel:{x:this.core.range(-.45,.45),y:.55,z:this.core.range(-.45,.45)}})}t.remainder=(d+t.remainder)%spacing;t.previous={...position};this.audio?.setPosition(this.audio.loops.get('missile:'+id),position);
 }
 endTrail(id){const t=this.trails.get(id);if(t&&!t.dying)t.dying=this.core.time;this.audio?.stop('missile:'+id,.06)}
 /** Visual wreck only: pass an expendable mesh/clone, never the live player helicopter. */
 fallingWreck({id,object,velocity={x:8,y:0,z:0},spin={x:.7,y:.3,z:.5},scale=1,disposeOnRemove=false}){
  if(!this.core.enabled||this.wrecks.some(w=>w.id===id)||!object)return false;if(this.wrecks.length>=4)this.removeWreck(this.wrecks[0]);
  this.scene.attach(object);this.wrecks.push({id,object,velocity:{...velocity},spin:{...spin},scale,age:0,landed:false,disposeOnRemove,smoke:0});return true;
 }
 removeWreck(w){w.object.removeFromParent();if(w.disposeOnRemove)w.object.traverse(o=>{o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean))m.dispose()});this.wrecks.splice(this.wrecks.indexOf(w),1)}
 renderBatch(batch,items){
  let i=0;const fov=(this.camera.fov||60)*Math.PI/180,px=Math.max(480,typeof innerHeight==='number'?innerHeight:844),minPix=16;for(const p of items){const t=p.age/p.life,dist=Math.sqrt(p.distance||1),floor=p.trail?dist*2*Math.tan(fov/2)*(minPix/px):0,s=Math.max(p.size+(p.endSize-p.size)*t,floor),fade=p.glow?(1-t)**1.5:p.trail?Math.min(1,(1-t)*1.6):Math.min(1,t*12)*Math.min(1,(1-t)*3);batch.center.setXYZ(i,p.pos.x,p.pos.y,p.pos.z);batch.tint.setXYZW(i,p.color[0],p.color[1],p.color[2],p.alpha*fade);batch.data.setXYZW(i,s,p.rotation,p.tile,0);i++}batch.mesh.geometry.instanceCount=i;for(const a of [batch.center,batch.tint,batch.data])a.needsUpdate=true;
 }
 syncMarks(){
  const T=this.T;let index=0;
  for(const [m,mesh] of this.metalMarks)if(!this.core.marks.includes(m)){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();this.metalMarks.delete(m)}
  for(const m of this.core.marks){
   const fade=Math.min(1,(m.life-m.age)/Math.min(8,m.life*.25));
   if(m.kind==='metal'&&m.anchor?.isMesh&&this.bulletTexture){
    let mesh=this.metalMarks.get(m);if(!mesh){m.anchor.updateWorldMatrix(true,false);const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(m.normal.x,m.normal.y,m.normal.z)),euler=new T.Euler().setFromQuaternion(q),g=new this.DecalGeometry(m.anchor,new T.Vector3(m.pos.x,m.pos.y,m.pos.z),euler,new T.Vector3(m.size*2,m.size*2,.12));g.applyMatrix4(m.anchor.matrixWorld.clone().invert());mesh=new T.Mesh(g,new T.MeshBasicMaterial({map:this.bulletTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:T.DoubleSide}));mesh.userData.ignoreProjectile=true;m.anchor.add(mesh);this.metalMarks.set(m,mesh)}mesh.material.opacity=fade;continue;
   }
   if(this.cameraWorld.distanceToSquared(m.pos)>650*650)continue;
   const ripple=m.kind==='ripple',size=m.size*(ripple?1+m.age*2.5:1),crater=m.kind==='crater';
   for(let row=0;row<5;row++)for(let col=0;col<5;col++)for(const [ox,oy]of [[0,0],[1,0],[0,1],[1,0],[1,1],[0,1]]){
    const u=(col+ox)/5,v=(row+oy)/5,x=(u-.5)*size*2,z=(v-.5)*size*2,c=Math.cos(m.rotation),s=Math.sin(m.rotation),wx=m.pos.x+x*c-z*s,wz=m.pos.z+x*s+z*c,g=this.groundQuery(wx,wz),r=Math.hypot(x,z)/Math.max(size,.01),rim=crater?.09*size*Math.exp(-(((r-.65)/.16)**2)):0;
    if(m.kind==='metal'){this.normal.set(m.normal.x,m.normal.y,m.normal.z).normalize();this.up.set(0,Math.abs(this.normal.y)>.9?0:1,Math.abs(this.normal.y)>.9?1:0);this.right.crossVectors(this.up,this.normal).normalize();this.up.crossVectors(this.normal,this.right);this.v.set(m.pos.x,m.pos.y,m.pos.z).addScaledVector(this.right,x*c-z*s).addScaledVector(this.up,x*s+z*c).addScaledVector(this.normal,.008);this.markPositions.setXYZ(index,this.v.x,this.v.y,this.v.z)}else this.markPositions.setXYZ(index,wx,(g?.height??m.pos.y)+.018+rim,wz);this.markUV.setXY(index,(m.tile%4+u*.96+.02)/4,(3-Math.floor(m.tile/4)+v*.96+.02)/4);this.markTint.setXYZW(index,ripple?.7:1,ripple?.85:1,ripple?.9:1,fade*(ripple?1-m.age/m.life:m.opacity));index++;
   }
  }
  this.marks.geometry.setDrawRange(0,index);for(const a of [this.markPositions,this.markUV,this.markTint])a.needsUpdate=true;
 }
 update(dt){
  if(this.disposed)return;dt=Math.max(0,Math.min(.05,dt));const T=this.T;
  for(const f of this.core.fires)if(f.anchor?.getWorldPosition){f.anchor.getWorldPosition(this.v);f.pos={x:this.v.x,y:this.v.y,z:this.v.z}}
  this.camera.getWorldPosition(this.cameraWorld);this.core.update(dt);for(const v of this.ownedVoices)if(!this.audio?.voices?.has(v))this.ownedVoices.delete(v);
  const alpha=this.alpha.items,glow=this.glow.items;alpha.length=glow.length=0;for(const p of this.core.particles){p.distance=this.cameraWorld.distanceToSquared(p.pos);if(p.distance<1400*1400)(p.glow?glow:alpha).push(p)}alpha.sort((a,b)=>b.distance-a.distance);this.renderBatch(this.alpha,alpha);this.renderBatch(this.glow,glow);this.syncMarks();
  let j=0;for(const d of this.core.debris){this.dummy.position.copy(d.pos);this.dummy.rotation.set(d.rotation,d.rotation*.71,d.rotation*.3);this.dummy.scale.set(d.size,d.size*.57,d.size*1.35);this.dummy.updateMatrix();this.debris.setMatrixAt(j,this.dummy.matrix);this.debris.setColorAt(j,this.color.set(d.metal?0x5b5c59:0x645b47));j++}this.debris.count=j;this.debris.instanceMatrix.needsUpdate=true;if(this.debris.instanceColor)this.debris.instanceColor.needsUpdate=true;
  for(let i=this.traces.length-1;i>=0;i--){this.traces[i].age+=dt;if(this.traces[i].age>this.traces[i].life)this.traces.splice(i,1)}
  j=0;for(const t of this.traces){this.v.copy(t.to).sub(t.from);const len=this.v.length();this.dummy.position.copy(t.from).addScaledVector(this.v,.5);this.dummy.quaternion.setFromUnitVectors(this.up.set(0,0,1),this.v.normalize());this.dummy.scale.set(t.width,t.width,len);this.dummy.updateMatrix();this.traceMesh.setMatrixAt(j++,this.dummy.matrix)}this.traceMesh.count=j;this.traceMesh.instanceMatrix.needsUpdate=true;
  for(const l of this.lights){l.life-=dt;if(l.life<=0)l.light.intensity=0;else l.light.intensity*=Math.exp(-dt*18)}
  for(const w of [...this.wrecks]){
   w.age+=dt;if(w.age>60){this.removeWreck(w);continue}if(w.landed)continue;
   const from=w.object.position.clone();w.velocity.y-=9.81*dt;w.object.position.x+=w.velocity.x*dt;w.object.position.y+=w.velocity.y*dt;w.object.position.z+=w.velocity.z*dt;w.object.rotation.x+=w.spin.x*dt;w.object.rotation.y+=w.spin.y*dt;w.object.rotation.z+=w.spin.z*dt;
   w.smoke+=dt;if(w.smoke>.09){w.smoke=0;this.core.cloud(w.object.position,2,{scale:1.1,rise:1,life:3,color:[.15,.16,.16],tile:1})}
   const hit=this.bridge.cast(from,w.object.position);if(hit){w.landed=true;w.object.position.copy(hit.position);w.object.position.y+=hit.surface==='water'?-.5:.5;w.object.rotation.z=.35;this.audio?.play('vrak_nedslag',{position:hit.position,priority:3});this.event({type:'destroy',id:'wreck-hit:'+w.id,targetId:w.id,position:hit.position,surface:hit.surface,normal:hit.normal,scale:w.scale,burning:hit.surface!=='water'});}
  }
  const live=new Set();for(const f of this.core.fires){const id='fire:'+f.id;live.add(id);if(!this.emitters.has(id)){const v=this.audio?.play('brand_loop',{position:f.pos,loop:true,id,gain:.5,priority:0});if(v)this.emitters.set(id,v)}const v=this.emitters.get(id);if(v)this.audio?.setPosition(v,f.pos)}
  for(const [id]of this.emitters)if(!live.has(id)){this.audio?.stop(id,.3);this.emitters.delete(id)}
  for(const [id,t]of this.trails){if(!t.dying&&this.core.time-t.seen>.45)this.endTrail(id);if(t.dying&&this.core.time-t.dying>4.4)this.trails.delete(id);}
 }
 setEnabled(value){this.core.enabled=!!value;this.root.visible=!!value;if(!value)this.reset()}
 reset(){for(const v of this.ownedVoices)this.audio?.stopVoice(v);this.ownedVoices.clear();this.core.reset();this.traces.length=0;for(const id of [...this.trails.keys()])this.endTrail(id);for(const id of this.emitters.keys())this.audio?.stop(id);this.emitters.clear();for(const w of [...this.wrecks])this.removeWreck(w);for(const l of this.lights){l.life=0;l.light.intensity=0}this.update(0)}
 dispose(){if(this.disposed)return;this.reset();for(const [m,mesh]of this.metalMarks){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose()}this.metalMarks.clear();this.root.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose()});this.root.removeFromParent();this.disposed=true}
 stats(){return {...this.core.stats(),trails:this.trails.size,wrecks:this.wrecks.length,drawCallsForEffects:5+this.metalMarks.size}}
}
