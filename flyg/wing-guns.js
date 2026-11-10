import * as THREE from 'three';
import {bromsa,MYNNING,luftdensitet} from './ballistik.js';
import {traffPost} from './omgang.js';
// Spårljusen är riktiga kulor: mynningshastighet, luftmotstånd och tyngd ur ballistik.js.
export class WingGuns {
 constructor(scene,aircraft,config,effects){this.aircraft=aircraft;this.c=config;this.fx=effects;this.pool=Array.from({length:config.sparljus_pool},()=>({p:new THREE.Vector3(),prev:new THREE.Vector3(),v:new THREE.Vector3(),life:0,owner:'spelare'}));this.next=0;this.model='typhoon';this.rays=[];this.lastConvergence=new THREE.Vector3();this.obj=new THREE.Object3D();this.axis=new THREE.Vector3(0,1,0);this.tmp=new THREE.Vector3();this.dir=new THREE.Vector3();this.origin=new THREE.Vector3();
  this.mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.08,1,4),new THREE.MeshBasicMaterial({color:0xffc45b,toneMapped:false,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false}),this.pool.length);this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);}
 rensa(){for(const s of this.pool)s.life=0;this.mesh.count=0;}
 fire(forward,hastighet,host=null,muzzles=null,owner='spelare'){
  const a=host||this.aircraft,pts=muzzles||this.c['mynningar_'+this.model];if(!pts)return [];
  this.lastConvergence.copy(a.position).addScaledVector(forward,this.c.konvergens_m);const ut=[];
  for(const point of pts){this.origin.set(point[0],point[1],point[2]).applyQuaternion(a.quaternion).add(a.position);
   this.dir.copy(this.lastConvergence).sub(this.origin).normalize();
   const slot=this.pool[this.next++%this.pool.length];slot.p.copy(this.origin);slot.prev.copy(this.origin);
   slot.v.copy(this.dir).multiplyScalar(MYNNING).add(hastighet);slot.life=this.c.sparljus_liv_s;slot.owner=owner;
   ut.push({origin:this.origin.clone(),direction:this.dir.clone()});
   this.fx.spela('mynningsflamma',{pos:this.origin.clone(),riktning:this.dir.clone(),kaliber_mm:this.c.kaliber_mm});
  }
  if(owner==='spelare')this.rays=ut;return ut;
 }
 update(dt,mal){let count=0;const traffar=[];
  for(const s of this.pool){if(s.life<=0)continue;s.life-=dt;if(s.life<=0)continue;s.prev.copy(s.p);bromsa(s.v,luftdensitet(s.p.y),dt);s.p.addScaledVector(s.v,dt);
   if(mal)for(const m of mal){if(!m.lever||m.agare===s.owner)continue;if(segmentTraff(s.prev,s.p,m.center,m.radie)){s.life=0;traffar.push(traffPost(m,s.p.clone(),s.owner));break;}}
   if(s.life<=0)continue;
   this.obj.position.copy(s.p);this.tmp.copy(s.v).normalize();if(this.tmp.lengthSq()<1e-6)continue;this.obj.quaternion.setFromUnitVectors(this.axis,this.tmp);this.obj.scale.set(1,Math.min(16,s.v.length()*dt*3.2+2),1);this.obj.updateMatrix();this.mesh.setMatrixAt(count++,this.obj.matrix);
  }
  this.mesh.count=count;this.mesh.instanceMatrix.needsUpdate=true;this.fx.uppdatera(dt);return traffar;
 }
}
function segmentTraff(p0,p1,c,rad){
 const abx=p1.x-p0.x,aby=p1.y-p0.y,abz=p1.z-p0.z,acx=c.x-p0.x,acy=c.y-p0.y,acz=c.z-p0.z,ab2=abx*abx+aby*aby+abz*abz;
 let t=ab2>1e-8?(acx*abx+acy*aby+acz*abz)/ab2:0;t=Math.max(0,Math.min(1,t));
 const dx=p0.x+abx*t-c.x,dy=p0.y+aby*t-c.y,dz=p0.z+abz*t-c.z;return dx*dx+dy*dy+dz*dz<=rad*rad;
}
