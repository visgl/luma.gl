// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type BoundKernel,
  createBoundKernel,
  createBoundKernelAsync
} from '../gpu-core/utils/bound-kernel';
import {Buffer, type CommandEncoder} from '@luma.gl/core';
import {Matrix4} from '@math.gl/core';
import {normalizeRigidBodyRotation} from './rigid-body-properties';

import type {
  GPUCommandGraph,
  GPUCommandGraphComputeExecutable
} from '../gpu-core/gpu-command-graph';
import type {GraphBufferHandle} from '../gpu-core/gpu-command-graph';
import type {GPURigidBody} from './rigid-body-properties';

export type GPURigidBodyBounds = readonly [
  readonly [number, number, number],
  readonly [number, number, number]
];

/** Publish accepted body-node transforms and conservative world AABBs after rollback. */
export function addRigidBodyPosePublication<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  bodies: readonly GPURigidBody[],
  bounds: readonly GPURigidBodyBounds[],
  positions: {buffer: Buffer; resource: GraphBufferHandle},
  orientations: {buffer: Buffer; resource: GraphBufferHandle},
  allocate: (name: string, data: number | Float32Array) => Buffer
) {
  const inputs = new Float32Array(bodies.length * 12);
  for (const [index, body] of bodies.entries()) {
    inputs.set(
      [...(body.centerOfMass ?? [0, 0, 0]), 0, ...bounds[index][0], 0, ...bounds[index][1], 0],
      index * 12
    );
  }
  const metadata = allocate('pose-metadata', inputs);
  const initialMatrices = new Float32Array(bodies.length * 16);
  for (const [index, body] of bodies.entries())
    initialMatrices.set(
      new Matrix4()
        .translate(body.position)
        .multiplyRight(new Matrix4().fromQuaternion(normalizeRigidBodyRotation(body.orientation))),
      index * 16
    );
  const matrices = allocate('pose-matrices', initialMatrices);
  const worldBounds = allocate('pose-bounds', bodies.length * 32);
  const imported = (name: string, buffer: Buffer) => ({
    buffer,
    resource: graph.importBuffer(
      {id: `${id}-${name}`, byteLength: buffer.byteLength, usage: Buffer.STORAGE},
      buffer
    )
  });
  const entries = {
    positions,
    orientations,
    metadata: imported('pose-metadata', metadata),
    matrices: imported('pose-matrices', matrices),
    worldBounds: imported('pose-bounds', worldBounds)
  };
  const properties = {
    id: `${id}-publish-poses`,
    source: `
struct Bounds {minimum:vec4f,maximum:vec4f}
struct Metadata {center:vec4f,minimum:vec4f,maximum:vec4f}
@group(0) @binding(0) var<storage,read> positions:array<vec4f>;
@group(0) @binding(1) var<storage,read> orientations:array<vec4f>;
@group(0) @binding(2) var<storage,read> metadata:array<Metadata>;
@group(0) @binding(3) var<storage,read_write> matrices:array<mat4x4f>;
@group(0) @binding(4) var<storage,read_write> worldBounds:array<Bounds>;
fn rotate(rotation:vec4f,point:vec3f)->vec3f{return point+2.0*cross(rotation.xyz,cross(rotation.xyz,point)+rotation.w*point);}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
 let body=invocation.x;if(body>=${bodies.length}u){return;}
 let rotation=orientations[body];let origin=positions[body].xyz-rotate(rotation,metadata[body].center.xyz);
 let horizontal=rotate(rotation,vec3f(1,0,0));let vertical=rotate(rotation,vec3f(0,1,0));let depth=rotate(rotation,vec3f(0,0,1));
 matrices[body]=mat4x4f(vec4f(horizontal,0),vec4f(vertical,0),vec4f(depth,0),vec4f(origin,1));
 let center=(metadata[body].minimum.xyz+metadata[body].maximum.xyz)*0.5;let extent=(metadata[body].maximum.xyz-metadata[body].minimum.xyz)*0.5;
 let worldCenter=origin+rotate(rotation,center);let worldExtent=abs(horizontal)*extent.x+abs(vertical)*extent.y+abs(depth)*extent.z;
 worldBounds[body]=Bounds(vec4f(worldCenter-worldExtent,0),vec4f(worldCenter+worldExtent,0));
}`,
    shaderLayout: {
      bindings: Object.keys(entries).map((name, location) => ({
        name,
        group: 0,
        location,
        type: location < 3 ? ('read-only-storage' as const) : ('storage' as const)
      }))
    },
    bindings: Object.fromEntries(
      Object.entries(entries).map(([name, entry]) => [name, entry.buffer])
    )
  };
  let publicationComputation: BoundKernel;
  const executable = (computation: BoundKernel): GPUCommandGraphComputeExecutable<Parameters> => {
    publicationComputation = computation;
    return {
      encode: ({computePass}) => {
        computation.kernel.dispatch(computePass, {
          bindings: computation.bindings,
          x: Math.ceil(bodies.length / 64)
        });
      },
      destroy: () => computation.kernel.destroy()
    };
  };
  graph.addComputePass({
    id: properties.id,
    resources: Object.values(entries).map((entry, index) => ({
      buffer: entry.resource,
      usage: index < 3 ? ('storage-read' as const) : ('storage-write' as const)
    })),
    compile: () => executable(createBoundKernel(graph.device, properties)),
    compileAsync: async () => executable(await createBoundKernelAsync(graph.device, properties))
  });
  return {
    matrices,
    bounds: worldBounds,
    encode: (encoder: CommandEncoder) => {
      const pass = encoder.beginComputePass();
      publicationComputation.kernel.dispatch(pass, {
        bindings: publicationComputation.bindings,
        x: Math.ceil(bodies.length / 64)
      });
      pass.end();
    }
  };
}
