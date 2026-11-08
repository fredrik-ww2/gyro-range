// Tre ställningar. Gesterna klassas på toppfart i ett kort fönster, inte på hur långt siktet hinner röra sig.
export const KANS={
 av:null,
 lag:{tipp:360,vrid:360},
 normal:{tipp:250,vrid:250},
 hog:{tipp:160,vrid:160}
};
export const STALLNING_NAMN={staende:'Stående',hukande:'Hukande',liggande:'Liggande'};
const ORDNING=['liggande','hukande','staende'];

export function nastaStallning(nu,gest){
 const i=ORDNING.indexOf(nu);
 if(gest==='dyk')return 'liggande';
 if(gest==='ner')return ORDNING[Math.max(0,i-1)];
 if(gest==='upp')return ORDNING[Math.min(ORDNING.length-1,i+1)];
 return nu;
}

export function skapaDetektor(){
 const historik=[];
 let lage='vila',start=0,toppNed=0,toppUpp=0,toppVrid=0,sparrTill=0,kravLangsam=false,visad={tipp:0,vrid:0,tills:0};
 function meter(t){
  const grans=t-.2;while(historik.length&&historik[0].t<grans)historik.shift();
  let ned=0,upp=0,vrid=0;
  for(const p of historik){if(p.tipp>ned)ned=p.tipp;if(-p.tipp>upp)upp=-p.tipp;if(p.vrid>vrid)vrid=p.vrid;}
  const tipp=ned>=upp?ned:-upp;
  const starkare=Math.abs(tipp)>Math.abs(visad.tipp)+.5||vrid>visad.vrid+.5;
  if(starkare)visad={tipp:Math.round(tipp),vrid:Math.round(vrid),tills:t+1.2};
  else if(t>visad.tills)visad=Math.abs(tipp)>12||vrid>12?{tipp:Math.round(tipp),vrid:Math.round(vrid),tills:t+1.2}:{tipp:0,vrid:0,tills:0};
 }
 return {
  visning(){return {tipp:visad.tipp,vrid:visad.vrid};},
  avbryt(){lage='vila';kravLangsam=false;sparrTill=0;},
  steg(t,tipp,vrid,kanslighet){
   historik.push({t,tipp,vrid});meter(t);
   const tr=typeof kanslighet==='number'?{tipp:kanslighet,vrid:kanslighet*.9}:(KANS[kanslighet]||null);
   if(!tr){if(lage==='ser'){lage='vila';return {typ:'slapp'};}return null;}
   if(t<sparrTill)return null;
   if(kravLangsam){if(Math.abs(tipp)<80&&vrid<80)kravLangsam=false;else return null;}
   let ny=false;
   if(lage==='vila'){
    if(Math.abs(tipp)<tr.tipp)return null;
    lage='ser';start=t;toppNed=0;toppUpp=0;toppVrid=0;ny=true;
    for(const p of historik){if(p.t<t-.18)continue;if(p.tipp>toppNed)toppNed=p.tipp;if(-p.tipp>toppUpp)toppUpp=-p.tipp;if(p.vrid>toppVrid)toppVrid=p.vrid;}
   }else{if(tipp>toppNed)toppNed=tipp;if(-tipp>toppUpp)toppUpp=-tipp;if(vrid>toppVrid)toppVrid=vrid;}
   const alder=t-start,stopp=alder>=.09&&Math.abs(tipp)<70&&(toppNed>=tr.tipp||toppUpp>=tr.tipp);
   if(ny)return {typ:'hall'};
   if(alder<.18&&!stopp)return null;
   lage='vila';kravLangsam=true;
   const ned=toppNed>=tr.tipp&&toppNed>=toppUpp,upp=toppUpp>=tr.tipp&&toppUpp>toppNed;
   const topp={tipp:Math.round(ned?toppNed:upp?-toppUpp:toppNed>=toppUpp?toppNed:-toppUpp),vrid:Math.round(toppVrid)};
   if(ned&&toppVrid>=tr.vrid){sparrTill=t+.7;return {typ:'dyk',...topp};}
   if(ned){sparrTill=t+.7;return {typ:'ner',...topp};}
   if(upp){sparrTill=t+.7;return {typ:'upp',...topp};}
   return {typ:'slapp',...topp};
  }
 };
}

// Simulerad serie: {ms, tipp, vrid}. tipp > 0 är framåt/nedåt, vrid > 0 är höger.
export function simulera(prover,kanslighet='normal',start='staende'){
 const d=skapaDetektor();let t=0,stall=start;const log=[];
 for(const p of prover){
  t+=p.ms/1000;
  const kod=d.steg(t,p.tipp,p.vrid,kanslighet);
  if(!kod||kod.typ==='hall')continue;
  if(kod.typ==='slapp'){log.push({t,typ:'slapp'});continue;}
  const till=nastaStallning(stall,kod.typ);
  log.push({t,typ:kod.typ,fran:stall,till,tipp:kod.tipp,vrid:kod.vrid});
  stall=till;
 }
 return {stall,log};
}
