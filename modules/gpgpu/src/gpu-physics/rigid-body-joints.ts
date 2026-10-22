// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBody} from './rigid-body-properties';
import {normalizeRigidBodyRotation} from './rigid-body-properties';

export type GPURigidBodyJointFrame = {
  /** Body-node local anchor, not center-of-mass local. */
  position?: readonly [number, number, number];
  /** Local frame quaternion; hinges and sliders use its Z axis. */
  orientation?: readonly [number, number, number, number];
};
type JointBase = {
  /** Can be toggled between submitted steps without rebuilding the world. */
  enabled?: boolean;
  first: number;
  second: number;
  firstFrame?: GPURigidBodyJointFrame;
  secondFrame?: GPURigidBodyJointFrame;
  /** Connected body collision is disabled by default. */
  collideConnected?: boolean;
};
type JointDrive = {
  /** Signed displacement or angle, in meters or radians; hinge angles are wrapped to [-pi, pi]. */
  limits?: readonly [number, number];
  motor?: {
    velocity?: number;
    position?: number;
    stiffness?: number;
    damping?: number;
    maximumForce: number;
  };
};
export type GPURigidBodyJoint = JointBase &
  (
    | {type: 'distance'; distance: number; spring?: {stiffness: number; damping: number}}
    | {type: 'fixed'}
    | ({type: 'hinge' | 'slider'} & JointDrive)
  );

/** Small ordered reference envelope; shader constants avoid extra storage bindings. */
export function validateRigidBodyJoints(
  joints: readonly GPURigidBodyJoint[],
  bodies: readonly GPURigidBody[],
  solver: string
): void {
  if (joints.length > 64 || (joints.length && solver !== 'ordered'))
    throw new Error('Unsupported joint configuration');
  for (const joint of joints) {
    if (
      !['distance', 'fixed', 'hinge', 'slider'].includes(joint.type) ||
      joint.first === joint.second ||
      [joint.first, joint.second].some(
        index => !Number.isInteger(index) || index < 0 || index >= bodies.length
      ) ||
      ![joint.first, joint.second].some(
        index =>
          (bodies[index].mode ?? ((bodies[index].mass ?? 1) === 0 ? 'static' : 'dynamic')) ===
          'dynamic'
      )
    )
      throw new Error('Invalid joint bodies');
    for (const frame of [joint.firstFrame, joint.secondFrame]) {
      if (
        frame?.position &&
        (frame.position.length !== 3 ||
          !frame.position.every(value => Number.isFinite(Math.fround(value))))
      )
        throw new Error('Invalid joint anchor');
      if (frame?.orientation) normalizeRigidBodyRotation(frame.orientation);
    }
    if (
      joint.type === 'distance' &&
      (!Number.isFinite(Math.fround(joint.distance)) || joint.distance < 0)
    )
      throw new Error('Invalid joint distance');
    const spring = joint.type === 'distance' ? joint.spring : undefined;
    const motor = joint.type === 'hinge' || joint.type === 'slider' ? joint.motor : undefined;
    if (
      [spring?.stiffness, spring?.damping, motor?.stiffness, motor?.damping].some(
        value => value !== undefined && (!Number.isFinite(Math.fround(value)) || value < 0)
      ) ||
      (motor?.position !== undefined && !Number.isFinite(Math.fround(motor.position)))
    )
      throw new Error('Invalid joint drive');
    if (joint.type === 'hinge' || joint.type === 'slider') {
      if (
        joint.type === 'hinge' &&
        motor?.position !== undefined &&
        Math.abs(motor.position) > Math.PI
      )
        throw new Error('Invalid hinge target');
      if (
        joint.limits &&
        (joint.limits.length !== 2 ||
          !joint.limits.every(value => Number.isFinite(Math.fround(value))) ||
          joint.limits[0] > joint.limits[1] ||
          (joint.type === 'hinge' && (joint.limits[0] <= -Math.PI || joint.limits[1] >= Math.PI)))
      )
        throw new Error('Invalid joint limits');
      if (
        joint.motor &&
        (!Number.isFinite(Math.fround(joint.motor.velocity ?? 0)) ||
          !Number.isFinite(Math.fround(joint.motor.maximumForce)) ||
          joint.motor.maximumForce < 0)
      )
        throw new Error('Invalid joint motor');
    }
  }
}

export function getRigidBodyJointShader(
  joints: readonly GPURigidBodyJoint[],
  bodies: readonly GPURigidBody[]
): string {
  if (!joints.length)
    return 'fn jointActive(body:u32)->bool{return false;} fn jointExcluded(first:u32,second:u32)->bool{return false;}';
  const vector = (values: readonly number[]) =>
    `vec${values.length}f(${values.map(value => `${Math.fround(value)}`).join(',')})`;
  const frame = (index: number, value?: GPURigidBodyJointFrame) => {
    const center = bodies[index].centerOfMass ?? [0, 0, 0];
    return `${vector((value?.position ?? [0, 0, 0]).map((component, axis) => component - center[axis]))},${vector(normalizeRigidBodyRotation(value?.orientation ?? [0, 0, 0, 1]))}`;
  };
  const records = joints.map(joint => {
    const driven = joint.type === 'hinge' || joint.type === 'slider' ? joint : undefined;
    return `Joint(vec4u(${joint.first},${joint.second},${['distance', 'fixed', 'hinge', 'slider'].indexOf(joint.type)},${joint.collideConnected ? 1 : 0}),${frame(joint.first, joint.firstFrame)},${frame(joint.second, joint.secondFrame)},${vector([joint.type === 'distance' ? joint.distance : 0, driven?.limits?.[0] ?? 0, driven?.limits?.[1] ?? 0, driven?.limits ? 1 : 0])},${vector([driven?.motor?.velocity ?? 0, driven?.motor?.maximumForce ?? 0, driven?.motor ? 1 : 0, 0])},${vector([driven?.motor?.position ?? 0, driven?.motor?.stiffness ?? 30, driven?.motor?.damping ?? 5, driven?.motor?.position !== undefined ? 1 : 0])},${vector([joint.type === 'distance' ? (joint.spring?.stiffness ?? 0) : 0, joint.type === 'distance' ? (joint.spring?.damping ?? 0) : 0, joint.type === 'distance' && joint.spring ? 1 : 0, 0])})`;
  });
  return /* wgsl */ `
struct Joint { identifiers:vec4u, firstAnchor:vec3f, firstFrame:vec4f, secondAnchor:vec3f, secondFrame:vec4f, limits:vec4f, motor:vec4f, drive:vec4f, spring:vec4f }
const JOINTS:array<Joint,${joints.length}>=array<Joint,${joints.length}>(${records.join(',')});
fn jointActive(body:u32)->bool {for(var index=0u;index<${joints.length}u;index++){let joint=JOINTS[index];if(targets.joints[index].control.x<0.5){continue;}if(joint.identifiers.x==body||joint.identifiers.y==body){let first=joint.identifiers.x;let second=joint.identifiers.y;if(joint.motor.z>0.0 || (bodies.bodies[first].motion.x==2.0 && length(velocities[first].xyz)+length(angularVelocities[first].xyz)>1e-6) || (bodies.bodies[second].motion.x==2.0 && length(velocities[second].xyz)+length(angularVelocities[second].xyz)>1e-6)){return true;}}}return false;}
fn connectJoints(){for(var index=0u;index<${joints.length}u;index++){if(targets.joints[index].control.x<0.5){continue;}let joint=JOINTS[index];let first=joint.identifiers.x;let second=joint.identifiers.y;if(dynamic(first)&&dynamic(second)){let firstRoot=root(first);let secondRoot=root(second);sleepStates[max(firstRoot,secondRoot)].z=f32(min(firstRoot,secondRoot));}}}
fn jointExcluded(first:u32,second:u32)->bool {for(var index=0u;index<${joints.length}u;index++){let identifiers=JOINTS[index].identifiers;if(targets.joints[index].control.x>0.5&&identifiers.w==0u&&((identifiers.x==first&&identifiers.y==second)||(identifiers.y==first&&identifiers.x==second))){return true;}}return false;}
fn jointMass(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,angular:bool)->f32 {
 if(angular){return dot(axis,inverseInertia(first,axis)+inverseInertia(second,axis));}
 let firstLever=firstPoint-positions[first].xyz;let secondLever=secondPoint-positions[second].xyz;
 return velocities[first].w+velocities[second].w+dot(axis,cross(inverseInertia(first,cross(firstLever,axis)),firstLever)+cross(inverseInertia(second,cross(secondLever,axis)),secondLever));
}
fn jointVelocity(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,angular:bool)->f32 {
 if(angular){return dot(angularVelocities[second].xyz-angularVelocities[first].xyz,axis);}
 return dot(pointVelocity(second,secondPoint)-pointVelocity(first,firstPoint),axis);
}
fn jointImpulse(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,impulse:f32,angular:bool){
 if(angular){if(dynamic(first)){angularVelocities[first]=vec4f(angularVelocities[first].xyz-inverseInertia(first,axis*impulse),0);}if(dynamic(second)){angularVelocities[second]=vec4f(angularVelocities[second].xyz+inverseInertia(second,axis*impulse),0);}}
 else{applyImpulse(first,firstPoint,-axis*impulse);applyImpulse(second,secondPoint,axis*impulse);}
}
fn jointRow(index:u32,row:u32,first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,error:f32,angular:bool,spring:vec4f,warm:bool){
 let previous=targets.joints[index].impulses[row];
 if(warm){let retained=previous*settings.stability.x;targets.joints[index].impulses[row]=retained;jointImpulse(first,second,firstPoint,secondPoint,axis,retained,angular);return;}
 let mass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(mass<=1e-20){return;}
 var softness=0.0;var bias=clamp(settings.stability.y*error/settings.gravity.w,-settings.stability.z,settings.stability.z);
 if(spring.z>0){softness=1.0/max(1e-20,settings.gravity.w*(spring.y+settings.gravity.w*spring.x));bias=error*settings.gravity.w*spring.x*softness;}
 let increment=-(jointVelocity(first,second,firstPoint,secondPoint,axis,angular)+bias+softness*previous)/(mass+softness);
 targets.joints[index].impulses[row]=previous+increment;jointImpulse(first,second,firstPoint,secondPoint,axis,increment,angular);
}
fn solveJoints(warm:bool){
 for(var index=0u;index<${joints.length}u;index++){
  if(targets.joints[index].control.x<0.5){continue;}
  let joint=JOINTS[index];let first=joint.identifiers.x;let second=joint.identifiers.y;let kind=joint.identifiers.z;
  if((!dynamic(first)||sleepStates[first].y>0.5)&&(!dynamic(second)||sleepStates[second].y>0.5)){continue;}
  var firstPoint=positions[first].xyz+rotate(orientations[first],joint.firstAnchor);let secondPoint=positions[second].xyz+rotate(orientations[second],joint.secondAnchor);
  let firstRotation=multiplyRotation(orientations[first],joint.firstFrame);let secondRotation=multiplyRotation(orientations[second],joint.secondFrame);
  let offset=secondPoint-firstPoint;
  // A slider constrains a point on the moving axis, not the fixed frame origin.
  if(kind==3u){let axis=rotate(firstRotation,vec3f(0,0,1));firstPoint+=axis*dot(offset,axis);}
  if(kind==0u){let distance=length(offset);let axis=select(rotate(firstRotation,vec3f(1,0,0)),offset/max(distance,1e-20),distance>1e-8);jointRow(index,0u,first,second,firstPoint,secondPoint,axis,distance-joint.limits.x,false,joint.spring,warm);continue;}
  for(var component=0u;component<select(3u,2u,kind==3u);component++){var basis=vec3f(0);basis[component]=1;let axis=rotate(firstRotation,basis);jointRow(index,component,first,second,firstPoint,secondPoint,axis,dot(offset,axis),false,vec4f(0),warm);}
  var relative=multiplyRotation(secondRotation,vec4f(-firstRotation.xyz,firstRotation.w));if(relative.w<0){relative=-relative;}
  let sine=length(relative.xyz);let rotationError=relative.xyz*(2.0*atan2(sine,relative.w)/max(sine,1e-20));
  for(var component=0u;component<select(3u,2u,kind==2u);component++){var basis=vec3f(0);basis[component]=1;let axis=rotate(firstRotation,basis);jointRow(index,3u+component,first,second,firstPoint,secondPoint,axis,dot(rotationError,axis),true,vec4f(0),warm);}
  if(kind==1u){continue;}
  let angular=kind==2u;let axis=rotate(firstRotation,vec3f(0,0,1));
  let localRotation=multiplyRotation(vec4f(-firstRotation.xyz,firstRotation.w),secondRotation);
  var angle=2.0*atan2(localRotation.z,localRotation.w);if(angle>3.14159265){angle-=6.2831853;}if(angle < -3.14159265){angle+=6.2831853;}
  let coordinate=select(dot(offset,axis),angle,angular);let mass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(mass<=1e-20){continue;}
  if(joint.motor.z>0){
   let previous=targets.joints[index].impulses[6];let limit=joint.motor.y*settings.gravity.w;
   var desired=joint.motor.x;var softness=0.0;
   if(joint.drive.w>0){softness=1.0/max(1e-20,settings.gravity.w*(joint.drive.z+settings.gravity.w*joint.drive.y));desired-= (coordinate-joint.drive.x)*settings.gravity.w*joint.drive.y*softness;}
   let increment=(desired-jointVelocity(first,second,firstPoint,secondPoint,axis,angular)-softness*previous)/(mass+softness);
   let accumulated=clamp(select(previous+increment,previous*settings.stability.x,warm),-limit,limit);
   jointImpulse(first,second,firstPoint,secondPoint,axis,select(accumulated-previous,accumulated,warm),angular);targets.joints[index].impulses[6]=accumulated;
  }
  if(joint.limits.w>0){
   // Limits are unilateral: discard a cached impulse when the active side changes.
   let previous=targets.joints[index].impulses[7];let minimum=(joint.limits.y-coordinate)/settings.gravity.w;let maximum=(joint.limits.z-coordinate)/settings.gravity.w;
   let speed=jointVelocity(first,second,firstPoint,secondPoint,axis,angular);
   var accumulated=previous+(clamp(speed,minimum,maximum)-speed)/mass;
   if(coordinate<joint.limits.y){accumulated=max(0.0,accumulated);}else if(coordinate>joint.limits.z){accumulated=min(0.0,accumulated);}
   if(warm){accumulated=0.0;}
   jointImpulse(first,second,firstPoint,secondPoint,axis,select(accumulated-previous,0.0,warm),angular);targets.joints[index].impulses[7]=accumulated;
  }
 }
}
`;
}
