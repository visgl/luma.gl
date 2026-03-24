import {log} from '@luma.gl/core';
import {Quaternion} from '@math.gl/core';
import {GLTFAnimationPath, GLTFAnimationSampler} from './animations';
import {GroupNode} from '@luma.gl/engine';

/** Applies an evaluated animation value to a scenegraph node. */
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

/** Evaluates a glTF animation sampler at the supplied time and applies the result to a node. */
export function interpolate(
  time: number,
  {input, interpolation, output}: GLTFAnimationSampler,
  target: GroupNode,
  path: GLTFAnimationPath
) {
  const value = evaluateSampler(time, {input, interpolation, output}, path);
  if (value) {
    updateTargetPath(target, path, value);
  }
}

/** Evaluates a glTF animation sampler at the supplied time. */
export function evaluateSampler(
  time: number,
  {input, interpolation, output}: GLTFAnimationSampler,
  path?: GLTFAnimationPath
): number[] | null {
  const maxTime = input[input.length - 1];
  if (!Number.isFinite(maxTime) || maxTime <= 0) {
    return output[0] || null;
  }

  const animationTime = time % maxTime;

  const nextIndex = input.findIndex(t => t >= animationTime);
  if (nextIndex < 0) {
    return output[output.length - 1] || null;
  }
  const previousIndex = Math.max(0, nextIndex - 1);

  const previousTime = input[previousIndex];
  const nextTime = input[nextIndex];

  switch (interpolation) {
    case 'STEP':
      return output[previousIndex];

    case 'LINEAR':
      if (nextTime > previousTime) {
        const ratio = (animationTime - previousTime) / (nextTime - previousTime);
        return linearInterpolate(path, output[previousIndex], output[nextIndex], ratio);
      }
      return output[previousIndex] || null;

    case 'CUBICSPLINE':
      if (nextTime > previousTime) {
        const ratio = (animationTime - previousTime) / (nextTime - previousTime);
        const tDiff = nextTime - previousTime;

        const p0 = output[3 * previousIndex + 1];
        const outTangent0 = output[3 * previousIndex + 2];
        const inTangent1 = output[3 * nextIndex + 0];
        const p1 = output[3 * nextIndex + 1];

        return cubicsplineInterpolate({p0, outTangent0, inTangent1, p1, tDiff, ratio});
      }
      return output[3 * previousIndex + 1] || null;

    default:
      log.warn(`Interpolation ${interpolation} not supported`)();
      return null;
  }
}

/** Applies linear interpolation between two keyframes. */
function linearInterpolate(
  path: GLTFAnimationPath | undefined,
  start: number[],
  stop: number[],
  ratio: number
): number[] {
  if (path === 'rotation') {
    // SLERP when path is rotation
    return new Quaternion().slerp({start, target: stop, ratio}) as unknown as number[];
  }

  const newVal = [];
  for (let i = 0; i < start.length; i++) {
    newVal[i] = ratio * stop[i] + (1 - ratio) * start[i];
  }
  return newVal;
}

/** Applies glTF cubic spline interpolation between two keyframes. */
function cubicsplineInterpolate({
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
}): number[] {
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
  return newVal;
}
