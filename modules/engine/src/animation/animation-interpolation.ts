// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Interpolation modes shared by animation formats and engine tracks. */
export type AnimationInterpolation = 'STEP' | 'LINEAR' | 'CUBICSPLINE';

/** Value interpretation used for interpolation and weighted blending. */
export type AnimationValueType = 'vector' | 'quaternion';

/** Keyframe times and values in the glTF-compatible animation sampler layout. */
export type AnimationSampler = {
  /** Keyframe times, in seconds. */
  input: readonly number[];
  /** One value per keyframe, or in-tangent/value/out-tangent triples for cubic splines. */
  output: readonly (readonly number[])[];
  /** Keyframe interpolation mode. */
  interpolation?: AnimationInterpolation | string;
};

/** Samples keyframes without applying playback loops or modifying the supplied values. */
export function evaluateAnimationSampler(
  time: number,
  sampler: AnimationSampler,
  valueType: AnimationValueType = 'vector'
): number[] | null {
  const {input, output, interpolation = 'LINEAR'} = sampler;
  if (!input.length || !output.length || !Number.isFinite(time)) {
    return null;
  }

  const lastIndex = input.length - 1;
  if (time <= input[0] || lastIndex === 0) {
    return getKeyframeValue(output, interpolation, 0, valueType);
  }
  if (time >= input[lastIndex]) {
    return getKeyframeValue(output, interpolation, lastIndex, valueType);
  }

  let previousIndex = 0;
  let nextIndex = lastIndex;
  while (nextIndex - previousIndex > 1) {
    const middleIndex = Math.floor((previousIndex + nextIndex) / 2);
    if (input[middleIndex] <= time) {
      previousIndex = middleIndex;
    } else {
      nextIndex = middleIndex;
    }
  }

  const previousTime = input[previousIndex];
  const nextTime = input[nextIndex];
  const interval = nextTime - previousTime;
  if (interval <= 0 || interpolation === 'STEP') {
    return getKeyframeValue(output, interpolation, previousIndex, valueType);
  }

  const ratio = (time - previousTime) / interval;
  switch (interpolation) {
    case 'LINEAR': {
      const previousValue = output[previousIndex];
      const nextValue = output[nextIndex];
      if (!previousValue || !nextValue) {
        return null;
      }
      return valueType === 'quaternion'
        ? interpolateQuaternion(previousValue, nextValue, ratio)
        : interpolateVector(previousValue, nextValue, ratio);
    }

    case 'CUBICSPLINE': {
      const previousValue = output[previousIndex * 3 + 1];
      const previousOutTangent = output[previousIndex * 3 + 2];
      const nextInTangent = output[nextIndex * 3];
      const nextValue = output[nextIndex * 3 + 1];
      if (!previousValue || !previousOutTangent || !nextInTangent || !nextValue) {
        return null;
      }

      const interpolatedValue = interpolateCubicSpline(
        previousValue,
        previousOutTangent,
        nextInTangent,
        nextValue,
        interval,
        ratio
      );
      return valueType === 'quaternion'
        ? normalizeQuaternion(interpolatedValue)
        : interpolatedValue;
    }

    default:
      return null;
  }
}

/** Interpolates quaternions on their shortest spherical arc. */
export function interpolateQuaternion(
  start: readonly number[],
  end: readonly number[],
  ratio: number
): number[] {
  const normalizedStart = normalizeQuaternion(start);
  const normalizedEnd = normalizeQuaternion(end);
  let dotProduct = normalizedStart.reduce(
    (sum, component, index) => sum + component * normalizedEnd[index],
    0
  );
  const endDirection = dotProduct < 0 ? -1 : 1;
  dotProduct = Math.min(Math.abs(dotProduct), 1);

  if (dotProduct > 0.9995) {
    return normalizeQuaternion(
      normalizedStart.map(
        (component, index) => component + ratio * (normalizedEnd[index] * endDirection - component)
      )
    );
  }

  const angle = Math.acos(dotProduct);
  const sineAngle = Math.sin(angle);
  const startWeight = Math.sin((1 - ratio) * angle) / sineAngle;
  const endWeight = (Math.sin(ratio * angle) / sineAngle) * endDirection;
  return normalizeQuaternion(
    normalizedStart.map(
      (component, index) => component * startWeight + normalizedEnd[index] * endWeight
    )
  );
}

function getKeyframeValue(
  output: readonly (readonly number[])[],
  interpolation: string,
  index: number,
  valueType: AnimationValueType
): number[] | null {
  const value = output[interpolation === 'CUBICSPLINE' ? index * 3 + 1 : index];
  if (!value) {
    return null;
  }
  return valueType === 'quaternion' ? normalizeQuaternion(value) : [...value];
}

function interpolateVector(
  start: readonly number[],
  end: readonly number[],
  ratio: number
): number[] {
  return start.map((component, index) => (1 - ratio) * component + ratio * end[index]);
}

function interpolateCubicSpline(
  previousValue: readonly number[],
  previousOutTangent: readonly number[],
  nextInTangent: readonly number[],
  nextValue: readonly number[],
  interval: number,
  ratio: number
): number[] {
  const squaredRatio = ratio * ratio;
  const cubedRatio = squaredRatio * ratio;
  return previousValue.map(
    (component, index) =>
      (2 * cubedRatio - 3 * squaredRatio + 1) * component +
      (cubedRatio - 2 * squaredRatio + ratio) * previousOutTangent[index] * interval +
      (-2 * cubedRatio + 3 * squaredRatio) * nextValue[index] +
      (cubedRatio - squaredRatio) * nextInTangent[index] * interval
  );
}

function normalizeQuaternion(value: readonly number[]): number[] {
  const length = Math.hypot(...value);
  return length > 0 ? value.map(component => component / length) : [0, 0, 0, 1];
}
