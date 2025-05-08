// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type GLTFAccessorPostprocessed, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {GroupNode} from '@luma.gl/engine';
import {
  GLTFAnimationPath,
  type GLTFAnimation,
  type GLTFAnimationChannel,
  type GLTFAnimationSampler
} from '../gltf/animations/animations';

import {accessorToTypedArray} from '..//webgl-to-webgpu/convert-webgl-attribute';

export function parseGLTFAnimations(
  gltf: GLTFPostprocessed,
  nodeMap: Map<number | string, GroupNode>
): GLTFAnimation[] {
  const gltfAnimations = gltf.animations || [];
  const accessorCache = new Map<GLTFAccessorPostprocessed, number[] | number[][]>();

  return gltfAnimations.map((animation, index) => {
    const name = animation.name || `Animation-${index}`;
    const samplers: GLTFAnimationSampler[] = animation.samplers.map(
      ({input, interpolation = 'LINEAR', output}) => ({
        input: accessorToJsArray(gltf.accessors[input], accessorCache) as number[],
        interpolation,
        output: accessorToJsArray(gltf.accessors[output], accessorCache)
      })
    );

    const channels: GLTFAnimationChannel[] = animation.channels.map(({sampler, target}) => {
      const targetNode = nodeMap.get(target.node ?? 0);
      if (!targetNode) {
        throw new Error(`Cannot find animation target ${target.node}`);
      }
      return {
        sampler: samplers[sampler],
        target: targetNode,
        path: target.path as GLTFAnimationPath
      };
    });

    return {name, channels};
  });
}

function accessorToJsArray(
  accessor: GLTFAccessorPostprocessed,
  accessorCache: Map<GLTFAccessorPostprocessed, number[] | number[][]>
): number[] | number[][] {
  if (accessorCache.has(accessor)) {
    return accessorCache.get(accessor) as number[] | number[][];
  }

  const {typedArray: array, components} = accessorToTypedArray(accessor);
  let result;

  if (components === 1) {
    result = Array.from(array);
  } else {
    // Slice array
    result = [];
    for (let i = 0; i < array.length; i += components) {
      result.push(Array.from(array.slice(i, i + components)));
    }
  }

  accessorCache.set(accessor, result);
  return result;
}
