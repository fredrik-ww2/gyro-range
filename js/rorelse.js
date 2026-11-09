const rad=Math.PI/180;

export function gangFartFranLutning(pitchNedRad,gang){
 const grad=pitchNedRad/rad;
 if(grad<gang.dodZon_grad)return 0;
 const u=Math.min(1,(grad-gang.dodZon_grad)/Math.max(.01,gang.max_grad-gang.dodZon_grad));
 return gang.fart_langsam_ms+u*(gang.fart_max_ms-gang.fart_langsam_ms);
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
