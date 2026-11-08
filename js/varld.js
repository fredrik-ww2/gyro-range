// Senare ska en färdig värld, miljö och enheter kunna laddas in här.
// Testbanan använder bara några lätta märken så man kan vända sig och gå.
// R62: inga extra glTF-filer, en geometri och ett material delas.
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
