// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSphereTrigger} from './sphere-events';

/** Earliest impact for a bounded small world. Every body advances by the same time. */
export function getSweepShader(): string {
  return /* wgsl */ `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> outputClock: Clock;
fn sphereTime(delta: vec3f, velocity: vec3f, radius: f32, limit: f32) -> f32 {
 let squaredSpeed = dot(velocity, velocity);
 let closing = dot(delta, velocity);
 let separation = dot(delta, delta) - radius * radius;
 if(closing >= -0.000001 || squaredSpeed < 0.0000001) {return limit;}
 if(separation <= 0.0) {return 0.0;}
 let discriminant = closing * closing - squaredSpeed * separation;
 if(discriminant < 0.0) {return limit;}
 return min(limit, max(0.0, (-closing - sqrt(discriminant)) / squaredSpeed));
}
fn segmentTime(point: vec3f, velocity: vec3f, start: vec3f, end: vec3f, radius: f32, limit: f32) -> f32 {
 let axis = end - start; let squaredLength = dot(axis, axis);
 let relative = point - start;
 let perpendicular = relative - axis * dot(relative, axis) / squaredLength;
 let perpendicularVelocity = velocity - axis * dot(velocity, axis) / squaredLength;
 var time = sphereTime(perpendicular, perpendicularVelocity, radius, limit);
 let along = dot(relative + velocity * time, axis) / squaredLength;
 if(along < 0.0 || along > 1.0) {time = limit;}
 time = sphereTime(point - start, velocity, radius, time);
 return sphereTime(point - end, velocity, radius, time);
}
@compute @workgroup_size(1) fn main() {
 let remaining = outputClock.remaining;
 if(remaining <= 0.0) {outputClock.timeStep = 0.0; return;}
 var time = remaining;
 for(var first = 0u; first < BODY_COUNT; first++) {
  let sphere = positions[first];
  if(!isValidSphere(sphere) || velocities[first].w <= 0.0) {continue;}
  let velocity = velocities[first].xyz + settings.gravity.xyz * remaining;
  for(var second = 0u; second < BODY_COUNT; second++) {
   let neighbor = positions[second];
   if(first == second || !isValidSphere(neighbor)) {continue;}
   let otherVelocity = select(vec3f(0.0), velocities[second].xyz + settings.gravity.xyz * remaining, velocities[second].w > 0.0);
   time = sphereTime(sphere.xyz - neighbor.xyz, velocity - otherVelocity, sphere.w + neighbor.w, time);
  }
  for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
   let plane = settings.planes[planeIndex];
   let height = dot(sphere.xyz, plane.normal.xyz) - plane.normal.w;
   let closing = dot(velocity, plane.normal.xyz);
   if(height < -sphere.w) {continue;}
   // Supported resting contacts are resolved by the discrete solver, without stalling time.
   if(abs(height - sphere.w) <= settings.solver.z && dot(velocities[first].xyz, plane.normal.xyz) >= -0.00001) {continue;}
   if(closing < -0.000001) {
    let candidate = max(0.0, (sphere.w - height) / closing);
    let point = sphere.xyz + velocity * candidate;
    let relative = point - plane.center.xyz;
    if(abs(dot(relative, plane.right.xyz)) <= plane.right.w && abs(dot(relative, plane.forward.xyz)) <= plane.forward.w) {
     time = min(time, candidate);
    }
   }
   // Four swept edge capsules also cover corner spheres. Infinite planes skip this work.
   if(plane.right.w < 1e9 && plane.forward.w < 1e9) {
    for(var edge = 0u; edge < 4u; edge++) {
     let side = select(-1.0, 1.0, edge % 2u == 1u);
     let horizontal = edge < 2u;
     let midpoint = plane.center.xyz + select(plane.forward.xyz * plane.forward.w, plane.right.xyz * plane.right.w, horizontal) * side;
     let extent = select(plane.right.xyz * plane.right.w, plane.forward.xyz * plane.forward.w, horizontal);
     time = segmentTime(sphere.xyz, velocity, midpoint - extent, midpoint + extent, sphere.w, time);
    }
   }
  }
 }
 // A tiny bounded advance creates a contact for the discrete narrow phase at the root.
 // Resting contacts under gravity should consume a full step, not exhaust the impact budget.
 let progress = min(remaining, max(time + 0.0000001, settings.material.x * 0.0001));
 outputClock = Clock(progress, max(0.0, remaining - progress), outputClock.step, 0u);
}
`;
}

export function getEventShader(capacity: number, triggers: readonly GPUSphereTrigger[]): string {
  const triggerSource = triggers
    .map(
      (trigger, index) => `
  {
   let center = vec3f(${trigger.center.map(value => `${Number(value).toFixed(9)}`).join(', ')});
   let delta = sphere.xyz - before.xyz;
   let fraction = clamp(dot(center - before.xyz, delta) / max(dot(delta, delta), 0.0000001), 0.0, 1.0);
   if(distance(before.xyz + delta * fraction, center) <= ${trigger.radius.toFixed(9)} ${trigger.capture ? '' : `&& distance(before.xyz, center) > ${trigger.radius.toFixed(9)}`}) {
    emit(index | 0x800000u, 2u, ${index}u, sphere.xyz, 0.0);
    ${trigger.capture ? 'positions[index].w = -sphere.w; velocities[index] = vec4f(0.0, 0.0, 0.0, velocities[index].w);' : ''}
   }
  }`
    )
    .join('\n');
  return /* wgsl */ `
@group(0) @binding(1) var<storage, read_write> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> previousPositions: array<vec4f>;
@group(0) @binding(4) var<storage, read> previousVelocities: array<vec4f>;
@group(0) @binding(5) var<storage, read> offsets: array<u32>;
@group(0) @binding(6) var<storage, read> contacts: array<vec2u>;
@group(0) @binding(7) var<storage, read_write> events: array<atomic<u32>>;
@group(0) @binding(8) var<storage, read_write> contactStates: array<u32>;
fn isContactBegin(body: u32, counterpart: u32) -> bool {
 let offset = body * (BODY_COUNT + 32u) + counterpart;
 let previous = contactStates[offset];
 contactStates[offset] = clock.step;
 return previous == 0u || (previous != clock.step && previous != clock.step - 1u);
}
fn emit(body: u32, kind: u32, counterpart: u32, point: vec3f, speed: f32) {
 let sequence = atomicAdd(&events[0], 1u);
 let offset = 4u + (sequence % ${capacity}u) * 8u;
 atomicStore(&events[offset], sequence);
 atomicStore(&events[offset + 1u], clock.step);
 atomicStore(&events[offset + 2u], (kind << 24u) | body);
 atomicStore(&events[offset + 3u], counterpart);
 atomicStore(&events[offset + 4u], bitcast<u32>(point.x));
 atomicStore(&events[offset + 5u], bitcast<u32>(point.y));
 atomicStore(&events[offset + 6u], bitcast<u32>(point.z));
 atomicStore(&events[offset + 7u], bitcast<u32>(speed));
}
@compute @workgroup_size(1) fn main() {
 if(clock.timeStep <= 0.0) {return;}
 for(var index = 0u; index < BODY_COUNT; index++) {
 let sphere = positions[index]; let before = previousPositions[index];
 if(!isValidSphere(before)) {continue;}
 for(var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
  let contact = contacts[cursor];
  let normal = getContactNormal(before.xyz - previousPositions[contact.x].xyz, index, contact.x);
  let closing = -dot(previousVelocities[index].xyz - previousVelocities[contact.x].xyz, normal);
  if(index < contact.x && distance(sphere.xyz, positions[contact.x].xyz) <= sphere.w + abs(positions[contact.x].w) + settings.solver.z) {
   let begin = isContactBegin(index, contact.x);
   if(begin || closing > 0.001) {emit(index | select(0u, 0x800000u, begin), 0u, contact.x, sphere.xyz, max(closing, 0.0));}
  }
 }
 for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
  let plane = settings.planes[planeIndex];
  let closing = -dot(previousVelocities[index].xyz, plane.normal.xyz);
  if(length(getPlaneDelta(sphere.xyz, plane)) <= sphere.w + settings.solver.z) {
   let begin = isContactBegin(index, BODY_COUNT + planeIndex);
   if(begin || closing > settings.solver.y) {emit(index | select(0u, 0x800000u, begin), 1u, planeIndex, sphere.xyz, max(closing, 0.0));}
  }
 }
 ${triggerSource}
 if(index == 0u && positions[index].w > 0.0 && distance(before.xyz, sphere.xyz) > 0.00001) {emit(index, 3u, 0u, sphere.xyz, 0.0);}
 }
}
`;
}
