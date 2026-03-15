// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type GLTFAccessorPostprocessed, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {
  GLTFAnimationPath,
  type GLTFAnimation,
  type GLTFAnimationChannel,
  type GLTFAnimationSampler
} from '../gltf/animations/animations';

import {accessorToTypedArray} from '..//webgl-to-webgpu/convert-webgl-attribute';

export function parseGLTFAnimations(gltf: GLTFPostprocessed): GLTFAnimation[] {
  const gltfAnimations = gltf.animations || [];
  const accessorCache1D = new Map<GLTFAccessorPostprocessed, number[]>();
  const accessorCache2D = new Map<GLTFAccessorPostprocessed, number[][]>();

  return gltfAnimations.map((animation, index) => {
    const name = animation.name || `Animation-${index}`;
    const samplers: GLTFAnimationSampler[] = animation.samplers.map(
      ({input, interpolation = 'LINEAR', output}) => ({
        input: accessorToJsArray1D(gltf.accessors[input], accessorCache1D),
        interpolation,
        output: accessorToJsArray2D(gltf.accessors[output], accessorCache2D)
      })
    );

    const channels: GLTFAnimationChannel[] = animation.channels.map(({sampler, target}) => {
      const targetNode = gltf.nodes[target.node ?? 0];
      if (!targetNode) {
        throw new Error(`Cannot find animation target ${target.node}`);
      }
      return {
        sampler: samplers[sampler],
        targetNodeId: targetNode.id,
        path: target.path as GLTFAnimationPath
      };
    });

    return {name, channels};
  });
}

function accessorToJsArray1D(
  accessor: GLTFAccessorPostprocessed,
  accessorCache: Map<GLTFAccessorPostprocessed, number[]>
): number[] {
  if (accessorCache.has(accessor)) {
    return accessorCache.get(accessor)!;
  }

  const {typedArray: array, components} = accessorToTypedArray(accessor);
  assert(components === 1, 'accessorToJsArray1D must have exactly 1 component');
  const result = Array.from(array);

  accessorCache.set(accessor, result);
  return result;
}

function accessorToJsArray2D(
  accessor: GLTFAccessorPostprocessed,
  accessorCache: Map<GLTFAccessorPostprocessed, number[][]>
): number[][] {
  if (accessorCache.has(accessor)) {
    return accessorCache.get(accessor)!;
  }

  const {typedArray: array, components} = accessorToTypedArray(accessor);
  assert(components > 1, 'accessorToJsArray2D must have more than 1 component');

  const result = [];

  // Slice array
  for (let i = 0; i < array.length; i += components) {
    result.push(Array.from(array.slice(i, i + components)));
  }

  accessorCache.set(accessor, result);
  return result;
}

function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
