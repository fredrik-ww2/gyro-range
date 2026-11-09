import * as THREE from 'three';
import {GLTFLoader} from '../js/vendor/loaders/GLTFLoader.js';
import {FlightInput,dampCritical} from './flight-controls.js';
import {WingGuns} from './wing-guns.js';
import {FlightModel} from './flight-model.js';
import {skapaEffekterV2d} from './effects/effekter_v2d.js';
import {KTX2Loader} from './vendor/loaders/KTX2Loader.js';
import {DRACOLoader} from './vendor/loaders/DRACOLoader.js';
import {GyroAim} from '../js/gyro.js';
import {createHaptics} from '../js/haptics.js';
import {skapaAppleKamera} from './kamera/kamera_apple_zoom_v1.js';
import {skapaMark} from './mark.js';
import {skapaMotstandare} from './motstandare.js';
import {skapaPanel,hojdvisare} from './panel.js';
import {propellerSkiva,motorRpm,propVarv} from './propeller.js';
import {ledTabell,ringRadie,sikteLed,flygtid,luftdensitet,MYNNING,REFERENSFART} from './ballistik.js';
import {skapaBomber} from './bomber.js';
import {skapaRoder} from './roder.js';
const $=id=>document.getElementById(id), began=performance.now();
const C=await fetch('./config.json?v=5').then(r=>{if(!r.ok)throw Error('Inställningar saknas');return r.json();});
const V=await fetch('./kamera/profil.json').then(r=>r.json());
const motor=C.motor, RING=ringRadie(1.225);
const settings={...C.styrning,skottkansla:1.5,hapticStyle:'auto',brytare:{...C.brytare,atergang:false,horisont:false}};
const canvas=$('spel'),renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
const pixelRatio=()=>Math.min(devicePixelRatio||1,C.varld.pixelratio,Math.sqrt(C.varld.max_render_px/(innerWidth*innerHeight)));renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xc5d4d4);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xc5d4d4);scene.fog=new THREE.Fog(0xc5d4d4,C.varld.dimma_nara,C.varld.dimma_fjarran);
scene.add(new THREE.HemisphereLight(0xe4f2ff,0x536441,2.15));const sun=new THREE.DirectionalLight(0xffedce,2.3);sun.position.set(-300,700,200);scene.add(sun);
const mark=skapaMark(THREE,scene,C.varld), height=mark.hojd;
const fm=new FlightModel(C.aero);const aircraft=new THREE.Group();scene.add(aircraft);
let markX=0,markZ=0;
function startPos(){const y=height(0,0)+C.flyg.start_hojd;fm.reset(0,y,0,C.aero.start_fart_ms);aircraft.position.set(0,y,0);aircraft.rotation.set(0,0,0);mark.place(0,0);markX=markZ=0;}
startPos();
const draco=new DRACOLoader().setDecoderPath('./vendor/libs/draco/').setDecoderConfig({type:'wasm'});
const loader=new GLTFLoader().setDRACOLoader(draco),visual=new THREE.Group();aircraft.add(visual);
let model=null,currentModel=C.standardmodell,modelInfo={triangles:0},modelLoadSerial=0,propNoder=[],propNav=0,blur=null;
function riggaProp(root){blur?.mesh.removeFromParent();propNoder=[];root.traverse(o=>{if(/propeller|spinner/i.test(o.name||''))propNoder.push(o);});
 const prop=propNoder.find(o=>/propeller/i.test(o.name||''))||propNoder[0];if(!prop)return;
 prop.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;}});
 let rad=1.9;if(prop.geometry){prop.geometry.computeBoundingBox();const s=prop.geometry.boundingBox.getSize(new THREE.Vector3());rad=Math.max(s.x,s.y)*.5;}
 blur=propellerSkiva(THREE,rad);const hub=new THREE.Group();hub.name='PropBlur';prop.parent.add(hub);hub.position.copy(prop.position);hub.quaternion.copy(prop.quaternion);hub.scale.copy(prop.scale);hub.add(blur.mesh);
}
// Roderytor (skevroder, klaff, höjdroder, sidroder) ligger i flygplanets koordinater, inte i modellens, så de sitter i aircraft-gruppen.
let roderVy=null;
function riggaRoder(def){roderVy?.grupp.removeFromParent();roderVy=def.roder?skapaRoder(THREE,aircraft,def.roder):null;}
async function selectModel(key){const serial=++modelLoadSerial,def=C.modeller[key];$('modelSelect').disabled=true;try{const gltf=await loader.loadAsync(def.fil);if(serial!==modelLoadSerial)return;const next=gltf.scene,box=new THREE.Box3().setFromObject(next,true),size=box.getSize(new THREE.Vector3()),mid=box.getCenter(new THREE.Vector3()),scale=def.spann_m/size.x;next.position.copy(mid).multiplyScalar(-scale);next.scale.setScalar(scale);
 visual.clear();if(model)model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});model=next;visual.rotation.y=def.rotation_y;visual.add(model);currentModel=key;modelInfo={bounds:size.toArray(),scale,triangles:0};model.traverse(o=>{if(o.isMesh){modelInfo.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;o.frustumCulled=true;}});riggaProp(model);riggaRoder(def);$('aircraftName').textContent=def.namn;$('modelSelect').value=key;
 }finally{$('modelSelect').disabled=false;}}
await selectModel(currentModel);
$('modelSelect').onchange=async e=>{try{await selectModel(e.target.value);if(sight)setSight(true);}catch{$('status').textContent='Modellen kunde inte laddas';}};
class FollowTarget{constructor(camera){this.camera=camera;this.target=new THREE.Vector3();}update(){this.camera.lookAt(this.target);}}
const cam=await skapaAppleKamera({THREE,OrbitControls:FollowTarget,renderer,varden:V,markHojd:()=>aircraft.position.y+C.kamera.hojd});
const camera=cam.kamera;const gyro=new GyroAim(canvas,settings,C.styrning);const input=new FlightInput(gyro,C.styrning,settings);
const atlas=await new KTX2Loader().setTranscoderPath('./vendor/libs/basis/').detectSupport(renderer).loadAsync('./effects/fx_atlas_v2d.ktx2');
const effects=skapaEffekterV2d(THREE,scene,{atlas,kamera:camera,renderer,kvalitet:'lag',ljus:false,maxPartiklar:128,markHojd:height});
const bomber=skapaBomber(THREE,scene);
const guns=new WingGuns(scene,aircraft,C.vapen,effects);
const opp=skapaMotstandare(THREE,{scene,loader,config:C,aero:C.aero,motor,guns,effects,hojd:height});
await opp.load();opp.reset(fm);
const panel=skapaPanel($('panel'));
const pitchSpring={x:0,v:0},bankSpring={x:0,v:0};let lastInput=null,turnRate=0,loadFactor=1,turnRadius=Infinity,sight=false;
const K=C.cockpit,cockpitCam=new THREE.PerspectiveCamera(K.fov_grader,innerWidth/innerHeight,K.nara_m,120000);cockpitCam.position.set(...K.oga_lokal);aircraft.add(cockpitCam);
const vyKnapp={sikte:'Bakom',bakom:'Sikte'};
function setSight(on){sight=on;const nasta=vyKnapp[sight?'sikte':'bakom'];$('sight').setAttribute('aria-pressed',String(sight));$('sight').setAttribute('aria-label','Byt till '+nasta);$('sightLabel').textContent=nasta;$('cockpit').hidden=!sight;$('reticle').toggleAttribute('hidden',!sight);document.body.classList.toggle('cockpitvy',sight);
 if(model)model.traverse(o=>{if(o.isMesh)o.visible=!sight;});if(blur)blur.mesh.visible=!sight;roderVy?.synlig(!sight);if(sight)ritaPanel();}
$('sight').onclick=()=>setSight(!sight);
const haptics=createHaptics({medel:{varaktighet_ms:35},tung:{varaktighet_ms:45}},settings);
const send=m=>window.ReactNativeWebView?.postMessage(JSON.stringify(m));send({type:'bridge-ready',version:1});haptics.sync();
$('back').href='../'+location.search;
const targets=[],sphere=new THREE.SphereGeometry(C.vapen.mal_radie,12,8),simpleSphere=new THREE.SphereGeometry(C.vapen.mal_radie,8,6);
const balloonCanvas=document.createElement('canvas');balloonCanvas.width=balloonCanvas.height=64;const balloonPaint=balloonCanvas.getContext('2d');const gradient=balloonPaint.createRadialGradient(24,20,2,32,32,30);gradient.addColorStop(0,'#d99b7a');gradient.addColorStop(.8,'#b45e44');gradient.addColorStop(1,'#6f392e');balloonPaint.fillStyle=gradient;balloonPaint.beginPath();balloonPaint.ellipse(32,32,24,31,0,0,Math.PI*2);balloonPaint.fill();const balloonTexture=new THREE.CanvasTexture(balloonCanvas);balloonTexture.colorSpace=THREE.SRGBColorSpace;
for(let i=0;i<C.vapen.mal_antal;i++){const mesh=new THREE.Group(),levels=[];for(const geometry of [sphere,simpleSphere]){const item=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0xb45e44,transparent:true}));item.scale.set(.8,1.25,.8);mesh.add(item);levels.push(item);}const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:balloonTexture,transparent:true}));sprite.scale.set(C.vapen.mal_radie*1.6,C.vapen.mal_radie*2.5,1);mesh.add(sprite);levels.push(sprite);mesh.position.set(Math.sin(i*2)*140,C.flyg.start_hojd+Math.sin(i)*32,-C.vapen.mal_avstand-i*C.vapen.mal_mellanrum);scene.add(mesh);targets.push({mesh,levels,base:mesh.position.clone(),down:0});}
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const shadowPaint=shadowCanvas.getContext('2d'),shade=shadowPaint.createRadialGradient(32,32,2,32,32,31);shade.addColorStop(0,'#0009');shade.addColorStop(1,'#0000');shadowPaint.fillStyle=shade;shadowPaint.fillRect(0,0,64,64);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(20,14),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
let stallBuzz=0,running=false,firing=false,gas=C.flyg.gas,pitch=0,roll=0,heading=0,hits=0,shots=0,nextShot=0,hitUntil=0,time=0,fps=0,frameCount=0,frameTime=0,spelareHp=C.motstandare.spelare_hp,skadaTill=0,bransle=1,panelAcc=0;
// Flygprov 05: motorn går alltid, propellerstigningen sköts automatiskt, bränslet tar inte slut. Pedalerna eller gyrots vridning ger sidroder.
let motorPa=true,tandning=true,primer=0,patroner=3,paMarken=false,roder=0,pedalRoder=0,propPitch=0.4,gearPos=0,gearMal=0,flaps=0,bomberKvar=2,bombTung=false,bombTraff=0,landInfo='';
let audio=null,motorLjud=null,motorGain=null,buffers={},voices=[];
async function unlockAudio(){
 try{if(navigator.audioSession)navigator.audioSession.type='playback';else if(!window.__tystBrytare){const n=22050,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,n,true);v.setUint32(28,n*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);const a=document.createElement('audio');a.setAttribute('playsinline','');a.setAttribute('x-webkit-airplay','deny');a.loop=true;a.src=URL.createObjectURL(new Blob([b],{type:'audio/wav'}));window.__tystBrytare=a;a.play().catch(()=>{});}else window.__tystBrytare.play().catch(()=>{});}catch{}
 if(!settings.brytare.ljud)return;
 if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();const silent=audio.createBufferSource();silent.buffer=audio.createBuffer(1,1,22050);silent.connect(audio.destination);silent.start();}
 await audio.resume();
 try{for(const key of ['motor','skott'])if(!buffers[key]){const data=await fetch(C.ljud[key]).then(r=>{if(!r.ok)throw Error('Ljudfil saknas');return r.arrayBuffer();});buffers[key]=await audio.decodeAudioData(data);}
 if(!motorLjud&&running&&settings.brytare.ljud){motorLjud=audio.createBufferSource();motorLjud.buffer=buffers.motor;motorLjud.loop=true;motorLjud.loopEnd=C.ljud.motor_loop_end;motorGain=audio.createGain();motorGain.gain.value=C.ljud.motor_volym;motorLjud.connect(motorGain).connect(audio.destination);motorLjud.start();}
 }catch{$('status').textContent='Flyg klart · ljud kunde inte laddas';}
}
function stopMotor(){if(motorLjud){try{motorLjud.stop();}catch{}motorLjud=null;}}
function shotSound(){if(!audio||!buffers.skott||!settings.brytare.ljud)return;while(voices.length>=C.ljud.roster-1){try{voices.shift().stop();}catch{}}
 const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffers.skott;gain.gain.value=C.ljud.skott_volym;source.connect(gain).connect(audio.destination);voices.push(source);source.onended=()=>{voices=voices.filter(v=>v!==source);source.disconnect();gain.disconnect();};source.start();}
const forward=new THREE.Vector3(),cameraTarget=new THREE.Vector3(),smoothTarget=new THREE.Vector3(0,C.flyg.start_hojd,0),hast=new THREE.Vector3(),oppHast=new THREE.Vector3(),aimPoint=new THREE.Vector3(),projected=new THREE.Vector3(),ledPunkt=new THREE.Vector3();
let sikteState={cx:0,cy:0,ring:0,dx:0,dy:0,vinkel:0,avstand:0,synlig:false};
function fyllHast(target,model){const ch=Math.cos(model.gamma);target.set(-Math.sin(model.psi)*ch*model.V,Math.sin(model.gamma)*model.V,-Math.cos(model.psi)*ch*model.V);return target;}
function center(){input.center();pitchSpring.x=pitchSpring.v=bankSpring.x=bankSpring.v=0;}
let crashFx=null,crashInfo=null;
function flygklar(){motorPa=true;tandning=true;primer=0;paMarken=false;gearMal=0;gearPos=0;flaps=0;propPitch=0.4;bomberKvar=2;bombTung=false;bransle=1;roder=0;}
function visaSpak(){$('gasreglage').hidden=false;$('pedaler').hidden=false;$('system').hidden=false;synkaReglage();}
function flyAgain(){crashFx?.stopp();crashFx=null;crashInfo=null;spelareHp=C.motstandare.spelare_hp;guns.rensa();flygklar();setGas(C.flyg.gas);setPitch(0.6);startPos();opp.reset(fm);center();visual.visible=true;setSight(sight);$('crashPanel').hidden=true;$('seger').hidden=true;smoothTarget.copy(aircraft.position);if(settings.brytare.gyro&&input.active)void gyro.start();}
$('again').onclick=flyAgain;$('nyStrid').onclick=flyAgain;
async function start(useGyro){running=true;input.active=useGyro&&settings.brytare.gyro;flygklar();setGas(C.flyg.gas);setPitch(0.6);center();$('startPanel').hidden=true;$('crashPanel').hidden=true;visaSpak();const permission=useGyro&&settings.brytare.gyro?gyro.start():null;void unlockAudio();if(permission){const result=await permission;$('status').textContent=result.orientation==='granted'?'Luta för att flyga · vrid för sidroder · Centrera nollställer':'Gyro nekades · dra med fingret';}else{$('status').textContent='Dra i bilden för att flyga · Centrera rätar upp';}}
// Start på marken med motorn igång: hjul ute, startklaff, låg gas. Ge full gas, dra försiktigt när farten passerar 160 km/h.
async function markstart(){running=true;input.active=settings.brytare.gyro;motorPa=true;tandning=true;gearMal=1;gearPos=1;flaps=0.45;propPitch=0.2;bomberKvar=2;bombTung=false;bransle=1;roder=pedalRoder=0;paMarken=true;fm.crashed=false;const y=height(0,0)+1.35;fm.reset(0,y,0,0);fm.V=0;fm.gamma=0;fm.psi=0;fm.x=0;fm.z=0;aircraft.position.set(0,y,0);aircraft.rotation.set(0,0,0);setGas(0.15);center();$('startPanel').hidden=true;$('crashPanel').hidden=true;$('seger').hidden=true;visaSpak();setSight(true);const permission=settings.brytare.gyro?gyro.start():null;void unlockAudio();if(permission)await permission;$('status').textContent='Motorn går. Full gas, håll rakt med sidrodret, dra lätt vid 160 km/h.';}
$('start').disabled=$('manual').disabled=$('kall').disabled=false;$('start').onclick=()=>start(true);$('manual').onclick=()=>start(false);$('kall').onclick=markstart;$('center').onclick=center;
function setGas(v){gas=Math.max(0,Math.min(1,+v||0));const el=$('gasreglage');el.style.setProperty('--gas',gas.toFixed(4));el.querySelectorAll('.spak').forEach(s=>s.dataset.gas=gas.toFixed(3));$('gasValue').value=Math.round(gas*100)+'%';$('throttle').value=String(gas);}
function setPitch(v){const spak=Math.max(0,Math.min(1,+v||0));propPitch=1-spak;}
setGas(gas);setPitch(0.6);
function yTill(e,el){const r=el.getBoundingClientRect();return 1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));}
function bindSpak(el,fn){el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.setPointerCapture(e.pointerId);fn(e);});el.addEventListener('pointermove',e=>{if(el.hasPointerCapture(e.pointerId))fn(e);});}
const bana=$('gasBana');
bindSpak(bana,e=>setGas(yTill(e,bana)));
$('throttle').oninput=e=>setGas(e.target.value);
function pedalNer(e,v){e.preventDefault();pedalRoder=v;e.currentTarget.classList.add('ned');e.currentTarget.setPointerCapture(e.pointerId);}
function pedalUpp(e){if(e.currentTarget.classList.contains('ned')){e.currentTarget.classList.remove('ned');pedalRoder=0;}}
$('pedalV').onpointerdown=e=>pedalNer(e,-1);$('pedalH').onpointerdown=e=>pedalNer(e,1);
for(const ev of ['pointerup','pointercancel','lostpointercapture']){$('pedalV').addEventListener(ev,pedalUpp);$('pedalH').addEventListener(ev,pedalUpp);}
function synkaReglage(){const lampa=$('hjulLampa'),ror=Math.abs(gearPos-gearMal)>0.04;lampa.className='lampa'+(ror?' rod':gearPos>0.92?' gron':'');$('hjul').setAttribute('aria-label',ror?'Hjulen rör sig':gearPos>0.92?'Hjulen är nere och låsta':'Hjulen är uppe');$('klaffText').textContent=flaps>0.8?'Land':flaps>0.2?'Start':'Inne';$('bombAntal').textContent=String(bomberKvar);$('forare').hidden=!sight;}
$('hjul').onclick=()=>{if(paMarken&&gearMal>0.5){$('status').textContent='Hjulen ska vara nere på marken';return;}gearMal=gearMal>0.5?0:1;synkaReglage();};
$('klaff').onclick=()=>{flaps=flaps<0.2?0.45:flaps<0.7?1:0;synkaReglage();$('status').textContent=flaps>0.8?'Landningsklaff ute':flaps>0.2?'Startklaff ute':'Klaffen inne';};
function fallBomb(){if(!bomberKvar){$('status').textContent='Inga bomber kvar';return false;}fyllHast(hast,fm);const ok=bomber.fall(aircraft.position,{x:hast.x,y:hast.y,z:hast.z},227);if(!ok)return false;bomberKvar--;synkaReglage();$('status').textContent='Bomb fälld';return true;}
$('fall').onclick=fallBomb;
$('sensitivity').value=settings.kanslighet;$('sensitivity').oninput=e=>settings.kanslighet=+e.target.value;
const names={gyro:'Gyrostyrning',nivellering:'Automatisk nivellering',krasch:'Krasch vid markkontakt',skjutning:'Vingvapen',mal:'Målballonger',markskydd:'Mjukt markskydd',haptik:'Vibrationer',ljud:'Ljud',skada:'Skada (ingen game over)',led:'Ledmarkör'};
for(const [key,name]of Object.entries(names)){const label=document.createElement('label');label.textContent=name;const box=document.createElement('input');box.type='checkbox';box.checked=!!settings.brytare[key];box.onchange=()=>{settings.brytare[key]=box.checked;if(key==='gyro'){input.active=box.checked;center();if(box.checked&&running)void gyro.start();else gyro.stop();}if(key==='haptik')haptics.sync();if(key==='ljud'){if(box.checked)void unlockAudio();else{stopMotor();for(const source of voices)source.stop();voices=[];}}};label.append(box);$('toggles').append(label);}
$('settingsButton').onclick=()=>{$('settings').hidden=!$('settings').hidden;};$('closeSettings').onclick=()=>{$('settings').hidden=true;};
function stopFire(){firing=false;$('fire').classList.remove('firing');}
$('fire').onpointerdown=e=>{e.preventDefault();if(!running)return;firing=true;$('fire').classList.add('firing');$('fire').setPointerCapture(e.pointerId);void unlockAudio();};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('fire').addEventListener(event,stopFire);
addEventListener('blur',stopFire);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopFire();gyro.stop();audio?.suspend();}else if(running){if(settings.brytare.gyro)void gyro.start();audio?.resume();}});
addEventListener('pagehide',()=>{stopFire();gyro.stop();stopMotor();audio?.close();});
addEventListener('ww2-native-lifecycle',e=>{if(e.detail?.active===false){stopFire();audio?.suspend();}else if(running){center();if(settings.brytare.gyro)void gyro.start();audio?.resume();}});
function malLista(){const lista=[];if(opp.state.laddad)lista.push({id:'fiende',center:opp.group.position,radie:C.motstandare.traff_radie_m,agare:'fiende',lever:opp.state.lever&&opp.group.visible});
 lista.push({id:'spelare',center:aircraft.position,radie:C.motstandare.traff_radie_m,agare:'spelare',lever:running&&!fm.crashed});
 if(settings.brytare.mal)for(const t of targets)if(t.mesh.visible)lista.push({id:'ballong',ref:t,center:t.mesh.position,radie:C.vapen.traff_radie,agare:'mal',lever:true});return lista;}
function behandla(h){if(h.id==='fiende'){opp.traff(1);hits++;hitUntil=time+.23;haptics.hit();if(!opp.state.lever){$('seger').hidden=false;$('status').textContent='Fw 190 nedskjuten';}}
 else if(h.id==='spelare'){spelareHp=Math.max(0,spelareHp-1);skadaTill=time+.45;$('skada').style.opacity='.85';haptics.hit();if(spelareHp<=0&&!fm.crashed)nedskjuten();}
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
function skrivHud(){const fwAvst=opp.state.laddad&&opp.group.visible?(()=>{const d=opp.group.position.distanceTo(aircraft.position);return ' · Fw '+(d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.round(d)+' m');})():'';$('flightHud').textContent=`${Math.round(fm.V*3.6)} km/h · ${Math.round(fm.y)} m · ${fm.vs>=0?'+':''}${fm.vs.toFixed(0)} m/s${fwAvst}${fm.stalled?' · STALL':''}`;$('flightHud').classList.toggle('stall',!!fm.stalled);const agl=fm.y-height(fm.x,fm.z);$('status').textContent=fm.stalled?'STALL – luta mobilen framåt för att få fart igen':fm.y>8000?'Tunn luft · taket närmar sig':fm.y>6000?'Tunn luft · stigningen avtar':paMarken?(landInfo?landInfo+' · stäng gasen och bromsa, full gas för ny start':(fm.V>30?'Rullar · dra lätt vid 160 km/h':'På marken · full gas, håll rakt med sidrodret')):agl<60?(gearPos>0.85?(flaps>0.8?'Inflygning · håll under 220 km/h, sjunk mjukt':'Lågflyg · landningsklaff ute ger mjukare landning'):'Lågflyg · hjul ut för att landa'):'Luta för att flyga · vrid för sidroder · Centrera nollställer';}
function logic(dt){gyro.update(dt);lastInput=input.read();const inp={pitch:lastInput.pitch,roll:lastInput.roll};if(!settings.brytare.nivellering)inp.pitch=dampCritical(pitchSpring,inp.pitch,dt,C.styrning.kritisk_omega);
 if(Math.abs(gearPos-gearMal)>0.002)gearPos=Math.max(0,Math.min(1,gearPos+Math.sign(gearMal-gearPos)*dt/2.4));
 const markFore=height(fm.x,fm.z);
 // Sidroder: pedalerna vinner, annars gyrots vridning. Propellerstigningen följer farten automatiskt (fin vid låg fart, grov vid hög).
 roder=pedalRoder!==0?pedalRoder:(lastInput.roder||0);
 propPitch+=(Math.max(0.12,Math.min(0.9,(fm.V-32)/145))-propPitch)*Math.min(1,dt*1.5);
 fm.A.niva_k=settings.brytare.nivellering?C.aero.niva_k:0;fm.step(dt,inp,motorPa?gas:0,undefined,{motorPa,gear:gearPos,flaps,pitch:propPitch,roder,paMarken,markY:markFore,broms:C.landning.broms_n});
 if(paMarken&&fm.lyftAv){paMarken=false;fm.gamma=0.08;fm.y=markFore+2.4;landInfo='';$('status').textContent='I luften. Hjul in när du har höjd.';}
 const at=fm.attitude();pitch=at.pitch;roll=at.roll;heading=at.yaw;loadFactor=fm.nz;turnRate=fm.V>1?fm.nz*9.80665*Math.sin(roll)/fm.V:0;turnRadius=Math.abs(turnRate)>1e-5?fm.V/Math.abs(turnRate):Infinity;
 aircraft.position.set(fm.x,fm.y,fm.z);aircraft.rotation.set(pitch,heading,roll,'YXZ');forward.set(0,0,-1).applyQuaternion(aircraft.quaternion);
 const markY=height(fm.x,fm.z),agl=fm.y-markY;
 // Landning: hjulen ute, farten under maxfart, vingarna plana, sjunk mildare än hårdgränsen. Mjuk landning sätter ner planet,
 // hård landning studsar och varnar, allt annat är en krasch. Utan hjul eller för fort gäller vanlig markkontakt.
 const L=C.landning;
 if(!paMarken&&gearPos>0.85&&agl<1.8&&fm.V<L.max_fart_ms&&Math.abs(roll)<L.max_bank_rad&&fm.vs>L.hard_vs_ms){
  if(fm.vs>L.mjuk_vs_ms){landInfo=fm.vs>-1.2?'Mjuk landning':'Landade';paMarken=true;fm.y=markY+1.35;fm.gamma=0;fm.vs=0;aircraft.position.y=fm.y;haptics.hit();}
  else{fm.vs=-fm.vs*0.35;fm.gamma=Math.abs(fm.gamma)*0.5;fm.y=markY+2.2;haptics.hit();landInfo='Hård landning – studs';$('status').textContent='Hård landning! Håll nosen uppe och sätt ner mjukare.';}
 }
 else if(!paMarken&&agl<C.krasch.kontakt_m){if(settings.brytare.krasch)crash();else{fm.y=markY+C.krasch.kontakt_m;fm.gamma=Math.max(.05,fm.gamma);}}
 if(Math.hypot(fm.x-markX,fm.z-markZ)>180){markX=fm.x;markZ=fm.z;mark.place(fm.x,fm.z);}
 if(firing&&settings.brytare.skjutning&&time>=nextShot){shoot();nextShot=time+C.vapen.intervall_s;}
 if(motorLjud){motorLjud.playbackRate.setTargetAtTime(motorPa?(.55+gas*.7):.2,audio.currentTime,.15);motorGain.gain.setTargetAtTime(motorPa?C.ljud.motor_volym*(.4+gas*.6):0,audio.currentTime,.12);}
 if(fm.stalled&&time>stallBuzz){haptics.hit();stallBuzz=time+.35;}
 opp.update(dt,fm,time);
 skrivHud();
}
function pil(view){const el=$('fiendePil');if(!opp.state.laddad||!opp.state.lever||!opp.group.visible){el.hidden=true;return;}
 const p=opp.group.position.clone().project(view);let x=p.x,y=p.y;if(p.z>1){x=-x;y=-y;}
 const sx=(x*.5+.5)*innerWidth,sy=(-y*.5+.5)*innerHeight,m=36,inne=p.z<1&&sx>m&&sx<innerWidth-m&&sy>m&&sy<innerHeight-m;
 if(inne){el.hidden=true;return;}el.hidden=false;const ang=Math.atan2(sy-innerHeight/2,sx-innerWidth/2),dx=Math.cos(ang),dy=Math.sin(ang);
 const cx=innerWidth/2,cy=innerHeight/2;let t=1e9;if(dx>1e-4)t=Math.min(t,(innerWidth-m-cx)/dx);else if(dx<-1e-4)t=Math.min(t,(m-cx)/dx);if(dy>1e-4)t=Math.min(t,(innerHeight-m-cy)/dy);else if(dy<-1e-4)t=Math.min(t,(m-cy)/dy);
 const left=Math.max(72,Math.min(innerWidth-72,cx+dx*t)),top=Math.max(86,Math.min(innerHeight-96,cy+dy*t));
 el.style.left=left+'px';el.style.top=top+'px';$('fiendePilSymbol').style.transform=`rotate(${ang+Math.PI/2}rad)`;
 const d=opp.group.position.distanceTo(aircraft.position);$('fiendePilText').textContent='Fw 190 · '+(d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.round(d)+' m');}
function present(dt){spinProp(dt);if(!running)forward.set(0,0,-1).applyQuaternion(aircraft.quaternion);
 roderVy?.uppdatera(dt,{roll:lastInput?lastInput.roll/C.styrning.max_roll:0,pitch:lastInput?lastInput.pitch/C.styrning.max_pitch:0,roder,klaff:flaps});
 cameraTarget.copy(aircraft.position);cameraTarget.x-=Math.sin(heading)*C.kamera.framfor;cameraTarget.z-=Math.cos(heading)*C.kamera.framfor;smoothTarget.lerp(cameraTarget,1-Math.exp(-dt/C.kamera.utjamning_s));
 for(let i=0;i<targets.length;i++){const target=targets[i];target.mesh.visible=settings.brytare.mal&&time>=target.down;target.mesh.position.x=target.base.x+Math.sin(time*.25+i)*C.vapen.mal_svaj;target.mesh.position.y=target.base.y+Math.sin(time*.4+i)*8;
  const distance=target.mesh.position.distanceTo(camera.position),near=THREE.MathUtils.smoothstep(distance,C.vapen.lod_enkel_m*.85,C.vapen.lod_enkel_m*1.15),far=THREE.MathUtils.smoothstep(distance,C.vapen.lod_billboard_m*.85,C.vapen.lod_billboard_m*1.15),weights=[1-near,near*(1-far),far];target.levels.forEach((level,n)=>{level.visible=weights[n]>.01;level.material.opacity=weights[n];});}
 shadow.position.set(aircraft.position.x,height(aircraft.position.x,aircraft.position.z)+.7,aircraft.position.z);shadow.rotation.z=heading;shadow.material.opacity=Math.max(.03,.3-(aircraft.position.y-shadow.position.y)*.001);
 cam.sattVy({mal:[smoothTarget.x,smoothTarget.z],d:C.kamera.avstand,lutning:C.kamera.lutning,kurs:-THREE.MathUtils.radToDeg(heading)});cam.uppdatera(dt);
 const agl=Math.max(0,aircraft.position.y-height(aircraft.position.x,aircraft.position.z));const dim=mark.himmel(sight?cockpitCam:camera,agl);
 scene.fog.color.copy(dim.farg);scene.fog.near=dim.near;scene.fog.far=dim.far;scene.background.copy(dim.farg);
 camera.far=120000;camera.updateProjectionMatrix();cockpitCam.far=120000;cockpitCam.updateProjectionMatrix();
 const skak=running?Math.max(0,1-agl/85)*Math.min(1,Math.max(0,fm.V-30)/110):0,amp=skak*.2;
 if(sight)cockpitCam.position.set(K.oga_lokal[0]+Math.sin(time*43)*amp*.35,K.oga_lokal[1]+Math.sin(time*51)*amp*.25,K.oga_lokal[2]);
 else if(amp){camera.position.x+=Math.sin(time*37)*amp;camera.position.y+=Math.sin(time*47)*amp*.55;}
 synkaReglage();skrivHud();const view=sight?cockpitCam:camera;uppdateraSikte(view);pil(view);$('hit').style.opacity=time<hitUntil?'1':'0';if(time>skadaTill)$('skada').style.opacity='0';
 renderer.render(scene,view);
}
function bomberUpp(dt){bomber.uppdatera(dt,height,(b,mark)=>{bombTraff=time+1.4;effects.spela('traff_mark',{pos:new THREE.Vector3(b.x,mark+.4,b.z),laddning_g:Math.round(b.massa*180),kaliber_mm:200,underlag:'torr'});});}
function tick(dt){time+=dt;if(running&&!fm.crashed)logic(dt);bomberUpp(dt);const traffar=guns.update(dt,malLista());if(running)for(const h of traffar)behandla(h);present(dt);panelAcc+=dt;if(panelAcc>=.1){panelAcc=0;if(sight)ritaPanel();}}
let previous=performance.now();renderer.setAnimationLoop(now=>{const elapsed=Math.max(.001,(now-previous)/1000),dt=Math.min(.05,elapsed);previous=now;tick(dt);frameCount++;frameTime+=elapsed;if(frameTime>.5){fps=frameCount/frameTime;frameCount=frameTime=0;$('metrics').textContent=`${fps.toFixed(0)} FPS · ${renderer.info.render.calls} anrop · ${Math.round(renderer.info.render.triangles/1000)}k tris · GPU≈${gpuEstimateMB.toFixed(0)} MB`;}});
const gpuEstimateMB=(modelInfo.triangles*96+opp.state.tris*48+1024*1024*4*1.34)/1048576;
function sattHojd(m){fm.y=m;aircraft.position.y=m;const v=ritaPanel();return v;}
function klattra(malH=10700){running=false;paMarken=false;motorPa=true;gearPos=gearMal=0;flaps=0;propPitch=0.35;fm.crashed=false;fm.reset(0,Math.max(200,height(0,0)+30),0,110);fm.gamma=.1;let steg=0;while(fm.y<malH&&steg<50000){const spak=Math.max(-.2,Math.min(.28,(fm.V-78)*.018));fm.A.niva_k=1;fm.step(.05,{pitch:spak,roll:0},1,undefined,{motorPa:true,gear:0,flaps:0,pitch:propPitch});if(fm.stalled&&fm.y<malH*.5)fm.alpha*=.8;if(fm.y<height(fm.x,fm.z)+3)break;steg++;}
 const at=fm.attitude();aircraft.position.set(fm.x,fm.y,fm.z);aircraft.rotation.set(at.pitch,at.yaw,at.roll,'YXZ');pitch=at.pitch;roll=at.roll;heading=at.yaw;mark.place(fm.x,fm.z);return fm.y;}
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
function kor(sek){const n=Math.max(1,Math.round(sek/.05));for(let i=0;i<n;i++){time+=.05;if(running&&!fm.crashed)logic(.05);bomberUpp(.05);}synkaReglage();if(sight)ritaPanel();return {y:fm.y,psi:fm.psi,V:fm.V,paMarken,motorPa,gear:gearPos,flaps,bomber:bomberKvar,bombTraff,bransle};}
window.flygTest={fm,crash,nedskjuten,flyAgain,setSight,setGas,setPitch,sattHojd,ritaPanel,klattra,sittKors,provLed,skjutNer,beskjut,simuleraAnfall,snurra:spinProp,hojdvisare,markstart,fallBomb,kor,sattRoder,ringRadie:RING,ballistikTabell:()=>ledTabell(1.225,[REFERENSFART]),state:()=>({crashed:fm.crashed,stalled:fm.stalled,speed_kmh:fm.V*3.6,altitude:fm.y,agl:fm.y-height(fm.x,fm.z),vs:fm.vs,running,pitch,roll,heading,gas,spelareHp,hits,shots,fps,time,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,sight,sikte:{...sikteState},prop:{nav:propNav,rps:propVarv(gas,motor,propPitch,motorPa)},fiende:opp.info(),bransle,motorPa,paMarken,gear:gearPos,gearMal,flaps,propPitch,roder,bomber:bomberKvar,bombTung,tandning,primer,patroner,bombTraff,panel:$('panel').dataset}),gyro,input,settings,targets,aircraft,guns,opp,scene,camera,cockpitCam,renderer,visual,mark,bomber};
$('status').textContent='Redo · tryck Starta och håll mobilen bekvämt';
addEventListener('resize',()=>{renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);cam.storlek(innerWidth,innerHeight);cockpitCam.aspect=innerWidth/innerHeight;cockpitCam.updateProjectionMatrix();});
document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('selectstart',e=>e.preventDefault());
