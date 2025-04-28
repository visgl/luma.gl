// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  GLTFAccessorPostprocessed,
  GLTFNodePostprocessed,
  GLTFPostprocessed
} from '@loaders.gl/gltf';
import {log, TypedArray} from '@luma.gl/core';
import {GroupNode} from '@luma.gl/engine';
import {Matrix4, Quaternion} from '@math.gl/core';

// TODO: import from loaders.gl?
export const ATTRIBUTE_TYPE_TO_COMPONENTS: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

export const ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY: Record<number, any> = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};

type GLTFAnimationSamplerInternal = {
  input: number[];
  interpolation: string;
  output: number[] | number[][];
};

type GLTFAnimationPathInternal = 'translation' | 'rotation' | 'scale' | 'weights';

type GLTFAnimationChannelInternal = {
  sampler: GLTFAnimationSamplerInternal;
  target: GLTFNodePostprocessed;
  path: GLTFAnimationPathInternal;
};

type GLTFAnimationProps = {
  name: string;
  startTime?: number;
  playing?: boolean;
  speed?: number;
  channels?: GLTFAnimationChannelInternal[];
};

class GLTFAnimation {
  name: string = 'unnamed';
  startTime: number = 0;
  playing: boolean = true;
  speed: number = 1;
  channels: GLTFAnimationChannelInternal[] = [];

  constructor(props: GLTFAnimationProps) {
    Object.assign(this, props);
  }

  animate(timeMs: number) {
    if (!this.playing) {
      return;
    }

    const absTime = timeMs / 1000;
    const time = (absTime - this.startTime) * this.speed;

    this.channels.forEach(({sampler, target, path}) => {
      interpolate(time, sampler, target, path);
      applyTranslationRotationScale(target, (target as any)._node as GroupNode);
    });
  }
}

export class GLTFAnimator {
  animations: GLTFAnimation[];

  constructor(gltf: GLTFPostprocessed) {
    this.animations = gltf.animations.map((animation, index) => {
      const name = animation.name || `Animation-${index}`;
      const samplers: GLTFAnimationSamplerInternal[] = animation.samplers.map(
        ({input, interpolation = 'LINEAR', output}) => ({
          input: accessorToJsArray(gltf.accessors[input]) as number[],
          interpolation,
          output: accessorToJsArray(gltf.accessors[output])
        })
      );
      const channels: GLTFAnimationChannelInternal[] = animation.channels.map(
        ({sampler, target}) => ({
          sampler: samplers[sampler],
          target: gltf.nodes[target.node ?? 0],
          path: target.path as GLTFAnimationPathInternal
        })
      );
      return new GLTFAnimation({name, channels});
    });
  }

  /** @deprecated Use .setTime(). Will be removed (deck.gl is using this) */
  animate(time: number): void {
    this.setTime(time);
  }

  setTime(time: number): void {
    this.animations.forEach(animation => animation.animate(time));
  }

  getAnimations() {
    return this.animations;
  }
}

//

function accessorToJsArray(
  accessor: GLTFAccessorPostprocessed & {_animation?: number[] | number[][]}
): number[] | number[][] {
  if (!accessor._animation) {
    const ArrayType = ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY[accessor.componentType];
    const components = ATTRIBUTE_TYPE_TO_COMPONENTS[accessor.type];
    const length = components * accessor.count;
    const {buffer, byteOffset = 0} = accessor.bufferView?.data ?? {};

    const array: TypedArray = new ArrayType(
      buffer,
      byteOffset + (accessor.byteOffset || 0),
      length
    );

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

// TODO: share with GLTFInstantiator
const helperMatrix = new Matrix4();
function applyTranslationRotationScale(gltfNode: GLTFNodePostprocessed, node: GroupNode) {
  node.matrix.identity();

  if (gltfNode.translation) {
    node.matrix.translate(gltfNode.translation);
  }

  if (gltfNode.rotation) {
    const rotationMatrix = helperMatrix.fromQuaternion(gltfNode.rotation);
    node.matrix.multiplyRight(rotationMatrix);
  }

  if (gltfNode.scale) {
    node.matrix.scale(gltfNode.scale);
  }
}

const quaternion = new Quaternion();
function linearInterpolate(
  target: GLTFNodePostprocessed,
  path: GLTFAnimationPathInternal,
  start: number[],
  stop: number[],
  ratio: number
) {
  if (!target[path]) {
    throw new Error();
  }

  if (path === 'rotation') {
    // SLERP when path is rotation
    quaternion.slerp({start, target: stop, ratio});
    for (let i = 0; i < quaternion.length; i++) {
      target[path][i] = quaternion[i];
    }
  } else {
    // regular interpolation
    for (let i = 0; i < start.length; i++) {
      target[path][i] = ratio * stop[i] + (1 - ratio) * start[i];
    }
  }
}

function cubicsplineInterpolate(
  target: GLTFNodePostprocessed,
  path: GLTFAnimationPathInternal,
  {
    p0,
    outTangent0,
    inTangent1,
    p1,
    tDiff,
    ratio: t
  }: {
    p0: number[];
    outTangent0: number[];
    inTangent1: number[];
    p1: number[];
    tDiff: number;
    ratio: number;
  }
) {
  if (!target[path]) {
    throw new Error();
  }

  // TODO: Quaternion might need normalization
  for (let i = 0; i < target[path].length; i++) {
    const m0 = outTangent0[i] * tDiff;
    const m1 = inTangent1[i] * tDiff;
    target[path][i] =
      (2 * Math.pow(t, 3) - 3 * Math.pow(t, 2) + 1) * p0[i] +
      (Math.pow(t, 3) - 2 * Math.pow(t, 2) + t) * m0 +
      (-2 * Math.pow(t, 3) + 3 * Math.pow(t, 2)) * p1[i] +
      (Math.pow(t, 3) - Math.pow(t, 2)) * m1;
  }
}

function stepInterpolate(
  target: GLTFNodePostprocessed,
  path: GLTFAnimationPathInternal,
  value: number[]
) {
  if (!target[path]) {
    throw new Error();
  }

  for (let i = 0; i < value.length; i++) {
    target[path][i] = value[i];
  }
}

function interpolate(
  time: number,
  {input, interpolation, output}: GLTFAnimationSamplerInternal,
  target: GLTFNodePostprocessed,
  path: GLTFAnimationPathInternal
) {
  const maxTime = input[input.length - 1];
  const animationTime = time % maxTime;

  const nextIndex = input.findIndex(t => t >= animationTime);
  const previousIndex = Math.max(0, nextIndex - 1);

  if (!Array.isArray(target[path])) {
    switch (path) {
      case 'translation':
        target[path] = [0, 0, 0];
        break;

      case 'rotation':
        target[path] = [0, 0, 0, 1];
        break;

      case 'scale':
        target[path] = [1, 1, 1];
        break;

      default:
        log.warn(`Bad animation path ${path}`)();
    }
  }

  // assert(target[path].length === output[previousIndex].length);
  const previousTime = input[previousIndex];
  const nextTime = input[nextIndex];

  switch (interpolation) {
    case 'STEP':
      stepInterpolate(target, path, output[previousIndex] as number[]);
      break;

    case 'LINEAR':
      if (nextTime > previousTime) {
        const ratio = (animationTime - previousTime) / (nextTime - previousTime);
        linearInterpolate(
          target,
          path,
          output[previousIndex] as number[],
          output[nextIndex] as number[],
          ratio
        );
      }
      break;

    case 'CUBICSPLINE':
      if (nextTime > previousTime) {
        const ratio = (animationTime - previousTime) / (nextTime - previousTime);
        const tDiff = nextTime - previousTime;

        const p0 = output[3 * previousIndex + 1] as number[];
        const outTangent0 = output[3 * previousIndex + 2] as number[];
        const inTangent1 = output[3 * nextIndex + 0] as number[];
        const p1 = output[3 * nextIndex + 1] as number[];

        cubicsplineInterpolate(target, path, {p0, outTangent0, inTangent1, p1, tDiff, ratio});
      }
      break;

    default:
      log.warn(`Interpolation ${interpolation} not supported`)();
      break;
  }
}
