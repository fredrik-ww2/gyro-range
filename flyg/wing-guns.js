import * as THREE from 'three';
// En fast instanspool för alla spårljus. Inga objekt skapas per bildruta.
export class WingGuns {
 constructor(scene,aircraft,config,effects){this.aircraft=aircraft;this.c=config;this.fx=effects;this.pool=Array.from({length:config.sparljus_pool},()=>({p:new THREE.Vector3(),v:new THREE.Vector3(),life:0}));this.next=0;this.model='typhoon';this.rays=[];this.lastConvergence=new THREE.Vector3();this.obj=new THREE.Object3D();this.axis=new THREE.Vector3(0,1,0);this.tmp=new THREE.Vector3();
 this.mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.12,1,4),new THREE.MeshBasicMaterial({color:0xffc45b,toneMapped:false,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false}),this.pool.length);this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);}
 fire(forward,speed){const a=this.aircraft,c=this.c;this.lastConvergence.copy(a.position).addScaledVector(forward,c.konvergens_m);this.rays=[];
  for(const point of c['mynningar_'+this.model]){const origin=new THREE.Vector3(...point).applyQuaternion(a.quaternion).add(a.position),dir=this.lastConvergence.clone().sub(origin).normalize();this.rays.push({origin:origin.clone(),direction:dir.clone()});
   const slot=this.pool[this.next++%this.pool.length];slot.p.copy(origin).addScaledVector(dir,2);slot.v.copy(dir).multiplyScalar(c.sparljus_ms).addScaledVector(forward,speed);slot.life=c.sparljus_liv_s;
   this.fx.spela('mynningsflamma',{pos:origin,riktning:dir,kaliber_mm:c.kaliber_mm});
  }
 }
 update(dt){let count=0;for(const s of this.pool){if(s.life<=0)continue;s.life-=dt;if(s.life<=0)continue;s.p.addScaledVector(s.v,dt);s.v.y-=9.80665*dt;this.obj.position.copy(s.p);this.tmp.copy(s.v).normalize();this.obj.quaternion.setFromUnitVectors(this.axis,this.tmp);this.obj.scale.set(1,Math.min(12,s.life*35),1);this.obj.updateMatrix();this.mesh.setMatrixAt(count++,this.obj.matrix);}this.mesh.count=count;this.mesh.instanceMatrix.needsUpdate=true;this.fx.uppdatera(dt);}
}
