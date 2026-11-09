// Fart och skakning som rena tal, så gester och gång kan testas utan scenen.
const DOD=3*Math.PI/180;

export function gangFaktor(stallning, siktar){
 const sikte=siktar?.5:1;
 if(stallning==='liggande')return .2*sikte;
 if(stallning==='hukande'||stallning==='knastående')return .62*sikte;
 return sikte;
}

// Vinkel från noll, minus dödzonen. Positivt är vridet åt höger.
export function styrVinkel(yaw, dod=DOD){
 const m=Math.abs(yaw);
 if(m<dod)return 0;
 return Math.sign(yaw)*(m-dod);
}

// Sekunder av extra skakning efter gång. Långsam gång 1 s, sprint 3 s.
export function skakSekunder(fart){
 const u=Math.min(1,Math.max(0,(fart-1.1)/(4.2-1.1)));
 return 1+u*2;
}

// 1 när avtryckaren dragits långsamt i en sekund.
export function stadga(dragSek){return Math.min(1,Math.max(0,dragSek));}

// 0 i vila, 1 vid sprint eller en snabb sikt-/kroppsrörelse.
export function rorelseStyrka({sikteRadS=0,kroppRadS=0,gang=0}={}){
 const s=Math.min(1,Math.abs(sikteRadS)/2.2);
 const k=Math.min(1,Math.abs(kroppRadS)/1.6);
 const g=Math.min(1,Math.max(0,gang)/4.2);
 return Math.max(s,k,g);
}

// Vila-skakningen finns alltid. Den växer med senaste rörelsen och är noll bara när avtryckaren är stadgad.
export function skakAmplitud(vila,styrka,kvar,tid,stadgaNu){
 const andel=tid>0?Math.max(0,Math.min(1,kvar/tid)):0;
 const lugn=Math.max(0,Math.min(1,1-(stadgaNu||0)));
 return Math.max(0,vila)*(1+Math.max(0,Math.min(1,styrka||0))*3.2*andel)*lugn;
}
