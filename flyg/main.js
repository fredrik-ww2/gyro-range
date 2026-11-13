import * as THREE from 'three';
import {GLTFLoader} from '../js/vendor/loaders/GLTFLoader.js';
import {FlightInput,dampCritical} from './flight-controls.js';
import {WingGuns} from './wing-guns.js';
import {KvantFlyg,gimbalProv} from './kvaternion.js';
import {nyZon,nollZon,styrKommando} from './gyro-zon.js';
import {skapaJaktplan} from './jaktplan.js';
import {MeshoptDecoder} from '../js/vendor/loaders/meshopt_decoder.module.js';
import {skapaEffekterV2d} from './effects/effekter_v2d.js';
import {KTX2Loader} from './vendor/loaders/KTX2Loader.js';
import {DRACOLoader} from './vendor/loaders/DRACOLoader.js';
import {GyroAim} from '../js/gyro.js';
import {createHaptics} from '../js/haptics.js';
import {skapaAppleKamera} from './kamera/kamera_apple_zoom_v1.js';
import {skapaMark} from './mark.js';
import {skapaMotstandare} from './motstandare.js';
import {skapaPanel,skapaJaktPanel,hojdvisare,jaktHorisont,panelHorisont} from './panel.js?v=14';
import {propellerSkiva,motorRpm,propVarv} from './propeller.js';
import {ledTabell,ringRadie,sikteLed,flygtid,luftdensitet,MYNNING,REFERENSFART} from './ballistik.js';
import {skapaBomber} from './bomber.js';
import {skapaRoder} from './roder.js';
import {skapaMal} from './mal.js';
import {layoutFor, applyLayout} from './layout.js?v=14';
import {tomOmgang, traffPaSpelare, ljudBehov, FLYG_VERSION, vyEtikett} from './omgang.js?v=14';
import {skapaKanal,skapaMekanik,gasSlag} from './ljud.js?v=14';
const $=id=>document.getElementById(id), began=performance.now();
const C=await fetch('./config.json?v=10').then(r=>{if(!r.ok)throw Error('Inställningar saknas');return r.json();});
const V=await fetch('./kamera/profil.json').then(r=>r.json());
const motor=C.motor, RING=ringRadie(1.225);
const settings={...C.styrning,skottkansla:1.5,hapticStyle:'auto',roll_troskel_grader:C.gyro_zon.roll_troskel_grader,brytare:{...C.brytare,atergang:false,horisont:false}};
const canvas=$('spel'),renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
const pixelRatio=()=>Math.min(devicePixelRatio||1,C.varld.pixelratio,Math.sqrt(C.varld.max_render_px/(innerWidth*innerHeight)));renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xc5d4d4);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xc5d4d4);scene.fog=new THREE.Fog(0xc5d4d4,C.varld.dimma_nara,C.varld.dimma_fjarran);
scene.add(new THREE.HemisphereLight(0xe4f2ff,0x536441,2.15));const sun=new THREE.DirectionalLight(0xffedce,2.3);sun.position.set(-300,700,200);scene.add(sun);
const mark=skapaMark(THREE,scene,C.varld), height=mark.hojd;
let fm=new KvantFlyg(C.modeller[C.standardmodell].aero);const zonTillstand=nyZon();let lutningTvang=null,zonVantade=false;const aircraft=new THREE.Group();scene.add(aircraft);
let markX=0,markZ=0;
function startPos(){const y=height(0,0)+C.flyg.start_hojd;fm.reset(0,y,0,fm.A.start_fart_ms||C.aero.start_fart_ms);aircraft.position.set(fm.x,fm.y,fm.z);const o=fm.ori;aircraft.quaternion.set(o.x,o.y,o.z,o.w);mark.place(0,0);markX=markZ=0;}
startPos();
const draco=new DRACOLoader().setDecoderPath('./vendor/libs/draco/').setDecoderConfig({type:'wasm'});
await MeshoptDecoder.ready;
const loader=new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder),visual=new THREE.Group();aircraft.add(visual);
function sparadPlan(){try{const k=localStorage.getItem(C.lagring.plan);if(k&&C.modeller[k])return k;}catch{}return C.standardmodell;}
function sparaPlan(k){try{localStorage.setItem(C.lagring.plan,k);}catch{}}
let model=null,currentModel=sparadPlan(),modelInfo={triangles:0},modelLoadSerial=0,propNoder=[],propNav=0,blur=null;
function riggaProp(root){blur?.mesh.removeFromParent();propNoder=[];root.traverse(o=>{if(/propeller|spinner/i.test(o.name||''))propNoder.push(o);});
 const prop=propNoder.find(o=>/propeller/i.test(o.name||''))||propNoder[0];if(!prop)return;
 prop.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;}});
 let rad=1.9;if(prop.geometry){prop.geometry.computeBoundingBox();const s=prop.geometry.boundingBox.getSize(new THREE.Vector3());rad=Math.max(s.x,s.y)*.5;}
 blur=propellerSkiva(THREE,rad);const hub=new THREE.Group();hub.name='PropBlur';prop.parent.add(hub);hub.position.copy(prop.position);hub.quaternion.copy(prop.quaternion);hub.scale.copy(prop.scale);hub.add(blur.mesh);
}
// Roderytor (skevroder, klaff, höjdroder, sidroder) ligger i flygplanets koordinater, inte i modellens, så de sitter i aircraft-gruppen.
let roderVy=null;
function riggaRoder(def){roderVy?.grupp.removeFromParent();roderVy=def.roder?skapaRoder(THREE,aircraft,def.roder):null;}
async function selectModel(key){const serial=++modelLoadSerial,def=C.modeller[key];$('modelSelect').disabled=true;try{const next=def.byggd==='jakt'?skapaJaktplan(THREE,def.form):(await loader.loadAsync(def.fil)).scene;if(serial!==modelLoadSerial)return;const box=new THREE.Box3().setFromObject(next,true),size=box.getSize(new THREE.Vector3()),mid=box.getCenter(new THREE.Vector3()),scale=def.spann_m/Math.max(0.01,size.x);next.position.copy(mid).multiplyScalar(-scale);next.scale.setScalar(scale);
 visual.clear();if(model)model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});model=next;visual.rotation.y=def.rotation_y;visual.add(model);currentModel=key;modelInfo={bounds:size.toArray(),scale,triangles:0};model.traverse(o=>{if(o.isMesh){modelInfo.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;o.frustumCulled=true;}});riggaProp(model);riggaRoder(def);$('aircraftName').textContent=def.namn;$('modelSelect').value=key;
 }finally{$('modelSelect').disabled=false;}}
function bytFysik(def){const x=fm.x,y=fm.y,z=fm.z,V=Math.max(12,fm.V||0),pa=!!settings.brytare.nivellering;
 const next=new KvantFlyg(def.aero);next.tillampaNivellering(pa);next.reset(x,y,z,V);fm=next;nollZon(zonTillstand);}
function ritaPlanMeny(){const e=C.modeller[currentModel]?.egenskaper||{};
 for(const rot of [$('planMeny'),$('planMenyFlyg')]){if(!rot)continue;rot.replaceChildren();
  for(const [key,def] of Object.entries(C.modeller)){const b=document.createElement('button');b.type='button';b.className='planval'+(key===currentModel?' vald':'');b.dataset.plan=key;
   const namn=document.createElement('strong');namn.textContent=def.namn;b.append(namn);
   const rad=[def.egenskaper?.fart,def.egenskaper?.svang,def.egenskaper?.akrobatik].filter(Boolean).join(' ');
   if(rad){const s=document.createElement('span');s.textContent=rad;b.append(s);}
   b.onclick=()=>{void valjPlan(key);};rot.append(b);}}
 const sel=$('modelSelect');if(sel){sel.replaceChildren();for(const [key,def] of Object.entries(C.modeller)){const o=document.createElement('option');o.value=key;o.textContent=def.namn;sel.append(o);}sel.value=currentModel;}
 const info=[e.fart,e.svang,e.akrobatik].filter(Boolean).join(' ');
 if($('planInfo'))$('planInfo').textContent=info;
 if($('planRubrik'))$('planRubrik').textContent=C.meny.rubrik;
 if($('planHjalp'))$('planHjalp').textContent=C.meny.hjalp;
 if($('planSparad'))$('planSparad').textContent=C.meny.sparad;}
async function valjPlan(key){if(!C.modeller[key])return;try{await selectModel(key);}catch{$('status').textContent='Modellen kunde inte laddas';return;}
 sparaPlan(key);bytFysik(C.modeller[key]);if(!running)startPos();else{const at=fm.attitude();pitch=at.pitch;roll=at.roll;heading=at.yaw;sattKropp();}ritaPlanMeny();if(sight)setSight(true);}
await selectModel(currentModel);bytFysik(C.modeller[currentModel]);if(fm.kvaternion)startPos();ritaPlanMeny();
$('modelSelect').onchange=e=>{void valjPlan(e.target.value);};
class FollowTarget{constructor(camera){this.camera=camera;this.target=new THREE.Vector3();}update(){this.camera.lookAt(this.target);}}
const cam=await skapaAppleKamera({THREE,OrbitControls:FollowTarget,renderer,varden:V,markHojd:()=>aircraft.position.y+C.kamera.hojd});
const camera=cam.kamera;const gyro=new GyroAim(canvas,settings,C.styrning);const input=new FlightInput(gyro,C.styrning,settings);
const atlas=await new KTX2Loader().setTranscoderPath('./vendor/libs/basis/').detectSupport(renderer).loadAsync('./effects/fx_atlas_v2d.ktx2');
const effects=skapaEffekterV2d(THREE,scene,{atlas,kamera:camera,renderer,kvalitet:'lag',ljus:false,maxPartiklar:128,markHojd:height});
const bombAntal=(C.bombuppdrag&&C.bombuppdrag.bomber)||2;
const bomber=skapaBomber(THREE,scene,bombAntal);
const mal=C.bombuppdrag?skapaMal(THREE,scene,height,C.bombuppdrag):null;
const guns=new WingGuns(scene,aircraft,C.vapen,effects);
const opp=skapaMotstandare(THREE,{scene,loader,config:C,aero:C.aero,motor,guns,effects,hojd:height});
await opp.load();opp.reset(fm);
const panel=skapaPanel($('panel'));
const jaktPanel=skapaJaktPanel($('jaktpanel'),C.jaktpanel);
const pitchSpring={x:0,v:0},bankSpring={x:0,v:0};let lastInput=null,turnRate=0,loadFactor=1,turnRadius=Infinity,sight=false;
const K=C.cockpit,cockpitCam=new THREE.PerspectiveCamera(K.fov_grader,innerWidth/innerHeight,K.nara_m,120000);cockpitCam.position.set(...K.oga_lokal);aircraft.add(cockpitCam);
const BS=C.bombuppdrag&&C.bombuppdrag.sikte;
const bombCam=BS?new THREE.PerspectiveCamera(BS.fov_grader,innerWidth/innerHeight,0.3,120000):null;
if(bombCam){bombCam.position.set(...BS.oga_lokal);bombCam.rotation.x=-THREE.MathUtils.degToRad(BS.lutning_grader);aircraft.add(bombCam);}
const nedslag=new THREE.Mesh(new THREE.RingGeometry(9,12.5,32),new THREE.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:0.85,side:THREE.DoubleSide,depthTest:false}));nedslag.rotation.x=-Math.PI/2;nedslag.renderOrder=5;nedslag.visible=false;scene.add(nedslag);
let bombVy=false,statusLas=0,uppdragKlart=false,styrLage='ok';
function synkaVyKnapp(){const j=$('jaktHorisont'),p=$('panelHorisont');if(j)j.setAttribute('aria-label','Byt till '+vyEtikett(false).toLowerCase());if(p)p.setAttribute('aria-label',sight?'Byt till vyn bakifrån':'Byt till '+vyEtikett(false).toLowerCase());}
function setSight(on){sight=on;if(sight)bombVy=false;synkaVyKnapp();$('cockpit').hidden=!sight;$('reticle').toggleAttribute('hidden',!sight);document.body.classList.toggle('cockpitvy',sight);$('bombsikte')?.setAttribute('aria-pressed','false');nedslag.visible=false;
 if(model)model.traverse(o=>{if(o.isMesh)o.visible=!(sight||bombVy);});if(blur)blur.mesh.visible=!(sight||bombVy);roderVy?.synlig(!(sight||bombVy));const jakt=$('jaktpanel');if(jakt)jakt.hidden=sight||!running||!C.jaktpanel.synlig;if(sight)ritaPanel();else if(running)ritaJakt();placeraHorisont();}
function bytVy(e){if(e){e.preventDefault();e.stopPropagation();}setSight(!sight);const knapp=$(sight?'panelHorisont':'jaktHorisont');if(knapp){knapp.classList.add('tryckt');setTimeout(()=>knapp.classList.remove('tryckt'),170);}mekanikLjud('knapp');}
let vyViaPekare=false;
for(const id of ['jaktHorisont','panelHorisont']){const el=$(id);if(!el)continue;el.addEventListener('pointerdown',e=>e.stopPropagation());el.addEventListener('pointerup',e=>{e.stopPropagation();vyViaPekare=true;bytVy(e);});el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(vyViaPekare){vyViaPekare=false;return;}bytVy(e);});}
const haptics=createHaptics({medel:{varaktighet_ms:35},tung:{varaktighet_ms:45}},settings);
const send=m=>window.ReactNativeWebView?.postMessage(JSON.stringify(m));send({type:'bridge-ready',version:1});haptics.sync();
$('back').href='../'+location.search;const menyLank=$('allaLankarMeny');if(menyLank)menyLank.href='../lankar/'+location.search;
const targets=[],sphere=new THREE.SphereGeometry(C.vapen.mal_radie,12,8),simpleSphere=new THREE.SphereGeometry(C.vapen.mal_radie,8,6);
const balloonCanvas=document.createElement('canvas');balloonCanvas.width=balloonCanvas.height=64;const balloonPaint=balloonCanvas.getContext('2d');const gradient=balloonPaint.createRadialGradient(24,20,2,32,32,30);gradient.addColorStop(0,'#d99b7a');gradient.addColorStop(.8,'#b45e44');gradient.addColorStop(1,'#6f392e');balloonPaint.fillStyle=gradient;balloonPaint.beginPath();balloonPaint.ellipse(32,32,24,31,0,0,Math.PI*2);balloonPaint.fill();const balloonTexture=new THREE.CanvasTexture(balloonCanvas);balloonTexture.colorSpace=THREE.SRGBColorSpace;
for(let i=0;i<C.vapen.mal_antal;i++){const mesh=new THREE.Group(),levels=[];for(const geometry of [sphere,simpleSphere]){const item=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0xb45e44,transparent:true}));item.scale.set(.8,1.25,.8);mesh.add(item);levels.push(item);}const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:balloonTexture,transparent:true}));sprite.scale.set(C.vapen.mal_radie*1.6,C.vapen.mal_radie*2.5,1);mesh.add(sprite);levels.push(sprite);mesh.position.set(Math.sin(i*2)*140,C.flyg.start_hojd+Math.sin(i)*32,-C.vapen.mal_avstand-i*C.vapen.mal_mellanrum);scene.add(mesh);targets.push({mesh,levels,base:mesh.position.clone(),down:0});}
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const shadowPaint=shadowCanvas.getContext('2d'),shade=shadowPaint.createRadialGradient(32,32,2,32,32,31);shade.addColorStop(0,'#0009');shade.addColorStop(1,'#0000');shadowPaint.fillStyle=shade;shadowPaint.fillRect(0,0,64,64);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(20,14),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
let stallBuzz=0,running=false,firing=false,gas=C.flyg.gas,pitch=0,roll=0,heading=0,hits=0,shots=0,nextShot=0,hitUntil=0,time=0,fps=0,frameCount=0,frameTime=0,spelareHp=C.motstandare.spelare_hp,skadaTill=0,bransle=1,panelAcc=0;
// Flygprov 05: motorn går alltid, propellerstigningen sköts automatiskt, bränslet tar inte slut. Pedalerna eller gyrots vridning ger sidroder.
let motorPa=true,tandning=true,primer=0,patroner=3,paMarken=false,roder=0,pedalRoder=0,propPitch=0.4,gearPos=0,gearMal=0,flaps=0,bomberKvar=2,bombTung=false,bombTraff=0,landInfo='';
let audio=null,buffers={};
const skottKanal=skapaKanal(),motorKanal=skapaKanal(),mekanik=skapaMekanik();
let gasKlick=0;
function mekanikLjud(typ){if(!settings.brytare.ljud||!audio||audio.state==='closed')return 0;if(audio.state==='suspended'){const p=audio.resume();if(p&&typeof p.catch==='function')p.catch(()=>{});}return mekanik.spela(audio,typ);}
async function mekanikTopp(){const AC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!AC)return null;const off=new AC(1,24000,48000);const m=skapaMekanik();for(let i=0;i<8;i++)m.spela(off,i%2?'stopp':'hack');const buf=await off.startRendering();const d=buf.getChannelData(0);let peak=0;for(let i=0;i<d.length;i++){const a=Math.abs(d[i]);if(a>peak)peak=a;}m.slapp();return peak;}
function lasOppTyst(){
 try{if(navigator.audioSession)navigator.audioSession.type='playback';else if(!window.__tystBrytare){const n=22050,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,n,true);v.setUint32(28,n*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);const a=document.createElement('audio');a.setAttribute('playsinline','');a.setAttribute('x-webkit-airplay','deny');a.loop=true;a.src=URL.createObjectURL(new Blob([b],{type:'audio/wav'}));window.__tystBrytare=a;a.play().catch(()=>{});}else window.__tystBrytare.play().catch(()=>{});}catch{}
}
function rensaLjudNoder(){motorKanal.tyst();skottKanal.tyst();}
function stangLjud(){mekanik.slapp();rensaLjudNoder();const dying=audio;audio=null;buffers={};if(dying&&dying.state!=='closed'){const p=dying.close?.();if(p&&typeof p.catch==='function')p.catch(()=>{});}}
async function seTillLjud(){
 lasOppTyst();
 const behov=ljudBehov(audio,!!settings.brytare.ljud);
 if(behov==='paus'){try{await audio.suspend();}catch{}return;}
 if(behov==='inget')return;
 if(behov==='skapa'){
  rensaLjudNoder();buffers={};
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  audio=new AC();
  try{const silent=audio.createBufferSource();silent.buffer=audio.createBuffer(1,1,22050);silent.connect(audio.destination);silent.start();}catch{}
 }
 try{await audio.resume();}catch{}
 try{for(const key of ['motor','skott'])if(!buffers[key]){const data=await fetch(C.ljud[key]).then(r=>{if(!r.ok)throw Error('Ljudfil saknas');return r.arrayBuffer();});if(!audio||audio.state==='closed')return;buffers[key]=await audio.decodeAudioData(data.slice(0));}
 if(running&&settings.brytare.ljud&&buffers.motor&&audio&&audio.state!=='closed')motorKanal.spela(audio,buffers.motor,{volym:C.ljud.motor_volym,loop:true,loopEnd:C.ljud.motor_loop_end});
 }catch{$('status').textContent='Flyg klart · ljud kunde inte laddas';}
}
function shotSound(){if(!firing||!audio||audio.state==='closed'||!buffers.skott||!settings.brytare.ljud)return;skottKanal.spela(audio,buffers.skott,{volym:C.ljud.skott_volym,loop:false,maxSek:C.vapen.intervall_s});}
const forward=new THREE.Vector3(),cameraTarget=new THREE.Vector3(),smoothTarget=new THREE.Vector3(0,C.flyg.start_hojd,0),hast=new THREE.Vector3(),oppHast=new THREE.Vector3(),aimPoint=new THREE.Vector3(),projected=new THREE.Vector3(),ledPunkt=new THREE.Vector3();
let sikteState={cx:0,cy:0,ring:0,dx:0,dy:0,vinkel:0,avstand:0,synlig:false};
function fyllHast(target,model){if(model.kvaternion){target.set(model.vx,model.vy,model.vz);return target;}const ch=Math.cos(model.gamma);target.set(-Math.sin(model.psi)*ch*model.V,Math.sin(model.gamma)*model.V,-Math.cos(model.psi)*ch*model.V);return target;}
function sattKropp(){if(fm.kvaternion){const o=fm.ori;aircraft.quaternion.set(o.x,o.y,o.z,o.w);}else aircraft.rotation.set(pitch,heading,roll,'YXZ');}
function center(){input.center();nollZon(zonTillstand);zonVantade=false;pitchSpring.x=pitchSpring.v=bankSpring.x=bankSpring.v=0;}
let crashFx=null,crashInfo=null;
function aterstallSeger(){const ruta=$('seger');const h=ruta.querySelector('h2');const p=ruta.querySelector('p');if(h)h.textContent='Fw 190 är nere';if(p)p.textContent='Motståndaren är nedskjuten.';}
function nollstallOmgang(){const t=tomOmgang({spelareHp:C.motstandare.spelare_hp,bomber:bombAntal});
 pedalRoder=t.pedalRoder;roder=t.roder;landInfo=t.landInfo;hits=t.hits;shots=t.shots;nextShot=t.nextShot;hitUntil=t.hitUntil;skadaTill=t.skadaTill;
 spelareHp=t.spelareHp;bomberKvar=t.bomberKvar;bombTraff=t.bombTraff;bombTung=t.bombTung;uppdragKlart=false;
 paMarken=false;gearMal=0;gearPos=0;flaps=0;motorPa=true;tandning=true;primer=0;propPitch=0.4;bransle=1;fm.crashed=false;
 $('skada').style.opacity='0';$('hit').style.opacity='0';$('pedalV').classList.remove('ned');$('pedalH').classList.remove('ned');
 stopFire();for(const target of targets){target.down=0;target.mesh.visible=!!settings.brytare.mal;target.mesh.position.copy(target.base);}
 guns.rensa();bomber.rensa();mal?.aterstall();nollZon(zonTillstand);pitchSpring.x=pitchSpring.v=bankSpring.x=bankSpring.v=0;aterstallSeger();
}
function flygklar(){nollstallOmgang();}
function visaSpak(){$('gasreglage').hidden=false;$('pedaler').hidden=false;$('system').hidden=false;const j=$('jaktpanel');if(j)j.hidden=sight||!C.jaktpanel.synlig;synkaReglage();if(!sight)ritaJakt();placeraHorisont();}
function flyAgain(){crashFx?.stopp();crashFx=null;crashInfo=null;flygklar();setGas(C.flyg.gas);setPitch(0.6);startPos();opp.reset(fm);center();visual.visible=true;setSight(sight);$('crashPanel').hidden=true;$('seger').hidden=true;smoothTarget.copy(aircraft.position);visaSpak();if(settings.brytare.ljud)void seTillLjud();if(settings.brytare.gyro&&input.active)gyro.start();}
$('again').onclick=flyAgain;$('nyStrid').onclick=flyAgain;
async function start(useGyro){const vill=!!(useGyro&&settings.brytare.gyro);input.active=vill;const permission=vill?gyro.start():null;running=true;flygklar();styrLage=vill?'gyro':'finger';setGas(C.flyg.gas);setPitch(0.6);center();$('startPanel').hidden=true;$('crashPanel').hidden=true;visaSpak();void seTillLjud();if(permission){const result=await permission;if(result.orientation==='granted'){styrLage='gyro';$('status').textContent='Luta för att flyga · vrid för sidroder · Centrera nollställer';}else{input.active=false;styrLage='nekad';$('status').textContent='Gyro nekades · dra med fingret';}}else{$('status').textContent='Dra i bilden för att flyga · Centrera rätar upp';}}
// Start på marken med motorn igång: hjul ute, startklaff, låg gas. Ge full gas, dra försiktigt när farten passerar 160 km/h.
async function markstart(){const vill=!!settings.brytare.gyro;input.active=vill;const permission=vill?gyro.start():null;running=true;flygklar();styrLage=vill?'gyro':'finger';motorPa=true;tandning=true;gearMal=1;gearPos=1;flaps=0.45;propPitch=0.2;bomberKvar=bombAntal;paMarken=true;fm.crashed=false;const y=height(0,0)+1.35;fm.reset(0,y,0,0);fm.V=0;fm.gamma=0;fm.psi=0;fm.x=0;fm.z=0;aircraft.position.set(0,y,0);aircraft.rotation.set(0,0,0);setGas(0.15);center();$('startPanel').hidden=true;$('crashPanel').hidden=true;$('seger').hidden=true;visaSpak();setSight(true);void seTillLjud();if(permission){const result=await permission;if(result.orientation!=='granted'){input.active=false;styrLage='nekad';}}$('status').textContent='Motorn går. Full gas, håll rakt med sidrodret, dra lätt vid 160 km/h.';}
$('start').disabled=$('manual').disabled=$('kall').disabled=false;$('start').onclick=()=>start(true);$('manual').onclick=()=>start(false);$('kall').onclick=markstart;$('center').onclick=center;
function setGas(v,franHand){const fore=gas;gas=Math.max(0,Math.min(1,+v||0));const el=$('gasreglage');el.style.setProperty('--gas',gas.toFixed(4));el.querySelectorAll('.spak').forEach(s=>s.dataset.gas=gas.toFixed(3));$('gasValue').value=Math.round(gas*100)+'%';$('throttle').value=String(gas);if(!franHand)return;const slag=gasSlag(fore,gas);if(!slag)return;gasKlick+=slag.antal;for(let i=0;i<slag.antal;i++){if(i===0)mekanikLjud(slag.typ);else setTimeout(()=>mekanikLjud(slag.typ),i*18);}}
function setPitch(v){const spak=Math.max(0,Math.min(1,+v||0));propPitch=1-spak;}
setGas(gas);setPitch(0.6);
function yTill(e,el){const r=el.getBoundingClientRect();return 1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));}
function bindSpak(el,fn){el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{el.setPointerCapture(e.pointerId);}catch{}fn(e);});el.addEventListener('pointermove',e=>{if(el.hasPointerCapture(e.pointerId))fn(e);});}
const bana=$('gasBana');
bindSpak(bana,e=>setGas(yTill(e,bana),true));
$('throttle').oninput=e=>setGas(e.target.value,true);
function pedalNer(e,v){e.preventDefault();pedalRoder=v;e.currentTarget.classList.add('ned');e.currentTarget.setPointerCapture(e.pointerId);}
function pedalUpp(e){if(e.currentTarget.classList.contains('ned')){e.currentTarget.classList.remove('ned');pedalRoder=0;}}
$('pedalV').onpointerdown=e=>pedalNer(e,-1);$('pedalH').onpointerdown=e=>pedalNer(e,1);
for(const ev of ['pointerup','pointercancel','lostpointercapture']){$('pedalV').addEventListener(ev,pedalUpp);$('pedalH').addEventListener(ev,pedalUpp);}
function synkaReglage(){const lampa=$('hjulLampa'),ror=Math.abs(gearPos-gearMal)>0.04;lampa.className='lampa'+(ror?' rod':gearPos>0.92?' gron':'');$('hjul').setAttribute('aria-label',ror?'Hjulen rör sig':gearPos>0.92?'Hjulen är nere och låsta':'Hjulen är uppe');$('klaffText').textContent=flaps>0.8?'Land':flaps>0.2?'Start':'Inne';$('bombAntal').textContent=String(bomberKvar);$('forare').hidden=!sight;}
$('hjul').onclick=()=>{if(paMarken&&gearMal>0.5){$('status').textContent='Hjulen ska vara nere på marken';return;}gearMal=gearMal>0.5?0:1;synkaReglage();};
$('klaff').onclick=()=>{flaps=flaps<0.2?0.45:flaps<0.7?1:0;synkaReglage();$('status').textContent=flaps>0.8?'Landningsklaff ute':flaps>0.2?'Startklaff ute':'Klaffen inne';};
function fallBomb(){if(!bomberKvar){$('status').textContent='Inga bomber kvar';return false;}fyllHast(hast,fm);const ok=bomber.fall(aircraft.position,{x:hast.x,y:hast.y,z:hast.z},227);if(!ok)return false;bomberKvar--;synkaReglage();$('status').textContent='Bomb fälld';return true;}
$('fall').onclick=fallBomb;
const Zon=C.gyro_zon;
$('sensitivity').min=Zon.kanslighet_min;$('sensitivity').max=Zon.kanslighet_max;$('sensitivity').step=Zon.kanslighet_steg;$('sensitivity').value=settings.kanslighet;$('sensitivity').oninput=e=>settings.kanslighet=+e.target.value;
const rollStyr=$('rollTroskel'),rollTal=$('rollTal');
rollStyr.min=Zon.troskel_min_grader;rollStyr.max=Zon.troskel_max_grader;rollStyr.step=Zon.troskel_steg_grader;rollStyr.value=settings.roll_troskel_grader;
function visaTroskel(){rollTal.textContent=Math.round(settings.roll_troskel_grader)+'°';}
visaTroskel();rollStyr.oninput=e=>{settings.roll_troskel_grader=+e.target.value;visaTroskel();};
const names={gyro:'Gyrostyrning',nivellering:'Automatisk nivellering',krasch:'Krasch vid markkontakt',skjutning:'Vingvapen',mal:'Målballonger',markskydd:'Mjukt markskydd',haptik:'Vibrationer',ljud:'Ljud',skada:'Skada',led:'Ledmarkör'};
for(const [key,name]of Object.entries(names)){const label=document.createElement('label');label.textContent=name;const box=document.createElement('input');box.type='checkbox';box.checked=!!settings.brytare[key];box.dataset.nyckel=key;box.onchange=()=>{settings.brytare[key]=box.checked;if(key==='gyro'){input.active=box.checked;styrLage=box.checked?'gyro':'finger';center();if(box.checked&&running)gyro.start();else gyro.stop();}if(key==='haptik')haptics.sync();if(key==='ljud'){if(box.checked)void seTillLjud();else{motorKanal.tyst();skottKanal.tyst();mekanik.tyst();}}};label.append(box);$('toggles').append(label);}
function visaMeny(oppna){$('settings').hidden=!oppna;$('settingsButton').setAttribute('aria-expanded',String(!!oppna));}
$('settingsButton').onclick=()=>visaMeny($('settings').hidden);$('closeSettings').onclick=()=>visaMeny(false);
function stopFire(){firing=false;$('fire').classList.remove('firing');skottKanal.tyst();}
function hallAvtryckare(){if(!running)return skottKanal.antal();firing=true;$('fire').classList.add('firing');shotSound();return skottKanal.antal();}
function slappAvtryckare(){stopFire();return skottKanal.antal();}
$('fire').onpointerdown=e=>{e.preventDefault();if(!running)return;firing=true;$('fire').classList.add('firing');try{$('fire').setPointerCapture(e.pointerId);}catch{}void seTillLjud();};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('fire').addEventListener(event,stopFire);
addEventListener('blur',stopFire);
function doljSpel(){stopFire();gyro.stop();if(audio&&audio.state==='running'){const p=audio.suspend();if(p&&typeof p.catch==='function')p.catch(()=>{});}}
function visaSpel(){if(!running)return;input.center();if(settings.brytare.gyro&&input.active)gyro.start();void seTillLjud();}
if(!globalThis.__flygLiv){globalThis.__flygLiv=true;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)doljSpel();else visaSpel();});
 addEventListener('pagehide',()=>{stopFire();gyro.stop();stangLjud();});
 addEventListener('pageshow',()=>{if(running)void seTillLjud();});
 addEventListener('ww2-native-lifecycle',e=>{if(e.detail?.active===false)doljSpel();else visaSpel();});
}
function malLista(){const lista=[];if(opp.state.laddad)lista.push({id:'fiende',center:opp.group.position,radie:C.motstandare.traff_radie_m,agare:'fiende',lever:opp.state.lever&&opp.group.visible});
 lista.push({id:'spelare',center:aircraft.position,radie:C.motstandare.traff_radie_m,agare:'spelare',lever:running&&!fm.crashed});
 if(settings.brytare.mal)for(const t of targets)if(t.mesh.visible)lista.push({id:'ballong',ref:t,center:t.mesh.position,radie:C.vapen.traff_radie,agare:'mal',lever:true});return lista;}
function behandla(h){if(h.id==='fiende'){opp.traff(1);hits++;hitUntil=time+.23;haptics.hit();if(!opp.state.lever){$('seger').hidden=false;$('status').textContent='Fw 190 nedskjuten';}}
 else if(h.id==='spelare'){const ut=traffPaSpelare(spelareHp,!!settings.brytare.skada,1);if(!settings.brytare.skada)return;spelareHp=ut.hp;skadaTill=time+.45;$('skada').style.opacity='.85';haptics.hit();if(ut.ned&&!fm.crashed)nedskjuten();}
 else if(h.ref){h.ref.down=time+C.vapen.aterkomst_s;h.ref.mesh.visible=false;hits++;hitUntil=time+.23;haptics.hit();}}
function shoot(){shots++;guns.model=currentModel;fyllHast(hast,fm);guns.fire(forward,hast,aircraft,null,'spelare');haptics.shot('tung','kulspruta');shotSound();}
function placeReticle(x,y){const r=Math.tan(RING)/Math.tan(K.fov_grader*Math.PI/360)*innerHeight/2;$('reticleGlow').setAttribute('transform',`translate(${x} ${y})`);$('ringGlow').setAttribute('r',r);$('ringB').setAttribute('r',r);sikteState.cx=x;sikteState.cy=y;sikteState.ring=r;}
function uppdateraSikte(view){if(!sight)return;cockpitCam.getWorldPosition(aimPoint);forward.set(0,0,-1).applyQuaternion(aircraft.quaternion);aimPoint.addScaledVector(forward,8000);projected.copy(aimPoint).project(cockpitCam);
 const x=(projected.x*.5+.5)*innerWidth,y=(-projected.y*.5+.5)*innerHeight;placeReticle(x,y);
 const visa=settings.brytare.led&&opp.state.laddad&&opp.state.lever;
 if(!visa){$('ledGrupp').setAttribute('visibility','hidden');sikteState.synlig=false;return;}
 fyllHast(oppHast,opp.fm);const led=sikteLed(aircraft.position,{x:opp.fm.x,y:opp.fm.y,z:opp.fm.z},oppHast,luftdensitet(fm.y),MYNNING+Math.max(0,fm.V));
 ledPunkt.set(led.x,led.y,led.z);const lp=ledPunkt.clone().project(view);const framfor=lp.z<1;
 $('ledGrupp').setAttribute('visibility',framfor?'visible':'hidden');sikteState.synlig=framfor;sikteState.vinkel=led.vinkel;sikteState.avstand=led.R;
 if(!framfor)return;const mx=(lp.x*.5+.5)*innerWidth,my=(-lp.y*.5+.5)*innerHeight;sikteState.dx=mx-x;sikteState.dy=my-y;
 $('ledGrupp').setAttribute('transform',`translate(${sikteState.dx} ${sikteState.dy})`);$('avstandHint').textContent=Math.round(led.R)+' m';}
function boostPsi(){if(!motorPa)return motor.boost_tom_psi;const span=motor.boost_full_psi-motor.boost_tom_psi;return motor.boost_tom_psi+span*gas*(gas<.05?1:fm.powerFactor());}
function ritaPanel(){const rpm=motorRpm(gas,motor,propPitch,motorPa&&bransle>0);panel.rita({fart:fm.V,hojd:fm.y,vs:fm.vs,roll,pitch,gir:turnRate,kurs:heading,rpm,boost:boostPsi(),olja:motorPa?62+gas*18:20,bransle,stall:fm.stalled});return hojdvisare(fm.y);}
function spinProp(dt){const rps=propVarv(gas,motor,propPitch,motorPa&&bransle>0);propNav+=rps*Math.PI*2*dt;for(const n of propNoder)n.rotateZ(rps*Math.PI*2*dt);const t=Math.min(1,Math.max(0,(rps-6)/18));if(blur)blur.mat.opacity=motorPa?(.12+t*.7):0;for(const n of propNoder)n.traverse(o=>{if(o.isMesh&&o.material){o.material.opacity=motorPa?1-t*.92:0;o.material.depthWrite=t<.35;}});}
function crash(){fm.crashed=true;stopFire();crashInfo={fart_kmh:Math.round(fm.V*3.6),vinkel_grader:Math.round(-fm.gamma*180/Math.PI)};const p=aircraft.position.clone();p.y=height(p.x,p.z)+.3;fm.y=height(fm.x,fm.z)+4;aircraft.position.set(fm.x,fm.y,fm.z);aircraft.rotation.set(0,heading,0,'YXZ');
 effects.spela('traff_mark',{pos:p,laddning_g:C.krasch.laddning_g,kaliber_mm:20,underlag:'torr'});crashFx=effects.spela('brand_rok',{pos:p,fas:'brinner',skala:C.krasch.brand_skala});
 visual.visible=false;if(sight)setSight(false);haptics.hit();$('crashEyebrow').textContent='STÖRTAT';$('crashTitle').textContent='Planet störtade';$('crashText').textContent=`Planet störtade i ${crashInfo.fart_kmh} km/h, ${crashInfo.vinkel_grader}° mot marken.`;$('crashPanel').hidden=false;$('status').textContent='Störtade';}
function nedskjuten(){fm.crashed=true;stopFire();const p=aircraft.position.clone();effects.spela('traff_mark',{pos:p,laddning_g:2200,kaliber_mm:20,underlag:'torr'});crashFx=effects.spela('brand_rok',{pos:p,fas:'brinner',skala:1.3});
 visual.visible=false;if(sight)setSight(false);$('crashEyebrow').textContent='NEDSKJUTEN';$('crashTitle').textContent='Du blev nedskjuten';$('crashText').textContent='Fw 190 träffade dig. Tryck Flyg igen.';$('crashPanel').hidden=false;$('status').textContent='Nedskjuten';}
function styrText(){if(styrLage==='nekad')return 'Gyro nekades · dra med fingret';if(!settings.brytare.gyro||!input.active||styrLage==='finger')return 'Dra i bilden för att flyga · Centrera rätar upp';if(lastInput?.source==='tyst')return 'Sensorn svarar inte · håll kvar och tryck Centrera';return 'Luta för att flyga · vrid för sidroder · Centrera nollställer';}
function ritaJakt(){if(sight||!running)return null;return jaktPanel.rita({fart:fm.V,hojd:fm.y,vs:fm.vs,roll,pitch,nz:fm.nz,stall:fm.stalled});}
function skrivHud(){const fwAvst=opp.state.laddad&&opp.group.visible?(()=>{const d=opp.group.position.distanceTo(aircraft.position);return ' · Fw '+(d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.round(d)+' m');})():'';$('flightHud').textContent=`${Math.round(fm.V*3.6)} km/h · ${Math.round(fm.y)} m · ${fm.vs>=0?'+':''}${fm.vs.toFixed(0)} m/s${fwAvst}${fm.stalled?' · STALL':''}${Number.isFinite(fm.nz)?' · '+fm.nz.toFixed(1)+' G':''}`;$('flightHud').classList.toggle('stall',!!fm.stalled);if(time<statusLas)return;const agl=fm.y-height(fm.x,fm.z);const stallText=C.instrument.stall_status;$('status').textContent=fm.stalled?stallText:fm.y>8000?'Tunn luft · taket närmar sig':fm.y>6000?'Tunn luft · stigningen avtar':paMarken?(landInfo?landInfo+' · stäng gasen och bromsa, full gas för ny start':(fm.V>30?'Rullar · dra lätt vid 160 km/h':'På marken · full gas, håll rakt med sidrodret')):agl<60?(gearPos>0.85?(flaps>0.8?'Inflygning · håll under 220 km/h, sjunk mjukt':'Lågflyg · landningsklaff ute ger mjukare landning'):'Lågflyg · hjul ut för att landa'):styrText();}
function logic(dt){gyro.update(dt);lastInput=input.read();if(input.pending&&!zonVantade)nollZon(zonTillstand);zonVantade=!!input.pending;let pitchCmd=lastInput.pitch;if(lutningTvang&&Number.isFinite(lutningTvang.pitch))pitchCmd=lutningTvang.pitch;else if(!settings.brytare.nivellering)pitchCmd=dampCritical(pitchSpring,pitchCmd,dt,C.styrning.kritisk_omega);const lutning=lutningTvang?lutningTvang.roll:(lastInput.pose.roll+(gyro.drag?.x||0));const rollHast=lutningTvang&&Number.isFinite(lutningTvang.rollRate)?lutningTvang.rollRate:lastInput.rollHast;const komm=styrKommando(zonTillstand,{roll:lutning,rollRate:rollHast,pitch:pitchCmd},dt,C.gyro_zon,fm.A,{kanslighet:settings.kanslighet,nivellering:!!settings.brytare.nivellering,troskel:settings.roll_troskel_grader});
 if(Math.abs(gearPos-gearMal)>0.002)gearPos=Math.max(0,Math.min(1,gearPos+Math.sign(gearMal-gearPos)*dt/2.4));
 const markFore=height(fm.x,fm.z);
 // Sidroder: pedalerna vinner, annars gyrots vridning. Propellerstigningen följer farten automatiskt (fin vid låg fart, grov vid hög).
 roder=Math.max(-1,Math.min(1,(pedalRoder!==0?pedalRoder:(lastInput.roder||0))+(komm.roderHjalp||0)));
 propPitch+=(Math.max(0.12,Math.min(0.9,(fm.V-32)/145))-propPitch)*Math.min(1,dt*1.5);
 fm.tillampaNivellering(!!settings.brytare.nivellering);fm.step(dt,komm.input,motorPa?gas:0,undefined,{motorPa,gear:gearPos,flaps,pitch:propPitch,roder,paMarken,markY:markFore,broms:C.landning.broms_n});
 if(paMarken&&fm.lyftAv){paMarken=false;if(fm.lyft)fm.lyft(0.08);else fm.gamma=0.08;fm.y=markFore+2.4;landInfo='';$('status').textContent='I luften. Hjul in när du har höjd.';}
 const at=fm.attitude();pitch=at.pitch;roll=at.roll;heading=at.yaw;loadFactor=fm.nz;turnRate=fm.V>1?fm.nz*9.80665*Math.sin(roll)/fm.V:0;turnRadius=Math.abs(turnRate)>1e-5?fm.V/Math.abs(turnRate):Infinity;
 aircraft.position.set(fm.x,fm.y,fm.z);sattKropp();forward.set(0,0,-1).applyQuaternion(aircraft.quaternion);
 const markY=height(fm.x,fm.z),agl=fm.y-markY;
 // Landning: hjulen ute, farten under maxfart, vingarna plana, sjunk mildare än hårdgränsen. Mjuk landning sätter ner planet,
 // hård landning studsar och varnar, allt annat är en krasch. Utan hjul eller för fort gäller vanlig markkontakt.
 const L=C.landning;
 if(!paMarken&&gearPos>0.85&&agl<1.8&&fm.V<L.max_fart_ms&&Math.abs(roll)<L.max_bank_rad&&fm.vs>L.hard_vs_ms){
  if(fm.vs>L.mjuk_vs_ms){landInfo=fm.vs>-1.2?'Mjuk landning':'Landade';paMarken=true;fm.y=markY+1.35;fm.gamma=0;fm.vs=0;if(fm.kvaternion)fm.vy=0;aircraft.position.y=fm.y;haptics.hit();}
  else{if(fm.kvaternion)fm.vy=-fm.vs*0.35;else{fm.vs=-fm.vs*0.35;fm.gamma=Math.abs(fm.gamma)*0.5;}fm.y=markY+2.2;haptics.hit();landInfo='Hård landning – studs';statusLas=time+2.5;$('status').textContent='Hård landning! Håll nosen uppe och sätt ner mjukare.';}
 }
 else if(!paMarken&&agl<C.krasch.kontakt_m){if(settings.brytare.markskydd||!settings.brytare.krasch){fm.y=markY+C.krasch.kontakt_m;if(fm.vs<0)fm.vs=0;if(fm.kvaternion&&fm.vy<0)fm.vy=0;fm.gamma=Math.max(0,fm.gamma);}else crash();}
 if(Math.hypot(fm.x-markX,fm.z-markZ)>180){markX=fm.x;markZ=fm.z;mark.place(fm.x,fm.z);}
 if(firing&&settings.brytare.skjutning&&time>=nextShot){shoot();nextShot=time+C.vapen.intervall_s;}
 if(motorKanal.spelar()&&audio){const nu=audio.currentTime||0;motorKanal.takt(motorPa?(.55+gas*.7):.2,nu);motorKanal.volym(motorPa?C.ljud.motor_volym*(.4+gas*.6):0,nu);}
 if(fm.stalled&&time>stallBuzz){haptics.hit();stallBuzz=time+.35;}
 opp.update(dt,fm,time);
 skrivHud();
}
function pil(view){const el=$('fiendePil');if(!opp.state.laddad||!opp.state.lever||!opp.group.visible){el.hidden=true;return;}
 const p=opp.group.position.clone().project(view);let x=p.x,y=p.y;if(p.z>1){x=-x;y=-y;}
 const sx=(x*.5+.5)*innerWidth,sy=(-y*.5+.5)*innerHeight,m=36,inne=p.z<1&&sx>m&&sx<innerWidth-m&&sy>m&&sy<innerHeight-m;
 if(inne){el.hidden=true;return;}el.hidden=false;const ang=Math.atan2(sy-innerHeight/2,sx-innerWidth/2),dx=Math.cos(ang),dy=Math.sin(ang);
 const cx=innerWidth/2,cy=innerHeight/2;let t=1e9;if(dx>1e-4)t=Math.min(t,(innerWidth-m-cx)/dx);else if(dx<-1e-4)t=Math.min(t,(m-cx)/dx);if(dy>1e-4)t=Math.min(t,(innerHeight-m-cy)/dy);else if(dy<-1e-4)t=Math.min(t,(m-cy)/dy);
 const jaktTopp=$('jaktpanel')&&!$('jaktpanel').hidden?$('jaktpanel').getBoundingClientRect().top:innerHeight-120;
 const menyEl=$('settings'),menyOppet=menyEl&&!menyEl.hidden,menyBotten=menyOppet?menyEl.getBoundingClientRect().bottom:($('settingsButton')?.getBoundingClientRect().bottom||8);
 const tak=menyBotten+6,golv=Math.min(innerHeight-120,jaktTopp-10);
 const left=Math.max(72,Math.min(innerWidth-72,cx+dx*t)),top=Math.max(tak,Math.min(golv,cy+dy*t));
 el.style.left=left+'px';el.style.top=top+'px';$('fiendePilSymbol').style.transform=`rotate(${ang+Math.PI/2}rad)`;
 const d=opp.group.position.distanceTo(aircraft.position);$('fiendePilText').textContent='Fw 190 · '+(d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.round(d)+' m');}
function present(dt){spinProp(dt);if(!running)forward.set(0,0,-1).applyQuaternion(aircraft.quaternion);
 roderVy?.uppdatera(dt,{roll:fm.da||0,pitch:fm.de||0,roder,klaff:flaps});
 const kurs=fm.kvaternion?fm.kameraKurs(dt):heading;cameraTarget.copy(aircraft.position);cameraTarget.x-=Math.sin(kurs)*C.kamera.framfor;cameraTarget.z-=Math.cos(kurs)*C.kamera.framfor;smoothTarget.lerp(cameraTarget,1-Math.exp(-dt/C.kamera.utjamning_s));
 for(let i=0;i<targets.length;i++){const target=targets[i];target.mesh.visible=settings.brytare.mal&&time>=target.down;target.mesh.position.x=target.base.x+Math.sin(time*.25+i)*C.vapen.mal_svaj;target.mesh.position.y=target.base.y+Math.sin(time*.4+i)*8;
  const distance=target.mesh.position.distanceTo(camera.position),near=THREE.MathUtils.smoothstep(distance,C.vapen.lod_enkel_m*.85,C.vapen.lod_enkel_m*1.15),far=THREE.MathUtils.smoothstep(distance,C.vapen.lod_billboard_m*.85,C.vapen.lod_billboard_m*1.15),weights=[1-near,near*(1-far),far];target.levels.forEach((level,n)=>{level.visible=weights[n]>.01;level.material.opacity=weights[n];});}
 shadow.position.set(aircraft.position.x,height(aircraft.position.x,aircraft.position.z)+.7,aircraft.position.z);shadow.rotation.z=heading;shadow.material.opacity=Math.max(.03,.3-(aircraft.position.y-shadow.position.y)*.001);
 cam.sattVy({mal:[smoothTarget.x,smoothTarget.z],d:C.kamera.avstand,lutning:C.kamera.lutning,kurs:-THREE.MathUtils.radToDeg(kurs)});cam.uppdatera(dt);
 const agl=Math.max(0,aircraft.position.y-height(aircraft.position.x,aircraft.position.z));const dim=mark.himmel(bombVy&&bombCam?bombCam:sight?cockpitCam:camera,agl);
 scene.fog.color.copy(dim.farg);scene.fog.near=dim.near;scene.fog.far=dim.far;scene.background.copy(dim.farg);
 camera.far=120000;camera.updateProjectionMatrix();cockpitCam.far=120000;cockpitCam.updateProjectionMatrix();if(bombCam){bombCam.far=120000;bombCam.aspect=innerWidth/innerHeight;bombCam.updateProjectionMatrix();}
 const skak=running?Math.max(0,1-agl/85)*Math.min(1,Math.max(0,fm.V-30)/110):0,amp=skak*.2;
 if(sight)cockpitCam.position.set(K.oga_lokal[0]+Math.sin(time*43)*amp*.35,K.oga_lokal[1]+Math.sin(time*51)*amp*.25,K.oga_lokal[2]);
 else if(amp){camera.position.x+=Math.sin(time*37)*amp;camera.position.y+=Math.sin(time*47)*amp*.55;}
 synkaReglage();skrivHud();if(bombVy&&nedslag){const ok=running&&!paMarken&&beraknaNedslag();nedslag.visible=ok;const n=mal?.narmaste(aircraft.position,fm.psi);if(n&&time>=statusLas){const km=(n.avstand/1000).toFixed(1).replace('.',','),grader=Math.round(Math.abs(THREE.MathUtils.radToDeg(n.rel)));const nedAvst=ok?Math.round(Math.hypot(nedslag.position.x-n.mal.x,nedslag.position.z-n.mal.z)):null;$('status').textContent=`${n.mal.namn} ${km} km · ${grader<4?'rakt fram':grader+'° '+(n.rel>0?'höger':'vänster')}`+(nedAvst!==null?` · ringen ${nedAvst} m från målet`:'');statusLas=time+.4;}}const view=bombVy&&bombCam?bombCam:sight?cockpitCam:camera;uppdateraSikte(view);pil(view);$('hit').style.opacity=time<hitUntil?'1':'0';if(time>skadaTill)$('skada').style.opacity='0';
 renderer.render(scene,view);
}
function beraknaNedslag(){fyllHast(hast,fm);let x=aircraft.position.x,y=aircraft.position.y-1.2,z=aircraft.position.z,vx=hast.x,vy=hast.y-2,vz=hast.z;for(let i=0;i<400;i++){const dt=0.08,drag=0.06*dt;vx*=1-drag;vz*=1-drag;vy-=9.81*dt;x+=vx*dt;y+=vy*dt;z+=vz*dt;const m=height(x,z);if(y<=m+0.5){nedslag.position.set(x,m+1.5,z);return true;}}return false;}
function setBombVy(on){bombVy=!!on&&!!bombCam;if(bombVy){sight=false;$('cockpit').hidden=true;$('reticle').hidden=true;document.body.classList.remove('cockpitvy');synkaVyKnapp();} $('bombsikte')?.setAttribute('aria-pressed',String(bombVy));if(model)model.traverse(o=>{if(o.isMesh)o.visible=!(bombVy||sight);});if(blur)blur.mesh.visible=!(bombVy||sight);roderVy?.synlig(!(bombVy||sight));nedslag.visible=bombVy;placeraHorisont();}
function bomberUpp(dt){bomber.uppdatera(dt,height,(b,markY)=>{bombTraff=time+1.4;const t=mal?.traff(b.x,b.z,b.massa);if(t){$('status').textContent=t;statusLas=time+3;haptics.hit();}const u=mal?.uppdragStatus();if(u?.klart&&!uppdragKlart){uppdragKlart=true;const ruta=$('seger');const h=ruta.querySelector('h2');const p=ruta.querySelector('p');if(h)h.textContent='Uppdraget är klart';if(p)p.textContent='Alla markmål är slagna. Flyg hem och landa, eller tryck Ny strid.';ruta.hidden=false;$('status').textContent='Uppdrag klart. Flyg hem och landa.';statusLas=time+6;}effects.spela('traff_mark',{pos:new THREE.Vector3(b.x,markY+.4,b.z),laddning_g:Math.round(b.massa*180),kaliber_mm:200,underlag:'torr'});});}
function tick(dt){time+=dt;if(running&&!fm.crashed)logic(dt);if(running&&!fm.crashed&&mal){fyllHast(hast,fm);mal.uppdatera(dt,{pos:aircraft.position,vel:{x:hast.x,y:hast.y,z:hast.z}},Math.max(0,fm.y-height(fm.x,fm.z)),()=>behandla({id:'spelare'}),time);}bomberUpp(dt);const traffar=guns.update(dt,malLista());if(running)for(const h of traffar)behandla(h);present(dt);panelAcc+=dt;if(panelAcc>=.1){panelAcc=0;if(sight)ritaPanel();else if(running)ritaJakt();}}
let previous=performance.now();renderer.setAnimationLoop(now=>{const elapsed=Math.max(.001,(now-previous)/1000),dt=Math.min(.05,elapsed);previous=now;tick(dt);frameCount++;frameTime+=elapsed;if(frameTime>.5){fps=frameCount/frameTime;frameCount=frameTime=0;$('metrics').textContent=`${fps.toFixed(0)} FPS · ${renderer.info.render.calls} anrop · ${Math.round(renderer.info.render.triangles/1000)}k tris · GPU≈${gpuEstimateMB.toFixed(0)} MB`;}});
const gpuEstimateMB=(modelInfo.triangles*96+opp.state.tris*48+1024*1024*4*1.34)/1048576;
function sattHojd(m){fm.y=m;aircraft.position.y=m;const v=ritaPanel();return v;}
function klattra(malH=10700){running=false;paMarken=false;motorPa=true;gearPos=gearMal=0;flaps=0;propPitch=0.35;fm.crashed=false;fm.reset(0,Math.max(200,height(0,0)+30),0,110);fm.gamma=.1;let steg=0;while(fm.y<malH&&steg<50000){const spak=Math.max(-.2,Math.min(.28,(fm.V-78)*.018));fm.A.niva_k=1;fm.step(.05,{pitch:spak,roll:0},1,undefined,{motorPa:true,gear:0,flaps:0,pitch:propPitch});if(fm.stalled&&fm.y<malH*.5)fm.alpha*=.8;if(fm.y<height(fm.x,fm.z)+3)break;steg++;}
 const at=fm.attitude();aircraft.position.set(fm.x,fm.y,fm.z);pitch=at.pitch;roll=at.roll;heading=at.yaw;sattKropp();mark.place(fm.x,fm.z);return fm.y;}
 function sittKors(avstand,vt,hojd=400){fm.V=0;fm.gamma=0;fm.psi=0;fm.x=0;fm.z=0;fm.y=hojd;aircraft.position.set(0,hojd,0);aircraft.rotation.set(0,0,0);opp.fm.x=0;opp.fm.y=hojd;opp.fm.z=-avstand;opp.fm.V=vt;opp.fm.gamma=0;opp.fm.psi=Math.PI/2;opp.state.lever=true;opp.group.visible=true;opp.group.position.set(0,hojd,-avstand);opp.group.rotation.set(0,Math.PI/2,0);setSight(true);aircraft.updateMatrixWorld(true);uppdateraSikte(cockpitCam);return {...sikteState};}
function provLed(medLed){guns.rensa();const R=200,vt=120,y=400,t=flygtid(R,luftdensitet(y),MYNNING);fm.V=0;fm.gamma=0;fm.psi=0;fm.crashed=false;fm.x=0;fm.z=0;fm.y=y;aircraft.position.set(0,y,0);aircraft.rotation.set(0,0,0);forward.set(0,0,-1);let x=medLed?vt*t:0,hit=false;guns.fire(forward,new THREE.Vector3(),aircraft,null,'spelare');
 for(let i=0;i<100&&!hit;i++){const tr=guns.update(.02,[{id:'prov',center:{x,y,z:-R},radie:C.motstandare.traff_radie_m,agare:'mal',lever:true}]);if(tr.some(h=>h.id==='prov'))hit=true;x-=vt*.02;}
 guns.rensa();return {hit,t,startX:medLed?vt*t:0};}
 function beskjut(){guns.rensa();const y=400;fm.crashed=false;fm.V=0;fm.gamma=0;fm.psi=0;fm.x=0;fm.z=0;fm.y=y;aircraft.position.set(0,y,0);aircraft.rotation.set(0,0,0);spelareHp=C.motstandare.spelare_hp;opp.group.position.set(0,y,220);opp.group.rotation.set(0,0,0);opp.group.visible=true;opp.state.lever=true;const dir=new THREE.Vector3(0,0,-1);guns.fire(dir,new THREE.Vector3(),opp.group,C.vapen.mynningar_fw190,'fiende');let traff=0;for(let i=0;i<40;i++){const tr=guns.update(.02,[{id:'spelare',center:aircraft.position,radie:C.motstandare.traff_radie_m,agare:'spelare',lever:true}]);traff+=tr.length;spelareHp=Math.max(0,spelareHp-tr.length);}guns.rensa();return {traff,spelareHp};}
function skjutNer(){guns.rensa();fm.crashed=false;fm.V=0;fm.gamma=0;fm.psi=0;fm.x=0;fm.z=0;fm.y=300;aircraft.position.set(0,300,0);aircraft.rotation.set(0,0,0);forward.set(0,0,-1);opp.state.lever=true;opp.state.hp=opp.state.max;opp.group.visible=true;opp.group.position.set(0,300,-180);let guard=0;
 while(opp.state.lever&&guard++<30){guns.fire(forward,new THREE.Vector3(),aircraft,null,'spelare');for(let s=0;s<14;s++){const tr=guns.update(.02,malLista());for(const h of tr)if(h.id==='fiende')opp.traff(1);}}
 guns.rensa();return opp.info();}
function simuleraAnfall(sek){running=true;$('startPanel').hidden=true;const startSkott=opp.state.skott;let minD=opp.group.position.distanceTo(aircraft.position);const n=Math.round(sek/.05);
 for(let i=0;i<n;i++){time+=.05;if(!fm.crashed)logic(.05);const tr=guns.update(.05,malLista());for(const h of tr)behandla(h);minD=Math.min(minD,opp.group.position.distanceTo(aircraft.position));}
 return {skott:opp.state.skott-startSkott,dist:opp.group.position.distanceTo(aircraft.position),minD,dot:opp.state.dot,led:opp.state.led,hp:opp.state.hp,spelareHp};}
 function sattRoder(v){roder=v||0;}
function sattLutning(pose){lutningTvang=pose;if(!pose)nollZon(zonTillstand);}
function zonLage(){return {lage:zonTillstand.lage,rollRate:zonTillstand.rollRate,da:fm.da,de:fm.de};}
function kor(sek){const n=Math.max(1,Math.round(sek/.05));for(let i=0;i<n;i++){time+=.05;if(running&&!fm.crashed)logic(.05);bomberUpp(.05);}synkaReglage();if(sight)ritaPanel();return {y:fm.y,psi:fm.psi,V:fm.V,paMarken,motorPa,gear:gearPos,flaps,bomber:bomberKvar,bombTraff,bransle};}
window.flygTest={get fm(){return fm;},plan:()=>currentModel,valjPlan,gimbal:gimbalProv,crash,nedskjuten,flyAgain,setSight,setBombVy,setGas,setPitch,sattHojd,ritaPanel,ritaJakt,klattra,sittKors,provLed,skjutNer,beskjut,simuleraAnfall,snurra:spinProp,hojdvisare,markstart,fallBomb,kor,sattRoder,sattLutning,zonLage,nollstallOmgang,traffa:(h)=>behandla(h),version:FLYG_VERSION,ljud:()=>ljudBehov(audio,!!settings.brytare.ljud),skottAntal:()=>skottKanal.antal(),motorAntal:()=>motorKanal.antal(),gasKlick:()=>gasKlick,mekanikAntal:()=>mekanik.antal(),mekanikSpela:(typ)=>mekanikLjud(typ),mekanikTopp,hallAvtryckare,slappAvtryckare,seTillLjud,ringRadie:RING,ballistikTabell:()=>ledTabell(1.225,[REFERENSFART]),state:()=>({crashed:fm.crashed,stalled:fm.stalled,speed_kmh:fm.V*3.6,altitude:fm.y,agl:fm.y-height(fm.x,fm.z),vs:fm.vs,running,pitch,roll,heading,gas,spelareHp,hits,shots,fps,time,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,sight,sikte:{...sikteState},prop:{nav:propNav,rps:propVarv(gas,motor,propPitch,motorPa)},fiende:opp.info(),bransle,motorPa,paMarken,gear:gearPos,gearMal,flaps,propPitch,roder,pedalRoder,bomber:bomberKvar,bombTung,tandning,primer,patroner,bombTraff,landInfo,lyssnare:input._antal,kalla:lastInput?.source||'finger',niva:fm.A.niva_k,nivaBas:fm.nivaBas,panel:$('panel').dataset}),gyro,input,settings,targets,aircraft,guns,opp,scene,camera,cockpitCam,renderer,visual,mark,bomber,mal};
$('status').textContent='Redo · tryck Starta och håll mobilen bekvämt';
const etikett=$('versionEtikett');if(etikett)etikett.textContent=FLYG_VERSION;
function placeraHorisont(){const min=44;const jakt=$('jaktpanel'),jKnapp=$('jaktHorisont');if(jKnapp){const synlig=!!(running&&!sight&&!bombVy&&jakt&&!jakt.hidden);if(!synlig)jKnapp.hidden=true;else{const r=jakt.getBoundingClientRect();if(r.width<8||r.height<8)jKnapp.hidden=true;else{const p=jaktHorisont(r.width,r.height,C.jaktpanel);const d=Math.max(min,p.r*2);jKnapp.hidden=false;jKnapp.style.left=(r.left+p.x-d/2)+'px';jKnapp.style.top=(r.top+p.y-d/2)+'px';jKnapp.style.width=d+'px';jKnapp.style.height=d+'px';}}}
 const panel=$('panel'),pKnapp=$('panelHorisont');if(pKnapp){if(!sight||!panel)pKnapp.hidden=true;else{const r=panel.getBoundingClientRect();if(r.width<8||r.height<8)pKnapp.hidden=true;else{const p=panelHorisont(r.width,r.height);const bw=Math.max(min,p.rx*2),bh=Math.max(min,p.ry*2);pKnapp.hidden=false;pKnapp.style.left=(r.left+p.x-bw/2)+'px';pKnapp.style.top=(r.top+p.y-bh/2)+'px';pKnapp.style.width=bw+'px';pKnapp.style.height=bh+'px';}}}}
function passaLayout(){applyLayout(document,layoutFor(innerWidth,innerHeight,RING,K.fov_grader,C.jaktpanel));placeraHorisont();}
passaLayout();
if($('bombsikte'))$('bombsikte').onclick=()=>setBombVy(!bombVy);
addEventListener('resize',()=>{renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);cam.storlek(innerWidth,innerHeight);cockpitCam.aspect=innerWidth/innerHeight;cockpitCam.updateProjectionMatrix();passaLayout();});
document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('selectstart',e=>e.preventDefault());
