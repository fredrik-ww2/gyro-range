/** Swept segment test: prevents fast bullets/rockets passing through targets. */
export class CollisionBridge {
 constructor({THREE,colliders=[],groundQuery=()=>null,step=1}={}){this.T=THREE;this.colliders=colliders;this.groundQuery=groundQuery;this.step=step;this.ray=new THREE.Raycaster();this.direction=new THREE.Vector3();this.normalMatrix=new THREE.Matrix3()}
 cast(from,to){
  const T=this.T,start=new T.Vector3(from.x,from.y,from.z),end=new T.Vector3(to.x,to.y,to.z),delta=end.clone().sub(start),length=delta.length();if(length<1e-7)return null;
  this.direction.copy(delta).divideScalar(length);this.ray.set(start,this.direction);this.ray.near=0;this.ray.far=length;
  // Host must supply collision meshes; do not raycast smoke, decals, or glass HUD.
  for(const o of this.colliders)o.updateWorldMatrix(true,true);
  const hit=this.ray.intersectObjects(this.colliders,true).find(h=>h.object.userData?.ignoreProjectile!==true);
  let result=hit?{position:hit.point.clone(),normal:hit.face?hit.face.normal.clone().applyNormalMatrix(this.normalMatrix.getNormalMatrix(hit.object.matrixWorld)):this.direction.clone().negate(),distance:hit.distance,surface:hit.object.userData.surface||'metal',object:hit.object,anchor:hit.object}:null;
  const limit=result?result.distance:length,steps=Math.max(1,Math.ceil(limit/Math.max(.1,this.step)));
  let previous=0;const below=t=>{const p=start.clone().addScaledVector(this.direction,t),g=this.groundQuery(p.x,p.z);return g&&p.y<=g.height?{p,g}:null};
  for(let i=0;i<=steps;i++){const t=limit*i/steps,b=below(t);if(b){let lo=previous,hi=t;for(let j=0;j<14;j++){const mid=(lo+hi)/2;if(below(mid))hi=mid;else lo=mid}const p=start.clone().addScaledVector(this.direction,hi),g=this.groundQuery(p.x,p.z);p.y=g.height;result={position:p,normal:new T.Vector3(g.normal?.x??0,g.normal?.y??1,g.normal?.z??0).normalize(),distance:hi,surface:g.surface||'dirt',object:null,anchor:null};break}previous=t}
  return result;
 }
}
