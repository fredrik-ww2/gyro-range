// Två bomber. Enkel fallbana: tyngd och ett litet luftmotstånd. Exploderar mot marken.
export function skapaBomber(THREE,scene,max=2){
 const geo=new THREE.SphereGeometry(0.42,8,6),mat=new THREE.MeshLambertMaterial({color:0x3e433c});
 const mesh=new THREE.InstancedMesh(geo,mat,max);mesh.count=0;mesh.frustumCulled=false;scene.add(mesh);
 const lista=[],dummy=new THREE.Object3D();
 function rensa(){lista.length=0;mesh.count=0;}
 function fall(pos,vel,massa){if(lista.length>=max)return false;lista.push({x:pos.x,y:pos.y-1.2,z:pos.z,vx:vel.x,vy:vel.y-2,vz:vel.z,massa,liv:0});return true;}
 function uppdatera(dt,hojd,explodera){
  for(let i=lista.length-1;i>=0;i--){const b=lista[i],drag=0.06*dt;
   b.vx*=1-drag;b.vz*=1-drag;b.vy-=9.81*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.liv+=dt;
   const mark=hojd(b.x,b.z);if(b.y<=mark+0.5||b.liv>45){explodera(b,mark);lista.splice(i,1);}
  }
  mesh.count=lista.length;
  for(let i=0;i<lista.length;i++){const b=lista[i];dummy.position.set(b.x,b.y,b.z);dummy.scale.setScalar(b.massa>300?1.3:1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
  if(lista.length)mesh.instanceMatrix.needsUpdate=true;
 }
 return {fall,uppdatera,rensa,antal:()=>lista.length,lista};
}
