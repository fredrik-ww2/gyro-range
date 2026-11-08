export function propellerSkiva(THREE,radie){
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
 const grd=g.createRadialGradient(64,64,6,64,64,64);
 grd.addColorStop(0,'rgba(186,190,194,0)');grd.addColorStop(.28,'rgba(170,174,178,.22)');grd.addColorStop(.7,'rgba(148,152,156,.62)');grd.addColorStop(1,'rgba(130,134,138,0)');
 g.fillStyle=grd;g.fillRect(0,0,128,128);
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
 const mat=new THREE.MeshBasicMaterial({map,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide});
 return {mesh:new THREE.Mesh(new THREE.CircleGeometry(radie,32),mat),mat};
}
export function motorRpm(gas,motor,pitch=0.45,motorPa=true){if(!motorPa)return 0;const t=Math.max(0,Math.min(1,gas)),p=Math.max(0,Math.min(1,pitch));return motor.tomgang_rpm+t*(motor.max_rpm-motor.tomgang_rpm)*(0.68+0.32*(1-p));}
export function propVarv(gas,motor,pitch,motorPa){return motorRpm(gas,motor,pitch,motorPa)*motor.prop_utvaxling/60;}
