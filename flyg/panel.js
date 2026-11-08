// En enda canvas för hela instrumentbrädan, ritad ungefär 10 gånger i sekunden.
export function hojdvisare(meter){
 const fot=Math.max(0,meter)/0.3048;
 return {meter,fot,lang:(fot%1000)/1000*360,kort:(fot%10000)/10000*360};
}
function visare(ctx,x,y,grader,len,bredd){
 ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2+grader*Math.PI/180);
 ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(0,-len);ctx.strokeStyle='#f4f1e6';ctx.lineWidth=bredd;ctx.lineCap='round';ctx.stroke();ctx.restore();
}
function tavla(ctx,x,y,r,namn){
 ctx.beginPath();ctx.arc(x,y,r+5,0,Math.PI*2);ctx.fillStyle='#1a1c18';ctx.fill();
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='#070808';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#d9d4c6';ctx.stroke();
 ctx.fillStyle='#b7b2a4';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(namn,x,y+r-8);
}
function tickar(ctx,x,y,r,n,lang){
 ctx.strokeStyle='#e6e1d4';ctx.lineWidth=1.2;
 for(let i=0;i<n;i++){const a=-Math.PI/2+i/n*Math.PI*2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*(r-lang),y+Math.sin(a)*(r-lang));ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.stroke();}
}
export function skapaPanel(canvas){
 const ctx=canvas.getContext('2d');
 function ratt(x,y,r,namn,n){tavla(ctx,x,y,r,namn);tickar(ctx,x,y,r-16,n||8,7);}
 function rita(s){
  canvas.width=780;canvas.height=360;const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#0c0d0b';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#3a3d36';ctx.lineWidth=8;ctx.strokeRect(4,4,w-8,h-8);
  ctx.fillStyle='#8a8d82';
  for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(22+i*8,16,2,0,Math.PI*2);ctx.arc(w-22-i*8,16,2,0,Math.PI*2);ctx.fill();}
  const r=50,xs=[130,390,650],ys=[62,168,274];
  const mph=s.fart*2.23694,hojd=hojdvisare(s.hojd);
  ratt(xs[0],ys[0],r,'MPH',10);visare(ctx,xs[0],ys[0],Math.max(0,Math.min(360,mph/500*360)),40,2);
  // konstgjord horisont
  tavla(ctx,xs[1],ys[0],r,'HORISONT');
  ctx.save();ctx.beginPath();ctx.arc(xs[1],ys[0],r-2,0,Math.PI*2);ctx.clip();
  ctx.translate(xs[1],ys[0]);ctx.rotate(-s.roll);ctx.translate(0,Math.max(-20,Math.min(20,s.pitch*46)));
  ctx.fillStyle='#3d6f98';ctx.fillRect(-80,-80,160,80);ctx.fillStyle='#6a5336';ctx.fillRect(-80,0,160,80);
  ctx.strokeStyle='#efe8d4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-80,0);ctx.lineTo(80,0);ctx.stroke();ctx.restore();
  ctx.strokeStyle='#e7c56a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xs[1]-22,ys[0]);ctx.lineTo(xs[1]-8,ys[0]);ctx.lineTo(xs[1],ys[0]+6);ctx.lineTo(xs[1]+8,ys[0]);ctx.lineTo(xs[1]+22,ys[0]);ctx.stroke();
  // höjdmätare, lång visare = hundratal fot, kort = tusental
  ratt(xs[2],ys[0],r,'ALT',10);
  ctx.fillStyle='#cfc8b4';ctx.font='10px monospace';
  for(let i=0;i<10;i++){const a=-Math.PI/2+i/10*Math.PI*2;ctx.fillText(String(i),xs[2]+Math.cos(a)*34,ys[0]+Math.sin(a)*34+3);}
  visare(ctx,xs[2],ys[0],hojd.kort,26,3.2);visare(ctx,xs[2],ys[0],hojd.lang,44,1.7);
  ctx.fillStyle='#070808';ctx.fillRect(xs[2]-22,ys[0]+10,44,14);ctx.fillStyle='#f3ecda';ctx.font='10px monospace';ctx.fillText(Math.round(s.hojd)+' m',xs[2],ys[0]+21);
  // gir och sidlutning
  ratt(xs[0],ys[1],r,'TURN',0);
  ctx.strokeStyle='#9aa194';ctx.lineWidth=4;ctx.beginPath();ctx.arc(xs[0],ys[1]+18,22,Math.PI*1.15,Math.PI*1.85);ctx.stroke();
  const boll=Math.max(-16,Math.min(16,-s.roll*10));
  ctx.beginPath();ctx.arc(xs[0]+boll,ys[1]+18,5,0,Math.PI*2);ctx.fillStyle='#f4f0e4';ctx.fill();
  visare(ctx,xs[0],ys[1],Math.max(-50,Math.min(50,s.gir*18)),36,2.4);
  // stigning
  const fpm=s.vs*196.85;
  ratt(xs[1],ys[1],r,'CLIMB',8);visare(ctx,xs[1],ys[1],Math.max(-150,Math.min(150,fpm/4000*150)),40,2);
  ctx.fillStyle='#cfc8b4';ctx.font='10px monospace';ctx.fillText((s.vs>=0?'+':'')+s.vs.toFixed(0),xs[1],ys[1]+6);
  // motor
  ratt(xs[2],ys[1],r,'RPM',8);visare(ctx,xs[2],ys[1],Math.max(0,Math.min(330,(s.rpm-500)/3500*300)),40,2.4);
  ctx.fillStyle='#cfc8b4';ctx.font='10px monospace';ctx.fillText(String(Math.round(s.rpm/100)),xs[2],ys[1]+4);
  ratt(xs[0],ys[2],r,'BOOST',8);visare(ctx,xs[0],ys[2],Math.max(-80,Math.min(80,s.boost/8*70)),38,2.2);
  ctx.fillStyle='#cfc8b4';ctx.font='10px monospace';ctx.fillText((s.boost>=0?'+':'')+s.boost.toFixed(0),xs[0],ys[2]+4);
  ratt(xs[1],ys[2],r,'OIL',8);visare(ctx,xs[1],ys[2],Math.max(0,Math.min(300,s.olja/100*260)),38,2.2);
  ratt(xs[2],ys[2],r,'FUEL',4);visare(ctx,xs[2],ys[2],(1-s.bransle)*270,38,2.4);
  ctx.beginPath();ctx.arc(xs[2],ys[0],3,0,Math.PI*2);ctx.arc(xs[0],ys[0],3,0,Math.PI*2);ctx.arc(xs[2],ys[1],3,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
  if(s.stall){ctx.fillStyle='#ff5a3c';ctx.font='bold 16px monospace';ctx.fillText('STALL',w/2,h-14);}
  canvas.dataset.fart=s.fart.toFixed(2);canvas.dataset.hojd=s.hojd.toFixed(1);canvas.dataset.fot=hojd.fot.toFixed(1);
  canvas.dataset.lang=hojd.lang.toFixed(2);canvas.dataset.kort=hojd.kort.toFixed(2);
  canvas.dataset.vs=s.vs.toFixed(2);canvas.dataset.rpm=s.rpm.toFixed(0);canvas.dataset.boost=s.boost.toFixed(2);
  canvas.dataset.mph=mph.toFixed(1);canvas.dataset.bransle=s.bransle.toFixed(3);
 }
 return {rita,hojdvisare};
}
