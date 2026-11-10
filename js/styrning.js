// Namngivna styrvärden. Menyn skruvar på samma objekt, och det sparas på enheten.
const NYCKEL='gyro_styrlabb_v1';

export const STANDARD={
 gang:{satt:'lutning',dodZon_grad:4,max_grad:26,fart_langsam_ms:1.05,fart_max_ms:4.1,knyck_dps:120,steg_m:0.72,svang_mjuk:1,svang_stark:4.2,svang_dod_grad:6,svang_full_grad:22,svang_sikte_dod_grad:18,svang_sikte_full_grad:30,sido_andel:0.36},
 spurt:{fart_ms:7.4,uthallighet_s:6,aterhamtning_s:9,puls_avklingning_s:14,puls_skak:1.1},
 kropp:{dodZon_andel:0.03,kanslighet:3.2,vila_grad:7,vila_fart:12},
 overkropp:{max_grad:90,kanslighet:1.15,benFoljer_grad:58,benFart:1.4,vila_grad:3},
 sikte:{satt:'roll_kropp',kanslighet:1,dodZon_grad:0.6,utjamning_s:0.05,ytterst:false},
 platta:{fart_ms:2.4},
 skak:{grund:0.0018,efter:3.2,nu:1.5,avklingning_langsam_s:1,avklingning_sprint_s:3,jarnForsening_s:0.22},
 ksp:{skak_staende:1,skak_kna:0.55,skak_monterad:0.16,rekyl_monterad:0.12},
 avtryckare:{drag_px:28,kram_s:0.45,hall_s:0.5,snabbt_s:0.2,snabb_fart:720},
 haptik:{kram:0.18,skott:1},
 kikare:{variant:'zf39',zoom:4,kanslighet:0.4},
 stallning:{satt:'gyro',grans_dps:250,ner_dps:250,upp_dps:220}
};

export const FALT=[
 {flik:'Gång',nyckel:'gang.satt',namn:'Gångsätt',typ:'val',val:[{id:'lutning',namn:'Lutning framåt'},{id:'knyck',namn:'Knyck framåt'}]},
 {flik:'Gång',nyckel:'gang.knyck_dps',namn:'Hastighetsgräns knyck',min:40,max:400,steg:5,enhet:'°/s'},
 {flik:'Gång',nyckel:'gang.steg_m',namn:'Steglängd knyck',min:0.2,max:1.6,steg:0.05,enhet:'m'},
 {flik:'Gång',nyckel:'gang.svang_mjuk',namn:'Mjuk sväng vid vridning',min:0.2,max:3,steg:0.1,enhet:'×'},
 {flik:'Gång',nyckel:'gang.svang_dod_grad',namn:'Dödzon sidlutning',min:0,max:16,steg:0.5,enhet:'°'},
 {flik:'Gång',nyckel:'gang.svang_full_grad',namn:'Lutning för full sväng',min:10,max:40,steg:1,enhet:'°'},
 {flik:'Gång',nyckel:'gang.svang_stark',namn:'Stark sväng vid sidlutning',min:0.4,max:8,steg:0.1,enhet:'rad/s'},
 {flik:'Gång',nyckel:'gang.svang_sikte_dod_grad',namn:'Dödzon sväng i sikte',min:8,max:28,steg:0.5,enhet:'°'},
 {flik:'Gång',nyckel:'gang.sido_andel',namn:'Sidofart mot framåt',min:0.15,max:0.65,steg:0.01,enhet:'andel'},
 {flik:'Gång',nyckel:'gang.dodZon_grad',namn:'Dödzon framåtlutning',min:0,max:12,steg:0.5,enhet:'°'},
 {flik:'Gång',nyckel:'gang.max_grad',namn:'Lutning för full gång',min:8,max:45,steg:1,enhet:'°'},
 {flik:'Gång',nyckel:'gang.fart_langsam_ms',namn:'Långsam gång',min:0.3,max:2.5,steg:0.05,enhet:'m/s'},
 {flik:'Gång',nyckel:'gang.fart_max_ms',namn:'Snabb gång',min:1.5,max:6,steg:0.1,enhet:'m/s'},
 {flik:'Spurt',nyckel:'spurt.fart_ms',namn:'Spurtfart',min:4,max:10,steg:0.1,enhet:'m/s'},
 {flik:'Spurt',nyckel:'spurt.uthallighet_s',namn:'Uthållighet',min:2,max:20,steg:0.5,enhet:'s'},
 {flik:'Spurt',nyckel:'spurt.aterhamtning_s',namn:'Återhämtning',min:3,max:30,steg:0.5,enhet:'s'},
 {flik:'Spurt',nyckel:'spurt.puls_avklingning_s',namn:'Puls klingar av',min:3,max:30,steg:0.5,enhet:'s'},
 {flik:'Spurt',nyckel:'spurt.puls_skak',namn:'Pulsens skakning',min:0,max:3,steg:0.05,enhet:'×'},
 {flik:'Kropp',nyckel:'kropp.dodZon_andel',namn:'Dödzon vridning',min:0,max:0.15,steg:0.005,enhet:'andel'},
 {flik:'Kropp',nyckel:'kropp.kanslighet',namn:'Känslighet vridning',min:0.4,max:8,steg:0.1,enhet:'×'},
 {flik:'Kropp',nyckel:'kropp.vila_grad',namn:'Vila innan kroppen vrids',min:2,max:15,steg:0.5,enhet:'°'},
 {flik:'Kropp',nyckel:'kropp.vila_fart',namn:'Stillafart som inte vrider',min:2,max:40,steg:1,enhet:'°/s'},
 {flik:'Kropp',nyckel:'overkropp.vila_grad',namn:'Vila innan höften vrids',min:0,max:12,steg:0.5,enhet:'°'},
 {flik:'Kropp',nyckel:'overkropp.max_grad',namn:'Max höftvridning',min:30,max:90,steg:1,enhet:'°'},
 {flik:'Kropp',nyckel:'overkropp.kanslighet',namn:'Känslighet höft',min:0.3,max:3,steg:0.05,enhet:'×'},
 {flik:'Kropp',nyckel:'overkropp.benFoljer_grad',namn:'Ben följer efter',min:20,max:90,steg:1,enhet:'°'},
 {flik:'Kropp',nyckel:'overkropp.benFart',namn:'Hur snabbt benen följer',min:0.2,max:4,steg:0.1,enhet:'×'},
 {flik:'Sikte',nyckel:'sikte.satt',namn:'Siktsätt',typ:'val',val:[{id:'tipp_vrid',namn:'Luta upp/ner, vrid sidled'},{id:'roll_kropp',namn:'Luta sidled, vrid kroppen'},{id:'overkropp',namn:'Överkroppen vrids'}]},
 {flik:'Sikte',nyckel:'sikte.kanslighet',namn:'Känslighet sikte',min:0.15,max:4,steg:0.05,enhet:'×'},
 {flik:'Sikte',nyckel:'sikte.dodZon_grad',namn:'Dödzon sikte',min:0,max:5,steg:0.1,enhet:'°'},
 {flik:'Sikte',nyckel:'sikte.utjamning_s',namn:'Utjämning',min:0.01,max:0.25,steg:0.005,enhet:'s'},
 {flik:'Sikte',nyckel:'sikte.ytterst',namn:'Ytterst känsligt (håll stilla)',typ:'bool'},
 {flik:'Sikte',nyckel:'platta.fart_ms',namn:'Styrplatta med vapen uppe',min:0.4,max:4,steg:0.1,enhet:'m/s'},
 {flik:'Skakning',nyckel:'skak.grund',namn:'Grundskakning',min:0,max:0.006,steg:0.0001,enhet:'rad'},
 {flik:'Skakning',nyckel:'skak.efter',namn:'Efter förflyttning',min:0,max:6,steg:0.1,enhet:'×'},
 {flik:'Skakning',nyckel:'skak.nu',namn:'Medan siktet rör sig',min:0,max:4,steg:0.1,enhet:'×'},
 {flik:'Skakning',nyckel:'skak.avklingning_langsam_s',namn:'Avklingning långsam',min:0.3,max:4,steg:0.1,enhet:'s'},
 {flik:'Skakning',nyckel:'skak.avklingning_sprint_s',namn:'Avklingning spurt',min:1,max:8,steg:0.1,enhet:'s'},
 {flik:'Skakning',nyckel:'skak.jarnForsening_s',namn:'Järnsikte linjeras efter',min:0.05,max:0.6,steg:0.01,enhet:'s'},
 {flik:'Kulspruta',nyckel:'ksp.skak_staende',namn:'Skakning stående',min:0.2,max:2,steg:0.05,enhet:'×'},
 {flik:'Kulspruta',nyckel:'ksp.skak_kna',namn:'Skakning på knä',min:0.1,max:1.5,steg:0.05,enhet:'×'},
 {flik:'Kulspruta',nyckel:'ksp.skak_monterad',namn:'Skakning monterad',min:0,max:0.6,steg:0.02,enhet:'×'},
 {flik:'Kulspruta',nyckel:'ksp.rekyl_monterad',namn:'Rekyl monterad',min:0,max:1,steg:0.02,enhet:'andel'},
 {flik:'Avtryckare',nyckel:'avtryckare.drag_px',namn:'Draglängd',min:12,max:70,steg:1,enhet:'px'},
 {flik:'Avtryckare',nyckel:'avtryckare.kram_s',namn:'Tid till stilla sikte',min:0.15,max:1.5,steg:0.05,enhet:'s'},
 {flik:'Avtryckare',nyckel:'avtryckare.hall_s',namn:'Håll inne utan drag',min:0.1,max:1.2,steg:0.05,enhet:'s'},
 {flik:'Avtryckare',nyckel:'avtryckare.snabbt_s',namn:'Snabbt tryck',min:0.05,max:0.6,steg:0.01,enhet:'s'},
 {flik:'Avtryckare',nyckel:'avtryckare.snabb_fart',namn:'Gräns för ryck',min:300,max:1600,steg:20,enhet:'px/s'},
 {flik:'Avtryckare',nyckel:'haptik.kram',namn:'Haptik när kramet börjar',min:0,max:1,steg:0.02,enhet:'×'},
 {flik:'Avtryckare',nyckel:'haptik.skott',namn:'Haptik vid skott',min:0,max:1.5,steg:0.02,enhet:'×'},
 {flik:'Sikten',nyckel:'kikare.variant',namn:'Kikarsikte',typ:'val',val:[{id:'zf39',namn:'ZF39, stolpe'},{id:'m73',namn:'M73, korshår'},{id:'tunt',namn:'Tunt kors'}]},
 {flik:'Sikten',nyckel:'kikare.zoom',namn:'Förstoring',min:2,max:8,steg:0.5,enhet:'×'},
 {flik:'Sikten',nyckel:'kikare.kanslighet',namn:'Känslighet i kikare',min:0.15,max:1,steg:0.05,enhet:'×'},
 {flik:'Ställning',nyckel:'stallning.satt',namn:'Ställningsstyrning',typ:'val',val:[{id:'gyro',namn:'Gyrogester, steg för steg'},{id:'knyck',namn:'Knyck framåt till marken'},{id:'knappar',namn:'Knappar'}]},
 {flik:'Ställning',nyckel:'stallning.grans_dps',namn:'Hastighetsgräns gest',min:80,max:500,steg:10,enhet:'°/s'},
 {flik:'Ställning',nyckel:'stallning.ner_dps',namn:'Knyck framåt till liggande',min:80,max:520,steg:10,enhet:'°/s'},
 {flik:'Ställning',nyckel:'stallning.upp_dps',namn:'Knyck uppåt ett steg',min:80,max:520,steg:10,enhet:'°/s'}
];

function las(obj,nyckel){return nyckel.split('.').reduce((o,k)=>o?.[k],obj);}
function skriv(obj,nyckel,varde){const d=nyckel.split('.');let o=obj;for(let i=0;i<d.length-1;i++)o=o[d[i]];o[d.at(-1)]=varde;}

export function skapaStyrning(){
 const varden=structuredClone(STANDARD);
 try{
  const sparad=JSON.parse(localStorage.getItem(NYCKEL)||'null');
  if(sparad&&typeof sparad==='object'){
   for(const f of FALT){
    const r=las(sparad,f.nyckel);
    if(f.typ==='val'){if(f.val.some(v=>v.id===r))skriv(varden,f.nyckel,r);}
    else if(f.typ==='bool'){if(typeof r==='boolean')skriv(varden,f.nyckel,r);}
    else if(Number.isFinite(Number(r)))skriv(varden,f.nyckel,Math.min(f.max,Math.max(f.min,Number(r))));
   }
  }
 }catch{}
 const lyssnare=new Set();
 function spara(){try{localStorage.setItem(NYCKEL,JSON.stringify(varden));}catch{}lyssnare.forEach(f=>f());}
 return {
  varden,
  hamta:nyckel=>las(varden,nyckel),
  satt(nyckel,varde){skriv(varden,nyckel,varde);spara();},
  aterstall(){const kopia=structuredClone(STANDARD);for(const k of Object.keys(varden))varden[k]=kopia[k];spara();},
  lyssna(f){lyssnare.add(f);}
 };
}

export function byggMeny(rot,styr){
 rot.replaceChildren();
 const ater=document.createElement('button');
 ater.type='button';ater.className='primary';ater.textContent='Återställ standard';
 const flikar=document.createElement('div');flikar.className='flikar';
 const yta=document.createElement('div');yta.className='flikyta';
 const namn=[...new Set(FALT.map(f=>f.flik))];
 let vald=namn[0];
 function rita(){
  yta.replaceChildren();
  for(const f of FALT){
   if(f.flik!==vald)continue;
   const lab=document.createElement('label');lab.className='reglage';
   const rub=document.createElement('span');rub.textContent=f.namn;
   if(f.typ==='val'){
    const sel=document.createElement('select');
    for(const v of f.val){const o=document.createElement('option');o.value=v.id;o.textContent=v.namn;sel.append(o);}
    sel.value=styr.hamta(f.nyckel);
    sel.onchange=()=>styr.satt(f.nyckel,sel.value);
    lab.append(rub,sel);
   }else if(f.typ==='bool'){
    const inp=document.createElement('input');inp.type='checkbox';inp.checked=!!styr.hamta(f.nyckel);
    inp.onchange=()=>styr.satt(f.nyckel,inp.checked);
    lab.append(inp,rub);
   }else{
    const ut=document.createElement('output');
    const inp=document.createElement('input');inp.type='range';inp.min=f.min;inp.max=f.max;inp.step=f.steg;inp.value=styr.hamta(f.nyckel);
    const visa=()=>{const n=Number(inp.value);ut.value=(f.steg<0.01?n.toFixed(4):n.toFixed(f.steg<1?2:0))+(f.enhet?' '+f.enhet:'');};
    visa();
    inp.oninput=()=>{styr.satt(f.nyckel,Number(inp.value));visa();};
    lab.append(rub,ut,inp);
   }
   yta.append(lab);
  }
 }
 for(const n of namn){
  const b=document.createElement('button');b.type='button';b.textContent=n;
  b.onclick=()=>{vald=n;for(const k of flikar.children)k.classList.toggle('vald',k===b);rita();};
  flikar.append(b);
 }
 flikar.firstChild.classList.add('vald');
 ater.onclick=()=>{styr.aterstall();rita();};
 rot.append(ater,flikar,yta);
 rita();
}
