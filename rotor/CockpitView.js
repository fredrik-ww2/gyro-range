import * as T from './vendor/three.module.js';
import config from './config.json' with { type: 'json' };
// Rendering adapter only. All state, feature toggles and inputs live in ControlModule.
// Dimensions are an original RA-64 cockpit, not a certified replica of a real aircraft.
const rig = config.cockpit;
export class CockpitView {
 constructor(scene){
  this.root=new T.Group();this.root.visible=false;scene.add(this.root);this.materials=[];this.tick=0;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#a5aaa7';ctx.fillRect(0,0,256,256);let seed=23;for(let i=0;i<8500;i++){seed=(seed*1664525+1013904223)>>>0;const v=70+(seed%100);ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(seed%256,(seed>>>8)%256,1,1);}const grain=new T.CanvasTexture(canvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;
  const paint=this.material(0x252d2b,.78,.25,{bumpMap:grain,bumpScale:.012}),rubber=this.material(0x101514,.93,.03),edge=this.material(0x424c47,.55,.5),metal=this.material(0xa6aca5,.32,.8),red=this.material(0x9f2a21,.55,.2),amber=this.material(0xc1a167,.55,.3);
  const root=this.root;const floor=this.box(root,0,-1.02,-2.9,2.8,.16,3.7,paint);floor.userData.softwareGeometry=new T.BoxGeometry(2.8,.16,3.7,8,1,12);this.box(root,0,-.71,-1.25,1,.5,.6,rubber);
  // Panel body stays below the curved coaming. The coaming's top edge is the sill.
  this.round(root,0,-.7,-4.02,2.72,.5,.24,paint,.08);this.box(root,0,-.9,-3.9,.5,.2,.7,paint);
  this.round(root,-1.16,-.68,-3.3,.42,.26,1.5,paint,.04);this.round(root,1.16,-.68,-3.3,.42,.26,1.5,paint,.04);
  this.coaming(root,paint);
  // Two panes, a tapered center bow, outboard posts and an arched header. Frames stay on the perimeter.
  const frame=paint,seal=rubber;
  this.bow(root,[[-1.18,.02,-4.02],[-.55,.28,-4.14],[0,.55,-4.18],[.55,.28,-4.14],[1.18,.02,-4.02]],.03,.026,seal);
  this.bow(root,[[-1.08,1.28,-4.08],[-.45,1.78,-4.22],[0,1.96,-4.16],[.45,1.78,-4.22],[1.08,1.28,-4.08]],.028,.022,frame);
  this.bow(root,[[0,.55,-4.18],[0,1.1,-4.3],[0,1.62,-4.2],[0,1.96,-4.08]],.04,.016,seal);
  for(const s of [-1,1])this.bow(root,[[s*1.18,.02,-4.02],[s*1.22,.62,-4.16],[s*1.08,1.28,-4.1]],.038,.02,frame);
  this.pane(root,-1);this.pane(root,1);
  // Overhead board stays above the canopy opening so the sky reaches the top of the screen.
  this.round(root,0,2.42,-2.05,.85,.07,.55,paint,.02);
  for(let i=0;i<12;i++){const x=-1.19+i*.216;this.sphere(root,x,.23,-3.927,.017,metal);this.sphere(root,x,-.65,-3.927,.017,metal);}
  for(const side of [-1,1])for(let i=0;i<5;i++){this.box(root,side*1.16,-.29,-3.8+i*.18,.09,.05,.08,edge);this.tube(root,[side*1.16,-.26,-3.8+i*.18],[side*1.16,-.18,-3.82+i*.18],.008,metal);}
  this.labels=this.texturePanel(root,0,-.21,-3.934,2.58,.88,1024,350);this.paintPanelLabels(this.labels.ctx);this.labels.texture.needsUpdate=true;
  this.screens=[];for(const x of[-.72,.72]){this.round(root,x,-.20,-3.88,.84,.70,.09,rubber,.035);this.screens.push(this.texturePanel(root,x,-.20,-3.803,.70,.54,512,384));for(const s of[-1,1])for(let j=0;j<5;j++)this.box(root,x+s*.395,-.44+j*.11,-3.82,.045,.044,.02,edge);}
  for(let j=0;j<3;j++){const dial=this.cylinder(root,0,.01-j*.27,-3.84,.105,.055,rubber);dial.rotation.x=Math.PI/2;const face=this.texturePanel(root,0,.01-j*.27,-3.803,.19,.19,128,128);this.paintDial(face.ctx,128,j);face.texture.needsUpdate=true;}
  // Cyclic: short enough that the grip stays under the windshield line.
  const stick=rig.stick;
  this.cyclic=new T.Group();this.cyclic.position.set(stick.x,stick.y,stick.z);root.add(this.cyclic);
  for(let i=0;i<5;i++)this.cylinder(this.cyclic,0,.02+i*.038,0,.16-i*.01,.036,rubber);
  this.tube(this.cyclic,[0,.12,0],[0,stick.shaftTop,-.05],.026,metal);
  const gripMat=this.material(0x8a918b,.62,.2);const grip=this.mesh(new T.CapsuleGeometry(.074,stick.gripLength,4,10),gripMat,this.cyclic,0,stick.gripY,-.07);grip.rotation.x=-.22;
  for(let i=0;i<4;i++)this.box(this.cyclic,0,stick.gripY-.12+i*.028,-.02,.12,.01,.014,edge);
  this.sphere(this.cyclic,.038,stick.gripY+.1,-.1,.026,red);this.box(this.cyclic,-.02,stick.gripY+.11,-.06,.044,.016,.04,edge);
  this.trigger=new T.Object3D();this.trigger.position.set(0,stick.gripLength*.5+.04,.03);grip.add(this.trigger);
  // Collective on the pilot's left. The grip is the control, and it swings with the finger.
  const col=rig.collective;
  this.collective=new T.Group();this.collective.position.set(col.x,col.y,col.z);root.add(this.collective);this.cylinder(this.collective,0,0,0,.1,.14,paint);this.tube(this.collective,[0,0,0],[0,.05,-col.arm],.034,metal);const hand=this.mesh(new T.CapsuleGeometry(.07,.28,4,10),rubber,this.collective,0,.05,-col.arm);hand.rotation.x=Math.PI/2;this.box(this.collective,0,.12,-col.arm-.08,.12,.07,.16,edge);this.sphere(this.collective,.03,.18,-col.arm-.12,.028,red);
  this.pedals=[];this.heldLeft=false;this.heldRight=false;
  for(const s of[-1,1]){const g=new T.Group();g.position.set(s*rig.pedalX,rig.pedalY,rig.pedalZ);g.userData.baseY=g.position.y;g.userData.baseZ=g.position.z;root.add(g);this.box(g,0,0,0,.28,.06,.32,metal);this.box(g,0,.05,-.14,.3,.12,.045,rubber);for(let i=0;i<4;i++)this.box(g,0,.045,-.08+i*.06,.24,.012,.014,edge);this.tube(root,[s*rig.pedalX,rig.pedalY-.12,rig.pedalZ],[s*rig.pedalX,rig.pedalY-.38,rig.pedalZ+.55],.028,metal);this.pedals.push(g);}
  this.mesh(new T.TorusGeometry(.07,.015,6,16),amber,root,.94,.23,-3.83);
 }
 material(color,roughness,metalness,extra={}){const m=new T.MeshStandardMaterial({color,roughness,metalness,...extra});m.userData.baseOpacity=m.opacity;this.materials.push(m);return m;}
 mesh(geometry,material,parent,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(parent,x,y,z,w,h,d,m){return this.mesh(new T.BoxGeometry(w,h,d),m,parent,x,y,z);}
 sphere(parent,x,y,z,r,m){return this.mesh(new T.SphereGeometry(r,8,6),m,parent,x,y,z);}
 cylinder(parent,x,y,z,r,h,m){return this.mesh(new T.CylinderGeometry(r,r,h,12),m,parent,x,y,z);}
 tube(parent,a,b,r,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),mid=av.clone().add(bv).multiplyScalar(.5),o=this.cylinder(parent,mid.x,mid.y,mid.z,r,av.distanceTo(bv),m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
 bow(parent,points,r0,r1,material){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  const tubular=20,radial=6,geo=new T.TubeGeometry(curve,tubular,1,radial,false),pos=geo.attributes.position,seg=radial+1;
  for(let ring=0;ring<=tubular;ring++){
   let cx=0,cy=0,cz=0;
   for(let j=0;j<seg;j++){const i=ring*seg+j;cx+=pos.getX(i);cy+=pos.getY(i);cz+=pos.getZ(i);}
   cx/=seg;cy/=seg;cz/=seg;const r=r0+(r1-r0)*(ring/tubular);
   for(let j=0;j<seg;j++){const i=ring*seg+j;pos.setXYZ(i,cx+(pos.getX(i)-cx)*r,cy+(pos.getY(i)-cy)*r,cz+(pos.getZ(i)-cz)*r);}
  }
  pos.needsUpdate=true;geo.computeVertexNormals();return this.mesh(geo,material,parent);
 }
 coaming(parent,material){
  const s=new T.Shape();
  s.moveTo(-1.5,-.32);s.lineTo(1.5,-.32);s.lineTo(1.5,.0);
  s.quadraticCurveTo(.75,.28,0,.58);s.quadraticCurveTo(-.75,.28,-1.5,.0);s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:.42,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,curveSegments:10});
  g.translate(0,0,-.21);return this.mesh(g,material,parent,0,0,-3.98);
 }
 pane(parent,side){
  const s=new T.Shape(),x=side;
  const pts=x<0?[[-1.12,.08],[-.08,.52],[-.05,1.7],[-.42,1.86],[-1.02,1.32],[-1.16,.55]]:[[.08,.52],[1.12,.08],[1.16,.55],[1.02,1.32],[.42,1.86],[.05,1.7]];
  s.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];s.quadraticCurveTo(m[0],m[1],b[0],b[1]);}
  s.closePath();
  const glass=this.material(0xb7d5d6,.06,.04,{transparent:true,opacity:.05,depthWrite:false,side:T.DoubleSide});
  const mesh=this.mesh(new T.ShapeGeometry(s,6),glass,parent,0,0,-4.2);mesh.castShadow=false;return mesh;
 }
 round(parent,x,y,z,w,h,d,m,r=.04){const s=new T.Shape(),a=-w/2,b=-h/2;s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.01,bevelThickness:.01,curveSegments:3});g.translate(0,0,-d/2);return this.mesh(g,m,parent,x,y,z);}
 texturePanel(parent,x,y,z,w,h,pw,ph){const canvas=document.createElement('canvas');canvas.width=pw;canvas.height=ph;const ctx=canvas.getContext('2d');const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const material=new T.MeshBasicMaterial({map:texture,toneMapped:false});material.userData.baseOpacity=1;this.materials.push(material);const o=this.mesh(new T.PlaneGeometry(w,h),material,parent,x,y,z);o.userData.softwareTexture=true;o.castShadow=false;return{canvas,ctx,texture,mesh:o};}
 paintPanelLabels(c){c.fillStyle='#252d2b';c.fillRect(0,0,1024,350);c.fillStyle='#c7cbbd';c.font='13px monospace';c.fillText('FLIGHT DISPLAY',95,28);c.fillText('NAV / WEAPONS',675,28);c.fillText('RA-64  RAVEN',450,28);c.fillText('ENGINE 1',90,326);c.fillText('CAUTION',470,326);c.fillText('ENGINE 2',830,326);c.fillStyle='#a39c71';c.fillRect(420,305,16,9);c.fillStyle='#557a4c';for(let i=0;i<8;i++)c.fillRect(95+i*23,293,12,7);for(let i=0;i<8;i++)c.fillRect(743+i*23,293,12,7);}
 paintDial(c,size,index){const mid=size/2;c.fillStyle='#101614';c.fillRect(0,0,size,size);c.strokeStyle='#2c3832';c.lineWidth=6;c.beginPath();c.arc(mid,mid,size*.44,0,Math.PI*2);c.stroke();c.strokeStyle='#6d7d72';c.lineWidth=1.5;for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(mid+Math.cos(a)*size*.32,mid+Math.sin(a)*size*.32);c.lineTo(mid+Math.cos(a)*size*.4,mid+Math.sin(a)*size*.4);c.stroke();}c.save();c.translate(mid,mid);c.rotate(-1.1+index*.7);c.strokeStyle='#cbb892';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(0,-size*.3);c.stroke();c.restore();c.strokeStyle='rgba(255,255,255,.08)';c.lineWidth=2;c.beginPath();c.arc(mid-6,mid-8,size*.22,Math.PI*1.1,Math.PI*1.7);c.stroke();c.font='12px monospace';c.fillStyle='#8ea294';c.textAlign='center';c.fillText(['RPM','FUEL','TEMP'][index],mid,mid+26);}
 setPedals(left,right){this.heldLeft=!!left;this.heldRight=!!right;}
 update(dt,controls,flight,view){
  this.root.visible=view.blend>.12;this.root.position.set(flight.x,flight.y,flight.z);this.root.rotation.set(-flight.pitch,-flight.heading,-flight.roll,'YXZ');
  const c=controls.getCyclic();this.cyclic.rotation.set(-c.y*.7,0,-c.x*.85);
  const col=rig.collective,t=controls.getCollective();this.collective.rotation.x=col.angleMin+t*(col.angleMax-col.angleMin);
  const yaw=controls.getYaw(),press=rig.pedalPress,amounts=[this.heldLeft?1:Math.max(0,-yaw),this.heldRight?1:Math.max(0,yaw)];
  this.pedals.forEach((g,i)=>{const a=amounts[i],sign=i===0?1:-1;g.rotation.x=a*press;g.position.y=g.userData.baseY-a*.045;g.position.z=g.userData.baseZ+yaw*sign*.14;});
  const alpha=T.MathUtils.smoothstep(view.blend,.12,.9);for(const m of this.materials){m.opacity=m.userData.baseOpacity*alpha;m.transparent=m.opacity<.999;m.depthWrite=m.userData.baseOpacity>=.99&&alpha>.98;}
  if(!this.root.visible)return;this.tick+=dt;if(this.tick<.1)return;this.tick=0;this.drawScreens(flight,controls,view);
 }
 drawScreens(flight,controls,view){const p=this.screens[0],c=p.ctx,w=512,h=384;c.fillStyle='#07100f';c.fillRect(0,0,w,h);c.save();c.beginPath();c.rect(52,46,408,267);c.clip();c.translate(256,180+flight.pitch*260);c.rotate(-flight.roll);c.fillStyle='#32525f';c.fillRect(-600,-600,1200,600);c.fillStyle='#665a3f';c.fillRect(-600,0,1200,600);c.strokeStyle='#c5d9c0';c.lineWidth=2;c.beginPath();c.moveTo(-600,0);c.lineTo(600,0);c.stroke();for(let i=-3;i<=3;i++){if(i===0)continue;c.beginPath();c.moveTo(-45,i*32);c.lineTo(45,i*32);c.stroke();}c.restore();c.strokeStyle='#ece5bc';c.lineWidth=4;c.beginPath();c.moveTo(167,180);c.lineTo(238,180);c.lineTo(256,192);c.lineTo(274,180);c.lineTo(345,180);c.stroke();c.fillStyle='#bce0b6';c.font='bold 27px monospace';c.textAlign='left';c.fillText(Math.round(Math.hypot(flight.vx,flight.vz)*1.94384)+' KT',15,36);c.textAlign='right';c.fillText(Math.round(flight.y)+' M',495,36);c.font='20px monospace';c.fillText((flight.vy>=0?'+':'')+flight.vy.toFixed(1)+' M/S',495,350);c.textAlign='left';c.fillText('COL '+Math.round(controls.getCollective()*100)+'%',16,350);p.texture.needsUpdate=true;
 const q=this.screens[1],n=q.ctx;n.fillStyle='#06110e';n.fillRect(0,0,w,h);n.strokeStyle='#2b5543';n.lineWidth=1;for(let x=20;x<512;x+=40){n.beginPath();n.moveTo(x,0);n.lineTo(x,384);n.stroke();}for(let y=20;y<384;y+=40){n.beginPath();n.moveTo(0,y);n.lineTo(512,y);n.stroke();}n.strokeStyle='#5b8560';n.beginPath();for(let i=0;i<512;i+=8){const y=210+Math.sin((i+flight.x*.1)*.012)*57+Math.sin(i*.034)*20;i===0?n.moveTo(i,y):n.lineTo(i,y);}n.stroke();n.save();n.translate(256,192);n.rotate(flight.heading);n.fillStyle='#c6e9ad';n.beginPath();n.moveTo(0,-16);n.lineTo(-10,12);n.lineTo(10,12);n.fill();n.restore();n.fillStyle='#a7cf9b';n.font='22px monospace';n.fillText('NAV  '+String(Math.round((flight.heading*180/Math.PI%360+360)%360)).padStart(3,'0')+'°',20,34);n.font='18px monospace';n.fillText(view.aimEnabled?'SIGHT / GIMBAL':'SIGHT / FIXED',20,350);q.texture.needsUpdate=true;}
}
