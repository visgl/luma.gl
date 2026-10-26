// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/gpgpu';
import type {
  GPUCommandGraph,
  GPUCommandGraphComputeExecutable,
  GraphBufferHandle
} from '../gpu-core/gpu-command-graph';

/** Lifetime counters: sampling less often than simulation never hides incomplete steps. */
export type GPURigidBodySimulationDiagnostics = {
  steps: number;
  incompleteSteps: number;
  droppedPairs: number;
  droppedManifolds: number;
  incompleteQueries: number;
  invalidBounds: number;
  droppedTriangleQueries: number;
  unresolvedQueries: number;
  incompleteIslandUnions: number;
  incompleteMeshQueries: number;
  incompleteContinuousBodies: number;
  incompleteTriggerQueries: number;
  invalidBodyStates: number;
  maximumCandidatePairs: number;
  maximumCandidateTests: number;
  saturated: boolean;
  complete: boolean;
};

export function decodeRigidBodySimulationDiagnostics(
  values: ArrayLike<number>
): GPURigidBodySimulationDiagnostics {
  return {
    steps: values[0],
    incompleteSteps: values[1],
    droppedPairs: values[2],
    droppedManifolds: values[3],
    incompleteQueries: values[4],
    invalidBounds: values[5],
    droppedTriangleQueries: values[6],
    unresolvedQueries: values[7],
    incompleteIslandUnions: values[8],
    incompleteMeshQueries: values[11],
    incompleteContinuousBodies: values[12],
    incompleteTriggerQueries: values[13],
    invalidBodyStates: values[14],
    maximumCandidatePairs: values[9],
    maximumCandidateTests: values[10],
    saturated: values[15] !== 0,
    complete: values[1] === 0 && values[15] === 0
  };
}

type DiagnosticSource = {buffer: Buffer; resource: GraphBufferHandle};

/** One single-invocation dispatch per step; no contact scan or host synchronization. */
export function addRigidBodyDiagnostics<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  statistics: Buffer,
  inputs: {
    statisticsResource?: GraphBufferHandle;
    continuous?: DiagnosticSource & {count: number};
    triggers?: DiagnosticSource & {count: number};
    validity?: DiagnosticSource & {count: number};
    broadPhase?: DiagnosticSource & {wordOffset: number};
    targets?: DiagnosticSource & {wordOffset: number};
    meshTasks?: DiagnosticSource;
    parallelState?: DiagnosticSource;
  }
): void {
  const sources = [
    ...(inputs.broadPhase ? [{name: 'discovery', ...inputs.broadPhase}] : []),
    ...(inputs.targets ? [{name: 'cache', ...inputs.targets}] : []),
    ...(inputs.meshTasks ? [{name: 'mesh', ...inputs.meshTasks}] : []),
    ...(inputs.parallelState ? [{name: 'islands', ...inputs.parallelState}] : []),
    ...(inputs.continuous ? [{name: 'continuous', ...inputs.continuous}] : []),
    ...(inputs.triggers ? [{name: 'triggers', ...inputs.triggers}] : []),
    ...(inputs.validity ? [{name: 'validity', ...inputs.validity}] : [])
  ];
  const bindings = [
    {
      name: 'statistics',
      buffer: statistics,
      resource:
        inputs.statisticsResource ??
        graph.importBuffer(
          {id, byteLength: statistics.byteLength, usage: Buffer.STORAGE},
          statistics
        )
    },
    ...sources
  ];
  const source = /* wgsl */ `
${bindings.map(({name}, index) => `@group(0) @binding(${index}) var<storage,${index === 0 ? 'read_write' : 'read'}> ${name}:array<u32>;`).join('\n')}
fn accumulate(index:u32,value:u32){
 let previous=statistics[index];
 if(value>0xffffffffu-previous){statistics[index]=0xffffffffu;statistics[15]=1u;}
 else {statistics[index]=previous+value;}
}
@compute @workgroup_size(1) fn record(){
 var failures:array<u32,7>;
 ${inputs.broadPhase ? `failures[0]=discovery[${inputs.broadPhase.wordOffset + 1}u];failures[2]=discovery[${inputs.broadPhase.wordOffset + 6}u];failures[3]=discovery[${inputs.broadPhase.wordOffset + 2}u];statistics[9]=max(statistics[9],discovery[${inputs.broadPhase.wordOffset}u]);statistics[10]=max(statistics[10],discovery[${inputs.broadPhase.wordOffset + 3}u]);` : ''}
 ${inputs.targets ? `failures[1]=cache[${inputs.targets.wordOffset}u];` : ''}
 ${inputs.meshTasks ? 'failures[4]=mesh[1];failures[5]=mesh[2];' : ''}
 ${inputs.parallelState ? 'failures[6]=islands[0];' : ''}
 var incomplete=false;
 for(var index=0u;index<7u;index++){accumulate(index+2u,failures[index]);incomplete=incomplete||failures[index]>0u;}
 ${inputs.meshTasks ? 'accumulate(11u,mesh[3]);incomplete=incomplete||mesh[3]>0u;' : ''}
 ${inputs.continuous ? `for(var body=0u;body<${inputs.continuous.count}u;body++){let failure=continuous[body*4u];accumulate(12u,failure);incomplete=incomplete||failure!=0u;}` : ''}
 ${inputs.triggers ? `for(var group=0u;group<${inputs.triggers.count}u;group++){let failure=select(0u,1u,(triggers[group*4u]&4u)!=0u);accumulate(13u,failure);incomplete=incomplete||failure!=0u;}` : ''}
 ${inputs.validity ? `for(var body=0u;body<${inputs.validity.count}u;body++){accumulate(14u,validity[body]);incomplete=incomplete||validity[body]!=0u;}` : ''}
 accumulate(0u,1u);if(incomplete){accumulate(1u,1u);}
}`;
  const properties = {
    id,
    source,
    entryPoint: 'record',
    shaderLayout: {
      bindings: bindings.map(({name}, location) => ({
        name,
        location,
        group: 0,
        type: location === 0 ? ('storage' as const) : ('read-only-storage' as const)
      }))
    },
    bindings: Object.fromEntries(bindings.map(({name, buffer}) => [name, buffer]))
  };
  const executable = (computation: Computation): GPUCommandGraphComputeExecutable<Parameters> => ({
    encode: ({computePass}) => computation.dispatch(computePass, 1),
    destroy: () => computation.destroy()
  });
  graph.addComputePass({
    id,
    workload: {commandCount: 1},
    description: 'Summarize contacts, solver limits, and simulation failures for diagnostics.',
    resources: bindings.map(({resource}, index) => ({
      buffer: resource,
      usage: index === 0 ? ('storage-read-write' as const) : ('storage-read' as const)
    })),
    compile: ({device}) => executable(new Computation(device, properties)),
    compileAsync: async ({device}) => executable(await Computation.createAsync(device, properties))
  });
}
