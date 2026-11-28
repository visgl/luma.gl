// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding, type ShaderLayout} from '@luma.gl/core';
import type {GPUCommandGraph, GraphBufferHandle} from '../gpu-core/gpu-command-graph';
import type {GPUCommandGraphComputeExecutable} from '../gpu-core/gpu-command-graph-types';
import {
  createBoundKernel,
  createBoundKernelAsync,
  type BoundKernel
} from '../gpu-core/utils/bound-kernel';
import type {GPUArticulationTree} from './gpu-articulation-tree';

/** Couple two link-centered spherical pads to box colliders in the world at graph construction. */
export type GPUArticulationWorldContact = {
  tree: GPUArticulationTree;
  pads: readonly [{link: string; radius: number}, {link: string; radius: number}];
  /** Pad coefficient combined geometrically with sliding friction on each box. */
  friction: number;
};

export const worldBoxDeclaration = `
struct WorldBox { position:vec4f, rotation:vec4f, velocity:vec4f, spin:vec4f,
  inverseInertia:vec4f, principal:vec4f, shape:vec4f, offset:vec4f, localRotation:vec4f, material:vec4f }
`;

/** Gather after gravity and scatter before the world solves ordinary contacts and integrates poses. */
export function addArticulationWorldContacts<P>(
  graph: GPUCommandGraph<P>,
  id: string,
  contact: GPUArticulationWorldContact,
  count: number,
  bindings: readonly {name: string; resource: GraphBufferHandle}[]
) {
  const boxes = graph.createTransientBuffer({
    id: id + '-articulation-boxes',
    byteLength: count * 160,
    usage: Buffer.STORAGE
  });
  const transfer = (gather: boolean) => {
    const fields = gather
      ? ['positions', 'orientations', 'velocities', 'angularVelocities', 'bodies']
      : ['velocities', 'angularVelocities', 'sleepStates'];
    const names = ['boxes', ...fields];
    const handles = [
      boxes,
      ...fields.map(name => bindings.find(binding => binding.name === name)!.resource)
    ];
    const writable = names.map((_, i) => (gather ? i === 0 : i !== 0));
    const layout: ShaderLayout = {
      attributes: [],
      bindings: names.map((name, location) => ({
        name,
        location,
        group: 0,
        type: writable[location] ? 'storage' : 'read-only-storage'
      }))
    };
    const source =
      worldBoxDeclaration +
      names
        .map(
          (name, index) =>
            `@group(0) @binding(${index}) var<storage,${writable[index] ? 'read_write' : 'read'}> ${name}:array<${index === 0 ? 'WorldBox' : 'vec4f'}>;`
        )
        .join('\n') +
      `@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) invocation:vec3u){
      let i=invocation.x;if(i>=${count}u){return;}
      ${
        gather
          ? `let collider=${count * 3}u+6u*i;
      boxes[i]=WorldBox(positions[i],orientations[i],velocities[i],angularVelocities[i],bodies[3u*i],bodies[3u*i+1u],bodies[collider],bodies[collider+1u],bodies[collider+2u],bodies[collider+3u]);`
          : `if(velocities[i].w>0.0 && (any(boxes[i].velocity.xyz!=velocities[i].xyz)||any(boxes[i].spin.xyz!=angularVelocities[i].xyz))){
        velocities[i]=boxes[i].velocity;angularVelocities[i]=boxes[i].spin;sleepStates[i]=vec4f(0,0,sleepStates[i].zw);
      }`
      }
    }`;
    const props = {source, shaderLayout: layout};
    const executable = (bound: BoundKernel): GPUCommandGraphComputeExecutable<P> => ({
      encode: ({computePass, getBuffer}) => {
        const resources: Record<string, Binding> = {};
        names.forEach((name, index) => {
          resources[name] = getBuffer(handles[index]);
        });
        bound.kernel.dispatch(computePass, {bindings: resources, x: Math.ceil(count / 64)});
      },
      destroy: () => bound.kernel.destroy()
    });
    graph.addComputePass({
      id: id + (gather ? '-gather-boxes' : '-apply-pad-impulses'),
      resources: handles.map((buffer, index) => ({
        buffer,
        usage: writable[index] ? 'storage-read-write' : 'storage-read'
      })),
      compile: ({device}) => executable(createBoundKernel(device, props)),
      compileAsync: async ({device}) => executable(await createBoundKernelAsync(device, props))
    });
  };
  transfer(true);
  contact.tree.addToGraph(graph, {boxes, count, pads: contact.pads, friction: contact.friction});
  transfer(false);
}
