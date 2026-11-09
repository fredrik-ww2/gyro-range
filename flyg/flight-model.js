// Flygprov 03: punktmassemodell med fart, anfallsvinkel, lyft, motstånd, dragkraft och tyngd.
// Ekvationer och källor: /workspace/gyro_proto/_work/flyg03/FLYG_V3_FYSIK.md. Alla tal i config.json "aero".
const D2R=Math.PI/180;
export function luftdensitet(h){return 1.225*Math.pow(Math.max(0.05,1-2.25577e-5*Math.max(0,h)),4.2559);}
export function lyftkoefficient(a,A){const a0=A.alfa_noll_grad*D2R,ak=A.alfa_kritisk_grad*D2R,cl=A.cl_alfa_per_rad*(a-a0);
 if(a<=ak)return Math.max(-0.6,cl);const max=A.cl_alfa_per_rad*(ak-a0),over=a-ak;return Math.max(max*A.stall_cl_andel,max*(1-over*4));}
export class FlightModel{
 constructor(A){this.A=A;this.reset(0,A.start_hojd_m,0,A.start_fart_ms);}
 reset(x,y,z,V){this.x=x;this.y=y;this.z=z;this.V=V;this.gamma=0;this.psi=0;this.phi=0;this.phiV=0;this.alpha=this.trimAlpha();this.stalled=false;this.dropp=0;this.crashed=false;this.nz=1;this.vs=0;this.thrust=0;this.drag=0;}
 q(){return .5*luftdensitet(this.y)*this.V*this.V;}
 trimAlpha(){const A=this.A,n=Math.max(A.trim_n_min,Math.min(A.trim_n_max,Math.cos(this.gamma)-A.niva_k*this.gamma)),need=n*A.massa_kg*9.80665/Math.max(1,this.q()*A.vingyta_m2);return Math.min(A.trim_max_grad*D2R,A.alfa_noll_grad*D2R+need/A.cl_alfa_per_rad);}
 powerFactor(){const A=this.A;return this.y<=A.fullhojd_m?1:Math.exp(-(this.y-A.fullhojd_m)/A.effekt_skalhojd_m);}
 // input.pitch >0 = dra (stig), input.roll >0 = vänsterbank. Samma tecken som flygprov 02.
 step(dt,input,gas,rnd=Math.random,sys){const A=this.A,g=9.80665,m=A.massa_kg;if(this.crashed)return;
  const S=sys||{},motorPa=S.motorPa!==false,gear=S.gear==null?0:Math.max(0,Math.min(1,S.gear)),flaps=S.flaps==null?0:Math.max(0,Math.min(1,S.flaps)),roder=S.roder||0;
  const cmd=this.trimAlpha()+Math.max(-A.tryck_max_grad*D2R,Math.min(A.drag_max_grad*D2R,input.pitch*A.alfa_per_rad_input));
  this.alpha+=(cmd-this.alpha)*(1-Math.exp(-dt/A.alfa_tau_s));
  this.stalled=this.alpha>A.alfa_kritisk_grad*D2R;
  if(this.stalled&&Math.abs(this.dropp)<1e-3)this.dropp=(rnd()<.5?-1:1)*A.stall_vingfall_rad;
  if(!this.stalled)this.dropp*=Math.exp(-dt/0.8);
  const target=input.roll+this.dropp,w=A.roll_omega,x0=this.phi-target,j=this.phiV+w*x0,e=Math.exp(-w*dt);this.phi=target+(x0+j*dt)*e;this.phiV=(this.phiV-w*j*dt)*e;
  const q=this.q();
  let CL=lyftkoefficient(this.alpha,A)+flaps*0.48;
  let CD=A.cd0+A.k_inducerat*CL*CL+(this.stalled?A.stall_cd_extra:0)+gear*0.03+flaps*0.055;
  let T=0;
  if(motorPa&&gas>0.001){
   if(S.pitch==null)T=Math.min(A.statisk_dragkraft_n,A.motoreffekt_w*A.propellerverkningsgrad*gas*this.powerFactor()/Math.max(20,this.V));
   else{const p=Math.max(0,Math.min(1,S.pitch)),ideal=32+p*145,form=Math.exp(-(((this.V-ideal)/95)**2));
    const eta=A.propellerverkningsgrad*(0.58+0.55*form)*(0.78+0.28*(1-p));
    T=Math.min(A.statisk_dragkraft_n*(0.58+0.55*(1-p)),A.motoreffekt_w*eta*gas*this.powerFactor()/Math.max(16,this.V));}
  }
  this.lyftAv=false;
  if(S.paMarken){
   this.gamma=0;this.phi*=Math.exp(-dt*2);this.stalled=false;this.vs=0;this.nz=1;
   // Rullmotstånd, pedalbroms vid roder, och hjulbroms när gasen är stängd (S.broms i newton).
   const broms=(S.broms||0)*(gas<0.03&&this.V>0.2?1:0);
   const rull=1400+Math.abs(roder)*5200+broms,aero=q*A.vingyta_m2*(A.cd0+0.02+gear*0.02);
   this.V=Math.max(0,this.V+((T-aero-rull)/m)*dt);
   if(this.V>0.5)this.psi+=roder*dt*(0.45+4/Math.max(5,this.V));
   this.x+=-Math.sin(this.psi)*this.V*dt;this.z+=-Math.cos(this.psi)*this.V*dt;
   if(S.markY!=null)this.y=S.markY+(S.hjulM??1.35);
   const L=q*A.vingyta_m2*Math.max(0.35,CL);
   this.lyftAv=L>m*g*0.9&&this.V>36&&(input.pitch>0.04||gas>0.72);
   this.thrust=T;this.drag=aero+rull;this.CL=CL;return;
  }
  const L=q*A.vingyta_m2*CL,Dr=q*A.vingyta_m2*CD;
  const V=Math.max(A.min_fart_ms,this.V),cg=Math.max(.05,Math.cos(this.gamma));
  this.V+=((T-Dr)/m-g*Math.sin(this.gamma))*dt;this.V=Math.max(A.min_fart_ms,this.V);
  this.gamma+=(L*Math.cos(this.phi)-m*g*Math.cos(this.gamma))/(m*V)*dt;if(this.stalled)this.gamma-=A.stall_nos_rad_s*Math.max(.2,Math.cos(this.phi))*dt;this.gamma=Math.max(-A.max_banvinkel_rad,Math.min(A.max_banvinkel_rad,this.gamma));
  this.psi+=L*Math.sin(this.phi)/(m*V*cg)*dt+roder*0.22*dt*Math.min(1,this.V/50);
  const ch=Math.cos(this.gamma);this.x+=-Math.sin(this.psi)*ch*this.V*dt;this.z+=-Math.cos(this.psi)*ch*this.V*dt;this.vs=Math.sin(this.gamma)*this.V;this.y+=this.vs*dt;
  this.nz=L/(m*g);this.thrust=T;this.drag=Dr;this.CL=CL;}
 // Trim (spelhjälp, går att stänga av med niva_k=0): mobilen i neutralläge ger rak bana med vingarna plana.
 // Lyftet räknas inte upp för bank, så en sväng utan att dra tappar höjd, som i verkligheten. Trimvinkeln är begränsad, så låg fart sänker nosen.
 // Kroppens attityd: nosen pekar banvinkel + anfallsvinkel.
 attitude(){return{pitch:this.gamma+this.alpha,yaw:this.psi,roll:this.phi};}
}
