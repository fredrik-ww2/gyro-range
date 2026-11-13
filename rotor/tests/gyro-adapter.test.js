import test from 'node:test';
import assert from 'node:assert/strict';
import {GyroAdapter, anglesBetween, rebaseOrigin, deviceQuaternion, relativeAngles, wrapDeg} from '../controls/GyroAdapter.js';

const near=(a,b,e=1e-2)=>assert.ok(Math.abs(wrapDeg(a-b))<e,`${a} ≈ ${b}`);
const pose=(alpha,beta,gamma,screen=0)=>({alpha,beta,gamma,screen});
const STAND=pose(0,90,0,0);

test('forward tilt is positive pitch, top up is negative, right twist is positive yaw',()=>{
  const down=anglesBetween(STAND,pose(0,50,0,0));
  const up=anglesBetween(STAND,pose(0,130,0,0));
  const right=anglesBetween(STAND,pose(-30,90,0,0));
  const back=anglesBetween(STAND,STAND);
  assert.ok(down.pitch>25,`forward ${down.pitch}`);
  assert.ok(Math.abs(down.roll)<8&&Math.abs(down.yaw)<8);
  assert.ok(up.pitch<-25,`back ${up.pitch}`);
  assert.ok(right.yaw>20,`yaw ${right.yaw}`);
  assert.ok(Math.abs(right.pitch)<8);
  near(back.pitch,0,1e-6);near(back.roll,0,1e-6);near(back.yaw,0,1e-6);
});

test('right side down is positive roll in portrait and landscape',()=>{
  const roll=anglesBetween(STAND,pose(90,70,-90,0));
  assert.ok(roll.roll>10,`roll ${roll.roll}`);
  const land=anglesBetween(STAND,pose(90,0,-90,90));
  near(land.pitch,0,5);near(land.roll,0,5);near(land.yaw,0,5);
  const landRight=anglesBetween(pose(90,0,-90,90),pose(60,0,-90,90));
  assert.ok(landRight.yaw>20,`landscape yaw ${landRight.yaw}`);
  assert.ok(Math.abs(landRight.pitch)<12);
});

test('calibration and a quiet sensor do not invent new samples',()=>{
  let t=1000;
  const g=new GyroAdapter({now:()=>t,staleSeconds:.6});
  g.ingest(0,90,0,0,t);
  const first=g.take();
  near(first.pitch,0);near(first.roll,0);near(first.yaw,0);
  assert.equal(g.take(),null);
  g.ingest(0,50,0,0,t);
  const moved=g.take();
  assert.ok(moved.pitch>25);
  g.calibrate(t);
  const zero=g.take();
  near(zero.pitch,0);near(zero.roll,0);near(zero.yaw,0);
  t+=700;
  assert.equal(g.read(t).fresh,false);
  assert.equal(g.take(),null);
});

test('a representation glitch rebases instead of slamming the stick',()=>{
  const q=deviceQuaternion(10,40,-15,0);
  const held={pitch:12,roll:-8,yaw:4};
  const origin=rebaseOrigin(q,held);
  const got=relativeAngles(origin,q);
  near(got.pitch,held.pitch,1e-6);near(got.roll,held.roll,1e-6);near(got.yaw,held.yaw,1e-6);
});

test('permission ask calls requestPermission before awaiting',async ()=>{
  const calls=[];
  const previousO=globalThis.DeviceOrientationEvent;
  const previousM=globalThis.DeviceMotionEvent;
  globalThis.DeviceOrientationEvent={requestPermission(){calls.push('orientation');return Promise.resolve('granted');}};
  globalThis.DeviceMotionEvent={requestPermission(){calls.push('motion');return Promise.resolve('granted');}};
  const g=new GyroAdapter();
  const pending=g.requestPermission();
  assert.deepEqual(calls,['orientation','motion']);
  const result=await pending;
  assert.equal(result.allowed,true);
  globalThis.DeviceOrientationEvent=previousO;
  globalThis.DeviceMotionEvent=previousM;
});
