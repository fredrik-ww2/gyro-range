import * as THREE from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {MeshoptDecoder} from './vendor/loaders/meshopt_decoder.module.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
import {GyroAim} from './gyro.js';
import {createHaptics} from './haptics.js';
import {skapaDetektor,nastaStallning,simulera,skapaKnyckStallning,STALLNING_NAMN} from './stallning.js';
import {gangFaktor,skakSekunder,rorelseStyrka,skakAmplitud} from './gang.js';
import {skapaStyrning,byggMeny,byggSnabb} from './styrning.js';
import {skapaGyroMeny,byggStyrMeny,skapaLager,skapaTick,graderPerSekund} from './gyroMeny.js';
import {gangFartFranLutning,kroppFartRad,kroppIVila,hoftMalRad,benFoljer,skapaKnyck,svangFranRoll,knuffUt,sidoAndel} from './rorelse.js';
import {placeraTestmal,placeraHinder} from './varld.js';
import {traffSlag} from './traff.js';
import {skapaBen} from './benpose.js';
import {monteraSkjutbana} from './gyrobox-adapter.js';
import {skapaEffekterV2d} from '../assets/effekter/effekter_v2d.js';
const $=id=>document.getElementById(id);
const loadJSON=async p=>{const r=await fetch(new URL('../data/'+p,import.meta.url));if(!r.ok)throw Error(p+': '+r.status);return r.json();};
const t0=performance.now();
const MAX_YAW=Math.PI/4, MAX_PITCH=Math.PI/2, PULL_PX=64;
try { await boot(); } catch(e){const s=$('status');if(s)s.textContent='Kunde inte starta: '+e.message;console.error(e);}
async function boot(){
 const [cfg,weapons,hapticDefaults]=await Promise.all(['spel.json','vapen.json','haptik.json'].map(loadJSON));
 let saved={};try{saved=JSON.parse(localStorage.getItem('gyro_faltprov_v1')||'{}');}catch{}
 const settings={...cfg.styrning,...saved.styrning,brytare:{...cfg.brytare,...saved.brytare},hapticStyle:saved.hapticStyle||'auto'};
 settings.kanslighet=THREE.MathUtils.clamp(Number(settings.kanslighet)||1,.25,3);
 if(!['av','lag','normal','hog'].includes(settings.kastaKanslighet))settings.kastaKanslighet='normal';
 settings.forstoringPa=settings.forstoringPa!==false;
 const niva=Number(settings.forstoringNiva);settings.forstoringNiva=[2.5,4,6].includes(niva)?niva:4;
 settings.skottkansla=Number.isFinite(Number(settings.skottkansla))?THREE.MathUtils.clamp(Number(settings.skottkansla),0,2):1;
 const styr=skapaStyrning();
 const hapticStyles=structuredClone(hapticDefaults);
 for(const k of Object.keys(hapticStyles)){const s=saved.haptik?.[k];if(s){hapticStyles[k].styrka=THREE.MathUtils.clamp(Number(s.styrka)||0,0,1);hapticStyles[k].varaktighet_ms=THREE.MathUtils.clamp(Number(s.varaktighet_ms)||12,1,100);}}
 function save(){try{const {brytare,hapticStyle,...styrning}=settings;localStorage.setItem('gyro_faltprov_v1',JSON.stringify({styrning,brytare,hapticStyle,haptik:hapticStyles,debug:$('showDebug').checked}));}catch{}}
 const renderer=new THREE.WebGLRenderer({canvas:$('spel'),antialias:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,cfg.kamera.pixelRatio_max));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene();scene.background=null;scene.fog=new THREE.Fog(cfg.miljo.himmel_farg,80,260);
 const camera=new THREE.PerspectiveCamera(cfg.kamera.fov,1,cfg.kamera.near_m,cfg.kamera.far_m);camera.position.set(0,cfg.kamera.hojd_m,0);scene.add(camera);
 const player=new THREE.Group();scene.add(player);
 scene.add(new THREE.HemisphereLight(0xd7e6f4,0x4a5234,1.55));
 const sun=new THREE.DirectionalLight(0xfff0d2,2.45);sun.position.set(-18,34,14);sun.castShadow=true;sun.shadow.mapSize.set(512,512);sun.shadow.camera.near=.5;sun.shadow.camera.far=64;sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.bias=-0.00035;sun.shadow.normalBias=0.04;scene.add(sun,sun.target);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(220,20,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color(0x8eafc9)},mid:{value:new THREE.Color(cfg.miljo.himmel_farg)},bot:{value:new THREE.Color(0x8b9174)}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vP;uniform vec3 top,mid,bot;void main(){float h=normalize(vP).y;vec3 c=mix(bot,mid,smoothstep(-0.2,0.08,h));c=mix(c,top,smoothstep(0.02,0.55,h));gl_FragColor=vec4(c,1.0);}'}));scene.add(sky);
 function markTex(kind){
  const s=256,c=document.createElement('canvas');c.width=c.height=s;const g=c.getContext('2d');const img=g.createImageData(s,s);
  const hsh=(x,y)=>{let n=(x*374761393+y*668265263+(kind==='gras'?19:73))|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967296;};
  const vn=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);const a=hsh(ix,iy),b=hsh(ix+1,iy),c0=hsh(ix,iy+1),d=hsh(ix+1,iy+1);return a*(1-ux)*(1-uy)+b*ux*(1-uy)+c0*(1-ux)*uy+d*ux*uy;};
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){
   const n=vn(x/18,y/18)*0.65+vn(x/7,y/7)*0.35;
   let r,gc,b;
   if(kind==='gras'){const k=.72+n*.45;r=58*k;gc=74*k;b=38*k;if(n>.82){r+=18;gc+=10;}}
   else{const k=.62+n*.55;r=118*k;gc=110*k;b=94*k;if((x*13+y*7)%47<3){r-=12;gc-=10;b-=8;}}
   const i=(y*s+x)*4;img.data[i]=r;img.data[i+1]=gc;img.data[i+2]=b;img.data[i+3]=255;
  }
  g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.repeat.set(kind==='gras'?40:6,kind==='gras'?40:22);return t;
 }
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(cfg.miljo.mark_m,cfg.miljo.mark_m),new THREE.MeshStandardMaterial({map:markTex('gras'),roughness:.92,metalness:0}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 placeraTestmal(THREE,scene);
 floor.userData.yta='mark';
 const traffMeshar=[floor];
 const path=new THREE.Mesh(new THREE.PlaneGeometry(4.2,140),new THREE.MeshStandardMaterial({map:markTex('grus'),roughness:.88,metalness:0}));path.rotation.x=-Math.PI/2;path.position.set(0,.012,-60);path.receiveShadow=true;path.userData.yta='mark';scene.add(path);traffMeshar.push(path);
 const hinderPack=placeraHinder(THREE,scene);traffMeshar.push(...hinderPack.meshar);const hinderLista=hinderPack.hinder;
 const envBox=new THREE.Mesh(new THREE.BoxGeometry(8,8,8),[0xb9c8c4,0x93a6a1,0xd5e7f4,0x667044,0xffe0aa,0xa8b4b0].map(color=>new THREE.MeshBasicMaterial({color,side:THREE.BackSide})));
 const envScene=new THREE.Scene();envScene.add(envBox);
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,0.04).texture;pmrem.dispose();
 const gyro=new GyroAim($('spel'),settings,cfg.styrning),haptics=createHaptics(hapticStyles,settings);
 const gyroMeny=skapaGyroMeny(),lager=skapaLager(),styrTick=skapaTick($('styrHapticLabel'));
 styrTick.sätt(()=>gyroMeny.varden.haptik);
 byggStyrMeny($('styrRot'),gyroMeny,{lager,tick:styrTick,noll(){gyro.center();gyro.nollaGira();lager.noll();$('status').textContent='Neutralläget är satt.';}});
 const loader=new GLTFLoader();await MeshoptDecoder.ready;loader.setMeshoptDecoder(MeshoptDecoder);const glb=p=>loader.loadAsync(new URL('../'+p,import.meta.url).href);
 const assetPromises=[cfg.fiende.modell,cfg.fiende.animation,'assets/modeller/tiger_lod1.glb','assets/modeller/tiger_lod2.glb','assets/modeller/tiger_bb.glb','assets/modeller/hus_lod1.glb','assets/modeller/hus_lod2.glb','assets/modeller/hus_bb.glb','assets/vapen/mg42.glb','assets/vapen/kar98k.glb'].map(glb);
 const [soldier,run,...models]=await Promise.all(assetPromises);
 const mgSrc=models[6],k98Src=models[7];
 const atlas=await new THREE.TextureLoader().loadAsync(new URL('../assets/effekter/fx_atlas_v2d.png',import.meta.url).href);atlas.colorSpace=THREE.SRGBColorSpace;
 const fx=skapaEffekterV2d(THREE,scene,{atlas,kamera:camera,renderer,kvalitet:cfg.effekter.kvalitet,maxPartiklar:cfg.effekter.pool,ljus:cfg.effekter.ljus,markY:0,markHojd:()=>0});
 function prepare(root){root.traverse(n=>{if(n.isMesh){n.frustumCulled=true;for(const m of(Array.isArray(n.material)?n.material:[n.material])){m.roughness=Math.max(m.roughness??1,.7);}}});return root;}
 const rawBounds={};
 const soldierWrap=new THREE.Group();const soldierVisual=prepare(soldier.scene);soldierVisual.traverse(n=>{if(n.isMesh)n.castShadow=false;});soldierWrap.add(soldierVisual);scene.add(soldierWrap);
 scene.updateMatrixWorld(true);soldierVisual.traverse(n=>{if(n.isSkinnedMesh){n.computeBoundingBox();n.computeBoundingSphere();}});const box=new THREE.Box3().setFromObject(soldierVisual),height=box.max.y-box.min.y;rawBounds.soldat=box.getSize(new THREE.Vector3()).toArray();const soldierScale=cfg.fiende.hojd_m/height;soldierVisual.scale.multiplyScalar(soldierScale);soldierVisual.position.y-=box.min.y*soldierScale;soldierVisual.rotation.y=cfg.fiende.rotation_y;
 const mixer=new THREE.AnimationMixer(soldierVisual);const clip=run.animations.find(a=>a.name===cfg.fiende.klipp);
 if(!clip)throw Error('Springklippet saknas');
 const inPlace=clip.clone();for(const track of inPlace.tracks){if(/^(root|pelvis)\.position$/.test(track.name)){for(let i=0;i<track.values.length;i+=3){track.values[i]=track.values[0];track.values[i+2]=track.values[2];}}}
 const runAction=mixer.clipAction(inPlace).play();
 function klonaSkinn(source){
  const clone=source.clone(true);const src=[],dst=[];
  source.traverse(n=>src.push(n));clone.traverse(n=>dst.push(n));
  const map=new Map();src.forEach((n,i)=>map.set(n,dst[i]));
  dst.forEach((node,i)=>{if(!node.isSkinnedMesh)return;const orig=src[i];node.skeleton=orig.skeleton.clone();node.skeleton.bones=orig.skeleton.bones.map(b=>map.get(b)||b);node.bind(node.skeleton,orig.bindMatrix);node.frustumCulled=false;});
  return clone;
 }
 const jag=klonaSkinn(soldierVisual);jag.rotation.y+=Math.PI;jag.visible=false;player.add(jag);
 const benpose=skapaBen(jag);
 const jagMixer=new THREE.AnimationMixer(jag);const jagAction=jagMixer.clipAction(inPlace);jagAction.play();
 let clipMatches=0;for(const track of inPlace.tracks){const name=THREE.PropertyBinding.parseTrackName(track.name).nodeName;if(soldierVisual.getObjectByName(name))clipMatches++;}
 const hitbox=new THREE.Mesh(new THREE.CapsuleGeometry(cfg.fiende.traffvolym.radie_m,cfg.fiende.traffvolym.langd_m,4,6),new THREE.MeshBasicMaterial({visible:false}));hitbox.position.y=cfg.fiende.traffvolym.centrum_y;hitbox.userData.yta='kropp';soldierWrap.add(hitbox);
 const targets=[{kind:'soldat',root:soldierWrap,hitbox,alive:true,hp:cfg.fiende.hp}];const occluders=[],lodObjects=[];
 function batchStatic(source){
  source.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(source.matrixWorld).invert();const groups=new Map();
  source.traverse(n=>{if(!n.isMesh)return;const key=n.material.uuid+'|'+Object.keys(n.geometry.attributes).sort().join(',');if(!groups.has(key))groups.set(key,{material:n.material,geometries:[]});const g=n.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,n.matrixWorld));groups.get(key).geometries.push(g);});
  const result=new THREE.Group();for(const {material,geometries}of groups.values()){const merged=mergeGeometries(geometries,false);if(merged)result.add(new THREE.Mesh(merged,material));else for(const g of geometries)result.add(new THREE.Mesh(g,material));}return result;
 }
 function addLOD(variants,position,rotation,thresholds,size,byHeight=false){
  const lod=new THREE.LOD();lod.autoUpdate=false;const b=new THREE.Box3().setFromObject(variants[0].scene);const d=b.getSize(new THREE.Vector3());const scale=size/(byHeight?d.y:Math.max(d.x,d.z));
  lod.userData.levelMaterials=[];variants.forEach((a,i)=>{const object=prepare(batchStatic(a.scene));const materials=[];object.traverse(n=>{if(n.isMesh){n.material=n.material.clone();n.material.transparent=false;n.material.alphaTest=0;n.material.alphaHash=true;materials.push(n.material);}});lod.userData.levelMaterials.push(materials);object.scale.multiplyScalar(scale);object.position.y=-b.min.y*scale;lod.addLevel(object,thresholds[i]);});lod.position.set(position.x,0,position.z);lod.rotation.y=rotation;scene.add(lod);lodObjects.push(lod);return lod;
 }
 for(const pos of cfg.miljo.tanks){const root=addLOD(models.slice(0,3),pos,pos.rotation,cfg.lod.tiger_m,cfg.miljo.tiger_langd_m);root.updateWorldMatrix(true,true);const b=new THREE.Box3().setFromObject(root.levels[0].object);rawBounds.tiger=b.getSize(new THREE.Vector3()).toArray();const hb=new THREE.Mesh(new THREE.BoxGeometry(...rawBounds.tiger),new THREE.MeshBasicMaterial({visible:false}));hb.position.copy(b.getCenter(new THREE.Vector3()));hb.userData.yta='metall';scene.add(hb);targets.push({kind:'tiger',root,hitbox:hb,alive:true,hp:cfg.miljo.tiger_hp});}
 for(const pos of cfg.miljo.hus){const root=addLOD(models.slice(3,6),pos,pos.rotation,cfg.lod.hus_m,cfg.miljo.hus_hojd_m,true);const hus=root.levels[0].object;hus.traverse(n=>{n.userData.yta='vagg';});occluders.push(hus);traffMeshar.push(hus);}
 const ray=new THREE.Raycaster(),occlusionRay=new THREE.Raycaster(),zero=new THREE.Vector2();
 const direction=new THREE.Vector3(),point=new THREE.Vector3(),tmp=new THREE.Vector3(),motion=new THREE.Euler(),recoilQuat=new THREE.Quaternion();
 const _muzzle=new THREE.Vector3(),_dir=new THREE.Vector3(),_aim=new THREE.Vector3(),_fwd=new THREE.Vector3(),_right=new THREE.Vector3(),_up=new THREE.Vector3(),_q=new THREE.Quaternion(),_spin=new THREE.Quaternion();
 const Y_AXEL=new THREE.Vector3(0,1,0);
 const recoilEuler=new THREE.Euler(0,0,0,'YXZ'),recoilQ=new THREE.Quaternion(),headEuler=new THREE.Euler(0,0,0,'YXZ'),headQuat=new THREE.Quaternion(),kickEuler=new THREE.Euler(0,0,0,'YXZ'),kickQuat=new THREE.Quaternion(),breathEuler=new THREE.Euler(0,0,0,'YXZ'),breathQuat=new THREE.Quaternion(),sightQuat=new THREE.Quaternion(),styrEuler=new THREE.Euler(0,0,0,'YXZ'),styrQuat=new THREE.Quaternion();
 const occBox=new THREE.Box3(),occPts=Array.from({length:5},()=>new THREE.Vector3());
 let renderTick=performance.now();const renderInterval=1000/cfg.kamera.mal_hz;
 let started=false,selected=0,shots=0,hits=0,cooldown=0,deadFor=0,hitUntil=0,queue=[],last=performance.now(),frames=0,fps=0,measureTime=last,enemyCount=0,burstToken=0,stegFas=0;
 let audio=null,voices=[],audioBuffer=null,audioBus=null,clinkBuffer=null;const fileBuffers={},fileLoading={};let holding=false,nextAuto=0;
 let casingAlive=0,clinks=0,clinkReady=0,clinkVoices=0,aimNdcX=0,aimNdcY=0,breechNdcY=0,muzzleNdcY=0,breechWY=0,muzzleWY=0,muzzleWZ=0;
 function loadWeaponSounds(){for(const w of weapons){if(!w.ljudfil||fileLoading[w.id])continue;fileLoading[w.id]=fetch(new URL('../'+w.ljudfil,import.meta.url)).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}).then(b=>new Promise((ok,no)=>audio.decodeAudioData(b,ok,no))).then(buf=>{fileBuffers[w.id]=buf;}).catch(()=>{fileLoading[w.id]=null;});}}
 const muzzleLight=new THREE.PointLight(0xffd690,0,6,2);
 const muzzleFlash=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffe7a0,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
 let flash=0,flashDuration=.075,lightPeak=0;const modelLoadMs=Math.round(performance.now()-t0);

 // Vapnet sitter på kroppen. Kameran lägger bara huvudvridningen ovanpå.
 const aimRig=new THREE.Group();player.add(aimRig);
 const weaponPivot=new THREE.Group();aimRig.add(weaponPivot);
 const brass=new THREE.MeshStandardMaterial({color:0xe6b84a,metalness:.9,roughness:.28,emissive:0x5a3d10,emissiveIntensity:.35,envMapIntensity:1.2});
 function palettePBR(src){
  const img=src.image;if(!img)return null;
  const w=img.width||8,h=img.height||8,c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,w,h);
  const data=g.getImageData(0,0,w,h),metal=g.createImageData(w,h),rough=g.createImageData(w,h);
  for(let i=0;i<data.data.length;i+=4){
   let r=data.data[i],gc=data.data[i+1],b=data.data[i+2];
   const max=Math.max(r,gc,b),min=Math.min(r,gc,b),sat=max?(max-min)/max:0,lum=(r+gc+b)/3;
   const wood=r>gc+10&&gc>b-5&&r>70&&r-b>28;
   const brassCol=r>180&&gc>130&&b<150&&r>b+40;
   if(!wood&&!brassCol){const s=lum>170?168:lum>90?108:62;r=s;gc=s+2;b=s+4;}
   data.data[i]=r;data.data[i+1]=gc;data.data[i+2]=b;
   const mv=brassCol?210:(!wood?200:8),rv=wood?176:brassCol?55:(!wood&&lum>170?46:70);
   metal.data[i]=metal.data[i+1]=metal.data[i+2]=mv;metal.data[i+3]=255;
   rough.data[i]=rough.data[i+1]=rough.data[i+2]=rv;rough.data[i+3]=255;
  }
  g.putImageData(data,0,0);
  const tex=(imageData,colorSpace)=>{const cv=document.createElement('canvas');cv.width=imageData.width;cv.height=imageData.height;cv.getContext('2d').putImageData(imageData,0,0);const t=new THREE.CanvasTexture(cv);t.colorSpace=colorSpace;t.flipY=false;t.magFilter=t.minFilter=THREE.NearestFilter;t.wrapS=t.wrapT=src.wrapS||THREE.ClampToEdgeWrapping;return t;};
  const albedo=new THREE.CanvasTexture(c);albedo.colorSpace=THREE.SRGBColorSpace;albedo.flipY=false;albedo.magFilter=albedo.minFilter=THREE.NearestFilter;
  return {albedo,metal:tex(metal,THREE.NoColorSpace),rough:tex(rough,THREE.NoColorSpace)};
 }
 function bakaSkinn(root){
  root.updateWorldMatrix(true,true);
  const byten=[];
  root.traverse(o=>{
   if(!o.isSkinnedMesh||!o.skeleton)return;
   o.skeleton.update();
   const geom=o.geometry.clone();
   const pos=geom.attributes.position;
   const v=new THREE.Vector3();
   for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);o.applyBoneTransform(i,v);pos.setXYZ(i,v.x,v.y,v.z);}
   pos.needsUpdate=true;
   geom.computeVertexNormals();
   geom.computeBoundingBox();geom.computeBoundingSphere();
   const plain=new THREE.Mesh(geom,o.material);
   plain.position.copy(o.position);plain.quaternion.copy(o.quaternion);plain.scale.copy(o.scale);
   plain.castShadow=true;plain.frustumCulled=false;
   byten.push({parent:o.parent,plain,old:o});
  });
  for(const s of byten){s.parent.add(s.plain);s.old.removeFromParent();}
 }
 function mountGun(gltf,shift){
  const root=gltf.scene;
  bakaSkinn(root);
  root.traverse(o=>{if(!o.isMesh||!o.visible)return;o.castShadow=true;o.frustumCulled=false;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m.map){const maps=palettePBR(m.map);if(maps){m.map=maps.albedo;m.metalnessMap=maps.metal;m.roughnessMap=maps.rough;m.metalness=1;m.roughness=1;}}else{m.metalness=.55;m.roughness=.42;}m.envMapIntensity=1.25;}});
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3());
  root.position.sub(center);root.position.z+=shift;
  const holder=new THREE.Group();holder.add(root);holder.visible=false;weaponPivot.add(holder);return {holder,length:box.getSize(new THREE.Vector3()).z};
 }
 const mgGun=mountGun(mgSrc,.22),k98Gun=mountGun(k98Src,.16);
 const steelSight=new THREE.MeshStandardMaterial({color:0x2c3130,metalness:.72,roughness:.38,envMapIntensity:1.1});
 const traMat=new THREE.MeshStandardMaterial({color:0x6a4b2b,roughness:.78,metalness:.05});
 function byggKarbin(){
  const holder=new THREE.Group();
  const del=(geo,mat,x,y,z,rx=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(rx)m.rotation.y=rx;m.castShadow=true;m.frustumCulled=false;holder.add(m);return m;};
  del(new THREE.BoxGeometry(.046,.075,.4),traMat,0,-.01,.2);
  del(new THREE.BoxGeometry(.038,.05,.2),steelSight,0,.012,0);
  del(new THREE.BoxGeometry(.015,.015,.58),steelSight,0,.03,-.36);
  del(new THREE.BoxGeometry(.032,.038,.18),traMat,0,.012,-.14);
  del(new THREE.BoxGeometry(.028,.055,.03),traMat,0,-.03,.04);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.011,.0026,5,10),steelSight);
  ring.position.set(0,.048,.05);ring.rotation.y=Math.PI/2;ring.frustumCulled=false;holder.add(ring);
  del(new THREE.BoxGeometry(.004,.018,.004),steelSight,0,.042,-.62);
  holder.visible=false;weaponPivot.add(holder);return {holder};
 }
 const karbinGun=byggKarbin();
 const sights=new THREE.Group();
 const earL=new THREE.Mesh(new THREE.BoxGeometry(.008,.02,.005),steelSight);sights.add(earL);
 const earR=earL.clone();sights.add(earR);
 const rearBase=new THREE.Mesh(new THREE.BoxGeometry(.028,.005,.008),steelSight);sights.add(rearBase);
 const front=new THREE.Mesh(new THREE.BoxGeometry(.004,.028,.004),steelSight);sights.add(front);
 const frontBase=new THREE.Mesh(new THREE.BoxGeometry(.012,.005,.01),steelSight);sights.add(frontBase);
 weaponPivot.add(sights);
 const muzzleObj=new THREE.Object3D();weaponPivot.add(muzzleObj);
 muzzleObj.add(muzzleLight);muzzleLight.position.set(0,.01,.02);
 muzzleObj.add(muzzleFlash);muzzleFlash.position.set(0,.01,.04);
 const ejectPort=new THREE.Object3D();weaponPivot.add(ejectPort);
 const beltMat=new THREE.MeshStandardMaterial({color:0x5c4e30,roughness:.7,metalness:.2,envMapIntensity:.6});
 const belt=new THREE.Group();
 const cartGeo=new THREE.LatheGeometry([new THREE.Vector2(.0036,0),new THREE.Vector2(.0036,.012),new THREE.Vector2(.0046,.0132),new THREE.Vector2(.0046,.015)],6);
 const BELT_N=18;
 const beltMesh=new THREE.InstancedMesh(cartGeo,brass,BELT_N);beltMesh.frustumCulled=false;
 const beltDummy=new THREE.Object3D();
 belt.add(beltMesh);belt.visible=false;weaponPivot.add(belt);
 const linkGeo=new THREE.BoxGeometry(.012,.004,.02);
 const links=[];
 for(let i=0;i<8;i++){const l=new THREE.Mesh(linkGeo,beltMat);l.castShadow=false;belt.add(l);links.push(l);}
 // Sikteslinjen: pipan längs vapnets -Z, samma håll som blicken.
 weaponPivot.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
 weaponPivot.position.set(0,0,0);
 const _pip=new THREE.Vector3(),_pipA=new THREE.Vector3(),_pipB=new THREE.Vector3();
 function pipPunkter(holder){
  weaponPivot.updateWorldMatrix(true,false);holder.updateWorldMatrix(true,true);
  const inv=new THREE.Matrix4().copy(weaponPivot.matrixWorld).invert();
  const pts=[];
  holder.traverse(o=>{
   if(!o.isMesh||!o.geometry?.attributes?.position)return;
   const pos=o.geometry.attributes.position, steg=Math.max(1,Math.floor(pos.count/70));
   for(let i=0;i<pos.count;i+=steg){pts.push(_pip.fromBufferAttribute(pos,i).clone());o.localToWorld(pts[pts.length-1]);pts[pts.length-1].applyMatrix4(inv);}
  });
  if(pts.length<2)return {fram:new THREE.Vector3(0,0,-.4),bak:new THREE.Vector3(0,0,.2)};
  const min=new THREE.Vector3(Infinity,Infinity,Infinity),max=new THREE.Vector3(-Infinity,-Infinity,-Infinity);
  for(const v of pts){min.min(v);max.max(v);}
  const size=max.clone().sub(min);
  const ax=size.x>=size.y&&size.x>=size.z?0:size.y>=size.z?1:2;
  let a=pts[0],b=pts[0];
  for(const v of pts){if(v.getComponent(ax)<a.getComponent(ax))a=v;if(v.getComponent(ax)>b.getComponent(ax))b=v;}
  const axis=b.clone().sub(a);const len=axis.length()||1;axis.multiplyScalar(1/len);
  const tjock=end=>{let n=0,s=0;for(const v of pts){const t=v.clone().sub(end).dot(axis);if(Math.abs(t)>len*.2)continue;const rad=v.clone().sub(end).addScaledVector(axis,-t).length();s+=rad;n++;}return n?s/n:1;};
  return tjock(a)<tjock(b)?{fram:a.clone(),bak:b.clone()}:{fram:b.clone(),bak:a.clone()};
 }
 function riktaPipa(holder){
  const framat=new THREE.Vector3(0,0,-1),upp=new THREE.Vector3(0,1,0);
  for(let pass=0;pass<3;pass++){
   const lin=pipPunkter(holder);const dir=_pipA.copy(lin.fram).sub(lin.bak);
   if(dir.lengthSq()<1e-8)return;dir.normalize();
   holder.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(dir,framat));
   holder.updateWorldMatrix(true,true);
  }
  const yAx=_pipB.set(0,1,0).applyQuaternion(holder.quaternion);
  yAx.addScaledVector(framat,-yAx.dot(framat));
  if(yAx.lengthSq()>1e-8){const ang=Math.atan2(yAx.x,yAx.y);holder.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(framat,-ang));}
  const efter=pipPunkter(holder);
  if(efter.fram.z>efter.bak.z)holder.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI));
 }
 function sammaLinje(ref,holder){
  const a=pipPunkter(ref),b=pipPunkter(holder);
  holder.position.x+=a.fram.x-b.fram.x;
  holder.position.y+=a.fram.y-b.fram.y;
  holder.position.z+=a.bak.z-b.bak.z;
 }
 scene.updateMatrixWorld(true);
 riktaPipa(k98Gun.holder);riktaPipa(mgGun.holder);riktaPipa(karbinGun.holder);
 function lokalAndar(holder){
  holder.updateWorldMatrix(true,true);
  const inv=new THREE.Matrix4().copy(holder.matrixWorld).invert();
  const pts=[];const v=new THREE.Vector3();
  holder.traverse(o=>{
   if(!o.isMesh||!o.geometry?.attributes?.position)return;
   const pos=o.geometry.attributes.position;const steg=Math.max(1,Math.floor(pos.count/80));
   for(let i=0;i<pos.count;i+=steg){v.fromBufferAttribute(pos,i);o.localToWorld(v);pts.push(v.applyMatrix4(inv).clone());}
  });
  if(pts.length<2)return null;
  const m=new THREE.Vector3();for(const p of pts)m.add(p);m.multiplyScalar(1/pts.length);
  let xx=0,yy=0,zz=0,xy=0,xz=0,yz=0;
  for(const p of pts){const x=p.x-m.x,y=p.y-m.y,z=p.z-m.z;xx+=x*x;yy+=y*y;zz+=z*z;xy+=x*y;xz+=x*z;yz+=y*z;}
  const ax=new THREE.Vector3(0,0,1);
  for(let i=0;i<16;i++){const x=xx*ax.x+xy*ax.y+xz*ax.z,y=xy*ax.x+yy*ax.y+yz*ax.z,z=xz*ax.x+yz*ax.y+zz*ax.z;ax.set(x,y,z).normalize();}
  let a=pts[0],b=pts[0];
  for(const p of pts){if(p.dot(ax)<a.dot(ax))a=p;if(p.dot(ax)>b.dot(ax))b=p;}
  return {a:a.clone(),b:b.clone()};
 }
 function sparaMynning(holder){
  const and=lokalAndar(holder);if(!and)return;
  weaponPivot.updateWorldMatrix(true,true);holder.updateWorldMatrix(true,true);
  const tillPivot=new THREE.Matrix4().copy(weaponPivot.matrixWorld).invert();
  const az=holder.localToWorld(and.a.clone()).applyMatrix4(tillPivot).z;
  const bz=holder.localToWorld(and.b.clone()).applyMatrix4(tillPivot).z;
  const mun=az<bz?and.a:and.b, kolv=az<bz?and.b:and.a;
  holder.userData.mynning=mun.clone().sub(kolv).normalize();
  holder.userData.kolvLokal=kolv;
  holder.userData.munLokal=mun;
 }
 sammaLinje(k98Gun.holder,mgGun.holder);sammaLinje(k98Gun.holder,karbinGun.holder);
 const mynningar={},pipGrad={};
 function mataMynning(id,holder){
  const lin=pipPunkter(holder);
  mynningar[id]=lin.fram.clone();
  const dir=_pipA.copy(lin.fram).sub(lin.bak).normalize();
  pipGrad[id]=THREE.MathUtils.radToDeg(dir.angleTo(new THREE.Vector3(0,0,-1)));
 }
 mataMynning('gevar',k98Gun.holder);mataMynning('kulspruta',mgGun.holder);mataMynning('karbin',karbinGun.holder);
 sparaMynning(k98Gun.holder);sparaMynning(mgGun.holder);sparaMynning(karbinGun.holder);
 {
  const lin=pipPunkter(mgGun.holder);
  const mitt=_pipA.copy(lin.bak).lerp(lin.fram,.42);
  earL.position.set(mitt.x-.012,mitt.y+.012,mitt.z);
  earR.position.set(mitt.x+.012,mitt.y+.012,mitt.z);
  rearBase.position.set(mitt.x,mitt.y,mitt.z);
  front.position.set(lin.fram.x,lin.fram.y+.012,lin.fram.z+.02);
  frontBase.position.copy(lin.fram);
  // Patronbältet hänger från sidan och sjunker nedåt.
  const start=mitt.clone();start.x+=.07;start.y+=.02;
  for(let i=0;i<BELT_N;i++){
   const t=i/Math.max(1,BELT_N-1),sag=t*t*.34;
   beltDummy.position.set(start.x+t*.06,start.y-sag,start.z+Math.sin(t*2)*.015);
   beltDummy.rotation.set(.5+t*1.2,0,Math.PI/2);
   beltDummy.scale.setScalar(1.35);
   beltDummy.updateMatrix();beltMesh.setMatrixAt(i,beltDummy.matrix);
  }
  beltMesh.instanceMatrix.needsUpdate=true;
  for(let i=0;i<links.length;i++){
   const t=(i+.5)/links.length,sag=t*t*.34;
   links[i].position.set(start.x+t*.06,start.y-sag-.012,start.z);
   links[i].rotation.set(.4,0,.4+t);
  }
  ejectPort.position.set(mitt.x-.04,mitt.y-.01,mitt.z+.04);
 }
 k98Gun.holder.visible=true;weaponPivot.updateMatrixWorld(true);
 const gevarLada=new THREE.Box3().setFromObject(k98Gun.holder);
 const bak=new THREE.Vector3((gevarLada.min.x+gevarLada.max.x)/2,gevarLada.max.y-.02,gevarLada.max.z);
 const ogon=new THREE.Vector3(.03,cfg.kamera.hojd_m-.02,-.08);
 weaponPivot.position.add(ogon.sub(bak));
 const aimQuat=weaponPivot.quaternion.clone();
 const lowQuat=aimQuat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.5));
 const basePivot=weaponPivot.position.clone();
 const GREPP={gevar:new THREE.Vector3(.02,-.03,.16),kulspruta:new THREE.Vector3(.03,-.04,.1),karbin:new THREE.Vector3(.02,-.02,.12)};
 const CASING_POOL=24;
 const casingsMesh=new THREE.InstancedMesh(new THREE.LatheGeometry([new THREE.Vector2(.0046,0),new THREE.Vector2(.0046,.013),new THREE.Vector2(.0055,.0142),new THREE.Vector2(.0055,.0165)],8),brass,CASING_POOL);
 casingsMesh.frustumCulled=false;casingsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(casingsMesh);
 const casingDummy=new THREE.Object3D();
 const casingState=Array.from({length:CASING_POOL},()=>{const s={alive:false,age:0,p:new THREE.Vector3(),v:new THREE.Vector3(),axis:new THREE.Vector3(1,0,0),q:new THREE.Quaternion(),spin:0,landed:false,clinked:false,clinkAt:0,extra:0,pitch:1};casingDummy.scale.setScalar(0);casingDummy.updateMatrix();return s;});
 casingDummy.scale.setScalar(0);casingDummy.updateMatrix();for(let i=0;i<CASING_POOL;i++)casingsMesh.setMatrixAt(i,casingDummy.matrix);
 casingsMesh.instanceMatrix.needsUpdate=true;let casingCursor=0;

 let poseSteg=0,poseFrom=0,poseTo=0,poseT=.62,poseDur=.62,settleT=null,settleArmed=false,settleX=0,settleZ=0;
 const gyroLada=monteraSkjutbana({gyro,settings,styrning:cfg.styrning,steg:()=>poseSteg});
 gyro.bearbeta=dt=>{
  const ut=lager.vinklar(poseSteg===0?'ga':'sikta',gyro.vinklar,graderPerSekund(gyro.values.rotationRate,gyro.skarmVinkel()),dt,gyroMeny.varden);
  if(!ut)return;
  gyro.vinklar.pitch=ut.pitch;gyro.vinklar.yaw=ut.yaw;gyro.vinklar.roll=ut.roll;
  gyroLada.efter(dt);
 };
 let rifle=null,rifleP=0,climb=0,climbBack=null,climbP=0,hastyT=null,hastyAmp=0,hastyP=0;
 let bobAmp=0,bobPhase=0,bobFade=0,bobStop=null,bobHold=0,bobY=0,bobPitch=0,bobRoll=0;
 const motionState={speed:0,run:0,until:0};
 const head={yaw:0,pitch:0,targetYaw:0,targetPitch:0,holding:false,release:null};
 let lookPtr=null,stepPtr=null,nextLeg=null,stick=null,stickTravel=0,trigger=null,shakyBurst=true,suppressShot=false;

 function raiseValue(){const u=poseDur<=0?1:Math.min(1,poseT/poseDur);const s=u*u*(3-2*u);return poseFrom+(poseTo-poseFrom)*s;}
 function canAim(){return started&&poseSteg>=1&&raiseValue()>.4;}
 const VAPEN_TEXT=['På armen','Båda händer','I axeln'];
 const VAPEN_MAL=[0,.62,1];
 function syncPoseUi(){
  const low=poseSteg===0;
  document.body.dataset.pose=low?'sankt':'framme';
  document.body.dataset.vapen=String(poseSteg);
  $('weaponPose').textContent=VAPEN_TEXT[poseSteg];
  $('vapenSteg').textContent=VAPEN_TEXT[poseSteg];
  $('weaponPose').setAttribute('aria-pressed',String(!low));
  $('trigger').setAttribute('aria-label',low?'Spak':weapons[selected]?.automat?'Håll in för att skjuta':'Avtryckare');
  $('fireLabel').textContent=low?'GÅ':weapons[selected]?.automat?'HÅLL':'AVTRYCK';
  $('reload').hidden=low||poseSteg<2;
  $('spak').hidden=!low;
  $('platta').hidden=low;
  $('fireWrap').hidden=low;
  $('stallKnappar').hidden=styr.varden.stallning.satt!=='knappar';
  const kikareVapen=weapons[selected]?.sikte==='kikare';
  if($('siktVal'))$('siktVal').hidden=!kikareVapen;
  if($('zoomKnapp')){$('zoomKnapp').hidden=!kikareVapen||poseSteg<2||siktVal!=='kikare'||vy!=='forsta';$('zoomKnapp').textContent=(styr.varden.kikare.zoom||4).toString().replace('.',',')+'×';}
  if($('knappHuka'))$('knappHuka').hidden=styr.varden.stallning.satt!=='knyck';
  if($('montera'))$('montera').hidden=!weapons||weapons[selected]?.id!=='kulspruta';
  syncGyroInfo();
 }
 function syncGyroInfo(){
  if(!$('gyroInfo'))return;
  const P=styr.varden;
  const gang=P.gang.satt==='knyck'?'Gång: knyck':'Gång: lutning';
  const sikte={tipp_vrid:'Sikte: luta/vrid',roll_kropp:'Sikte: sidlut',overkropp:'Sikte: överkropp'}[P.sikte.satt]||'Sikte';
  const stallNamn={gyro:'gyro',knyck:'knyck',knappar:'knappar'}[P.stallning.satt]||P.stallning.satt;
  const stall=`Ställningsstyrning: ${stallNamn}`;
  const kans=`Känslighet ${P.sikte.kanslighet.toFixed(2)}×`;
  const yaw=gyro.vinklar.yaw,pitchNu=gyro.vinklar.pitch;
  const rikt=Math.abs(yaw)<.06&&Math.abs(pitchNu)<.06?'Riktning: stilla':`Riktning:${yaw>.06?' höger':yaw<-.06?' vänster':''}${pitchNu>.06?' upp':pitchNu<-.06?' ner':''}`;
  const axel=poseSteg===0
   ?(P.gang.satt==='knyck'?'Lugn tipp styr siktet. Knyck framåt tar ett steg. Vridning styr mjukt. Sidlutning svänger starkt.':'Tippning styr gången. Vridning styr mjukt åt sidan. Sidlutning svänger starkt.')
   :(P.sikte.satt==='tipp_vrid'?'Tippning styr höjden. Vridning styr sidan.':P.sikte.satt==='overkropp'?'Tippning styr höjden. Vridning styr kroppen. Stor sidlutning svänger.':'Tippning styr höjden. Liten sidlutning siktar. Stor sidlutning svänger.');
  $('gyroInfo').innerHTML=`<b>${gang}</b><b>${sikte}</b><b>${stall}</b><b>${kans}</b><b id="chipRikt">${rikt}</b><span>${axel}</span>`;
 }
 function stegVapen(){
  const upp=poseSteg<2;
  poseSteg=upp?2:0;
  poseFrom=raiseValue();poseTo=VAPEN_MAL[poseSteg];poseT=0;poseDur=upp?.36:.26;
  if(poseSteg===0){stopHold();trigger=null;updateRing(0);}
  syncPoseUi();
  if(stallning==='hukande'||stallning==='knastående')startStallning(poseSteg===2?'knastående':'hukande');
  const knapp=$('vapenSteg');if(knapp){knapp.classList.add('bekraftad');setTimeout(()=>knapp.classList.remove('bekraftad'),420);}
  haptics.impact(upp?1:.45);
 }
 function setPose(raised){poseSteg=raised?2:0;poseFrom=raiseValue();poseTo=VAPEN_MAL[poseSteg];poseT=0;syncPoseUi();}
 function updatePose(dt){
  const prev=raiseValue();
  if(poseT<poseDur)poseT=Math.min(poseDur,poseT+dt);
  const raise=raiseValue();
  if(settleArmed&&poseTo===1&&prev<.995&&raise>=.995){settleArmed=false;settleT=0;}
  return raise;
 }
 function updateSettle(dt){
  if(settleT===null){settleX=0;settleZ=0;return;}
  settleT+=dt;
  if(settleT>=1.5){settleT=null;settleX=0;settleZ=0;return;}
  const env=(1-settleT/1.5)**2;
  settleX=Math.sin(settleT*15)*.045*env;settleZ=Math.sin(settleT*10.5+.6)*.028*env;
 }
 function startRifle(weapon){rifle={t:0,peak:Math.max(.06,weapon.rekyl_rad*1.7)*(.7+.3*settings.skottkansla)};}
 function updateRifle(dt){
  if(!rifle){rifleP=0;return;}
  rifle.t+=dt;
  if(rifle.t>=.5){rifle=null;rifleP=0;return;}
  const peakAt=.07;let k;
  if(rifle.t<=peakAt){const u=rifle.t/peakAt;k=u*u*(3-2*u);}
  else{const u=(rifle.t-peakAt)/(.5-peakAt);k=1-u*u*(3-2*u);}
  rifleP=rifle.peak*k;
 }
 function addClimb(amount){climb=Math.min(.15,climb+amount);climbBack=null;}
 function updateClimb(dt,firing){
  if(firing)climbBack=null;
  else if(climb!==0){
   if(!climbBack)climbBack={from:climb,t:0};
   climbBack.t+=dt;const u=Math.min(1,climbBack.t/.4);
   climb=climbBack.from*(1-u*u*(3-2*u));
   if(u>=1){climb=0;climbBack=null;}
  }
  climbP=climb;
 }
 function startHasty(){hastyT=0;hastyAmp=.02*(.55+.45*settings.skottkansla);}
 function updateHasty(dt){
  if(hastyT===null){hastyP=0;return;}
  hastyT+=dt;const u=Math.min(1,hastyT/.28);
  hastyP=hastyAmp*Math.sin(u*Math.PI);
  if(u>=1){hastyT=null;hastyP=0;}
 }
 let monterad=false,hoft=0,puls=0,ork=1,jarnLinje=1,lugnPitch=0;
 const knyck=skapaKnyck();
 function rekylUpp(){
  const bas=Math.max(0,rifleP)+Math.max(0,climbP)+Math.max(0,hastyP);
  const mg=weapons&&weapons[selected]?.id==='kulspruta';
  if(!mg)return bas;
  if(monterad)return bas*styr.varden.ksp.rekyl_monterad;
  return bas*(typeof stallning!=='undefined'&&stallning==='hukande'?.75:1);
 }
 function noteMotion(speed,run){motionState.speed=speed;motionState.run=run;motionState.until=performance.now()+90;}
 function updateBob(dt){
  const moving=performance.now()<motionState.until&&motionState.speed>.2;
  if(moving){
   bobStop=null;const target=.008+motionState.run*.02;
   bobAmp+=(target-bobAmp)*(1-Math.exp(-dt/.07));bobPhase+=dt*(8+motionState.run*6);bobFade=1;bobHold=bobAmp;
  }else if(bobHold>0||bobAmp>0){
   if(bobStop===null){bobStop=0;bobHold=bobAmp;}
   bobStop+=dt;const u=Math.min(1,bobStop/.4);bobFade=1-u*u*(3-2*u);
   if(u>=1){bobFade=0;bobAmp=0;bobHold=0;bobStop=null;bobY=bobPitch=bobRoll=0;return;}
  }else{bobY=bobPitch=bobRoll=0;return;}
  const a=(bobStop===null?bobAmp:bobHold)*bobFade;
  bobY=Math.sin(bobPhase)*a;bobRoll=Math.sin(bobPhase*.5)*a*5;bobPitch=Math.cos(bobPhase)*a*2.2;
  if(bobFade===0){bobY=bobPitch=bobRoll=0;}
 }
 function updateHead(dt){
  if(head.holding){
   const k=1-Math.exp(-dt/.08);
   head.yaw+=(head.targetYaw-head.yaw)*k;head.pitch+=(head.targetPitch-head.pitch)*k;
   if(Math.abs(head.yaw)<1e-5)head.yaw=0;if(head.pitch<1e-5)head.pitch=0;
  }else if(head.release){
   head.release.t+=dt;const u=Math.min(1,head.release.t/.2);const e=1-(1-u)**3;
   head.yaw=head.release.yaw*(1-e);head.pitch=head.release.pitch*(1-e);
   if(u>=1){head.yaw=0;head.pitch=0;head.release=null;}
  }
  headEuler.set(head.pitch,-head.yaw,0,'YXZ');headQuat.setFromEuler(headEuler);
 }
 const _vapenY=new THREE.Vector3(),_vapenZ=new THREE.Vector3(),_vapenQ=new THREE.Quaternion();
 function roteraPivot(delta){
  aimRig.updateWorldMatrix(true,false);
  const aimW=new THREE.Quaternion();aimRig.getWorldQuaternion(aimW);
  const w=new THREE.Quaternion();weaponPivot.getWorldQuaternion(w);
  w.premultiply(delta);
  weaponPivot.quaternion.copy(aimW.invert()).multiply(w);
  weaponPivot.updateWorldMatrix(true,true);
 }
 function placeraVapenBak(){
  const id=weapons[selected]?.id||'gevar';
  const holder=id==='kulspruta'?mgGun.holder:id==='karbin'?karbinGun.holder:k98Gun.holder;
  const mal=benpose.senaste();
  if(!holder||!mal)return null;
  holder.visible=true;
  weaponPivot.updateWorldMatrix(true,true);
  if(!holder.userData.mynning)sparaMynning(holder);
  const ons=_vapenZ.copy(mal.fram);
  if(ons.lengthSq()<1e-8)ons.set(0,0,-1);
  ons.normalize();
  const nuDir=holder.userData.mynning.clone().transformDirection(holder.matrixWorld);
  const lik=nuDir.dot(ons);
  if(lik<-0.999){
   const axelFlip=Math.abs(nuDir.y)>0.9?_vapenY.set(1,0,0):_vapenY.set(0,1,0);
   roteraPivot(_vapenQ.setFromAxisAngle(axelFlip,Math.PI));
   const nu2=holder.userData.mynning.clone().transformDirection(holder.matrixWorld);
   if(nu2.dot(ons)<0.995)roteraPivot(_vapenQ.setFromUnitVectors(nu2,ons));
  }else if(lik<0.995)roteraPivot(_vapenQ.setFromUnitVectors(nuDir,ons));
  const kolvW=holder.localToWorld(holder.userData.kolvLokal.clone());
  const flytt=mal.grepp.clone().sub(kolvW);
  const foralderQ=new THREE.Quaternion();
  weaponPivot.parent.getWorldQuaternion(foralderQ);
  flytt.applyQuaternion(foralderQ.invert());
  weaponPivot.position.add(flytt);
  weaponPivot.updateWorldMatrix(true,true);
  const kolv=holder.localToWorld(holder.userData.kolvLokal.clone());
  const mun=holder.localToWorld(holder.userData.munLokal.clone());
  const grepp=kolv.clone().lerp(mun,.16);grepp.y+=.02;
  const stod=kolv.clone().lerp(mun,.34);stod.y+=.015;
  return {grepp,stod,mun,kolv};
 }
 function applyWeaponTransform(raise){
  const up=rekylUpp();
  const hang=1-raise;
  const mg=weapons&&weapons[selected]?.id==='kulspruta';
  const bob=vapenStilla?0:bobY;
  weaponPivot.position.set(basePivot.x+hang*(mg?.02:.06),basePivot.y-hang*(mg?.22:.32)+bob+(eyeY-OGA.staende),basePivot.z+hang*(mg?.05:.12));
  if(raise>.999&&up===0){weaponPivot.quaternion.copy(aimQuat);return;}
  weaponPivot.quaternion.copy(lowQuat).slerp(aimQuat,raise);
  if(up>0){recoilEuler.set(-up,0,0,'YXZ');weaponPivot.quaternion.multiply(recoilQ.setFromEuler(recoilEuler));}
 }
 let kropp=0,stadgaNu=0,ryck=0,senFart=0,skakKvar=0,skakTid=1,gangFartNu=0,lugnTill=0,vapenStilla=false,skakAmpNu=0;
 function moveBody(forwardM,strafeM){
  _fwd.set(-Math.sin(kropp),0,-Math.cos(kropp));
  _right.set(Math.cos(kropp),0,-Math.sin(kropp));
  player.position.addScaledVector(_fwd,forwardM);
  player.position.addScaledVector(_right,strafeM*sidoAndel(styr.varden.gang));
  const ut=knuffUt(player.position.x,player.position.z,.38,hinderLista);
  player.position.x=THREE.MathUtils.clamp(ut.x,-36,36);
  player.position.z=THREE.MathUtils.clamp(ut.z,-110,6);
 }
 function updateRing(pull){
  const u=THREE.MathUtils.clamp(pull,0,1);
  $('pullRing').firstElementChild.style.strokeDashoffset=String(289.03*(1-u));
  $('fireWrap').style.setProperty('--drag',u.toFixed(3));
  $('fireWrap').classList.toggle('pulling',u>.02);
 }
 let nextBen=null,senasteSteg=0;
 function markeraBen(){
  if(!$('benVanster'))return;
  $('benVanster').classList.toggle('nasta',nextBen===null||nextBen==='vanster');
  $('benHoger').classList.toggle('nasta',nextBen===null||nextBen==='hoger');
 }
 function taSteg(sida){
  if(nextBen&&nextBen!==sida)return false;
  const nu=performance.now(),gap=senasteSteg?(nu-senasteSteg)/1000:.55;
  if(senasteSteg&&gap<.12)return false;
  senasteSteg=nu;nextBen=sida==='vanster'?'hoger':'vanster';markeraBen();
  const takt=Math.min(1,.5/Math.max(gap,.16));
  const faktor=gangFaktor(stallning,poseTo>.5);
  const meter=(.62+takt*.55)*faktor;
  moveBody(meter,0);haptics.step();
  gangFartNu=meter/Math.max(gap,.16);noteMotion(gangFartNu,takt);
  return true;
 }
 function bindBen(id,sida){
  const el=$(id);let drag=null;
  el.addEventListener('pointerdown',e=>{if(!started||(e.button&&e.button!==0))return;drag={id:e.pointerId,y:e.clientY,klar:false};el.classList.add('nere');try{el.setPointerCapture(e.pointerId);}catch{}});
  el.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id||drag.klar)return;if(e.clientY-drag.y>46){drag.klar=true;taSteg(sida);}});
  const slut=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;el.classList.remove('nere');};
  el.addEventListener('pointerup',slut);el.addEventListener('pointercancel',slut);
 }
 function updateLegHint(){
  $('arrowLeft').classList.toggle('redo',nextLeg===null||nextLeg==='left');
  $('arrowRight').classList.toggle('redo',nextLeg===null||nextLeg==='right');
 }
 function spawnCasing(){
  const s=casingState[casingCursor];if(s.alive)casingAlive=Math.max(0,casingAlive-1);
  casingCursor=(casingCursor+1)%CASING_POOL;
  ejectPort.getWorldPosition(s.p);player.getWorldQuaternion(_q);
  _right.set(1,0,0).applyQuaternion(_q);_up.set(0,1,0);_fwd.set(0,0,-1).applyQuaternion(_q);
  s.v.copy(_right).multiplyScalar(1.5+Math.random()*.8).addScaledVector(_up,-(1.2+Math.random()*.7)).addScaledVector(_fwd,.25+Math.random()*.35);
  s.axis.set(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize();
  s.spin=14+Math.random()*16;s.q.identity();s.alive=true;s.age=0;s.landed=false;s.clinked=false;s.extra=.03+Math.random()*.09;s.pitch=.82+Math.random()*.36;casingAlive++;
 }
 function updateCasings(dt){
  let dirty=false;
  for(let i=0;i<CASING_POOL;i++){
   const s=casingState[i];if(!s.alive)continue;dirty=true;s.age+=dt;
   if(!s.landed){
    s.v.y-=9.8*dt;s.p.addScaledVector(s.v,dt);_spin.setFromAxisAngle(s.axis,s.spin*dt);s.q.multiply(_spin);
    if(s.p.y<=.015){s.p.y=.015;s.v.set(0,0,0);s.landed=true;s.clinkAt=s.age+s.extra;}
   }else if(!s.clinked&&s.age>=s.clinkAt){s.clinked=true;clinkReady++;playClink(s.pitch);}
   else if(s.age>2.6){s.alive=false;casingAlive=Math.max(0,casingAlive-1);}
   casingDummy.position.copy(s.p);casingDummy.quaternion.copy(s.q);casingDummy.scale.setScalar(s.alive?1:0);casingDummy.updateMatrix();casingsMesh.setMatrixAt(i,casingDummy.matrix);
  }
  if(dirty)casingsMesh.instanceMatrix.needsUpdate=true;
 }
 function playClink(pitch){
  if(!settings.brytare.ljud||!audio||audio.state!=='running'||!clinkBuffer||clinkVoices>=4)return;
  clinkVoices++;
  const t=audio.currentTime,src=audio.createBufferSource(),tone=audio.createOscillator(),g=audio.createGain(),bp=audio.createBiquadFilter();
  src.buffer=clinkBuffer;src.playbackRate.value=pitch;
  tone.type='triangle';tone.frequency.setValueAtTime(1900*pitch,t);tone.frequency.exponentialRampToValueAtTime(640*pitch,t+.04);
  bp.type='highpass';bp.frequency.value=900;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+.055);
  src.connect(bp);tone.connect(bp);bp.connect(g);g.connect(audioBus||audio.destination);
  src.start(t);tone.start(t);src.stop(t+.06);tone.stop(t+.06);clinks++;
  src.onended=()=>{clinkVoices=Math.max(0,clinkVoices-1);src.disconnect();tone.disconnect();bp.disconnect();g.disconnect();};
 }

 async function unlockAudio(){
 try{if(navigator.audioSession)navigator.audioSession.type='playback';else if(!window.__tystBrytare){const n=22050,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,n,true);v.setUint32(28,n*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);const a=document.createElement('audio');a.setAttribute('playsinline','');a.setAttribute('x-webkit-airplay','deny');a.loop=true;a.src=URL.createObjectURL(new Blob([b],{type:'audio/wav'}));window.__tystBrytare=a;a.play().catch(()=>{});}else window.__tystBrytare.play().catch(()=>{});}catch{}
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();if(!audioBus){audioBus=audio.createDynamicsCompressor();audioBus.threshold.value=-16;audioBus.knee.value=10;audioBus.ratio.value=16;audioBus.attack.value=.001;audioBus.release.value=.08;const master=audio.createGain();master.gain.value=.7;audioBus.connect(master).connect(audio.destination);}if(!audioBuffer){audioBuffer=audio.createBuffer(1,Math.round(audio.sampleRate*.2),audio.sampleRate);const data=audioBuffer.getChannelData(0);let seed=1701;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*Math.exp(-i/(audio.sampleRate*.025));}}if(!clinkBuffer){const n=Math.max(1,Math.round(audio.sampleRate*.03));clinkBuffer=audio.createBuffer(1,n,audio.sampleRate);const data=clinkBuffer.getChannelData(0);let seed=90210;for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*Math.exp(-i/(audio.sampleRate*.004));}}loadWeaponSounds();}catch{ $('status').textContent='Ljud saknas här; spelet fungerar utan ljud.';}
 }
 function shotSound(weapon){
  if(!settings.brytare.ljud||!audioBuffer||audio?.state!=='running')return;
  while(voices.length>=cfg.ljud.max_roster){voices.shift().stop();}
  const fb=fileBuffers[weapon.id];
  if(fb){
   const t=audio.currentTime,src=audio.createBufferSource(),g=audio.createGain();src.buffer=fb;const len=Math.min(weapon.ljud_fil_s,fb.duration-weapon.ljud_start_s);const vol=(cfg.ljud.fil_volym??1)*(.7+.3*Math.min(1,settings.skottkansla));
   g.gain.setValueAtTime(vol,t);g.gain.setValueAtTime(vol,t+len*.55);g.gain.exponentialRampToValueAtTime(.0001,t+len);src.connect(g).connect(audioBus);
   let done=false;const voice={stop(){if(done)return;done=true;try{src.stop();}catch{}}};voices.push(voice);src.start(t,weapon.ljud_start_s,len+.02);
   src.onended=()=>{voices=voices.filter(v=>v!==voice);src.disconnect();g.disconnect();};return;
  }
  const now=audio.currentTime, bus=audio.createGain();bus.gain.value=cfg.ljud.volym*2.4*(.65+.35*settings.skottkansla);bus.connect(audioBus);
  const echo=audio.createDelay(.3),echoGain=audio.createGain(),echoFilter=audio.createBiquadFilter();echo.delayTime.value=weapon.eko_s;echoGain.gain.value=weapon.eko_gain;echoFilter.frequency.value=1800;bus.connect(echo).connect(echoFilter).connect(echoGain).connect(audioBus);
  const bass=audio.createOscillator(),bassGain=audio.createGain();bass.frequency.setValueAtTime(weapon.bas_hz,now);bass.frequency.exponentialRampToValueAtTime(40,now+weapon.bas_s);bassGain.gain.setValueAtTime(.0001,now);bassGain.gain.exponentialRampToValueAtTime(1.1,now+.002);bassGain.gain.exponentialRampToValueAtTime(.0001,now+weapon.bas_s);bass.connect(bassGain).connect(bus);
  const source=audio.createBufferSource(),gain=audio.createGain(),filter=audio.createBiquadFilter();source.buffer=audioBuffer;filter.type='highpass';filter.frequency.value=weapon.small_hz;gain.gain.setValueAtTime(1.6,now);gain.gain.exponentialRampToValueAtTime(.0001,now+weapon.small_s);source.connect(filter).connect(gain).connect(bus);
  let stopped=false;const voice={stop(){if(stopped)return;stopped=true;try{source.stop();bass.stop();}catch{}}};voices.push(voice);source.start(now);source.stop(now+.2);bass.start(now);bass.stop(now+weapon.bas_s);
  source.onended=()=>setTimeout(()=>{voices=voices.filter(v=>v!==voice);for(const n of [source,gain,filter,bass,bassGain,bus,echo,echoFilter,echoGain])n.disconnect();},300);
 }

 function respawn(){const enemy=targets[0];enemy.alive=true;enemy.hp=cfg.fiende.hp;enemy.root.position.set(0,0,-cfg.fiende.start_m);enemy.root.rotation.set(0,0,0);enemy.root.visible=settings.brytare.fiender;runAction.reset().play();deadFor=0;enemyCount++;}
 respawn();
 let senasteTraff=null,skottVisasTill=0,repeterade=false;
 const VIND={namn:'höger',ms:1.1};
 function targetUnderCrosshair(spread){
  scene.updateMatrixWorld(true);
  muzzleObj.getWorldPosition(_muzzle);muzzleObj.getWorldDirection(_dir);
  _dir.x+=VIND.ms*0.00025;_dir.normalize();
  if(spread){_dir.x+=spread.x;_dir.y+=spread.y;_dir.normalize();}
  ray.set(_muzzle,_dir);
  const list=[...traffMeshar,...targets.filter(t=>t.alive&&(t.kind!=='soldat'||settings.brytare.fiender)).map(t=>t.hitbox)];
  const collision=ray.intersectObjects(list,true)[0];
  const target=collision?targets.find(t=>t.hitbox===collision.object)||null:null;
  let normal=null;
  if(collision?.face){normal=collision.face.normal.clone().transformDirection(collision.object.matrixWorld).normalize();}
  senasteTraff=collision?{point:collision.point.clone(),dist:collision.distance,target,normal,object:collision.object,yta:traffSlag(collision.object.userData?.yta,normal?.y||0)}:null;
  return target;
 }
 const HAL_N=36;
 const halTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const grd=g.createRadialGradient(32,32,1,32,32,30);grd.addColorStop(0,'rgba(0,0,0,.92)');grd.addColorStop(.22,'rgba(28,22,16,.8)');grd.addColorStop(.55,'rgba(50,44,36,.28)');grd.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=grd;g.beginPath();g.arc(32,32,30,0,Math.PI*2);g.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 const halMat=new THREE.MeshBasicMaterial({map:halTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
 const halMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),halMat,HAL_N);
 halMesh.frustumCulled=false;halMesh.count=HAL_N;scene.add(halMesh);
 const halDummy=new THREE.Object3D();const halFarg=new THREE.Color();let halCursor=0,halLagda=0;
 halDummy.scale.setScalar(0);halDummy.updateMatrix();for(let i=0;i<HAL_N;i++)halMesh.setMatrixAt(i,halDummy.matrix);
 if(halMesh.instanceColor)halMesh.instanceColor.needsUpdate=true;
 function laggHal(point,normal,slag){
  const i=halCursor;halCursor=(halCursor+1)%HAL_N;halLagda=Math.min(HAL_N,halLagda+1);
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
  q.multiply(new THREE.Quaternion().setFromAxisAngle(normal,(i%7)*.4));
  halDummy.position.copy(point).addScaledVector(normal,.015);
  halDummy.quaternion.copy(q);
  const s=slag==='mark'?.2:slag==='metall'?.045:.07;
  halDummy.scale.set(s,s,1);halDummy.updateMatrix();halMesh.setMatrixAt(i,halDummy.matrix);
  halFarg.set(slag==='metall'?'#d7d2c6':slag==='mark'?'#3a3428':'#1a1612');
  halMesh.setColorAt(i,halFarg);
  halMesh.instanceMatrix.needsUpdate=true;if(halMesh.instanceColor)halMesh.instanceColor.needsUpdate=true;
 }
 function visaTraffEffekt(weapon){
  if(!settings.brytare.effekter||!senasteTraff)return;
  const n=(senasteTraff.normal||new THREE.Vector3(0,1,0)).clone();
  const slag=senasteTraff.yta||traffSlag(senasteTraff.object?.userData?.yta,n.y);
  const pos=senasteTraff.point.clone().addScaledVector(n,.02);
  const yta=slag==='metall'?'metall':slag==='mark'?'mark':'annat';
  fx.spela('traff_kula',{pos,normal:n,riktning:_dir.clone(),yta,kaliber_mm:weapon.kaliber_mm||8});
  if(slag==='vagg'||slag==='metall'||slag==='mark')laggHal(pos,n,slag);
 }
 function visaSkott(target){
  const punkt=senasteTraff?.point||_muzzle.clone().addScaledVector(_dir,60);
  const dist=senasteTraff?senasteTraff.dist:_muzzle.distanceTo(punkt);
  let rubrik;
  if(target) rubrik=`Träff · ${dist.toFixed(0)} m`;
  else{
   const soldat=targets[0].hitbox.getWorldPosition(point);
   const till=soldat.sub(_muzzle);
   const along=Math.max(1,_dir.dot(till));
   const miss=till.addScaledVector(_dir,-_dir.dot(till));
   const hoger=miss.dot(new THREE.Vector3(1,0,0));
   rubrik=`Miss · ${along.toFixed(0)} m · ${Math.abs(hoger).toFixed(1)} m ${hoger>=0?'höger':'vänster'}`;
  }
  $('skottRubrik').textContent=rubrik;
  $('skottDetalj').textContent=`Vind från ${VIND.namn}, ${VIND.ms.toFixed(1)} m/s`;
  $('skottInfo').hidden=false;
  skottVisasTill=performance.now()+1700;
 }
 function shoot(weapon,opts={}){
  const hasty=!!opts.hasty;
  shots++;shotSound(weapon);haptics.shot(weapon.haptik,weapon.id);haptics.puls(styr.varden.haptik.skott);styrTick.skott();
  const spread=hasty?{x:0,y:.012}:null;
  const target=targetUnderCrosshair(spread);
  if(target){haptics.hit();hits++;hitUntil=performance.now()+160;if(settings.brytare.skada){target.hp--;if(target.hp<=0){target.alive=false;if(target.kind==='soldat'){runAction.stop();deadFor=.001;}else{target.root.traverse(n=>{if(n.isMesh&&n.material?.color){n.material.color.multiplyScalar(.45);}});}}}}
  visaSkott(target);
  if(settings.brytare.effekter){muzzleObj.getWorldDirection(direction);muzzleObj.getWorldPosition(_muzzle);fx.spela('mynningsflamma',{pos:_muzzle.clone(),riktning:direction.clone(),kaliber_mm:weapon.kaliber_mm,mynningsbroms:false});visaTraffEffekt(weapon);}
  if(weapon.automat||weapon.id==='kulspruta'){addClimb(weapon.rekyl_rad*(.75+.25*settings.skottkansla));spawnCasing();if(hasty)startHasty();}
  else{startRifle(weapon);if(hasty)startHasty();else hastyT=null;}
  if(settings.brytare.effekter){flash=weapon.blixt_styrka*settings.skottkansla;flashDuration=weapon.blixt_s;lightPeak=weapon.mynningsljus*settings.skottkansla;muzzleFlash.scale.setScalar(weapon.mynningsflamma_m);}
  $('statHits').textContent=String(hits);$('statShots').textContent=String(shots);
 }
 function fire(opts={}){
  if(suppressShot&&!opts.precise){suppressShot=false;return true;}
  const now=performance.now();
  if(weapons[selected].automat)return false;
  if(!canAim()||now<cooldown||document.hidden)return false;
  void unlockAudio();const weapon={...weapons[selected]};cooldown=now+weapon.omladdning_ms;const token=++burstToken;const hasty=!!opts.hasty;
  shoot(weapon,{hasty});queue=Array.from({length:weapon.salva-1},(_,i)=>({at:now+(i+1)*weapon.intervall_ms,weapon,token,hasty}));return true;
 }
 function stopHold(){holding=false;}
 function beginAuto(hasty){
  if(!canAim()||!weapons[selected].automat||document.hidden)return;
  shakyBurst=hasty;void unlockAudio();
  if(!holding)holding=true;
  nextAuto=performance.now()+weapons[selected].intervall_ms;
  shoot({...weapons[selected]},{hasty});
 }
 function avlossa(grund){
  if(!canAim())return false;
  const ryckig=!!grund?.ryck;
  if(ryckig)startHasty();
  if(weapons[selected].automat){beginAuto(ryckig);return true;}
  const lugn=stadgaNu>.85&&!ryckig;
  return fire({precise:lugn,hasty:ryckig});
 }
 function mataAvtryckare(tr,nu,y){
  const A=styr.varden.avtryckare,dt=Math.max(.001,(nu-tr.sen)/1000),dy=y-tr.y,fart=dy/dt;
  tr.y=y;tr.sen=nu;
  const ned=Math.max(0,y-tr.y0);tr.pull=Math.min(1.15,ned/Math.max(8,A.drag_px));updateRing(Math.min(1,tr.pull));
  if(fart>A.snabb_fart&&ned>6)tr.snabb=true;
  if(dy>0&&fart<A.snabb_fart*.45&&!tr.snabb){tr.drag+=dt;lugnTill=nu+380;}
  stadgaNu=Math.min(1,tr.drag/Math.max(.05,A.kram_s));
  if(Math.abs(fart)<40)tr.stilla+=dt;else tr.stilla=0;
  if(tr.shot||!canAim())return;
  if(tr.snabb&&(nu-tr.t)/1000>=A.snabbt_s){tr.shot=true;avlossa(tr);return;}
  if(tr.pull>=1||(tr.pull>.2&&tr.stilla>.08)){tr.shot=true;avlossa(tr);}
 }
 $('trigger').addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!canAim())return;if(weapons[selected].automat)beginAuto(false);else fire({hasty:false});}});
 $('trigger').addEventListener('pointerdown',e=>{
  if(!started||!canAim()||(e.button&&e.button!==0))return;
  const nu=performance.now();
  if(weapons[selected].automat){
   trigger={id:e.pointerId,y0:e.clientY,y:e.clientY,t:nu,sen:nu,pull:1,shot:true,snabb:false,drag:0,stilla:0,auto:true};
   beginAuto(false);
   try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}
   return;
  }
  trigger={id:e.pointerId,y0:e.clientY,y:e.clientY,t:nu,sen:nu,pull:0,shot:false,snabb:false,drag:0,stilla:0};
  if(!e._test)haptics.puls(styr.varden.haptik.kram);
  try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}
 });
 $('trigger').addEventListener('pointermove',e=>{
  if(!trigger||e.pointerId!==trigger.id)return;
  mataAvtryckare(trigger,performance.now(),e.clientY);
 });
 function onTriggerUp(e){
  if(!trigger||e.pointerId!==trigger.id)return;
  trigger=null;updateRing(0);stadgaNu=0;stopHold();
 }
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('trigger').addEventListener(ev,onTriggerUp);
 $('trigger').addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter')stopHold();});
 addEventListener('blur',()=>{stopHold();trigger=null;updateRing(0);});
 let scopeAmt=0;
 function syncMynning(){const id=weapons[selected]?.id;const p=mynningar[id];if(p)muzzleObj.position.copy(p);}
 function applyWeapon(){const w=weapons[selected];$('weapon').textContent=w.namn;document.body.dataset.sikte=w.sikte||'';const id=w.id;mgGun.holder.visible=id==='kulspruta';k98Gun.holder.visible=id==='gevar';karbinGun.holder.visible=id==='karbin';belt.visible=id==='kulspruta';sights.visible=id==='kulspruta';syncMynning();try{localStorage.setItem('gyro_vapen_v1',id);}catch{}if(!w.automat)stopHold();syncPoseUi();}
 try{const sparadVapen=localStorage.getItem('gyro_vapen_v1');const idx=weapons.findIndex(w=>w.id===sparadVapen);if(idx>=0)selected=idx;}catch{}
 $('weapon').onclick=()=>{stopHold();queue=[];trigger=null;updateRing(0);selected=(selected+1)%weapons.length;applyWeapon();};applyWeapon();
 let neutralTimer=null,neutralKvar=3;
 function visaNeutral(){$('startPanel').hidden=true;$('neutralPanel').hidden=false;neutralKvar=3;$('neutralTid').textContent='3';clearInterval(neutralTimer);neutralTimer=setInterval(()=>{neutralKvar-=1;$('neutralTid').textContent=String(Math.max(0,neutralKvar));if(neutralKvar<=0)bekraftaNeutral();},1000);}
 function nollStallGyro(){gyro.center();gyro.nollaGira();lager.noll();}
 function bekraftaNeutral(){clearInterval(neutralTimer);neutralTimer=null;nollStallGyro();$('neutralPanel').hidden=true;started=true;last=performance.now();$('status').textContent='Neutralläget är satt. Luta för att sikta, vrid för att svänga.';}
 $('manual').onclick=()=>{gyro.stop();void unlockAudio();visaNeutral();};
 $('start').disabled=false;
 $('start').onclick=()=>{const promise=gyro.start();void unlockAudio();visaNeutral();$('status').textContent='Väntar på sensorer…';promise.then(p=>{$('status').textContent=p.orientation==='granted'?'Håll telefonen i neutralläget.':'Gyro nekades eller saknas. Du kan ändå sätta noll.';}).catch(()=>{$('status').textContent='Sensorerna kunde inte starta.';});};
 $('neutralKlar').onclick=bekraftaNeutral;
 $('nyttNoll').onclick=()=>{nollStallGyro();$('status').textContent='Nytt neutralläge satt.';};
 const settingsPanel=$('settings');function showSettings(show){settingsPanel.hidden=!show;$('settingsButton').setAttribute('aria-expanded',String(show));}
 let aktivFlik='rorelse';
 function visaFlik(namn){
  aktivFlik=namn||'rorelse';
  for(const p of document.querySelectorAll('[data-flikpanel]'))p.hidden=p.dataset.flikpanel!==aktivFlik;
  for(const b of document.querySelectorAll('#menyFlikar button'))b.classList.toggle('vald',b.dataset.flik===aktivFlik);
 }
 function closeMenu(){$('menu').hidden=true;$('menuBackdrop').hidden=true;$('menuButton').setAttribute('aria-expanded','false');}
 function visaStyr(visa){$('styrPanel').hidden=!visa;$('styrKnapp').setAttribute('aria-expanded',String(!!visa));if(visa)closeMenu();}
 function openMenu(){if($('styrPanel'))$('styrPanel').hidden=true;$('styrKnapp')?.setAttribute('aria-expanded','false');$('menu').hidden=false;$('menuBackdrop').hidden=false;$('menuButton').setAttribute('aria-expanded','true');visaFlik(aktivFlik);refreshStats();}
 $('menuButton').onclick=()=>$('menu').hidden?openMenu():closeMenu();
 $('styrKnapp').onclick=()=>visaStyr($('styrPanel').hidden);
 $('styrStang').onclick=()=>visaStyr(false);
 $('menuBackdrop').onclick=closeMenu;
 $('settingsButton').onclick=()=>{closeMenu();byggMeny($('labb'),styr);showSettings(true);};$('closeSettings').onclick=()=>showSettings(false);
 function bindTryck(el,fn){
  if(!el)return;
  let senast=0,ned=false;
  const kor=e=>{if(e.cancelable)e.preventDefault();e.stopPropagation();const n=performance.now();if(n-senast<420)return;senast=n;fn();};
  // iOS kan tappa pointerup och click när body är fixed. pointerdown och ensamt touchend räcker.
  el.addEventListener('pointerdown',e=>{ned=true;kor(e);});
  el.addEventListener('touchend',e=>{if(ned){ned=false;return;}kor(e);},{passive:false});
 }
 bindTryck($('weaponPose'),stegVapen);bindTryck($('vapenSteg'),stegVapen);syncPoseUi();
 $('center').onclick=()=>{nollStallGyro();rifle=null;rifleP=0;climb=0;climbP=0;climbBack=null;hastyT=null;hastyP=0;settleT=null;settleX=settleZ=0;};
 $('diveSense').value=settings.kastaKanslighet;$('diveSense').onchange=()=>{settings.kastaKanslighet=$('diveSense').value;if(settings.kastaKanslighet==='av'){detektor.avbryt();gyro.slappSikte();}save();};
 let siktVal='kikare';
 function syncSikt(){$('siktVal').textContent=siktVal==='kikare'?'Kikare':'Ögat';$('siktVal').disabled=!settings.forstoringPa;document.body.dataset.oga=siktVal;}
 $('siktVal').onclick=()=>{if(!settings.forstoringPa)return;siktVal=siktVal==='kikare'?'ogat':'kikare';syncSikt();};
 $('forstoringPa').checked=settings.forstoringPa;$('forstoringPa').onchange=()=>{settings.forstoringPa=$('forstoringPa').checked;if(!settings.forstoringPa)siktVal='ogat';syncSikt();save();};
 $('forstoringNiva').value=String(settings.forstoringNiva);$('forstoringNiva').onchange=()=>{settings.forstoringNiva=Number($('forstoringNiva').value);save();};
 syncSikt();byggMeny($('labb'),styr);
 let visaSensor=false;try{visaSensor=localStorage.getItem('gyro_sensordata_v1')==='1';}catch{}
 function syncSensor(){$('gyroInfo').hidden=!visaSensor;$('stallning').hidden=!visaSensor;const kryss=$('visaSensor');if(kryss)kryss.checked=visaSensor;document.body.dataset.sensor=visaSensor?'ja':'nej';}
 if($('visaSensor'))$('visaSensor').onchange=()=>{visaSensor=$('visaSensor').checked;try{localStorage.setItem('gyro_sensordata_v1',visaSensor?'1':'0');}catch{}syncSensor();};
 syncSensor();
 for(const b of document.querySelectorAll('#menyFlikar button'))b.onclick=()=>{visaFlik(b.dataset.flik);};
 byggSnabb($('rorelseSnabb'),styr,{
  lage:()=>gyroMeny.varden.sikta.yaw.lage,
  sattLage(id){const lage=id==='rorelse'?'rorelse':'foljer';for(const axel of ['yaw','pitch','roll'])gyroMeny.varden.sikta[axel].lage=lage;gyroMeny.satt();},
  aterga(){const ut=document.createElement('output'),inp=document.createElement('input');inp.type='range';inp.min='0.5';inp.max='6';inp.step='0.1';const visa=()=>{inp.value=String(settings.aterga_s);ut.value=Number(settings.aterga_s).toFixed(1)+' s';};visa();inp.oninput=()=>{settings.aterga_s=Number(inp.value);if($('returnTime'))$('returnTime').value=inp.value;updateReturn();};const span=document.createElement('span');span.style.display='block';span.append(ut,inp);return span;},
  invertera(){const box=document.createElement('div');box.className='checks';for(const [nyckel,text,id] of [['inverteraX','Invertera pitch','invertX'],['inverteraY','Invertera vridning','invertY'],['inverteraZ','Invertera sidlutning','invertZ']]){const lab=document.createElement('label'),inp=document.createElement('input');inp.type='checkbox';inp.checked=!!settings[nyckel];inp.onchange=()=>{settings[nyckel]=inp.checked;if($(id))$(id).checked=inp.checked;save();};lab.append(inp,document.createTextNode(' '+text));box.append(lab);}return box;},
  axlar(){visaStyr(true);}
 });
 function anvendStyr(){settings.kanslighet=styr.varden.sikte.ytterst?styr.varden.sikte.kanslighet*4:styr.varden.sikte.kanslighet;settings.utjamning_s=styr.varden.sikte.ytterst?.012:styr.varden.sikte.utjamning_s;settings.forstoringNiva=styr.varden.kikare.zoom;settings.forstoringPa=siktVal==='kikare';syncPoseUi();syncSikt();}
 styr.lyssna(anvendStyr);anvendStyr();
 $('standUp').onclick=()=>{if(stallning!=='staende')startStallning('staende');};
 $('shotFeel').value=settings.skottkansla;function updateShotFeel(){settings.skottkansla=Number($('shotFeel').value);$('shotFeelValue').value=settings.skottkansla.toFixed(2)+'×';haptics.sync();save();}updateShotFeel();$('shotFeel').oninput=updateShotFeel;
 $('returnTime').value=settings.aterga_s;function updateReturn(){settings.aterga_s=Number($('returnTime').value);$('returnValue').value=settings.aterga_s.toFixed(1)+' s';save();}updateReturn();$('returnTime').oninput=updateReturn;
 $('sensitivity').value=settings.kanslighet;function updateSensitivity(){settings.kanslighet=Number($('sensitivity').value);$('sensitivityValue').value=settings.kanslighet.toFixed(2)+'×';save();}updateSensitivity();$('sensitivity').oninput=updateSensitivity;
 for(const [id,key]of [['invertX','inverteraX'],['invertY','inverteraY'],['invertZ','inverteraZ']]){$(id).checked=!!settings[key];$(id).onchange=()=>{settings[key]=$(id).checked;save();};}
 let debugEnabled=!!saved.debug;function setDebug(){debugEnabled=$('showDebug').checked;$('debug').hidden=!debugEnabled;}$('showDebug').checked=debugEnabled;setDebug();$('showDebug').onchange=()=>{setDebug();save();};
 $('hapticStyle').value=settings.hapticStyle;$('hapticStyle').onchange=()=>{settings.hapticStyle=$('hapticStyle').value;save();};
 for(const [key,p]of Object.entries(hapticStyles)){const div=document.createElement('div');const title=document.createElement('label');title.textContent=p.namn;div.append(title);for(const [field,name,min,max,step]of [['styrka','Styrka',0,1,.05],['varaktighet_ms','Längd (ms)',1,100,1]]){const label=document.createElement('label'),output=document.createElement('output'),input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=p[field];output.value=p[field];label.append(name,output,input);input.oninput=()=>{p[field]=Number(input.value);output.value=input.value;save();};div.append(label);}$('hapticEditors').append(div);}
 const switchNames={atergang:'Siktet glider tillbaka till mitten',horisont:'Rak horisont (ingen sidolutning)',skada:'Skada',fiender:'Framryckande soldat',ljud:'Ljud',effekter:'Ljus och rök',haptik:'Haptik',acceleration:'Rörelsesväng',occlusion:'Dölj skymda enheter',lod:'Avståndsdetaljer'};
 for(const key of Object.keys(settings.brytare)){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=settings.brytare[key];input.onchange=()=>{settings.brytare[key]=input.checked;haptics.sync();save();};label.append(input,switchNames[key]);$('toggles').append(label);}
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
 document.addEventListener('visibilitychange',()=>{queue=[];holding=false;burstToken++;trigger=null;updateRing(0);endLook();if(document.hidden){audio?.suspend();navigator.vibrate?.(0);}last=performance.now();});
 const snapshot={targetCenters:targets.map(t=>({kind:t.kind,center:t.hitbox.getWorldPosition(new THREE.Vector3()).toArray()})),ready:true,models:8,clip:clip.name,clipTracks:inPlace.tracks.length,clipMatches,modelLoadMs,rawBounds,modelScale:soldierScale,haptics:haptics.mode,shots:0,hits:0};
 window.gyroDiagnostics=snapshot;
 if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify({type:'bridge-ready',version:1}));haptics.sync();}
 addEventListener('ww2-native-lifecycle',e=>{if(!window.ReactNativeWebView)return;queue=[];holding=false;burstToken++;trigger=null;updateRing(0);last=performance.now();if(!e.detail?.active)audio?.suspend();else gyro.center();});
 $('status').textContent='Skjutbanan är redo.';
 function refreshStats(){
  $('statFps').textContent=fps+' fps';$('statDraws').textContent=String(renderer.info.render.calls);
  $('statTris').textContent=renderer.info.render.triangles.toLocaleString('sv-SE');$('statLoad').textContent=modelLoadMs+' ms';
  $('statHits').textContent=String(hits);$('statShots').textContent=String(shots);
 }
 function gestureKind(x,y){
  const bar=$('topbar').getBoundingClientRect().bottom,h=innerHeight;
  if(y<=bar||y>h*.7)return 'aim';
  return 'look';
 }
 function beginLook(e){
  lookPtr={id:e.pointerId,x:e.clientX,y:e.clientY};head.holding=true;head.release=null;head.targetYaw=0;head.targetPitch=0;
  try{$('spel').setPointerCapture(e.pointerId);}catch{}
 }
 function moveLook(e){
  if(!lookPtr||e.pointerId!==lookPtr.id)return;
  const dx=e.clientX-lookPtr.x,dy=e.clientY-lookPtr.y;
  head.targetYaw=THREE.MathUtils.clamp(dx/120*MAX_YAW,-MAX_YAW,MAX_YAW);
  head.targetPitch=THREE.MathUtils.clamp((-dy)/220*MAX_PITCH,0,MAX_PITCH);
 }
 function endLook(e){
  if(!lookPtr)return;
  if(e&&e.pointerId!==undefined&&e.pointerId!==lookPtr.id)return;
  lookPtr=null;head.holding=false;head.release={yaw:head.yaw,pitch:head.pitch,t:0};
 }
 function beginStep(side,e){
  stepPtr={side,id:e.pointerId,y:e.clientY,prevY:e.clientY,prevT:performance.now(),done:false};
  try{$('spel').setPointerCapture(e.pointerId);}catch{}
 }
 function moveStep(e){
  if(!stepPtr||e.pointerId!==stepPtr.id)return;
  const nowMs=performance.now(),dt=Math.max(.001,(nowMs-stepPtr.prevT)/1000),dy=e.clientY-stepPtr.prevY;
  stepPtr.prevY=e.clientY;stepPtr.prevT=nowMs;const total=e.clientY-stepPtr.y;
  if(total<12||dy<=0)return;
  const run=THREE.MathUtils.clamp((dy/dt-380)/1000,0,1),speed=1.35+run*3.6;
  moveBody(speed*dt,0);noteMotion(speed,run);
  if(!stepPtr.done&&total>68){stepPtr.done=true;haptics.step();nextLeg=stepPtr.side==='left'?'right':'left';updateLegHint();}
 }
 function endStep(e){if(!stepPtr)return;if(e&&e.pointerId!==undefined&&e.pointerId!==stepPtr.id)return;stepPtr=null;}
 function onCanvasDown(e){
  if(!started||(e.button&&e.button!==0)||!$('settings').hidden)return;
  const kind=gestureKind(e.clientX,e.clientY);
  if(kind==='aim')return;
  e.stopPropagation();e.preventDefault();
  if(!$('menu').hidden)closeMenu();
  beginLook(e);
 }
 function onCanvasMove(e){
  if(lookPtr&&e.pointerId===lookPtr.id){e.stopPropagation();moveLook(e);}
  else if(stepPtr&&e.pointerId===stepPtr.id){e.stopPropagation();moveStep(e);}
 }
 function onCanvasUp(e){
  if(lookPtr&&e.pointerId===lookPtr.id){e.stopPropagation();endLook(e);}
  else if(stepPtr&&e.pointerId===stepPtr.id){e.stopPropagation();endStep(e);}
 }
 const canvas=$('spel');
 canvas.addEventListener('pointerdown',onCanvasDown,true);
 canvas.addEventListener('pointermove',onCanvasMove,true);
 canvas.addEventListener('pointerup',onCanvasUp,true);
 canvas.addEventListener('pointercancel',onCanvasUp,true);
 function watchTrigger(){
  if(!trigger||trigger.shot||!canAim())return;
  const A=styr.varden.avtryckare,alder=(performance.now()-trigger.t)/1000;
  if(trigger.snabb&&alder>=A.snabbt_s){trigger.shot=true;avlossa(trigger);return;}
  if(trigger.pull<.12&&alder>=A.hall_s){trigger.shot=true;stadgaNu=Math.min(stadgaNu,.2);avlossa(trigger);}
 }
 function placeSights(){
  camera.getWorldDirection(_fwd);
  weaponPivot.getWorldDirection(_dir);
  if(_dir.dot(_fwd)<0)_dir.negate();
  const align=_fwd.angleTo(_dir);snapshot.alignDeg=align*180/Math.PI;
  const kikare=vy==='forsta'&&siktVal==='kikare'&&poseSteg===2&&weapons[selected].sikte==='kikare'&&raiseValue()>.85;
  const goal=kikare?1:0;
  if(!kikare)scopeAmt=0;else scopeAmt+=(goal-scopeAmt)*0.35;
  if(scopeAmt<.01)scopeAmt=0;
  document.body.dataset.siktar=scopeAmt>.08?'ja':'nej';
  $('scope').style.opacity=String(scopeAmt);
  $('scope').style.transform='none';
  $('irons').style.transform='none';
  const zoom=styr.varden.kikare.zoom||4;
  const karbinSikte=vy==='forsta'&&poseSteg===2&&weapons[selected]?.sikte==='karbin'&&raiseValue()>.8;
  document.body.dataset.karbin=karbinSikte?'ja':'nej';
  const jarn=false;
  document.body.dataset.jarn=jarn?'ja':'nej';
  const mal=jarn&&sikteFart<.4?1:0;
  const tau=Math.max(.05,styr.varden.skak.jarnForsening_s);
  jarnLinje+=(mal-jarnLinje)*(1-Math.exp(-(senasteDt||.016)/tau));
  const skara=document.querySelector('#irons .skara');
  if(skara){skara.style.transform=`translateY(${((1-jarnLinje)*22).toFixed(1)}px)`;skara.style.filter=`blur(${(1.6-jarnLinje*1.3).toFixed(2)}px)`;}
  $('scope').dataset.kors=styr.varden.kikare.variant==='tunt'?'tunt':styr.varden.kikare.variant==='m73'?'m73':'zf39';
  const andel=vy==='forsta'&&siktVal==='kikare'&&settings.forstoringPa?scopeAmt:0;
  weaponPivot.visible=!(vy==='forsta'&&(scopeAmt>.2||karbinSikte));
  const fov=THREE.MathUtils.lerp(cfg.kamera.fov,cfg.kamera.fov/zoom,andel);
  if(Math.abs(camera.fov-fov)>.05){camera.fov=fov;camera.updateProjectionMatrix();}
  muzzleObj.getWorldPosition(_muzzle);muzzleObj.getWorldDirection(direction);
  _aim.copy(_muzzle).addScaledVector(direction,40);_aim.project(camera);
  aimNdcX=_aim.x;aimNdcY=_aim.y;
  weaponPivot.getWorldPosition(point);breechWY=point.y;point.project(camera);breechNdcY=point.y;
  muzzleObj.getWorldPosition(tmp);muzzleWY=tmp.y;muzzleWZ=tmp.z;tmp.project(camera);muzzleNdcY=tmp.y;
 }
 const OGA={staende:cfg.kamera.hojd_m,hukande:1.05,knastående:1.12,liggande:0.38};
 let stallning='staende',eyeFrom=OGA.staende,eyeTo=OGA.staende,eyeT=1,eyeDur=.6,eyeY=OGA.staende,impactT=null,impactArm=false,impactAmp=0;
 const detektor=skapaDetektor(),gestKo=[];
 function smoothEye(){const u=eyeDur<=0?1:Math.min(1,eyeT/eyeDur),s=u*u*(3-2*u);return eyeFrom+(eyeTo-eyeFrom)*s;}
 function stallningText(){return stallning==='knastående'&&poseSteg===2?'Knästående skjutande':(STALLNING_NAMN[stallning]||stallning);}
 function syncStallningUi(){$('stallningNamn').textContent=stallningText();$('standUp').disabled=stallning==='staende';const huk=stallning==='hukande'||stallning==='knastående';$('knappSta')?.classList.toggle('vald',stallning==='staende');$('knappHuk')?.classList.toggle('vald',huk);$('knappLigg')?.classList.toggle('vald',stallning==='liggande');}
 function startStallning(namn){
  if(namn==='hukande'&&poseSteg===2)namn='knastående';
  if(namn==='knastående'&&poseSteg!==2)namn='hukande';
  if(!OGA[namn]||namn===stallning&&Math.abs(eyeTo-OGA[namn])<.001&&eyeT>=eyeDur)return;
  const ned=OGA[namn]<smoothEye()-.02;
  eyeFrom=smoothEye();eyeTo=OGA[namn];eyeT=0;eyeDur=.6;impactArm=ned;impactAmp=namn==='liggande'?.05:.028;stallning=namn;syncStallningUi();
  if(!ned)haptics.impact(.7);
 }
 function uppdateraOga(dt){
  if(eyeT<eyeDur)eyeT=Math.min(eyeDur,eyeT+dt);
  eyeY=smoothEye();
  if(impactArm&&eyeT>=eyeDur){impactArm=false;impactT=0;haptics.impact(stallning==='liggande'?1.6:1);}
  if(impactT!=null){impactT+=dt;eyeY-=Math.sin(Math.min(1,impactT/.16)*Math.PI)*impactAmp;if(impactT>.2)impactT=null;}
 }
 function tillampaGest(kod){
  if(!kod)return;
  if(kod.typ==='hall'){gyro.hallSikte();return;}
  if(kod.typ==='slapp'){gyro.slappSikte();return;}
  gyro.bekraftaSikte();
  const nasta=nastaStallning(stallning,kod.typ);
  if(nasta!==stallning)startStallning(nasta);
 }
 function mataGestKo(dt){if(!gestKo.length)return;const s=gestKo[0];gyro.mataGest(s.tipp,s.vrid);s.left-=dt;if(s.left<=0)gestKo.shift();}
 const knyckStallning=skapaKnyckStallning();
 function stallningSteg(dt){
  const nu=performance.now()/1000,tipp=gyro.values.pitchNedDps||0,vrid=gyro.values.vridHogerDps||0;
  const flick=lager.gest.steg(tipp,nu,gyroMeny.varden);
  if(flick==='ner')startStallning('liggande');
  else if(flick==='upp')lager.hoppa();
  if(styr.varden.stallning.satt==='knyck'){
   detektor.steg(nu,tipp,vrid,'av');
   const typ=knyckStallning.steg(nu,tipp,styr.varden.stallning.ner_dps,styr.varden.stallning.upp_dps);
   if(typ){gyro.bekraftaSikte();const nasta=nastaStallning(stallning,typ);if(nasta!==stallning)startStallning(nasta);}
  }else{
   const gestKans=styr.varden.stallning.satt==='gyro'?styr.varden.stallning.grans_dps:'av';
   tillampaGest(detektor.steg(nu,tipp,vrid,gestKans));
  }
  uppdateraOga(dt);
  const m=detektor.visning(),text=`Tippning ${m.tipp}°/s · Vridning ${m.vrid}°/s`,kort=`${m.tipp}°/s · ${m.vrid}°/s`;
  if($('diveMeter').textContent!==text)$('diveMeter').textContent=text;
  if($('stallMeter').textContent!==kort)$('stallMeter').textContent=kort;
 }
 let forePitchSkak=0,foreRollSkak=0,foreKroppSkak=0,senStyrka=0,sikteFart=0,senasteDt=.016;
 function uppdateraSkak(dt){
  const sikte=dt>0?Math.hypot(gyro.vinklar.pitch-forePitchSkak,gyro.vinklar.roll-foreRollSkak)/Math.max(dt,.001):0;sikteFart=sikte;
  forePitchSkak=gyro.vinklar.pitch;foreRollSkak=gyro.vinklar.roll;
  const kroppFart=dt>0?Math.abs(kropp-foreKroppSkak)/Math.max(dt,.001):0;
  foreKroppSkak=kropp;
  const nu=rorelseStyrka({sikteRadS:sikte,kroppRadS:kroppFart,gang:gangFartNu});
  if(nu>.08){senStyrka=nu;skakTid=skakSekunder(1.1+nu*3.1);skakKvar=skakTid;}
  else if(skakKvar>0)skakKvar=Math.max(0,skakKvar-dt);
  else senStyrka=0;
  gangFartNu*=Math.exp(-dt*4);
  let vila=styr.varden.skak.grund;
  if(stallning==='hukande'||stallning==='knastående')vila*=.62;else if(stallning==='liggande')vila*=.34;
  if(weapons[selected]?.id==='kulspruta')vila*=monterad?styr.varden.ksp.skak_monterad:stallning==='hukande'?styr.varden.ksp.skak_kna:styr.varden.ksp.skak_staende;
  else vila*=2.4;
  if(poseSteg===1)vila*=1.45;
  const nuExtra=Math.min(1,sikte/1.4)*styr.varden.skak.nu;
  vapenStilla=performance.now()<lugnTill;
  const amp=vapenStilla?0:skakAmplitud(vila,Math.max(senStyrka,nuExtra),Math.max(skakKvar,nuExtra>0?skakTid:0),skakTid,scopeAmt>.4?0:stadgaNu)*(scopeAmt>.4?(1-stadgaNu)*.42:1);
  skakAmpNu=amp;
  const t=performance.now()/1000;
  const rytm=vapenStilla?0:Math.sin(t*(2.4+puls*7))*puls*styr.varden.spurt.puls_skak*vila;
  const ande=styr.varden.skak.andetag??1, darr=styr.varden.skak.tremor??0.16;
  const scopeDamp=scopeAmt>.4?.22:stallning==='liggande'?.35:1;
  breathEuler.set((Math.sin(t*1.55)+Math.sin(t*2.7+1.1)*.35)*amp*ande+Math.sin(t*52)*amp*darr*scopeDamp+rytm,(Math.sin(t*1.2+.4)+Math.sin(t*3.1)*.28)*amp*ande+Math.sin(t*47+.7)*amp*darr*.55*scopeDamp,0,'YXZ');
  breathQuat.setFromEuler(breathEuler);
 }
 syncStallningUi();
 window.gyroGest={
  simulera(prover,kanslighet=settings.kastaKanslighet,start=stallning){return simulera(prover,kanslighet,start);},
  sätt(namn){startStallning(namn);},
  vapen(steg){poseSteg=((steg%3)+3)%3;poseFrom=raiseValue();poseTo=VAPEN_MAL[poseSteg];poseT=1;syncPoseUi();if(stallning==='hukande'||stallning==='knastående')startStallning(poseSteg===2?'knastående':'hukande');},
  vy(namn){sattVy(namn);},
  satt(nyckel,varde){styr.satt(nyckel,varde);},
  kors(id){styr.satt('kikare.variant',id);},
  kö(delar){for(const d of delar)gestKo.push({left:d.ms/1000,tipp:d.tipp,vrid:d.vrid});},
  nollstall(){detektor.avbryt();gestKo.length=0;gyro.slappSikte();},
  läge(){
   camera.updateWorldMatrix(true,true);weaponPivot.updateWorldMatrix(true,false);
   camera.getWorldDirection(_fwd);muzzleObj.getWorldDirection(_dir);weaponPivot.getWorldQuaternion(_q);
   const camE=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');
   const gunE=new THREE.Euler().setFromQuaternion(_q,'YXZ');
   const foreAim=_aim.clone();weaponPivot.getWorldPosition(_aim);const ndc=_aim.clone().project(camera);_aim.copy(foreAim);
   const jagNdc=jag.getWorldPosition(new THREE.Vector3()).project(camera);
  const kroppBox=new THREE.Box3().setFromObject(jag);const kroppStor=kroppBox.getSize(new THREE.Vector3());
  let greppAvstand=null,handX=0,handY=0,handZ=0,handLX=0,handLY=0,handLZ=0;
  if(vy==='bakifran'){
   const till=(namn,mal)=>{const hand=jag.getObjectByName(namn);if(!hand)return;hand.getWorldPosition(_muzzle);_pip.copy(_muzzle).sub(player.position).applyQuaternion(_q.copy(player.quaternion).invert());mal[0]=_pip.x;mal[1]=_pip.y;mal[2]=_pip.z;};
   const hr=[0,0,0],hl=[0,0,0];till('hand_r',hr);till('hand_l',hl);handX=hr[0];handY=hr[1];handZ=hr[2];handLX=hl[0];handLY=hl[1];handLZ=hl[2];
   const hand=jag.getObjectByName('hand_r');const senGrepp=benpose.senaste()?.grepp;
   if(hand&&senGrepp){hand.getWorldPosition(_muzzle);greppAvstand=_muzzle.distanceTo(senGrepp);}
  }
  return {stallning,eyeY,kanslighet:settings.kastaKanslighet,meter:detektor.visning(),namn:$('stallningNamn').textContent,meterText:$('diveMeter').textContent,kropp:kropp*180/Math.PI,sikt:siktVal,fov:camera.fov,stadga:stadgaNu,forstoring:settings.forstoringNiva,forstoringPa:settings.forstoringPa,z:player.position.z,x:player.position.x,yaw:gyro.vinklar.yaw*180/Math.PI,roll:gyro.vinklar.roll*180/Math.PI,pitch:gyro.vinklar.pitch*180/Math.PI,lookX:_fwd.x,lookY:_fwd.y,lookZ:_fwd.z,munX:_dir.x,munY:_dir.y,munZ:_dir.z,camYaw:camE.y,gunYaw:gunE.y,py:player.quaternion.y,ndcX:ndc.x,ndcY:ndc.y,skott:shots,traffar:hits,pose:poseSteg,fiendeZ:targets[0].root.position.z,info:document.getElementById('gyroInfo')?.innerText||'',align:snapshot.alignDeg,siktar:document.body.dataset.siktar,fps,vy,vapenSynlig:weaponPivot.visible,jagSynlig:jag.visible,camX:camera.position.x,camY:camera.position.y,camZ:camera.position.z,jagNdcX:jagNdc.x,jagNdcY:jagNdc.y,boj:benpose.böj(),hojd:kroppStor.y,langd:Math.max(kroppStor.x,kroppStor.z),skottText:$('skottRubrik')?.textContent||'',version:$('version')?.textContent||'',vapenId:weapons[selected].id,skak:skakAmpNu,stilla:vapenStilla,pip:pipGrad[weapons[selected].id]||0,hal:halLagda,hinder:hinderLista.length,karbin:document.body.dataset.karbin||'nej',sido:sidoAndel(styr.varden.gang),grepp:greppAvstand,handX,handY,handZ,handLX,handLY,handLZ,yta:senasteTraff?.yta||'',menyStandard:gyroMeny.arStandard(),hopp:lager.hoppHojd,pace:lager.kryss.pace,haptikMetod:styrTick.metod};
 },
 valj(id){const i=weapons.findIndex(w=>w.id===id);if(i<0)return false;selected=i;stopHold();applyWeapon();return true;},
  vinkel(grad){gyro.tvungenVinkel=grad;},
  lagg(alpha,beta,gamma){gyro.active=true;gyro.received=true;gyro.lasOrientering(alpha,beta,gamma);},
  sensor(){return {kalla:gyro.kalla,held:gyro.aimHeld,nollA:gyro.nollAlpha,nollB:gyro.nollBeta,nollG:gyro.nollGamma,a:gyro.values.alpha,b:gyro.values.beta,g:gyro.values.gamma,pitch:gyro.values.pitchNedDps,vrid:gyro.values.vridHogerDps,rot:{...gyro.values.rotationRate}};},
  steg(sida){started=true;return taSteg(sida);},
  visaNeutral, bekraftaNeutral,
  sikte(lage){siktVal=lage;syncSikt();},
  drag(pull){updateRing(pull);},
  simHall(ms=150){const nu=performance.now();trigger={id:99,y0:0,y:0,t:nu-ms,sen:nu,pull:0,shot:false,ryck:false,drag:0,stilla:0};watchTrigger();const n=shots;trigger=null;stopHold();return n;},
  provaSikte(){
   gyro.active=true;gyro.received=true;gyro.raw.identity();gyro.prevRaw.identity();gyro.origin.identity();gyro.fartRedo=true;gyro.aimHeld=false;
   gyro.update(.016);const fore=gyro.smooth.clone();gyro.hallSikte();
   gyro.raw.setFromAxisAngle(new THREE.Vector3(1,0,0),.9);const underHall=gyro.update(.016).angleTo(fore);
   gyro.bekraftaSikte();const efter=gyro.update(.016).angleTo(fore);
   gyro.raw.identity();gyro.origin.identity();gyro.fartRedo=false;gyro.aimHeld=false;return {underHall,efter};
  }
 };
 window.gyroStyr={meny:gyroMeny,lager,tick:styrTick};
 let spak={x:0,y:0,mag:0},platta={x:0,y:0,mag:0};
 function bindSpak(rot,knapp,mal){
  let id=null,x0=0,y0=0;
  const flytta=(dx,dy)=>{
   const radie=Math.min(rot.clientWidth,rot.clientHeight)/2;
   const knopp=Math.min(knapp.offsetWidth||32,knapp.offsetHeight||32)/2;
   const maxSyn=Math.max(0,radie-knopp-2);
   const maxSpel=Math.max(maxSyn,radie*.72);
   const len=Math.hypot(dx,dy);
   const ux=len>1e-4?dx/len:0,uy=len>1e-4?dy/len:0;
   const spel=Math.min(maxSpel,len);
   mal.mag=maxSpel>0?spel/maxSpel:0;
   mal.x=ux*mal.mag;mal.y=uy*mal.mag;
   const syn=Math.min(maxSyn,len);
   knapp.style.transform=`translate(${ux*syn}px,${uy*syn}px)`;
  };
  rot.addEventListener('pointerdown',e=>{if(!started||(e.button&&e.button!==0))return;id=e.pointerId;const r=rot.getBoundingClientRect();x0=r.left+r.width/2;y0=r.top+r.height/2;try{rot.setPointerCapture(id);}catch{}});
  rot.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;flytta(e.clientX-x0,e.clientY-y0);});
  const slut=e=>{if(e.pointerId!==id)return;id=null;mal.x=mal.y=mal.mag=0;knapp.style.transform='';};
  rot.addEventListener('pointerup',slut);rot.addEventListener('pointercancel',slut);
 }
 function styrSteg(dt,aimBas){
  const P=styr.varden,dod=(P.sikte.ytterst?0:P.sikte.dodZon_grad)*Math.PI/180,kans=P.sikte.ytterst?P.sikte.kanslighet*4:P.sikte.kanslighet;
  let pitch=gyro.vinklar.pitch,roll=gyro.vinklar.roll,yaw=gyro.vinklar.yaw;
  if(Math.abs(pitch)<dod)pitch=0;if(Math.abs(roll)<dod)roll=0;
  puls=Math.max(0,puls-dt/Math.max(.2,P.spurt.puls_avklingning_s));
  const takt=gyro.values.pitchNedDps||0;
  if(Math.abs(takt)<P.gang.knyck_dps*.7)lugnPitch=pitch;
  if(!gyroMeny.varden.gangLutning&&P.gang.satt==='knyck'&&knyck.steg(takt,P.gang.knyck_dps)&&!gyro.aimHeld){moveBody(P.gang.steg_m,0);haptics.step();gangFartNu=Math.max(gangFartNu,P.gang.steg_m/.3);noteMotion(gangFartNu,.4);}
  if(poseSteg===0&&gyroMeny.varden.gangLutning){
   const kr=lager.kryss.steg(pitch,-(gyro.values.pitchNedDps||0));
   gangFartNu=kr.fart;if(kr.fart)moveBody(kr.fart*dt,0);
   if(kr.andra)styrTick.tick();
   if(spak.mag>.22&&ork>.02){const sp=P.spurt.fart_ms*spak.mag;moveBody(sp*dt,spak.x*sp*dt);ork=Math.max(0,ork-dt/Math.max(.4,P.spurt.uthallighet_s)*spak.mag);puls=Math.min(1,puls+dt*.45);gangFartNu=Math.max(gangFartNu,sp);noteMotion(sp,1);}
   else ork=Math.min(1,ork+dt/Math.max(.4,P.spurt.aterhamtning_s));
  }else if(poseSteg===0&&P.gang.satt!=='knyck'){
   if(lager.kryss.pace)lager.kryss.noll();
   const gf=gangFartFranLutning(Math.max(0,-pitch),P.gang);gangFartNu=gf;if(gf)moveBody(gf*dt,0);
   if(spak.mag>.22&&ork>.02){const sp=P.spurt.fart_ms*spak.mag;moveBody(sp*dt,spak.x*sp*dt);ork=Math.max(0,ork-dt/Math.max(.4,P.spurt.uthallighet_s)*spak.mag);puls=Math.min(1,puls+dt*.45);gangFartNu=Math.max(gangFartNu,sp);noteMotion(sp,1);}
   else ork=Math.min(1,ork+dt/Math.max(.4,P.spurt.aterhamtning_s));
  }else if(poseSteg===0){
   if(spak.mag>.22&&ork>.02){const sp=P.spurt.fart_ms*spak.mag;moveBody(sp*dt,spak.x*sp*dt);ork=Math.max(0,ork-dt/Math.max(.4,P.spurt.uthallighet_s)*spak.mag);puls=Math.min(1,puls+dt*.45);gangFartNu=Math.max(gangFartNu,sp);noteMotion(sp,1);}
   else ork=Math.min(1,ork+dt/Math.max(.4,P.spurt.aterhamtning_s));
  }else if(platta.mag>.12){
   const sp=P.platta.fart_ms*platta.mag*(poseSteg===2?.5:.75);moveBody(-platta.y*sp*dt,platta.x*sp*dt);gangFartNu=sp;noteMotion(sp,platta.mag>.75?.5:0);ork=Math.min(1,ork+dt/Math.max(.4,P.spurt.aterhamtning_s));
  }else{gangFartNu*=Math.exp(-dt*3);ork=Math.min(1,ork+dt/Math.max(.4,P.spurt.aterhamtning_s));}
  const vridKropp=poseSteg===0||P.sikte.satt!=='tipp_vrid';
  if(vridKropp&&!gyro.aimHeld){
   if(kroppIVila(yaw,gyro.values.vridHogerDps||0,P.kropp)){if(Number.isFinite(gyro.values.alpha))gyro.nollAlpha=gyro.values.alpha;else gyro.nollaGira();}
   else kropp-=kroppFartRad(yaw,P.kropp)*(poseSteg===0?(P.gang.svang_mjuk??1):1)*dt;
  }
  const svangLage=poseSteg>=1&&vy==='forsta'?'sikte':'gang';
  const svang=svangFranRoll(roll,P.gang,svangLage);
  if(svang&&!gyro.aimHeld)kropp-=svang*dt;
  if(poseSteg===0){
   hoft+=(0-hoft)*(1-Math.exp(-dt/.12));
  }else if(P.sikte.satt==='overkropp'){
   const vilaRoll=(P.overkropp.vila_grad||0)*Math.PI/180;
   const rollMal=Math.abs(roll)<vilaRoll&&Math.abs(gyro.values.vridHogerDps||0)<P.kropp.vila_fart?0:roll;
   const mal=hoftMalRad(rollMal,P.overkropp);hoft+=(mal-hoft)*(1-Math.exp(-dt/.08));
   const folj=benFoljer(hoft,P.overkropp,dt);hoft=folj.hoft;kropp-=folj.kropp;
  }else hoft+=(0-hoft)*(1-Math.exp(-dt/.12));
  $('pulsFyll').style.width=(puls*100).toFixed(0)+'%';
  const aimPitch=P.gang.satt==='knyck'?lugnPitch:pitch;
  const spitch=THREE.MathUtils.clamp(aimPitch*kans,-1.15,1.15);
  if(poseSteg===0){styrEuler.set(P.gang.satt!=='knyck'?THREE.MathUtils.clamp(pitch*.45,-.5,.6):spitch,0,0,'YXZ');return styrQuat.setFromEuler(styrEuler);}
  if(P.sikte.satt==='overkropp'){styrEuler.set(spitch,-hoft,0,'YXZ');return styrQuat.setFromEuler(styrEuler);}
  if(poseSteg>=1&&P.sikte.satt==='tipp_vrid'){styrEuler.set(spitch,THREE.MathUtils.clamp(-yaw*kans,-1.2,1.2),0,'YXZ');return styrQuat.setFromEuler(styrEuler);}
  return aimBas;
 }
 bindSpak($('spak'),$('spakKnapp'),spak);bindSpak($('platta'),$('plattaKnapp'),platta);
 $('knappNer').onclick=()=>{const rush=gangFartNu>.45||spak.mag>.25||platta.mag>.4;startStallning('liggande');if(rush)eyeDur=.32;};
 $('knappKna').onclick=()=>startStallning(stallning==='hukande'?'staende':'hukande');
 $('knappHuka').onclick=()=>startStallning(stallning==='hukande'||stallning==='knastående'?'staende':'hukande');
 $('knappSta').onclick=()=>startStallning('staende');
 $('knappHuk').onclick=()=>startStallning(stallning==='hukande'||stallning==='knastående'?'staende':'hukande');
 $('knappLigg').onclick=()=>startStallning('liggande');
 let vy=localStorage.getItem('gyro_vy_v1')==='bakifran'?'bakifran':'forsta';
 function syncVy(){document.body.dataset.vy=vy;const knapp=$('vyKnapp');if(knapp)knapp.textContent=vy==='bakifran'?'Vy: Bakifrån':'Vy: POV';}
 function sattVy(namn){vy=namn==='bakifran'?'bakifran':'forsta';try{localStorage.setItem('gyro_vy_v1',vy);}catch{}syncVy();}
 $('vyKnapp').onclick=()=>sattVy(vy==='bakifran'?'forsta':'bakifran');syncVy();
 const ZOOMS=[2.5,4,6];
 $('zoomKnapp').onclick=()=>{const nu=styr.varden.kikare.zoom||4;const nasta=ZOOMS[(ZOOMS.indexOf(nu)+1)%ZOOMS.length]||4;styr.satt('kikare.zoom',nasta);settings.forstoringNiva=nasta;if($('forstoringNiva'))$('forstoringNiva').value=String(nasta);syncPoseUi();};
 $('montera').onclick=()=>{monterad=!monterad;$('montera').textContent=monterad?'Lossa':'Montera';};
 function loop(now){requestAnimationFrame(loop);if(now-renderTick<renderInterval-.5)return;renderTick=now-((now-renderTick)%renderInterval);const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(document.hidden)return;
  const raise=updatePose(dt);updateHead(dt);updateBob(dt);updateRifle(dt);updateHasty(dt);updateSettle(dt);
  mataGestKo(dt);
  const basKans=styr.varden.sikte.ytterst?styr.varden.sikte.kanslighet*4:styr.varden.sikte.kanslighet;
  settings.kanslighet=scopeAmt>.45?basKans*(styr.varden.kikare.kanslighet??.4):basKans;
  const aimBas=gyro.update(dt);
  stallningSteg(dt);
  const aimQ=styrSteg(dt,aimBas);
  senasteDt=dt;
  uppdateraSkak(dt);
  const rr=graderPerSekund(gyro.values.rotationRate,gyro.skarmVinkel());
  const vinkelFart=Math.hypot(gyro.values.pitchNedDps||0,gyro.values.vridHogerDps||0);
  const oj=lager.skak.steg(Math.max(Math.hypot(rr.pitch,rr.yaw,rr.roll),vinkelFart)*Math.PI/180,dt,gyroMeny.varden);
  if(oj.ny)styrTick.tick();
  const hoppNu=lager.hopp(dt);
  player.quaternion.setFromAxisAngle(Y_AXEL,kropp);
  sightQuat.copy(aimQ).multiply(breathQuat);aimRig.quaternion.copy(sightQuat);
  const firing=holding&&!!weapons[selected].automat;updateClimb(dt,firing);applyWeaponTransform(raise);
  const kick=rekylUpp()*.22;kickEuler.set(kick,0,0,'YXZ');kickQuat.setFromEuler(kickEuler);
  camera.quaternion.copy(player.quaternion).multiply(aimRig.quaternion).multiply(headQuat);if(kick!==0)camera.quaternion.multiply(kickQuat);
  const a=gyro.values.acc;const freshMotion=now-gyro.lastMotion<500;
  const clamp=v=>THREE.MathUtils.clamp(v,-cfg.styrning.acc_max,cfg.styrning.acc_max);
  const accN=Math.hypot(a.x,a.y,a.z);
  const sway=settings.brytare.acceleration&&freshMotion&&accN>.8?cfg.styrning.acc_sväng:0;
  if(sway){motion.set(clamp(a.y)*sway,clamp(a.x)*sway,clamp(a.z)*sway,'YXZ');camera.quaternion.multiply(recoilQuat.setFromEuler(motion));}
  if(oj.amp>0&&!vapenStilla){const tt=now/1000;motion.set(Math.sin(tt*18.5)*oj.amp,Math.sin(tt*14.2+1.1)*oj.amp,Math.sin(tt*21+.4)*oj.amp*.65,'YXZ');camera.quaternion.multiply(recoilQuat.setFromEuler(motion));}
  camera.position.set(player.position.x+clamp(a.x)*sway,eyeY+hoppNu+clamp(a.y)*sway+bobY*.22,player.position.z+clamp(a.z)*sway);
  if(vy==='bakifran'){
   jag.visible=true;jag.rotation.x=0;
   const axel=poseSteg>=2?1:poseSteg===1?.55:0;
   const gar=stallning==='staende'&&gangFartNu>.4;
   if(gangFartNu>.25&&stallning!=='liggande')stegFas+=dt*(3.2+gangFartNu*1.4);
   jag.position.y=0;
   if(gar){jagAction.paused=false;jagAction.timeScale=THREE.MathUtils.clamp(gangFartNu/3.1,.55,1.45);jagMixer.update(dt);benpose.ram(stallning,axel);}
   else{jagAction.paused=true;benpose.kropp(stallning,axel,dt,gangFartNu>.25&&stallning!=='liggande'?stegFas:0);}
   jag.updateWorldMatrix(true,true);
   const markNamn=stallning==='liggande'?['pelvis','thigh_l','thigh_r','calf_l','calf_r']:stallning==='knastående'?['foot_l','ball_l','calf_r','foot_r','ball_r']:['foot_l','foot_r','ball_l','ball_r'];
   let lagst=Infinity;
   for(const namn of markNamn){const n=jag.getObjectByName(namn);if(!n)continue;n.getWorldPosition(tmp);if(tmp.y<lagst)lagst=tmp.y;}
   if(Number.isFinite(lagst))jag.position.y-=lagst;
   jag.updateWorldMatrix(true,true);
   benpose.mal(stallning,axel);
   const fatt=placeraVapenBak();
   if(fatt)benpose.hamta(fatt.grepp,fatt.stod,dt,gar);
   jag.updateWorldMatrix(true,true);
   jag.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.update();});
   const dist=stallning==='liggande'?4.2:2.8,hojd=stallning==='liggande'?1.15:stallning==='hukande'||stallning==='knastående'?1.15:1.62;
   const vinkel=kropp;
   camera.position.set(player.position.x+Math.sin(vinkel)*dist,hojd+hoppNu,player.position.z+Math.cos(vinkel)*dist);
   _aim.set(player.position.x,stallning==='liggande'?.32:(stallning==='hukande'||stallning==='knastående')?.72:1.05,player.position.z);
   camera.up.set(0,1,0);camera.lookAt(_aim);
   if(Math.abs(camera.fov-cfg.kamera.fov)>.05){camera.fov=cfg.kamera.fov;camera.updateProjectionMatrix();}
  }else jag.visible=false;
  sun.position.set(player.position.x-16,30,player.position.z+12);sun.target.position.set(player.position.x,0,player.position.z-16);sun.target.updateMatrixWorld();
  flash*=Math.exp(-dt/(flashDuration||.075));if(flash<.001)flash=0;$('shotFlash').style.opacity=String(Math.min(.85,flash));muzzleLight.intensity=lightPeak*flash;muzzleFlash.material.opacity=Math.min(.9,flash*2);muzzleFlash.rotation.z=shots*2.4;
  const enemy=targets[0];enemy.root.visible=settings.brytare.fiender;
  if(started&&settings.brytare.fiender){if(enemy.alive){mixer.update(dt);enemy.root.position.z+=cfg.fiende.fart_ms*dt;if(enemy.root.position.z>-cfg.fiende.nara_m)respawn();}else{deadFor+=dt;enemy.root.rotation.x=-Math.min(1,deadFor/cfg.fiende.fall_s)*Math.PI/2;if(deadFor>cfg.fiende.aterkomst_s)respawn();}}
  watchTrigger();
  if(holding&&started&&weapons[selected].automat&&canAim()&&!document.hidden&&now>=nextAuto){const w={...weapons[selected]};shoot(w,{hasty:shakyBurst});nextAuto=(nextAuto&&now-nextAuto<w.intervall_ms?nextAuto:now)+w.intervall_ms;}
  while(queue.length&&queue[0].at<=now){const shot=queue.shift();if(shot.token===burstToken)shoot(shot.weapon,{hasty:shot.hasty});}
  scene.updateMatrixWorld(true);
  for(const lod of lodObjects){const distance=camera.position.distanceTo(lod.position),width=cfg.lod.overgang_m;lod.levels.forEach((level,i)=>{let weight=i===0?1:THREE.MathUtils.smoothstep(distance,level.distance-width/2,level.distance+width/2);if(i<lod.levels.length-1){const next=lod.levels[i+1].distance;weight*=1-THREE.MathUtils.smoothstep(distance,next-width/2,next+width/2);}if(!settings.brytare.lod)weight=i===0?1:0;level.object.visible=weight>.001;for(const material of lod.userData.levelMaterials[i])material.opacity=weight;});}
  for(const target of targets){if(target.kind==='soldat'&&!settings.brytare.fiender)continue;target.root.visible=true;if(settings.brytare.occlusion){occBox.setFromObject(target.hitbox);const c=occBox.getCenter(occPts[0]);occPts[1].set(occBox.min.x,occBox.min.y,c.z);occPts[2].set(occBox.max.x,occBox.min.y,c.z);occPts[3].set(occBox.min.x,occBox.max.y,c.z);occPts[4].set(occBox.max.x,occBox.max.y,c.z);let blocked=0;for(const p of occPts){tmp.copy(p).sub(camera.position);const dist=tmp.length();occlusionRay.set(camera.position,tmp.normalize());occlusionRay.far=dist-.1;if(occlusionRay.intersectObjects(occluders,true).length)blocked++;}if(blocked===occPts.length)target.root.visible=false;}}
  fx.uppdatera(dt);updateCasings(dt);
  const target=canAim()?targetUnderCrosshair():null;
  muzzleObj.getWorldDirection(direction);let nearest=180;
  for(const t of targets){if(!t.alive||(t.kind==='soldat'&&!settings.brytare.fiender))continue;t.hitbox.getWorldPosition(point);tmp.copy(point).sub(_muzzle).normalize();nearest=Math.min(nearest,THREE.MathUtils.radToDeg(direction.angleTo(tmp)));}
  const closeness=1-THREE.MathUtils.clamp(nearest/cfg.sikte.ring_vinkel_grad,0,1);const ringSize=THREE.MathUtils.lerp(cfg.sikte.ring_max_px,cfg.sikte.ring_min_px,closeness);$('ring').style.width=$('ring').style.height=ringSize+'px';$('ring').style.opacity=String(1-closeness*.75);$('aim').style.color=target?'#ff7463':'#eff4d5';$('hit').style.opacity=now<hitUntil?'1':'0';if(!$('reload').hidden){const laddar=now<cooldown;$('reload').textContent=laddar?(weapons[selected].id==='gevar'?'REPETERAR':'LADDAR'):'REDO';if(laddar)repeterade=true;else if(repeterade){repeterade=false;haptics.puls(.22);}}
  if($('skottInfo')&&now>skottVisasTill)$('skottInfo').hidden=true;
  placeSights();
  const mat=$('matvarden');if(mat){const visa=!!gyroMeny.varden.matvarden;if(mat.hidden!==!visa)mat.hidden=!visa;if(visa){const d=180/Math.PI,r=gyro.values.rotationRate||{};mat.textContent=`pitch ${(gyro.vinklar.pitch*d).toFixed(1)}°   yaw ${(gyro.vinklar.yaw*d).toFixed(1)}°   roll ${(gyro.vinklar.roll*d).toFixed(1)}°\ntipp ${(gyro.values.pitchNedDps||0).toFixed(0)} °/s · vrid ${(gyro.values.vridHogerDps||0).toFixed(0)} °/s\nrot α ${(r.alpha||0).toFixed(0)}  β ${(r.beta||0).toFixed(0)}  γ ${(r.gamma||0).toFixed(0)} °/s`;}}
  const chip=$('chipRikt');if(chip){const yaw=gyro.vinklar.yaw,p=gyro.vinklar.pitch;const t=Math.abs(yaw)<.06&&Math.abs(p)<.06?'Riktning: stilla':`Riktning:${yaw>.06?' höger':yaw<-.06?' vänster':''}${p>.06?' upp':p<-.06?' ner':''}`;if(chip.textContent!==t)chip.textContent=t;}
  renderer.render(scene,camera);frames++;if(now-measureTime>600){fps=Math.round(frames*1000/(now-measureTime));frames=0;measureTime=now;refreshStats();
   const f=n=>n==null?'—':Number(n).toFixed(1);$('debug').textContent=`α ${f(gyro.values.alpha)} β ${f(gyro.values.beta)} γ ${f(gyro.values.gamma)}\nacc ${f(a.x)} ${f(a.y)} ${f(a.z)} m/s²\nrot ${Object.values(gyro.values.rotationRate).map(f).join(' ')} °/s\ntipp ${f(gyro.values.pitchNedDps)} · vrid ${f(gyro.values.vridHogerDps)} °/s · ${STALLNING_NAMN[stallning]}\nsensor ${f(gyro.values.interval)} ms · tex ${renderer.info.memory.textures} · JS ${performance.memory?(performance.memory.usedJSHeapSize/1048576).toFixed(1)+' MB':'saknas'}\n${gyro.active&&gyro.received?'gyro aktivt':'finger/ingen sensordata'}`;
   if(started&&gyro.active&&$('styrPanel').hidden){if(gyro.received&&now-gyro.lastEvent<1500)$('status').textContent='Gyro aktivt. Centrera i menyn om riktningen driver.';else $('status').textContent='Ingen färsk gyrosignal. Dra längst ner för att sikta.';}
  }
  Object.assign(snapshot,{fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,shots,hits,recoil:rifleP+climbP,shake:Math.abs(hastyP),skottkansla:settings.skottkansla,audioVoices:voices.length,enemyZ:enemy.root.position.z,enemyAlive:enemy.alive,animationTime:runAction.time,quaternion:camera.quaternion.toArray(),sensor:structuredClone(gyro.values),sensorSource:gyro.nativeSource?'app':'webb',enemyCount,headYawDeg:head.yaw*180/Math.PI,headPitchDeg:head.pitch*180/Math.PI,pose:raiseValue(),poseTarget:poseTo,weaponId:weapons[selected].id,casingAlive,clinks,clinkReady,rendered:true,aimNdcX,aimNdcY,breechNdcY,muzzleNdcY,breechWY,muzzleWY,muzzleWZ,playerX:player.position.x,playerZ:player.position.z,stallning,eyeY,diveTipp:detektor.visning().tipp,diveVrid:detektor.visning().vrid});
 }
 requestAnimationFrame(loop);
}
