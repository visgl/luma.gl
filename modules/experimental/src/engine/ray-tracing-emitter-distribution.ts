// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {RayTracingSceneRenderOptions} from './ray-tracing-scene-renderer';

/** Selection probabilities only; the shader retains the exact conditional surface PDF. */
export function makeEmitterDistribution(
  indices: readonly number[],
  options?: Pick<RayTracingSceneRenderOptions, 'surfaces' | 'primitives' | 'emitterSelection'>
): {probability: number; cumulative: number}[] {
  if (!indices.length) return [];
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
      for (const transform of surface.transforms) {
        if (emitters.has(primitiveIndex)) {
          const primitive = options.primitives?.[surface.id];
          let area = 0;
          if (primitive?.type === 'sphere') {
            // Six-point quadrature is a power proxy for affine spheres, not the surface PDF.
            // The sampled local-normal Jacobian in the shader remains exact.
            const inverse = new Matrix4(transform).invert();
            const determinant = Math.abs(new Matrix4(transform).determinant());
            const normalLengths = [0, 1, 2].map(axis =>
              Math.hypot(inverse[axis], inverse[axis + 4], inverse[axis + 8])
            );
            area =
              (4 *
                Math.PI *
                primitive.radius ** 2 *
                determinant *
                (normalLengths[0] + normalLengths[1] + normalLengths[2])) /
              3;
          } else {
            const positions = surface.geometry.attributes['POSITION']?.value;
            const triangleIndices = surface.geometry.indices?.value;
            if (positions) {
              const count = triangleIndices?.length ?? positions.length / 3;
              const matrix = new Matrix4(transform);
              for (let triangle = 0; triangle + 2 < count; triangle += 3) {
                const vertices = [0, 1, 2].map(vertex => {
                  const positionIndex =
                    (triangleIndices?.[triangle + vertex] ?? triangle + vertex) * 3;
                  return matrix.transformAsPoint([
                    positions[positionIndex],
                    positions[positionIndex + 1],
                    positions[positionIndex + 2]
                  ]);
                });
                const firstEdge = vertices[1].map((value, axis) => value - vertices[0][axis]);
                const secondEdge = vertices[2].map((value, axis) => value - vertices[0][axis]);
                area +=
                  Math.hypot(
                    firstEdge[1] * secondEdge[2] - firstEdge[2] * secondEdge[1],
                    firstEdge[2] * secondEdge[0] - firstEdge[0] * secondEdge[2],
                    firstEdge[0] * secondEdge[1] - firstEdge[1] * secondEdge[0]
                  ) / 2;
              }
            }
          }
          weights.set(primitiveIndex, Number.isFinite(area * luminance) ? area * luminance : 0);
        }
        primitiveIndex++;
      }
    }
  }
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
