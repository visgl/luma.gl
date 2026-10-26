// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4, type NumericArray} from '@math.gl/core';
import type {SceneSurface} from './scene-renderer';
import type {RayTracingSceneRenderOptions} from './ray-tracing-scene-renderer';

export type EmitterAreaCache = Map<
  string,
  {
    geometry: SceneSurface['geometry'];
    geometryVersion: number | undefined;
    positions: ArrayLike<number> | undefined;
    indices: ArrayLike<number> | undefined;
    transform: number[];
    sphereRadius: number;
    area: number;
  }
>;

/** Selection probabilities only; the shader retains the exact conditional surface PDF. */
export function makeEmitterDistribution(
  indices: readonly number[],
  options?: Pick<RayTracingSceneRenderOptions, 'surfaces' | 'primitives' | 'emitterSelection'>,
  areaCache: EmitterAreaCache = new Map()
): {probability: number; cumulative: number}[] {
  if (!indices.length) {
    areaCache.clear();
    return [];
  }
  const activeKeys = new Set<string>();
  const weights = new Map<number, number>();
  if (options?.emitterSelection === 'power') {
    let primitiveIndex = 0;
    const emitters = new Set(indices);
    for (const surface of options.surfaces) {
      const emission = surface.material.uniforms?.emissiveFactor ?? [0, 0, 0];
      const strength = surface.material.uniforms?.emissiveStrength ?? 1;
      const luminance = Math.max(
        0,
        (emission[0] * 0.2126 + emission[1] * 0.7152 + emission[2] * 0.0722) * strength
      );
      for (const [transformIndex, transform] of surface.transforms.entries()) {
        if (emitters.has(primitiveIndex)) {
          const primitive = options.primitives?.[surface.id];
          const key = `${surface.id}:${transformIndex}`;
          activeKeys.add(key);
          const area = getEmitterArea(
            surface,
            transform,
            primitive?.type === 'sphere' ? primitive.radius : 0,
            key,
            areaCache
          );
          weights.set(primitiveIndex, Number.isFinite(area * luminance) ? area * luminance : 0);
        }
        primitiveIndex++;
      }
    }
  }
  for (const key of areaCache.keys()) if (!activeKeys.has(key)) areaCache.delete(key);
  const maximumWeight = indices.reduce(
    (maximum, index) => Math.max(maximum, weights.get(index) ?? 0),
    0
  );
  const scaledWeights = indices.map(index =>
    maximumWeight > 0 ? (weights.get(index) ?? 0) / maximumWeight : 1
  );
  const totalWeight = scaledWeights.reduce((total, weight) => total + weight, 0);
  let cumulative = 0;
  let previousCumulative = 0;
  const uniformFraction = Math.min(0.5, Math.max(0.01, indices.length * 2 ** -22));
  return scaledWeights.map((weight, index) => {
    // A uniform component keeps tiny emitters reachable despite floating-point CDF rounding.
    const probability =
      ((1 - uniformFraction) * weight) / totalWeight + uniformFraction / indices.length;
    cumulative += probability;
    const uploadedCumulative = index === indices.length - 1 ? 1 : Math.fround(cumulative);
    const uploadedProbability = uploadedCumulative - previousCumulative;
    previousCumulative = uploadedCumulative;
    return {probability: uploadedProbability, cumulative: uploadedCumulative};
  });
}

function getEmitterArea(
  surface: SceneSurface,
  transform: Readonly<NumericArray>,
  sphereRadius: number,
  key: string,
  cache: EmitterAreaCache
): number {
  const positions = surface.geometry.attributes['POSITION']?.value;
  const indices = surface.geometry.indices?.value;
  const previous = cache.get(key);
  if (
    previous &&
    previous.geometry === surface.geometry &&
    previous.geometryVersion === surface.geometryVersion &&
    previous.positions === positions &&
    previous.indices === indices &&
    previous.sphereRadius === sphereRadius &&
    previous.transform.every((value, index) => value === transform[index])
  )
    return previous.area;
  let area = 0;
  if (sphereRadius > 0) {
    // Six-direction quadrature is a power proxy, not the conditional surface PDF.
    const matrix = new Matrix4(transform);
    const inverse = matrix.clone().invert();
    const normalLength =
      Math.hypot(inverse[0], inverse[4], inverse[8]) +
      Math.hypot(inverse[1], inverse[5], inverse[9]) +
      Math.hypot(inverse[2], inverse[6], inverse[10]);
    area = (4 * Math.PI * sphereRadius ** 2 * Math.abs(matrix.determinant()) * normalLength) / 3;
  } else if (positions) {
    const count = indices?.length ?? positions.length / 3;
    for (let triangleIndex = 0; triangleIndex + 2 < count; triangleIndex += 3) {
      const firstIndex = (indices?.[triangleIndex] ?? triangleIndex) * 3;
      const secondIndex = (indices?.[triangleIndex + 1] ?? triangleIndex + 1) * 3;
      const thirdIndex = (indices?.[triangleIndex + 2] ?? triangleIndex + 2) * 3;
      const firstEdgeX = positions[secondIndex] - positions[firstIndex];
      const firstEdgeY = positions[secondIndex + 1] - positions[firstIndex + 1];
      const firstEdgeZ = positions[secondIndex + 2] - positions[firstIndex + 2];
      const secondEdgeX = positions[thirdIndex] - positions[firstIndex];
      const secondEdgeY = positions[thirdIndex + 1] - positions[firstIndex + 1];
      const secondEdgeZ = positions[thirdIndex + 2] - positions[firstIndex + 2];
      const firstWorldX =
        transform[0] * firstEdgeX + transform[4] * firstEdgeY + transform[8] * firstEdgeZ;
      const firstWorldY =
        transform[1] * firstEdgeX + transform[5] * firstEdgeY + transform[9] * firstEdgeZ;
      const firstWorldZ =
        transform[2] * firstEdgeX + transform[6] * firstEdgeY + transform[10] * firstEdgeZ;
      const secondWorldX =
        transform[0] * secondEdgeX + transform[4] * secondEdgeY + transform[8] * secondEdgeZ;
      const secondWorldY =
        transform[1] * secondEdgeX + transform[5] * secondEdgeY + transform[9] * secondEdgeZ;
      const secondWorldZ =
        transform[2] * secondEdgeX + transform[6] * secondEdgeY + transform[10] * secondEdgeZ;
      area +=
        Math.hypot(
          firstWorldY * secondWorldZ - firstWorldZ * secondWorldY,
          firstWorldZ * secondWorldX - firstWorldX * secondWorldZ,
          firstWorldX * secondWorldY - firstWorldY * secondWorldX
        ) / 2;
    }
  }
  cache.set(key, {
    geometry: surface.geometry,
    geometryVersion: surface.geometryVersion,
    positions,
    indices,
    transform: Array.from(transform),
    sphereRadius,
    area
  });
  return area;
}
