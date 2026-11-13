export interface Vector2 {x:number;y:number;}
export interface HelicopterControls {getCyclic():Vector2;getCollective():number;getYaw():number;getAimOffset():AimAngles;}
export interface AimAngles {yaw:number;pitch:number;}
export interface ViewState {view:'external'|'cockpit';blend:number;cockpitEnabled:boolean;lookDown:boolean;aimEnabled:boolean;aimClutch:boolean;controlMode:ControlMode;}
export type ControlMode = 'gyro-flight' | 'gyro-aim' | 'gyro-both' | 'touch';
export interface ControlSettings {
 controlMode:ControlMode;deadzoneDeg:number;fullScaleDeg:number;sensitivity:number;smoothingSeconds:number;yawFullScaleDeg:number;tiltEnabled:boolean;yawMode:'pedals'|'orientation';inputTimeoutSeconds:number;
 aimEnabled:boolean;aimRouting:'separate'|'shared';aimSensitivity:number;aimDeadzoneDeg:number;aimSmoothingSeconds:number;aimYawLimitDeg:number;aimPitchLimitDeg:number;
 cockpitEnabled:boolean;view:'external'|'cockpit';viewTransitionSeconds:number;
}
export class ControlModule implements HelicopterControls {
 constructor(options?:Partial<ControlSettings>);configure(options:Partial<ControlSettings>):void;setControlMode(mode:ControlMode):void;
 feedOrientation(angles:{pitch:number;roll:number;yaw?:number}):void;
 setOrientation(angles:{pitch:number;roll:number;yaw?:number}):void;setCyclic(cyclic:Vector2):void;setCollective(value:number):void;setYaw(value:number):void;
 setAim(aim:Vector2):void;setAimOrientation(angles:{pitch:number;yaw:number}):void;setAimClutch(pressed:boolean):void;calibrateAim():void;centerAim():void;
 setView(view:'external'|'cockpit'):void;setLookDown(value:boolean):void;
 calibrate():void;releaseMomentaryInputs():void;update(dtSeconds:number):void;
 getCyclic():Vector2;getCollective():number;getYaw():number;getAimOffset():AimAngles;getAim():AimAngles;getViewState():ViewState;
}
