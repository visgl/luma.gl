import {log} from '@luma.gl/core';
import {Quaternion} from '@math.gl/core';
import {GLTFAnimationPath, GLTFAnimationSampler} from './animations';
import {GroupNode} from '@luma.gl/engine';

function updateTargetPath(
  target: GroupNode,
  path: GLTFAnimationPath,
  newValue: number[]
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
      stepInterpolate(target, path, output[previousIndex]);
      break;

    case 'LINEAR':
      if (nextTime > previousTime) {
        const ratio = (animationTime - previousTime) / (nextTime - previousTime);
        linearInterpolate(target, path, output[previousIndex], output[nextIndex], ratio);
      }
      break;

    case 'CUBICSPLINE':
      if (nextTime > previousTime) {
        const ratio = (animationTime - previousTime) / (nextTime - previousTime);
        const tDiff = nextTime - previousTime;

        const p0 = output[3 * previousIndex + 1];
        const outTangent0 = output[3 * previousIndex + 2];
        const inTangent1 = output[3 * nextIndex + 0];
        const p1 = output[3 * nextIndex + 1];

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
  if (path === 'rotation') {
    // SLERP when path is rotation
    updateTargetPath(target, path, new Quaternion().slerp({start, target: stop, ratio}));
  } else {
    // regular interpolation
    const newVal = [];
    for (let i = 0; i < start.length; i++) {
      newVal[i] = ratio * stop[i] + (1 - ratio) * start[i];
    }
    updateTargetPath(target, path, newVal);
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
  const newVal = [];
  for (let i = 0; i < p0.length; i++) {
    const m0 = outTangent0[i] * tDiff;
    const m1 = inTangent1[i] * tDiff;
    newVal[i] =
      (2 * Math.pow(t, 3) - 3 * Math.pow(t, 2) + 1) * p0[i] +
      (Math.pow(t, 3) - 2 * Math.pow(t, 2) + t) * m0 +
      (-2 * Math.pow(t, 3) + 3 * Math.pow(t, 2)) * p1[i] +
      (Math.pow(t, 3) - Math.pow(t, 2)) * m1;
  }
  updateTargetPath(target, path, newVal);
}

function stepInterpolate(target: GroupNode, path: GLTFAnimationPath, value: number[]) {
  updateTargetPath(target, path, value);
}
