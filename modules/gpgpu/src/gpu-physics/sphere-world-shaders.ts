// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** @internal Shader constants are structural; live material and gravity values are uniforms. */
export function getSphereWorldShaderHeader(
  count: number,
  maximumRadius: number,
  maximumContacts: number,
  contactSkin: number
): string {
  return /* wgsl */ `
const BODY_COUNT = ${count}u;
const CELL_SIZE = ${maximumRadius * 2 + contactSkin};
const MAXIMUM_RADIUS = ${maximumRadius};
const MAXIMUM_CONTACTS = ${maximumContacts}u;
const INVALID_KEY = 0xffffffffu;
struct Settings {
  gravity: vec4f,
  normal: vec4f,
  right: vec4f,
  forward: vec4f,
  material: vec4f,
  resting: vec4f,
  solver: vec4f,
};
@group(0) @binding(0) var<uniform> settings: Settings;
fn getCell(point: vec3f) -> vec3i { return vec3i(floor(point / CELL_SIZE)); }
fn hashCell(cell: vec3i) -> u32 {
  return ((bitcast<u32>(cell.x) * 73856093u) ^
    (bitcast<u32>(cell.y) * 19349663u) ^
    (bitcast<u32>(cell.z) * 83492791u)) & 0x7fffffffu;
}
fn isValidSphere(sphere: vec4f) -> bool {
  return sphere.w > 0.0 && sphere.w <= MAXIMUM_RADIUS &&
    all(abs(sphere.xyz) < vec3f(CELL_SIZE * 100000000.0));
}
fn getFloorDelta(point: vec3f) -> vec3f {
  let relative = point - settings.normal.xyz * settings.normal.w;
  let horizontal = clamp(dot(relative, settings.right.xyz), -settings.right.w, settings.right.w);
  let vertical = clamp(dot(relative, settings.forward.xyz), -settings.forward.w, settings.forward.w);
  return relative - settings.right.xyz * horizontal - settings.forward.xyz * vertical;
}
fn getContactNormal(delta: vec3f, first: u32, second: u32) -> vec3f {
  let distance = length(delta);
  if (distance > 0.000001) { return delta / distance; }
  return vec3f(select(-1.0, 1.0, first < second), 0.0, 0.0);
}
`;
}

export const INTEGRATE_SPHERES = /* wgsl */ `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> sleepStates: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> predictedPositions: array<vec4f>;
@group(0) @binding(6) var<storage, read_write> predictedVelocities: array<vec4f>;
@group(0) @binding(7) var<storage, read_write> predictedAngularVelocities: array<vec4f>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  let sphere = positions[index];
  var velocity = velocities[index];
  var sleep = sleepStates[index];
  if (sleep.y != settings.gravity.w) { sleep.x = 0.0; }
  sleep.y = settings.gravity.w;
  sleepStates[index] = sleep;
  var point = sphere.xyz;
  let sleeping = settings.solver.x > 0.0 && sleep.x >= settings.solver.x;
  if (velocity.w > 0.0 && !sleeping && isValidSphere(sphere)) {
    velocity = vec4f(velocity.xyz + settings.gravity.xyz * settings.material.x, velocity.w);
    point += velocity.xyz * settings.material.x;
  }
  predictedPositions[index] = vec4f(point, sphere.w);
  predictedVelocities[index] = velocity;
  predictedAngularVelocities[index] = angularVelocities[index];
}
`;

export const ASSIGN_SPHERE_CELLS = /* wgsl */ `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> keys: array<u32>;
@group(0) @binding(3) var<storage, read_write> values: array<u32>;
@group(0) @binding(4) var<storage, read_write> diagnostics: array<atomic<u32>>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  let sphere = positions[index];
  var key = INVALID_KEY;
  if (isValidSphere(sphere)) { key = hashCell(getCell(sphere.xyz)); }
  else { atomicAdd(&diagnostics[1], 1u); }
  keys[index] = key; values[index] = index;
}
`;

export function getSphereContactShader(mode: 'count' | 'emit', allPairs: boolean): string {
  return /* wgsl */ `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> sortedKeys: array<u32>;
@group(0) @binding(4) var<storage, read> sortedBodies: array<u32>;
@group(0) @binding(5) var<storage, read_write> counts: array<u32>;
@group(0) @binding(6) var<storage, read> offsets: array<u32>;
@group(0) @binding(7) var<storage, read_write> contacts: array<vec2u>;
@group(0) @binding(8) var<storage, read_write> diagnostics: array<atomic<u32>>;
fn lowerBound(key: u32) -> u32 {
  var first = 0u; var last = BODY_COUNT;
  while (first < last) {
    let middle = first + (last - first) / 2u;
    if (sortedKeys[middle] < key) { first = middle + 1u; } else { last = middle; }
  }
  return first;
}
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  let sphere = positions[index];
  var contactCount = 0u;
  var candidateCount = 0u;
  if (isValidSphere(sphere)) {
    let cell = getCell(sphere.xyz);
    ${allPairs ? 'let neighborCount = 1u;' : 'let neighborCount = 27u;'}
    for (var neighborIndex = 0u; neighborIndex < neighborCount; neighborIndex++) {
      let neighborCell = cell + vec3i(i32(neighborIndex % 3u) - 1,
        i32((neighborIndex / 3u) % 3u) - 1, i32(neighborIndex / 9u) - 1);
      let key = hashCell(neighborCell);
      var cursor = ${allPairs ? '0u' : 'lowerBound(key)'};
      while (cursor < BODY_COUNT) {
        ${allPairs ? '' : 'if (sortedKeys[cursor] != key) { break; }'}
        let other = ${allPairs ? 'cursor' : 'sortedBodies[cursor]'};
        cursor++;
        if (other == index) { continue; }
        let neighbor = positions[other];
        ${allPairs ? '' : 'if (any(getCell(neighbor.xyz) != neighborCell)) { continue; }'}
        if (!isValidSphere(neighbor)) { continue; }
        if (velocities[index].w <= 0.0 && velocities[other].w <= 0.0) { continue; }
        ${mode === 'count' ? 'candidateCount++;' : ''}
        let delta = sphere.xyz - neighbor.xyz;
        let radius = sphere.w + neighbor.w;
        if (dot(delta, delta) > (radius + settings.solver.z) * (radius + settings.solver.z)) { continue; }
        ${
          mode === 'emit'
            ? `if (contactCount < MAXIMUM_CONTACTS) {
          let closing = dot(velocities[index].xyz - velocities[other].xyz, getContactNormal(delta, index, other));
          let bounce = select(0.0, -settings.material.y * closing,
            closing < -settings.solver.y && length(delta) <= radius);
          contacts[offsets[index] + contactCount] = vec2u(other, bitcast<u32>(bounce));
        }`
            : ''
        }
        contactCount++;
      }
    }
  }
  ${
    mode === 'count'
      ? `counts[index] = min(contactCount, MAXIMUM_CONTACTS);
    if (contactCount > MAXIMUM_CONTACTS) {
      var current = atomicLoad(&diagnostics[0]);
      loop {
        let next = current + min(contactCount - MAXIMUM_CONTACTS, 0xffffffffu - current);
        let result = atomicCompareExchangeWeak(&diagnostics[0], current, next);
        if (result.exchanged) {break;} current = result.old_value;
      }
    }
    var currentCandidates = atomicLoad(&diagnostics[5]);
    loop {
      let next = currentCandidates + min(candidateCount, 0xffffffffu - currentCandidates);
      let result = atomicCompareExchangeWeak(&diagnostics[5], currentCandidates, next);
      if (result.exchanged) {break;} currentCandidates = result.old_value;
    }
    atomicMax(&diagnostics[6], contactCount);`
      : 'atomicAdd(&diagnostics[2], min(contactCount, MAXIMUM_CONTACTS));'
  }
}
`;
}

export const SOLVE_SPHERE_CONTACTS = /* wgsl */ `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read> offsets: array<u32>;
@group(0) @binding(5) var<storage, read> contacts: array<vec2u>;
@group(0) @binding(6) var<storage, read_write> outputPositions: array<vec4f>;
@group(0) @binding(7) var<storage, read_write> outputVelocities: array<vec4f>;
@group(0) @binding(8) var<storage, read_write> outputAngularVelocities: array<vec4f>;
fn getFrictionImpulse(relative: vec3f, normal: vec3f, normalImpulse: f32, denominator: f32) -> vec3f {
  let tangent = relative - normal * dot(relative, normal);
  let speed = length(tangent);
  if (speed < 0.000001 || normalImpulse <= 0.0) { return vec3f(0.0); }
  let stoppingImpulse = speed / denominator;
  let limit = select(settings.material.w * normalImpulse, stoppingImpulse,
    stoppingImpulse <= settings.material.z * normalImpulse);
  return -tangent * min(stoppingImpulse, limit) / speed;
}
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  let sphere = positions[index];
  let velocity = velocities[index];
  let angular = angularVelocities[index];
  var point = sphere.xyz; var linearVelocity = velocity.xyz; var angularVelocity = angular.xyz;
  if (velocity.w > 0.0 && isValidSphere(sphere)) {
    let inverseInertia = 2.5 * velocity.w / (sphere.w * sphere.w);
    for (var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
      let contact = contacts[cursor]; let other = contact.x;
      let neighbor = positions[other]; let neighborVelocity = velocities[other];
      let delta = sphere.xyz - neighbor.xyz; let distance = length(delta);
      let normal = getContactNormal(delta, index, other);
      if (distance > sphere.w + neighbor.w) { continue; }
      if (distance > sphere.w + neighbor.w + settings.solver.z) { continue; }
      let inverseMass = velocity.w + max(neighborVelocity.w, 0.0);
      let degree = max(1u, max(offsets[index + 1u] - offsets[index], offsets[other + 1u] - offsets[other]));
      let relaxation = 1.0 / f32(degree);
      let penetration = max(sphere.w + neighbor.w - distance - settings.solver.z * 0.1, 0.0);
      point += normal * penetration * velocity.w / inverseMass * settings.solver.w * relaxation;
      let relative = velocity.xyz + cross(angular.xyz, -normal * sphere.w) -
        neighborVelocity.xyz - cross(angularVelocities[other].xyz, normal * neighbor.w);
      let normalImpulse = max((bitcast<f32>(contact.y) - dot(relative, normal)) / inverseMass, 0.0);
      let tangentImpulse = getFrictionImpulse(relative, normal, normalImpulse, 3.5 * inverseMass);
      linearVelocity += (normal * normalImpulse + tangentImpulse) * velocity.w * relaxation;
      angularVelocity += cross(-normal * sphere.w, tangentImpulse) * inverseInertia * relaxation;
    }
    let floorDelta = getFloorDelta(point);
    let floorDistance = length(floorDelta);
    let signedHeight = dot(point, settings.normal.xyz) - settings.normal.w;
    if (signedHeight > -sphere.w && floorDistance <= sphere.w + settings.solver.z) {
      let normal = select(settings.normal.xyz, floorDelta / max(floorDistance, 0.000001), signedHeight > 0.0);
      point += normal * max(sphere.w - floorDistance, 0.0);
      let relative = linearVelocity + cross(angularVelocity, -normal * sphere.w);
      let closing = dot(relative, normal);
      let bounce = select(0.0, -settings.material.y * closing, closing < -settings.solver.y);
      let normalImpulse = max((bounce - closing) / velocity.w, 0.0);
      let tangentImpulse = getFrictionImpulse(relative, normal, normalImpulse, 3.5 * velocity.w);
      linearVelocity += (normal * normalImpulse + tangentImpulse) * velocity.w;
      angularVelocity += cross(-normal * sphere.w, tangentImpulse) * inverseInertia;
    }
  }
  outputPositions[index] = vec4f(point, sphere.w);
  outputVelocities[index] = vec4f(linearVelocity, velocity.w);
  outputAngularVelocities[index] = vec4f(angularVelocity, angular.w);
}
`;

export const FINALIZE_SPHERES = /* wgsl */ `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> orientations: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> sleepStates: array<vec4f>;
@group(0) @binding(6) var<storage, read> offsets: array<u32>;
@group(0) @binding(7) var<storage, read> contacts: array<vec2u>;
@group(0) @binding(8) var<storage, read_write> diagnostics: array<atomic<u32>>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= BODY_COUNT) { return; }
  let sphere = positions[index]; var velocity = velocities[index];
  var angular = angularVelocities[index]; var sleep = sleepStates[index];
  if (velocity.w <= 0.0 || !isValidSphere(sphere)) { return; }
  let grounded = length(getFloorDelta(sphere.xyz)) <= sphere.w + settings.solver.z &&
    dot(sphere.xyz, settings.normal.xyz) - settings.normal.w >= 0.0;
  var supported = grounded;
  for (var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
    let neighbor = positions[contacts[cursor].x];
    supported = supported || distance(sphere.xyz, neighbor.xyz) <= sphere.w + neighbor.w + settings.solver.z;
  }
  if (grounded) {
    let normalVelocity = settings.normal.xyz * dot(velocity.xyz, settings.normal.xyz);
    let tangentVelocity = velocity.xyz - normalVelocity;
    let speed = max(length(tangentVelocity), length(angular.xyz) * sphere.w);
    let damping = max(0.0, 1.0 - settings.resting.x * length(settings.gravity.xyz) * settings.material.x / max(speed, 0.000001));
    velocity = vec4f(normalVelocity + tangentVelocity * damping, velocity.w);
    angular = vec4f(angular.xyz * damping, angular.w);
  }
  if (supported && length(velocity.xyz) < settings.resting.y && length(angular.xyz) < settings.resting.z) {
    sleep.x += settings.material.x;
  } else { sleep.x = 0.0; }
  if (settings.solver.x > 0.0 && sleep.x >= settings.solver.x) {
    velocity = vec4f(0.0, 0.0, 0.0, velocity.w); angular = vec4f(0.0);
    atomicAdd(&diagnostics[4], 1u);
  } else { atomicAdd(&diagnostics[3], 1u); }
  var orientation = orientations[index];
  if (dot(orientation, orientation) < 0.000001) { orientation = vec4f(0.0, 0.0, 0.0, 1.0); }
  let derivative = vec4f(orientation.w * angular.xyz + cross(angular.xyz, orientation.xyz), -dot(angular.xyz, orientation.xyz));
  orientations[index] = normalize(orientation + derivative * (0.5 * settings.material.x));
  velocities[index] = velocity; angularVelocities[index] = angular; sleepStates[index] = sleep;
}
`;
