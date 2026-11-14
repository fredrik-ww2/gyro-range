import * as T from './vendor/three.module.js';
import config from './config.json' with { type: 'json' };
// Rendering adapter only. All state, feature toggles and inputs live in ControlModule.
// Dimensions are an original RA-64 cockpit, not a certified replica of a real aircraft.
const rig = config.cockpit;
export class CockpitView {
 constructor(scene){
  this.root=new T.Group();this.root.visible=false;scene.add(this.root);this.materials=[];this.tick=0;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#a5aaa7';ctx.fillRect(0,0,256,256);let seed=23;for(let i=0;i<8500;i++){seed=(seed*1664525+1013904223)>>>0;const v=70+(seed%100);ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(seed%256,(seed>>>8)%256,1,1);}const grain=new T.CanvasTexture(canvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;
  const paint=this.material(0x12161a,.86,.18,{bumpMap:grain,bumpScale:.008}),rubber=this.material(0x07090b,.94,.04),edge=this.material(0x2a3130,.5,.45),metal=this.material(0x8e968f,.28,.72),red=this.material(0x9f2a21,.55,.2),amber=this.material(0xc1a167,.55,.3);
  const root=this.root;const floor=this.box(root,0,-1.02,-2.9,2.8,.16,3.7,paint);floor.userData.softwareGeometry=new T.BoxGeometry(2.8,.16,3.7,8,1,12);this.box(root,0,-.71,-1.25,1,.5,.6,rubber);
  // Panel body stays below the curved coaming. The coaming's top edge is the sill.
  this.round(root,0,-.7,-4.02,2.72,.5,.24,paint,.08);this.box(root,0,-.9,-3.9,.5,.2,.7,paint);
  this.round(root,-1.16,-.68,-3.3,.42,.26,1.5,paint,.04);this.round(root,1.16,-.68,-3.3,.42,.26,1.5,paint,.04);
  this.coaming(root,paint);
  // Two panes, a tapered center bow, outboard posts and an arched header. Frames stay on the perimeter.
  const frame=paint,seal=rubber;
  this.bow(root,[[-1.18,.02,-4.02],[-.55,.28,-4.14],[0,.55,-4.18],[.55,.28,-4.14],[1.18,.02,-4.02]],.1,.082,seal);
  this.bow(root,[[-1.08,1.28,-4.08],[-.45,1.78,-4.22],[0,1.96,-4.16],[.45,1.78,-4.22],[1.08,1.28,-4.08]],.09,.07,frame);
  this.bow(root,[[0,.55,-4.18],[0,1.1,-4.3],[0,1.62,-4.2],[0,1.96,-4.08]],.11,.05,seal);
  for(const s of [-1,1])this.bow(root,[[s*1.18,.02,-4.02],[s*1.22,.62,-4.16],[s*1.08,1.28,-4.1]],.1,.07,frame);
  this.pane(root,-1);this.pane(root,1);
  // Overhead board stays above the canopy opening so the sky reaches the top of the screen.
  this.round(root,0,2.42,-2.05,.85,.07,.55,paint,.02);
  for(let i=0;i<12;i++){const x=-1.19+i*.216;this.sphere(root,x,.23,-3.927,.017,metal);this.sphere(root,x,-.65,-3.927,.017,metal);}
  for(const side of [-1,1])for(let i=0;i<5;i++){this.box(root,side*1.16,-.29,-3.8+i*.18,.09,.05,.08,edge);this.tube(root,[side*1.16,-.26,-3.8+i*.18],[side*1.16,-.18,-3.82+i*.18],.008,metal);}
  this.labels=this.texturePanel(root,0,.06,-3.28,2.42,.92,1024,512);this.labels.mesh.rotation.x=-.38;this.paintPanelLabels(this.labels.ctx);this.labels.texture.needsUpdate=true;
  const face=document.createElement('canvas');face.width=face.height=128;this.paintDial(face.getContext('2d'),128,0);const faceTex=new T.CanvasTexture(face);faceTex.colorSpace=T.SRGBColorSpace;const faceMat=new T.MeshBasicMaterial({map:faceTex,toneMapped:false});faceMat.userData.baseOpacity=1;this.materials.push(faceMat);
  for(let i=0;i<7;i++){const x=-.9+i*.3;const dial=this.cylinder(root,x,.46,-3.22,.078,.035,rubber);dial.rotation.x=Math.PI/2;dial.castShadow=false;const plate=this.mesh(new T.CircleGeometry(.062,16),faceMat,root,x,.46,-3.19);plate.castShadow=false;}
  this.screens=[];for(const x of[-.58,.58]){this.round(root,x,.16,-3.16,.78,.5,.05,rubber,.03);const screen=this.texturePanel(root,x,.16,-3.1,.66,.4,512,384);screen.mesh.rotation.x=-.38;this.screens.push(screen);for(const s of[-1,1])for(let j=0;j<4;j++)this.box(root,x+s*.4,.02+j*.09,-3.12,.038,.034,.016,edge);}
  // Cyclic: short enough that the grip stays under the windshield line.
  const stick=rig.stick;
  this.cyclic=new T.Group();this.cyclic.position.set(stick.x,stick.y,stick.z);root.add(this.cyclic);
  for(let i=0;i<5;i++)this.cylinder(this.cyclic,0,.02+i*.038,0,.16-i*.01,.036,rubber);
  this.tube(this.cyclic,[0,.12,0],[0,stick.shaftTop,-.05],.026,metal);
  const gripMat=this.material(0x8a918b,.62,.2);const grip=this.mesh(new T.CapsuleGeometry(.074,stick.gripLength,4,10),gripMat,this.cyclic,0,stick.gripY,-.07);grip.rotation.x=-.22;
  for(let i=0;i<4;i++)this.box(this.cyclic,0,stick.gripY-.12+i*.028,-.02,.12,.01,.014,edge);
  this.sphere(this.cyclic,.038,stick.gripY+.1,-.1,.026,red);this.box(this.cyclic,-.02,stick.gripY+.11,-.06,.044,.016,.04,edge);
  this.trigger=new T.Object3D();this.trigger.position.set(0,stick.gripLength*.5+.04,.03);grip.add(this.trigger);
  const hog=new T.Group();hog.position.set(.72,-.42,-3.15);root.add(hog);this.tube(hog,[0,0,0],[0,.42,-.04],.022,metal);this.mesh(new T.CapsuleGeometry(.06,.12,3,8),rubber,hog,0,.5,-.06);
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
 paintPanelLabels(c){c.fillStyle='#0c1012';c.fillRect(0,0,1024,512);c.strokeStyle='#2a3330';c.lineWidth=3;for(let i=0;i<9;i++){const x=78+i*108,y=78;c.beginPath();c.arc(x,y,40,0,Math.PI*2);c.stroke();c.strokeStyle='#6d7a72';c.lineWidth=1.4;for(let k=0;k<8;k++){const a=k*Math.PI/4;c.beginPath();c.moveTo(x+Math.cos(a)*24,y+Math.sin(a)*24);c.lineTo(x+Math.cos(a)*34,y+Math.sin(a)*34);c.stroke();}c.strokeStyle='#d7c7a2';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(i*.7)*26,y+Math.sin(i*.9)*26);c.stroke();c.strokeStyle='#2a3330';c.lineWidth=3;}c.fillStyle='#06140f';c.fillRect(150,150,300,210);c.fillRect(574,150,300,210);c.strokeStyle='#1f4a34';c.lineWidth=8;c.strokeRect(146,146,308,218);c.strokeRect(570,146,308,218);c.fillStyle='#143222';for(let y=168;y<350;y+=8){c.fillRect(160,y,280,2);c.fillRect(584,y,280,2);}c.fillStyle='#8fd18a';c.font='20px monospace';c.fillText('FLT',168,188);c.fillText('NAV',592,188);for(let row=0;row<3;row++)for(let col=0;col<16;col++){c.fillStyle=(col+row)%7===0?'#8a3030':(col%4===0?'#c4a15a':'#24302c');c.fillRect(48+col*58,400+row*28,22,16);}c.fillStyle='#8a938c';c.font='14px monospace';c.fillText('RA-64',470,28);}
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
 drawScreens(flight,controls,view){const p=this.screens[0],c=p.ctx,w=512,h=384;c.fillStyle='#04140e';c.fillRect(0,0,w,h);c.save();c.beginPath();c.rect(36,40,440,280);c.clip();c.translate(256,180+flight.pitch*260);c.rotate(-flight.roll);c.fillStyle='#1d6a62';c.fillRect(-600,-600,1200,600);c.fillStyle='#6a6238';c.fillRect(-600,0,1200,600);c.strokeStyle='#d7f5c4';c.lineWidth=3;c.beginPath();c.moveTo(-600,0);c.lineTo(600,0);c.stroke();for(let i=-3;i<=3;i++){if(i===0)continue;c.beginPath();c.moveTo(-70,i*36);c.lineTo(70,i*36);c.stroke();}c.restore();c.strokeStyle='#f3efc0';c.lineWidth=5;c.beginPath();c.moveTo(150,180);c.lineTo(230,180);c.lineTo(256,198);c.lineTo(282,180);c.lineTo(362,180);c.stroke();c.fillStyle='#b6f0a4';c.font='bold 28px monospace';c.textAlign='left';c.fillText(Math.round(Math.hypot(flight.vx,flight.vz)*1.94384)+' KT',16,34);c.textAlign='right';c.fillText(Math.round(flight.y)+' M',496,34);c.font='20px monospace';c.fillText((flight.vy>=0?'+':'')+flight.vy.toFixed(1)+' M/S',496,360);c.textAlign='left';c.fillText('LYFT '+Math.round(controls.getCollective()*100)+'%',16,360);p.texture.needsUpdate=true;
 const q=this.screens[1],n=q.ctx;n.fillStyle='#03140d';n.fillRect(0,0,w,h);n.strokeStyle='#1e6a48';n.lineWidth=2;for(let x=24;x<512;x+=32){n.beginPath();n.moveTo(x,0);n.lineTo(x,384);n.stroke();}for(let y=24;y<384;y+=32){n.beginPath();n.moveTo(0,y);n.lineTo(512,y);n.stroke();}n.strokeStyle='#8ee07a';n.lineWidth=3;n.beginPath();for(let i=0;i<512;i+=8){const y=200+Math.sin((i+flight.x*.1)*.012)*50+Math.sin(i*.034)*16;i===0?n.moveTo(i,y):n.lineTo(i,y);}n.stroke();n.save();n.translate(256,190);n.rotate(flight.heading);n.fillStyle='#d8ffc0';n.beginPath();n.moveTo(0,-18);n.lineTo(-12,14);n.lineTo(12,14);n.fill();n.restore();n.fillStyle='#c8f5b4';n.font='24px monospace';n.fillText('NAV  '+String(Math.round((flight.heading*180/Math.PI%360+360)%360)).padStart(3,'0')+'°',18,34);n.font='18px monospace';n.fillText(view.aimEnabled?'SIKTE RÖRLIGT':'SIKTE FAST',18,360);q.texture.needsUpdate=true;}
}
