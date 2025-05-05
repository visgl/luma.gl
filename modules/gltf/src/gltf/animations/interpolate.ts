import {log} from '@luma.gl/core';
import {Quaternion, Vector3} from '@math.gl/core';
import {GLTFAnimationChannel, GLTFAnimationPath, GLTFAnimationSampler} from './animations';
import {GroupNode} from '@luma.gl/engine';

const scratchQuaternion = new Quaternion();

function updateTargetPath(
  target: GroupNode,
  path: GLTFAnimationPath,
  newValue: Vector3 | Quaternion | number[]
): GroupNode | null {
  switch (path) {
    case 'translation':
      return target.setPosition(newValue).updateMatrix();

    case 'rotation':
      return target.setRotation(newValue).updateMatrix();

    case 'scale':
      return target.setScale(newValue).updateMatrix();

    default:
      log.warn(`Bad animation path ${path}`)();
      return null;
  }
}

export function interpolate(
  time: number,
  {input, interpolation, output}: GLTFAnimationSampler,
  target: GroupNode,
  path: GLTFAnimationPath
) {
  const maxTime = input[input.length - 1];
  const animationTime = time % maxTime;

  const nextIndex = input.findIndex(t => t >= animationTime);
  const previousIndex = Math.max(0, nextIndex - 1);

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
  target: GroupNode,
  path: GLTFAnimationPath,
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
  target: GroupNode,
  path: GLTFAnimationPath,
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

function stepInterpolate(target: GroupNode, path: GLTFAnimationPath, value: number[]) {
  updateTargetPath(target, path, value);
}
