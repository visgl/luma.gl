// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Contact events refer to stable construction-time body/collider indices. */
export type GPURigidBodyContactEvent = {
  sequence: number;
  step: number;
  phase: 'begin' | 'impact' | 'end';
  bodies: [number, number];
  colliders: [number, number];
  point: [number, number, number];
  normal: [number, number, number];
  normalImpulse: number;
};
export type GPURigidBodyContactBatch = {
  sequence: number;
  step: number;
  dropped: number;
  saturated: boolean;
  events: GPURigidBodyContactEvent[];
};

/** Decode one coherent ring snapshot. Counters saturate rather than wrap. */
export function decodeRigidBodyContactEvents(
  data: Uint32Array,
  cursor = 0
): GPURigidBodyContactBatch {
  const capacity = (data.length - 4) / 16;
  const sequence = data[0];
  const start = Math.max(cursor, sequence - capacity);
  const floats = new Float32Array(data.buffer, data.byteOffset, data.length);
  const events: GPURigidBodyContactEvent[] = [];
  for (let index = start; index < sequence; index++) {
    const offset = 4 + (index % capacity) * 16;
    events.push({
      sequence: data[offset],
      step: data[offset + 1],
      phase: data[offset + 2] === 0 ? 'begin' : data[offset + 2] === 1 ? 'impact' : 'end',
      bodies: [data[offset + 4], data[offset + 5]],
      colliders: [data[offset + 6], data[offset + 7]],
      point: [floats[offset + 8], floats[offset + 9], floats[offset + 10]],
      normalImpulse: floats[offset + 11],
      normal: [floats[offset + 12], floats[offset + 13], floats[offset + 14]]
    });
  }
  return {
    sequence,
    step: data[1],
    dropped: Math.max(0, sequence - cursor - capacity),
    saturated: data[2] !== 0,
    events
  };
}

export function getRigidBodyEventShader(
  capacity: number,
  impulseThreshold: number,
  rollback = false
): string {
  return /* wgsl */ `
${rollback ? '@group(0) @binding(14) var<storage,read> eventStatistics:array<u32>;' : ''}
struct ContactEvent { stamp:vec4u, identifiers:vec4u, point:vec4f, normal:vec4f }
struct EventRing { sequence:u32, step:u32, saturated:u32, reserved:u32, entries:array<ContactEvent,${capacity}> }
@group(0) @binding(12) var<storage,read_write> contactHistory:array<vec4u>;
@group(0) @binding(13) var<storage,read_write> contactEvents:EventRing;
fn emitContact(first:u32,second:u32,phase:u32,point:vec3f,normal:vec3f,impulse:f32){
 if(contactEvents.sequence==0xffffffffu){contactEvents.saturated=1u;return;}
 let slot=contactEvents.sequence%${capacity}u;contactEvents.sequence++;
 contactEvents.entries[slot]=ContactEvent(vec4u(contactEvents.sequence,contactEvents.step,phase,0),vec4u(colliderBody(first),colliderBody(second),first,second),vec4f(point,impulse),vec4f(normal,0));
}
@compute @workgroup_size(1) fn recordContacts(){
 ${rollback ? 'if(eventStatistics[1]!=0u||eventStatistics[15]!=0u){return;}' : ''}
 if(contactEvents.step==0xffffffffu){contactEvents.saturated=1u;return;}contactEvents.step++;
 for(var pair=0u;pair<PAIR_CAPACITY;pair++){
  let previous=contactHistory[pair];let hasContact=manifolds[pair].count>0u;
  let first=getFirstCollider(pair);let second=getSecondCollider(pair);
  let same=previous.x==first&&previous.y==second;
  if(previous.z!=0u&&(!hasContact||!same)){emitContact(previous.x,previous.y,2u,vec3f(0),vec3f(0),0);}
  if(hasContact){
   var impulse=0.0;var strongest=0u;
   for(var contact=0u;contact<manifolds[pair].count;contact++){
    impulse+=max(0.0,manifolds[pair].contacts[contact].impulse.x);
    if(manifolds[pair].contacts[contact].impulse.x>manifolds[pair].contacts[strongest].impulse.x){strongest=contact;}
   }
   let contact=manifolds[pair].contacts[strongest];
   if(previous.z==0u||!same){emitContact(first,second,0u,contact.point.xyz,contact.normal.xyz,impulse);}
   else if(impulse>${impulseThreshold}){emitContact(first,second,1u,contact.point.xyz,contact.normal.xyz,impulse);}
  }
  contactHistory[pair]=vec4u(first,second,select(0u,1u,hasContact),0u);
 }
}`;
}
