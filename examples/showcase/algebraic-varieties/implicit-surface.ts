// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type Vector3 = [number, number, number];

export type Ray3 = {
  origin: Vector3;
  direction: Vector3;
};

export type RayInterval = {
  near: number;
  far: number;
};

export type ImplicitIntersectionOptions = {
  boundingRadius: number;
  sampleCount?: number;
  refinementCount?: number;
  residualTolerance?: number;
};

function evaluatePointOnRay(ray: Ray3, distance: number): Vector3 {
  return [
    ray.origin[0] + ray.direction[0] * distance,
    ray.origin[1] + ray.direction[1] * distance,
    ray.origin[2] + ray.direction[2] * distance
  ];
}

/** Returns the forward interval where a ray lies inside a sphere centered at the origin. */
export function intersectRayWithBoundingSphere(ray: Ray3, radius: number): RayInterval | null {
  const directionLengthSquared =
    ray.direction[0] ** 2 + ray.direction[1] ** 2 + ray.direction[2] ** 2;
  const originDirection =
    ray.origin[0] * ray.direction[0] +
    ray.origin[1] * ray.direction[1] +
    ray.origin[2] * ray.direction[2];
  const originLengthSquared = ray.origin[0] ** 2 + ray.origin[1] ** 2 + ray.origin[2] ** 2;
  const discriminant =
    originDirection ** 2 - directionLengthSquared * (originLengthSquared - radius * radius);
  if (discriminant < 0 || directionLengthSquared === 0) {
    return null;
  }
  const root = Math.sqrt(discriminant);
  const near = Math.max(0, (-originDirection - root) / directionLengthSquared);
  const far = (-originDirection + root) / directionLengthSquared;
  return far > near ? {near, far} : null;
}

function refineBracketedRoot(
  ray: Ray3,
  evaluateField: (point: Vector3) => number,
  near: number,
  far: number,
  refinementCount: number
): number {
  let lowerDistance = near;
  let upperDistance = far;
  let lowerValue = evaluateField(evaluatePointOnRay(ray, lowerDistance));
  let upperValue = evaluateField(evaluatePointOnRay(ray, upperDistance));
  for (let iteration = 0; iteration < refinementCount; iteration++) {
    const width = upperDistance - lowerDistance;
    const denominator = upperValue - lowerValue;
    const secantDistance =
      Math.abs(denominator) > Number.EPSILON
        ? lowerDistance - (lowerValue * width) / denominator
        : (lowerDistance + upperDistance) / 2;
    const candidateDistance = Math.min(
      upperDistance - width * 0.1,
      Math.max(lowerDistance + width * 0.1, secantDistance)
    );
    const candidateValue = evaluateField(evaluatePointOnRay(ray, candidateDistance));
    if ((lowerValue <= 0 && candidateValue >= 0) || (lowerValue >= 0 && candidateValue <= 0)) {
      upperDistance = candidateDistance;
      upperValue = candidateValue;
    } else {
      lowerDistance = candidateDistance;
      lowerValue = candidateValue;
    }
  }
  return (lowerDistance + upperDistance) / 2;
}

function refineResidualMinimum(
  ray: Ray3,
  evaluateField: (point: Vector3) => number,
  near: number,
  center: number,
  far: number,
  refinementCount: number
): {distance: number; residual: number} {
  let lowerDistance = near;
  let upperDistance = far;
  let bestDistance = center;
  let bestResidual = Math.abs(evaluateField(evaluatePointOnRay(ray, center)));
  for (let iteration = 0; iteration < refinementCount; iteration++) {
    const leftDistance = (2 * lowerDistance + upperDistance) / 3;
    const rightDistance = (lowerDistance + 2 * upperDistance) / 3;
    const leftResidual = Math.abs(evaluateField(evaluatePointOnRay(ray, leftDistance)));
    const rightResidual = Math.abs(evaluateField(evaluatePointOnRay(ray, rightDistance)));
    if (leftResidual < bestResidual) {
      bestDistance = leftDistance;
      bestResidual = leftResidual;
    }
    if (rightResidual < bestResidual) {
      bestDistance = rightDistance;
      bestResidual = rightResidual;
    }
    if (leftResidual <= rightResidual) {
      upperDistance = rightDistance;
    } else {
      lowerDistance = leftDistance;
    }
  }
  return {distance: bestDistance, residual: bestResidual};
}

/**
 * CPU reference for the showcase's fixed-sample implicit intersection strategy.
 *
 * This is intentionally a numerical root finder, not sphere tracing: field values are never used
 * as safe travel distances.
 */
export function intersectImplicitRay(
  ray: Ray3,
  evaluateField: (point: Vector3) => number,
  options: ImplicitIntersectionOptions
): number | null {
  const interval = intersectRayWithBoundingSphere(ray, options.boundingRadius);
  if (!interval) {
    return null;
  }
  const sampleCount = options.sampleCount ?? 96;
  const refinementCount = options.refinementCount ?? 14;
  const residualTolerance = options.residualTolerance ?? 1e-6;
  const sampleStep = (interval.far - interval.near) / sampleCount;
  let previousPreviousResidual = Number.POSITIVE_INFINITY;
  let previousDistance = interval.near;
  let previousValue = evaluateField(evaluatePointOnRay(ray, previousDistance));
  let previousResidual = Math.abs(previousValue);
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let sampleIndex = 1; sampleIndex <= sampleCount; sampleIndex++) {
    const distance = interval.near + sampleIndex * sampleStep;
    const value = evaluateField(evaluatePointOnRay(ray, distance));
    const residual = Math.abs(value);
    if ((previousValue <= 0 && value >= 0) || (previousValue >= 0 && value <= 0)) {
      nearestDistance = Math.min(
        nearestDistance,
        refineBracketedRoot(ray, evaluateField, previousDistance, distance, refinementCount)
      );
    }
    if (
      previousResidual <= previousPreviousResidual &&
      previousResidual <= residual &&
      previousResidual < sampleStep
    ) {
      const refined = refineResidualMinimum(
        ray,
        evaluateField,
        Math.max(interval.near, previousDistance - sampleStep),
        previousDistance,
        Math.min(interval.far, previousDistance + sampleStep),
        refinementCount
      );
      if (refined.residual <= residualTolerance) {
        nearestDistance = Math.min(nearestDistance, refined.distance);
      }
    }
    previousPreviousResidual = previousResidual;
    previousDistance = distance;
    previousValue = value;
    previousResidual = residual;
  }
  return Number.isFinite(nearestDistance) ? nearestDistance : null;
}
