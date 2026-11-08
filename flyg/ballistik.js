// Hispano 20 mm, förenklad bana. Luftmotstånd a = −k·ρ·v² längs banan, k = ½·Cd·A/m.
// Tyngd läggs på i kulsteget. Ledvinkel för 90° korsande mål: atan(vinkelrät fart · flygtid / avstånd).
import {luftdensitet} from './flight-model.js';
export const MYNNING=880, MASSA=0.13, KALIBER=0.02, CD=0.42, G=9.80665;
export const AREA=Math.PI*(KALIBER*0.5)**2;
export const REFERENSFART=120, REFERENSAVSTAND=200;
export const AVSTAND=[100,200,300,400];
export function dragK(rho){return 0.5*CD*rho*AREA/MASSA;}
export function flygtid(R,rho,v0=MYNNING){const k=dragK(rho),s=Math.max(0,R);if(s<1e-3)return 0;if(k*s<1e-6)return s/v0;return (Math.exp(k*s)-1)/(k*v0);}
export function fartKvar(R,rho,v0=MYNNING){return v0*Math.exp(-dragK(rho)*Math.max(0,R));}
export function fallMeter(R,rho,v0=MYNNING){const t=flygtid(R,rho,v0);return 0.5*G*t*t;}
export function ledvinkel(R,vt,rho,v0=MYNNING){return Math.atan2(Math.max(0,vt)*flygtid(R,rho,v0),Math.max(1,R));}
export function ledTabell(rho=1.225,farter=[REFERENSFART],avstand=AVSTAND,v0=MYNNING){
 return avstand.map(R=>{const t=flygtid(R,rho,v0);return {R,t,fart:fartKvar(R,rho,v0),fall:0.5*G*t*t,leder:farter.map(vt=>({vt,rad:ledvinkel(R,vt,rho,v0),grader:ledvinkel(R,vt,rho,v0)*180/Math.PI,mil:ledvinkel(R,vt,rho,v0)*1000,meter:vt*t}))};});
}
// Sikte och kulor delar den här punkten: var målet är när kulan hinner fram, plus fallhöjden.
export function sikteLed(fran,pos,vel,rho,v0=MYNNING){
 const dx=pos.x-fran.x,dy=pos.y-fran.y,dz=pos.z-fran.z,R=Math.max(1,Math.hypot(dx,dy,dz)),t=flygtid(R,rho,v0);
 const lx=dx/R,ly=dy/R,lz=dz/R,vr=vel.x*lx+vel.y*ly+vel.z*lz;
 const vpx=vel.x-vr*lx,vpy=vel.y-vr*ly,vpz=vel.z-vr*lz,vp=Math.hypot(vpx,vpy,vpz);
 const fall=0.5*G*t*t;
 return {x:pos.x+vel.x*t,y:pos.y+vel.y*t+fall,z:pos.z+vel.z*t,t,R,vp,vinkel:Math.atan2(vp*t,R),fall};
}
export function bromsa(v,rho,dt){
 const s=Math.hypot(v.x,v.y,v.z);if(s>1){const f=Math.max(0,1-dragK(rho)*s*dt);v.x*=f;v.y*=f;v.z*=f;}
 v.y-=G*dt;
}
export function ringRadie(rho=1.225){return ledvinkel(REFERENSAVSTAND,REFERENSFART,rho,MYNNING);}
export {luftdensitet};
