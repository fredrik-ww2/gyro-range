import * as THREE from 'three';
import {GLTFLoader} from '../js/vendor/loaders/GLTFLoader.js';
import {FlightInput,dampCritical} from './flight-controls.js';
import {WingGuns} from './wing-guns.js';
import {FlightModel} from './flight-model.js?v=3';
import {skapaEffekterV2d} from './effects/effekter_v2d.js';
import {KTX2Loader} from './vendor/loaders/KTX2Loader.js';
import {DRACOLoader} from './vendor/loaders/DRACOLoader.js';
import {GyroAim} from '../js/gyro.js';
import {createHaptics} from '../js/haptics.js';
import {skapaAppleKamera} from './kamera/kamera_apple_zoom_v1.js';
const $=id=>document.getElementById(id), began=performance.now();
const C=await fetch('./config.json?v=3').then(r=>{if(!r.ok)throw Error('Inställningar saknas');return r.json();});
const V=await fetch('./kamera/profil.json').then(r=>r.json());
const settings={...C.styrning,skottkansla:1.5,hapticStyle:'auto',brytare:{...C.brytare,atergang:false,horisont:false}};
const canvas=$('spel'),renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
const pixelRatio=()=>Math.min(devicePixelRatio,C.varld.pixelratio,Math.sqrt(C.varld.max_render_px/(innerWidth*innerHeight)));renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xaacbd6);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xaacbd6);scene.fog=new THREE.Fog(0xaacbd6,C.varld.dimma_nara,C.varld.dimma_fjarran);
scene.add(new THREE.HemisphereLight(0xe4f2ff,0x536441,2));const sun=new THREE.DirectionalLight(0xffedce,2.2);sun.position.set(-300,700,200);scene.add(sun);
const W=C.varld;
const height=(x,z)=>W.hojd_stor*Math.sin(x*W.frekvens_stor)*Math.cos(z*W.frekvens_stor)+W.hojd_liten*Math.sin(x*W.frekvens_liten+z*.004);
// Oplacerad provmiljö [F]: kullar och fält, inte en verklig ort.
// Marken följer planet: rutnätet flyttas i hela celler och höjder/färger räknas om (ingen kant, ingen höjdgräns).
const ground=new THREE.PlaneGeometry(W.storlek,W.storlek,W.segment,W.segment);ground.rotateX(-Math.PI/2);
const pos=ground.attributes.position,col=new Float32Array(pos.count*3),color=new THREE.Color(),base=Float32Array.from(pos.array),uv=ground.attributes.uv,cellM=W.storlek/W.segment;
ground.setAttribute('color',new THREE.BufferAttribute(col,3));
const fieldCanvas=document.createElement('canvas');fieldCanvas.width=fieldCanvas.height=W.falt_textur_px;const paint=fieldCanvas.getContext('2d'),cell=W.falt_textur_px/W.falt_rutor,palette=['#929d70','#b4aa77','#9da17a','#7d9667','#b7ac86'];
let seed=4127;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
for(let z=0;z<W.falt_rutor;z++)for(let x=0;x<W.falt_rutor;x++){paint.fillStyle=palette[Math.floor(rnd()*palette.length)];paint.fillRect(x*cell,z*cell,cell+1,cell+1);paint.strokeStyle='#485d3f';paint.lineWidth=1.7;paint.strokeRect(x*cell,z*cell,cell,cell);paint.strokeStyle='#ffffff14';paint.lineWidth=1;for(let line=5;line<cell;line+=5){paint.beginPath();paint.moveTo(x*cell+2,z*cell+line);paint.lineTo((x+1)*cell-2,z*cell+line);paint.stroke();}}
const fieldTexture=new THREE.CanvasTexture(fieldCanvas);fieldTexture.colorSpace=THREE.SRGBColorSpace;fieldTexture.anisotropy=4;fieldTexture.wrapS=fieldTexture.wrapT=THREE.RepeatWrapping;
const groundMesh=new THREE.Mesh(ground,new THREE.MeshLambertMaterial({vertexColors:true,map:fieldTexture}));scene.add(groundMesh);
const fieldSpan=W.falt_rutor*W.falt_m;
function placeGround(cx,cz){cx=Math.round(cx/cellM)*cellM;cz=Math.round(cz/cellM)*cellM;groundMesh.position.set(cx,0,cz);
 for(let i=0;i<pos.count;i++){const x=base[i*3]+cx,z=base[i*3+2]+cz,y=height(x,z);pos.setY(i,y);uv.setXY(i,x/fieldSpan,-z/fieldSpan);const field=Math.sin(x*.012+Math.sin(z*.003))*Math.cos(z*.014),grain=Math.sin(x*.17+z*.11)*.025;color.setHSL(field>.2?.14:.25,.22+field*.07,.67+field*.04+y*.0003+grain);color.toArray(col,i*3);}
 pos.needsUpdate=uv.needsUpdate=ground.attributes.color.needsUpdate=true;ground.computeVertexNormals();ground.computeBoundingSphere();placeTrees(cx,cz);}
// Träd och buskar nära planet: ett enda instansanrop. Ger fartkänsla i lågflyg.
const treeGeo=new THREE.ConeGeometry(1,1,6);treeGeo.translate(0,.5,0);const trees=new THREE.InstancedMesh(treeGeo,new THREE.MeshLambertMaterial({color:0x3f5a32}),W.traad_antal);trees.frustumCulled=false;scene.add(trees);
const treeObj=new THREE.Object3D(),hash=(a,b)=>{const h=Math.sin(a*127.1+b*311.7)*43758.5453;return h-Math.floor(h);};
function placeTrees(cx,cz){let n=0;const c=W.traad_cell_m,r=Math.ceil(W.traad_radie_m/c),ix=Math.round(cx/c),iz=Math.round(cz/c);
 for(let a=-r;a<=r&&n<W.traad_antal;a++)for(let b=-r;b<=r&&n<W.traad_antal;b++){const gx=ix+a,gz=iz+b,h=hash(gx,gz);if(h>W.traad_tathet)continue;const x=(gx+hash(gz,gx))*c,z=(gz+hash(gx+7,gz))*c,s=7+h*60;if(Math.hypot(x-cx,z-cz)>W.traad_radie_m)continue;
  treeObj.position.set(x,height(x,z)-.5,z);treeObj.scale.set(s*.35+2,s*.6+6,s*.35+2);treeObj.updateMatrix();trees.setMatrixAt(n++,treeObj.matrix);}
 trees.count=n;trees.instanceMatrix.needsUpdate=true;}
const fm=new FlightModel(C.aero);const aircraft=new THREE.Group();scene.add(aircraft);function startPos(){const y=height(0,0)+C.flyg.start_hojd;fm.reset(0,y,0,C.aero.start_fart_ms);aircraft.position.set(0,y,0);placeGround(0,0);}
startPos();
const draco=new DRACOLoader().setDecoderPath('./vendor/libs/draco/').setDecoderConfig({type:'wasm'});
const loader=new GLTFLoader().setDRACOLoader(draco),visual=new THREE.Group();aircraft.add(visual);
let model=null,currentModel=C.standardmodell,modelInfo={triangles:0},modelLoadSerial=0;
async function selectModel(key){const serial=++modelLoadSerial,def=C.modeller[key];$('modelSelect').disabled=true;try{const gltf=await loader.loadAsync(def.fil);if(serial!==modelLoadSerial)return;const next=gltf.scene,box=new THREE.Box3().setFromObject(next,true),size=box.getSize(new THREE.Vector3()),mid=box.getCenter(new THREE.Vector3()),scale=def.spann_m/size.x;next.position.copy(mid).multiplyScalar(-scale);next.scale.setScalar(scale);
 visual.clear();if(model)model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});model=next;visual.rotation.y=def.rotation_y;visual.add(model);currentModel=key;modelInfo={bounds:size.toArray(),scale,triangles:0};model.traverse(o=>{if(o.isMesh){modelInfo.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;o.frustumCulled=true;}});$('aircraftName').textContent=def.namn;$('modelSelect').value=key;
 }finally{$('modelSelect').disabled=false;}}
await selectModel(currentModel);
$('modelSelect').onchange=async e=>{try{await selectModel(e.target.value);}catch{$('status').textContent='Modellen kunde inte laddas';}};
// Kameramodulens vy och gränser återanvänds. Flygläget är en separat profil utan kartgester.
class FollowTarget{constructor(camera){this.camera=camera;this.target=new THREE.Vector3();}update(){this.camera.lookAt(this.target);}}
const cam=await skapaAppleKamera({THREE,OrbitControls:FollowTarget,renderer,varden:V,markHojd:()=>aircraft.position.y+C.kamera.hojd});
const camera=cam.kamera;const gyro=new GyroAim(canvas,settings,C.styrning);const input=new FlightInput(gyro,C.styrning,settings);
const atlas=await new KTX2Loader().setTranscoderPath('./vendor/libs/basis/').detectSupport(renderer).loadAsync('./effects/fx_atlas_v2d.ktx2');
const effects=skapaEffekterV2d(THREE,scene,{atlas,kamera:camera,renderer,kvalitet:'lag',ljus:false,maxPartiklar:128,markHojd:height});
const guns=new WingGuns(scene,aircraft,C.vapen,effects);
const pitchSpring={x:0,v:0},bankSpring={x:0,v:0};let lastInput=null,turnRate=0,loadFactor=1,turnRadius=Infinity,sight=false;
// Cockpitvy: egen kamera vid pilotens öga. Sikte-knappen växlar mellan yttre vy och cockpit.
const K=C.cockpit,cockpitCam=new THREE.PerspectiveCamera(K.fov_grader,innerWidth/innerHeight,K.nara_m,40000);cockpitCam.position.set(...K.oga_lokal);aircraft.add(cockpitCam);
function setSight(on){sight=on;$('sight').setAttribute('aria-pressed',String(sight));$('cockpit').hidden=!sight;$('reticle').toggleAttribute('hidden',!sight);visual.visible=!sight&&!fm.crashed;document.body.classList.toggle('cockpitvy',sight);}
$('sight').onclick=()=>setSight(!sight);
const haptics=createHaptics({medel:{varaktighet_ms:35},tung:{varaktighet_ms:45}},settings);
const send=m=>window.ReactNativeWebView?.postMessage(JSON.stringify(m));send({type:'bridge-ready',version:1});haptics.sync();
$('back').href='../'+location.search;
const targets=[],sphere=new THREE.SphereGeometry(C.vapen.mal_radie,12,8),simpleSphere=new THREE.SphereGeometry(C.vapen.mal_radie,8,6);
const balloonCanvas=document.createElement('canvas');balloonCanvas.width=balloonCanvas.height=64;const balloonPaint=balloonCanvas.getContext('2d');const gradient=balloonPaint.createRadialGradient(24,20,2,32,32,30);gradient.addColorStop(0,'#d99b7a');gradient.addColorStop(.8,'#b45e44');gradient.addColorStop(1,'#6f392e');balloonPaint.fillStyle=gradient;balloonPaint.beginPath();balloonPaint.ellipse(32,32,24,31,0,0,Math.PI*2);balloonPaint.fill();const balloonTexture=new THREE.CanvasTexture(balloonCanvas);balloonTexture.colorSpace=THREE.SRGBColorSpace;
for(let i=0;i<C.vapen.mal_antal;i++){const mesh=new THREE.Group(),levels=[];for(const geometry of [sphere,simpleSphere]){const item=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0xb45e44,transparent:true}));item.scale.set(.8,1.25,.8);mesh.add(item);levels.push(item);}const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:balloonTexture,transparent:true}));sprite.scale.set(C.vapen.mal_radie*1.6,C.vapen.mal_radie*2.5,1);mesh.add(sprite);levels.push(sprite);mesh.position.set(Math.sin(i*2)*140,C.flyg.start_hojd+Math.sin(i)*32,-C.vapen.mal_avstand-i*C.vapen.mal_mellanrum);scene.add(mesh);targets.push({mesh,levels,base:mesh.position.clone(),down:0});}
// Enkel skuggproxy skapas vid första sidstarten; inga tunga skuggkartor.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const shadowPaint=shadowCanvas.getContext('2d'),shade=shadowPaint.createRadialGradient(32,32,2,32,32,31);shade.addColorStop(0,'#0009');shade.addColorStop(1,'#0000');shadowPaint.fillStyle=shade;shadowPaint.fillRect(0,0,64,64);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(20,14),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);

let stallBuzz=0,running=false,firing=false,gas=C.flyg.gas,pitch=0,roll=0,heading=0,hits=0,shots=0,nextShot=0,hitUntil=0,time=0,fps=0,frameCount=0,frameTime=0;
let audio=null,motor=null,motorGain=null,buffers={},voices=[];
async function unlockAudio(){
 try{if(navigator.audioSession)navigator.audioSession.type='playback';else if(!window.__tystBrytare){const n=22050,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,n,true);v.setUint32(28,n*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);const a=document.createElement('audio');a.setAttribute('playsinline','');a.setAttribute('x-webkit-airplay','deny');a.loop=true;a.src=URL.createObjectURL(new Blob([b],{type:'audio/wav'}));window.__tystBrytare=a;a.play().catch(()=>{});}else window.__tystBrytare.play().catch(()=>{});}catch{}
 if(!settings.brytare.ljud)return;
 if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();const silent=audio.createBufferSource();silent.buffer=audio.createBuffer(1,1,22050);silent.connect(audio.destination);silent.start();}
 await audio.resume();
 try{for(const key of ['motor','skott'])if(!buffers[key]){const data=await fetch(C.ljud[key]).then(r=>{if(!r.ok)throw Error('Ljudfil saknas');return r.arrayBuffer();});buffers[key]=await audio.decodeAudioData(data);}
 if(!motor&&running&&settings.brytare.ljud){motor=audio.createBufferSource();motor.buffer=buffers.motor;motor.loop=true;motor.loopEnd=C.ljud.motor_loop_end;motorGain=audio.createGain();motorGain.gain.value=C.ljud.motor_volym;motor.connect(motorGain).connect(audio.destination);motor.start();}
 }catch(e){$('status').textContent='Flyg klart · ljud kunde inte laddas';}
}
function stopMotor(){if(motor){motor.stop();motor=null;}}
function shotSound(){if(!audio||!buffers.skott||!settings.brytare.ljud)return;while(voices.length>=C.ljud.roster-1){try{voices.shift().stop();}catch{}}
 const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffers.skott;gain.gain.value=C.ljud.skott_volym;source.connect(gain).connect(audio.destination);voices.push(source);source.onended=()=>{voices=voices.filter(v=>v!==source);source.disconnect();gain.disconnect();};source.start();}
const forward=new THREE.Vector3(),cameraTarget=new THREE.Vector3(),smoothTarget=new THREE.Vector3(0,C.flyg.start_hojd,0),euler=new THREE.Euler(0,0,0,'YXZ'),aimPoint=new THREE.Vector3(),projected=new THREE.Vector3(),diff=new THREE.Vector3();
function center(){input.center();pitchSpring.x=pitchSpring.v=bankSpring.x=bankSpring.v=0;}
let crashFx=null,crashInfo=null;
function flyAgain(){crashFx?.stopp();crashFx=null;crashInfo=null;startPos();center();visual.visible=!sight;$('crashPanel').hidden=true;smoothTarget.copy(aircraft.position);if(settings.brytare.gyro&&input.active)void gyro.start();}
$('again').onclick=flyAgain;
async function start(useGyro){running=true;input.active=useGyro&&settings.brytare.gyro;center();$('startPanel').hidden=true;const permission=useGyro&&settings.brytare.gyro?gyro.start():null;void unlockAudio();if(permission){const result=await permission;$('status').textContent=result.orientation==='granted'?'Luta för att flyga · Centrera ställer om utgångsläget':'Gyro nekades · dra med fingret';}else{$('status').textContent='Dra i bilden för att flyga · Centrera rätar upp';}}
$('start').disabled=$('manual').disabled=false;$('start').onclick=()=>start(true);$('manual').onclick=()=>start(false);$('center').onclick=center;
$('throttle').value=gas;$('gasValue').value=Math.round(gas*100)+' %';
$('throttle').oninput=e=>{gas=+e.target.value;$('gasValue').value=Math.round(gas*100)+' %';};
$('sensitivity').value=settings.kanslighet;$('sensitivity').oninput=e=>settings.kanslighet=+e.target.value;
const names={gyro:'Gyrostyrning',nivellering:'Automatisk nivellering',krasch:'Krasch vid markkontakt',skjutning:'Vingvapen',mal:'Målballonger',markskydd:'Mjukt markskydd',haptik:'Vibrationer',ljud:'Ljud',skada:'Skada (ingen game over)'};
for(const [key,name]of Object.entries(names)){const label=document.createElement('label');label.textContent=name;const input=document.createElement('input');input.type='checkbox';input.checked=settings.brytare[key];input.onchange=()=>{settings.brytare[key]=input.checked;if(key==='gyro'){window.flygTest.input.active=input.checked;center();if(input.checked&&running)void gyro.start();else gyro.stop();}if(key==='haptik')haptics.sync();if(key==='ljud'){if(input.checked)void unlockAudio();else{stopMotor();for(const source of voices)source.stop();voices=[];}}};label.append(input);$('toggles').append(label);}
$('settingsButton').onclick=()=>{$('settings').hidden=!$('settings').hidden;};$('closeSettings').onclick=()=>{$('settings').hidden=true;};
function stopFire(){firing=false;$('fire').classList.remove('firing');for(const source of voices){try{source.stop();}catch{}}voices=[];}
$('fire').onpointerdown=e=>{e.preventDefault();if(!running)return;firing=true;$('fire').classList.add('firing');$('fire').setPointerCapture(e.pointerId);void unlockAudio();};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('fire').addEventListener(event,stopFire);
addEventListener('blur',stopFire);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopFire();gyro.stop();audio?.suspend();}else if(running){if(settings.brytare.gyro)void gyro.start();audio?.resume();}});
addEventListener('pagehide',()=>{stopFire();gyro.stop();stopMotor();audio?.close();});
addEventListener('ww2-native-lifecycle',e=>{if(e.detail?.active===false){stopFire();audio?.suspend();}else if(running){center();if(settings.brytare.gyro)void gyro.start();audio?.resume();}});
function shoot(){shots++;guns.model=currentModel;guns.fire(forward,fm.V);haptics.shot('tung','kulspruta');shotSound();let best=null,nearest=Infinity;
 for(const ray of guns.rays)for(const target of targets){if(!target.mesh.visible)continue;diff.copy(target.mesh.position).sub(ray.origin);const distance=diff.dot(ray.direction),lateral=diff.lengthSq()-distance*distance;if(distance>0&&distance<C.vapen.rackvidd&&lateral<C.vapen.traff_radie**2&&distance<nearest){best=target;nearest=distance;}}
 if(best){best.down=time+C.vapen.aterkomst_s;best.mesh.visible=false;hits++;hitUntil=time+.23;haptics.hit();}}
// Reflexsiktet: ringens radie i pixlar räknas från verklig vinkel (mil) och cockpitkamerans synfält.
function placeReticle(x,y){const r=Math.tan(K.ring_radie_mil/1000)/Math.tan(K.fov_grader*Math.PI/360)*innerHeight/2;const g=$('reticleGlow');g.setAttribute('transform',`translate(${x} ${y})`);$('ringA').setAttribute('r',r);$('ringB').setAttribute('r',r);
 $('barsA').setAttribute('d',`M${-r*1.9} 0H${-r*1.15}M${r*1.15} 0H${r*1.9}M0 ${-r*1.35}V${-r*1.12}`);$('barsB').setAttribute('d',$('barsA').getAttribute('d'));}
function needle(id,frac){$(id).setAttribute('transform',`rotate(${-135+270*Math.max(0,Math.min(1,frac))})`);}
function updateGauges(agl){if(!sight)return;needle('nFart',fm.V*3.6/800);needle('nHojd',(fm.y%1000)/1000);needle('nVs',.5+fm.vs/60);$('gHorisont').setAttribute('transform',`rotate(${roll*180/Math.PI}) translate(0 ${Math.max(-14,Math.min(14,pitch*60))})`);$('tFart').textContent=Math.round(fm.V*3.6);$('tHojd').textContent=Math.round(fm.y);$('tVs').textContent=(fm.vs>=0?'+':'')+fm.vs.toFixed(0);}
function crash(){fm.crashed=true;stopFire();crashInfo={fart_kmh:Math.round(fm.V*3.6),vinkel_grader:Math.round(-fm.gamma*180/Math.PI)};const p=aircraft.position.clone();p.y=height(p.x,p.z)+.3;fm.y=height(fm.x,fm.z)+4;aircraft.position.set(fm.x,fm.y,fm.z);aircraft.rotation.set(0,heading,0,'YXZ');
 effects.spela('traff_mark',{pos:p,laddning_g:C.krasch.laddning_g,kaliber_mm:20,underlag:'torr'});crashFx=effects.spela('brand_rok',{pos:p,fas:'brinner',skala:C.krasch.brand_skala});
 visual.visible=false;if(sight)setSight(false);haptics.hit();haptics.shot('tung','kulspruta');$('crashText').textContent=`Planet störtade i ${crashInfo.fart_kmh} km/h, ${crashInfo.vinkel_grader}° mot marken.`;$('crashPanel').hidden=false;$('status').textContent='Störtade';}
function tick(dt){time+=dt;if(running&&!fm.crashed){gyro.update(dt);lastInput=input.read();const inp={pitch:lastInput.pitch,roll:lastInput.roll};if(!settings.brytare.nivellering){inp.pitch=dampCritical(pitchSpring,inp.pitch,dt,C.styrning.kritisk_omega);}
 fm.A.niva_k=settings.brytare.nivellering?C.aero.niva_k:0;fm.step(dt,inp,gas);
 const at=fm.attitude();pitch=at.pitch;roll=at.roll;heading=at.yaw;loadFactor=fm.nz;turnRate=fm.V>1?fm.nz*9.80665*Math.sin(roll)/fm.V:0;turnRadius=Math.abs(turnRate)>1e-5?fm.V/Math.abs(turnRate):Infinity;
 aircraft.position.set(fm.x,fm.y,fm.z);aircraft.rotation.set(pitch,heading,roll,'YXZ');forward.set(0,0,-1).applyQuaternion(aircraft.quaternion);
 const ground=height(fm.x,fm.z),agl=fm.y-ground;
 if(agl<C.krasch.kontakt_m){if(settings.brytare.krasch)crash();else{fm.y=ground+C.krasch.kontakt_m;fm.gamma=Math.max(.05,fm.gamma);}}
 if(Math.hypot(fm.x-groundMesh.position.x,fm.z-groundMesh.position.z)>W.omcentrera_m)placeGround(fm.x,fm.z);
 if(firing&&settings.brytare.skjutning&&time>=nextShot){shoot();nextShot=time+C.vapen.intervall_s;}
 if(motor){motor.playbackRate.setTargetAtTime(.7+gas*.65,audio.currentTime,.15);motorGain.gain.setTargetAtTime(C.ljud.motor_volym*(.55+gas*.45),audio.currentTime,.15);}
 if(fm.stalled&&time>stallBuzz){haptics.hit();stallBuzz=time+.35;}
 $('flightHud').innerHTML=`${Math.round(fm.V*3.6)} km/h · ${Math.round(fm.y)} m · ${fm.vs>=0?'+':''}${fm.vs.toFixed(0)} m/s · ${fm.nz.toFixed(1)} g · ${hits} träff${fm.stalled?' · <b class="stall">STALL</b>':''}`;
 $('status').textContent=fm.stalled?'STALL – luta mobilen framåt för att få fart igen':agl<60?'Lågflyg':'Luta för att flyga · Centrera ställer om utgångsläget';
 updateGauges(agl);
 }else if(!running)forward.set(0,0,-1);
 cameraTarget.copy(aircraft.position);cameraTarget.x-=Math.sin(heading)*C.kamera.framfor;cameraTarget.z-=Math.cos(heading)*C.kamera.framfor;smoothTarget.lerp(cameraTarget,1-Math.exp(-dt/C.kamera.utjamning_s));
 guns.update(dt);
 for(let i=0;i<targets.length;i++){const target=targets[i];target.mesh.visible=settings.brytare.mal&&time>=target.down;target.mesh.position.x=target.base.x+Math.sin(time*.25+i)*C.vapen.mal_svaj;target.mesh.position.y=target.base.y+Math.sin(time*.4+i)*8;
 const distance=target.mesh.position.distanceTo(camera.position),near=THREE.MathUtils.smoothstep(distance,C.vapen.lod_enkel_m*.85,C.vapen.lod_enkel_m*1.15),far=THREE.MathUtils.smoothstep(distance,C.vapen.lod_billboard_m*.85,C.vapen.lod_billboard_m*1.15),weights=[1-near,near*(1-far),far];target.levels.forEach((level,n)=>{level.visible=weights[n]>.01;level.material.opacity=weights[n];});}
 shadow.position.set(aircraft.position.x,height(aircraft.position.x,aircraft.position.z)+.7,aircraft.position.z);shadow.rotation.z=heading;shadow.material.opacity=Math.max(.03,.3-(aircraft.position.y-shadow.position.y)*.001);

 cam.sattVy({mal:[smoothTarget.x,smoothTarget.z],d:C.kamera.avstand,lutning:C.kamera.lutning,kurs:-THREE.MathUtils.radToDeg(heading)});cam.uppdatera(dt);
 const alt=Math.max(0,aircraft.position.y-height(aircraft.position.x,aircraft.position.z));camera.far=Math.max(camera.far,W.dimma_max+2000);camera.updateProjectionMatrix();scene.fog.near=W.dimma_nara+alt*1.2;scene.fog.far=Math.min(W.dimma_max,W.dimma_fjarran+alt*2.2);trees.visible=alt<W.traad_dold_over_m;
 const view=sight?cockpitCam:camera;
 aimPoint.copy(aircraft.position).addScaledVector(forward,C.vapen.konvergens_m);if(sight){aircraft.updateMatrixWorld();projected.copy(aimPoint).project(cockpitCam);placeReticle((projected.x*.5+.5)*innerWidth,(-projected.y*.5+.5)*innerHeight);}$('hit').style.opacity=time<hitUntil?1:0;
 renderer.render(scene,view);
}
let previous=performance.now();renderer.setAnimationLoop(now=>{const elapsed=Math.max(.001,(now-previous)/1000),dt=Math.min(.05,elapsed);previous=now;tick(dt);frameCount++;frameTime+=elapsed;if(frameTime>.5){fps=frameCount/frameTime;frameCount=frameTime=0;$('metrics').textContent=`${fps.toFixed(0)} FPS · ${renderer.info.render.calls} anrop · ${Math.round(renderer.info.render.triangles/1000)}k tris · LADD ${loadSeconds.toFixed(1)} s · GPU≈${gpuEstimateMB.toFixed(0)} MB`;}});
const loadSeconds=(performance.now()-began)/1000;const gpuEstimateMB=(pos.array.byteLength+col.byteLength+ground.attributes.normal.array.byteLength+ground.index.array.byteLength+1024**2*4*1.34+65536+modelInfo.triangles*3*32+W.falt_textur_px**2*4*1.34)/1048576;
window.flygTest={fm,crash,flyAgain,setSight,state:()=>({crashed:fm.crashed,crashInfo,stalled:fm.stalled,speed_kmh:fm.V*3.6,altitude:fm.y,agl:fm.y-height(fm.x,fm.z),vs:fm.vs,alpha_deg:fm.alpha*180/Math.PI,gamma_deg:fm.gamma*180/Math.PI,running,pitch,roll,heading,turnRate,loadFactor,turnRadius,input:lastInput,currentModel,sight,tracers:guns.mesh.count,gunCount:guns.rays.length,hits,shots,firing,gas,fps,time,position:aircraft.position.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,loadSeconds,gpuEstimateMB,modelInfo,voices:voices.length+(motor?1:0),native:gyro.nativeSource}),gyro,input,settings,targets,aircraft,guns,selectModel,scene,camera,renderer,visual};
$('status').textContent='Redo · tryck Starta och håll mobilen bekvämt';
addEventListener('resize',()=>{renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);cam.storlek(innerWidth,innerHeight);cockpitCam.aspect=innerWidth/innerHeight;cockpitCam.updateProjectionMatrix();});
document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('selectstart',e=>e.preventDefault());
