// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Four independently sprung wheels in a chassis frame with +X forward and +Z up. */
export type GPURigidBodyVehicle = {
  /** Index of the dynamic chassis body. */
  chassis: number;
  /** Index of the static collider sampled by all wheels. */
  terrainCollider: number;
  /** Four independently suspended wheels, in rendering and telemetry order. */
  wheels: readonly {
    /** At full compression the wheel center is here, in chassis node coordinates (meters). */
    mount: readonly [number, number, number];
    /** Turn this wheel about chassis +Z by the commanded steering angle. */
    steer?: boolean;
    /** Apply the commanded drive torque to this wheel. */
    drive?: boolean;
  }[];
  /** Wheel contact sphere radius in meters. */
  radius: number;
  /** Maximum downward distance of the wheel center from its mount in meters. */
  travel: number;
  /** Per-wheel spring stiffness in newtons per meter. */
  springRate: number;
  /** Per-wheel damping coefficient in newton seconds per meter. */
  damping: number;
  /** Dimensionless tire friction coefficient limiting combined longitudinal and lateral force. */
  grip: number;
  /** Torque per driven wheel in N m. */
  motorTorque: number;
  /** Maximum braking torque per wheel in newton meters. */
  brakeTorque: number;
  /** Rotational inertia of one wheel in kilogram meters squared. */
  wheelInertia: number;
  /** Enable Ackermann steering with this front-to-rear axle separation in meters. Chassis Y is measured from the steering centerline. */
  steeringWheelbase?: number;
  /** Load transferred per meter of left/right travel difference. Wheel pairs 0–1 and 2–3 are axles. */
  antiRollRate?: number;
  /** Longitudinal and lateral slip gain, in inverse meters per second. Defaults to [1.1, 1.5]. */
  slipGain?: readonly [number, number];
};

/** Packed storage per chassis, including four wheel poses. */
export const VEHICLE_STRIDE = 512;

/** One workgroup owns one chassis. All wheels sample the same pre-step velocity. */
export const VEHICLE_SHADER = /* wgsl */ `
struct Wheel { mount:vec4f, flags:vec4f, state:vec4f }
struct Vehicle { controls:vec4f, geometry:vec4f, tire:vec4f, indices:vec4u, wheels:array<Wheel,4>, poses:array<mat4x4f,4> }
@group(0) @binding(12) var<storage,read_write> vehicle:array<Vehicle>;
struct SuspensionContact { normal:vec3f, lever:vec3f, lengthNow:f32, load:f32 }
@compute @workgroup_size(1) fn advanceVehicle(@builtin(workgroup_id) group:vec3u) {
  let vehicleIndex=group.x;
  let settingsForVehicle=vehicle[vehicleIndex];
  let chassis=settingsForVehicle.indices.x;
  let terrain=settingsForVehicle.indices.y;
  if(!dynamic(chassis)){return;}
  let rotation=orientations[chassis];
  let center=positions[chassis].xyz;
  let down=rotate(rotation,vec3f(0,0,-1));
  let radius=settingsForVehicle.geometry.x;
  let travel=settingsForVehicle.geometry.y;
  let timestep=settings.gravity.w;
  let wheelbase=bitcast<f32>(settingsForVehicle.indices.z);
  let antiRollRate=bitcast<f32>(settingsForVehicle.indices.w);
  var contacts:array<SuspensionContact,4>;
  for(var index=0u;index<4u;index++){
    let wheel=settingsForVehicle.wheels[index];
    let mount=center+rotate(rotation,wheel.mount.xyz-bodyCenter(chassis));
    let hit=sweepSphere(terrain,colliderLocal(terrain,mount-colliderPosition(terrain)),colliderLocal(terrain,down),travel,radius,false);
    contacts[index].lengthNow=travel;
    if(hit.hit!=0u && hit.complete!=0u){
      let normal=rotate(colliderRotation(terrain),hit.normal);
      let support=dot(normal,-down);
      if(support>0.15){
        let lever=colliderPosition(terrain)+rotate(colliderRotation(terrain),hit.point)-center;
        let velocity=velocities[chassis].xyz+cross(angularVelocities[chassis].xyz,lever);
        let load=max(0.0,(travel-hit.distance)*settingsForVehicle.geometry.z-settingsForVehicle.geometry.w*dot(velocity,normal)/support);
        contacts[index]=SuspensionContact(normal,lever,hit.distance,load);
      }
    }
  }
  // Transfer load within an axle without adding lift or pulling on an airborne tire.
  for(var left=0u;left<4u;left+=2u){
    let right=left+1u;
    if(contacts[left].load>0.0 && contacts[right].load>0.0){
      let transfer=(contacts[right].lengthNow-contacts[left].lengthNow)*antiRollRate;
      let bounded=clamp(transfer,-contacts[left].load,contacts[right].load);
      contacts[left].load+=bounded;
      contacts[right].load-=bounded;
    }
  }
  var impulse=vec3f(0);
  var torque=vec3f(0);
  for(var index=0u;index<4u;index++){
    let wheel=settingsForVehicle.wheels[index];
    let contact=contacts[index];
    var speed=wheel.state.x+settingsForVehicle.controls.x*settingsForVehicle.tire.y*wheel.flags.y*timestep/settingsForVehicle.tire.w;
    speed-=sign(speed)*min(abs(speed),settingsForVehicle.controls.z*settingsForVehicle.tire.z*timestep/settingsForVehicle.tire.w);
    var steering=settingsForVehicle.controls.y*wheel.flags.x;
    if(wheelbase>0.0){
      let reference=clamp(steering,-1.5,1.5);
      steering=atan2(sin(reference)*wheelbase,cos(reference)*wheelbase-wheel.mount.y*sin(reference));
    }
    let load=contact.load;
    if(load>0.0){
      let velocity=velocities[chassis].xyz+cross(angularVelocities[chassis].xyz,contact.lever);
      let heading=rotate(rotation,vec3f(cos(steering),sin(steering),0));
      let side=normalize(cross(contact.normal,heading));
      let forward=cross(side,contact.normal);
      let slip=vec2f(speed*radius-dot(velocity,forward),-dot(velocity,side));
      // Zero in the packed gain fields denotes the original vehicle defaults.
      let gains=select(vec2f(1.1,1.5),vec2f(wheel.mount.w,wheel.flags.z)-1.0,vec2f(wheel.mount.w,wheel.flags.z)>vec2f(0));
      let demand=slip*load*gains;
      var friction=demand*min(1.0,settingsForVehicle.tire.x*load/max(length(demand),0.0001));
      // Bound tire feedback so a light wheel cannot overshoot rolling speed in one step.
      let longitudinalLimit=abs(slip.x)*settingsForVehicle.tire.w/(radius*radius*timestep);
      friction.x=clamp(friction.x,-longitudinalLimit,longitudinalLimit);
      let change=(contact.normal*load+forward*friction.x+side*friction.y)*timestep;
      impulse+=change;
      torque+=cross(contact.lever,change);
      speed-=friction.x*radius*timestep/settingsForVehicle.tire.w;
    }
    let lengthNow=contact.lengthNow;
    let angle=wheel.state.y+speed*timestep;
    vehicle[vehicleIndex].wheels[index].flags.w=steering;
    vehicle[vehicleIndex].wheels[index].state=vec4f(speed,angle,lengthNow,load);
    let heading=vec3f(cos(steering),sin(steering),0);
    let axle=vec3f(-sin(steering),cos(steering),0);
    let vertical=vec3f(0,0,1);
    let hub=wheel.mount.xyz-vertical*lengthNow;
    vehicle[vehicleIndex].poses[index]=mat4x4f(vec4f(heading*cos(angle)-vertical*sin(angle),0),
      vec4f(axle,0),vec4f(heading*sin(angle)+vertical*cos(angle),0),vec4f(hub,1));
  }
  velocities[chassis]=vec4f(velocities[chassis].xyz+impulse*velocities[chassis].w,velocities[chassis].w);
  angularVelocities[chassis]=vec4f(angularVelocities[chassis].xyz+inverseInertia(chassis,torque),0);
  sleepStates[chassis]=vec4f(0);
}
`;
