// Tecken från DeviceOrientation (W3C, samma på iPhone Safari):
// alpha ökar moturs sett uppifrån, så en vridning åt höger MINSKAR alpha.
// beta ökar när ovansidan tippas bakåt från upprätt läge. I porträtt är det blick upp.
// gamma ökar när högerkanten går ned.
// Skärmens vinkel vrider beta/gamma till skärmens upp och höger. Yaw är världens
// vertikal och ska inte följa med skärmen, annars blir en sväng en nick i landskap.
// Positivt resultat: yaw = höger, pitch = upp, roll = högerkant ned.
const DEG=Math.PI/180;
const FIX=axelVinkel(1,0,0,-Math.PI/2);
export function wrapDeg(d){return ((d+180)%360+360)%360-180;}

function axelVinkel(x,y,z,v){
 const h=v/2,s=Math.sin(h);
 return {x:x*s,y:y*s,z:z*s,w:Math.cos(h)};
}
function mul(a,b){
 return {
  x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,
  y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,
  z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w,
  w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z
 };
}
function eulerYXZ(x,y,z){
 const c1=Math.cos(x/2),c2=Math.cos(y/2),c3=Math.cos(z/2);
 const s1=Math.sin(x/2),s2=Math.sin(y/2),s3=Math.sin(z/2);
 return {
  x:s1*c2*c3+c1*s2*s3,
  y:c1*s2*c3-s1*c2*s3,
  z:c1*c2*s3-s1*s2*c3,
  w:c1*c2*c3+s1*s2*s3
 };
}
// Samma enhetskvaternion som GyroAim, utan skärmvridning.
// Avståndet mellan två prov är oberoende av vilken Euler-karta sensorn valde.
function enhetsQuat(p){
 return mul(eulerYXZ(p.beta*DEG,p.alpha*DEG,-p.gamma*DEG),FIX);
}
export function fysikGrader(a,b){
 if(!a||!b)return 0;
 const qa=enhetsQuat(a),qb=enhetsQuat(b);
 const d=Math.abs(qa.x*qb.x+qa.y*qb.y+qa.z*qb.z+qa.w*qb.w);
 return 2*Math.acos(Math.min(1,d))/DEG;
}

export function skarmLutning(dBeta,dGamma,screenAngle=0){
 const a=(screenAngle||0)*DEG,c=Math.cos(a),s=Math.sin(a);
 return {pitch:dBeta*c-dGamma*s,roll:dBeta*s+dGamma*c};
}

export function tolkaOrientering(alpha,beta,gamma,noll,screenAngle=0){
 const dB=wrapDeg(beta-noll.beta),dG=wrapDeg(gamma-noll.gamma),dA=wrapDeg(alpha-noll.alpha);
 const lut=skarmLutning(dB,dG,screenAngle);
 return {pitch:lut.pitch*DEG,roll:lut.roll*DEG,yaw:-dA*DEG};
}

// Sant när siffrorna hoppar men telefonen knappt rört sig (gamma ±90, beta nära ±180).
export function arOmslag(fore,nu,eulerGrans=40,fysikGrans=25){
 if(!fore||!nu)return false;
 if(![fore.alpha,fore.beta,fore.gamma,nu.alpha,nu.beta,nu.gamma].every(Number.isFinite))return false;
 const e=Math.hypot(wrapDeg(nu.beta-fore.beta),wrapDeg(nu.gamma-fore.gamma),wrapDeg(nu.alpha-fore.alpha));
 const f=fysikGrader(fore,nu);
 return e>eulerGrans&&f<fysikGrans&&e>f*4;
}

// Nytt nolläge så att det nya provet ger samma utslag. Ut är radianer från tolkaOrientering.
export function nyNollRiktning(nu,ut,screenAngle=0){
 const pitch=ut.pitch/DEG,roll=ut.roll/DEG,yaw=ut.yaw/DEG;
 const a=(screenAngle||0)*DEG,c=Math.cos(a),s=Math.sin(a);
 const dB=pitch*c+roll*s;
 const dG=-pitch*s+roll*c;
 return {alpha:nu.alpha+yaw,beta:nu.beta-dB,gamma:nu.gamma-dG};
}
