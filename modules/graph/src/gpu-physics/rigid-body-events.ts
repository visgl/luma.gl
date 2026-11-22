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

/** Publish contact transitions from committed instances in the current step. */
export function getRigidBodyEventShader(
  capacity: number,
  impulseThreshold: number,
  rollback = false,
  pairsPerInstance?: number
): string {
  return /* wgsl */ `
${rollback ? '@group(0) @binding(14) var<storage,read> eventStatistics:array<u32>;' : ''}
struct ContactEvent { stamp:vec4u, identifiers:vec4u, point:vec4f, normal:vec4f }
struct EventRing { sequence:u32, step:u32, saturated:u32, reserved:u32, entries:array<ContactEvent,${capacity}> }
@group(0) @binding(12) var<storage,read_write> contactHistory:array<vec4u>;
@group(0) @binding(13) var<storage,read_write> contactEvents:EventRing;
const CONTACT_END:u32=1u;
const CONTACT_BEGIN:u32=2u;
const CONTACT_IMPACT:u32=4u;
const CONTACT_PROCESS:u32=8u;

fn eventCommit()->bool{
 return ${rollback ? 'eventStatistics[1]==0u&&eventStatistics[15]==0u' : 'true'};
}
fn contactImpulse(pair:u32)->vec2f{
 var impulse=0.0;var strongest=0u;
 for(var contact=0u;contact<manifolds[pair].count;contact++){
  impulse+=max(0.0,manifolds[pair].contacts[contact].impulse.x);
  if(manifolds[pair].contacts[contact].impulse.x>manifolds[pair].contacts[strongest].impulse.x){strongest=contact;}
 }
 return vec2f(impulse,f32(strongest));
}
fn eventClassify(pair:u32)->u32{
 if(!eventCommit()){return 0u;}
 ${
   pairsPerInstance
     ? `let instance=pair/${pairsPerInstance}u;
 if(instance>=INSTANCE_COUNT||atomicLoad(&ensemble[16u+instance*8u+7u])!=0u){return 0u;}`
     : ''
 }
 let first=getFirstCollider(pair);let second=getSecondCollider(pair);
 if(!colliderScheduled(first)){return 0u;}
 let previous=contactHistory[pair];let hasContact=manifolds[pair].count>0u;
 let same=previous.x==first&&previous.y==second;
 var flags=CONTACT_PROCESS;
 if(previous.z!=0u&&(!hasContact||!same)){flags|=CONTACT_END;}
 if(hasContact){
  if(previous.z==0u||!same){flags|=CONTACT_BEGIN;}
  else if(contactImpulse(pair).x>${impulseThreshold}){flags|=CONTACT_IMPACT;}
 }
 return flags;
}
fn eventCount(flags:u32)->u32{return countOneBits(flags&7u);}
fn emitContact(sequence:u32,step:u32,first:u32,second:u32,phase:u32,point:vec3f,normal:vec3f,impulse:f32){
 let slot=(sequence-1u)%${capacity}u;
 contactEvents.entries[slot]=ContactEvent(vec4u(sequence,step,phase,0),vec4u(colliderBody(first),colliderBody(second),first,second),vec4f(point,impulse),vec4f(normal,0));
}
fn eventPublish(pair:u32,flags:u32,offset:u32,reservation:vec3u){
 if((flags&CONTACT_PROCESS)==0u){return;}
 let first=getFirstCollider(pair);let second=getSecondCollider(pair);
 if((flags&CONTACT_END)!=0u){
  let sequence=retainedEventSequence(reservation,offset);
  if(sequence!=0u){
   let previous=contactHistory[pair];
   emitContact(sequence,reservation.z,previous.x,previous.y,2u,vec3f(0),vec3f(0),0);
  }
 }
 if((flags&(CONTACT_BEGIN|CONTACT_IMPACT))!=0u){
  let sequence=retainedEventSequence(reservation,offset+select(0u,1u,(flags&CONTACT_END)!=0u));
  if(sequence!=0u){
   let impulse=contactImpulse(pair);
   let contact=manifolds[pair].contacts[u32(impulse.y)];
   let phase=select(1u,0u,(flags&CONTACT_BEGIN)!=0u);
   emitContact(sequence,reservation.z,first,second,phase,contact.point.xyz,contact.normal.xyz,impulse.x);
  }
 }
 contactHistory[pair]=vec4u(first,second,select(0u,1u,manifolds[pair].count>0u),0u);
}
`;
}
