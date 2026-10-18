// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Directed sphere/plane contacts retain identity independently of CSR ordering. */
export const PERSISTENT_CONTACT_HEADER = /* wgsl */ `
struct PersistentContact {
 identity: vec2u, impulse: f32, step: u32,
 tangent: vec4f, normal: vec4f,
};
`;

/** Keep the default compact discrete solver unchanged. */
export function makePersistentContactShader(source: string): string {
  return (
    PERSISTENT_CONTACT_HEADER +
    source
      .replaceAll('array<vec2u>', 'array<PersistentContact>')
      .replaceAll('contact.x', 'contact.identity.x')
      .replaceAll('contact.y', 'contact.identity.y')
      .replace(
        '= vec2u(other, bitcast<u32>(bounce));',
        '= PersistentContact(vec2u(other, bitcast<u32>(bounce)), 0.0, 0u, vec4f(0.0), vec4f(0.0));'
      )
  );
}

export const RESTORE_SPHERE_CONTACTS = /* wgsl */ `
@group(0) @binding(5) var<storage, read> velocities: array<vec4f>;
@group(0) @binding(6) var<storage, read> angularVelocities: array<vec4f>;
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> contacts: array<PersistentContact>;
@group(0) @binding(4) var<storage, read> cache: array<PersistentContact>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT || clock.timeStep <= 0.0) {return;}
 for(var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
  let other = contacts[cursor].identity.x;
  let normal = getContactNormal(positions[index].xyz - positions[other].xyz, index, other);
  let previous = cache[index * (BODY_COUNT + 32u) + other];
  // Reject stale pairs, changed normals and restitution impacts. Never seed a new impact.
  if(ALLOW_WARM && distance(positions[index].xyz, positions[other].xyz) <= positions[index].w + positions[other].w &&
     previous.step == clock.step - 1u && previous.tangent.w > 0.0 &&
     dot(previous.normal.xyz, normal) > 0.98 && bitcast<f32>(contacts[cursor].identity.y) == 0.0) {
   let scale = min(clock.timeStep / previous.tangent.w, 1.0);
   contacts[cursor].impulse = previous.impulse * scale;
   let tangent = previous.tangent.xyz - normal * dot(previous.tangent.xyz, normal);
   contacts[cursor].tangent = vec4f(tangent * scale, 0.0);
  }
  contacts[cursor].normal = vec4f(normal, 0.0);
 }
 let sphere = positions[index];
 for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
  let slot = BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex;
  var contact = PersistentContact(vec2u(planeIndex, 0u), 0.0, 0u, vec4f(0.0), vec4f(0.0));
  let plane = settings.planes[planeIndex]; let delta = getPlaneDelta(sphere.xyz, plane);
  let signedHeight = dot(sphere.xyz, plane.normal.xyz) - plane.normal.w;
  if(isValidSphere(sphere) && velocities[index].w > 0.0 && signedHeight > -sphere.w && length(delta) <= sphere.w) {
   let outsideEdge = length(delta - plane.normal.xyz * signedHeight) > 0.000001;
   let rectangleNormal = select(plane.normal.xyz, delta / max(length(delta), 0.000001), signedHeight > 0.0 || outsideEdge);
   let upward = -settings.gravity.xyz + rectangleNormal * dot(settings.gravity.xyz, rectangleNormal);
   let height = select(0.0, plane.response.x, length(upward) > 0.000001);
   let normal = rectangleNormal * sqrt(1.0 - height * height) - upward / max(length(upward), 0.000001) * height;
   let relative = velocities[index].xyz + cross(angularVelocities[index].xyz, -normal * sphere.w);
   let closing = dot(relative, normal);
   let restitution = plane.material.x / (1.0 + plane.response.y * max(-closing, 0.0));
   let bounce = select(0.0, -restitution * closing, closing < -settings.solver.y);
   contact.identity.y = bitcast<u32>(bounce);
   contact.normal = vec4f(normal, 1.0);
   let previous = cache[index * (BODY_COUNT + 32u) + BODY_COUNT + planeIndex];
   if(ALLOW_WARM && previous.step == clock.step - 1u && previous.tangent.w > 0.0 &&
      dot(previous.normal.xyz, normal) > 0.98 && bounce == 0.0) {
    let scale = min(clock.timeStep / previous.tangent.w, 1.0);
    contact.impulse = previous.impulse * scale;
    contact.tangent = vec4f((previous.tangent.xyz - normal * dot(previous.tangent.xyz, normal)) * scale, 0.0);
   }
  }
  contacts[slot] = contact;
 }
}
`;

export const WARM_SPHERE_CONTACTS = /* wgsl */ `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> angularVelocities: array<vec4f>;
@group(0) @binding(4) var<storage, read> offsets: array<u32>;
@group(0) @binding(5) var<storage, read> contacts: array<PersistentContact>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT || clock.timeStep <= 0.0) {return;}
 let sphere = positions[index]; let inverseMass = velocities[index].w;
 if(!isValidSphere(sphere) || inverseMass <= 0.0) {return;}
 var linear = vec3f(0.0); var angular = vec3f(0.0);
 for(var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
  let contact = contacts[cursor]; let normal = contact.normal.xyz;
  linear += (normal * contact.impulse + contact.tangent.xyz) * inverseMass;
  angular += cross(-normal * sphere.w, contact.tangent.xyz) * 2.5 * inverseMass / (sphere.w * sphere.w);
 }
 for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
  let contact = contacts[BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex];
  if(contact.normal.w == 0.0) {continue;}
  linear += (contact.normal.xyz * contact.impulse + contact.tangent.xyz) * inverseMass;
  angular += cross(-contact.normal.xyz * sphere.w, contact.tangent.xyz) * 2.5 * inverseMass / (sphere.w * sphere.w);
 }
 velocities[index] = vec4f(velocities[index].xyz + linear, inverseMass);
 angularVelocities[index] = vec4f(angularVelocities[index].xyz + angular, angularVelocities[index].w);
}
`;

export function makeAccumulatedSphereSolver(source: string): string {
  return makePersistentContactShader(source)
    .replace('var<storage, read> contacts:', 'var<storage, read_write> contacts:')
    .replace(
      'if (distance > sphere.w + neighbor.w) { continue; }',
      'if (distance > sphere.w + neighbor.w && contact.impulse == 0.0 && all(contact.tangent.xyz == vec3f(0.0))) { continue; }'
    )
    .replace(
      'if (signedHeight > -sphere.w && floorDistance <= sphere.w) {',
      'if ((signedHeight > -sphere.w && floorDistance <= sphere.w) || contacts[BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex].impulse > 0.0) {'
    )
    .replace(
      'let normalImpulse = max((bitcast<f32>(contact.identity.y) - dot(relative, normal)) / inverseMass, 0.0);',
      `
      let accumulatedNormal = max(contact.impulse +
        (bitcast<f32>(contact.identity.y) - dot(relative, normal)) / inverseMass * relaxation, 0.0);
      let normalImpulse = accumulatedNormal - contact.impulse;`
    )
    .replace(
      'let tangentImpulse = getFrictionImpulse(frictionRelative, normal, normalImpulse, 3.5 * inverseMass, settings.material.z, settings.material.w);',
      `
      let slip = frictionRelative - normal * dot(frictionRelative, normal);
      var accumulatedTangent = contact.tangent.xyz - slip / (3.5 * inverseMass) * relaxation;
      let tangentLength = length(accumulatedTangent);
      let frictionLimit = select(settings.material.w * accumulatedNormal,
        tangentLength, tangentLength <= settings.material.z * accumulatedNormal);
      accumulatedTangent *= min(1.0, frictionLimit / max(tangentLength, 0.0000001));
      let tangentImpulse = accumulatedTangent - contact.tangent.xyz;
      contacts[cursor].impulse = accumulatedNormal;
      contacts[cursor].tangent = vec4f(accumulatedTangent, clock.timeStep);
      contacts[cursor].normal = vec4f(normal, 0.0);
      contacts[cursor].step = clock.step;`
    )
    .replace(
      '(normal * normalImpulse + tangentImpulse) * velocity.w * relaxation',
      '(normal * normalImpulse + tangentImpulse) * velocity.w'
    )
    .replace('tangentImpulse) * inverseInertia * relaxation', 'tangentImpulse) * inverseInertia')
    .replace(
      'let normalImpulse = max((bounce - closing) / normalMass, 0.0);',
      `
        let planeSlot = BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex;
        let constraint = contacts[planeSlot];
        // The restitution target is captured before any warm impulse is applied.
        let accumulatedNormal = max(constraint.impulse +
          (bitcast<f32>(constraint.identity.y) - closing) / normalMass, 0.0);
        let normalImpulse = accumulatedNormal - constraint.impulse;`
    )
    .replace(
      'let tangentImpulse = getFrictionImpulse(surfaceVelocity, normal, normalImpulse, tangentMass, plane.material.y, plane.material.z);',
      `
        var accumulatedTangent = constraint.tangent.xyz - tangent / tangentMass;
        let tangentLength = length(accumulatedTangent);
        let frictionLimit = select(plane.material.z * accumulatedNormal, tangentLength,
          tangentLength <= plane.material.y * accumulatedNormal);
        accumulatedTangent *= min(1.0, frictionLimit / max(tangentLength, 0.0000001));
        let tangentImpulse = accumulatedTangent - constraint.tangent.xyz;
        contacts[planeSlot].impulse = accumulatedNormal;
        contacts[planeSlot].tangent = vec4f(accumulatedTangent, clock.timeStep);
        contacts[planeSlot].normal = vec4f(normal, 1.0);
        contacts[planeSlot].step = clock.step;`
    );
}

export const STORE_SPHERE_CONTACTS = /* wgsl */ `
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
@group(0) @binding(2) var<storage, read> contacts: array<PersistentContact>;
@group(0) @binding(3) var<storage, read_write> cache: array<PersistentContact>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
 let index = invocation.x; if(index >= BODY_COUNT || clock.timeStep <= 0.0) {return;}
 for(var cursor = offsets[index]; cursor < offsets[index + 1u]; cursor++) {
  let contact = contacts[cursor];
  cache[index * (BODY_COUNT + 32u) + contact.identity.x] = contact;
 }
 for(var planeIndex = 0u; planeIndex < u32(settings.resting.w); planeIndex++) {
  cache[index * (BODY_COUNT + 32u) + BODY_COUNT + planeIndex] =
    contacts[BODY_COUNT * MAXIMUM_CONTACTS + index * 32u + planeIndex];
 }
}
`;
