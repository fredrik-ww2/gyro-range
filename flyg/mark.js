// Normandie i låg höjd: små tegar, häckar, en flod, en rak väg med bro, byar och odling.
// Texturen upprepas. Nära planet står häckar, träd och hus som instanser. Långt bort räcker ett grovt plan.
const TILE=512;
function mod(v,m){return ((v%m)+m)%m;}
function hash(a,b){const h=Math.sin(a*127.1+b*311.7)*43758.5453;return h-Math.floor(h);}
function riverLocal(lz){const t=lz/TILE*Math.PI*2;return 158+Math.sin(t)*52+Math.sin(t*2+.4)*16;}
function slag(lx,lz){
 const rx=riverLocal(lz),dr=Math.abs(lx-rx);
 if(dr<18)return 'flod';
 if(Math.abs(lz-310)<11)return dr<30?'bro':'vag';
 if(lx>346&&lx<468&&lz>228&&lz<302)return 'by';
 if(lx>28&&lx<132&&lz>338&&lz<408)return 'by2';
 if(lx>196&&lx<330&&lz>56&&lz<168)return 'odling';
 return 'falt';
}
function landRGB(x,z,ut){
 const lx=mod(x,TILE),lz=mod(z,TILE),typ=slag(lx,lz);
 if(typ==='flod'){const bank=Math.abs(lx-riverLocal(lz))>14;ut[0]=bank?86:62;ut[1]=bank?102:92;ut[2]=bank?70:104;return;}
 if(typ==='bro'){ut[0]=168;ut[1]=164;ut[2]=150;return;}
 if(typ==='vag'){ut[0]=186;ut[1]=172;ut[2]=138;return;}
 if(typ==='by'||typ==='by2'){
  const x0=typ==='by'?346:28,z0=typ==='by'?228:338,fu=mod(lx-x0,18),fv=mod(lz-z0,16);
  if(fu>3&&fu<14&&fv>3&&fv<13&&hash(Math.floor(lx),Math.floor(lz))>.22){ut[0]=158;ut[1]=62;ut[2]=42;return;}
  ut[0]=124;ut[1]=118;ut[2]=92;return;
 }
 if(typ==='odling'){
  const ox=mod(lx-196,9),oz=mod(lz-56,9);
  if(ox<2.4&&oz<2.4){ut[0]=42;ut[1]=78;ut[2]=36;return;}
  ut[0]=118;ut[1]=132;ut[2]=74;return;
 }
 const cx=Math.floor(x/32),cz=Math.floor(z/64);
 const pal=[[108,122,68],[146,136,82],[176,162,112],[84,104,58],[126,138,76],[156,140,90],[72,92,50],[168,154,96]];
 const p=pal[Math.floor(hash(cx,cz)*pal.length)%pal.length];
 const fx=mod(x,32),fz=mod(z,64);
 if((fx<1.6||fz<1.5)&&hash(cx+20,cz)>.12){ut[0]=34;ut[1]=58;ut[2]=30;return;}
 const linje=mod(fx,5)<.8;
 ut[0]=p[0]-(linje?12:0);ut[1]=p[1]-(linje?8:0);ut[2]=p[2]-(linje?6:0);
}
function enhet(geo){geo.translate(0,.5,0);return geo;}
export function skapaMark(THREE,scene,W){
 const hojd=(x,z)=>W.hojd_stor*Math.sin(x*W.frekvens_stor)*Math.cos(z*W.frekvens_stor)+W.hojd_liten*Math.sin(x*W.frekvens_liten+z*.004);
 const N=W.falt_textur_px||1024,canvas=document.createElement('canvas');canvas.width=canvas.height=N;
 const paint=canvas.getContext('2d'),bild=paint.createImageData(N,N),px=bild.data,rgb=[0,0,0];
 for(let y=0;y<N;y++){const z=(y+.5)/N*TILE;for(let x=0;x<N;x++){landRGB((x+.5)/N*TILE,z,rgb);const i=(y*N+x)*4;px[i]=rgb[0];px[i+1]=rgb[1];px[i+2]=rgb[2];px[i+3]=255;}}
 paint.putImageData(bild,0,0);
 const textur=new THREE.CanvasTexture(canvas);textur.colorSpace=THREE.SRGBColorSpace;textur.wrapS=textur.wrapT=THREE.RepeatWrapping;textur.anisotropy=4;textur.flipY=false;
 const near=new THREE.PlaneGeometry(W.storlek,W.storlek,W.segment,W.segment);near.rotateX(-Math.PI/2);
 const pos=near.attributes.position,bas=Float32Array.from(pos.array),col=new Float32Array(pos.count*3),uv=near.attributes.uv;
 near.setAttribute('color',new THREE.BufferAttribute(col,3));
 const nearMat=new THREE.MeshLambertMaterial({map:textur,vertexColors:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});
 const ground=new THREE.Mesh(near,nearMat);scene.add(ground);
 const farGeo=new THREE.PlaneGeometry(W.lang_m,W.lang_m,W.lang_segment,W.lang_segment);farGeo.rotateX(-Math.PI/2);
 const fpos=farGeo.attributes.position,fbas=Float32Array.from(fpos.array),fcol=new Float32Array(fpos.count*3),fuv=farGeo.attributes.uv;
 farGeo.setAttribute('color',new THREE.BufferAttribute(fcol,3));
 const far=new THREE.Mesh(farGeo,new THREE.MeshLambertMaterial({map:textur,vertexColors:true}));scene.add(far);
 const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color(0x2c6496)},horisont:{value:new THREE.Color(0xc5d4d4)}},
  vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 top,horisont;varying float h;void main(){float t=smoothstep(-0.04,0.58,h);gl_FragColor=vec4(mix(horisont,top,t),1.0);}'});
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),skyMat);sky.frustumCulled=false;sky.renderOrder=-1;scene.add(sky);
 const hackMat=new THREE.MeshLambertMaterial({color:0x243f28}),tradMat=new THREE.MeshLambertMaterial({color:0x3c6a34}),broMat=new THREE.MeshLambertMaterial({color:0x9a9486});
 const husGeo=enhet(new THREE.BoxGeometry(1,1,1));
 const hn=husGeo.attributes.normal,hc=new Float32Array(hn.count*3);
 for(let i=0;i<hn.count;i++){const tak=hn.getY(i)>.6;hc[i*3]=tak?0.62:0.76;hc[i*3+1]=tak?0.18:0.70;hc[i*3+2]=tak?0.12:0.56;}
 husGeo.setAttribute('color',new THREE.BufferAttribute(hc,3));
 const hack=new THREE.InstancedMesh(enhet(new THREE.BoxGeometry(1,1,1)),hackMat,W.hacker_max||480);
 const trad=new THREE.InstancedMesh(enhet(new THREE.ConeGeometry(1,1,5)),tradMat,W.trad_max||360);
 const hus=new THREE.InstancedMesh(husGeo,new THREE.MeshLambertMaterial({vertexColors:true}),W.hus_max||120);
 const bro=new THREE.InstancedMesh(enhet(new THREE.BoxGeometry(1,1,1)),broMat,12);
 for(const m of [hack,trad,hus,bro]){m.frustumCulled=false;m.count=0;scene.add(m);}
 const dummy=new THREE.Object3D(),cell=W.storlek/W.segment,fcell=W.lang_m/W.lang_segment;
 function fargYta(basArr,mesh,cx,cz){
  const position=mesh.geometry.attributes.position,color=mesh.geometry.attributes.color,uvs=mesh.geometry.attributes.uv;
  for(let i=0;i<position.count;i++){
   const x=basArr[i*3]+cx,z=basArr[i*3+2]+cz,y=hojd(x,z);position.setY(i,y);
   if(uvs)uvs.setXY(i,x/TILE,z/TILE);
   const s=.92+Math.max(-.08,Math.min(.1,y*.003));color.setXYZ(i,s,s*1.02,s*.96);
  }
  position.needsUpdate=color.needsUpdate=true;if(uvs)uvs.needsUpdate=true;mesh.geometry.computeVertexNormals();
 }
 function lagg(mesh,i,x,y,z,sx,sy,sz,rot){dummy.position.set(x,y,z);dummy.rotation.set(0,rot||0,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);return i+1;}
 function place(cx,cz){
  cx=Math.round(cx/cell)*cell;cz=Math.round(cz/cell)*cell;
  fargYta(bas,ground,cx,cz);ground.position.set(cx,0,cz);
  const fx=Math.round(cx/fcell)*fcell,fz=Math.round(cz/fcell)*fcell;fargYta(fbas,far,fx,fz);far.position.set(fx,-0.6,fz);
  const rad=W.scen_radie_m||400,r2=rad*rad;let nh=0,nt=0,nu=0,nb=0;
  const maxH=W.hacker_max||480,maxT=W.trad_max||360,maxU=W.hus_max||120;
  const tx0=Math.floor((cx-rad)/TILE),tx1=Math.floor((cx+rad)/TILE),tz0=Math.floor((cz-rad)/TILE),tz1=Math.floor((cz+rad)/TILE);
  const tiles=[];for(let tz=tz0;tz<=tz1;tz++)for(let tx=tx0;tx<=tx1;tx++)tiles.push([tx,tz]);
  tiles.sort((a,b)=>Math.hypot(a[0]*TILE-cx,a[1]*TILE-cz)-Math.hypot(b[0]*TILE-cx,b[1]*TILE-cz));
  for(const [tx,tz] of tiles){
   const ox=tx*TILE,oz=tz*TILE;
   const rx=ox+riverLocal(310),bz=oz+310,by=hojd(rx,bz);
   if(nb<12&&(rx-cx)**2+(bz-cz)**2<r2)nb=lagg(bro,nb,rx,by,bz,34,1.4,16,0);
   for(let j=0;j<=8&&nh<maxH;j++)for(let i=0;i<=16&&nh<maxH;i++){
    const x=ox+i*32,z=oz+j*64;if((x-cx)**2+(z-cz)**2>r2)continue;
    if(i<16&&!/flod|vag|bro|by|odling/.test(slag(mod(x+16,TILE),mod(z,TILE)))&&hash(i+tx*3,j+tz)>.4){const hy=2.2+hash(i,j+4)*2.6;nh=lagg(hack,nh,x+16,hojd(x+16,z),z,30,hy,1.5,0);}
    if(j<8&&!/flod|vag|bro|by|odling/.test(slag(mod(x,TILE),mod(z+32,TILE)))&&hash(i+9,j+tz*5)>.45){const hy=2.4+hash(j,i)*2.2;nh=lagg(hack,nh,x,hojd(x,z+32),z+32,28,hy,1.5,Math.PI/2);}
    if(nt<maxT&&hash(i+40,j+tz)>.62&&slag(mod(x,TILE),mod(z,TILE))==='falt'){const s=5+hash(i,j)*6;nt=lagg(trad,nt,x+hash(j,i)*8,hojd(x,z),z+4,2.2+hash(i,j),s,2.2,0);}
   }
   for(let k=0;k<2&&nu<maxU;k++){
    const x0=k?28:346,z0=k?338:228,bw=k?104:122,bh=k?70:74;
    for(let iz=0;iz<5&&nu<maxU;iz++)for(let ix=0;ix<6&&nu<maxU;ix++){
     if(hash(tx+ix,tz+iz+k*9)<.35)continue;
     const x=ox+x0+8+ix*18,z=oz+z0+8+iz*16;if((x-cx)**2+(z-cz)**2>r2)continue;
     const sc=hash(ix+3,iz)>.7?1.35:1,hy=(4.2+hash(ix,iz)*2.4)*sc;
     nu=lagg(hus,nu,x,hojd(x,z),z,(6+hash(iz,ix)*3)*sc,hy,(5+hash(ix,iz+2)*2.5)*sc,hash(ix,iz)*0.4);
    }
   }
   if(nt<maxT){for(let i=0;i<18&&nt<maxT;i++){const x=ox+20+i*28,z=oz+292;if(Math.abs(x-(ox+riverLocal(310)))<36)continue;if((x-cx)**2+(z-cz)**2>r2)continue;nt=lagg(trad,nt,x,hojd(x,z),z,1.1,12+hash(tx,i)*4,1.1,0);}}
   if(nt<maxT){for(let iz=0;iz<12&&nt<maxT;iz++)for(let ix=0;ix<14&&nt<maxT;ix++){const x=ox+200+ix*9,z=oz+60+iz*9;if((x-cx)**2+(z-cz)**2>r2)continue;nt=lagg(trad,nt,x,hojd(x,z),z,1.3,3.2+hash(ix,iz),1.3,0);}}
  }
  hack.count=nh;trad.count=nt;hus.count=nu;bro.count=nb;
  hack.instanceMatrix.needsUpdate=trad.instanceMatrix.needsUpdate=hus.instanceMatrix.needsUpdate=bro.instanceMatrix.needsUpdate=true;
 }
 function dimma(agl){
  const k=Math.min(1,Math.max(0,agl/9000));
  return {near:650+agl*.3,far:Math.min(76000,2400+agl*4.2),k};
 }
 function himmel(kamera,agl){
  sky.position.copy(kamera.position);sky.scale.setScalar(70000);
  const d=dimma(agl),haze=new THREE.Color(0xc5d4d4).lerp(new THREE.Color(0x8eafc6),d.k*.45);
  skyMat.uniforms.horisont.value.copy(haze);
  const dold=agl>(W.traad_dold_over_m||1600);hack.visible=trad.visible=hus.visible=bro.visible=!dold;
  return {near:d.near,far:d.far,farg:haze};
 }
 place(0,0);
 return {hojd,place,himmel,ground,far,sky};
}
