// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GraphBufferHandle,
  GPUCommandGraphComputeExecutable
} from '../gpu-core/gpu-command-graph';
import type {GPURigidBodyCollider} from './rigid-body-properties';
import {RIGID_BODY_QUERY_GEOMETRY_SHADER} from './rigid-body-query-geometry';

export type GPURigidBodyTrigger = {
  /** Union of spherical sensor colliders; one enter/exit state per target body. */
  colliders: readonly number[];
  /** Target collider selection; defaults to all non-sensor colliders. */
  targets?: readonly number[];
  /** Detect complete crossings for sphere targets using linear relative center trajectories. */
  swept?: boolean;
};
export type GPURigidBodyTriggerEvent = {
  sequence: number;
  step: number;
  phase: 'enter' | 'exit';
  trigger: number;
  body: number;
  collider: number;
  triggerCollider: number;
  swept: boolean;
};
export type GPURigidBodyTriggerBatch = {
  sequence: number;
  step: number;
  dropped: number;
  saturated: boolean;
  events: GPURigidBodyTriggerEvent[];
};

export function makeRigidBodyTriggerLayout(
  triggers: readonly GPURigidBodyTrigger[],
  colliders: readonly (GPURigidBodyCollider & {body: number})[]
) {
  const groups: number[] = [];
  const pairs: number[] = [];
  for (const [triggerIndex, trigger] of triggers.entries()) {
    const sources = [...new Set(trigger.colliders)];
    if (
      !sources.length ||
      sources.some(
        index =>
          !Number.isInteger(index) ||
          !colliders[index]?.isTrigger ||
          colliders[index].shape.type !== 'sphere'
      )
    )
      throw new Error('Triggers require sphere sensor colliders');
    const selected = [
      ...new Set(
        trigger.targets ??
          colliders.flatMap((collider, index) => (collider.isTrigger ? [] : [index]))
      )
    ];
    if (
      selected.some(
        index =>
          !Number.isInteger(index) ||
          !colliders[index] ||
          (trigger.swept && colliders[index].shape.type !== 'sphere')
      )
    )
      throw new Error('Invalid trigger targets');
    const bodyIndices = [...new Set(selected.map(index => colliders[index].body))];
    for (const body of bodyIndices) {
      const start = pairs.length / 2;
      for (const source of sources)
        for (const target of selected) {
          if (colliders[target].body === body && colliders[source].body !== body)
            pairs.push(source, target);
        }
      const count = pairs.length / 2 - start;
      if (count) groups.push(triggerIndex, body, start, count | (trigger.swept ? 0x80000000 : 0));
    }
  }
  if (groups.length / 4 > 65536 || pairs.length / 2 > 65536)
    throw new Error('Trigger pair capacity exceeded');
  return {
    groups: new Uint32Array(groups.length ? groups : [0, 0, 0, 0]),
    pairs: new Uint32Array(pairs.length ? pairs : [0, 0]),
    count: groups.length / 4
  };
}
export function decodeRigidBodyTriggerEvents(
  data: Uint32Array,
  cursor = 0
): GPURigidBodyTriggerBatch {
  const capacity = (data.length - 4) / 8;
  const sequence = data[0];
  const events: GPURigidBodyTriggerEvent[] = [];
  for (let index = Math.max(cursor, sequence - capacity); index < sequence; index++) {
    const offset = 4 + (index % capacity) * 8;
    events.push({
      sequence: data[offset],
      step: data[offset + 1],
      phase: data[offset + 2] === 0 ? 'enter' : 'exit',
      swept: data[offset + 3] !== 0,
      trigger: data[offset + 4],
      body: data[offset + 5],
      triggerCollider: data[offset + 6],
      collider: data[offset + 7]
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
type BoundBuffer = {name: string; buffer: Buffer; resource: GraphBufferHandle; location: number};
export function addRigidBodyTriggers<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  source: string,
  colliderCount: number,
  layout: ReturnType<typeof makeRigidBodyTriggerLayout>,
  capacity: number,
  bindings: BoundBuffer[],
  statistics: BoundBuffer,
  allocate: (name: string, data: number | Uint32Array) => Buffer
) {
  const allocations = [
    {name: 'triggerPrevious', key: 'trigger-previous', data: colliderCount * 16},
    {name: 'triggerGroups', key: 'trigger-groups', data: layout.groups},
    {name: 'triggerPairs', key: 'trigger-pairs', data: layout.pairs},
    {name: 'triggerSamples', key: 'trigger-samples', data: Math.max(1, layout.count) * 16},
    {name: 'triggerHistory', key: 'trigger-history', data: Math.max(1, layout.count) * 16},
    {name: 'triggerEvents', key: 'trigger-events', data: 16 + capacity * 32}
  ];
  const extras = allocations.map((item, index) => {
    const buffer = allocate(item.key, item.data);
    return {
      name: item.name,
      buffer,
      location: 12 + index,
      resource: graph.importBuffer(
        {id: `${id}-${item.key}`, byteLength: buffer.byteLength, usage: Buffer.STORAGE},
        buffer
      )
    };
  });
  const shader =
    source +
    RIGID_BODY_QUERY_GEOMETRY_SHADER +
    /* wgsl */ `
@group(0) @binding(12) var<storage,read_write> triggerPrevious:array<vec4f>;
@group(0) @binding(13) var<storage,read> triggerGroups:array<vec4u>;
@group(0) @binding(14) var<storage,read> triggerPairs:array<vec2u>;
@group(0) @binding(15) var<storage,read_write> triggerSamples:array<vec4u>;
@group(0) @binding(16) var<storage,read_write> triggerHistory:array<vec4u>;
struct TriggerRecord {stamp:vec4u,identifiers:vec4u}
struct TriggerRing {sequence:u32,step:u32,saturated:u32,reserved:u32,entries:array<TriggerRecord,${capacity}>}
@group(0) @binding(17) var<storage,read_write> triggerEvents:TriggerRing;
@group(0) @binding(18) var<storage,read> triggerStatistics:array<u32>;
@compute @workgroup_size(64) fn saveTriggers(@builtin(global_invocation_id) invocation:vec3u){let collider=invocation.x;if(collider<COLLIDER_COUNT){triggerPrevious[collider]=vec4f(colliderPosition(collider),0);}}
@compute @workgroup_size(64) fn sampleTriggers(@builtin(global_invocation_id) invocation:vec3u){
 let index=invocation.x;if(index>=${layout.count}u){return;}let group=triggerGroups[index];var overlapping=false;var crossed=false;var incomplete=false;var selected=vec2u(0);
 for(var offset=0u;offset<(group.w&0x7fffffffu);offset++){
  let pair=triggerPairs[group.z+offset];if(excludes(pair.x,pair.y)||excludes(pair.y,pair.x)){continue;}
  let center=colliderLocal(pair.y,colliderPosition(pair.x)-colliderPosition(pair.y));
  let targetShape=bodies.colliders[pair.y].shape;if(targetShape.w==6.0&&targetShape.z==0.0&&center.y<0.0){continue;}
  let surface=closestSurface(pair.y,center);let radius=bodies.colliders[pair.x].shape.x;
  incomplete=incomplete||surface.complete==0u;
  if(surface.distance<=radius){overlapping=true;selected=pair;}
  if((group.w&0x80000000u)!=0u){
   let start=triggerPrevious[pair.y].xyz-triggerPrevious[pair.x].xyz;
   let finish=colliderPosition(pair.y)-colliderPosition(pair.x);
   let distance=length(closestSegment(vec3f(0),start,finish));
   if(distance<=radius+bodies.colliders[pair.y].shape.x){crossed=true;if(!overlapping){selected=pair;}}
  }
 }
 triggerSamples[index]=vec4u(select(0u,1u,overlapping)|select(0u,2u,crossed)|select(0u,4u,incomplete),selected,0u);
}
fn emitTrigger(group:vec4u,pair:vec2u,phase:u32,swept:u32){
 if(triggerEvents.sequence==0xffffffffu){triggerEvents.saturated=1u;return;}
 let slot=triggerEvents.sequence%${capacity}u;triggerEvents.sequence++;
 triggerEvents.entries[slot]=TriggerRecord(vec4u(triggerEvents.sequence,triggerEvents.step,phase,swept),vec4u(group.x,group.y,pair));
}
@compute @workgroup_size(1) fn publishTriggers(){
 if(triggerStatistics[1]!=0u||triggerStatistics[15]!=0u){return;}
 if(triggerEvents.step==0xffffffffu){triggerEvents.saturated=1u;return;}triggerEvents.step++;
 for(var index=0u;index<${layout.count}u;index++){
  let sample=triggerSamples[index];let previous=triggerHistory[index];let group=triggerGroups[index];
  let overlapping=(sample.x&1u)!=0u;let prior=(previous.x&1u)!=0u;
  if(overlapping&&!prior){emitTrigger(group,sample.yz,0u,0u);}
  if(!overlapping&&prior){emitTrigger(group,previous.yz,1u,0u);}
  if(!overlapping&&!prior&&(sample.x&2u)!=0u){emitTrigger(group,sample.yz,0u,1u);emitTrigger(group,sample.yz,1u,1u);}
  triggerHistory[index]=sample;
 }
}
`;
  const addStage = (entryPoint: string, names: string[], count: number) => {
    const selected = [...bindings, ...extras, statistics].filter(binding =>
      names.includes(binding.name)
    );
    const readOnly = ['bodies', 'triggerGroups', 'triggerPairs', 'triggerStatistics'];
    const properties = {
      id: `${id}-${entryPoint}`,
      source: shader,
      entryPoint,
      shaderLayout: {
        bindings: selected.map(binding => ({
          name: binding.name,
          location: binding.location,
          group: 0,
          type: readOnly.includes(binding.name)
            ? ('read-only-storage' as const)
            : ('storage' as const)
        }))
      },
      bindings: Object.fromEntries(selected.map(binding => [binding.name, binding.buffer]))
    };
    const executable = (
      computation: Computation
    ): GPUCommandGraphComputeExecutable<Parameters> => ({
      encode: ({computePass}) => {
        computation.dispatch(computePass, Math.max(1, Math.ceil(count / 64)));
      },
      destroy: () => computation.destroy()
    });
    graph.addComputePass({
      id: properties.id,
      resources: selected.map(binding => ({
        buffer: binding.resource,
        usage: readOnly.includes(binding.name)
          ? ('storage-read' as const)
          : ('storage-read-write' as const)
      })),
      compile: () => executable(new Computation(graph.device, properties)),
      compileAsync: async () => executable(await Computation.createAsync(graph.device, properties))
    });
  };
  addStage(
    'saveTriggers',
    ['positions', 'orientations', 'bodies', 'triggerPrevious'],
    colliderCount
  );
  return {
    events: extras[5].buffer,
    samples: {buffer: extras[3].buffer, resource: extras[3].resource, count: layout.count},
    sample: () =>
      addStage(
        'sampleTriggers',
        [
          'positions',
          'orientations',
          'bodies',
          'triggerPrevious',
          'triggerGroups',
          'triggerPairs',
          'triggerSamples'
        ],
        layout.count
      ),
    publish: () =>
      addStage(
        'publishTriggers',
        ['triggerStatistics', 'triggerGroups', 'triggerSamples', 'triggerHistory', 'triggerEvents'],
        1
      )
  };
}
