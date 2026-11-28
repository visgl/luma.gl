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
import type {GPURigidBodyShape} from './rigid-body-properties';
import type {GPUArticulationTree} from './gpu-articulation-tree';

/** Collider in link-local coordinates. Capsule axes follow local Y. */
export type GPUArticulationCollider = {
  link: string;
  /** Clip box faces to a patch of up to four contact rows. */
  faceManifold?: boolean;
  position?: readonly [number, number, number];
  orientation?: readonly [number, number, number, number];
  shape: Extract<GPURigidBodyShape, {type: 'sphere' | 'capsule' | 'box'}>;
};

/** Register indexed link colliders or a small pair of fingertip pads against world boxes. */
export type GPUArticulationWorldContact = {
  tree: GPUArticulationTree;

  /** Pad coefficient combined geometrically with sliding friction on each box. */
  friction: number;
} & (
  | {
      pads: readonly [{link: string; radius: number}, {link: string; radius: number}];
      colliders?: never;
    }
  | {colliders: readonly GPUArticulationCollider[]; pads?: never}
);

export const worldBoxDeclaration = `
struct WorldBox { position:vec4f, rotation:vec4f, velocity:vec4f, spin:vec4f,
  inverseInertia:vec4f, principal:vec4f, shape:vec4f, offset:vec4f, localRotation:vec4f, material:vec4f }
`;

/** Gather after gravity and scatter before the world solves ordinary contacts and integrates poses. */
export function addArticulationWorldContacts<P>(
  graph: GPUCommandGraph<P>,
  id: string,
  contact: GPUArticulationWorldContact,
  order: Uint32Array,
  bindings: readonly {name: string; resource: GraphBufferHandle}[]
) {
  const count = order.length;
  const indexed = Boolean(contact.colliders);
  const boxes = graph.createTransientBuffer({
    id: id + '-articulation-boxes',
    byteLength: (count + (indexed ? Math.ceil(count / 8) : 0)) * 160,
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
      (indexed
        ? `const bodyOrder=array<u32,${count}>(${Array.from(order, i => i + 'u').join(',')});
      var<workgroup> lower:array<vec3f,8>;var<workgroup> upper:array<vec3f,8>;`
        : '') +
      `@compute @workgroup_size(${indexed ? 8 : 64}) fn main(@builtin(global_invocation_id) invocation:vec3u,@builtin(local_invocation_index) lane:u32){
      let row=invocation.x;
      ${indexed && gather ? 'lower[lane]=vec3f(1e30);upper[lane]=vec3f(-1e30);' : ''}
      if(row<${count}u){let i=${indexed ? 'bodyOrder[row]' : 'row'};
      ${
        gather
          ? `let collider=${count * 3}u+6u*i;
      boxes[row]=WorldBox(positions[i],orientations[i],velocities[i],angularVelocities[i],bodies[3u*i],bodies[3u*i+1u],bodies[collider],bodies[collider+1u],bodies[collider+2u],bodies[collider+3u]);`
          : `if(any(boxes[row].velocity.xyz!=velocities[i].xyz)||any(boxes[row].spin.xyz!=angularVelocities[i].xyz)){
        velocities[i]=boxes[row].velocity;angularVelocities[i]=boxes[row].spin;sleepStates[i]=vec4f(0,0,sleepStates[i].zw);
      }`
      }
    }
    ${
      indexed && gather
        ? `if(row<${count}u){
      let box=boxes[row]; let q=box.rotation;let v=box.offset.xyz;
      let center=box.position.xyz+v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);
      let extent=vec3f(length(box.shape.xyz)+0.001);
      lower[lane]=center-extent;upper[lane]=center+extent;
      boxes[row].material.w=f32(bodyOrder[row]);
    }
    workgroupBarrier();
    if(lane==0u){var lo=lower[0];var hi=upper[0];for(var j=1u;j<8u;j++){lo=min(lo,lower[j]);hi=max(hi,upper[j]);}
    boxes[${count}u+row/8u].position=vec4f(lo,0);boxes[${count}u+row/8u].shape=vec4f(hi,0);}`
        : ''
    }
    }`;
    const props = {source, shaderLayout: layout};
    const executable = (bound: BoundKernel): GPUCommandGraphComputeExecutable<P> => ({
      encode: ({computePass, getBuffer}) => {
        const resources: Record<string, Binding> = {};
        names.forEach((name, index) => {
          resources[name] = getBuffer(handles[index]);
        });
        bound.kernel.dispatch(computePass, {
          bindings: resources,
          x: Math.ceil(count / (indexed ? 8 : 64))
        });
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
  contact.tree.addToGraph(graph, {
    boxes,
    count,
    pads: contact.pads,
    colliders: contact.colliders,
    friction: contact.friction
  });
  transfer(false);
}
