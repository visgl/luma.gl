// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type GLTFAccessorPostprocessed, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {
  type GLTFAnimation,
  type GLTFAnimationChannel,
  type GLTFAnimationSampler
} from '../gltf/animations/animations';

import {accessorToTypedArray} from '..//webgl-to-webgpu/convert-webgl-attribute';

export function parseGLTFAnimations(gltf: GLTFPostprocessed): GLTFAnimation[] {
  const gltfAnimations = gltf.animations || [];
  return gltfAnimations.map((animation, index) => {
    const name = animation.name || `Animation-${index}`;
    const samplers: GLTFAnimationSampler[] = animation.samplers.map(
      ({input, interpolation = 'LINEAR', output}) => ({
        input: accessorToJsArray(gltf.accessors[input]) as number[],
        interpolation,
        output: accessorToJsArray(gltf.accessors[output])
      })
    );
    const channels: GLTFAnimationChannel[] = animation.channels.map(({sampler, target}) => ({
      sampler: samplers[sampler],
      target: gltf.nodes[target.node ?? 0],
      path: target.path as GLTFAnimationChannel['path']
    }));
    return {name, channels};
  });
}

//

function accessorToJsArray(
  accessor: GLTFAccessorPostprocessed & {_animation?: number[] | number[][]}
): number[] | number[][] {
  if (!accessor._animation) {
    const {typedArray: array, components} = accessorToTypedArray(accessor);

    if (components === 1) {
      accessor._animation = Array.from(array);
    } else {
      // Slice array
      const slicedArray: number[][] = [];
      for (let i = 0; i < array.length; i += components) {
        slicedArray.push(Array.from(array.slice(i, i + components)));
      }
      accessor._animation = slicedArray;
    }
  }

  return accessor._animation;
}
