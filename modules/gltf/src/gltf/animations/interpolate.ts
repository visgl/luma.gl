import {GLTFNodePostprocessed} from '@loaders.gl/gltf';
import {log} from '@luma.gl/core';
import {Quaternion} from '@math.gl/core';
import {GLTFAnimationChannel, GLTFAnimationSampler} from './animations';

const scratchQuaternion = new Quaternion();

export function interpolate(
  time: number,
  {input, interpolation, output}: GLTFAnimationSampler,
  target: GLTFNodePostprocessed,
  path: GLTFAnimationChannel['path']
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

function linearInterpolate(
  target: GLTFNodePostprocessed,
  path: GLTFAnimationChannel['path'],
  start: number[],
  stop: number[],
  ratio: number
) {
  if (!target[path]) {
    throw new Error();
  }

  if (path === 'rotation') {
    // SLERP when path is rotation
    scratchQuaternion.slerp({start, target: stop, ratio});
    for (let i = 0; i < scratchQuaternion.length; i++) {
      target[path][i] = scratchQuaternion[i];
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
  path: GLTFAnimationChannel['path'],
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
  path: GLTFAnimationChannel['path'],
  value: number[]
) {
  if (!target[path]) {
    throw new Error();
  }

  for (let i = 0; i < value.length; i++) {
    target[path][i] = value[i];
  }
}
