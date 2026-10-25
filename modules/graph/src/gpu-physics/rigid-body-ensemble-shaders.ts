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

export function getEnsembleShader(
  bodyCount: number,
  colliderCount: number,
  bodiesPerInstance?: number,
  collidersPerInstance?: number
): string {
  if (!bodiesPerInstance || !collidersPerInstance)
    return `
fn bodyScheduled(body:u32)->bool{return true;}
fn colliderScheduled(collider:u32)->bool{return true;}
fn scheduledBody(index:u32)->u32{return index;}
fn scheduledCollider(index:u32)->u32{return index;}
fn scheduledBodyCount()->u32{return BODY_COUNT;}
fn scheduledColliderCount()->u32{return COLLIDER_COUNT;}
`;
  const instances = bodyCount / bodiesPerInstance;
  return /* wgsl */ `
const INSTANCE_COUNT:u32=${instances}u;
const INSTANCE_BODIES:u32=${bodiesPerInstance}u;
const INSTANCE_COLLIDERS:u32=${collidersPerInstance}u;
const INSTANCE_QUEUE:u32=${16 + instances * 8}u;
@group(0) @binding(28) var<storage,read_write> ensemble:array<atomic<u32>>;
fn bodyScheduled(body:u32)->bool{return atomicLoad(&ensemble[16u+(body/INSTANCE_BODIES)*8u+1u])!=0u;}
fn colliderScheduled(collider:u32)->bool{return atomicLoad(&ensemble[16u+(collider/INSTANCE_COLLIDERS)*8u+1u])!=0u;}
fn scheduledBodyCount()->u32{return atomicLoad(&ensemble[0])*INSTANCE_BODIES;}
fn scheduledColliderCount()->u32{return atomicLoad(&ensemble[0])*INSTANCE_COLLIDERS;}
fn scheduledBody(index:u32)->u32{return atomicLoad(&ensemble[INSTANCE_QUEUE+index/INSTANCE_BODIES])*INSTANCE_BODIES+index%INSTANCE_BODIES;}
fn scheduledCollider(index:u32)->u32{return atomicLoad(&ensemble[INSTANCE_QUEUE+index/INSTANCE_COLLIDERS])*INSTANCE_COLLIDERS+index%INSTANCE_COLLIDERS;}
@compute @workgroup_size(64) fn ensembleClear(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=INSTANCE_COUNT){return;}
 atomicStore(&ensemble[16u+instance*8u+1u],0u);
 atomicStore(&ensemble[16u+instance*8u+4u],0u);
 if(instance==0u){atomicStore(&ensemble[0],0u);}
}
@compute @workgroup_size(64) fn ensembleMark(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=BODY_COUNT){return;}let instance=body/INSTANCE_BODIES;
 if(atomicLoad(&ensemble[16u+instance*8u])==0u){return;}
 if((dynamic(body)&&sleepStates[body].y<0.5)||bodies.bodies[body].motion.x==2.0){atomicStore(&ensemble[16u+instance*8u+1u],1u);}
}
@compute @workgroup_size(64) fn ensembleCompact(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=INSTANCE_COUNT){return;}
 if(atomicLoad(&ensemble[16u+instance*8u+1u])!=0u){let slot=atomicAdd(&ensemble[0],1u);atomicStore(&ensemble[INSTANCE_QUEUE+slot],instance);}
}
@compute @workgroup_size(1) fn ensembleDispatch(){
 // Keep one invocation for shared mesh-task counter initialization even when no bodies run.
 atomicStore(&ensemble[4],max(1u,(scheduledBodyCount()+63u)/64u));atomicStore(&ensemble[5],1u);atomicStore(&ensemble[6],1u);
 atomicStore(&ensemble[8],(scheduledColliderCount()+63u)/64u);atomicStore(&ensemble[9],1u);atomicStore(&ensemble[10],1u);
}
`;
}

/** Indirect arguments may share a buffer with read-only storage, never writable storage. */
export function readOnlyEnsembleShader(source: string): string {
  return source
    .replace(
      /@compute @workgroup_size\(64\) fn ensembleClear[\s\S]*?atomicStore\(&ensemble\[10\],1u\);\n}/,
      ''
    )
    .replace(
      'var<storage,read_write> ensemble:array<atomic<u32>>',
      'var<storage,read> ensemble:array<u32>'
    )
    .replace(/atomicLoad\(&ensemble\[([^\]]+)\]\)/g, 'ensemble[$1]');
}

/** Attribute accepted/rejected participation without claiming isolation from shared overflow. */
export function addEnsembleStatus<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  instances: number,
  ensemble: {buffer: Buffer; resource: GraphBufferHandle},
  statistics: {buffer: Buffer; resource: GraphBufferHandle}
) {
  const properties = {
    id: `${id}-ensemble-status`,
    source: `
@group(0) @binding(0) var<storage,read_write> ensemble:array<u32>;
@group(0) @binding(1) var<storage,read> statistics:array<u32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let instance=invocation.x;if(instance>=${instances}u){return;}
 let offset=16u+instance*8u;let failed=statistics[1]!=0u||statistics[15]!=0u;
 ensemble[offset+4u]=select(0u,1u,failed);
 if(ensemble[offset+1u]==0u){return;}
 let counter=offset+select(2u,3u,failed);
 if(ensemble[counter]!=0xffffffffu){ensemble[counter]++;}
}`,
    shaderLayout: {
      bindings: [
        {name: 'ensemble', group: 0, location: 0, type: 'storage' as const},
        {name: 'statistics', group: 0, location: 1, type: 'read-only-storage' as const}
      ]
    },
    bindings: {ensemble: ensemble.buffer, statistics: statistics.buffer}
  };
  const executable = (computation: Computation): GPUCommandGraphComputeExecutable<Parameters> => ({
    encode: ({computePass}) => computation.dispatch(computePass, Math.ceil(instances / 64)),
    destroy: () => computation.destroy()
  });
  graph.addComputePass({
    id: properties.id,
    description: 'Record per-instance participation and shared rollback status.',
    resources: [
      {buffer: ensemble.resource, usage: 'storage-read-write'},
      {buffer: statistics.resource, usage: 'storage-read'}
    ],
    compile: ({device}) => executable(new Computation(device, properties)),
    compileAsync: async ({device}) => executable(await Computation.createAsync(device, properties))
  });
}
