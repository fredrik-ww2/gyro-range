import * as THREE from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
import {GyroAim} from './gyro.js';
import {createHaptics} from './haptics.js';
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
 settings.skottkansla=Number.isFinite(Number(settings.skottkansla))?THREE.MathUtils.clamp(Number(settings.skottkansla),0,2):1;
 const hapticStyles=structuredClone(hapticDefaults);
 for(const k of Object.keys(hapticStyles)){const s=saved.haptik?.[k];if(s){hapticStyles[k].styrka=THREE.MathUtils.clamp(Number(s.styrka)||0,0,1);hapticStyles[k].varaktighet_ms=THREE.MathUtils.clamp(Number(s.varaktighet_ms)||12,1,100);}}
 function save(){try{const {brytare,hapticStyle,...styrning}=settings;localStorage.setItem('gyro_faltprov_v1',JSON.stringify({styrning,brytare,hapticStyle,haptik:hapticStyles,debug:$('showDebug').checked}));}catch{}}
 const renderer=new THREE.WebGLRenderer({canvas:$('spel'),antialias:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,cfg.kamera.pixelRatio_max));renderer.shadowMap.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const scene=new THREE.Scene();scene.background=new THREE.Color(cfg.miljo.himmel_farg);scene.fog=new THREE.Fog(cfg.miljo.himmel_farg,cfg.miljo.dimma_near,cfg.miljo.dimma_far);
 const camera=new THREE.PerspectiveCamera(cfg.kamera.fov,1,cfg.kamera.near_m,cfg.kamera.far_m);camera.position.set(0,cfg.kamera.hojd_m,0);scene.add(camera);
 const player=new THREE.Group();scene.add(player);
 scene.add(new THREE.HemisphereLight(0xe5efff,0x4a4c2e,2.5));const sun=new THREE.DirectionalLight(0xffefd5,3);sun.position.set(-30,60,20);scene.add(sun);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(cfg.miljo.mark_m,cfg.miljo.mark_m),new THREE.MeshStandardMaterial({color:cfg.miljo.mark_farg,roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);
 const path=new THREE.Mesh(new THREE.PlaneGeometry(4,140),new THREE.MeshStandardMaterial({color:0x777365,roughness:1}));path.rotation.x=-Math.PI/2;path.position.set(0,.008,-60);scene.add(path);
 const gyro=new GyroAim($('spel'),settings,cfg.styrning),haptics=createHaptics(hapticStyles,settings);
 const loader=new GLTFLoader();const glb=p=>loader.loadAsync(new URL('../'+p,import.meta.url).href);
 const assetPromises=[cfg.fiende.modell,cfg.fiende.animation,'assets/modeller/tiger_lod1.glb','assets/modeller/tiger_lod2.glb','assets/modeller/tiger_bb.glb','assets/modeller/hus_lod1.glb','assets/modeller/hus_lod2.glb','assets/modeller/hus_bb.glb'].map(glb);
 const [soldier,run,...models]=await Promise.all(assetPromises);
 const atlas=await new THREE.TextureLoader().loadAsync(new URL('../assets/effekter/fx_atlas_v2d.png',import.meta.url).href);atlas.colorSpace=THREE.SRGBColorSpace;
 const fx=skapaEffekterV2d(THREE,scene,{atlas,kamera:camera,renderer,kvalitet:cfg.effekter.kvalitet,maxPartiklar:cfg.effekter.pool,ljus:cfg.effekter.ljus,markY:0,markHojd:()=>0});
 function prepare(root){root.traverse(n=>{if(n.isMesh){n.frustumCulled=true;for(const m of(Array.isArray(n.material)?n.material:[n.material])){m.roughness=Math.max(m.roughness??1,.7);}}});return root;}
 const rawBounds={};
 const soldierWrap=new THREE.Group();const soldierVisual=prepare(soldier.scene);soldierWrap.add(soldierVisual);scene.add(soldierWrap);
 scene.updateMatrixWorld(true);soldierVisual.traverse(n=>{if(n.isSkinnedMesh){n.computeBoundingBox();n.computeBoundingSphere();}});const box=new THREE.Box3().setFromObject(soldierVisual),height=box.max.y-box.min.y;rawBounds.soldat=box.getSize(new THREE.Vector3()).toArray();const soldierScale=cfg.fiende.hojd_m/height;soldierVisual.scale.multiplyScalar(soldierScale);soldierVisual.position.y-=box.min.y*soldierScale;soldierVisual.rotation.y=cfg.fiende.rotation_y;
 const mixer=new THREE.AnimationMixer(soldierVisual);const clip=run.animations.find(a=>a.name===cfg.fiende.klipp);
 if(!clip)throw Error('Springklippet saknas');
 const inPlace=clip.clone();for(const track of inPlace.tracks){if(/^(root|pelvis)\.position$/.test(track.name)){for(let i=0;i<track.values.length;i+=3){track.values[i]=track.values[0];track.values[i+2]=track.values[2];}}}
 const runAction=mixer.clipAction(inPlace).play();
 let clipMatches=0;for(const track of inPlace.tracks){const name=THREE.PropertyBinding.parseTrackName(track.name).nodeName;if(soldierVisual.getObjectByName(name))clipMatches++;}
 const hitbox=new THREE.Mesh(new THREE.CapsuleGeometry(cfg.fiende.traffvolym.radie_m,cfg.fiende.traffvolym.langd_m,4,6),new THREE.MeshBasicMaterial({visible:false}));hitbox.position.y=cfg.fiende.traffvolym.centrum_y;soldierWrap.add(hitbox);
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
 for(const pos of cfg.miljo.tanks){const root=addLOD(models.slice(0,3),pos,pos.rotation,cfg.lod.tiger_m,cfg.miljo.tiger_langd_m);root.updateWorldMatrix(true,true);const b=new THREE.Box3().setFromObject(root.levels[0].object);rawBounds.tiger=b.getSize(new THREE.Vector3()).toArray();const hb=new THREE.Mesh(new THREE.BoxGeometry(...rawBounds.tiger),new THREE.MeshBasicMaterial({visible:false}));hb.position.copy(b.getCenter(new THREE.Vector3()));scene.add(hb);targets.push({kind:'tiger',root,hitbox:hb,alive:true,hp:cfg.miljo.tiger_hp});}
 for(const pos of cfg.miljo.hus){const root=addLOD(models.slice(3,6),pos,pos.rotation,cfg.lod.hus_m,cfg.miljo.hus_hojd_m,true);occluders.push(root.levels[0].object);}
 const ray=new THREE.Raycaster(),occlusionRay=new THREE.Raycaster(),zero=new THREE.Vector2();
 const direction=new THREE.Vector3(),point=new THREE.Vector3(),tmp=new THREE.Vector3(),motion=new THREE.Euler(),recoilQuat=new THREE.Quaternion();
 const _muzzle=new THREE.Vector3(),_dir=new THREE.Vector3(),_aim=new THREE.Vector3(),_fwd=new THREE.Vector3(),_right=new THREE.Vector3(),_up=new THREE.Vector3(),_q=new THREE.Quaternion(),_spin=new THREE.Quaternion();
 const recoilEuler=new THREE.Euler(0,0,0,'YXZ'),recoilQ=new THREE.Quaternion(),headEuler=new THREE.Euler(0,0,0,'YXZ'),headQuat=new THREE.Quaternion(),kickEuler=new THREE.Euler(0,0,0,'YXZ'),kickQuat=new THREE.Quaternion();
 const occBox=new THREE.Box3(),occPts=Array.from({length:5},()=>new THREE.Vector3());
 let renderTick=performance.now();const renderInterval=1000/cfg.kamera.mal_hz;
 let started=false,selected=0,shots=0,hits=0,cooldown=0,deadFor=0,hitUntil=0,queue=[],last=performance.now(),frames=0,fps=0,measureTime=last,enemyCount=0,burstToken=0;
 let audio=null,voices=[],audioBuffer=null,audioBus=null,clinkBuffer=null;const fileBuffers={},fileLoading={};let holding=false,nextAuto=0;
 let casingAlive=0,clinks=0,clinkReady=0,clinkVoices=0,aimNdcX=0,aimNdcY=0,breechNdcY=0,muzzleNdcY=0,breechWY=0,muzzleWY=0,muzzleWZ=0;
 function loadWeaponSounds(){for(const w of weapons){if(!w.ljudfil||fileLoading[w.id])continue;fileLoading[w.id]=fetch(new URL('../'+w.ljudfil,import.meta.url)).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}).then(b=>new Promise((ok,no)=>audio.decodeAudioData(b,ok,no))).then(buf=>{fileBuffers[w.id]=buf;}).catch(()=>{fileLoading[w.id]=null;});}}
 const muzzleLight=new THREE.PointLight(0xffd690,0,6,2);
 const muzzleFlash=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffe7a0,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
 let flash=0,flashDuration=.075,lightPeak=0;const modelLoadMs=Math.round(performance.now()-t0);

 // Vapnet sitter på kroppen. Kameran lägger huvudvridningen ovanpå, så pipan kan lämna bilden.
 const weaponPivot=new THREE.Group();player.add(weaponPivot);
 const steel=new THREE.MeshStandardMaterial({color:0x6a7264,metalness:.45,roughness:.4});
 const brass=new THREE.MeshStandardMaterial({color:0xf0c96a,metalness:.7,roughness:.24});
 const breech=new THREE.Vector3(0,1.48,-.18);
 const muzzlePos=new THREE.Vector3(0,1.47,-.92);
 const barrelLen=breech.distanceTo(muzzlePos);
 weaponPivot.position.copy(breech);
 const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.012,.028,barrelLen,24,1),steel);
 barrel.rotation.x=Math.PI/2;barrel.position.set(0,0,barrelLen/2);weaponPivot.add(barrel);
 const muzzleObj=new THREE.Object3D();muzzleObj.position.set(0,0,barrelLen+.01);weaponPivot.add(muzzleObj);
 muzzleObj.add(muzzleLight);muzzleLight.position.set(0,0,-.02);
 muzzleObj.add(muzzleFlash);muzzleFlash.position.set(0,0,-.03);
 const ejectPort=new THREE.Object3D();ejectPort.position.set(.02,.008,.08);weaponPivot.add(ejectPort);
 const belt=new THREE.Group();
 const beltMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.005,.005,.028,6),brass,16);
 beltMesh.frustumCulled=false;const beltDummy=new THREE.Object3D();
 for(let i=0;i<16;i++){const t=i/15;beltDummy.position.set(.042+t*.004,-.016-t*.006,.32+t*.28);beltDummy.rotation.set(1.15,.1,Math.PI/2);beltDummy.updateMatrix();beltMesh.setMatrixAt(i,beltDummy.matrix);}
 beltMesh.instanceMatrix.needsUpdate=true;belt.add(beltMesh);
 const cloth=new THREE.Mesh(new THREE.BoxGeometry(.006,.003,.18),new THREE.MeshStandardMaterial({color:0x6b5832,roughness:.88,metalness:.06}));
 cloth.position.set(.046,-.022,.46);belt.add(cloth);weaponPivot.add(belt);belt.visible=false;
 weaponPivot.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});
 scene.updateMatrixWorld(true);weaponPivot.lookAt(muzzlePos);
 const aimQuat=weaponPivot.quaternion.clone();
 const lowQuat=aimQuat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.55));
 const basePivot=weaponPivot.position.clone();
 const CASING_POOL=24;
 const casingsMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.0042,.0042,.016,6),brass,CASING_POOL);
 casingsMesh.frustumCulled=false;casingsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(casingsMesh);
 const casingDummy=new THREE.Object3D();
 const casingState=Array.from({length:CASING_POOL},()=>{const s={alive:false,age:0,p:new THREE.Vector3(),v:new THREE.Vector3(),axis:new THREE.Vector3(1,0,0),q:new THREE.Quaternion(),spin:0,landed:false,clinked:false,clinkAt:0,extra:0,pitch:1};casingDummy.scale.setScalar(0);casingDummy.updateMatrix();return s;});
 casingDummy.scale.setScalar(0);casingDummy.updateMatrix();for(let i=0;i<CASING_POOL;i++)casingsMesh.setMatrixAt(i,casingDummy.matrix);
 casingsMesh.instanceMatrix.needsUpdate=true;let casingCursor=0;

 let poseFrom=1,poseTo=1,poseT=.62,poseDur=.62,settleT=null,settleArmed=false,settleX=0,settleZ=0;
 let rifle=null,rifleP=0,climb=0,climbBack=null,climbP=0,hastyT=null,hastyAmp=0,hastyP=0;
 let bobAmp=0,bobPhase=0,bobFade=0,bobStop=null,bobHold=0,bobY=0,bobPitch=0,bobRoll=0;
 const motionState={speed:0,run:0,until:0};
 const head={yaw:0,pitch:0,targetYaw:0,targetPitch:0,holding:false,release:null};
 let lookPtr=null,stepPtr=null,nextLeg=null,stick=null,stickTravel=0,trigger=null,shakyBurst=true,suppressShot=false;

 function raiseValue(){const u=poseDur<=0?1:Math.min(1,poseT/poseDur);const s=u*u*(3-2*u);return poseFrom+(poseTo-poseFrom)*s;}
 function canAim(){return started&&poseTo===1&&raiseValue()>.92;}
 function syncPoseUi(){
  const low=poseTo<.5;
  document.body.dataset.pose=low?'sankt':'framme';
  $('weaponPose').textContent=low?'Ta upp vapen':'Sänk vapen';
  $('weaponPose').setAttribute('aria-pressed',String(!low));
  $('trigger').setAttribute('aria-label',low?'Styrspak':'Skjut');
  $('fireLabel').textContent=low?'GÅ':'SKJUT';
  $('reload').hidden=low;
  $('fireWrap').classList.toggle('stick',low);
  if(!low)$('fire').style.transform='';
 }
 function setPose(raised){
  const nowRaise=raiseValue();
  if(raised&&poseTo===1&&nowRaise>.999)return;
  if(!raised&&poseTo===0&&nowRaise<.001)return;
  poseFrom=nowRaise;poseTo=raised?1:0;poseT=0;poseDur=.62;
  settleArmed=raised&&nowRaise<.95;
  if(!raised){settleT=null;settleArmed=false;settleX=settleZ=0;stopHold();trigger=null;updateRing(0);endStick();}
  syncPoseUi();
 }
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
  hastyT+=dt;const u=hastyT/.3;
  if(u>=1){hastyT=null;hastyP=0;return;}
  hastyP=Math.sin(hastyT*46)*hastyAmp*Math.sin(u*Math.PI);
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
  headEuler.set(-head.pitch,-head.yaw,0,'YXZ');headQuat.setFromEuler(headEuler);
 }
 function applyWeaponTransform(raise){
  const up=rifleP+climbP+hastyP+settleX+bobPitch,roll=settleZ+bobRoll;
  weaponPivot.position.set(basePivot.x,basePivot.y+(1-raise)*.06+bobY,basePivot.z-(1-raise)*.4);
  if(raise>.999&&up===0&&roll===0){weaponPivot.quaternion.copy(aimQuat);return;}
  weaponPivot.quaternion.copy(lowQuat).slerp(aimQuat,raise);
  if(up!==0||roll!==0){recoilEuler.set(-up,0,roll,'YXZ');weaponPivot.quaternion.multiply(recoilQ.setFromEuler(recoilEuler));}
 }
 function moveBody(forwardM,strafeM){
  _fwd.set(0,0,-1).applyQuaternion(player.quaternion);_fwd.y=0;if(_fwd.lengthSq()<1e-8)_fwd.set(0,0,-1);else _fwd.normalize();
  _right.set(1,0,0).applyQuaternion(player.quaternion);_right.y=0;if(_right.lengthSq()<1e-8)_right.set(1,0,0);else _right.normalize();
  player.position.addScaledVector(_fwd,forwardM);player.position.addScaledVector(_right,strafeM);
  player.position.x=THREE.MathUtils.clamp(player.position.x,-36,36);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-110,6);
 }
 function endStick(){if(!stick)return;stick=null;$('fire').style.transform='';$('fireWrap').classList.remove('pulling');}
 function applyStick(dt){
  if(!stick)return;
  const maxR=70,mag=Math.hypot(stick.sx,stick.sy),def=Math.min(1,mag/maxR);
  if(def<.08)return;
  const nx=stick.sx/maxR,ny=stick.sy/maxR,run=def>.72?(def-.72)/.28:0,speed=def*(1.45+run*3.3);
  moveBody(-ny*speed*dt,nx*speed*dt);noteMotion(speed,run);
  stickTravel+=speed*dt;const stride=run>.45?.95:.62;
  if(stickTravel>=stride){stickTravel-=stride;haptics.step();}
 }
 function updateRing(pull){
  $('pullRing').firstElementChild.style.strokeDashoffset=String(289.03*(1-THREE.MathUtils.clamp(pull,0,1)));
  $('fireWrap').classList.toggle('pulling',pull>.02&&poseTo>.5);
 }
 function updateLegHint(){
  $('arrowLeft').classList.toggle('redo',nextLeg===null||nextLeg==='left');
  $('arrowRight').classList.toggle('redo',nextLeg===null||nextLeg==='right');
 }
 function spawnCasing(){
  const s=casingState[casingCursor];if(s.alive)casingAlive=Math.max(0,casingAlive-1);
  casingCursor=(casingCursor+1)%CASING_POOL;
  ejectPort.getWorldPosition(s.p);weaponPivot.getWorldQuaternion(_q);
  _right.set(1,0,0).applyQuaternion(_q);_up.set(0,1,0);_fwd.set(0,0,1).applyQuaternion(_q);
  s.v.copy(_right).multiplyScalar(1.7+Math.random()*1.2).addScaledVector(_up,1.2+Math.random()).addScaledVector(_fwd,.2+Math.random()*.45);
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
 function targetUnderCrosshair(spread){
  scene.updateMatrixWorld(true);
  muzzleObj.getWorldPosition(_muzzle);muzzleObj.getWorldDirection(_dir);
  if(spread){_dir.x+=spread.x;_dir.y+=spread.y;_dir.normalize();}
  ray.set(_muzzle,_dir);
  const list=[...occluders,...targets.filter(t=>t.alive&&(t.kind!=='soldat'||settings.brytare.fiender)).map(t=>t.hitbox)];
  const collision=ray.intersectObjects(list,true)[0];if(!collision)return null;return targets.find(t=>t.hitbox===collision.object)||null;
 }
 function shoot(weapon,opts={}){
  const hasty=!!opts.hasty;
  shots++;shotSound(weapon);haptics.shot(weapon.haptik,weapon.id);
  const spread=hasty?{x:(Math.random()-.5)*.034,y:(Math.random()-.5)*.034}:null;
  const target=targetUnderCrosshair(spread);
  if(target){haptics.hit();hits++;hitUntil=performance.now()+160;if(settings.brytare.skada){target.hp--;if(target.hp<=0){target.alive=false;if(target.kind==='soldat'){runAction.stop();deadFor=.001;}else{target.root.traverse(n=>{if(n.isMesh&&n.material?.color){n.material.color.multiplyScalar(.45);}});}}}}
  if(settings.brytare.effekter){muzzleObj.getWorldDirection(direction);muzzleObj.getWorldPosition(_muzzle);fx.spela('mynningsflamma',{pos:_muzzle.clone(),riktning:direction.clone(),kaliber_mm:weapon.kaliber_mm,mynningsbroms:false});}
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
  void unlockAudio();const weapon={...weapons[selected]};cooldown=now+weapon.omladdning_ms;const token=++burstToken;const hasty=!opts.precise;
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
 $('trigger').addEventListener('click',e=>{if(!canAim()){e.preventDefault();return;}if(!fire())e.preventDefault();if(!settings.brytare.haptik||window.ReactNativeWebView)e.preventDefault();});
 $('trigger').addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!canAim())return;if(weapons[selected].automat)beginAuto(true);else fire({hasty:true});}});
 $('trigger').addEventListener('pointerdown',e=>{
  if(!started||(e.button&&e.button!==0))return;
  if(poseTo<.5){e.preventDefault();stick={id:e.pointerId,x:e.clientX,y:e.clientY,sx:0,sy:0};try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}return;}
  if(weapons[selected].automat)e.preventDefault();
  trigger={id:e.pointerId,y:e.clientY,t:performance.now(),pull:0,shot:false,pulling:false};
  try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}
 });
 $('trigger').addEventListener('pointermove',e=>{
  if(stick&&e.pointerId===stick.id){const dx=e.clientX-stick.x,dy=e.clientY-stick.y,maxR=70,mag=Math.hypot(dx,dy),scale=mag>maxR?maxR/mag:1;stick.sx=dx*scale;stick.sy=dy*scale;$('fire').style.transform=`translate(${stick.sx}px,${stick.sy}px)`;return;}
  if(!trigger||e.pointerId!==trigger.id||trigger.shot)return;
  const down=Math.max(0,e.clientY-trigger.y);trigger.pull=Math.min(1,down/PULL_PX);if(down>12)trigger.pulling=true;updateRing(trigger.pull);
  if(trigger.pull>=1&&(performance.now()-trigger.t)/1000>=.36&&canAim()){
   trigger.shot=true;updateRing(1);
   if(weapons[selected].automat)beginAuto(false);
   else{fire({precise:true});suppressShot=true;setTimeout(()=>{suppressShot=false;},160);}
  }
 });
 function onTriggerUp(e){
  if(stick&&e.pointerId===stick.id){endStick();return;}
  if(!trigger||e.pointerId!==trigger.id)return;
  const was=trigger;trigger=null;updateRing(0);
  if(!weapons[selected].automat)return;
  if(!was.shot&&canAim())shoot({...weapons[selected]},{hasty:true});
  stopHold();
 }
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('trigger').addEventListener(ev,onTriggerUp);
 $('trigger').addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter')stopHold();});
 addEventListener('blur',()=>{stopHold();trigger=null;endStick();});
 $('fire').addEventListener('click',()=>fire({hasty:true}));
 function applyWeapon(){const w=weapons[selected];$('weapon').textContent=w.namn;document.body.dataset.sikte=w.sikte||'';belt.visible=w.id==='kulspruta';camera.fov=cfg.kamera.fov/(w.zoom||1);camera.updateProjectionMatrix();if(!w.automat)stopHold();}
 $('weapon').onclick=()=>{stopHold();queue=[];trigger=null;updateRing(0);selected=(selected+1)%weapons.length;applyWeapon();};applyWeapon();
 function hideStart(){started=true;$('startPanel').hidden=true;last=performance.now();}
 $('manual').onclick=()=>{gyro.stop();hideStart();void unlockAudio();$('status').textContent='Dra längst ner för att sikta. Dra i mitten för att titta.';};
 $('start').disabled=false;
 $('start').onclick=()=>{const promise=gyro.start();void unlockAudio();hideStart();$('status').textContent='Väntar på sensorer…';promise.then(p=>{$('status').textContent=p.orientation==='granted'?'Gyro tillåtet. Vänta på sensorvärden.':'Gyro nekades eller saknas. Dra längst ner för att sikta.';if(p.motion!=='granted')$('status').textContent+=' Rörelsedata saknas.';}).catch(()=>{$('status').textContent='Sensorerna kunde inte starta. Dra längst ner för att sikta.';});};
 const settingsPanel=$('settings');function showSettings(show){settingsPanel.hidden=!show;$('settingsButton').setAttribute('aria-expanded',String(show));}
 function closeMenu(){$('menu').hidden=true;$('menuBackdrop').hidden=true;$('menuButton').setAttribute('aria-expanded','false');}
 function openMenu(){$('menu').hidden=false;$('menuBackdrop').hidden=false;$('menuButton').setAttribute('aria-expanded','true');refreshStats();}
 $('menuButton').onclick=()=>$('menu').hidden?openMenu():closeMenu();
 $('menuBackdrop').onclick=closeMenu;
 $('settingsButton').onclick=()=>{closeMenu();showSettings(true);};$('closeSettings').onclick=()=>showSettings(false);
 $('weaponPose').onclick=()=>setPose(poseTo<.5);syncPoseUi();
 $('center').onclick=()=>{gyro.center();rifle=null;rifleP=0;climb=0;climbP=0;climbBack=null;hastyT=null;hastyP=0;settleT=null;settleX=settleZ=0;};
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
 document.addEventListener('visibilitychange',()=>{queue=[];holding=false;burstToken++;trigger=null;endStick();endLook();endStep();if(document.hidden){audio?.suspend();navigator.vibrate?.(0);}last=performance.now();});
 const snapshot={targetCenters:targets.map(t=>({kind:t.kind,center:t.hitbox.getWorldPosition(new THREE.Vector3()).toArray()})),ready:true,models:8,clip:clip.name,clipTracks:inPlace.tracks.length,clipMatches,modelLoadMs,rawBounds,modelScale:soldierScale,haptics:haptics.mode,shots:0,hits:0};
 window.gyroDiagnostics=snapshot;
 if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify({type:'bridge-ready',version:1}));haptics.sync();}
 addEventListener('ww2-native-lifecycle',e=>{if(!window.ReactNativeWebView)return;queue=[];holding=false;burstToken++;trigger=null;endStick();last=performance.now();if(!e.detail?.active)audio?.suspend();else gyro.center();});
 $('status').textContent='Skjutbanan är redo.';
 function refreshStats(){
  $('statFps').textContent=fps+' fps';$('statDraws').textContent=String(renderer.info.render.calls);
  $('statTris').textContent=renderer.info.render.triangles.toLocaleString('sv-SE');$('statLoad').textContent=modelLoadMs+' ms';
  $('statHits').textContent=String(hits);$('statShots').textContent=String(shots);
 }
 function gestureKind(x,y){
  const bar=$('topbar').getBoundingClientRect().bottom,h=innerHeight,w=innerWidth;
  if(y<=bar)return 'aim';
  const raised=poseTo>.5&&raiseValue()>.82;
  if(raised&&y<h*.5&&y>bar){if(x<64)return 'left';if(x>w-64)return 'right';}
  if(y>h*.66&&x>72&&x<w-72)return 'aim';
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
  if(kind==='left'||kind==='right'){
   e.stopPropagation();e.preventDefault();
   if(nextLeg&&nextLeg!==kind)return;
   beginStep(kind,e);return;
  }
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
  if(!trigger||trigger.shot||poseTo<.5||!weapons[selected].automat||trigger.pulling)return;
  if(performance.now()-trigger.t>90&&canAim()){trigger.shot=true;beginAuto(true);}
 }
 function placeSights(){
  if(poseTo<.5||raiseValue()<.45){$('aim').style.opacity='0';return;}
  muzzleObj.getWorldPosition(_muzzle);muzzleObj.getWorldDirection(_dir);
  _aim.copy(_muzzle).addScaledVector(_dir,50);_aim.project(camera);
  aimNdcX=_aim.x;aimNdcY=_aim.y;
  if(_aim.z>1||Math.abs(_aim.x)>1.2||Math.abs(_aim.y)>1.2){$('aim').style.opacity='0';return;}
  const jitter=hastyP*900,dx=_aim.x*.5*innerWidth+jitter,dy=-_aim.y*.5*innerHeight-jitter*.4,tr=`translate(${dx}px,${dy}px)`;
  $('aim').style.transform=tr;$('aim').style.opacity='';$('scope').style.transform=tr;$('irons').style.transform=`${tr} scale(.62)`;
  weaponPivot.getWorldPosition(point);breechWY=point.y;point.project(camera);breechNdcY=point.y;
  muzzleObj.getWorldPosition(tmp);muzzleWY=tmp.y;muzzleWZ=tmp.z;tmp.project(camera);muzzleNdcY=tmp.y;
 }
 function loop(now){requestAnimationFrame(loop);if(now-renderTick<renderInterval-.5)return;renderTick=now-((now-renderTick)%renderInterval);const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(document.hidden)return;
  const raise=updatePose(dt);updateHead(dt);updateBob(dt);updateRifle(dt);updateHasty(dt);updateSettle(dt);
  player.quaternion.copy(gyro.update(dt));
  const firing=holding&&!!weapons[selected].automat;updateClimb(dt,firing);applyStick(dt);applyWeaponTransform(raise);
  const kick=(rifleP+climbP)*.22;kickEuler.set(-kick,0,0,'YXZ');kickQuat.setFromEuler(kickEuler);
  camera.quaternion.copy(player.quaternion).multiply(headQuat);if(kick!==0)camera.quaternion.multiply(kickQuat);
  const a=gyro.values.acc;const freshMotion=now-gyro.lastMotion<500;
  const clamp=v=>THREE.MathUtils.clamp(v,-cfg.styrning.acc_max,cfg.styrning.acc_max);
  const sway=settings.brytare.acceleration&&freshMotion?cfg.styrning.acc_sväng:0;
  if(sway){motion.set(clamp(a.y)*sway,clamp(a.x)*sway,clamp(a.z)*sway,'YXZ');camera.quaternion.multiply(recoilQuat.setFromEuler(motion));}
  camera.position.set(player.position.x+clamp(a.x)*sway,cfg.kamera.hojd_m+clamp(a.y)*sway+bobY*.22,player.position.z+clamp(a.z)*sway);
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
  const closeness=1-THREE.MathUtils.clamp(nearest/cfg.sikte.ring_vinkel_grad,0,1);const ringSize=THREE.MathUtils.lerp(cfg.sikte.ring_max_px,cfg.sikte.ring_min_px,closeness);$('ring').style.width=$('ring').style.height=ringSize+'px';$('ring').style.opacity=String(1-closeness*.75);$('aim').style.color=target?'#ff7463':'#eff4d5';$('hit').style.opacity=now<hitUntil?'1':'0';if(!$('reload').hidden)$('reload').textContent=now<cooldown?'LADDAR':'REDO';
  placeSights();
  renderer.render(scene,camera);frames++;if(now-measureTime>600){fps=Math.round(frames*1000/(now-measureTime));frames=0;measureTime=now;refreshStats();
   const f=n=>n==null?'—':Number(n).toFixed(1);$('debug').textContent=`α ${f(gyro.values.alpha)} β ${f(gyro.values.beta)} γ ${f(gyro.values.gamma)}\nacc ${f(a.x)} ${f(a.y)} ${f(a.z)} m/s²\nrot ${Object.values(gyro.values.rotationRate).map(f).join(' ')} °/s\nsensor ${f(gyro.values.interval)} ms · tex ${renderer.info.memory.textures} · JS ${performance.memory?(performance.memory.usedJSHeapSize/1048576).toFixed(1)+' MB':'saknas'}\n${gyro.active&&gyro.received?'gyro aktivt':'finger/ingen sensordata'}`;
   if(started&&gyro.active){if(gyro.received&&now-gyro.lastEvent<1500)$('status').textContent='Gyro aktivt. Centrera i menyn om riktningen driver.';else $('status').textContent='Ingen färsk gyrosignal. Dra längst ner för att sikta.';}
  }
  Object.assign(snapshot,{fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,shots,hits,recoil:rifleP+climbP,shake:Math.abs(hastyP),skottkansla:settings.skottkansla,audioVoices:voices.length,enemyZ:enemy.root.position.z,enemyAlive:enemy.alive,animationTime:runAction.time,quaternion:camera.quaternion.toArray(),sensor:structuredClone(gyro.values),sensorSource:gyro.nativeSource?'app':'webb',enemyCount,headYawDeg:head.yaw*180/Math.PI,headPitchDeg:head.pitch*180/Math.PI,pose:raiseValue(),poseTarget:poseTo,weaponId:weapons[selected].id,casingAlive,clinks,clinkReady,rendered:true,aimNdcX,aimNdcY,breechNdcY,muzzleNdcY,breechWY,muzzleWY,muzzleWZ,playerX:player.position.x,playerZ:player.position.z});
 }
 requestAnimationFrame(loop);
}
