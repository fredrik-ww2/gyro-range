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
  const w=800,h=400;canvas.width=w;canvas.height=h;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#10120e';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#3a3d36';ctx.lineWidth=8;ctx.strokeRect(4,4,w-8,h-8);
  ctx.fillStyle='#8a8d82';
  for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(18+i*10,18,2.2,0,Math.PI*2);ctx.arc(w-18-i*10,18,2.2,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#171910';ctx.fillRect(155,16,490,368);
  const r=62,sr=46,top=112,bot=284;
  const sex=[248,400,552];
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
