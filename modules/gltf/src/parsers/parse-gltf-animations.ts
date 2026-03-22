// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@luma.gl/core';
import {type GLTFAccessorPostprocessed, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {
  GLTFAnimationPath,
  type GLTFAnimation,
  type GLTFAnimationChannel,
  type GLTFAnimationSampler
} from '../gltf/animations/animations';

import {accessorToTypedArray} from '..//webgl-to-webgpu/convert-webgl-attribute';

/** Parses glTF animation records into the runtime animation model used by `GLTFAnimator`. */
export function parseGLTFAnimations(gltf: GLTFPostprocessed): GLTFAnimation[] {
  const gltfAnimations = gltf.animations || [];
  const accessorCache1D = new Map<GLTFAccessorPostprocessed, number[]>();
  const accessorCache2D = new Map<GLTFAccessorPostprocessed, number[][]>();

  return gltfAnimations.flatMap((animation, index) => {
    const name = animation.name || `Animation-${index}`;
    const samplerCache = new Map<number, GLTFAnimationSampler>();
    const channels: GLTFAnimationChannel[] = animation.channels.flatMap(({sampler, target}) => {
      const path = getSupportedAnimationPath(target.path);
      if (!path) {
        return [];
      }

      const targetNode = gltf.nodes[target.node ?? 0];
      if (!targetNode) {
        throw new Error(`Cannot find animation target ${target.node}`);
      }

      let parsedSampler = samplerCache.get(sampler);
      if (!parsedSampler) {
        const gltfSampler = animation.samplers[sampler];
        if (!gltfSampler) {
          throw new Error(`Cannot find animation sampler ${sampler}`);
        }
        const {input, interpolation = 'LINEAR', output} = gltfSampler;
        parsedSampler = {
          input: accessorToJsArray1D(gltf.accessors[input], accessorCache1D),
          interpolation,
          output: accessorToJsArray2D(gltf.accessors[output], accessorCache2D)
        };
        samplerCache.set(sampler, parsedSampler);
      }

      return {
        sampler: parsedSampler,
        targetNodeId: targetNode.id,
        path
      };
    });

    return channels.length ? [{name, channels}] : [];
  });
}

function getSupportedAnimationPath(path: string): GLTFAnimationPath | null {
  if (path === 'pointer') {
    log.warn('KHR_animation_pointer channels are not supported and will be skipped')();
    return null;
  }

  return path as GLTFAnimationPath;
}

/** Converts a scalar accessor into a cached JavaScript number array. */
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

/** Converts a scalar, vector, or matrix accessor into a cached JavaScript array-of-arrays. */
function accessorToJsArray2D(
  accessor: GLTFAccessorPostprocessed,
  accessorCache: Map<GLTFAccessorPostprocessed, number[][]>
): number[][] {
  if (accessorCache.has(accessor)) {
    return accessorCache.get(accessor)!;
  }

  const {typedArray: array, components} = accessorToTypedArray(accessor);
  assert(components >= 1, 'accessorToJsArray2D must have at least 1 component');

  const result = [];

  // Slice array
  for (let i = 0; i < array.length; i += components) {
    result.push(Array.from(array.slice(i, i + components)));
  }

  accessorCache.set(accessor, result);
  return result;
}

/** Throws when the supplied condition is false. */
function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
