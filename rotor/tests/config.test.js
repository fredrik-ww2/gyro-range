import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../config.json' with { type: 'json' };
import {ControlModule, CONTROL_MODES} from '../controls/ControlModule.js';
import {FlightDynamics, DEFAULT_FLIGHT} from '../controls/FlightDynamics.js';

test('config.json is the control and flight tuning, with nothing left only in code',()=>{
  const control=new ControlModule();
  assert.deepEqual(control.settings,config.control);
  const flight=new FlightDynamics();
  assert.deepEqual(flight.params,config.flight);
  assert.deepEqual(flight.params,DEFAULT_FLIGHT);
  assert.deepEqual(config.modes.map(m=>m.id),CONTROL_MODES);
  assert.equal(config.modes.length,4);
  assert.ok(config.control.deadzoneDeg>=4&&config.control.deadzoneDeg<=6);
  assert.ok(config.flight.transLiftStartKnots<35&&config.flight.transLiftEndKnots>35);
  for(const row of config.menu){
    const bag=row.group==='flight'?config.flight:config.control;
    assert.equal(typeof bag[row.id],'number');
    assert.ok(bag[row.id]>=row.min&&bag[row.id]<=row.max);
  }
  new ControlModule(config.control);
  new FlightDynamics(config.flight);
});
