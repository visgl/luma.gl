// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GPUCommandGraph, GraphBufferHandle} from '../gpu-core/gpu-command-graph';

type Resource = {buffer: Buffer; resource: GraphBufferHandle};

/** Snapshot active bodies and journal contact writes without changing shared failure semantics. */
export function addEnsembleCheckpoint<GraphParameters>(
  graph: GPUCommandGraph<GraphParameters>,
  id: string,
  states: Resource[],
  statistics: Resource,
  ensemble: Resource,
  manifolds: Resource,
  bodiesPerInstance: number,
  maximumPairs: number,
  allocate: (name: string, byteLength: number) => Buffer
) {
  const bodyCount = states[0].buffer.byteLength / 16;
  const instances = bodyCount / bodiesPerInstance;
  const targets = states[5];
  const headOffset = bodyCount * 8 + 8 + maximumPairs * 2;
  const linkOffset = headOffset + instances * 2;
  const journalOffset = bodyCount * 8 + 8 + maximumPairs * 4 + instances * 2;
  const savedKeyOffset = journalOffset + maximumPairs;
  const savedLinkOffset = savedKeyOffset + maximumPairs * 2;
  const savedHeadOffset = savedLinkOffset + maximumPairs;
  const savedHeaderOffset = savedHeadOffset + instances * 2;
  const importAllocation = (name: string, byteLength: number): Resource => {
    const buffer = allocate(name, byteLength);
    return {
      buffer,
      resource: graph.importBuffer(
        {id: buffer.id, byteLength, usage: Buffer.STORAGE | Buffer.COPY_DST},
        buffer
      )
    };
  };
  const snapshots = states
    .slice(0, 5)
    .map((state, index) => importAllocation(`checkpoint-${index}`, state.buffer.byteLength));
  const validity = importAllocation('state-validity', bodyCount * 4);
  type Input = Resource & {name: string; writable?: boolean};
  const addCompute = (name: string, inputs: Input[], source: string, indirect = false) => {
    const properties = {
      id: `${id}-${name}`,
      entryPoint: 'main',
      source: `${inputs.map((input, location) => `@group(0) @binding(${location}) var<storage,${input.writable ? 'read_write' : 'read'}> ${input.name}:array<u32>;`).join('\n')}\n${source}`,
      shaderLayout: {
        bindings: inputs.map((input, location) => ({
          name: input.name,
          group: 0,
          location,
          type: input.writable ? ('storage' as const) : ('read-only-storage' as const)
        }))
      },
      bindings: Object.fromEntries(inputs.map(input => [input.name, input.buffer]))
    };
    const executable = (computation: Computation) => ({
      encode: ({computePass}: {computePass: Parameters<Computation['dispatch']>[0]}) => {
        if (indirect) computation.dispatchIndirect(computePass, ensemble.buffer, 16);
        else computation.dispatch(computePass, 1);
      },
      destroy: () => computation.destroy()
    });
    graph.addComputePass({
      id: properties.id,
      workload: {commandCount: 1},
      resources: [
        ...inputs.map(input => ({
          buffer: input.resource,
          usage: input.writable ? ('storage-read-write' as const) : ('storage-read' as const)
        })),
        ...(indirect ? [{buffer: ensemble.resource, usage: 'indirect' as const}] : [])
      ],
      compile: () => executable(new Computation(graph.device, properties)),
      compileAsync: async () => executable(await Computation.createAsync(graph.device, properties))
    });
  };
  const bodyAddress = `let work=invocation.x;if(work>=ensemble[0]*${bodiesPerInstance}u){return;}
 let body=ensemble[${16 + instances * 8}u+work/${bodiesPerInstance}u]*${bodiesPerInstance}u+work%${bodiesPerInstance}u;`;
  const save = () => {
    addCompute(
      'checkpoint-metadata',
      [
        {...targets, name: 'targets', writable: true},
        {...ensemble, name: 'ensemble'}
      ],
      `
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(invocation.x<8u){targets[${savedHeaderOffset}u+invocation.x]=targets[${bodyCount * 8}u+invocation.x];}
 for(var work=invocation.x;work<ensemble[0];work+=64u){
  let instance=ensemble[${16 + instances * 8}u+work];
  targets[${savedHeadOffset}u+instance]=targets[${headOffset}u+instance];
  targets[${savedHeadOffset + instances}u+instance]=targets[${headOffset + instances}u+instance];
 }
}`
    );
    states.slice(0, 5).forEach((state, index) =>
      addCompute(
        `checkpoint-${index}`,
        [
          {...state, name: 'state'},
          {...snapshots[index], name: 'snapshot', writable: true},
          {...ensemble, name: 'ensemble'}
        ],
        `@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 ${bodyAddress}
 for(var word=0u;word<4u;word++){snapshot[body*4u+word]=state[body*4u+word];}
}`,
        true
      )
    );
  };
  const restore = () => {
    // Restore payloads before allocator metadata, which contains this step's changed-slot queue.
    addCompute(
      'rollback-contacts',
      [
        {...manifolds, name: 'manifolds', writable: true},
        {...targets, name: 'targets'},
        {...statistics, name: 'statistics'}
      ],
      `
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 let count=targets[${bodyCount * 8 + 5}u];
 for(var work=invocation.x;work<count*104u;work+=64u){
  let pair=targets[${journalOffset}u+work/104u];let word=work%104u;
  manifolds[pair*104u+word]=targets[${savedHeaderOffset + 8}u+pair*104u+word];
 }
}`
    );
    addCompute(
      'rollback-allocator',
      [
        {...targets, name: 'targets', writable: true},
        {...ensemble, name: 'ensemble'},
        {...statistics, name: 'statistics'}
      ],
      `
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 let count=targets[${bodyCount * 8 + 5}u];
 for(var index=invocation.x;index<count;index+=64u){let pair=targets[${journalOffset}u+index];
  targets[${bodyCount * 8 + 8}u+pair*2u]=targets[${savedKeyOffset}u+pair*2u];
  targets[${bodyCount * 8 + 9}u+pair*2u]=targets[${savedKeyOffset + 1}u+pair*2u];
  targets[${linkOffset}u+pair]=targets[${savedLinkOffset}u+pair];
 }
 for(var work=invocation.x;work<ensemble[0];work+=64u){let instance=ensemble[${16 + instances * 8}u+work];
  targets[${headOffset}u+instance]=targets[${savedHeadOffset}u+instance];
  targets[${headOffset + instances}u+instance]=targets[${savedHeadOffset + instances}u+instance];
 }
 storageBarrier();
 // Preserve the attempted step's journal list and counters so the next prepare can clear its marks.
 if(invocation.x<5u){targets[${bodyCount * 8}u+invocation.x]=targets[${savedHeaderOffset}u+invocation.x];}
}`
    );
    states.slice(0, 5).forEach((state, index) =>
      addCompute(
        `rollback-${index}`,
        [
          {...state, name: 'state', writable: true},
          {...snapshots[index], name: 'snapshot'},
          {...statistics, name: 'statistics'},
          {...ensemble, name: 'ensemble'}
        ],
        `@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 ${bodyAddress}
 for(var word=0u;word<4u;word++){state[body*4u+word]=snapshot[body*4u+word];}
}`,
        true
      )
    );
  };
  const validate = () =>
    addCompute(
      'validate',
      [
        ...states.slice(0, 4).map((state, index) => ({
          ...state,
          name: ['positions', 'orientations', 'velocities', 'angularVelocities'][index]
        })),
        {...validity, name: 'validity', writable: true},
        {...ensemble, name: 'ensemble'}
      ],
      `
var<workgroup> invalid:atomic<u32>;
fn finite(value:u32)->bool{return abs(bitcast<f32>(value))<=3.402823466e38;}
@compute @workgroup_size(64) fn main(@builtin(local_invocation_index) invocation:u32){
 if(invocation==0u){atomicStore(&invalid,0u);}workgroupBarrier();
 for(var work=invocation;work<ensemble[0]*${bodiesPerInstance}u;work+=64u){
  let body=ensemble[${16 + instances * 8}u+work/${bodiesPerInstance}u]*${bodiesPerInstance}u+work%${bodiesPerInstance}u;
  var valid=true;
  for(var word=0u;word<4u;word++){let address=body*4u+word;valid=valid&&finite(positions[address])&&finite(orientations[address])&&finite(velocities[address])&&finite(angularVelocities[address]);}
  if(!valid){atomicAdd(&invalid,1u);}
 }
 workgroupBarrier();if(invocation==0u){validity[0]=atomicLoad(&invalid);}
}`
    );
  return {save, restore, validate, validity: {...validity, count: 1}};
}
