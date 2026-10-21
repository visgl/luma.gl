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

type TransactionBuffer = {buffer: Buffer; resource: GraphBufferHandle};

/** Keep failed steps out of published poses and persistent solver state, entirely on the GPU. */
export function addRigidBodyCheckpoint<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  states: TransactionBuffer[],
  statistics: TransactionBuffer,
  allocate: (name: string, byteLength: number) => Buffer
) {
  const snapshots = states.map((state, index) => {
    const buffer = allocate(`checkpoint-${index}`, state.buffer.byteLength);
    return {
      ...state,
      snapshot: buffer,
      snapshotResource: graph.importBuffer(
        {
          id: `${id}-checkpoint-${index}`,
          byteLength: buffer.byteLength,
          usage: Buffer.STORAGE | Buffer.COPY_DST
        },
        buffer
      )
    };
  });
  graph.addCopyPass({
    id: `${id}-checkpoint`,
    resources: snapshots.flatMap(state => [
      {buffer: state.resource, usage: 'copy-source' as const},
      {buffer: state.snapshotResource, usage: 'copy-destination' as const}
    ]),
    compile: () => ({
      encode: ({commandEncoder, getBuffer}) => {
        for (const state of snapshots)
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(state.resource),
            destinationBuffer: getBuffer(state.snapshotResource),
            size: state.buffer.byteLength
          });
      }
    })
  });
  const restore = () => {
    const properties = snapshots.map((state, index) => {
      const workgroups = Math.ceil(state.buffer.byteLength / 256);
      const horizontal = Math.min(workgroups, graph.device.limits.maxComputeWorkgroupsPerDimension);
      return {
        id: `${id}-restore-${index}`,
        entryPoint: 'restore',
        source: /* wgsl */ `
@group(0) @binding(0) var<storage,read_write> state:array<u32>;
@group(0) @binding(1) var<storage,read> snapshot:array<u32>;
@group(0) @binding(2) var<storage,read> statistics:array<u32>;
@compute @workgroup_size(64) fn restore(@builtin(global_invocation_id) invocation:vec3u){
 if(statistics[1]==0u&&statistics[15]==0u){return;}
 let index=invocation.x+invocation.y*${horizontal * 64}u;
 if(index<arrayLength(&state)){state[index]=snapshot[index];}
}`,
        shaderLayout: {
          bindings: [
            {name: 'state', group: 0, location: 0, type: 'storage' as const},
            {name: 'snapshot', group: 0, location: 1, type: 'read-only-storage' as const},
            {name: 'statistics', group: 0, location: 2, type: 'read-only-storage' as const}
          ]
        },
        bindings: {state: state.buffer, snapshot: state.snapshot, statistics: statistics.buffer},
        horizontal,
        vertical: Math.ceil(workgroups / horizontal)
      };
    });
    const executable = (
      computations: Computation[]
    ): GPUCommandGraphComputeExecutable<Parameters> => ({
      encode: ({computePass}) => {
        for (const [index, computation] of computations.entries())
          computation.dispatch(
            computePass,
            properties[index].horizontal,
            properties[index].vertical
          );
      },
      destroy: () => {
        for (const computation of computations) computation.destroy();
      }
    });
    graph.addComputePass({
      id: `${id}-rollback`,
      resources: [
        {buffer: statistics.resource, usage: 'storage-read'},
        ...snapshots.flatMap(state => [
          {buffer: state.resource, usage: 'storage-read-write' as const},
          {buffer: state.snapshotResource, usage: 'storage-read' as const}
        ])
      ],
      compile: () =>
        executable(properties.map(properties => new Computation(graph.device, properties))),
      compileAsync: async () =>
        executable(
          await Promise.all(
            properties.map(properties => Computation.createAsync(graph.device, properties))
          )
        )
    });
  };
  const validity = allocate('state-validity', states[0].buffer.byteLength / 4);
  const validityResource = graph.importBuffer(
    {id: `${id}-state-validity`, byteLength: validity.byteLength, usage: Buffer.STORAGE},
    validity
  );
  const validate = () => {
    const source = /* wgsl */ `
@group(0) @binding(0) var<storage,read> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(2) var<storage,read> velocities:array<vec4f>;
@group(0) @binding(3) var<storage,read> angularVelocities:array<vec4f>;
@group(0) @binding(4) var<storage,read_write> validity:array<u32>;
fn finite(value:vec4f)->bool{return all(abs(value)<=vec4f(3.402823466e38));}
@compute @workgroup_size(64) fn validate(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=arrayLength(&positions)){return;}
 validity[body]=select(1u,0u,finite(positions[body])&&finite(orientations[body])&&finite(velocities[body])&&finite(angularVelocities[body]));
}`;
    const names = ['positions', 'orientations', 'velocities', 'angularVelocities'];
    const properties = {
      id: `${id}-validate`,
      source,
      entryPoint: 'validate',
      shaderLayout: {
        bindings: [
          ...names.map((name, location) => ({
            name,
            group: 0,
            location,
            type: 'read-only-storage' as const
          })),
          {name: 'validity', group: 0, location: 4, type: 'storage' as const}
        ]
      },
      bindings: {
        ...Object.fromEntries(names.map((name, index) => [name, states[index].buffer])),
        validity
      }
    };
    const executable = (
      computation: Computation
    ): GPUCommandGraphComputeExecutable<Parameters> => ({
      encode: ({computePass}) => {
        computation.dispatch(computePass, Math.ceil(states[0].buffer.byteLength / 1024));
      },
      destroy: () => computation.destroy()
    });
    graph.addComputePass({
      id: properties.id,
      resources: [
        ...states
          .slice(0, 4)
          .map(state => ({buffer: state.resource, usage: 'storage-read' as const})),
        {buffer: validityResource, usage: 'storage-read-write'}
      ],
      compile: () => executable(new Computation(graph.device, properties)),
      compileAsync: async () => executable(await Computation.createAsync(graph.device, properties))
    });
  };
  return {
    restore,
    validate,
    validity: {
      buffer: validity,
      resource: validityResource,
      count: states[0].buffer.byteLength / 16
    }
  };
}
