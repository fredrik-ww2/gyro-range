import test from 'node:test';import assert from 'node:assert/strict';
import {ControlModule} from '../controls/ControlModule.js';
import {FlightDynamics, DEFAULT_FLIGHT} from '../controls/FlightDynamics.js';
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} ≈ ${b}`);
const controls=(x=0,y=0,collective=.6,yaw=0)=>({getCyclic:()=>({x,y}),getCollective:()=>collective,getYaw:()=>yaw});
const simulate=(p,c,seconds)=>{for(let i=0;i<seconds*120;i++)p.update(1/120,c,-1000);return p;};
test('deadzone includes ±5°, full-scale ±30°, axes and clamps',()=>{const m=new ControlModule({smoothingSeconds:0});for(const d of[-5,0,5]){m.setOrientation({pitch:d,roll:d});m.update(.01);near(m.getCyclic().x,0);near(m.getCyclic().y,0);}m.setOrientation({pitch:30,roll:-30});m.update(.01);near(m.getCyclic().x,-1);near(m.getCyclic().y,1);m.setOrientation({pitch:-90,roll:90});m.update(.01);near(m.getCyclic().x,1);near(m.getCyclic().y,-1);});
test('calibration captures pitch, roll and wrapped yaw',()=>{const m=new ControlModule({smoothingSeconds:0,yawMode:'orientation'});m.setOrientation({pitch:14,roll:9,yaw:179});m.calibrate();m.update(.01);near(m.getCyclic().y,0);near(m.getYaw(),0);m.setOrientation({pitch:44,roll:-21,yaw:-179});m.update(.01);near(m.getCyclic().y,1);near(m.getCyclic().x,-1);near(m.getYaw(),0);});
test('exponential filter independent of frame rate',()=>{function sample(hz){const m=new ControlModule();for(let i=0;i<hz;i++){m.setOrientation({pitch:30,roll:0});m.update(1/hz);}return m.getCyclic().y;}near(sample(30),sample(120));assert.ok(sample(30)<1&&sample(30)>.99);});
test('collective absolute, retained on release, bounded',()=>{const m=new ControlModule();m.setCollective(.82);m.releaseMomentaryInputs();m.update(5);near(m.getCollective(),.82);m.setCollective(2);near(m.getCollective(),1);m.setCollective(-2);near(m.getCollective(),0);});
test('toggle tilt off enables direct cyclic; pedals/orientation selectable',()=>{const m=new ControlModule({smoothingSeconds:0,tiltEnabled:false});m.setCyclic({x:.3,y:-.8});m.setOrientation({pitch:30,roll:30,yaw:35});m.setYaw(-.5);m.update(.01);near(m.getCyclic().x,.3);near(m.getCyclic().y,-.8);near(m.getYaw(),-.5);m.configure({tiltEnabled:true,yawMode:'orientation'});m.update(.01);near(m.getCyclic().y,1);near(m.getYaw(),1);});
test('lost orientation feed neutralizes cyclic/yaw but preserves collective',()=>{const m=new ControlModule({smoothingSeconds:0,yawMode:'orientation'});m.setOrientation({pitch:30,roll:30,yaw:35});m.setCollective(.7);m.update(.1);near(m.getCyclic().x,1);m.update(.6);near(m.getCyclic().x,0);near(m.getYaw(),0);near(m.getCollective(),.7);});
test('settings alter response; reject nonfinite and invalid config atomically',()=>{const m=new ControlModule({smoothingSeconds:0});m.setOrientation({pitch:17.5,roll:0});m.update(.01);near(m.getCyclic().y,.5);m.configure({sensitivity:2});m.update(.01);near(m.getCyclic().y,1);m.configure({deadzoneDeg:10,sensitivity:1});m.setOrientation({pitch:10,roll:0});m.update(.01);near(m.getCyclic().y,0);assert.throws(()=>m.configure({deadzoneDeg:31}));assert.throws(()=>m.setCollective(NaN));assert.throws(()=>m.setOrientation({pitch:0,roll:Infinity}));assert.throws(()=>m.update(-1));near(m.settings.deadzoneDeg,10);});
test('getCyclic is a defensive value',()=>{const m=new ControlModule();m.getCyclic().x=99;near(m.getCyclic().x,0);});
test('level hover at 60%; tilting causes loss of vertical lift',()=>{const level=simulate(new FlightDynamics(),controls(),2),tilt=simulate(new FlightDynamics(),controls(0,1),2);near(level.y,62);assert.ok(tilt.y<level.y-.5);assert.ok(tilt.vz<0);});
test('translational lift around 35 knots reduces required collective',()=>{const p=new FlightDynamics();p.vz=-35/1.94384;p.update(1/120,controls());assert.ok(p.liftFactor>1.10&&p.liftFactor<1.12);assert.ok(.6/p.liftFactor<.6);assert.ok(p.vy>0);});
test('collective increase yields yaw torque when compensation disabled',()=>{const a=new FlightDynamics(),b=new FlightDynamics();a.setAssists({autoTorque:false});simulate(a,controls(0,0,.9),3);simulate(b,controls(0,0,.9),3);assert.ok(a.heading>.1);near(b.heading,0);});
test('left pedal compensates higher collective',()=>{const p=new FlightDynamics();p.setAssists({autoTorque:false});simulate(p,controls(0,0,.9,-.3*.95/1.05),3);near(p.heading,0);});
test('hover assistance arrests drift and stabilizes height',()=>{const p=new FlightDynamics();p.setAssists({hover:true});p.vx=8;simulate(p,controls(),15);assert.ok(Math.abs(p.vx)<.2);assert.ok(Math.abs(p.y-62)<1);});
test('flight physics accepts arbitrary provider with exactly three methods',()=>{const p=simulate(new FlightDynamics(),Object.freeze(controls(.2,.4,.7,.2)),4);assert.ok(p.x>0&&p.z<360&&p.y>62&&p.heading>0);});
test('hard landing impact survives physics substeps',()=>{const p=new FlightDynamics();p.y=3.1;p.vy=-12;p.update(.1,controls(),0);assert.ok(p.impactSpeed>10);});

test('separate aim stream leaves cyclic, collective and yaw unchanged',()=>{const m=new ControlModule({aimEnabled:true,smoothingSeconds:0,aimSmoothingSeconds:0});m.setOrientation({pitch:17.5,roll:-17.5});m.setCollective(.72);m.setYaw(.3);m.setAimOrientation({pitch:12,yaw:18});m.update(.01);near(m.getCyclic().x,-.5);near(m.getCyclic().y,.5);near(m.getCollective(),.72);near(m.getYaw(),.3);assert.ok(m.getAim().yaw>0&&m.getAim().pitch>0);m.setAimOrientation({pitch:-25,yaw:-35});m.update(.01);near(m.getCyclic().y,.5);near(m.getAim().yaw,-35*Math.PI/180);near(m.getAim().pitch,-25*Math.PI/180);});
test('shared gyro clutch retains cyclic, moves sight, resumes without a jump',()=>{const m=new ControlModule({aimEnabled:true,aimRouting:'shared',smoothingSeconds:0,aimSmoothingSeconds:0,yawMode:'orientation'});m.setOrientation({pitch:17.5,roll:10,yaw:0});m.update(.01);const before=m.getCyclic();m.setAimClutch(true);m.setOrientation({pitch:27.5,roll:15,yaw:20});m.update(.01);near(m.getCyclic().x,before.x);near(m.getCyclic().y,before.y);near(m.getYaw(),0);assert.ok(m.getAim().yaw>0&&m.getAim().pitch<0);m.setAimClutch(false);const sight=m.getAim();m.update(.01);near(m.getCyclic().x,before.x);near(m.getCyclic().y,before.y);near(m.getAim().yaw,sight.yaw);});
test('aim disabled recenters sight and original flight getters still work',()=>{const m=new ControlModule({aimEnabled:true,aimSmoothingSeconds:0,smoothingSeconds:0});m.setAim({x:1,y:-1});m.setOrientation({pitch:30,roll:0});m.update(.01);m.configure({aimEnabled:false});m.update(.01);near(m.getAim().yaw,0);near(m.getAim().pitch,0);near(m.getCyclic().y,1);});
test('independent calibration uses wrapped yaw, without recalibrating flight',()=>{const m=new ControlModule({aimEnabled:true,aimSmoothingSeconds:0,smoothingSeconds:0});m.setOrientation({pitch:30,roll:0});m.setAimOrientation({pitch:15,yaw:179});m.calibrateAim();m.setAimOrientation({pitch:15,yaw:-179});m.update(.01);near(m.getCyclic().y,1);near(m.getAim().pitch,0);assert.ok(m.getAim().yaw>0&&m.getAim().yaw<.05);});
test('shared gyro timeout safely releases flight demand, while collective stays',()=>{const m=new ControlModule({aimEnabled:true,aimRouting:'shared',smoothingSeconds:0,aimSmoothingSeconds:0});m.setOrientation({pitch:30,roll:0});m.update(.01);m.setAimClutch(true);m.update(.7);near(m.getCyclic().y,0);near(m.getAim().pitch,0);near(m.getCollective(),.6);});
test('view transition is continuous, reversible and frame-rate independent',()=>{const a=new ControlModule(),b=new ControlModule();a.setView('cockpit');b.setView('cockpit');for(let i=0;i<6;i++)a.update(.05);for(let i=0;i<36;i++)b.update(1/120);near(a.getViewState().blend,b.getViewState().blend);assert.ok(a.getViewState().blend>0&&a.getViewState().blend<1);const previous=a.getViewState().blend;a.setView('external');near(a.getViewState().blend,previous);a.update(.1);assert.ok(a.getViewState().blend<previous);a.configure({cockpitEnabled:false,view:'cockpit'});near(a.getCollective(),.6);assert.equal(a.getViewState().view,'external');});
test('aim cannot alter flight model integration',()=>{const a=new ControlModule({aimEnabled:true}),b=new ControlModule();const fa=new FlightDynamics(),fb=new FlightDynamics();for(let i=0;i<300;i++){for(const m of[a,b]){m.setOrientation({pitch:14,roll:-8});m.update(1/60);}a.setAim({x:Math.sin(i*.1),y:Math.cos(i*.2)});fa.update(1/60,a);fb.update(1/60,b);}near(fa.x,fb.x);near(fa.y,fb.y);near(fa.z,fb.z);near(fa.heading,fb.heading);});

test('getAimOffset is the sight in radians and a defensive copy',()=>{
  const m=new ControlModule({aimEnabled:true,smoothingSeconds:0,aimSmoothingSeconds:0});
  m.setAim({x:1,y:-.5});m.update(.01);
  const a=m.getAimOffset();
  near(a.yaw,35*Math.PI/180);near(a.pitch,-.5*25*Math.PI/180);
  near(a.yaw,m.getAim().yaw);near(a.pitch,m.getAim().pitch);
  a.yaw=9;near(m.getAimOffset().yaw,35*Math.PI/180);
});
test('deadzone can be set to 4° and 6° from config',()=>{
  for(const dz of [4,6]){
    const m=new ControlModule({smoothingSeconds:0,deadzoneDeg:dz,fullScaleDeg:30});
    m.feedOrientation({pitch:dz,roll:-dz});m.update(.01);
    near(m.getCyclic().x,0);near(m.getCyclic().y,0);
    m.feedOrientation({pitch:dz+.2,roll:0});m.update(.01);
    assert.ok(m.getCyclic().y>0&&m.getCyclic().y<.05);
  }
});
test('mode gyro-flight: tilt flies, touch aims, pedals yaw',()=>{
  const m=new ControlModule({smoothingSeconds:0,aimSmoothingSeconds:0});
  m.setControlMode('gyro-flight');
  m.feedOrientation({pitch:5,roll:-4,yaw:20});m.setAim({x:.5,y:.2});m.setYaw(.4);m.update(.01);
  near(m.getCyclic().x,0);near(m.getCyclic().y,0);near(m.getYaw(),.4);
  near(m.getAimOffset().yaw,.5*35*Math.PI/180);
  m.feedOrientation({pitch:17.5,roll:-30,yaw:0});m.update(.01);
  near(m.getCyclic().y,.5);near(m.getCyclic().x,-1);near(m.getAimOffset().yaw,.5*35*Math.PI/180);
});
test('mode gyro-aim: touch cyclic, right tilt looks right, forward tilt looks down',()=>{
  const m=new ControlModule({smoothingSeconds:0,aimSmoothingSeconds:0});
  m.setControlMode('gyro-aim');
  m.setCyclic({x:-.25,y:.4});m.setYaw(-.2);
  m.feedOrientation({pitch:12.75,roll:17.75,yaw:40});m.update(.01);
  near(m.getCyclic().x,-.25);near(m.getCyclic().y,.4);near(m.getYaw(),-.2);
  near(m.getAimOffset().pitch,-.5*25*Math.PI/180);
  near(m.getAimOffset().yaw,.5*35*Math.PI/180);
});
test('mode gyro-both: focus keeps cyclic and aims with tilt',()=>{
  const m=new ControlModule({smoothingSeconds:0,aimSmoothingSeconds:0,yawMode:'orientation'});
  m.setControlMode('gyro-both');
  m.feedOrientation({pitch:17.5,roll:10,yaw:0});m.update(.01);
  const before=m.getCyclic();
  m.setAimClutch(true);
  m.feedOrientation({pitch:27.5,roll:15,yaw:20});m.update(.01);
  near(m.getCyclic().x,before.x);near(m.getCyclic().y,before.y);near(m.getYaw(),0);
  assert.ok(m.getAimOffset().yaw>0&&m.getAimOffset().pitch<0);
  m.setAimClutch(false);const sight=m.getAimOffset();m.update(.01);
  near(m.getCyclic().x,before.x);near(m.getCyclic().y,before.y);near(m.getAimOffset().yaw,sight.yaw);
});
test('mode touch ignores phone tilt and flies from the sticks',()=>{
  const m=new ControlModule({smoothingSeconds:0,aimSmoothingSeconds:0});
  m.setControlMode('touch');
  m.setCyclic({x:.2,y:-.3});m.setAim({x:1,y:0});m.setYaw(.25);
  m.feedOrientation({pitch:30,roll:30,yaw:20});m.update(.01);
  near(m.getCyclic().x,.2);near(m.getCyclic().y,-.3);near(m.getYaw(),.25);
  near(m.getAimOffset().yaw,35*Math.PI/180);near(m.getAimOffset().pitch,0);
});
test('modes can be switched without dropping collective',()=>{
  const m=new ControlModule({smoothingSeconds:0});
  m.setCollective(.77);
  for(const mode of ['gyro-flight','gyro-aim','gyro-both','touch']){m.setControlMode(mode);assert.equal(m.settings.controlMode,mode);near(m.getCollective(),.77);} 
  assert.equal(m.settings.tiltEnabled,false);
  m.setControlMode('gyro-flight');assert.equal(m.settings.tiltEnabled,true);assert.equal(m.settings.aimRouting,'separate');
  m.setControlMode('gyro-both');assert.equal(m.settings.aimRouting,'shared');
});
test('shared focus also follows roll, and a held cyclic does not jump the sight at the start',()=>{
  const m=new ControlModule({smoothingSeconds:0,aimSmoothingSeconds:0});
  m.setControlMode('gyro-both');
  m.feedOrientation({pitch:0,roll:20,yaw:0});m.update(.01);
  const cyclic=m.getCyclic().x;
  assert.ok(cyclic>.5);
  m.setAimClutch(true);m.update(.01);
  near(m.getAimOffset().yaw,0);near(m.getCyclic().x,cyclic);
  m.feedOrientation({pitch:0,roll:20+17.75,yaw:0});m.update(.01);
  near(m.getAimOffset().yaw,.5*35*Math.PI/180);near(m.getCyclic().x,cyclic);
});
test('translational lift strength comes from flight settings',()=>{
  const quiet=new FlightDynamics();quiet.configure({transLiftMax:0});quiet.vz=-35/1.94384;quiet.update(1/120,controls());
  near(quiet.liftFactor,1);
  const loud=new FlightDynamics();loud.vz=-35/1.94384;loud.update(1/120,controls());
  assert.ok(loud.liftFactor>1.10&&loud.liftFactor<1.12);
  assert.deepEqual(new FlightDynamics().params.transLiftStartKnots,DEFAULT_FLIGHT.transLiftStartKnots);
});
