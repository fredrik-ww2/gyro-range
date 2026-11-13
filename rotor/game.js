import * as THREE from './vendor/three.module.js';
import {CanvasSceneRenderer} from './CanvasSceneRenderer.js';
import {ControlModule} from './controls/ControlModule.js';
import {FlightDynamics} from './controls/FlightDynamics.js';
import {CockpitView} from './CockpitView.js';
import {improveWorld} from './WorldVisuals.js';
import {GyroAdapter} from './controls/GyroAdapter.js';
import config from './config.json' with { type: 'json' };
import ljudManifest from './ljud.json' with { type: 'json' };
import {Ljud} from './ljud.js';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=THREE.MathUtils.lerp;
const control=new ControlModule(config.control),flight=new FlightDynamics(config.flight),gyro=new GyroAdapter(config.gyro);
let activeControls=control;
export function setControlModule(provider){if(!['getCyclic','getCollective','getYaw'].every(k=>typeof provider?.[k]==='function'))throw new TypeError('Invalid HelicopterControls provider');activeControls=provider;}
const settings=$('settings'),result=$('result');
const ljud=new Ljud(ljudManifest);
let soundOn=true;
try{const saved=localStorage.getItem(ljudManifest.storageKey);if(saved==='0')soundOn=false;}catch{}
let playing=false,mode='battle',armor=100,ammo=12,kills=0,firing=false,burstLeft=0,gunCooldown=0,missileCooldown=0,locked=null,clock=0,last=performance.now(),uiTick=0,hitClock=0;
let aimTouch={x:0,y:0},aimBase={x:0,y:0},inspectionBlend=0,hold=null,yawPreference=config.control.yawMode,directSight=null,fingerAim=null;
const keys=new Set(),touch={x:0,y:0,left:false,right:false},test={pitch:0,roll:0,yaw:0};
let collective=config.flight.hoverCollective,notice='',noticeUntil=0;
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});}catch(error){renderer=new CanvasSceneRenderer($('world'));$('loading').textContent='Enklare grafik · WebGL saknas';}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa6c2c8);scene.fog=new THREE.FogExp2(0xa6c2c8,.0004);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.045,5200);
scene.add(new THREE.HemisphereLight(0xcce4e5,0x343c28,1.3));const sun=new THREE.DirectionalLight(0xffe5b1,2.6);sun.position.set(-300,460,180);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-120;sun.shadow.camera.right=120;sun.shadow.camera.top=120;sun.shadow.camera.bottom=-120;sun.shadow.camera.far=1000;sun.shadow.bias=-.001;scene.add(sun);scene.add(sun.target);
const materials={};function mat(color,roughness=.8,metalness=0){const key=`${color}/${roughness}/${metalness}`;return materials[key]??=new THREE.MeshStandardMaterial({color,roughness,metalness});}
const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,12),sphereGeo=new THREE.SphereGeometry(1,16,12);
function mesh(g,m,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(parent,x,y,z,sx,sy,sz,color){return mesh(boxGeo,mat(color),parent,x,y,z,sx,sy,sz);}
function cylinder(parent,x,y,z,r,h,color){return mesh(cylGeo,mat(color),parent,x,y,z,r,h,r);}
function ellipsoid(parent,x,y,z,sx,sy,sz,color,roughness=.8,metalness=0){return mesh(sphereGeo,mat(color,roughness,metalness),parent,x,y,z,sx,sy,sz);}
let seed=62903;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const islands=[[-120,-170,440,320,55],[-740,-650,420,410,160],[640,-600,400,520,130],[680,520,290,230,40],[-790,520,360,280,95],[20,-1340,580,350,180]];
function heightAt(x,z){let h=-12;for(const [ix,iz,rx,rz,peak]of islands){const d=((x-ix)/rx)**2+((z-iz)/rz)**2;h+=peak*Math.exp(-d*1.7);}return h+Math.sin(x*.023)*Math.cos(z*.019)*3.8+Math.sin(x*.064+z*.053)*1.2;}
const terrainGeo=new THREE.PlaneGeometry(4200,4200,256,256);terrainGeo.rotateX(-Math.PI/2);const positions=terrainGeo.attributes.position,colors=[];
for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i),h=heightAt(x,z);positions.setY(i,h);const c=new THREE.Color(h<2?0x9a9676:h<9?0x777d56:h<52?0x455940:h<95?0x5f6c5c:0x8b9182);c.multiplyScalar(.85+random()*.23);colors.push(c.r,c.g,c.b);}terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainGeo.computeVertexNormals();const terrain=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));terrain.receiveShadow=true;scene.add(terrain);
if(renderer.software){const g=new THREE.PlaneGeometry(4200,4200,65,65);g.rotateX(-Math.PI/2);const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const y=heightAt(p.getX(i),p.getZ(i));p.setY(i,Math.max(0,y));const col=new THREE.Color(y<2?0x446b72:y<9?0x777d56:y<65?0x455940:0x777d70);c.push(col.r,col.g,col.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));terrain.userData.softwareGeometry=g;}
const water=new THREE.Mesh(new THREE.PlaneGeometry(12000,12000),new THREE.ShaderMaterial({uniforms:{time:{value:0},eye:{value:new THREE.Vector3()}},vertexShader:'varying vec3 wp; void main(){vec4 p=modelMatrix*vec4(position,1.0);wp=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',fragmentShader:'varying vec3 wp;uniform float time;uniform vec3 eye;void main(){vec2 p=wp.xz;float w=sin(p.x*.13+time)*sin(p.y*.17+time*.7)+sin(p.x*.035-p.y*.07+time*.6);vec3 n=normalize(vec3(w*.06,1.,cos(p.x*.17+time)*.08));vec3 v=normalize(eye-wp);float f=pow(1.-max(dot(n,v),0.),3.);vec3 col=mix(vec3(.055,.20,.24),vec3(.45,.62,.65),f);vec3 l=normalize(vec3(-.5,.8,.4));float s=pow(max(dot(reflect(-l,n),v),0.),150.);col+=vec3(1.,.84,.57)*s*.7;col+=w*.009;float fog=1.-exp(-length(eye-wp)*.0003);gl_FragColor=vec4(mix(col,vec3(.65,.76,.78),fog),1.);}'}));water.rotation.x=-Math.PI/2;scene.add(water);
// Instanced foliage: two draws for hundreds of trees.
const treePositions=[];for(let i=0;i<1700;i++){let x=(random()-.5)*2700,z=(random()-.5)*2900,h=heightAt(x,z);if(h>10&&h<115&&Math.hypot(x+100,z+160)>190)treePositions.push([x,h,z,6+random()*8]);}
function pineGeometry(){const positions=[],normals=[];for(let tier=0;tier<3;tier++){const g=new THREE.ConeGeometry(1-tier*.22,.65,7).toNonIndexed();g.translate(0,tier*.23-.15,0);positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return g;}
const crowns=new THREE.InstancedMesh(pineGeometry(),mat(0x314c3d),treePositions.length),trunks=new THREE.InstancedMesh(cylGeo,mat(0x665f46),treePositions.length),dummy=new THREE.Object3D();
treePositions.forEach(([x,y,z,h],i)=>{dummy.position.set(x,y+h*.65,z);dummy.scale.set(h*.34,h,h*.34);dummy.rotation.y=random()*6.28;dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new THREE.Color().setHSL(.27+random()*.08,.16+random()*.15,.18+random()*.07));dummy.position.y=y+h*.3;dummy.scale.set(.55,h*.7,.55);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);});scene.add(crowns,trunks);
function building(x,z,w,d,h){const g=new THREE.Group(),y=Math.max(.5,heightAt(x,z));g.position.set(x,y,z);box(g,0,h/2,0,w,h,d,0x858b7e);box(g,0,h+.4,0,w+1,.8,d+1,0x4d5a53);for(let i=-w/2+2;i<w/2;i+=4)box(g,i,h*.6,-d/2-.03,1.4,1.5,.1,0x293f43);scene.add(g);return g;}
for(let i=0;i<22;i++){const x=-280+(i%6)*43,z=-140-Math.floor(i/6)*38;building(x,z,14+random()*9,18+random()*10,5+random()*14);}
const harbor=new THREE.Group();harbor.position.set(-50,1.8,40);for(let i=0;i<3;i++){box(harbor,i*30,0,0,15,3,110,0x747f79);for(let j=0;j<8;j++)cylinder(harbor,i*30-6,2,-45+j*13,.7,1.5,0x353d39);}scene.add(harbor);
for(let i=0;i<18;i++){let x=-140+random()*110,z=10+random()*35;box(scene,x,Math.max(3,heightAt(x,z))+2.5,z,11,5,5,[0x795348,0x697c78,0xa0966b][i%3]);}
function createHeli(){const g=new THREE.Group();ellipsoid(g,0,.2,0,2.3,2.2,5.6,0x3f4a40);ellipsoid(g,0,.6,-3,2,1.5,2.5,0x142f37,.17,.6);box(g,0,.7,-4.5,.13,1.9,2,0x72806e);box(g,0,1.3,-2.8,4.1,.14,.2,0x687662);ellipsoid(g,0,-.3,-4.9,1.3,.7,1.1,0x434c3e);cylinder(g,0,-1.65,-4.1,.65,.5,0x222a26);box(g,0,-1.8,-6,.25,.25,3.7,0x242b27);
for(const s of [-1,1]){ellipsoid(g,s*1.6,1.7,1.7,.83,.8,2.4,0x525c4b);const exhaust=cylinder(g,s*1.6,1.7,4,.53,1.2,0x252b26);exhaust.rotation.x=Math.PI/2;box(g,s*3.4,-.3,1.1,4.3,.28,1.6,0x3f4a3e);for(let j=0;j<2;j++){const pod=cylinder(g,s*(3.2+j*1.35),-.8,1.0,.52,3.2,0x3b4035);pod.rotation.x=Math.PI/2;for(let n=0;n<4;n++){const tube=cylinder(g,s*(3.2+j*1.35)+Math.cos(n*1.57)*.23,-.8+Math.sin(n*1.57)*.23,-.65,.13,.05,0x171f1b);tube.rotation.x=Math.PI/2;}}box(g,s*1.5,-2.2,1.5,.14,1.8,.18,0x323c34);const wheel=cylinder(g,s*1.7,-3,1.6,.55,.4,0x202621);wheel.rotation.z=Math.PI/2;}
const tail=mesh(new THREE.CylinderGeometry(.3,.9,11,10),mat(0x4e5c49),g,0,1.1,9,1,1,1);tail.rotation.x=-Math.PI/2+.1;box(g,0,2.4,13.5,.22,4,2.3,0x4e5b45);box(g,0,1,10.5,6,.19,1.2,0x47533f);const tailRotor=new THREE.Group();tailRotor.position.set(.45,2.5,13.8);box(tailRotor,0,0,0,.14,3.9,.28,0x252e26);box(tailRotor,0,0,0,.14,.28,3.9,0x252e26);g.add(tailRotor);cylinder(g,0,3,0,.35,2,0x90988b);const rotor=new THREE.Group();rotor.position.set(0,3.8,0);for(let i=0;i<4;i++){const blade=box(rotor,0,0,-6.3,.63,.12,12.6,0x242d29);blade.rotation.y=i*Math.PI/2;blade.position.set(-Math.sin(i*Math.PI/2)*6.3,0,-Math.cos(i*Math.PI/2)*6.3);}g.add(rotor);const ring=mesh(new THREE.CircleGeometry(12.6,48),new THREE.MeshBasicMaterial({color:0x8b9c91,transparent:true,opacity:.07,side:THREE.DoubleSide,depthWrite:false}),g,0,3.85,0);ring.rotation.x=-Math.PI/2;ellipsoid(g,-5.5,0,1.2,.16,.16,.16,0xef4935);ellipsoid(g,5.5,0,1.2,.16,.16,.16,0x72e3aa);g.userData={rotor,tailRotor};return g;}
const heli=createHeli();scene.add(heli);
const exteriorMaterials=[];heli.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.userData.baseOpacity=o.material.opacity;exteriorMaterials.push(o.material);}});
const cockpit=new CockpitView(scene);
improveWorld({scene,terrain,renderer,materials,heli,water});

const targets=[];
function addTarget(x,z,type){const g=new THREE.Group(),y=type==='ship'?1:Math.max(3,heightAt(x,z));g.position.set(x,y,z);if(type==='ship'){box(g,0,2,0,15,6,54,0x626f6a);box(g,0,6,0,12,2,47,0x7d8477);box(g,0,10,3,9,7,17,0x879087);box(g,0,16,6,5,5,8,0x64766f);box(g,0,14,1.8,7,1,.25,0x253e41);cylinder(g,0,23,7,.35,15,0x727f71);box(g,0,26,7,10,2,.7,0x536c64);cylinder(g,0,8,-16,2.8,2,0x6e7a6c);box(g,0,9,-20,.65,.65,8,0x48574a);}else{box(g,0,2,0,6,3,10,0x5d654c);for(const s of[-1,1]){box(g,s*3,1.4,0,1.2,2.5,10.8,0x2b332b);for(let j=0;j<5;j++){const w=cylinder(g,s*3.65,1.4,-4+j*2,.86,.15,0x69705b);w.rotation.z=Math.PI/2;}}box(g,0,4,-.3,4,2,5,0x6e7356);box(g,0,4.2,-5,.4,.4,7,0x585e47);}scene.add(g);const marker=document.createElement('div');marker.className='marker';marker.innerHTML='<span></span>';$('targetMarkers').append(marker);targets.push({mesh:g,marker,type,hp:type==='ship'?170:100,maxHp:type==='ship'?170:100,alive:true,cooldown:4+random()*4,pos:new THREE.Vector3(x,y+(type==='ship'?9:3),z),radius:type==='ship'?15:7});}
addTarget(5,180,'ship');addTarget(-165,-90,'tank');addTarget(-260,-240,'tank');addTarget(370,120,'ship');addTarget(-45,-290,'tank');
// Thin distant cloud banks, shared geometry/material.
const cloudMat=new THREE.MeshBasicMaterial({color:0xf3ead4,transparent:true,opacity:.14,depthWrite:false});for(let i=0;i<(renderer.software?17:0);i++)mesh(sphereGeo,cloudMat,scene,(random()-.5)*3700,420+random()*120,-1800-random()*1400,150+random()*170,18+random()*15,55+random()*80).castShadow=false;
const effects=[],projectiles=[];const glowGeo=new THREE.SphereGeometry(1,6,4),fireMat=new THREE.MeshBasicMaterial({color:0xffc670}),smokeMat=new THREE.MeshBasicMaterial({color:0x4d5149,transparent:true,opacity:.6,depthWrite:false});
function burst(pos,count=12){for(let i=0;i<count;i++){const particle=new THREE.Mesh(glowGeo,i<count*.5?fireMat:smokeMat);particle.position.copy(pos);const size=1+random()*3;particle.scale.setScalar(size);scene.add(particle);effects.push({mesh:particle,velocity:new THREE.Vector3((random()-.5)*24,random()*15,(random()-.5)*24),life:1+random()*1.2,max:2.2,size,smoke:i>=count*.5});}}
function flashMessage(message,duration=2.8){notice=message;noticeUntil=clock+duration;}
function impactDistance(pos){return camera.position.distanceTo(pos);}
function impactSound(pos,kind){const d=impactDistance(pos);if(kind==='explosion')ljud.play('explosion',{distance:d});else if(hitClock<=0){ljud.play('hit',{distance:d});hitClock=.12;}}
function damage(target,amount){if(!target?.alive)return;target.hp-=amount;burst(target.pos,amount>30?14:3);if(target.hp<=0){target.alive=false;target.marker.hidden=true;target.mesh.traverse(o=>{if(o.isMesh)o.material=mat(0x30352e);});kills++;burst(target.pos,24);impactSound(target.pos,'explosion');flashMessage('MÅL UTSLAGET · '+kills+' / 5');if(kills===targets.length&&mode==='battle')finish(true);}else impactSound(target.pos,amount>30?'explosion':'hit');}
function spawnProjectile(from,to,{enemy=false,missile=false,target=null}={}){const p=new THREE.Mesh(new THREE.SphereGeometry(missile?.65:.23,6,4),new THREE.MeshBasicMaterial({color:enemy?0xff7d4b:0xffedab}));p.position.copy(from);scene.add(p);const direction=new THREE.Vector3().subVectors(to,from).normalize();p.scale.set(1,1,missile?4:8);p.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction);projectiles.push({mesh:p,velocity:direction.multiplyScalar(missile?145:enemy?120:520),life:missile?6:3,enemy,missile,target});}
function startAudio(){ljud.setEnabled(soundOn);if(soundOn)ljud.unlock();}
function fireMissile(){if(!playing||settings.open||result.open||missileCooldown>0||ammo<=0)return;if(!locked){flashMessage('Rikta mot ett rött mål för mållåsning.');return;}ammo--;missileCooldown=config.weapons.missileCooldown;const from=weaponOrigin.clone();spawnProjectile(from,locked.pos,{missile:true,target:locked});ljud.play('rocket');}


function fmt(row,value){const n=Number(value),d=row.digits??0;return (d?n.toFixed(d):String(Math.round(n)))+(row.suffix||'');}
function readSetting(row){if(row.group==='flight')return flight.params[row.id];if(row.id==='sound')return soundOn;return control.settings[row.id];}
function writeSetting(row,value){
  if(row.group==='flight'){
    const patch={[row.id]:value};
    if(row.id==='transLiftStartKnots'&&value>=flight.params.transLiftEndKnots)patch.transLiftEndKnots=value+5;
    if(row.id==='transLiftEndKnots'&&value<=flight.params.transLiftStartKnots)patch.transLiftStartKnots=Math.max(0,value-5);
    flight.configure(patch);
  }else control.configure({[row.id]:value});
  if(row.id==='inputTimeoutSeconds')gyro.staleSeconds=value;
}
function buildMenu(){
  const box=$('tuning');
  for(const row of config.menu){
    const label=document.createElement('label');label.className='range-setting';
    const span=document.createElement('span');const out=document.createElement('output');
    span.append(document.createTextNode(row.label+' '),out);
    const input=document.createElement('input');input.type='range';input.id=row.id;input.min=row.min;input.max=row.max;input.step=row.step;input.value=readSetting(row);
    const paint=()=>{out.textContent=fmt(row,readSetting(row));input.value=readSetting(row);};
    input.oninput=()=>{writeSetting(row,+input.value);paint();syncModeUI();};
    paint();label.append(span,input);box.append(label);
  }
  for(const row of config.toggles){
    const label=document.createElement('label');label.className='setting';
    const span=document.createElement('span');span.append(document.createTextNode(row.label));
    if(row.text){const small=document.createElement('small');small.textContent=row.text;span.append(small);}
    const input=document.createElement('input');input.type='checkbox';input.id=row.id;input.checked=!!readSetting(row);
    input.onchange=()=>{
      if(row.id==='sound'){soundOn=input.checked;try{localStorage.setItem(ljudManifest.storageKey,soundOn?'1':'0');}catch{}ljud.setEnabled(soundOn);ljud.play('click');return;}
      if(row.group==='flight')flight.configure({[row.id]:input.checked});
      else control.configure({[row.id]:input.checked});
      syncModeUI();
    };
    label.append(span,input);$('toggles').append(label);
  }
  const modeSel=$('controlMode');
  for(const m of config.modes){const o=document.createElement('option');o.value=m.id;o.textContent=m.label;modeSel.append(o);}
  modeSel.value=control.settings.controlMode;modeSel.onchange=()=>applyMode(modeSel.value);
  const yawSel=$('yawMode');
  for(const m of config.yawModes){const o=document.createElement('option');o.value=m.id;o.textContent=m.label;yawSel.append(o);}
  yawSel.value=control.settings.yawMode;
  yawSel.onchange=()=>{yawPreference=yawSel.value;if(control.settings.controlMode!=='gyro-aim')control.configure({yawMode:yawSel.value});syncModeUI();};
  $('cameraView').value=control.settings.view;
  $('cameraView').onchange=e=>setView(e.target.value);
  $('lookDown').onclick=()=>{control.setLookDown(!control.getViewState().lookDown);syncModeUI();};
}
function syncModeUI(){
  const mode=control.settings.controlMode,aim=control.settings.aimEnabled,view=control.getViewState();
  for(const id of ['gyro-flight','gyro-aim','gyro-both','touch'])document.body.classList.toggle('mode-'+id,mode===id);
  $('controlMode').value=mode;
  $('yawMode').value=mode==='gyro-aim'?'pedals':control.settings.yawMode;
  $('yawMode').disabled=mode==='gyro-aim';
  $('cameraView').value=control.settings.view;
  $('cameraView').disabled=!control.settings.cockpitEnabled;
  const tick=(id,on)=>{const el=$(id);if(el)el.checked=!!on;};
  tick('cockpitEnabled',control.settings.cockpitEnabled);tick('aimEnabled',aim);tick('hoverAssist',flight.assists.hover);tick('autoTorque',flight.assists.autoTorque);tick('sound',soundOn);
  $('cyclicBlock').hidden=!(mode==='touch'||mode==='gyro-aim');
  const touchAim=aim&&(mode==='gyro-flight'||mode==='touch'||(mode==='gyro-both'&&!control.clutch));
  $('windshield').hidden=!touchAim;
  $('aimFocus').hidden=mode!=='gyro-both'||!aim;
  $('pedals').hidden=(mode==='gyro-flight'||mode==='gyro-both')&&control.settings.yawMode==='orientation';
  $('calibrate').hidden=mode==='touch';
  const center=$('centerAim');if(center)center.hidden=!aim;
  $('aimFocus').textContent=control.clutch?'STYR HELIKOPTERN':'STYR SIKTET';
  $('aimFocus').setAttribute('aria-pressed',String(!!control.clutch));
  $('lookDown').textContent=view.lookDown?'Se framåt':'Se spaken';
  $('modeHelp').textContent=config.help[mode]||'';
}
function applyMode(next){
  const yawMode=next==='gyro-aim'?'pedals':yawPreference;
  control.setControlMode(next);
  if(control.settings.yawMode!==yawMode)control.configure({yawMode});
  if(next!=='gyro-both')control.setAimClutch(false);
  syncModeUI();
}
function setView(view){control.setView(view);control.setLookDown(false);syncModeUI();}
function toggleFocus(){if(control.settings.controlMode!=='gyro-both'||!control.settings.aimEnabled)return;control.setAimClutch(!control.clutch);syncModeUI();}
function resetAim(){control.centerAim();aimTouch={x:0,y:0};aimBase={x:0,y:0};directSight=null;fingerAim=null;}
function snapAim(x,y){const prev=control.settings.aimSmoothingSeconds;if(prev!==0)control.configure({aimSmoothingSeconds:0});control.setAim({x,y});control.update(0);if(prev!==0)control.configure({aimSmoothingSeconds:prev});}
function aimFromWindshield(clientX,clientY){
  const ndcX=(clientX/innerWidth)*2-1,ndcY=-(clientY/innerHeight)*2+1;
  raycaster.setFromCamera(aimNdc.set(ndcX,ndcY),camera);
  aimLocal.copy(raycaster.ray.direction).applyQuaternion(aimQuat.copy(heli.quaternion).invert());
  const yaw=Math.atan2(aimLocal.x,-aimLocal.z),pitch=Math.asin(clamp(aimLocal.y,-1,1));
  directSight={yaw,pitch};
  const limits=control.settings;
  snapAim(clamp(yaw/(limits.aimYawLimitDeg*Math.PI/180),-1,1),clamp((pitch-config.cockpit.boreSightDeg*Math.PI/180)/(limits.aimPitchLimitDeg*Math.PI/180),-1,1));
  fingerAim={x:clientX,y:clientY};
}
function releaseInputs(){keys.clear();touch.x=touch.y=0;aimTouch={x:0,y:0};touch.left=touch.right=false;firing=false;burstLeft=0;fingerAim=null;control.releaseMomentaryInputs();$('stick').style.transform='translate(-50%,-50%)';document.querySelectorAll('.held,.grown').forEach(e=>e.classList.remove('held','grown'));syncModeUI();}
function updateCollectiveUI(){const pct=Math.round(collective*100);$('collectiveValue').textContent='LYFT '+pct+'%';$('collective').setAttribute('aria-valuenow',pct);}
function setCollective(value){collective=clamp(value,0,1);control.setCollective(collective);updateCollectiveUI();}
function bindDrag(element,onMove,onEnd){let pointer=null;element.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;element.setPointerCapture(pointer);onMove(e);});element.addEventListener('pointermove',e=>{if(e.pointerId===pointer)onMove(e);});const end=e=>{if(e.pointerId!==pointer)return;pointer=null;onEnd?.();};element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);element.addEventListener('lostpointercapture',end);}
bindDrag($('collective'),e=>{if(!$('collective').classList.contains('dragging')){$('collective').classList.add('dragging');ljud.play('click');}const r=$('collective').getBoundingClientRect();setCollective(1-(e.clientY-r.top)/r.height);},()=>$('collective').classList.remove('dragging'));
$('collective').addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();setCollective(e.key==='Home'?0:e.key==='End'?1:collective+(e.key==='ArrowUp'?0.02:-0.02));}});
bindDrag($('cyclic'),e=>{const r=$('cyclic').getBoundingClientRect(),radius=r.width*.35;touch.x=clamp((e.clientX-r.left-r.width/2)/radius,-1,1);touch.y=clamp(-(e.clientY-r.top-r.height/2)/radius,-1,1);$('stick').style.transform=`translate(calc(-50% + ${touch.x*radius}px), calc(-50% - ${touch.y*radius}px))`;},()=>{touch.x=touch.y=0;$('stick').style.transform='translate(-50%,-50%)';});
function holdButton(id,fn){const el=$(id);bindDrag(el,()=>{el.classList.add('held');fn(true);},()=>{el.classList.remove('held');fn(false);});}
holdButton('yawLeft',v=>{touch.left=v;if(v)ljud.play('pedal');});holdButton('yawRight',v=>{touch.right=v;if(v)ljud.play('pedal');});
bindDrag($('windshield'),e=>{if($('windshield').hidden)return;aimFromWindshield(e.clientX,e.clientY);},()=>{fingerAim=null;});
let firePointer=null,fireStamp=0,fireHold=0,fireTaps=0,fireWait=0;
function clearFireWait(){if(fireWait){clearTimeout(fireWait);fireWait=0;}}
$('fire').addEventListener('pointerdown',e=>{if(firePointer!==null)return;e.preventDefault();firePointer=e.pointerId;$('fire').setPointerCapture(firePointer);fireStamp=performance.now();$('fire').classList.add('held');startAudio();clearTimeout(fireHold);fireHold=setTimeout(()=>{firing=true;clearFireWait();fireTaps=0;},config.weapons.tapMs);});
function endFire(e){if(e.pointerId!==firePointer)return;firePointer=null;$('fire').classList.remove('held');clearTimeout(fireHold);const held=firing;firing=false;if(held)return;fireTaps++;if(fireTaps>=2){fireTaps=0;clearFireWait();fireMissile();}else{clearFireWait();fireWait=setTimeout(()=>{fireTaps=0;fireWait=0;burstLeft=config.weapons.gunBurst;},config.weapons.doubleTapMs);}}
$('fire').addEventListener('pointerup',endFire);$('fire').addEventListener('pointercancel',endFire);
$('centerAim').onclick=()=>{resetAim();ljud.play('click');};$('aimFocus').onclick=toggleFocus;
for(const el of document.querySelectorAll('.gauge')){
  el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.setPointerCapture(e.pointerId);const scale=config.layout.gaugeHoldScale;const r=el.getBoundingClientRect();const cx=r.left+r.width/2;const half=r.width*scale/2;let origin=50;if(cx-half<8)origin=12;else if(cx+half>innerWidth-8)origin=88;el.style.transformOrigin=origin+'% 100%';el.classList.add('grown');});
  const shrink=e=>{el.classList.remove('grown');};el.addEventListener('pointerup',shrink);el.addEventListener('pointercancel',shrink);
}
async function calibrate(){try{await gyro.requestPermission();}catch{}gyro.calibrate();control.feedOrientation({pitch:0,roll:0,yaw:0});control.calibrate();flashMessage('Den här lutningen är nu noll.');}
$('calibrate').onclick=calibrate;
$('testCalibrate').onclick=()=>{control.feedOrientation(test);calibrate();};
for(const axis of ['Pitch','Roll','Yaw'])$('test'+axis).oninput=e=>{test[axis.toLowerCase()]=+e.target.value;$('test'+axis+'Out').textContent=e.target.value+'°';};
function showSettings(){releaseInputs();ljud.play('click');settings.showModal();ljud.setDucked(true);}
$('menuBtn').onclick=showSettings;$('closeSettings').onclick=()=>settings.close();
settings.addEventListener('close',()=>{releaseInputs();ljud.setDucked(false);last=performance.now();});
settings.addEventListener('click',e=>{if(e.target===settings){const r=settings.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settings.close();}});
function start(which){
  mode=which;playing=true;armor=100;ammo=12;kills=0;flight.reset();setCollective(flight.params.hoverCollective);releaseInputs();
  gyro.calibrate();control.feedOrientation({pitch:0,roll:0,yaw:0});control.calibrate();
  if(control.settings.view==='cockpit'&&control.settings.cockpitEnabled)control.viewBlend=1;
  if(settings.open)settings.close();if(result.open)result.close();$('briefing').hidden=true;$('aircraftCard').hidden=true;$('hud').hidden=false;$('missionHud').hidden=false;document.body.classList.add('playing');
  $('missionLabel').textContent=mode==='practice'?'TRÄNING / FRI FLYGNING':'OPERATION / SKÄRGÅRD';
  for(const t of targets){t.hp=t.maxHp;t.alive=true;t.cooldown=6+random()*4;t.mesh.traverse(o=>{if(o.isMesh)o.material=mat(t.type==='ship'?0x6e7a6b:0x5d654c);});}
  for(const p of projectiles)removeProjectile(p);projectiles.length=0;for(const e of effects)scene.remove(e.mesh);effects.length=0;
  camera.position.set(flight.x,flight.y+8,flight.z+18);camLook.set(flight.x,flight.y,flight.z-40);ljud.setDucked(false);ljud.setEnabled(soundOn);startAudio();
  flashMessage(mode==='practice'?'Fri flygning. Luta telefonen och känn efter.':'Slå ut de fem markerade målen.',4);
  resetAim();syncModeUI();
}
async function begin(which){let access=null;try{access=await gyro.requestPermission();}catch{}start(which);if(access&&access.allowed===false)flashMessage('Gyrot är avstängt i telefonen. Välj Bara spakar i menyn.',4);}
$('startBattle').onclick=()=>begin('battle');$('startPractice').onclick=()=>begin('practice');$('restart').onclick=()=>begin(mode);$('playAgain').onclick=()=>begin(mode);$('practiceAgain').onclick=()=>begin('practice');
function finish(win){if(result.open)return;releaseInputs();$('resultEyebrow').textContent=win?'UPPDRAG SLUTFÖRT':'UPPDRAG AVBRUTET';$('resultTitle').textContent=win?'Området säkrat.':'Helikoptern utslagen.';$('resultText').textContent=win?`Alla fem mål utslagna. Flygtid ${Math.floor(flight.elapsed/60)}:${String(Math.floor(flight.elapsed%60)).padStart(2,'0')}. Pansar kvar: ${Math.ceil(armor)}%.`:'Försök igen, eller träna på att hålla höjden under fri flygning.';result.showModal();ljud.setDucked(true);}
result.addEventListener('cancel',e=>e.preventDefault());
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!settings.open&&!result.open)showSettings();return;}if(settings.open||result.open||/INPUT|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='x')fireMissile();if(k==='c')calibrate();if(k==='h'){flight.configure({hoverAssist:!flight.assists.hover});syncModeUI();}if(k==='v')setView(control.settings.view==='cockpit'?'external':'cockpit');if(k==='b'){control.configure({aimEnabled:!control.settings.aimEnabled});syncModeUI();}if(k==='g')toggleFocus();if(k==='o'){control.setLookDown(!control.getViewState().lookDown);syncModeUI();}if(k==='z')resetAim();});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{releaseInputs();if(playing&&!settings.open&&!result.open)showSettings();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseInputs();if(playing&&!settings.open&&!result.open)showSettings();}last=performance.now();});
function stickAxes(){
  const x=clamp(touch.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),-1,1);
  const y=clamp(touch.y+(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),-1,1);
  const pedal=(touch.right||keys.has('e')?1:0)-(touch.left||keys.has('q')?1:0);
  return {x,y,pedal};
}
function updateInput(dt){
  const flightMode=control.settings.controlMode;
  const menuTest=settings.open&&$('controlTest').open;
  if(hold&&!settings.open&&!result.open){
    if(hold.orientation)control.feedOrientation(hold.orientation);
    if(hold.cyclic)control.setCyclic(hold.cyclic);
    if(hold.aim)control.setAim(hold.aim);
    if(hold.yaw!=null)control.setYaw(hold.yaw);
    if(hold.collective!=null)setCollective(hold.collective);
  }else if(menuTest){
    control.feedOrientation(test);
    if(flightMode==='touch'||flightMode==='gyro-aim')control.setCyclic({x:clamp(test.roll/control.settings.fullScaleDeg,-1,1),y:clamp(test.pitch/control.settings.fullScaleDeg,-1,1)});
  }else if(!settings.open&&!result.open){
    const axes=stickAxes();
    const sample=gyro.take();
    if(sample)control.feedOrientation(sample);
    else if(!gyro.fresh()&&flightMode!=='touch'&&flightMode!=='gyro-aim'&&(axes.x||axes.y||axes.pedal))control.feedOrientation({pitch:axes.y*control.settings.fullScaleDeg,roll:axes.x*control.settings.fullScaleDeg,yaw:axes.pedal*control.settings.yawFullScaleDeg});
    if(flightMode==='touch'||flightMode==='gyro-aim'){
      control.setCyclic({x:axes.x,y:axes.y});
      const radius=($('cyclic').clientWidth||120)*.35;
      $('stick').style.transform=`translate(calc(-50% + ${axes.x*radius}px), calc(-50% - ${axes.y*radius}px))`;
    }
    const ax=(keys.has('l')?1:0)-(keys.has('j')?1:0),ay=(keys.has('i')?1:0)-(keys.has('k')?1:0);
    if(control.settings.aimEnabled&&!control.clutch&&(flightMode==='gyro-flight'||flightMode==='touch')&&(ax||ay)){
      if(directSight){directSight.yaw=clamp(directSight.yaw+ax*dt*.7,-1.15,1.15);directSight.pitch=clamp(directSight.pitch+ay*dt*.55,-1.05,.7);}
      else{const a=control.getAimOffset();control.setAim({x:clamp(a.yaw/(control.settings.aimYawLimitDeg*Math.PI/180)+ax*dt*.8,-1,1),y:clamp(a.pitch/(control.settings.aimPitchLimitDeg*Math.PI/180)+ay*dt*.8,-1,1)});}
    }
    const gyroYaw=(flightMode==='gyro-flight'||flightMode==='gyro-both')&&control.settings.yawMode==='orientation';
    if(!gyroYaw)control.setYaw(axes.pedal);
    if(keys.has('r'))setCollective(collective+dt*.25);
    if(keys.has('f'))setCollective(collective-dt*.25);
  }
  control.update(dt);
}
buildMenu();syncModeUI();
window.helicopterInput=Object.freeze({
  feedOrientation:angles=>control.feedOrientation(angles),
  setOrientation:angles=>control.setOrientation(angles),
  setCyclic:value=>control.setCyclic(value),
  setCollective:value=>setCollective(value),
  setYaw:value=>control.setYaw(value),
  setAim:value=>control.setAim(value),
  setMode:applyMode,
  getMode:()=>control.settings.controlMode,
  calibrate:()=>calibrate(),
  getCyclic:()=>control.getCyclic(),
  getCollective:()=>control.getCollective(),
  getYaw:()=>control.getYaw(),
  getAimOffset:()=>control.getAimOffset(),
  update:dt=>control.update(dt),
  configure:options=>{control.configure(options);syncModeUI();},
  configureFlight:options=>flight.configure(options),
  hold(input){hold=input;},
  releaseHold(){hold=null;},
  snapshot:()=>({y:flight.y,vy:flight.vy,vx:flight.vx,vz:flight.vz,liftFactor:flight.liftFactor,pitch:flight.pitch,roll:flight.roll,knots:Math.hypot(flight.vx,flight.vz)*1.94384,mode:control.settings.controlMode,collective:control.getCollective(),playing,view:control.getViewState().view,clock,cyclic:control.getCyclic(),aim:control.getAimOffset()}),
  injectDevice:(alpha,beta,gamma,screen)=>gyro.ingest(alpha,beta,gamma,screen),
  gyroTake:()=>gyro.take(),
  ready:true
});

const projected=new THREE.Vector3(),temp=new THREE.Vector3(),forward=new THREE.Vector3(),camGoal=new THREE.Vector3(),lookGoal=new THREE.Vector3(),camLook=new THREE.Vector3();
const weaponDirection=new THREE.Vector3(),weaponOrigin=new THREE.Vector3(),aimPoint=new THREE.Vector3(),sightNdc=new THREE.Vector3(),cockpitPosition=new THREE.Vector3(),cameraPosition=new THREE.Vector3(),externalRotation=new THREE.Quaternion(),cockpitRotation=new THREE.Quaternion(),cameraRotation=new THREE.Quaternion(),headRotation=new THREE.Quaternion(),cameraMatrix=new THREE.Matrix4();
const raycaster=new THREE.Raycaster(),aimNdc=new THREE.Vector2(),aimLocal=new THREE.Vector3(),aimQuat=new THREE.Quaternion();
function sightLine(){
  let yaw,pitch;
  if(directSight&&(control.settings.controlMode==='gyro-flight'||control.settings.controlMode==='touch'||(control.settings.controlMode==='gyro-both'&&!control.clutch))){yaw=directSight.yaw;pitch=directSight.pitch;}
  else{const a=typeof activeControls.getAimOffset==='function'?activeControls.getAimOffset():{yaw:0,pitch:0};yaw=a.yaw;pitch=config.cockpit.boreSightDeg*Math.PI/180+a.pitch;}
  const cp=Math.cos(pitch);weaponDirection.set(Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp).applyQuaternion(heli.quaternion).normalize();weaponOrigin.set(0,-1.2,-5.8).applyQuaternion(heli.quaternion).add(heli.position);aimPoint.copy(weaponOrigin).addScaledVector(weaponDirection,900);sightNdc.copy(aimPoint).project(camera);const visible=sightNdc.z<1;
  const margin=config.layout.reticleMargin??10;
  const rx=fingerAim?fingerAim.x:clamp((sightNdc.x*.5+.5)*innerWidth,margin,innerWidth-margin);
  const ry=fingerAim?fingerAim.y:clamp((-.5*sightNdc.y+.5)*innerHeight,margin,innerHeight-margin);
  $('reticle').style.left=rx+'px';$('reticle').style.top=ry+'px';$('reticle').style.opacity=visible||fingerAim?1:.35;
}
function lineClear(a,b){for(let k=1;k<20;k++){const t=k/20,x=lerp(a.x,b.x,t),y=lerp(a.y,b.y,t),z=lerp(a.z,b.z,t);if(y<Math.max(0,heightAt(x,z)))return false;}return true;}
function chooseTarget(){sightLine();let best=.078;locked=null;
 for(const t of targets){if(!t.alive){t.marker.hidden=true;continue;}projected.copy(t.pos).project(camera);temp.copy(t.pos).sub(camera.position);camera.getWorldDirection(forward);const visible=temp.dot(forward)>0&&Math.abs(projected.x)<1.1&&Math.abs(projected.y)<1.1;const range=t.pos.distanceTo(weaponOrigin);t.marker.hidden=!visible;if(visible){t.marker.style.left=(projected.x*.5+.5)*innerWidth+'px';t.marker.style.top=(-projected.y*.5+.5)*innerHeight+'px';t.marker.querySelector('span').textContent=Math.round(range)+' m';}
  const angle=weaponDirection.angleTo(temp.copy(t.pos).sub(weaponOrigin));if(angle<best&&range<950&&lineClear(weaponOrigin,t.pos)){best=angle;locked=t;}
 }
 $('reticle').classList.toggle('locked',!!locked);$('lockLabel').textContent=locked?'MÅL LÅST · '+Math.round(locked.pos.distanceTo(weaponOrigin))+' M':control.settings.aimEnabled?'FRITT VAPENSIKTE':'FAST VAPENSIKTE';
}
function updateCamera(dt){const view=control.getViewState(),b=view.blend,portrait=innerHeight>innerWidth,rig=config.cockpit;inspectionBlend+=((view.lookDown?1:0)-inspectionBlend)*(1-Math.exp(-dt*6));
 camGoal.set(flight.x-Math.sin(flight.heading)*(portrait?48:40),flight.y+20,flight.z+Math.cos(flight.heading)*(portrait?48:40));lookGoal.set(flight.x+Math.sin(flight.heading)*80,flight.y-25-Math.sin(flight.pitch)*45,flight.z-Math.cos(flight.heading)*80);cameraMatrix.lookAt(camGoal,lookGoal,new THREE.Vector3(0,1,0));externalRotation.setFromRotationMatrix(cameraMatrix);
 cockpitPosition.set(rig.cameraX,rig.cameraY,rig.cameraZ+inspectionBlend*rig.inspectForward).applyQuaternion(heli.quaternion).add(heli.position);headRotation.setFromEuler(new THREE.Euler(-(rig.lookDownDeg+inspectionBlend*rig.inspectExtraDeg)*Math.PI/180,0,0));cockpitRotation.copy(heli.quaternion).multiply(headRotation);cameraPosition.copy(camGoal).lerp(cockpitPosition,b);cameraRotation.copy(externalRotation).slerp(cockpitRotation,b);
 if(b>.999){camera.position.copy(cameraPosition);camera.quaternion.copy(cameraRotation);}else{camera.position.lerp(cameraPosition,1-Math.exp(-dt*8));camera.quaternion.slerp(cameraRotation,1-Math.exp(-dt*8));}
 const fov=lerp(52,portrait?rig.fovPortrait:rig.fovLandscape,b);if(Math.abs(camera.fov-fov)>.01){camera.fov=fov;camera.updateProjectionMatrix();}camera.updateMatrixWorld();
 heli.visible=b<.995;const exteriorAlpha=1-THREE.MathUtils.smoothstep(b,0,.68);for(const m of exteriorMaterials){m.opacity=m.userData.baseOpacity*exteriorAlpha;m.transparent=m.opacity<.999;m.depthWrite=exteriorAlpha>.95;}
 cockpit.update(dt,activeControls,flight,view);document.body.classList.toggle('cockpit',b>.5);
}
function removeProjectile(p){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();}
function updateCombat(dt){gunCooldown-=dt;missileCooldown-=dt;hitClock-=dt;const shooting=firing||keys.has(' ')||burstLeft>0;if(shooting&&gunCooldown<=0){gunCooldown=config.weapons.gunInterval;if(burstLeft>0&&!firing&&!keys.has(' '))burstLeft--;const from=weaponOrigin.clone();const to=from.clone().addScaledVector(weaponDirection,700);spawnProjectile(from,to,{target:locked});ljud.play('gun');}for(const t of targets){if(!t.alive)continue;t.cooldown-=dt;if(mode==='battle'&&t.cooldown<0&&t.pos.distanceTo(heli.position)<650){t.cooldown=3+random()*3;spawnProjectile(t.pos,heli.position.clone().add(new THREE.Vector3(flight.vx,flight.vy,flight.vz).multiplyScalar(.8)),{enemy:true});}}
for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.life-=dt;if(p.missile&&p.target?.alive){temp.subVectors(p.target.pos,p.mesh.position).normalize().multiplyScalar(145);p.velocity.lerp(temp,1-Math.exp(-dt*5));}const before=p.mesh.position.clone();p.mesh.position.addScaledVector(p.velocity,dt);let hit=false;const line=new THREE.Line3(before,p.mesh.position);if(p.enemy){const near=line.closestPointToPoint(heli.position,true,new THREE.Vector3());if(near.distanceTo(heli.position)<5.5){armor=Math.max(0,armor-7);burst(heli.position,5);hit=true;ljud.play('hit',{distance:6});flashMessage('TRÄFF · UNDVIK FIENTLIG ELD',1);}}else{for(const t of targets){if(!t.alive)continue;const near=line.closestPointToPoint(t.pos,true,new THREE.Vector3());if(near.distanceTo(t.pos)<t.radius){damage(t,p.missile?105:9);hit=true;break;}}}if(p.mesh.position.y<Math.max(0,heightAt(p.mesh.position.x,p.mesh.position.z))){burst(p.mesh.position,4);if(!p.enemy)impactSound(p.mesh.position,'hit');hit=true;}if(hit||p.life<=0){removeProjectile(p);projectiles.splice(i,1);}}
if(armor<=0)finish(false);}
function updateEffects(dt){for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.mesh.position.addScaledVector(e.velocity,dt);e.velocity.multiplyScalar(Math.exp(-dt*.8));if(e.smoke)e.velocity.y+=dt*5;else e.velocity.y-=dt*12;e.mesh.scale.setScalar(e.size*(e.smoke?1+(e.max-e.life)*1.5:Math.max(.01,e.life/e.max)));if(e.life<=0){scene.remove(e.mesh);effects.splice(i,1);}}}
function bezel(c,w){c.clearRect(0,0,w,w);const mid=w/2;const ring=c.createRadialGradient(mid,mid,mid*.62,mid,mid,mid*.98);ring.addColorStop(0,'#1c2622');ring.addColorStop(.45,'#8b968a');ring.addColorStop(.72,'#e4ece0');ring.addColorStop(1,'#2c3832');c.fillStyle=ring;c.beginPath();c.arc(mid,mid,mid-1,0,Math.PI*2);c.fill();const face=c.createRadialGradient(mid*.85,mid*.7,8,mid,mid,mid*.8);face.addColorStop(0,'#24302b');face.addColorStop(1,'#0c1210');c.fillStyle=face;c.beginPath();c.arc(mid,mid,mid*.78,0,Math.PI*2);c.fill();c.strokeStyle='#ffffff18';c.lineWidth=w*.04;c.beginPath();c.arc(mid,mid,mid*.55,Math.PI*1.15,Math.PI*1.7);c.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;c.fillStyle='#d5ddd0';c.beginPath();c.arc(mid+Math.cos(a)*mid*.88,mid+Math.sin(a)*mid*.88,w*.018,0,Math.PI*2);c.fill();c.fillStyle='#1a221e';c.beginPath();c.arc(mid+Math.cos(a)*mid*.88,mid+Math.sin(a)*mid*.88,w*.007,0,Math.PI*2);c.fill();}return mid;}
function roundGauge(canvas,{label,text,value,min,max,ticks=8,needle}){const c=canvas.getContext('2d'),w=canvas.width,mid=bezel(c,w);const a0=Math.PI*.75,a1=Math.PI*2.25,span=a1-a0;c.strokeStyle='#d7e7c8';c.fillStyle='#d7e7c8';c.lineCap='round';c.textAlign='center';c.textBaseline='middle';for(let i=0;i<=ticks;i++){const a=a0+span*i/ticks,major=i%2===0,inner=mid*(major?0.5:0.58),outer=mid*.7;c.lineWidth=major?3:1.5;c.beginPath();c.moveTo(mid+Math.cos(a)*inner,mid+Math.sin(a)*inner);c.lineTo(mid+Math.cos(a)*outer,mid+Math.sin(a)*outer);c.stroke();}const t=clamp((value-min)/(max-min),0,1),ang=a0+span*t;c.save();c.translate(mid,mid);c.rotate(ang);c.fillStyle=needle||'#f0d7a4';c.beginPath();c.moveTo(mid*.52,0);c.lineTo(-mid*.12,mid*.045);c.lineTo(-mid*.16,0);c.lineTo(-mid*.12,-mid*.045);c.fill();c.restore();c.fillStyle='#dfe8d4';c.beginPath();c.arc(mid,mid,mid*.09,0,Math.PI*2);c.fill();c.fillStyle='#9eb396';c.font=`700 ${Math.round(w*.055)}px monospace`;c.fillText(label,mid,mid*1.42);c.fillStyle='#f4f7ee';c.font=`600 ${Math.round(w*.07)}px monospace`;c.fillText(text,mid,mid*1.18);}
function drawRadarGauge(){const canvas=$('radar'),c=canvas.getContext('2d'),w=canvas.width,mid=bezel(c,w),R=mid*.62;c.strokeStyle='#9dba98';c.lineWidth=1.5;for(const k of[.33,.66,1]){c.beginPath();c.arc(mid,mid,R*k,0,Math.PI*2);c.stroke();}c.save();c.translate(mid,mid);c.rotate(-flight.heading);c.strokeStyle='#6e8f72';c.font=`700 ${Math.round(w*.055)}px monospace`;c.fillStyle='#d5e6c8';c.textAlign='center';c.textBaseline='middle';const letters=['N','O','S','V'];for(let i=0;i<4;i++){const a=i*Math.PI/2-Math.PI/2;c.fillText(letters[i],Math.cos(a)*R*1.05,Math.sin(a)*R*1.05);c.beginPath();c.moveTo(Math.cos(a)*R*.82,Math.sin(a)*R*.82);c.lineTo(Math.cos(a)*R,Math.sin(a)*R);c.stroke();}for(const t of targets){if(!t.alive)continue;let x=(t.pos.x-flight.x)/700*R,z=(t.pos.z-flight.z)/700*R;const len=Math.hypot(x,z);if(len>R*.92){x*=R*.92/len;z*=R*.92/len;}c.fillStyle=t===locked?'#ffd0a4':'#ff8d72';c.fillRect(x-4,z-4,8,8);}c.restore();c.fillStyle='#d4ec99';c.beginPath();c.moveTo(mid,mid-R*.42);c.lineTo(mid-7,mid+8);c.lineTo(mid+7,mid+8);c.fill();const heading=(flight.heading*180/Math.PI%360+360)%360;c.fillStyle='#f4f7ee';c.font=`600 ${Math.round(w*.07)}px monospace`;c.textAlign='center';c.fillText(String(Math.round(heading)%360).padStart(3,'0')+'°',mid,mid+R*.55);c.strokeStyle=armor<35?'#e07060':'#d1eb81';c.lineWidth=w*.035;c.beginPath();c.arc(mid,mid,mid*.84,Math.PI*.15,Math.PI*.15+Math.PI*1.7*(armor/100));c.stroke();c.fillStyle='#9eb396';c.font=`700 ${Math.round(w*.045)}px monospace`;c.fillText('PANSAR '+Math.ceil(armor)+'%',mid,mid+R*.95);}
function drawGauges(){const knots=Math.hypot(flight.vx,flight.vz)*1.94384;roundGauge($('gaugeSpeed'),{label:'FART',text:Math.round(knots)+' kn',value:knots,min:0,max:160,needle:knots>120?'#e7a0a0':'#f0d7a4'});roundGauge($('gaugeAlt'),{label:'HÖJD',text:Math.round(flight.y)+' m',value:flight.y,min:0,max:400});const vy=flight.vy;roundGauge($('gaugeVsi'),{label:'STIG',text:(vy>=0?'+':'')+vy.toFixed(1),value:vy,min:-12,max:12,needle:vy<-4?'#e7a0a0':'#f0d7a4'});drawRadarGauge();}
function updateHud(){const knots=Math.hypot(flight.vx,flight.vz)*1.94384;$('ammo').textContent=ammo;$('fire').classList.toggle('empty',ammo<=0);$('objective').textContent=mode==='practice'?'Fri flygning · lär känna helikoptern':`Slå ut fientliga mål · ${kills} / 5`;const gyroMode=control.settings.controlMode!=='touch',stale=gyroMode&&gyro.seen&&!gyro.fresh();const low=flight.y<Math.max(0,heightAt(flight.x,flight.z))+12;const sink=flight.vy<-4;$('warning').textContent=clock<noticeUntil?notice:stale?'GYROT TYST · TRYCK KALIBRERA':low?'LÅG HÖJD · HÖJ LYFTET':sink?'SJUNKER · HÖJ LYFTET':'';drawGauges();$('yawLeft').classList.toggle('held',touch.left||keys.has('q'));$('yawRight').classList.toggle('held',touch.right||keys.has('e'));}
function layoutMode(){return innerHeight>=innerWidth?config.layout.portrait:config.layout.landscape;}
function placeBox(el,box){if(!el||!box)return;el.style.left=(box.left*100)+'%';el.style.top=(box.top*100)+'%';el.style.width=(box.width*100)+'%';el.style.height=(box.height*100)+'%';}
function placeCenter(el,pos,size){if(!el||!pos)return;const s=(size*100)+'vw';el.style.width=s;el.style.height=s;el.style.left=`calc(${pos.cx*100}% - ${s} / 2)`;el.style.top=`calc(${pos.cy*100}% - ${s} / 2)`;}
function applyLayout(){const box=layoutMode();document.documentElement.style.setProperty('--wind',(box.windshieldEnd*100)+'%');document.documentElement.style.setProperty('--grow',String(config.layout.gaugeHoldScale));document.documentElement.style.setProperty('--g',(box.gaugeSize*100)+'vw');$('windshield').style.height=(box.windshieldEnd*100)+'%';placeBox($('collective'),box.collective);placeBox($('yawLeft'),box.pedalLeft);placeBox($('yawRight'),box.pedalRight);placeBox($('cyclicBlock'),box.cyclic);placeBox($('aimFocus'),box.aimFocus);placeCenter($('fire'),box.fire,box.fire.size);for(const [id,pos] of Object.entries(box.gauges))placeCenter($('gauge-'+id),pos,box.gaugeSize);}
let frames=0,fps=60,fpsTime=0;function frame(now){requestAnimationFrame(frame);if(document.hidden){last=now;return;}const realDt=Math.max(0,(now-last)/1000),dt=Math.min(realDt,.1);last=now;clock+=dt;frames++;fpsTime+=realDt;if(fpsTime>=1){fps=frames/fpsTime;frames=0;fpsTime=0;}updateInput(dt);const paused=settings.open||result.open;water.material.uniforms.time.value=clock;water.material.uniforms.eye.value.copy(camera.position);
if(playing){if(!paused){flight.update(dt,activeControls,Math.max(0,heightAt(flight.x,flight.z)));if(flight.groundContact&&flight.impactSpeed>4){armor=Math.max(0,armor-(flight.impactSpeed-4)*8);flight.impactSpeed=0;if(armor<=0)finish(false);}if(Math.hypot(flight.x,flight.z)>1850){flashMessage('YTTRE GRÄNS · VÄND TILLBAKA');flight.vx-=flight.x*.0008*dt;flight.vz-=flight.z*.0008*dt;}}
heli.position.set(flight.x,flight.y,flight.z);heli.rotation.set(-flight.pitch,-flight.heading,-flight.roll,'YXZ');cockpit.setPedals(touch.left||keys.has('q'),touch.right||keys.has('e'));updateCamera(dt);chooseTarget();if(!paused){updateCombat(dt);updateEffects(dt);}updateHud();
}else{cockpit.root.visible=false;heli.visible=true;heli.position.set(18,66+Math.sin(clock*.6)*.8,310);heli.rotation.set(-.03,.3+Math.sin(clock*.13)*.04,.04);const portrait=innerHeight>innerWidth;camera.position.set(65+Math.sin(clock*.07)*5,81,370);camera.lookAt(portrait?new THREE.Vector3(-22,70,270):new THREE.Vector3(-35,62,275));}
const rotorRate=30+collective*12+Math.min(8,Math.hypot(flight.vx,flight.vz));heli.userData.rotor.rotation.y+=dt*rotorRate;heli.userData.tailRotor.rotation.x+=dt*(40+collective*10);sun.position.set(heli.position.x-180,heli.position.y+350,heli.position.z+120);sun.target.position.copy(heli.position);ljud.update(dt,{collective,knots:Math.hypot(flight.vx,flight.vz)*1.94384,playing:playing&&!paused,low:playing&&!paused&&(flight.y<Math.max(0,heightAt(flight.x,flight.z))+12||flight.vy<-4),boundary:playing&&!paused&&Math.hypot(flight.x,flight.z)>1850});
if(settings.open){const c=control.getCyclic();const aim=control.getAimOffset();$('telemetry').textContent=`Spak  x ${c.x.toFixed(2)}  y ${c.y.toFixed(2)}\nLyft ${control.getCollective().toFixed(2)}  Gir ${control.getYaw().toFixed(2)}\nSikte yaw ${(aim.yaw*180/Math.PI).toFixed(1)}° pitch ${(aim.pitch*180/Math.PI).toFixed(1)}°\nFartlyft ${flight.liftFactor.toFixed(2)} · ${Math.round(Math.hypot(flight.vx,flight.vz)*1.94384)} knop · ${control.getViewState().view}\n${renderer.software?'Enklare grafik · ':''}${Math.round(fps/(renderer.software?2:1))} FPS`;}
if(!globalThis.__rotorFast&&(!paused||!playing))renderer.render(scene,camera);}
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();applyLayout();});
window.addEventListener('pointerdown',()=>ljud.unlock(),{capture:true});
window.addEventListener('touchend',()=>ljud.unlock(),{capture:true,passive:true});
$('loading').hidden=true;applyLayout();updateCollectiveUI();syncModeUI();camLook.set(0,56,280);requestAnimationFrame(frame);
