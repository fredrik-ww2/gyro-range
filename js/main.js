import * as THREE from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
import {GyroAim} from './gyro.js';
import {createHaptics} from './haptics.js';
import {skapaEffekterV2d} from '../assets/effekter/effekter_v2d.js';
const $=id=>document.getElementById(id);
const loadJSON=async p=>{const r=await fetch(new URL('../data/'+p,import.meta.url));if(!r.ok)throw Error(p+': '+r.status);return r.json();};
const t0=performance.now();
try { await boot(); } catch(e){$('status').textContent='Kunde inte starta: '+e.message;console.error(e);}
async function boot(){
 const [cfg,weapons,hapticDefaults]=await Promise.all(['spel.json','vapen.json','haptik.json'].map(loadJSON));
 let saved={};try{saved=JSON.parse(localStorage.getItem('gyro_faltprov_v1')||'{}');}catch{}
 const settings={...cfg.styrning,...saved.styrning,brytare:{...cfg.brytare,...saved.brytare},hapticStyle:saved.hapticStyle||'auto'};
 // Validera sparade siffror; blockerad lagring ska aldrig hindra spelet.
 settings.kanslighet=THREE.MathUtils.clamp(Number(settings.kanslighet)||1,.25,3);
 settings.skottkansla=Number.isFinite(Number(settings.skottkansla))?THREE.MathUtils.clamp(Number(settings.skottkansla),0,2):1;
 const hapticStyles=structuredClone(hapticDefaults);
 for(const k of Object.keys(hapticStyles)){const s=saved.haptik?.[k];if(s){hapticStyles[k].styrka=THREE.MathUtils.clamp(Number(s.styrka)||0,0,1);hapticStyles[k].varaktighet_ms=THREE.MathUtils.clamp(Number(s.varaktighet_ms)||12,1,100);}}
 function save(){try{const {brytare,hapticStyle,...styrning}=settings;localStorage.setItem('gyro_faltprov_v1',JSON.stringify({styrning,brytare,hapticStyle,haptik:hapticStyles,debug:$('showDebug').checked}));}catch{}}
 const renderer=new THREE.WebGLRenderer({canvas:$('spel'),antialias:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,cfg.kamera.pixelRatio_max));renderer.shadowMap.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const scene=new THREE.Scene();scene.background=new THREE.Color(cfg.miljo.himmel_farg);scene.fog=new THREE.Fog(cfg.miljo.himmel_farg,cfg.miljo.dimma_near,cfg.miljo.dimma_far);
 const camera=new THREE.PerspectiveCamera(cfg.kamera.fov,1,cfg.kamera.near_m,cfg.kamera.far_m);camera.position.set(0,cfg.kamera.hojd_m,0);scene.add(camera);
 scene.add(new THREE.HemisphereLight(0xe5efff,0x4a4c2e,2.5));const sun=new THREE.DirectionalLight(0xffefd5,3);sun.position.set(-30,60,20);scene.add(sun);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(cfg.miljo.mark_m,cfg.miljo.mark_m),new THREE.MeshStandardMaterial({color:cfg.miljo.mark_farg,roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);
 // Liten fiktiv provbana, inte ett historiskt kartområde. Ingen vegetation/skuggor.
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
 // Klippet är redan retargetat till Soldater v3.3. Bara horisontell root motion
 // låses i minneskopian; original-GLB lämnas orörd. Framåtfart ligger i JSON.
 const inPlace=clip.clone();for(const track of inPlace.tracks){if(/^(root|pelvis)\.position$/.test(track.name)){for(let i=0;i<track.values.length;i+=3){track.values[i]=track.values[0];track.values[i+2]=track.values[2];}}}
 const runAction=mixer.clipAction(inPlace).play();
 let clipMatches=0;for(const track of inPlace.tracks){const name=THREE.PropertyBinding.parseTrackName(track.name).nodeName;if(soldierVisual.getObjectByName(name))clipMatches++;}
 // Separat stabil träffvolym påverkas aldrig av renderings-LOD.
 const hitbox=new THREE.Mesh(new THREE.CapsuleGeometry(cfg.fiende.traffvolym.radie_m,cfg.fiende.traffvolym.langd_m,4,6),new THREE.MeshBasicMaterial({visible:false}));hitbox.position.y=cfg.fiende.traffvolym.centrum_y;soldierWrap.add(hitbox);
 const targets=[{kind:'soldat',root:soldierWrap,hitbox,alive:true,hp:cfg.fiende.hp}];const occluders=[],lodObjects=[];
 // Statisk batching i minnet: biblioteks-GLB ändras aldrig. Delar med samma
 // material blir en geometri; vagnarnas många smådelar blir få ritningar.
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
 // Delade material/texturer i alla kopior; inga dubbla nedladdningar för vagn 2.
 const ray=new THREE.Raycaster(),occlusionRay=new THREE.Raycaster(),zero=new THREE.Vector2();
 const direction=new THREE.Vector3(),point=new THREE.Vector3(),tmp=new THREE.Vector3(),motion=new THREE.Euler(),recoilQuat=new THREE.Quaternion();
 let renderTick=performance.now();const renderInterval=1000/cfg.kamera.mal_hz;
 let started=false,selected=0,shots=0,hits=0,recoil=0,cooldown=0,deadFor=0,hitUntil=0,queue=[],last=performance.now(),frames=0,fps=0,measureTime=last,enemyCount=0,burstToken=0;
 let audio=null,voices=[],audioBuffer=null,audioBus=null;const fileBuffers={},fileLoading={};let holding=false,nextAuto=0;
 function loadWeaponSounds(){for(const w of weapons){if(!w.ljudfil||fileLoading[w.id])continue;fileLoading[w.id]=fetch(new URL('../'+w.ljudfil,import.meta.url)).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}).then(b=>new Promise((ok,no)=>audio.decodeAudioData(b,ok,no))).then(buf=>{fileBuffers[w.id]=buf;}).catch(()=>{fileLoading[w.id]=null;});}}
 const muzzleLight=new THREE.PointLight(0xffd690,0,6,2);camera.add(muzzleLight);muzzleLight.position.set(.13,-.16,-.55);
 const muzzleFlash=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffe7a0,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));muzzleFlash.position.copy(muzzleLight.position);camera.add(muzzleFlash);
 let recoilDecay=19,shakeMeters=0,shake=0,flash=0,flashDuration=.075,lightPeak=0;const modelLoadMs=Math.round(performance.now()-t0);
 async function unlockAudio(){
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();if(!audioBus){audioBus=audio.createDynamicsCompressor();audioBus.threshold.value=-16;audioBus.knee.value=10;audioBus.ratio.value=16;audioBus.attack.value=.001;audioBus.release.value=.08;const master=audio.createGain();master.gain.value=.7;audioBus.connect(master).connect(audio.destination);}if(!audioBuffer){audioBuffer=audio.createBuffer(1,Math.round(audio.sampleRate*.2),audio.sampleRate);const data=audioBuffer.getChannelData(0);let seed=1701;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*Math.exp(-i/(audio.sampleRate*.025));}}loadWeaponSounds();}catch{ $('status').textContent='Ljud saknas här; spelet fungerar utan ljud.';}
 }
 function shotSound(weapon){
  if(!settings.brytare.ljud||!audioBuffer||audio?.state!=='running')return;
  while(voices.length>=cfg.ljud.max_roster){voices.shift().stop();}
  const fb=fileBuffers[weapon.id];
  if(fb){
   // Riktig inspelning per vapen (separat _mobil80-kopia). Högst max_roster röster samtidigt.
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
  // Städa först när den korta ekosvansen har klingat ut.
  source.onended=()=>setTimeout(()=>{voices=voices.filter(v=>v!==voice);for(const n of [source,gain,filter,bass,bassGain,bus,echo,echoFilter,echoGain])n.disconnect();},300);
 }

 function respawn(){const enemy=targets[0];enemy.alive=true;enemy.hp=cfg.fiende.hp;enemy.root.position.set(0,0,-cfg.fiende.start_m);enemy.root.rotation.set(0,0,0);enemy.root.visible=settings.brytare.fiender;runAction.reset().play();deadFor=0;enemyCount++;}
 respawn();
 function targetUnderCrosshair(){scene.updateMatrixWorld(true);ray.setFromCamera(zero,camera);const list=[...occluders,...targets.filter(t=>t.alive&&(t.kind!=='soldat'||settings.brytare.fiender)).map(t=>t.hitbox)];const collision=ray.intersectObjects(list,true)[0];if(!collision)return null;return targets.find(t=>t.hitbox===collision.object)||null;}
 function shoot(weapon){
  shots++;shotSound(weapon);haptics.shot(weapon.haptik,weapon.id);const target=targetUnderCrosshair();
  if(target){haptics.hit();hits++;hitUntil=performance.now()+160;if(settings.brytare.skada){target.hp--;if(target.hp<=0){target.alive=false;if(target.kind==='soldat'){runAction.stop();deadFor=.001;}else{target.root.traverse(n=>{if(n.isMesh&&n.material?.color){n.material.color.multiplyScalar(.45);}});}}}}
  if(settings.brytare.effekter){camera.getWorldDirection(direction);const muzzle=new THREE.Vector3(.13,-.16,-.55).applyQuaternion(camera.quaternion).add(camera.position);fx.spela('mynningsflamma',{pos:muzzle,riktning:direction.clone(),kaliber_mm:weapon.kaliber_mm,mynningsbroms:false});}
  recoil=Math.min(.16,recoil+weapon.rekyl_rad*settings.skottkansla);shake=weapon.skak_rad*settings.skottkansla;recoilDecay=weapon.rekyl_avklingning;shakeMeters=weapon.skak_m*settings.skottkansla;
  if(settings.brytare.effekter){flash=weapon.blixt_styrka*settings.skottkansla;flashDuration=weapon.blixt_s;lightPeak=weapon.mynningsljus*settings.skottkansla;muzzleFlash.scale.setScalar(weapon.mynningsflamma_m);}
  $('score').textContent=`TRÄFFAR ${hits} · SKOTT ${shots}`;
 }
 function fire(){const now=performance.now();if(weapons[selected].automat)return false;if(!started||now<cooldown||document.hidden)return false;void unlockAudio();const weapon={...weapons[selected]};cooldown=now+weapon.omladdning_ms;const token=++burstToken;shoot(weapon);queue=Array.from({length:weapon.salva-1},(_,i)=>({at:now+(i+1)*weapon.intervall_ms,weapon,token}));return true;}
 // Själva labeln täcker knappen, men inputen är ett syskon: ingen dubbel eventkedja.
 $('trigger').addEventListener('click',e=>{if(!fire())e.preventDefault();if(!settings.brytare.haptik||window.ReactNativeWebView)e.preventDefault();});
 $('trigger').addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(weapons[selected].automat)startHold();else fire();}});
 // Kulsprutan: eld bara så länge fingret ligger kvar på knappen.
 function startHold(){if(!started||!weapons[selected].automat||document.hidden)return;void unlockAudio();if(!holding){holding=true;nextAuto=0;}}
 function stopHold(){holding=false;}
 $('trigger').addEventListener('pointerdown',e=>{if(weapons[selected].automat){e.preventDefault();try{$('trigger').setPointerCapture(e.pointerId);}catch{}startHold();}});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('trigger').addEventListener(ev,stopHold);
 $('trigger').addEventListener('touchstart',e=>{if(weapons[selected].automat){e.preventDefault();startHold();}},{passive:false});
 $('trigger').addEventListener('touchend',stopHold);$('trigger').addEventListener('touchcancel',stopHold);
 $('trigger').addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter')stopHold();});
 addEventListener('blur',stopHold);
 $('fire').addEventListener('click',fire);
 function applyWeapon(){const w=weapons[selected];$('weapon').textContent=w.namn;document.body.dataset.sikte=w.sikte||'';camera.fov=cfg.kamera.fov/(w.zoom||1);camera.updateProjectionMatrix();}
 $('weapon').onclick=()=>{stopHold();queue=[];selected=(selected+1)%weapons.length;applyWeapon();};applyWeapon();
 $('center').onclick=()=>{gyro.center();recoil=0;shake=0;shakeMeters=0;};
 function hideStart(){started=true;$('startPanel').hidden=true;last=performance.now();}
 $('manual').onclick=()=>{gyro.stop();hideStart();void unlockAudio();$('status').textContent='Dra i bilden för att sikta · Centrera nollställer';};
 $('start').disabled=false;
 $('start').onclick=()=>{const promise=gyro.start();void unlockAudio();hideStart();$('status').textContent='Väntar på sensorer…';promise.then(p=>{$('status').textContent=p.orientation==='granted'?'Gyro tillåtet · vänta på sensorvärden': 'Gyro nekades eller saknas · dra för att sikta';if(p.motion!=='granted')$('status').textContent+=' · rörelsedata saknas';}).catch(()=>{$('status').textContent='Sensorerna kunde inte starta · dra för att sikta';});};
 const settingsPanel=$('settings');function showSettings(show){settingsPanel.hidden=!show;$('settingsButton').setAttribute('aria-expanded',String(show));}
 $('settingsButton').onclick=()=>showSettings(settingsPanel.hidden);$('closeSettings').onclick=()=>showSettings(false);
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
 document.addEventListener('visibilitychange',()=>{queue=[];holding=false;burstToken++;if(document.hidden){audio?.suspend();navigator.vibrate?.(0);}last=performance.now();});
 const snapshot={targetCenters:targets.map(t=>({kind:t.kind,center:t.hitbox.getWorldPosition(new THREE.Vector3()).toArray()})),ready:true,models:8,clip:clip.name,clipTracks:inPlace.tracks.length,clipMatches,modelLoadMs,rawBounds,modelScale:soldierScale,haptics:haptics.mode,shots:0,hits:0};
 // Läsbar diagnostik för automatiskt rökprov. Inga externa tjänster används.
 window.gyroDiagnostics=snapshot;
 if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify({type:'bridge-ready',version:1}));haptics.sync();}
 addEventListener('ww2-native-lifecycle',e=>{if(!window.ReactNativeWebView)return;queue=[];holding=false;burstToken++;last=performance.now();if(!e.detail?.active)audio?.suspend();else gyro.center();});
 $('status').textContent='Banan är laddad · 1 soldat, 2 Tiger, 2 hus';
 function loop(now){requestAnimationFrame(loop);if(now-renderTick<renderInterval-.5)return;renderTick=now-((now-renderTick)%renderInterval);const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(document.hidden)return;
  const orientation=gyro.update(dt);camera.quaternion.copy(orientation);
  const a=gyro.values.acc;const freshMotion=now-gyro.lastMotion<500;
  const clamp=v=>THREE.MathUtils.clamp(v,-cfg.styrning.acc_max,cfg.styrning.acc_max);
  const sway=settings.brytare.acceleration&&freshMotion?cfg.styrning.acc_sväng:0;
  motion.set(recoil+Math.sin(now*.17)*shake+clamp(a.y)*sway,Math.sin(now*.23)*shake+clamp(a.x)*sway,Math.cos(now*.19)*shake*.5+clamp(a.z)*sway,'YXZ');camera.quaternion.multiply(recoilQuat.setFromEuler(motion));
  camera.position.set(clamp(a.x)*sway+Math.sin(now*.21)*shakeMeters,cfg.kamera.hojd_m+clamp(a.y)*sway+Math.cos(now*.27)*shakeMeters,clamp(a.z)*sway);recoil*=Math.exp(-recoilDecay*dt);shake*=Math.exp(-26*dt);shakeMeters*=Math.exp(-26*dt);
  flash*=Math.exp(-dt/flashDuration);if(flash<.001)flash=0;$('shotFlash').style.opacity=String(Math.min(.85,flash));muzzleLight.intensity=lightPeak*flash;muzzleFlash.material.opacity=Math.min(.9,flash*2);muzzleFlash.rotation.z=shots*2.4;
  const enemy=targets[0];enemy.root.visible=settings.brytare.fiender;
  if(started&&settings.brytare.fiender){if(enemy.alive){mixer.update(dt);enemy.root.position.z+=cfg.fiende.fart_ms*dt;if(enemy.root.position.z>-cfg.fiende.nara_m)respawn();}else{deadFor+=dt;enemy.root.rotation.x=-Math.min(1,deadFor/cfg.fiende.fall_s)*Math.PI/2;if(deadFor>cfg.fiende.aterkomst_s)respawn();}}
  if(holding&&started&&weapons[selected].automat&&!document.hidden&&now>=nextAuto){const w={...weapons[selected]};shoot(w);nextAuto=(nextAuto&&now-nextAuto<w.intervall_ms?nextAuto:now)+w.intervall_ms;}
  while(queue.length&&queue[0].at<=now){const shot=queue.shift();if(shot.token===burstToken)shoot(shot.weapon);}
  scene.updateMatrixWorld(true);
  for(const lod of lodObjects){const distance=camera.position.distanceTo(lod.position),width=cfg.lod.overgang_m;lod.levels.forEach((level,i)=>{let weight=i===0?1:THREE.MathUtils.smoothstep(distance,level.distance-width/2,level.distance+width/2);if(i<lod.levels.length-1){const next=lod.levels[i+1].distance;weight*=1-THREE.MathUtils.smoothstep(distance,next-width/2,next+width/2);}if(!settings.brytare.lod)weight=i===0?1:0;level.object.visible=weight>.001;for(const material of lod.userData.levelMaterials[i])material.opacity=weight;});}
  // Konservativ enkel CPU-occlusion: testa mitten + fyra hörnpunkter mot husens
  // riktiga trianglar. Gäller enheter, aldrig spel-/träfflogik eller huset självt.
  for(const target of targets){if(target.kind==='soldat'&&!settings.brytare.fiender)continue;target.root.visible=true;if(settings.brytare.occlusion){const b=new THREE.Box3().setFromObject(target.hitbox);const c=b.getCenter(new THREE.Vector3());const points=[c,new THREE.Vector3(b.min.x,b.min.y,c.z),new THREE.Vector3(b.max.x,b.min.y,c.z),new THREE.Vector3(b.min.x,b.max.y,c.z),new THREE.Vector3(b.max.x,b.max.y,c.z)];let blocked=0;for(const p of points){tmp.copy(p).sub(camera.position);const dist=tmp.length();occlusionRay.set(camera.position,tmp.normalize());occlusionRay.far=dist-.1;if(occlusionRay.intersectObjects(occluders,true).length)blocked++;}if(blocked===points.length)target.root.visible=false;}}
  fx.uppdatera(dt);
  const target=targetUnderCrosshair();camera.getWorldDirection(direction);let nearest=180;
  for(const t of targets){if(!t.alive||(t.kind==='soldat'&&!settings.brytare.fiender))continue;t.hitbox.getWorldPosition(point);tmp.copy(point).sub(camera.position).normalize();nearest=Math.min(nearest,THREE.MathUtils.radToDeg(direction.angleTo(tmp)));}
  const closeness=1-THREE.MathUtils.clamp(nearest/cfg.sikte.ring_vinkel_grad,0,1);const ringSize=THREE.MathUtils.lerp(cfg.sikte.ring_max_px,cfg.sikte.ring_min_px,closeness);$('ring').style.width=$('ring').style.height=ringSize+'px';$('ring').style.opacity=String(1-closeness*.75);$('aim').style.color=target?'#ff7463':'#eff4d5';$('hit').style.opacity=now<hitUntil?'1':'0';$('reload').textContent=now<cooldown?'LADDAR':'REDO';
  renderer.render(scene,camera);frames++;if(now-measureTime>600){fps=Math.round(frames*1000/(now-measureTime));frames=0;measureTime=now;$('metrics').textContent=`${fps} fps · ${renderer.info.render.calls} ritningar · ${renderer.info.render.triangles.toLocaleString('sv-SE')} tris · ${modelLoadMs} ms laddning`;
   const f=n=>n==null?'—':Number(n).toFixed(1);$('debug').textContent=`α ${f(gyro.values.alpha)} β ${f(gyro.values.beta)} γ ${f(gyro.values.gamma)}\nacc ${f(a.x)} ${f(a.y)} ${f(a.z)} m/s²\nrot ${Object.values(gyro.values.rotationRate).map(f).join(' ')} °/s\nsensor ${f(gyro.values.interval)} ms · tex ${renderer.info.memory.textures} · JS ${performance.memory?(performance.memory.usedJSHeapSize/1048576).toFixed(1)+' MB':'saknas'}\n${gyro.active&&gyro.received?'gyro aktivt':'finger/ingen sensordata'}`;
   if(started&&gyro.active){if(gyro.received&&now-gyro.lastEvent<1500)$('status').textContent='Gyro aktivt · Centrera om riktningen driver';else $('status').textContent='Ingen färsk gyrosignal · dra för att sikta';}
  }
  Object.assign(snapshot,{fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,shots,hits,recoil,shake,skottkansla:settings.skottkansla,audioVoices:voices.length,enemyZ:enemy.root.position.z,enemyAlive:enemy.alive,animationTime:runAction.time,quaternion:camera.quaternion.toArray(),sensor:structuredClone(gyro.values),sensorSource:gyro.nativeSource?'app':'webb',enemyCount});
 }
 requestAnimationFrame(loop);
}
