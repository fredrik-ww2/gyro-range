const rad=Math.PI/180;

export function gangFartFranLutning(pitchNedRad,gang){
 const grad=pitchNedRad/rad;
 const dod=gang.dodZon_grad||0;
 if(!(grad>dod))return 0;
 const u=Math.min(1,(grad-dod)/Math.max(.01,gang.max_grad-dod));
 // 0 precis utanför dödzonen, full fart vid max lutning. Ingen tröskel som startar gången med ett ryck.
 return u*(gang.fart_langsam_ms+u*(gang.fart_max_ms-gang.fart_langsam_ms));
}

// Sidlutning svänger kroppen. Liten lutning är stilla. Större lutning ger en tydligt stark sväng.
// lage 'sikte' används i förstaperson med vapen uppe: bredare dödzon så finriktning inte snurrar en.
// 'gang' används vid gång och i bakifrån-vyn, där lutningen själv är svängen.
export function svangFranRoll(rollRad,gang,lage='gang'){
 const sikte=lage==='sikte';
 const dodG=sikte?(gang.svang_sikte_dod_grad??18):(gang.svang_dod_grad??6);
 const fullG=sikte?(gang.svang_sikte_full_grad??30):(gang.svang_full_grad??22);
 const a=Math.abs(rollRad);
 const dod=dodG*rad;
 if(!(a>dod))return 0;
 const span=Math.max(.08,(fullG-dodG)*rad);
 let u=Math.min(1,(a-dod)/span);
 u=sikte?u*u*u:u*u;
 return Math.sign(rollRad)*(gang.svang_stark??4.2)*u;
}

// Ren sidled ska vara långsammare än gång framåt. Andelen är sidofart delat med framåtfart.
export function sidoAndel(gang){
 const a=Number(gang?.sido_andel);
 return Math.min(.65,Math.max(.15,Number.isFinite(a)?a:.36));
}

// Skjuter ut en punkt ur axelriktade hinder. Används så man går runt lådor och murar.
export function knuffUt(x,z,radie,hinder){
 let px=x,pz=z;
 const r=Math.max(0,radie||0);
 if(!hinder||!r)return {x:px,z:pz};
 for(const h of hinder){
  const cx=Math.max(h.minX,Math.min(px,h.maxX));
  const cz=Math.max(h.minZ,Math.min(pz,h.maxZ));
  let dx=px-cx,dz=pz-cz,d2=dx*dx+dz*dz;
  if(d2>=r*r)continue;
  const d=Math.sqrt(d2);
  if(d<1e-6){
   const utX=px<(h.minX+h.maxX)/2?-1:1,utZ=pz<(h.minZ+h.maxZ)/2?-1:1;
   dx=utX;dz=utZ;d2=2;
  }
  const len=Math.sqrt(d2),push=r-d+0.001;
  px+=dx/len*push;pz+=dz/len*push;
 }
 return {x:px,z:pz};
}

// Positiv yaw är vridet åt höger. Dödzonen är en andel av ett kvarts varv.
export function kroppFartRad(yawRad,kropp){
 const andel=Math.abs(yawRad)/(Math.PI/2);
 if(andel<kropp.dodZon_andel)return 0;
 const u=(andel-kropp.dodZon_andel)/Math.max(.01,1-kropp.dodZon_andel);
 return Math.sign(yawRad)*u*kropp.kanslighet;
}

// I vila sväljs en liten yaw så sensorn inte driver kroppen. En hållen vridning utanför vilozonen styr som förut.
export function kroppIVila(yawRad,yawFartDps,kropp){
 const vila=(kropp.vila_grad??7)*rad;
 return Math.abs(yawFartDps)<(kropp.vila_fart??12)&&Math.abs(yawRad)<vila;
}

export function hoftMalRad(rollRad,over){
 const max=over.max_grad*rad;
 return Math.max(-max,Math.min(max,rollRad*over.kanslighet));
}

// Ett steg per knyck. Ny knyck först när farten sjunkit under gränsen. Gränsen är inte hukans.
export function skapaKnyck(){
 let redo=true;
 return {
  steg(pitchNedDps,grans){
   if(pitchNedDps>=grans&&redo){redo=false;return true;}
   if(pitchNedDps<grans*.45)redo=true;
   return false;
  }
 };
}

export function benFoljer(hoftRad,over,dt){
 const grans=over.benFoljer_grad*rad;
 if(Math.abs(hoftRad)<=grans)return {hoft:hoftRad,kropp:0};
 const overskott=Math.sign(hoftRad)*(Math.abs(hoftRad)-grans);
 const steg=Math.sign(overskott)*Math.min(Math.abs(overskott),over.benFart*dt);
 return {hoft:hoftRad-steg,kropp:steg};
}
