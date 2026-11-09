// Tecken från DeviceOrientation (W3C, samma på iPhone Safari):
// alpha ökar moturs sett uppifrån, så en vridning åt höger MINSKAR alpha.
// beta ökar när ovansidan tippas bakåt från upprätt läge. I porträtt är det blick upp.
// gamma ökar när högerkanten går ned.
// Skärmens vinkel vrider beta/gamma till skärmens upp och höger. Yaw är världens
// vertikal och ska inte följa med skärmen, annars blir en sväng en nick i landskap.
// Positivt resultat: yaw = höger, pitch = upp, roll = högerkant ned.
const DEG=Math.PI/180;
export function wrapDeg(d){return ((d+180)%360+360)%360-180;}

export function skarmLutning(dBeta,dGamma,screenAngle=0){
 const a=(screenAngle||0)*DEG,c=Math.cos(a),s=Math.sin(a);
 return {pitch:dBeta*c-dGamma*s,roll:dBeta*s+dGamma*c};
}

export function tolkaOrientering(alpha,beta,gamma,noll,screenAngle=0){
 const dB=beta-noll.beta,dG=gamma-noll.gamma,dA=wrapDeg(alpha-noll.alpha);
 const lut=skarmLutning(dB,dG,screenAngle);
 return {pitch:lut.pitch*DEG,roll:lut.roll*DEG,yaw:-dA*DEG};
}
