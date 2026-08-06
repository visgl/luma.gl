// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** One-sigma screen-space axes of an anisotropic projected Gaussian. */
export type ProjectedSplatCovariance = {
  /** Dominant one-sigma screen-space axis in pixels. */
  axis0: readonly [number, number];
  /** Secondary one-sigma screen-space axis in pixels. */
  axis1: readonly [number, number];
  /** Length of the dominant one-sigma axis in pixels. */
  maxAxisPixels: number;
};

/** Camera and Gaussian parameters accepted by covariance projection. */
export type SplatCovarianceProjectionProps = {
  position: readonly [number, number, number];
  scale: readonly [number, number, number];
  rotation: readonly [number, number, number, number];
  modelViewProjectionMatrix?: readonly number[];
  viewportSize?: readonly [number, number];
  kernel2DSize?: number;
  maxScreenSpaceSplatSize?: number;
};

const MIN_AXIS_PIXELS = 1e-3;

/** Projects one rotated 3D Gaussian into a finite, clamped 2D covariance ellipse. */
export function projectSplatCovarianceToScreen(
  props: SplatCovarianceProjectionProps
): ProjectedSplatCovariance {
  const center = projectWorldPositionToScreen(
    props.modelViewProjectionMatrix,
    props.viewportSize,
    props.position
  );
  const axes = getQuaternionScaledAxes(props.rotation, props.scale);
  let covariance00 = 0;
  let covariance01 = 0;
  let covariance11 = 0;

  for (const axis of axes) {
    const endpoint: [number, number, number] = [
      props.position[0] + axis[0],
      props.position[1] + axis[1],
      props.position[2] + axis[2]
    ];
    const projectedEndpoint = projectWorldPositionToScreen(
      props.modelViewProjectionMatrix,
      props.viewportSize,
      endpoint
    );
    const deltaX = projectedEndpoint[0] - center[0];
    const deltaY = projectedEndpoint[1] - center[1];
    if (Number.isFinite(deltaX) && Number.isFinite(deltaY)) {
      covariance00 += deltaX * deltaX;
      covariance01 += deltaX * deltaY;
      covariance11 += deltaY * deltaY;
    }
  }

  const kernel2DSize = Math.max(props.kernel2DSize ?? 0, 0);
  const kernelVariance = kernel2DSize * kernel2DSize;
  const covariance = getCovarianceEllipseAxes(
    covariance00 + kernelVariance,
    covariance01,
    covariance11 + kernelVariance
  );
  const maxAxisPixels = Math.max(
    props.maxScreenSpaceSplatSize ?? Number.POSITIVE_INFINITY,
    MIN_AXIS_PIXELS
  );
  if (covariance.maxAxisPixels <= maxAxisPixels) {
    return covariance;
  }
  const axisScale = maxAxisPixels / covariance.maxAxisPixels;
  return {
    axis0: [covariance.axis0[0] * axisScale, covariance.axis0[1] * axisScale],
    axis1: [covariance.axis1[0] * axisScale, covariance.axis1[1] * axisScale],
    maxAxisPixels
  };
}

/** Returns rotated one-sigma world-space axes for a `[w, x, y, z]` quaternion. */
export function getQuaternionScaledAxes(
  rotation: readonly [number, number, number, number],
  scale: readonly [number, number, number]
): readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number]
] {
  const quaternionLength = Math.hypot(rotation[0], rotation[1], rotation[2], rotation[3]);
  const quaternionScale =
    Number.isFinite(quaternionLength) && quaternionLength > Number.EPSILON
      ? 1 / quaternionLength
      : 0;
  const quaternionW = quaternionScale === 0 ? 1 : rotation[0] * quaternionScale;
  const quaternionX = rotation[1] * quaternionScale;
  const quaternionY = rotation[2] * quaternionScale;
  const quaternionZ = rotation[3] * quaternionScale;

  return [
    [
      (1 - 2 * (quaternionY * quaternionY + quaternionZ * quaternionZ)) * scale[0],
      2 * (quaternionX * quaternionY + quaternionW * quaternionZ) * scale[0],
      2 * (quaternionX * quaternionZ - quaternionW * quaternionY) * scale[0]
    ],
    [
      2 * (quaternionX * quaternionY - quaternionW * quaternionZ) * scale[1],
      (1 - 2 * (quaternionX * quaternionX + quaternionZ * quaternionZ)) * scale[1],
      2 * (quaternionY * quaternionZ + quaternionW * quaternionX) * scale[1]
    ],
    [
      2 * (quaternionX * quaternionZ + quaternionW * quaternionY) * scale[2],
      2 * (quaternionY * quaternionZ - quaternionW * quaternionX) * scale[2],
      (1 - 2 * (quaternionX * quaternionX + quaternionY * quaternionY)) * scale[2]
    ]
  ];
}

/** Projects a world-space position through an optional column-major camera matrix. */
export function projectWorldPositionToScreen(
  matrix: readonly number[] | undefined,
  viewportSize: readonly [number, number] | undefined,
  position: readonly [number, number, number]
): readonly [number, number] {
  const clipPosition = transformSplatPosition(matrix, position);
  const inverseW = clipPosition[3] !== 0 ? 1 / clipPosition[3] : 0;
  return [
    (clipPosition[0] * inverseW * 0.5 + 0.5) * (viewportSize?.[0] || 1),
    (0.5 - clipPosition[1] * inverseW * 0.5) * (viewportSize?.[1] || 1)
  ];
}

/** Transforms an XYZ position by an optional column-major homogeneous matrix. */
export function transformSplatPosition(
  matrix: readonly number[] | undefined,
  position: readonly [number, number, number]
): readonly [number, number, number, number] {
  const [positionX, positionY, positionZ] = position;
  if (!matrix) {
    return [positionX, positionY, positionZ, 1];
  }
  return [
    matrix[0] * positionX + matrix[4] * positionY + matrix[8] * positionZ + matrix[12],
    matrix[1] * positionX + matrix[5] * positionY + matrix[9] * positionZ + matrix[13],
    matrix[2] * positionX + matrix[6] * positionY + matrix[10] * positionZ + matrix[14],
    matrix[3] * positionX + matrix[7] * positionY + matrix[11] * positionZ + matrix[15]
  ];
}

/** Diagonalizes a symmetric 2D covariance matrix into finite orthogonal axes. */
export function getCovarianceEllipseAxes(
  covariance00: number,
  covariance01: number,
  covariance11: number
): ProjectedSplatCovariance {
  if (
    !Number.isFinite(covariance00) ||
    !Number.isFinite(covariance01) ||
    !Number.isFinite(covariance11)
  ) {
    return {
      axis0: [MIN_AXIS_PIXELS, 0],
      axis1: [0, MIN_AXIS_PIXELS],
      maxAxisPixels: MIN_AXIS_PIXELS
    };
  }

  const halfTrace = (covariance00 + covariance11) * 0.5;
  const halfDifference = (covariance00 - covariance11) * 0.5;
  const discriminant = Math.sqrt(
    Math.max(halfDifference * halfDifference + covariance01 * covariance01, 0)
  );
  const firstEigenvalue = Math.max(halfTrace + discriminant, 0);
  const secondEigenvalue = Math.max(halfTrace - discriminant, 0);
  let eigenvectorX = covariance01;
  let eigenvectorY = firstEigenvalue - covariance00;
  if (Math.hypot(eigenvectorX, eigenvectorY) <= Number.EPSILON) {
    eigenvectorX = firstEigenvalue - covariance11;
    eigenvectorY = covariance01;
  }
  let eigenvectorLength = Math.hypot(eigenvectorX, eigenvectorY);
  if (!Number.isFinite(eigenvectorLength) || eigenvectorLength <= Number.EPSILON) {
    eigenvectorX = 1;
    eigenvectorY = 0;
    eigenvectorLength = 1;
  }
  const firstAxisLength = Math.max(Math.sqrt(firstEigenvalue), MIN_AXIS_PIXELS);
  const secondAxisLength = Math.max(Math.sqrt(secondEigenvalue), MIN_AXIS_PIXELS);
  const normalizedX = eigenvectorX / eigenvectorLength;
  const normalizedY = eigenvectorY / eigenvectorLength;
  return {
    axis0: [normalizedX * firstAxisLength, normalizedY * firstAxisLength],
    axis1: [-normalizedY * secondAxisLength, normalizedX * secondAxisLength],
    maxAxisPixels: Math.max(firstAxisLength, secondAxisLength)
  };
}
