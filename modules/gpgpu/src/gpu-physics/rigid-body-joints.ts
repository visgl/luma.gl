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
  motor?: {velocity: number; maximumForce: number};
};
export type GPURigidBodyJoint = JointBase &
  (
    | {type: 'distance'; distance: number}
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
    if (joint.type === 'hinge' || joint.type === 'slider') {
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
        (!Number.isFinite(Math.fround(joint.motor.velocity)) ||
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
    return `Joint(vec4u(${joint.first},${joint.second},${['distance', 'fixed', 'hinge', 'slider'].indexOf(joint.type)},${joint.collideConnected ? 1 : 0}),${frame(joint.first, joint.firstFrame)},${frame(joint.second, joint.secondFrame)},${vector([joint.type === 'distance' ? joint.distance : 0, driven?.limits?.[0] ?? 0, driven?.limits?.[1] ?? 0, driven?.limits ? 1 : 0])},${vector([driven?.motor?.velocity ?? 0, driven?.motor?.maximumForce ?? 0, driven?.motor ? 1 : 0, 0])})`;
  });
  return /* wgsl */ `
struct Joint { identifiers:vec4u, firstAnchor:vec3f, firstFrame:vec4f, secondAnchor:vec3f, secondFrame:vec4f, limits:vec4f, motor:vec4f }
const JOINTS:array<Joint,${joints.length}>=array<Joint,${joints.length}>(${records.join(',')});
var<private> jointMotorImpulses:array<f32,${joints.length}>;
fn jointActive(body:u32)->bool {for(var index=0u;index<${joints.length}u;index++){if(JOINTS[index].identifiers.x==body||JOINTS[index].identifiers.y==body){return true;}}return false;}
fn jointExcluded(first:u32,second:u32)->bool {for(var index=0u;index<${joints.length}u;index++){let identifiers=JOINTS[index].identifiers;if(identifiers.w==0u&&((identifiers.x==first&&identifiers.y==second)||(identifiers.y==first&&identifiers.x==second))){return true;}}return false;}
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
fn jointRow(first:u32,second:u32,firstPoint:vec3f,secondPoint:vec3f,axis:vec3f,error:f32,angular:bool){
 let mass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(mass<=1e-20){return;}
 let desired=-clamp(settings.stability.y*error/settings.gravity.w,-settings.stability.z,settings.stability.z);
 jointImpulse(first,second,firstPoint,secondPoint,axis,(desired-jointVelocity(first,second,firstPoint,secondPoint,axis,angular))/mass,angular);
}
fn solveJoints(){
 for(var index=0u;index<${joints.length}u;index++){
  let joint=JOINTS[index];let first=joint.identifiers.x;let second=joint.identifiers.y;let kind=joint.identifiers.z;
  var firstPoint=positions[first].xyz+rotate(orientations[first],joint.firstAnchor);let secondPoint=positions[second].xyz+rotate(orientations[second],joint.secondAnchor);
  let firstRotation=multiplyRotation(orientations[first],joint.firstFrame);let secondRotation=multiplyRotation(orientations[second],joint.secondFrame);
  let offset=secondPoint-firstPoint;
  // A slider constrains a point on the moving axis, not the fixed frame origin.
  if(kind==3u){let axis=rotate(firstRotation,vec3f(0,0,1));firstPoint+=axis*dot(offset,axis);}
  if(kind==0u){let distance=length(offset);let axis=select(rotate(firstRotation,vec3f(1,0,0)),offset/max(distance,1e-20),distance>1e-8);jointRow(first,second,firstPoint,secondPoint,axis,distance-joint.limits.x,false);continue;}
  for(var component=0u;component<select(3u,2u,kind==3u);component++){var basis=vec3f(0);basis[component]=1;let axis=rotate(firstRotation,basis);jointRow(first,second,firstPoint,secondPoint,axis,dot(offset,axis),false);}
  var relative=multiplyRotation(secondRotation,vec4f(-firstRotation.xyz,firstRotation.w));if(relative.w<0){relative=-relative;}
  let sine=length(relative.xyz);let rotationError=relative.xyz*(2.0*atan2(sine,relative.w)/max(sine,1e-20));
  for(var component=0u;component<select(3u,2u,kind==2u);component++){var basis=vec3f(0);basis[component]=1;let axis=rotate(firstRotation,basis);jointRow(first,second,firstPoint,secondPoint,axis,dot(rotationError,axis),true);}
  if(kind==1u){continue;}
  let angular=kind==2u;let axis=rotate(firstRotation,vec3f(0,0,1));
  let localRotation=multiplyRotation(vec4f(-firstRotation.xyz,firstRotation.w),secondRotation);
  var angle=2.0*atan2(localRotation.z,localRotation.w);if(angle>3.14159265){angle-=6.2831853;}if(angle < -3.14159265){angle+=6.2831853;}
  let coordinate=select(dot(offset,axis),angle,angular);let mass=jointMass(first,second,firstPoint,secondPoint,axis,angular);if(mass<=1e-20){continue;}
  if(joint.motor.z>0){let increment=(joint.motor.x-jointVelocity(first,second,firstPoint,secondPoint,axis,angular))/mass;let limit=joint.motor.y*settings.gravity.w;let accumulated=clamp(jointMotorImpulses[index]+increment,-limit,limit);jointImpulse(first,second,firstPoint,secondPoint,axis,accumulated-jointMotorImpulses[index],angular);jointMotorImpulses[index]=accumulated;}
  if(joint.limits.w>0){let speed=jointVelocity(first,second,firstPoint,secondPoint,axis,angular);let minimum=(joint.limits.y-coordinate)/settings.gravity.w;let maximum=(joint.limits.z-coordinate)/settings.gravity.w;let desired=clamp(speed,minimum,maximum);jointImpulse(first,second,firstPoint,secondPoint,axis,(desired-speed)/mass,angular);}
 }
}
`;
}
