// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type BindingDeclaration, type Device} from '@luma.gl/core';
import {GPUBVH} from '../gpu-core/gpu-bvh';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GraphBufferHandle
} from '../gpu-core/gpu-command-graph';
import {Kernel} from '../execution/compute/kernel';
import {getRigidBodyBatchCastShader} from './rigid-body-queries';
import {
  normalizeRigidBodyRotation,
  rotateRigidBodyVector,
  type GPURigidBody,
  type GPURigidBodyCollider
} from './rigid-body-properties';

/** Authored locality and stable query identities for a refittable index. */
export type RigidBodyCastOrder = {
  /** Collider IDs, with indexed primitives first. */
  indices: Uint32Array;
  /** Inverse permutation for sorting small explicit selections. */
  ranks: Uint32Array;
  /** Sphere and box count in the indexed prefix. */
  indexedCount: number;
};

/** Sort primitive leaves by position once. GPU refits preserve this order as bodies move. */
export function getRigidBodyCastOrder(
  colliders: readonly (GPURigidBodyCollider & {body: number})[],
  bodies: readonly GPURigidBody[]
): RigidBodyCastOrder {
  /** Separate the primitives whose exact intersection has no traversal budget. */
  const primitives: {index: number; center: number[]; key: number}[] = [];
  /** Retain direct traversal for extended shapes to preserve their completion status. */
  const extended: number[] = [];
  /** Authored center range for quantization. */
  const lower = [Infinity, Infinity, Infinity];
  /** Authored center range for quantization. */
  const upper = [-Infinity, -Infinity, -Infinity];
  for (const [index, collider] of colliders.entries()) {
    if (collider.shape.type !== 'sphere' && collider.shape.type !== 'box') {
      extended.push(index);
      continue;
    }
    /** Map compound offsets out of the authored body frame before ordering the leaves. */
    const body = bodies[collider.body];
    /** Collider translation relative to the authored body origin in world axes. */
    const offset = collider.position
      ? rotateRigidBodyVector(normalizeRigidBodyRotation(body.orientation), collider.position)
      : [0, 0, 0];
    /** Include each collider center even when one body owns several separated primitives. */
    const center = body.position.map((value, coordinate) => value + offset[coordinate]);
    for (let coordinate = 0; coordinate < 3; coordinate++) {
      lower[coordinate] = Math.min(lower[coordinate], center[coordinate]);
      upper[coordinate] = Math.max(upper[coordinate], center[coordinate]);
    }
    primitives.push({index, center, key: 0});
  }
  for (const primitive of primitives) {
    for (let coordinate = 0; coordinate < 3; coordinate++) {
      /** Ten bits per axis keep the Morton key inside a uint32. */
      const span = upper[coordinate] - lower[coordinate];
      /** Clamp the endpoint and handle a flat axis without dividing by zero. */
      const quantized =
        span > 0
          ? Math.floor(((primitive.center[coordinate] - lower[coordinate]) / span) * 1023)
          : 0;
      for (let bit = 0; bit < 10; bit++) {
        primitive.key |= ((quantized >> bit) & 1) << (3 * bit + coordinate);
      }
    }
  }
  primitives.sort((first, second) => first.key - second.key);
  /** Restore caller-facing collider identities after traversal. */
  const indices = Uint32Array.from([...primitives.map(primitive => primitive.index), ...extended]);
  /** Use the same topology when an application passes a subset in a different order. */
  const ranks = new Uint32Array(indices.length);
  for (const [rank, index] of indices.entries()) ranks[index] = rank;
  return {indices, ranks, indexedCount: primitives.length};
}

/** Gather conservative world-space bounds for the selected primitive prefix. */
function getGatherCastBoundsShader(indexedCount: number): string {
  return /* wgsl */ `
@group(0) @binding(24) var<storage,read_write> sourceMinima:array<f32>;
@group(0) @binding(25) var<storage,read_write> sourceMaxima:array<f32>;
@group(0) @binding(30) var<storage,read> batchCommands:array<Query>;

@compute @workgroup_size(64) fn gatherCastBounds(@builtin(global_invocation_id) invocation:vec3u){
 let row=invocation.x;
 if(row>=${indexedCount}u){return;}
 let largest=0x1.fffffep127f;
 var lower=vec3f(largest);
 var upper=vec3f(-largest);
 if(row<batchCommands[0].settings.y){
  let collider=querySelection[row];
  let center=colliderPosition(collider);
  let shape=bodies.colliders[collider].shape;
  var extent=vec3f(shape.x);
  if(shape.w==1.0){extent=shapeWorldExtent(collider);}
  // Cover float32 pose and slab arithmetic, including the narrow phase's
  // near-tangent sphere sweep tolerance.
  let padding=max(vec3f(1e-7),(abs(center)+extent)*2e-6);
  lower=center-extent-padding;
  upper=center+extent+padding;
  if(!all(abs(lower)<=vec3f(largest))||!all(abs(upper)<=vec3f(largest))){
   lower=vec3f(-largest);
   upper=vec3f(largest);
  }
 }
 for(var coordinate=0u;coordinate<3u;coordinate++){
  sourceMinima[row*3u+coordinate]=lower[coordinate];
  sourceMaxima[row*3u+coordinate]=upper[coordinate];
 }
}
`;
}

/** Index construction and traversal inputs borrowed from the rigid-body world. */
type RigidBodyCastIndexProps = {
  /** Prefix for graph resources and passes. */
  id: string;
  /** WGSL containing shared geometry and cast declarations. */
  source: string;
  /** Binding declarations for the shared batch cast shader. */
  layout: readonly BindingDeclaration[];
  /** Borrowed world buffers and batch staging. */
  buffers: {
    positions: Buffer;
    orientations: Buffer;
    bodies: Buffer;
    querySelection: Buffer;
    batchCommands: Buffer;
    batchResults: Buffer;
  };
  /** Maximum number of indexed leaves. */
  indexedCount: number;
};

/** Compile one private query graph. Holds no ownership of world state or query staging. */
export function createRigidBodyCastIndex(
  device: Device,
  {id, source, layout, buffers, indexedCount}: RigidBodyCastIndexProps
): CompiledGPUCommandGraph<number> {
  /** Keep refits separate from the application simulation graph. */
  const graph = new GPUCommandGraph<number>(device, {id});
  /** Import each world buffer once so graph dependencies track the same handles. */
  const resources = Object.fromEntries(
    Object.entries(buffers).map(([name, buffer]) => [
      name,
      graph.importBuffer({id: name, byteLength: buffer.byteLength, usage: buffer.usage}, buffer)
    ])
  );
  /** Size the implicit complete binary tree including padded leaves. */
  const leafCapacity = 2 ** Math.ceil(Math.log2(indexedCount));
  /** Every internal and leaf row uses the same packed bounds format. */
  const nodeCount = leafCapacity * 2 - 1;
  /** Allocate a packed scratch view owned by the query graph. */
  function createView<Format extends 'float32x3' | 'uint32x2' | 'uint32'>(
    name: string,
    format: Format,
    length: number
  ) {
    /** Three floats for bounds or one or two words for topology. */
    const rowBytes = format === 'float32x3' ? 12 : format === 'uint32x2' ? 8 : 4;
    return graph.createDataView(
      graph.createTransientBuffer({id: name, byteLength: length * rowBytes, usage: Buffer.STORAGE}),
      {format, length}
    );
  }

  /** Shared BVH primitive publishes stable implicit leaves and refits from the current poses. */
  const hierarchy = new GPUBVH({
    id,
    leafCapacity,
    minima: createView('source-minima', 'float32x3', indexedCount),
    maxima: createView('source-maxima', 'float32x3', indexedCount),
    nodeMinima: createView('node-minima', 'float32x3', nodeCount),
    nodeMaxima: createView('node-maxima', 'float32x3', nodeCount),
    nodeChildren: createView('children', 'uint32x2', nodeCount),
    leafIds: createView('leaf-ids', 'uint32', leafCapacity),
    count: createView('count', 'uint32', 1),
    overflow: createView('overflow', 'uint32', 1)
  });

  /** Add one compute node with explicit hazards for the external world and tree scratch. */
  function addPass(
    entryPoint: string,
    shaderSource: string,
    bindings: Record<string, GraphBufferHandle>,
    writes: readonly string[],
    workgroups?: number
  ): void {
    /** The shader shares declarations with the unindexed pipeline. */
    const bindingLayout = [
      ...layout,
      {name: 'sourceMinima', group: 0, location: 24, type: 'storage' as const},
      {name: 'sourceMaxima', group: 0, location: 25, type: 'storage' as const},
      {name: 'nodeMinima', group: 0, location: 26, type: 'read-only-storage' as const},
      {name: 'nodeMaxima', group: 0, location: 27, type: 'read-only-storage' as const}
    ].filter(binding => binding.name in bindings);
    graph.addComputePass({
      id: `${id}-${entryPoint}`,
      resources: Object.entries(bindings).map(([name, buffer]) => ({
        buffer,
        usage: writes.includes(name) ? 'storage-read-write' : 'storage-read'
      })),
      compile: () => {
        /** Compile once and resolve graph-owned temporary buffers at encode time. */
        const kernel = new Kernel(device, {
          id: `${id}-${entryPoint}`,
          source: shaderSource,
          entryPoint,
          shaderLayout: {bindings: bindingLayout}
        });
        return {
          encode: ({computePass, getBuffer, parameters}) =>
            kernel.dispatch(computePass, {
              bindings: Object.fromEntries(
                Object.entries(bindings).map(([name, handle]) => [name, getBuffer(handle)])
              ),
              x: workgroups ?? parameters
            }),
          destroy: () => kernel.destroy()
        };
      }
    });
  }

  /** The shared geometry source defines the command struct and collider pose helpers. */
  const {batchResults, ...inputs} = resources;
  addPass(
    'gatherCastBounds',
    source + getGatherCastBoundsShader(indexedCount),
    {
      ...inputs,
      sourceMinima: hierarchy.minima.buffer,
      sourceMaxima: hierarchy.maxima.buffer
    },
    ['sourceMinima', 'sourceMaxima'],
    Math.ceil(indexedCount / 64)
  );
  graph.add(hierarchy);
  addPass(
    'castBatch',
    source + getRigidBodyBatchCastShader(leafCapacity),
    {
      ...resources,
      nodeMinima: hierarchy.nodeMinima.buffer,
      nodeMaxima: hierarchy.nodeMaxima.buffer
    },
    ['batchResults']
  );
  return graph.compile();
}
