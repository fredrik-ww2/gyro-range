import {skapaDetektor, simulera, skapaKnyckStallning, nastaStallning} from '../js/stallning.js';

const fel = [];
function kontroll(namn, villkor, detalj){if(!villkor)fel.push(namn+(detalj?' '+JSON.stringify(detalj):''));}

function puls(tipp, vrid, hall=96){
 const ut=[{ms:32,tipp:0,vrid:0}];
 for(let i=0;i<Math.ceil(hall/16);i++)ut.push({ms:16,tipp,vrid});
 ut.push({ms:48,tipp:0,vrid:0},{ms:48,tipp:0,vrid:0});
 return ut;
}
function vila(ms, tipp=0, vrid=0){
 const ut=[];for(let t=0;t<ms;t+=16)ut.push({ms:16,tipp,vrid});return ut;
}

const ner=simulera(puls(480,25),'normal','staende');
kontroll('ner till hukande', ner.stall==='hukande'&&ner.log[0]?.typ==='ner', ner);

const dyk=simulera(puls(480,460),'normal','staende');
kontroll('dyk till liggande', dyk.stall==='liggande'&&dyk.log[0]?.typ==='dyk', dyk);

const uppFranLigg=simulera(puls(-480,15),'normal','liggande');
kontroll('upp till hukande', uppFranLigg.stall==='hukande'&&uppFranLigg.log[0]?.typ==='upp', uppFranLigg);

const uppFranHuk=simulera(puls(-470,0),'normal','hukande');
kontroll('upp till staende', uppFranHuk.stall==='staende'&&uppFranHuk.log[0]?.typ==='upp', uppFranHuk);

const langsam=simulera(vila(1000,35,20),'normal','staende');
kontroll('långsam siktning', langsam.stall==='staende'&&langsam.log.length===0, langsam);

const vanster=simulera(puls(480,-500),'normal','staende');
kontroll('vrid vänster är bara ett steg', vanster.stall==='hukande'&&vanster.log[0]?.typ==='ner', vanster);

const senare=[];
senare.push(...puls(500,0,48).slice(0,4));
for(let i=0;i<4;i++)senare.push({ms:16,tipp:500,vrid:500});
senare.push({ms:48,tipp:0,vrid:0});
const samtidig=simulera(senare,'normal','staende');
kontroll('vridning i samma fönster', samtidig.stall==='liggande'&&samtidig.log[0]?.typ==='dyk', samtidig);

const dubbel=simulera([...puls(480,0),...vila(180),...puls(480,0)],'normal','staende');
kontroll('spärr mellan gester', dubbel.stall==='hukande'&&dubbel.log.filter(x=>x.typ==='ner'||x.typ==='dyk').length===1, dubbel);

const av=simulera(puls(520,520),'av','staende');
kontroll('avstängd', av.stall==='staende'&&av.log.length===0, av);

const d=skapaDetektor();let t=0;
for(const p of puls(510,470)){t+=p.ms/1000;d.steg(t,p.tipp,p.vrid,'normal');}
const m=d.visning();
kontroll('mätare tipp och vrid', m.tipp>=470&&m.vrid>=450, m);

const kn=skapaKnyckStallning();
kontroll('knyck ner är dyk', kn.steg(1,300,250,220)==='dyk'&&nastaStallning('staende','dyk')==='liggande');
kontroll('knyck spärr', kn.steg(1.2,300,250,220)===null);
kontroll('knyck upp', kn.steg(2,-300,250,220)==='upp'&&nastaStallning('liggande','upp')==='hukande');
kontroll('knyck upp till stående', nastaStallning('hukande','upp')==='staende');
kontroll('knä upp till stående', nastaStallning('knastående','upp')==='staende');

if(fel.length){console.error(fel.join('\n'));process.exit(1);}
console.log('stallning-ok', JSON.stringify({ner:ner.stall,dyk:dyk.stall,upp1:uppFranLigg.stall,upp2:uppFranHuk.stall,langsam:langsam.stall,sparr:dubbel.stall,meter:m}));
