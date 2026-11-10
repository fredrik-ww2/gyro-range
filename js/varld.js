// Senare ska en färdig värld, miljö och enheter kunna laddas in här.
// Testbanan använder bara några lätta märken så man kan vända sig och gå.
// R62: inga extra glTF-filer, en geometri och ett material delas.
// Hinder: få delade geometrier, fyra material, inga skuggkastare. Lätt på mobil.
export function placeraHinder(THREE,scene){
 const box=new THREE.BoxGeometry(1,1,1);
 const hjul=new THREE.CylinderGeometry(1,1,.35,8);
 const material=new Map();
 const meshar=[];
 const hinder=[];
 function mat(yta,farg,metal){
  if(!material.has(yta))material.set(yta,new THREE.MeshStandardMaterial({color:farg,roughness:yta==='metall'?.48:.92,metalness:metal}));
  return material.get(yta);
 }
 function lagg(yta,farg,metal,geo,x,y,z,sx,sy,sz,rotY=0){
  const mesh=new THREE.Mesh(geo,mat(yta,farg,metal));
  mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); mesh.rotation.y=rotY;
  mesh.castShadow=false; mesh.receiveShadow=true; mesh.frustumCulled=true;
  mesh.userData.yta=yta;
  scene.add(mesh); meshar.push(mesh);
  const hx=Math.abs(Math.cos(rotY))*sx*.5+Math.abs(Math.sin(rotY))*sz*.5;
  const hz=Math.abs(Math.sin(rotY))*sx*.5+Math.abs(Math.cos(rotY))*sz*.5;
  hinder.push({minX:x-hx,maxX:x+hx,minZ:z-hz,maxZ:z+hz,yta});
 }
 // Lådor, murar, sandsäckar och ett vrak vid sidan av grusgången. Mitten (x nära 0) är fri.
 lagg('tra',0x6d5234,.04,box,-4.6,.42,-18,1.15,.84,1.05,.2);
 lagg('tra',0x6d5234,.04,box,-4.15,1.05,-18.35,.72,.62,.72,.5);
 lagg('tra',0x5c4630,.04,box,4.4,.38,-26,1.25,.76,.9,-.15);
 lagg('tra',0x5c4630,.04,box,-5.1,.4,-62,1,.8,1.3,.1);
 lagg('vagg',0x7d786e,.05,box,-6.4,.72,-36,.42,1.44,3.4,.12);
 lagg('vagg',0x7d786e,.05,box,5.6,.58,-52,3.1,1.16,.4,-.18);
 lagg('sand',0xc6b48a,0,box,3.15,.26,-30,1.7,.42,.58,.25);
 lagg('sand',0xc6b48a,0,box,3.35,.58,-30.15,1.25,.32,.5,.2);
 lagg('sand',0xb7a67e,0,box,-3.4,.26,-72,1.9,.42,.62,-.05);
 lagg('metall',0x5e666b,.72,box,6.6,.5,-42,1.15,.62,3.6,.55);
 lagg('metall',0x4e5559,.7,box,6.35,1.02,-41.4,.85,.42,1.35,.55);
 lagg('metall',0x3e4448,.65,hjul,5.7,.28,-40.6,.38,.7,.38,.55);
 lagg('metall',0x3e4448,.65,hjul,7.5,.28,-43.3,.38,.7,.38,.55);
 return {meshar,hinder};
}

export function placeraTestmal(THREE,scene){
 const geo=new THREE.BoxGeometry(.45,1.15,.45);
 const mat=new THREE.MeshStandardMaterial({color:0x8a8674,roughness:.92,metalness:0});
 const mal=[];
 for(const [x,z] of [[9,-18],[-11,-28],[7,-55],[-6,-8],[16,-42],[0,-90]]){
  const m=new THREE.Mesh(geo,mat);
  m.position.set(x,.58,z);
  m.castShadow=false;m.receiveShadow=false;m.frustumCulled=true;
  scene.add(m);mal.push(m);
 }
 return mal;
}
