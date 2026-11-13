// En enda canvas för hela instrumentbrädan, ritad ungefär 10 gånger i sekunden.
// Mitten är RAF:s sexpacka. Motorinstrumenten sitter på sidorna.
export function hojdvisare(meter){
 const fot=Math.max(0,meter)/0.3048;
 return {meter,fot,lang:(fot%1000)/1000*360,kort:(fot%10000)/10000*360};
}
function visare(ctx,x,y,grader,len,bredd){
 ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2+grader*Math.PI/180);
 ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(0,-len);ctx.strokeStyle='#f4f1e6';ctx.lineWidth=bredd;ctx.lineCap='round';ctx.stroke();ctx.restore();
}
function tavla(ctx,x,y,r){
 ctx.beginPath();ctx.arc(x,y,r+8,0,Math.PI*2);ctx.fillStyle='#14110e';ctx.fill();
 ctx.lineWidth=5;ctx.strokeStyle='#c6a56e';ctx.stroke();
 ctx.beginPath();ctx.arc(x,y,r+1.5,0,Math.PI*2);ctx.strokeStyle='#0a0a0a';ctx.lineWidth=3.5;ctx.stroke();
 ctx.beginPath();ctx.arc(x,y,r-1,0,Math.PI*2);ctx.fillStyle='#070808';ctx.fill();
}
function etikett(ctx,x,y,r,namn,px){
 ctx.fillStyle='#d5d0c2';ctx.font=(px||16)+'px monospace';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(namn,x,y+r-12);
}
function tickar(ctx,x,y,r,n,lang){
 ctx.strokeStyle='#e6e1d4';ctx.lineWidth=1.2;
 for(let i=0;i<n;i++){const a=-Math.PI/2+i/n*Math.PI*2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*(r-lang),y+Math.sin(a)*(r-lang));ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.stroke();}
}
function nav(ctx,x,y,r){ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();}
export function skapaPanel(canvas){
 const ctx=canvas.getContext('2d');
 function ratt(x,y,r,namn,n,px){tavla(ctx,x,y,r);if(n)tickar(ctx,x,y,r-16,n,7);etikett(ctx,x,y,r,namn,px);}
 function horisont(x,y,r,s){
  tavla(ctx,x,y,r);
  ctx.save();ctx.beginPath();ctx.arc(x,y,r-2,0,Math.PI*2);ctx.clip();
  ctx.translate(x,y);ctx.rotate(-s.roll);ctx.translate(0,Math.max(-20,Math.min(20,s.pitch*46)));
  ctx.fillStyle='#3d6f98';ctx.fillRect(-80,-80,160,80);ctx.fillStyle='#6a5336';ctx.fillRect(-80,0,160,80);
  ctx.strokeStyle='#efe8d4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-80,0);ctx.lineTo(80,0);ctx.stroke();ctx.restore();
  ctx.strokeStyle='#e7c56a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-22,y);ctx.lineTo(x-8,y);ctx.lineTo(x,y+6);ctx.lineTo(x+8,y);ctx.lineTo(x+22,y);ctx.stroke();
  etikett(ctx,x,y,r,'HORISONT');
 }
 function kurs(x,y,r,rad){
  tavla(ctx,x,y,r);
  ctx.save();ctx.beginPath();ctx.arc(x,y,r-2,0,Math.PI*2);ctx.clip();
  ctx.translate(x,y);ctx.rotate(rad);ctx.fillStyle='#10140f';ctx.fillRect(-r,-r,r*2,r*2);
  ctx.fillStyle='#e6e1d4';ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  const mark=['N','Ö','S','V'];
  for(let i=0;i<4;i++){const a=-Math.PI/2+i*Math.PI/2;ctx.fillText(mark[i],Math.cos(a)*(r-18),Math.sin(a)*(r-18));}
  ctx.strokeStyle='#d7d0be';ctx.lineWidth=1.2;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r-8),Math.sin(a)*(r-8));ctx.lineTo(Math.cos(a)*(r-2),Math.sin(a)*(r-2));ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle='#e7c56a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-r+4);ctx.lineTo(x,y-r+14);ctx.stroke();
  etikett(ctx,x,y,r,'KURS');
 }
 function rita(s){
  const w=PANEL_W,h=PANEL_H;canvas.width=w;canvas.height=h;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#10120e';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#3a3d36';ctx.lineWidth=8;ctx.strokeRect(4,4,w-8,h-8);
  ctx.fillStyle='#8a8d82';
  for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(18+i*10,18,2.2,0,Math.PI*2);ctx.arc(w-18-i*10,18,2.2,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#171910';ctx.fillRect(155,16,490,368);
  const r=PANEL_HORISONT.r,sr=46,top=PANEL_HORISONT.y,bot=284;
  const sex=[248,PANEL_HORISONT.x,552];
  const mph=s.fart*2.23694,hojd=hojdvisare(s.hojd);
  ratt(sex[0],top,r,'FART',10);visare(ctx,sex[0],top,Math.max(0,Math.min(360,mph/500*360)),48,2.4);nav(ctx,sex[0],top);
  horisont(sex[1],top,r,s);nav(ctx,sex[1],top);
  const fpm=s.vs*196.85;
  ratt(sex[2],top,r,'STIGNING',8);visare(ctx,sex[2],top,Math.max(-150,Math.min(150,fpm/4000*150)),48,2.4);
  ctx.fillStyle='#f3ecda';ctx.font='16px monospace';ctx.textAlign='center';ctx.fillText((s.vs>=0?'+':'')+s.vs.toFixed(0),sex[2],top+8);nav(ctx,sex[2],top);
  ratt(sex[0],bot,r,'HÖJD',10);
  ctx.fillStyle='#e6e1d4';ctx.font='15px monospace';
  for(let i=0;i<10;i++){const a=-Math.PI/2+i/10*Math.PI*2;ctx.fillText(String(i),sex[0]+Math.cos(a)*40,bot+Math.sin(a)*40+4);}
  visare(ctx,sex[0],bot,hojd.kort,32,3.6);visare(ctx,sex[0],bot,hojd.lang,50,2);
  ctx.fillStyle='#070808';ctx.fillRect(sex[0]-28,bot+12,56,18);ctx.fillStyle='#f3ecda';ctx.font='14px monospace';ctx.fillText(Math.round(s.hojd)+' m',sex[0],bot+26);
  nav(ctx,sex[0],bot);
  const rad=s.kurs||0;
  kurs(sex[1],bot,r,rad);
  ratt(sex[2],bot,r,'SVÄNG',0);
  ctx.strokeStyle='#9aa194';ctx.lineWidth=5;ctx.beginPath();ctx.arc(sex[2],bot+20,24,Math.PI*1.15,Math.PI*1.85);ctx.stroke();
  const boll=Math.max(-18,Math.min(18,-s.roll*12));
  ctx.beginPath();ctx.arc(sex[2]+boll,bot+20,6,0,Math.PI*2);ctx.fillStyle='#f4f0e4';ctx.fill();
  visare(ctx,sex[2],bot,Math.max(-50,Math.min(50,s.gir*18)),42,2.6);nav(ctx,sex[2],bot);
  ratt(62,top,sr,'BOOST',8,13);visare(ctx,62,top,Math.max(-80,Math.min(80,s.boost/8*70)),34,2.2);
  ctx.fillStyle='#f3ecda';ctx.font='14px monospace';ctx.textAlign='center';ctx.fillText((s.boost>=0?'+':'')+s.boost.toFixed(0),62,top+5);nav(ctx,62,top);
  ratt(62,bot,sr,'OLJA',8,13);visare(ctx,62,bot,Math.max(0,Math.min(300,s.olja/100*260)),34,2.2);nav(ctx,62,bot);
  ratt(738,top,sr,'VARV',8,13);visare(ctx,738,top,Math.max(0,Math.min(330,(s.rpm-500)/3500*300)),34,2.4);
  ctx.fillStyle='#f3ecda';ctx.font='14px monospace';ctx.fillText(String(Math.round(s.rpm/100)),738,top+5);nav(ctx,738,top);
  ratt(738,bot,sr,'BRÄNSLE',4,12);visare(ctx,738,bot,(1-s.bransle)*270,34,2.4);nav(ctx,738,bot);
  if(s.stall){ctx.fillStyle='#ff5a3c';ctx.font='bold 14px monospace';ctx.fillText('STALL',w/2,h-10);}
  const grader=((rad*180/Math.PI)%360+360)%360;
  canvas.dataset.fart=s.fart.toFixed(2);canvas.dataset.hojd=s.hojd.toFixed(1);canvas.dataset.fot=hojd.fot.toFixed(1);
  canvas.dataset.lang=hojd.lang.toFixed(2);canvas.dataset.kort=hojd.kort.toFixed(2);
  canvas.dataset.vs=s.vs.toFixed(2);canvas.dataset.rpm=s.rpm.toFixed(0);canvas.dataset.boost=s.boost.toFixed(2);
  canvas.dataset.mph=mph.toFixed(1);canvas.dataset.bransle=s.bransle.toFixed(3);canvas.dataset.kurs=grader.toFixed(1);
  canvas.dataset.ordning='fart,horisont,stigning,hojd,kurs,svang';
 }
 return {rita,hojdvisare};
}

// Jaktvyns remsa längst ner. Mått och färger kommer från config.jaktpanel.
// Fart i km/h, höjd i meter, konstgjord horisont och en liten G-mätare när bredden räcker.
function rund(ctx,x,y,w,h,r){
 const rr=Math.max(0,Math.min(r,w/2,h/2));
 ctx.beginPath();
 ctx.moveTo(x+rr,y);
 ctx.arcTo(x+w,y,x+w,y+h,rr);
 ctx.arcTo(x+w,y+h,x,y+h,rr);
 ctx.arcTo(x,y+h,x,y,rr);
 ctx.arcTo(x,y,x+w,y,rr);
 ctx.closePath();
}
function jaktTavla(ctx,x,y,r,F){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=F.sarg;ctx.fill();
 ctx.beginPath();ctx.arc(x,y,r-Math.max(2.2,r*0.07),0,Math.PI*2);ctx.fillStyle=F.stal;ctx.fill();
 ctx.beginPath();ctx.arc(x,y,r-Math.max(4,r*0.13),0,Math.PI*2);ctx.fillStyle=F.tavla;ctx.fill();
 ctx.fillStyle=F.nit;
 const skruv=Math.max(0.7,r*0.035);
 for(let i=0;i<4;i++){
  const a=Math.PI/4+i*Math.PI/2;
  const rad=r-Math.max(1.4,r*0.045);
  ctx.beginPath();ctx.arc(x+Math.cos(a)*rad,y+Math.sin(a)*rad,skruv,0,Math.PI*2);ctx.fill();
 }
}
function jaktNav(ctx,x,y,r,F){
 ctx.beginPath();ctx.arc(x,y,Math.max(1.6,r*0.055),0,Math.PI*2);ctx.fillStyle=F.sarg;ctx.fill();
 ctx.beginPath();ctx.arc(x,y,Math.max(0.8,r*0.028),0,Math.PI*2);ctx.fillStyle=F.tavla;ctx.fill();
}
function jaktVisare(ctx,x,y,grader,len,bredd,farg){
 ctx.save();ctx.translate(x,y);ctx.rotate((-90+grader)*Math.PI/180);
 ctx.beginPath();ctx.moveTo(-bredd*0.45,len*0.16);ctx.lineTo(0,len*0.22);ctx.lineTo(bredd*0.45,len*0.16);ctx.lineTo(bredd*0.28,0);ctx.lineTo(0,-len);ctx.lineTo(-bredd*0.28,0);ctx.closePath();
 ctx.fillStyle=farg;ctx.fill();ctx.restore();
}
function jaktText(ctx,text,x,y,px,F,font,vikt){
 ctx.fillStyle=F.siffra;ctx.font=(vikt||'700')+' '+px+'px '+font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y);
}
export function jaktMatt(w,h,C){
 C=C||{};
 const pad=C.marginal_px||8, gap=C.gap_px||6;
 const gVisa=w>=(C.visa_g_om_bredd_px||360);
 const gSkala=gVisa?(C.g_skala||0.72):0;
 const gaps=(gVisa?3:2)*gap;
 const inner=Math.max(10,w-pad*2);
 const rMax=Math.max(8,(h-pad*2)/2-1);
 const r=Math.min(rMax,(inner-gaps)/(2*(3+gSkala)));
 const rG=gVisa?r*gSkala:0;
 const total=r*2*3+rG*2+gaps;
 const x0=pad+(inner-total)/2+r;
 const steg=r*2+gap;
 return {r,rG,y:h/2+1,gap,gVisa,fart:x0,horisont:x0+steg,hojd:x0+steg*2,g:gVisa?x0+steg*2+r+gap+rG:0};
}
export function jaktHorisont(w,h,C){
 const m=jaktMatt(w,h,C);
 return {x:m.horisont,y:m.y,r:m.r};
}
const PANEL_W=800,PANEL_H=400;
const PANEL_HORISONT={x:400,y:112,r:62,bez:74};
export function panelHorisont(cssW,cssH){
 const sx=(cssW||0)/PANEL_W, sy=(cssH||0)/PANEL_H;
 return {x:PANEL_HORISONT.x*sx,y:PANEL_HORISONT.y*sy,rx:PANEL_HORISONT.bez*sx,ry:PANEL_HORISONT.bez*sy};
}
function ritaJaktYta(ctx,w,h,s,C){
 const F=C.farger,font=C.font||'ui-monospace,monospace';
 ctx.clearRect(0,0,w,h);
 rund(ctx,0.5,0.5,w-1,h-1,C.hornh_px||8);
 ctx.fillStyle=F.platta;ctx.fill();
 ctx.lineWidth=2;ctx.strokeStyle=F.sarg;ctx.stroke();
 ctx.save();rund(ctx,3,3,w-6,h-6,Math.max(2,(C.hornh_px||8)-2));ctx.strokeStyle=F.stal;ctx.lineWidth=1;ctx.stroke();ctx.restore();
 ctx.fillStyle=F.nit;
 const nitar=C.nitar||7, nit=C.nit_px||1.5;
 for(let i=0;i<nitar;i++){
  const px=(w-16)*((i+0.5)/nitar)+8;
  ctx.beginPath();ctx.arc(px,5.5,nit,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(px,h-5.5,nit,0,Math.PI*2);ctx.fill();
 }
 const m=jaktMatt(w,h,C);
 const r=m.r,y=m.y,gVisa=m.gVisa;
 const ansikte=r-Math.max(4,r*0.13);
 ritaFart(ctx,m.fart,y,r,ansikte,s,C,font);
 ritaHorisont(ctx,m.horisont,y,r,ansikte,s,C,font);
 ritaHojd(ctx,m.hojd,y,r,ansikte,s,C,font);
 let gRitar=false;
 if(gVisa){ritaG(ctx,m.g,y,m.rG,s,C,font);gRitar=true;}
 if(s.stall){
  ctx.fillStyle=F.varning;ctx.font='800 '+Math.max(9,Math.min(13,r*0.28))+'px '+font;ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillText(C.stall_text||'STALL',8,7);
 }
 return {radie:r,g:gRitar,kmh:s.fart*3.6,meter:s.hojd};
}
function ritaFart(ctx,x,y,r,a,s,C,font){
 const F=C.farger,max=C.fart_max_kmh||800,boge=C.fart_bage_grader||300;
 const kmh=Math.max(0,s.fart*3.6);
 jaktTavla(ctx,x,y,r,F);
 const start=-boge/2;
 ctx.strokeStyle=F.siffra;ctx.fillStyle=F.siffra;ctx.lineWidth=Math.max(1,r*0.028);
 const steg=r>34?(C.fart_steg_kmh||100):(C.fart_steg_kmh||100)*2;
 const px=Math.max(8,Math.min(13,r*0.27));
 ctx.font='700 '+px+'px '+font;ctx.textAlign='center';ctx.textBaseline='middle';
 for(let v=0;v<=max;v+=steg){
  const t=v/max, ang=(-90+start+t*boge)*Math.PI/180;
  const lang=v%(steg*2)===0?a*0.16:a*0.09;
  ctx.beginPath();ctx.moveTo(x+Math.cos(ang)*(a-lang),y+Math.sin(ang)*(a-lang));ctx.lineTo(x+Math.cos(ang)*a,y+Math.sin(ang)*a);ctx.stroke();
  if(r>30&&v%steg===0&&v<max)ctx.fillText(String(v/100),x+Math.cos(ang)*(a*0.68),y+Math.sin(ang)*(a*0.68));
 }
 const rod=C.fart_rod_kmh;
 if(rod>0&&rod<max){
  ctx.strokeStyle=F.varning;ctx.lineWidth=Math.max(1.5,r*0.045);
  const a0=(-90+start+(rod/max)*boge)*Math.PI/180, a1=(-90+start+boge)*Math.PI/180;
  ctx.beginPath();ctx.arc(x,y,a*0.86,a0,a1);ctx.stroke();
 }
 jaktVisare(ctx,x,y,start+Math.min(1,kmh/max)*boge,a*0.78,Math.max(1.4,r*0.045),F.visare);
 jaktNav(ctx,x,y,r,F);
 jaktText(ctx,String(Math.round(kmh)),x,y+a*0.28,Math.max(9,r*0.3),F,font,'800');
 jaktText(ctx,'km/h',x,y+a*0.52,Math.max(7,r*0.18),F,font,'700');
}
function ritaHorisont(ctx,x,y,r,a,s,C,font){
 const F=C.farger;
 jaktTavla(ctx,x,y,r,F);
 ctx.save();
 ctx.beginPath();ctx.arc(x,y,a,0,Math.PI*2);ctx.clip();
 ctx.translate(x,y);ctx.rotate(-(s.roll||0));
 const py=Math.max(-a*0.9,Math.min(a*0.9,(s.pitch||0)*(C.pitch_px_per_rad||46)));
 ctx.translate(0,py);
 ctx.fillStyle=F.himmel;ctx.fillRect(-r*2,-r*3,r*4,r*3);
 ctx.fillStyle=F.mark;ctx.fillRect(-r*2,0,r*4,r*3);
 ctx.strokeStyle=F.siffra;ctx.lineWidth=Math.max(1.4,r*0.035);
 ctx.beginPath();ctx.moveTo(-r*2,0);ctx.lineTo(r*2,0);ctx.stroke();
 ctx.lineWidth=1;
 for(const g of [-20,-10,10,20]){
  const yy=-g*Math.PI/180*(C.pitch_px_per_rad||46);
  const w=Math.abs(g)===20?a*0.55:a*0.8;
  ctx.beginPath();ctx.moveTo(-w/2,yy);ctx.lineTo(w/2,yy);ctx.stroke();
 }
 ctx.restore();
 ctx.strokeStyle=F.symbol||F.visareKort;ctx.lineWidth=Math.max(1.6,r*0.045);ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(x-a*0.55,y);ctx.lineTo(x-a*0.18,y);ctx.lineTo(x,y+a*0.12);ctx.lineTo(x+a*0.18,y);ctx.lineTo(x+a*0.55,y);ctx.stroke();
 ctx.fillStyle=F.symbol||F.visareKort;ctx.beginPath();ctx.arc(x,y,Math.max(1.2,r*0.035),0,Math.PI*2);ctx.fill();
 jaktText(ctx,'HOR',x,y+a*0.62,Math.max(7,r*0.16),F,font,'700');
}
function ritaHojd(ctx,x,y,r,a,s,C,font){
 const F=C.farger, meter=Math.max(0,s.hojd||0);
 const varv=C.hojd_varv_m||1000, kort=C.hojd_varv_kort_m||10000;
 jaktTavla(ctx,x,y,r,F);
 ctx.fillStyle=F.siffra;ctx.strokeStyle=F.siffra;ctx.lineWidth=Math.max(1,r*0.025);
 const px=Math.max(8,Math.min(14,r*0.3));
 ctx.font='700 '+px+'px '+font;ctx.textAlign='center';ctx.textBaseline='middle';
 for(let i=0;i<10;i++){
  const ang=(-90+i/10*360)*Math.PI/180;
  ctx.beginPath();ctx.moveTo(x+Math.cos(ang)*(a*0.82),y+Math.sin(ang)*(a*0.82));ctx.lineTo(x+Math.cos(ang)*a,y+Math.sin(ang)*a);ctx.stroke();
  ctx.fillText(String(i),x+Math.cos(ang)*(a*0.62),y+Math.sin(ang)*(a*0.62));
 }
 const lang=(meter%varv)/varv*360, kortV=(meter%kort)/kort*360;
 jaktVisare(ctx,x,y,kortV,a*0.48,Math.max(2.2,r*0.07),F.visareKort||F.visare);
 jaktVisare(ctx,x,y,lang,a*0.78,Math.max(1.2,r*0.035),F.visare);
 jaktNav(ctx,x,y,r,F);
 ctx.fillStyle=F.tavla;const bw=Math.min(a*1.15,r*0.95), bh=Math.max(11,r*0.32);
 ctx.fillRect(x-bw/2,y+a*0.22,bw,bh);
 ctx.strokeStyle=F.sarg;ctx.lineWidth=1;ctx.strokeRect(x-bw/2,y+a*0.22,bw,bh);
 jaktText(ctx,String(Math.round(meter)),x,y+a*0.22+bh/2,Math.max(8,r*0.24),F,font,'800');
}
function ritaG(ctx,x,y,r,s,C,font){
 const F=C.farger, a=r-Math.max(3,r*0.14);
 const min=C.g_min??-2, max=C.g_max??8, g=Number.isFinite(s.nz)?s.nz:1;
 const boge=C.g_bage_grader||240, start=-boge/2;
 jaktTavla(ctx,x,y,r,F);
 const rodFran=C.g_rod_fran??6;
 if(rodFran<max){
  const a0=(-90+start+((rodFran-min)/(max-min))*boge)*Math.PI/180;
  const a1=(-90+start+boge)*Math.PI/180;
  ctx.strokeStyle=F.varning;ctx.lineWidth=Math.max(1.4,r*0.07);
  ctx.beginPath();ctx.arc(x,y,a*0.78,a0,a1);ctx.stroke();
 }
 ctx.strokeStyle=F.siffra;ctx.fillStyle=F.siffra;ctx.lineWidth=1;
 const mark=C.g_markeringar||[-2,0,1,4,8];
 ctx.font='700 '+Math.max(7,r*0.28)+'px '+font;ctx.textAlign='center';ctx.textBaseline='middle';
 for(const v of mark){
  if(v<min||v>max)continue;
  const ang=(-90+start+((v-min)/(max-min))*boge)*Math.PI/180;
  ctx.beginPath();ctx.moveTo(x+Math.cos(ang)*(a*0.82),y+Math.sin(ang)*(a*0.82));ctx.lineTo(x+Math.cos(ang)*a,y+Math.sin(ang)*a);ctx.stroke();
 }
 const t=Math.max(0,Math.min(1,(g-min)/(max-min)));
 jaktVisare(ctx,x,y,start+t*boge,a*0.72,Math.max(1.2,r*0.06),F.visare);
 jaktNav(ctx,x,y,r,F);
 jaktText(ctx,g.toFixed(1),x,y+a*0.18,Math.max(8,r*0.34),F,font,'800');
 jaktText(ctx,'G',x,y+a*0.5,Math.max(7,r*0.24),F,font,'700');
}
export function skapaJaktPanel(canvas,cfg){
 const ctx=canvas.getContext('2d');
 const C=cfg;
 function rita(s){
  const cssW=canvas.clientWidth||parseFloat(canvas.style.width)||0;
  const cssH=canvas.clientHeight||parseFloat(canvas.style.height)||0;
  if(cssW<8||cssH<8)return null;
  const dpr=Math.min(C.pixel_tak||2,globalThis.devicePixelRatio||1);
  const W=Math.max(2,Math.round(cssW*dpr)), H=Math.max(2,Math.round(cssH*dpr));
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const ut=ritaJaktYta(ctx,cssW,cssH,s,C);
  canvas.dataset.fart=ut.kmh.toFixed(0);
  canvas.dataset.hojd=ut.meter.toFixed(0);
  canvas.dataset.g=(Number.isFinite(s.nz)?s.nz:1).toFixed(2);
  canvas.dataset.enhet='km/h,m';
  canvas.dataset.gSynlig=ut.g?'1':'0';
  return ut;
 }
 return {rita};
}
