// Styrning. Standard lämnar dagens sikte, gång och sväng orörda.
import {skarmLutning} from './riktning.js';

const NYCKEL='gyro_styr_meny_v1';
const GRADER=180/Math.PI;

export const STANDARD_AXEL={
 lage:'foljer',
 kanslighet:1,
 fart:0,
 utjamning:0,
 dodzon:0,
 pa:true
};

export const STANDARD={
 ga:{
  yaw:{...STANDARD_AXEL},
  pitch:{...STANDARD_AXEL},
  roll:{...STANDARD_AXEL}
 },
 sikta:{
  yaw:{...STANDARD_AXEL},
  pitch:{...STANDARD_AXEL},
  roll:{...STANDARD_AXEL}
 },
 gangLutning:false,
 gestNer:false,
 gestNerTroskel:480,
 gestUpp:false,
 gestUppTroskel:480,
 skak:false,
 skakKanslighet:1,
 skakMax:0.02,
 skakMaxTid:2,
 haptik:true,
 matvarden:false
};

const AXLAR=['yaw','pitch','roll'];

export function axelArStandard(a){
 return !!a&&a.lage==='foljer'&&a.kanslighet===1&&!(a.fart>0)&&!(a.utjamning>0)&&!(a.dodzon>0)&&a.pa!==false;
}

function jamfor(a,b){
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 const ka=Object.keys(a),kb=Object.keys(b);
 if(ka.length!==kb.length)return false;
 for(const k of ka)if(!jamfor(a[k],b[k]))return false;
 return true;
}

function klamp(v,min,max,annars){
 const n=Number(v);
 if(!Number.isFinite(n))return annars;
 return Math.min(max,Math.max(min,n));
}

function lasAxel(raw){
 const b={...STANDARD_AXEL};
 if(!raw||typeof raw!=='object')return b;
 b.lage=raw.lage==='rorelse'?'rorelse':'foljer';
 b.kanslighet=klamp(raw.kanslighet,.5,3,1);
 b.fart=klamp(raw.fart,0,3,0);
 b.utjamning=klamp(raw.utjamning,0,1,0);
 b.dodzon=klamp(raw.dodzon,0,20,0);
 b.pa=raw.pa!==false;
 return b;
}

function lasLagen(raw){
 return {yaw:lasAxel(raw?.yaw),pitch:lasAxel(raw?.pitch),roll:lasAxel(raw?.roll)};
}

function tomLager(){
 const m=new Map();
 return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};
}

function globalLager(){
 try{
  if(typeof localStorage!=='undefined'&&localStorage)return localStorage;
 }catch{}
 return tomLager();
}

function kopieraAxel(mal,kall){
 mal.lage=kall.lage;mal.kanslighet=kall.kanslighet;mal.fart=kall.fart;mal.utjamning=kall.utjamning;mal.dodzon=kall.dodzon;mal.pa=kall.pa;
}

export function skapaGyroMeny(lagring){
 const store=lagring||globalLager();
 const varden={
  ga:lasLagen(STANDARD.ga),
  sikta:lasLagen(STANDARD.sikta),
  gangLutning:false,
  gestNer:false,
  gestNerTroskel:480,
  gestUpp:false,
  gestUppTroskel:480,
  skak:false,
  skakKanslighet:1,
  skakMax:0.02,
  skakMaxTid:2,
  haptik:true,
  matvarden:false
 };
 try{
  const sparad=JSON.parse(store.getItem(NYCKEL)||'null');
  if(sparad&&typeof sparad==='object'){
   varden.ga=lasLagen(sparad.ga);
   varden.sikta=lasLagen(sparad.sikta);
   varden.gangLutning=sparad.gangLutning===true;
   varden.gestNer=sparad.gestNer===true;
   varden.gestUpp=sparad.gestUpp===true;
   varden.gestNerTroskel=klamp(sparad.gestNerTroskel,200,900,480);
   varden.gestUppTroskel=klamp(sparad.gestUppTroskel,200,900,480);
   varden.skak=sparad.skak===true;
   varden.skakKanslighet=klamp(sparad.skakKanslighet,.2,3,1);
   varden.skakMax=klamp(sparad.skakMax,0,.05,.02);
   varden.skakMaxTid=klamp(sparad.skakMaxTid,.2,2,2);
   varden.haptik=sparad.haptik!==false;
   varden.matvarden=sparad.matvarden===true;
  }
 }catch{}
 let standard=jamfor(varden,STANDARD);
 function spara(){
  standard=jamfor(varden,STANDARD);
  try{store.setItem(NYCKEL,JSON.stringify(varden));}catch{}
 }
 return {
  varden,
  arStandard:()=>standard,
  satt(){spara();},
  aterstall(){
   for(const lage of ['ga','sikta'])for(const axel of AXLAR)kopieraAxel(varden[lage][axel],STANDARD[lage][axel]);
   varden.gangLutning=false;varden.gestNer=false;varden.gestUpp=false;
   varden.gestNerTroskel=480;varden.gestUppTroskel=480;
   varden.skak=false;varden.skakKanslighet=1;varden.skakMax=0.02;varden.skakMaxTid=2;
   varden.haptik=true;varden.matvarden=false;
   spara();
  }
 };
}

// Samma tecken som tolkaOrientering: yaw höger positiv, pitch upp positiv, roll högerkant ned.
// Bara rotationRate. Linjär acceleration används inte.
export function graderPerSekund(rotationRate,skarmVinkel=0){
 const rr=rotationRate||{};
 const alpha=Number.isFinite(+rr.alpha)?+rr.alpha:0;
 const beta=Number.isFinite(+rr.beta)?+rr.beta:0;
 const gamma=Number.isFinite(+rr.gamma)?+rr.gamma:0;
 const lut=skarmLutning(beta,gamma,skarmVinkel||0);
 return {pitch:lut.pitch,roll:lut.roll,yaw:-alpha};
}

function forstark(varde,fartDps,styrka){
 if(!(styrka>0))return varde;
 const u=Math.min(2.5,Math.abs(fartDps)/90);
 return varde*(1+styrka*u*u);
}

export function behandlaAxel(axel,absolutRad,fartDps,dt,minne){
 if(axelArStandard(axel))return absolutRad;
 if(axel.pa===false){minne.lage=axel.lage;minne.jamnad=0;return 0;}
 const dod=Math.max(0,axel.dodzon||0);
 const kans=axel.kanslighet??1;
 const boost=axel.fart||0;
 const steg=Math.max(0,dt||0);
 let rad;
 if(axel.lage==='rorelse'){
  if(minne.lage!=='rorelse'){minne.integral=absolutRad;minne.jamnad=absolutRad;minne.lage='rorelse';}
  let w=Number.isFinite(fartDps)?fartDps:0;
  if(Math.abs(w)<dod)w=0;
  w=forstark(w,w,boost)*kans;
  minne.integral+=w*(Math.PI/180)*steg;
  rad=minne.integral;
 }else{
  minne.lage='foljer';
  let grader=absolutRad*GRADER;
  if(Math.abs(grader)<dod)grader=0;
  rad=forstark(grader*(Math.PI/180)*kans,fartDps,boost);
 }
 const u=axel.utjamning||0;
 if(!(u>0)){minne.jamnad=rad;return rad;}
 const tau=0.025+u*0.4;
 const a=1-Math.exp(-steg/tau);
 minne.jamnad+=(rad-(minne.jamnad||0))*a;
 return minne.jamnad;
}

export function skapaKryssning(){
 let pace=0,armad=true,visad=0;
 return {
  get pace(){return pace;},
  get fart(){return visad;},
  noll(){pace=0;armad=true;visad=0;},
  // pitchRad och pitchDps: positivt är upp, samma som vinklar.pitch.
  steg(pitchRad,pitchDps){
   const fram=-pitchRad,framDps=Math.max(0,-(pitchDps||0));
   const neutral=6*Math.PI/180,hart=16*Math.PI/180;
   if(Math.abs(pitchRad)<neutral)armad=true;
   let andra=false;
   if(fram>=neutral){
    const stark=fram>=hart||framDps>90;
    const mal=stark?2:1;
    if(mal>pace||(armad&&pace===0)){if(pace!==mal)andra=true;pace=mal;}
    armad=false;
    const u=Math.min(1,Math.max(0,(fram-neutral)/(24*Math.PI/180)));
    const su=Math.min(1,framDps/140);
    const bas=pace===2?4.1:1.05;
    const topp=pace===2?6.4:2.8;
    visad=bas+(topp-bas)*Math.max(u,su);
   }else if(pitchRad>neutral&&armad&&pace>0){
    pace-=1;andra=true;armad=false;
    visad=pace===2?4.1:pace===1?1.05:0;
   }else visad=pace===2?4.1:pace===1?1.05:0;
   return {fart:visad,pace,andra};
  }
 };
}

export function skapaGester(){
 let sparrTill=0;
 return {
  noll(){sparrTill=0;},
  // tippDps > 0 är nedåt/framåt, samma tecken som pitchNedDps.
  steg(tippDps,tid,installning){
   if(!installning?.gestNer&&!installning?.gestUpp)return null;
   const ner=!!installning.gestNer&&tippDps>=installning.gestNerTroskel;
   const upp=!!installning.gestUpp&&-tippDps>=installning.gestUppTroskel;
   if(!ner&&!upp)return null;
   if(tid<sparrTill)return null;
   sparrTill=tid+0.85;
   if(ner&&(!upp||tippDps>=-tippDps))return 'ner';
   if(upp)return 'upp';
   return null;
  }
 };
}

export function skapaOjämnhet(){
 const prover=[];
 let t=0,kvar=0,tid=0,topp=0,amp=0;
 return {
  noll(){prover.length=0;t=0;kvar=0;tid=0;topp=0;amp=0;},
  steg(fartRadS,dt,inst){
   if(!inst?.skak){this.noll();return {amp:0,ny:false,tid:0};}
   const steg=Math.max(0,dt||0);
   t+=steg;
   prover.push({t,fart:Math.abs(fartRadS)||0});
   const grans=t-0.16;
   while(prover.length>1&&prover[0].t<grans)prover.shift();
   let sum=0,n=0;
   for(let i=1;i<prover.length;i++){
    const d=prover[i].t-prover[i-1].t;
    if(d>1e-4){sum+=Math.abs(prover[i].fart-prover[i-1].fart)/d;n++;}
   }
   const jerk=n?sum/n:0;
   const kans=inst.skakKanslighet||1;
   const styrka=Math.min(1,Math.max(0,(jerk-1.5)/40)*kans);
   const maxTid=Math.min(2,Math.max(.05,inst.skakMaxTid||2));
   const maxAmp=Math.max(0,inst.skakMax||0);
   let ny=false;
   if(styrka>0.04){
    const nyTid=Math.min(maxTid,Math.max(.12,maxTid*Math.min(1,styrka)));
    const nyTopp=Math.min(maxAmp,maxAmp*Math.min(1,styrka));
    if(nyTopp>amp*0.85){
     if(kvar<=0.05)ny=true;
     topp=Math.max(topp,nyTopp);
     tid=Math.max(tid,nyTid);
     kvar=Math.max(kvar,nyTid);
    }
   }
   if(kvar>0){
    kvar=Math.max(0,kvar-steg);
    amp=tid>0?topp*Math.max(0,kvar/tid):0;
    if(kvar===0){topp=0;tid=0;amp=0;}
   }else amp=0;
   return {amp,ny,tid,jerk};
  }
 };
}

export function skapaLager(){
 const minnen={};
 const kryss=skapaKryssning();
 const gest=skapaGester();
 const skak=skapaOjämnhet();
 let hojd=0,fart=0;
 function minne(nyckel){return minnen[nyckel]||(minnen[nyckel]={lage:'foljer',integral:0,jamnad:0});}
 return {
  kryss,gest,skak,
  get hoppHojd(){return hojd;},
  noll(){
   for(const k of Object.keys(minnen)){minnen[k].lage='foljer';minnen[k].integral=0;minnen[k].jamnad=0;}
   kryss.noll();gest.noll();skak.noll();hojd=0;fart=0;
  },
  // null när alla tre axlar är standard: anroparen ska lämna vinklarna orörda.
  vinklar(lageNamn,absolut,fartDps,dt,installning){
   const block=installning[lageNamn];
   if(!block)return null;
   let andrad=false;
   const ut={pitch:absolut.pitch,yaw:absolut.yaw,roll:absolut.roll};
   for(const axel of AXLAR){
    if(axelArStandard(block[axel]))continue;
    andrad=true;
    ut[axel]=behandlaAxel(block[axel],absolut[axel],fartDps?.[axel]||0,dt,minne(lageNamn+'.'+axel));
   }
   return andrad?ut:null;
  },
  hoppa(){fart=Math.max(fart,3.5);},
  hopp(dt){
   if(hojd<=0&&fart<=0)return 0;
   fart-=12*Math.max(0,dt||0);
   hojd+=fart*Math.max(0,dt||0);
   if(hojd<=0){hojd=0;fart=0;}
   return hojd;
  }
 };
}

export function haptikMetod(){
 try{
  if(typeof navigator!=='undefined'&&typeof navigator.vibrate==='function')return 'vibrate';
 }catch{}
 return 'ios-brytare';
}

export function haptikText(metod){
 return metod==='vibrate'
  ?'Vibration: navigator.vibrate'
  :'iOS-brytare: dold switch-bock';
}

export function skapaTick(label){
 const metod=haptikMetod();
 let på=()=>true;
 let senast=0;
 function tick(minMs=90){
  if(!på())return false;
  const nu=typeof performance!=='undefined'?performance.now():Date.now();
  if(nu-senast<minMs)return false;
  senast=nu;
  if(metod==='vibrate'){
   try{navigator.vibrate(12);}catch{}
   return true;
  }
  try{label?.click();}catch{}
  return true;
 }
 return {
  metod,
  text:haptikText(metod),
  sätt(fn){på=fn;},
  tick,
  skott(){if(metod==='vibrate')return false;return tick(90);}
 };
}

function runda(v,steg){
 const n=Math.round(Number(v)/steg)*steg;
 return Math.round(n*1000)/1000;
}

export function byggStyrMeny(rot,meny,hooks={}){
 if(!rot)return;
 rot.replaceChildren();
 const rit=[];
 const lager=hooks.lager;
 function grupp(rubrik,nod){
  const d=document.createElement('details');
  const s=document.createElement('summary');
  s.textContent=rubrik;
  d.append(s);
  for(const n of nod)d.append(n);
  return d;
 }
 function brytare(text,las,skriv,id){
  const lab=document.createElement('label');
  lab.className='bryt';
  const inp=document.createElement('input');
  inp.type='checkbox';
  if(id)inp.id=id;
  inp.checked=!!las();
  inp.onchange=()=>{skriv(inp.checked);meny.satt();};
  const span=document.createElement('span');
  span.textContent=text;
  lab.append(inp,span);
  rit.push(()=>{inp.checked=!!las();});
  return lab;
 }
 function slider(namn,min,max,steg,las,skriv,text,enhet){
  const lab=document.createElement('label');
  lab.className='reglage';
  const rub=document.createElement('span');
  rub.textContent=namn;
  const ut=document.createElement('output');
  const inp=document.createElement('input');
  inp.type='range';inp.min=String(min);inp.max=String(max);inp.step=String(steg);
  const visa=()=>{
   const n=las();
   inp.value=String(n);
   ut.value=text?text(n):String(n)+(enhet?enhet:'');
  };
  inp.oninput=()=>{skriv(runda(inp.value,steg));meny.satt();visa();};
  visa();
  lab.append(rub,ut,inp);
  rit.push(visa);
  return lab;
 }
 function valjLage(inst){
  const rad=document.createElement('div');
  rad.className='valj';
  const knappar=[['foljer','Följer läget'],['rorelse','Bara när den rör sig']];
  const els=[];
  for(const [id,text] of knappar){
   const b=document.createElement('button');
   b.type='button';b.textContent=text;b.dataset.lage=id;
   b.onclick=()=>{inst.lage=id;meny.satt();rit.forEach(f=>f());};
   els.push(b);rad.append(b);
  }
  rit.push(()=>{for(const e of els)e.classList.toggle('vald',e.dataset.lage===inst.lage);});
  rit[rit.length-1]();
  return rad;
 }
 function axelGrupp(lage,axel,namn,medAv){
  const inst=meny.varden[lage][axel];
  const barn=[];
  if(medAv)barn.push(brytare('På',()=>inst.pa!==false,v=>{inst.pa=v;},null));
  barn.push(valjLage(inst));
  barn.push(slider('Känslighet',.5,3,.1,()=>inst.kanslighet,v=>{inst.kanslighet=v;},v=>v.toFixed(1)+'×'));
  barn.push(slider('Fartförstärkning',0,3,.1,()=>inst.fart,v=>{inst.fart=v;},v=>v<=0?'linjär':v>=2.95?'stark':v.toFixed(1)));
  barn.push(slider('Utjämning',0,1,.05,()=>inst.utjamning,v=>{inst.utjamning=v;},v=>v<=0?'ingen':v>=.99?'stark':v.toFixed(2)));
  const dod=slider('Dödzon',0,20,.5,()=>inst.dodzon,v=>{inst.dodzon=v;},v=>{
   const enhet=inst.lage==='rorelse'?' °/s':'°';
   return (v>=10?v.toFixed(0):v.toFixed(1))+enhet;
  });
  barn.push(dod);
  const d=grupp(namn,barn);
  d.dataset.axel=lage+'.'+axel;
  return d;
 }
 function lageGrupp(id,rubrik){
  return grupp(rubrik,[
   axelGrupp(id,'yaw','Vrida',false),
   axelGrupp(id,'pitch','Luta fram/bak',false),
   axelGrupp(id,'roll','Luta åt sidan',true)
  ]);
 }
 const rad=document.createElement('div');
 rad.className='rad';
 const standard=document.createElement('button');
 standard.type='button';standard.id='styrStandard';standard.className='primary';standard.textContent='Standard';
 const noll=document.createElement('button');
 noll.type='button';noll.id='styrNoll';noll.textContent='Nollställ';
 standard.onclick=()=>{meny.aterstall();lager?.noll();rit.forEach(f=>f());};
 noll.onclick=()=>{hooks.noll?.();};
 rad.append(standard,noll);
 const led=document.createElement('p');
 led.textContent='Standard är så banan styrs idag. Ändringar sparas på den här telefonen.';
 const gang=grupp('Gång',[
  brytare('Gå med lutning',()=>meny.varden.gangLutning,v=>{meny.varden.gangLutning=v;if(!v)lager?.kryss.noll();},'styrGang'),
  document.createElement('p'),
  brytare('Knyck nedåt: ligg',()=>meny.varden.gestNer,v=>{meny.varden.gestNer=v;},'styrGestNer'),
  slider('Tröskel nedåt',200,900,10,()=>meny.varden.gestNerTroskel,v=>{meny.varden.gestNerTroskel=v;},v=>v.toFixed(0)+' °/s'),
  brytare('Knyck uppåt: hoppa',()=>meny.varden.gestUpp,v=>{meny.varden.gestUpp=v;},'styrGestUpp'),
  slider('Tröskel uppåt',200,900,10,()=>meny.varden.gestUppTroskel,v=>{meny.varden.gestUppTroskel=v;},v=>v.toFixed(0)+' °/s')
 ]);
 gang.querySelector('p').textContent='Luta lite framåt för att gå. Tillbaka till noll håller farten. Luta bakåt bromsar ett steg: spring, gå, stanna. En vanlig lutning utlöser inte knyckarna.';
 const skak=grupp('Skakning',[
  brytare('Skakning vid ojämn rörelse',()=>meny.varden.skak,v=>{meny.varden.skak=v;if(!v)lager?.skak.noll();},'styrSkak'),
  slider('Skakkänslighet',.2,3,.1,()=>meny.varden.skakKanslighet,v=>{meny.varden.skakKanslighet=v;},v=>v.toFixed(1)+'×'),
  slider('Max skakning',0,.05,.001,()=>meny.varden.skakMax,v=>{meny.varden.skakMax=v;},v=>(v*GRADER).toFixed(1)+'°'),
  slider('Max lugningstid',.2,2,.1,()=>meny.varden.skakMaxTid,v=>{meny.varden.skakMaxTid=v;},v=>v.toFixed(1)+' s')
 ]);
 const metod=hooks.tick?.metod||haptikMetod();
 const hapt=grupp('Haptik',[
  brytare('Knackningar',()=>meny.varden.haptik,v=>{meny.varden.haptik=v;},'styrHaptikPa'),
  document.createElement('p')
 ]);
 const metodP=hapt.querySelector('p');
 metodP.id='styrHaptikMetod';
 metodP.textContent=haptikText(metod);
 const mat=grupp('Mätvärden',[
  brytare('Visa mätvärden',()=>meny.varden.matvarden,v=>{meny.varden.matvarden=v;},'styrMat')
 ]);
 rot.append(rad,led,lageGrupp('ga','Gå'),lageGrupp('sikta','Sikta'),gang,skak,hapt,mat);
}
