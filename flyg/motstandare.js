// Fw 190 som motståndare. Samma punktmassemodell som spelaren. Siktar med samma ledregel som reflexsiktet.
import {luftdensitet,sikteLed,MYNNING} from './ballistik.js';
import {propellerSkiva,propVarv} from './propeller.js';
import {FlightModel} from './flight-model.js';

function korsTextur(THREE){
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
 g.clearRect(0,0,64,64);g.fillStyle='#f4f4f0';g.fillRect(22,2,20,60);g.fillRect(2,22,60,20);
 g.fillStyle='#141414';g.fillRect(26,8,12,48);g.fillRect(8,26,48,12);
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
 return new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
}
export function skapaMotstandare(THREE,opts){
 const {scene,loader,config,aero,motor,guns,effects}=opts,M=config.motstandare;
 const fm=new FlightModel({...aero}),group=new THREE.Group(),visual=new THREE.Group();
 group.add(visual);scene.add(group);group.visible=false;
 const state={hp:M.hp,max:M.hp,lever:false,laddad:false,tris:0,spann:0,langd:0,dist:0,dot:0,skott:0,led:null,gas:0.9,evadeTill:0,evadeSign:1,rok:null,exploderat:false,matt:null,nasta:0};
 let prop=null,tid=0;
 function synka(dt=0){
  const at=fm.attitude();group.position.set(fm.x,fm.y,fm.z);group.rotation.set(at.pitch,at.yaw,at.roll,'YXZ');
  if(state.rok)state.rok.flytta(group.position);
  if(prop&&dt)prop.rotation.z+=propVarv(state.gas,motor)*Math.PI*2*dt;
 }
 function reset(spelare){
  state.hp=M.hp;state.lever=true;state.skott=0;state.evadeTill=0;state.exploderat=false;state.rok?.stopp();state.rok=null;group.visible=true;
  const dist=M.start_avstand_m||300,sida=80;
  const x=spelare.x-Math.sin(spelare.psi)*dist+Math.cos(spelare.psi)*sida;
  const z=spelare.z-Math.cos(spelare.psi)*dist-Math.sin(spelare.psi)*sida;
  const y=spelare.y+28;
  fm.reset(x,y,z,130);fm.gamma=0;
  const dx=spelare.x-x,dz=spelare.z-z;fm.psi=Math.atan2(-dx,-dz);
  synka();
 }
 async function load(){
  const gltf=await loader.loadAsync(M.fil),model=gltf.scene;
  const box=new THREE.Box3().setFromObject(model,true),size=box.getSize(new THREE.Vector3()),mid=box.getCenter(new THREE.Vector3());
  const sx=M.spann_m/size.x,sz=M.langd_m/size.z;
  model.scale.set(sx,sx,sz);model.position.set(-mid.x*sx,-mid.y*sx,-mid.z*sz);
  visual.clear();visual.rotation.y=M.rotation_y;visual.add(model);
  model.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=true;state.tris+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;
   const namn=(o.material?.name||o.name||'').toLowerCase();
   if(/glass|canopy/.test(namn)){o.material.transparent=true;o.material.opacity=.45;o.material.depthWrite=false;}
  });
  group.position.set(0,0,0);group.rotation.set(0,0,0);group.updateMatrixWorld(true);
  const world=new THREE.Box3().setFromObject(visual),span=world.max.x-world.min.x,lang=world.max.z-world.min.z;
  state.spann=span;state.langd=lang;state.matt={spann:span,langd:lang,hojd:world.max.y-world.min.y};
  const {mesh,mat}=propellerSkiva(THREE,1.62);prop=new THREE.Group();
  const bladMat=new THREE.MeshLambertMaterial({color:0x2a2e28});
  const bladGeo=new THREE.BoxGeometry(1.35,.07,.035);bladGeo.translate(.72,0,0);
  for(let i=0;i<3;i++){const b=new THREE.Mesh(bladGeo,bladMat);b.rotation.z=i*Math.PI*2/3;prop.add(b);}
  mesh.material=mat;prop.add(mesh);
  const nose=new THREE.Vector3((world.min.x+world.max.x)/2,(world.min.y+world.max.y)/2,world.min.z);
  prop.position.copy(group.worldToLocal(nose));prop.position.z-=.15;group.add(prop);
  const matK=korsTextur(THREE),g=new THREE.Group();
  const plan=(x,y,z,rx,ry,s)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),matK);m.position.set(x,y,z);m.rotation.set(rx,ry,0);m.renderOrder=2;g.add(m);};
  plan(-.55,.05,1.15,0,-Math.PI/2,.62);plan(.55,.05,1.15,0,Math.PI/2,.62);
  plan(-2.15,.15,-.15,-Math.PI/2,0,.78);plan(2.15,.15,-.15,-Math.PI/2,0,.78);
  group.add(g);
  state.laddad=true;
 }
 function velocity(spelare){const ch=Math.cos(spelare.gamma);return {x:-Math.sin(spelare.psi)*ch*spelare.V,y:Math.sin(spelare.gamma)*spelare.V,z:-Math.cos(spelare.psi)*ch*spelare.V};}
 function egenFart(){const ch=Math.cos(fm.gamma);return new THREE.Vector3(-Math.sin(fm.psi)*ch*fm.V,Math.sin(fm.gamma)*fm.V,-Math.cos(fm.psi)*ch*fm.V);}
 function update(dt,spelare,nu){
  tid=nu;if(!state.laddad)return;if(!state.lever){if(!group.visible)return;
   fm.step(dt,{pitch:-.35,roll:state.evadeSign*.6},.25);synka(dt);
   const mark=opts.hojd(fm.x,fm.z);
   if(!state.exploderat&&fm.y<mark+2){state.exploderat=true;group.visible=false;effects.spela('traff_mark',{pos:group.position.clone(),laddning_g:1800,kaliber_mm:20,underlag:'torr'});}
   return;
  }
  const p=spelare,dx=p.x-fm.x,dy=p.y-fm.y,dz=p.z-fm.z,dist=Math.hypot(dx,dy,dz);
  const rho=luftdensitet(fm.y),vel=velocity(p);
  const led=sikteLed(group.position,p,vel,rho,MYNNING+fm.V);state.led=led;state.dist=dist;
  const ax=led.x-fm.x,ay=led.y-fm.y,az=led.z-fm.z,ah=Math.hypot(ax,az)||1;
  const desiredPsi=Math.atan2(-ax,-az),desiredGamma=Math.atan2(ay,ah);
  let dPsi=Math.atan2(Math.sin(desiredPsi-fm.psi),Math.cos(desiredPsi-fm.psi));
  const fwdX=-Math.sin(fm.psi),fwdZ=-Math.cos(fm.psi),hor=Math.hypot(dx,dz)||1;
  const bak=((dx)*fwdX+(dz)*fwdZ)/hor;
  if(bak<-.25&&dist<560&&nu>state.evadeTill){state.evadeSign=dPsi>=0?-1:1;state.evadeTill=nu+2.3;}
  const evade=nu<state.evadeTill;
  const bank=evade?state.evadeSign*1.12:Math.max(-1.12,Math.min(1.12,dPsi*2.1));
  let pitch=Math.max(-.45,Math.min(.42,(desiredGamma-fm.gamma)*1.35));
  if(evade)pitch=.18;if(dist<60)pitch=.42;
  state.gas=fm.V<105||dist>450?1:.82;
  fm.A.niva_k=1;fm.step(dt,{pitch,roll:bank},state.gas);synka(dt);
  const at=fm.attitude(),cp=Math.cos(at.pitch),nx=-Math.sin(at.yaw)*cp,ny=Math.sin(at.pitch),nz=-Math.cos(at.yaw)*cp;
  const lr=Math.hypot(ax,ay,az)||1;state.dot=(nx*ax+ny*ay+nz*az)/lr;
  if(!evade&&state.dot>.975&&dist>60&&dist<680&&nu>state.nasta){
   state.nasta=nu+(M.skott_intervall_s||.16);state.skott++;
   guns.fire(new THREE.Vector3(nx,ny,nz),egenFart(),group,config.vapen.mynningar_fw190,'fiende');
  }
 }
 function traff(n){
  if(!state.lever)return;state.hp-=n;state.evadeTill=Math.max(state.evadeTill,tid+1.4);
  effects.spela('traff_pansar',{pos:group.position.clone(),normal:new THREE.Vector3(0,1,0),riktning:new THREE.Vector3(0,0,1),utfall:state.hp>0?'ingen_genomslag':'genomslag',kaliber_mm:20});
  if(state.hp<state.max*.6&&!state.rok)state.rok=effects.spela('brand_rok',{pos:group.position.clone(),fas:'brinner',skala:.55});
  if(state.hp<=0){state.lever=false;state.hp=0;state.rok?.fas('brinner');}
 }
 function info(){return {...state,position:group.position.toArray(),synlig:group.visible&&state.laddad,psi:fm.psi,fart:fm.V};}
 return {group,fm,load,reset,update,traff,info,state};
}
