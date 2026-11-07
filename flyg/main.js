import * as THREE from 'three';
import {GLTFLoader} from '../js/vendor/loaders/GLTFLoader.js';
import {GyroAim} from '../js/gyro.js';
import {createHaptics} from '../js/haptics.js';
import {skapaAppleKamera} from './kamera/kamera_apple_zoom_v1.js';
const $=id=>document.getElementById(id), began=performance.now();
const C=await fetch('./config.json').then(r=>{if(!r.ok)throw Error('Inställningar saknas');return r.json();});
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
const ground=new THREE.PlaneGeometry(W.storlek,W.storlek,W.segment,W.segment);ground.rotateX(-Math.PI/2);
const pos=ground.attributes.position,col=new Float32Array(pos.count*3),color=new THREE.Color();
for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=height(x,z);pos.setY(i,y);const field=Math.sin(x*.012+Math.sin(z*.003))*Math.cos(z*.014),grain=Math.sin(x*.17+z*.11)*.025; color.setHSL(field>.2?.14:.25,.22+field*.07,.67+field*.04+y*.0003+grain);color.toArray(col,i*3);}
ground.setAttribute('color',new THREE.BufferAttribute(col,3));ground.computeVertexNormals();
const fieldCanvas=document.createElement('canvas');fieldCanvas.width=fieldCanvas.height=W.falt_textur_px;const paint=fieldCanvas.getContext('2d'),cell=W.falt_textur_px/W.falt_rutor,palette=['#929d70','#b4aa77','#9da17a','#7d9667','#b7ac86'];
let seed=4127;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
for(let z=0;z<W.falt_rutor;z++)for(let x=0;x<W.falt_rutor;x++){paint.fillStyle=palette[Math.floor(rnd()*palette.length)];paint.fillRect(x*cell,z*cell,cell+1,cell+1);paint.strokeStyle='#485d3f';paint.lineWidth=1.7;paint.strokeRect(x*cell,z*cell,cell,cell);paint.strokeStyle='#ffffff14';paint.lineWidth=1;for(let line=5;line<cell;line+=5){paint.beginPath();paint.moveTo(x*cell+2,z*cell+line);paint.lineTo((x+1)*cell-2,z*cell+line);paint.stroke();}}
const fieldTexture=new THREE.CanvasTexture(fieldCanvas);fieldTexture.colorSpace=THREE.SRGBColorSpace;fieldTexture.anisotropy=2;
scene.add(new THREE.Mesh(ground,new THREE.MeshLambertMaterial({vertexColors:true,map:fieldTexture})));
const aircraft=new THREE.Group();aircraft.position.set(0,C.flyg.start_hojd,0);scene.add(aircraft);
const gltf=await new GLTFLoader().loadAsync(C.modell.fil);
const model=gltf.scene;const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),mid=box.getCenter(new THREE.Vector3());
const scale=C.modell.spann_m/size.x;model.position.copy(mid).multiplyScalar(-scale);model.scale.setScalar(scale);
const visual=new THREE.Group();visual.add(model);visual.rotation.y=C.modell.rotation_y;aircraft.add(visual);
const modelInfo={bounds:size.toArray(),scale,triangles:0};model.traverse(o=>{if(o.isMesh){modelInfo.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;o.frustumCulled=true;}});
// Kameramodulens vy och gränser återanvänds. Flygläget är en separat profil utan kartgester.
class FollowTarget{constructor(camera){this.camera=camera;this.target=new THREE.Vector3();}update(){this.camera.lookAt(this.target);}}
const cam=await skapaAppleKamera({THREE,OrbitControls:FollowTarget,renderer,varden:V,markHojd:()=>aircraft.position.y+C.kamera.hojd});
const camera=cam.kamera;const gyro=new GyroAim(canvas,settings,C.styrning);
const haptics=createHaptics({medel:{varaktighet_ms:35},tung:{varaktighet_ms:45}},settings);
const send=m=>window.ReactNativeWebView?.postMessage(JSON.stringify(m));send({type:'bridge-ready',version:1});haptics.sync();
$('back').href='../'+location.search;
const targets=[],sphere=new THREE.SphereGeometry(C.vapen.mal_radie,12,8),simpleSphere=new THREE.SphereGeometry(C.vapen.mal_radie,8,6);
const balloonCanvas=document.createElement('canvas');balloonCanvas.width=balloonCanvas.height=64;const balloonPaint=balloonCanvas.getContext('2d');const gradient=balloonPaint.createRadialGradient(24,20,2,32,32,30);gradient.addColorStop(0,'#d99b7a');gradient.addColorStop(.8,'#b45e44');gradient.addColorStop(1,'#6f392e');balloonPaint.fillStyle=gradient;balloonPaint.beginPath();balloonPaint.ellipse(32,32,24,31,0,0,Math.PI*2);balloonPaint.fill();const balloonTexture=new THREE.CanvasTexture(balloonCanvas);balloonTexture.colorSpace=THREE.SRGBColorSpace;
for(let i=0;i<C.vapen.mal_antal;i++){const mesh=new THREE.Group(),levels=[];for(const geometry of [sphere,simpleSphere]){const item=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0xb45e44,transparent:true}));item.scale.set(.8,1.25,.8);mesh.add(item);levels.push(item);}const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:balloonTexture,transparent:true}));sprite.scale.set(C.vapen.mal_radie*1.6,C.vapen.mal_radie*2.5,1);mesh.add(sprite);levels.push(sprite);mesh.position.set(Math.sin(i*2)*140,C.flyg.start_hojd+Math.sin(i)*32,-C.vapen.mal_avstand-i*C.vapen.mal_mellanrum);scene.add(mesh);targets.push({mesh,levels,base:mesh.position.clone(),down:0});}
// Enkel skuggproxy skapas vid första sidstarten; inga tunga skuggkartor.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const shadowPaint=shadowCanvas.getContext('2d'),shade=shadowPaint.createRadialGradient(32,32,2,32,32,31);shade.addColorStop(0,'#0009');shade.addColorStop(1,'#0000');shadowPaint.fillStyle=shade;shadowPaint.fillRect(0,0,64,64);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(20,14),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);

let running=false,firing=false,gas=C.flyg.gas,pitch=0,roll=0,heading=0,hits=0,shots=0,nextShot=0,hitUntil=0,time=0,fps=0,frameCount=0,frameTime=0;
let audio=null,motor=null,motorGain=null,buffers={},voices=[];
async function unlockAudio(){
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
function center(){gyro.center();pitch=roll=0;}
async function start(useGyro){running=true;center();$('startPanel').hidden=true;const permission=useGyro&&settings.brytare.gyro?gyro.start():null;void unlockAudio();if(permission){const result=await permission;$('status').textContent=result.orientation==='granted'?'Luta för att flyga · Centrera ställer om utgångsläget':'Gyro nekades · dra med fingret';}else{$('status').textContent='Dra i bilden för att flyga · Centrera rätar upp';}}
$('start').disabled=$('manual').disabled=false;$('start').onclick=()=>start(true);$('manual').onclick=()=>start(false);$('center').onclick=center;
$('throttle').value=gas;$('gasValue').value=Math.round(gas*100)+' %';
$('throttle').oninput=e=>{gas=+e.target.value;$('gasValue').value=Math.round(gas*100)+' %';};
$('sensitivity').value=settings.kanslighet;$('sensitivity').oninput=e=>settings.kanslighet=+e.target.value;
const names={gyro:'Gyrostyrning',nivellering:'Automatisk nivellering',skjutning:'Kulsprutor',mal:'Målballonger',markskydd:'Mjukt markskydd',haptik:'Vibrationer',ljud:'Ljud',skada:'Skada (ingen game over)'};
for(const [key,name]of Object.entries(names)){const label=document.createElement('label');label.textContent=name;const input=document.createElement('input');input.type='checkbox';input.checked=settings.brytare[key];input.onchange=()=>{settings.brytare[key]=input.checked;if(key==='gyro'){if(input.checked&&running)void gyro.start();else gyro.stop();}if(key==='haptik')haptics.sync();if(key==='ljud'){if(input.checked)void unlockAudio();else{stopMotor();for(const source of voices)source.stop();voices=[];}}};label.append(input);$('toggles').append(label);}
$('settingsButton').onclick=()=>{$('settings').hidden=!$('settings').hidden;};$('closeSettings').onclick=()=>{$('settings').hidden=true;};
function stopFire(){firing=false;$('fire').classList.remove('firing');for(const source of voices){try{source.stop();}catch{}}voices=[];}
$('fire').onpointerdown=e=>{e.preventDefault();if(!running)return;firing=true;$('fire').classList.add('firing');$('fire').setPointerCapture(e.pointerId);void unlockAudio();};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('fire').addEventListener(event,stopFire);
addEventListener('blur',stopFire);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopFire();gyro.stop();audio?.suspend();}else if(running){if(settings.brytare.gyro)void gyro.start();audio?.resume();}});
addEventListener('pagehide',()=>{stopFire();gyro.stop();stopMotor();audio?.close();});
addEventListener('ww2-native-lifecycle',e=>{if(e.detail?.active===false){stopFire();audio?.suspend();}else if(running){center();if(settings.brytare.gyro)void gyro.start();audio?.resume();}});
function shoot(){shots++;haptics.shot('tung','kulspruta');shotSound();const origin=aircraft.position;let best=null,nearest=Infinity;
 for(const target of targets){if(!target.mesh.visible)continue;diff.copy(target.mesh.position).sub(origin);const distance=diff.dot(forward);const lateral=diff.lengthSq()-distance*distance;if(distance>0&&distance<C.vapen.rackvidd&&lateral<C.vapen.traff_radie**2&&distance<nearest){best=target;nearest=distance;}}
 if(best){best.down=time+C.vapen.aterkomst_s;best.mesh.visible=false;hits++;hitUntil=time+.23;haptics.hit();}}
function tick(dt){time+=dt;if(running){const orientation=gyro.update(dt);euler.setFromQuaternion(orientation,'YXZ');const s=C.styrning;const dead=v=>Math.abs(v)<s.dodzon?0:v;let desiredPitch=THREE.MathUtils.clamp(dead(euler.x),-s.max_pitch,s.max_pitch);let desiredRoll=THREE.MathUtils.clamp(dead(euler.z+gyro.drag.x),-s.max_roll,s.max_roll);if(!settings.brytare.nivellering){if(!desiredPitch)desiredPitch=pitch;if(!desiredRoll)desiredRoll=roll;}const blend=1-Math.exp(-dt/s.respons_s);pitch+=(desiredPitch-pitch)*blend;roll+=(desiredRoll-roll)*blend;heading+=roll*s.svang_rad_s*dt;
 aircraft.rotation.set(pitch,heading,roll,'YXZ');forward.set(0,0,-1).applyQuaternion(aircraft.quaternion);const speed=C.flyg.min_fart+(C.flyg.max_fart-C.flyg.min_fart)*gas;aircraft.position.addScaledVector(forward,speed*dt);
 const floor=height(aircraft.position.x,aircraft.position.z)+C.flyg.min_markfrigang;if(aircraft.position.y<floor&&settings.brytare.markskydd){aircraft.position.y+=(floor-aircraft.position.y)*(1-Math.exp(-dt*6));pitch=Math.max(.12,pitch);}
 if(aircraft.position.y>C.flyg.max_hojd)pitch-=dt*.5;
 const radius=Math.hypot(aircraft.position.x,aircraft.position.z);if(radius>C.flyg.varld_radie){const home=Math.atan2(aircraft.position.x,aircraft.position.z);const delta=Math.atan2(Math.sin(home-heading),Math.cos(home-heading));heading+=THREE.MathUtils.clamp(delta,-C.flyg.kant_svang*dt,C.flyg.kant_svang*dt);$('status').textContent='Mjukt tillbaka mot övningsområdet';}
 if(radius>W.storlek*.49){aircraft.position.set(0,C.flyg.start_hojd,0);heading=0;center();smoothTarget.copy(aircraft.position);}
 cameraTarget.copy(aircraft.position);cameraTarget.x-=Math.sin(heading)*C.kamera.framfor;cameraTarget.z-=Math.cos(heading)*C.kamera.framfor;smoothTarget.lerp(cameraTarget,1-Math.exp(-dt/C.kamera.utjamning_s));
 if(firing&&settings.brytare.skjutning&&time>=nextShot){shoot();nextShot=time+C.vapen.intervall_s;}
 if(motor){motor.playbackRate.setTargetAtTime(.7+gas*.65,audio.currentTime,.15);motorGain.gain.setTargetAtTime(C.ljud.motor_volym*(.55+gas*.45),audio.currentTime,.15);}
 $('flightHud').textContent=`${Math.round(speed*3.6)} km/h · HÖJD ${Math.round(aircraft.position.y-height(aircraft.position.x,aircraft.position.z))} m · TRÄFFAR ${hits}`;
 }else forward.set(0,0,-1);
 for(let i=0;i<targets.length;i++){const target=targets[i];target.mesh.visible=settings.brytare.mal&&time>=target.down;target.mesh.position.x=target.base.x+Math.sin(time*.25+i)*C.vapen.mal_svaj;target.mesh.position.y=target.base.y+Math.sin(time*.4+i)*8;
 const distance=target.mesh.position.distanceTo(camera.position),near=THREE.MathUtils.smoothstep(distance,C.vapen.lod_enkel_m*.85,C.vapen.lod_enkel_m*1.15),far=THREE.MathUtils.smoothstep(distance,C.vapen.lod_billboard_m*.85,C.vapen.lod_billboard_m*1.15),weights=[1-near,near*(1-far),far];target.levels.forEach((level,n)=>{level.visible=weights[n]>.01;level.material.opacity=weights[n];});}
 shadow.position.set(aircraft.position.x,height(aircraft.position.x,aircraft.position.z)+.7,aircraft.position.z);shadow.rotation.z=heading;shadow.material.opacity=Math.max(.03,.3-(aircraft.position.y-shadow.position.y)*.001);

 cam.sattVy({mal:[smoothTarget.x,smoothTarget.z],d:C.kamera.avstand,lutning:C.kamera.lutning,kurs:-THREE.MathUtils.radToDeg(heading)});cam.uppdatera(dt);
 aimPoint.copy(aircraft.position).addScaledVector(forward,400);projected.copy(aimPoint).project(camera);$('reticle').style.left=(projected.x*.5+.5)*innerWidth+'px';$('reticle').style.top=(-projected.y*.5+.5)*innerHeight+'px';$('reticle').style.display=projected.z<1?'block':'none';$('hit').style.opacity=time<hitUntil?1:0;
 renderer.render(scene,camera);
}
let previous=performance.now();renderer.setAnimationLoop(now=>{const elapsed=Math.max(.001,(now-previous)/1000),dt=Math.min(.05,elapsed);previous=now;tick(dt);frameCount++;frameTime+=elapsed;if(frameTime>.5){fps=frameCount/frameTime;frameCount=frameTime=0;$('metrics').textContent=`${fps.toFixed(0)} FPS · ${renderer.info.render.calls} anrop · ${Math.round(renderer.info.render.triangles/1000)}k tris · LADD ${loadSeconds.toFixed(1)} s · GPU≈${gpuEstimateMB.toFixed(0)} MB`;}});
const loadSeconds=(performance.now()-began)/1000;const gpuEstimateMB=(pos.array.byteLength+col.byteLength+ground.index.array.byteLength+modelInfo.triangles*3*32+W.falt_textur_px**2*4*1.34)/1048576;
window.flygTest={state:()=>({running,pitch,roll,heading,hits,shots,firing,gas,fps,time,position:aircraft.position.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,loadSeconds,gpuEstimateMB,modelInfo,voices:voices.length+(motor?1:0),native:gyro.nativeSource}),gyro,settings,targets,aircraft};
$('status').textContent='Redo · tryck Starta och håll mobilen bekvämt';
addEventListener('resize',()=>{renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);cam.storlek(innerWidth,innerHeight);});
document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('selectstart',e=>e.preventDefault());
