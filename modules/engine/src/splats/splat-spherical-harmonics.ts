// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Highest non-DC spherical-harmonic band retained by a Gaussian splat source. */
export type SplatSphericalHarmonicsDegree = 0 | 1 | 2 | 3;

const FIRST_ORDER_SCALE = 0.4886025119029199;

/** Returns the number of non-DC RGB coefficients stored for one Gaussian splat. */
export function getSplatSphericalHarmonicCoefficientCount(
  degree: SplatSphericalHarmonicsDegree
): number {
  return ((degree + 1) ** 2 - 1) * 3;
}

/** Infers the spherical-harmonic degree from one row's non-DC RGB scalar count. */
export function getSplatSphericalHarmonicsDegree(
  coefficientCount: number
): SplatSphericalHarmonicsDegree {
  switch (coefficientCount) {
    case 0:
      return 0;
    case 9:
      return 1;
    case 24:
      return 2;
    case 45:
      return 3;
    default:
      throw new Error('Unsupported spherical-harmonic coefficient count');
  }
}

/**
 * Evaluates GraphDECO's real spherical-harmonic bands against a world-space view direction.
 *
 * The DC term is already reconstructed in `baseColor`; higher-order coefficients are packed as
 * consecutive RGB triplets, one triplet for each non-DC basis function.
 */
export function evaluateSplatSphericalHarmonics(
  baseColor: ArrayLike<number>,
  coefficients: ArrayLike<number>,
  viewDirection: ArrayLike<number>,
  degree: SplatSphericalHarmonicsDegree = getSplatSphericalHarmonicsDegree(coefficients.length)
): [number, number, number] {
  const directionLength = Math.hypot(
    viewDirection[0] ?? 0,
    viewDirection[1] ?? 0,
    viewDirection[2] ?? 0
  );
  const color: [number, number, number] = [baseColor[0] ?? 0, baseColor[1] ?? 0, baseColor[2] ?? 0];
  if (degree === 0 || directionLength === 0) {
    return color;
  }

  const directionX = (viewDirection[0] ?? 0) / directionLength;
  const directionY = (viewDirection[1] ?? 0) / directionLength;
  const directionZ = (viewDirection[2] ?? 0) / directionLength;
  const directionXX = directionX * directionX;
  const directionYY = directionY * directionY;
  const directionZZ = directionZ * directionZ;
  const basisValues = [
    -FIRST_ORDER_SCALE * directionY,
    FIRST_ORDER_SCALE * directionZ,
    -FIRST_ORDER_SCALE * directionX
  ];

  if (degree >= 2) {
    basisValues.push(
      1.0925484305920792 * directionX * directionY,
      -1.0925484305920792 * directionY * directionZ,
      0.31539156525252005 * (2 * directionZZ - directionXX - directionYY),
      -1.0925484305920792 * directionX * directionZ,
      0.5462742152960396 * (directionXX - directionYY)
    );
  }
  if (degree >= 3) {
    basisValues.push(
      -0.5900435899266435 * directionY * (3 * directionXX - directionYY),
      2.890611442640554 * directionX * directionY * directionZ,
      -0.4570457994644658 * directionY * (4 * directionZZ - directionXX - directionYY),
      0.3731763325901154 * directionZ * (2 * directionZZ - 3 * directionXX - 3 * directionYY),
      -0.4570457994644658 * directionX * (4 * directionZZ - directionXX - directionYY),
      1.445305721320277 * directionZ * (directionXX - directionYY),
      -0.5900435899266435 * directionX * (directionXX - 3 * directionYY)
    );
  }

  for (let coefficientIndex = 0; coefficientIndex < basisValues.length; coefficientIndex++) {
    const basisValue = basisValues[coefficientIndex];
    for (let colorComponentIndex = 0; colorComponentIndex < 3; colorComponentIndex++) {
      color[colorComponentIndex] +=
        (coefficients[coefficientIndex * 3 + colorComponentIndex] ?? 0) * basisValue;
    }
  }

  return color;
}
