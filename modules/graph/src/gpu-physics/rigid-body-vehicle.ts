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
};

/** One invocation owns the chassis. All wheels sample the same pre-step velocity. */
export const VEHICLE_SHADER = /* wgsl */ `
struct Wheel { mount:vec4f, flags:vec4f, state:vec4f }
struct Vehicle { controls:vec4f, geometry:vec4f, tire:vec4f, indices:vec4u, wheels:array<Wheel,4>, poses:array<mat4x4f,4> }
@group(0) @binding(12) var<storage,read_write> vehicle:Vehicle;
@compute @workgroup_size(1) fn advanceVehicle() {
  let chassis=vehicle.indices.x;
  let terrain=vehicle.indices.y;
  let rotation=orientations[chassis];
  let center=positions[chassis].xyz;
  let down=rotate(rotation,vec3f(0,0,-1));
  let radius=vehicle.geometry.x;
  let travel=vehicle.geometry.y;
  let timestep=settings.gravity.w;
  var impulse=vec3f(0);
  var torque=vec3f(0);
  for(var index=0u;index<4u;index++){
    let wheel=vehicle.wheels[index];
    let mount=center+rotate(rotation,wheel.mount.xyz-bodyCenter(chassis));
    let hit=sweepSphere(terrain,colliderLocal(terrain,mount-colliderPosition(terrain)),colliderLocal(terrain,down),travel,radius,false);
    var speed=wheel.state.x+vehicle.controls.x*vehicle.tire.y*wheel.flags.y*timestep/vehicle.tire.w;
    speed-=sign(speed)*min(abs(speed),vehicle.controls.z*vehicle.tire.z*timestep/vehicle.tire.w);
    let steering=vehicle.controls.y*wheel.flags.x;
    var lengthNow=travel;
    var load=0.0;
    if(hit.hit!=0u && hit.complete!=0u){
      let normal=rotate(colliderRotation(terrain),hit.normal);
      let support=dot(normal,-down);
      if(support>0.15){
        lengthNow=hit.distance;
        let lever=colliderPosition(terrain)+rotate(colliderRotation(terrain),hit.point)-center;
        let velocity=velocities[chassis].xyz+cross(angularVelocities[chassis].xyz,lever);
        load=max(0.0,(travel-lengthNow)*vehicle.geometry.z-vehicle.geometry.w*dot(velocity,normal)/support);
        let heading=rotate(rotation,vec3f(cos(steering),sin(steering),0));
        let side=normalize(cross(normal,heading));
        let forward=cross(side,normal);
        let slip=vec2f(speed*radius-dot(velocity,forward),-dot(velocity,side));
        let demand=slip*load*vec2f(1.1,1.5);
        var friction=demand*min(1.0,vehicle.tire.x*load/max(length(demand),0.0001));
        // Bound tire feedback so a light wheel cannot overshoot rolling speed in one step.
        let longitudinalLimit=abs(slip.x)*vehicle.tire.w/(radius*radius*timestep);
        friction.x=clamp(friction.x,-longitudinalLimit,longitudinalLimit);
        let change=(normal*load+forward*friction.x+side*friction.y)*timestep;
        impulse+=change;
        torque+=cross(lever,change);
        speed-=friction.x*radius*timestep/vehicle.tire.w;
      }
    }
    let angle=wheel.state.y+speed*timestep;
    vehicle.wheels[index].state=vec4f(speed,angle,lengthNow,load);
    let heading=vec3f(cos(steering),sin(steering),0);
    let axle=vec3f(-sin(steering),cos(steering),0);
    let vertical=vec3f(0,0,1);
    let hub=wheel.mount.xyz-vertical*lengthNow;
    vehicle.poses[index]=mat4x4f(vec4f(heading*cos(angle)-vertical*sin(angle),0),
      vec4f(axle,0),vec4f(heading*sin(angle)+vertical*cos(angle),0),vec4f(hub,1));
  }
  velocities[chassis]=vec4f(velocities[chassis].xyz+impulse*velocities[chassis].w,velocities[chassis].w);
  angularVelocities[chassis]=vec4f(angularVelocities[chassis].xyz+inverseInertia(chassis,torque),0);
  sleepStates[chassis]=vec4f(0);
}
`;
