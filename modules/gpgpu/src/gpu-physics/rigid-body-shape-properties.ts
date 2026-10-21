// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBodyShape} from './rigid-body-properties';
import {getBodyInertia} from './sphere-shapes';

export type RigidBodyShapeProperties = {
  volume: number;
  center: [number, number, number];
  tensor: number[];
};

/** Geometric properties at unit density, with the tensor measured about its own COM. */
export function getRigidBodyShapeProperties(shape: GPURigidBodyShape): RigidBodyShapeProperties {
  if (shape.type === 'convex-hull' || shape.type === 'triangle-mesh') return shape.geometry;
  if (shape.type === 'plane') {
    if (
      [shape.sizeX, shape.sizeZ].some(
        size => size !== undefined && (!Number.isFinite(size) || size <= 0)
      )
    )
      throw new Error('Invalid plane extent');
    // A zero-volume surface contributes no automatic volume density or inertia.
    // Applications may supply mass and principal inertia explicitly.
    return {volume: 0, center: [0, 0, 0], tensor: Array<number>(9).fill(0)};
  }
  if (shape.type === 'sphere' || shape.type === 'box') {
    const diagonal = getBodyInertia(1, shape);
    const volume =
      shape.type === 'sphere'
        ? (4 * Math.PI * shape.radius ** 3) / 3
        : 8 * shape.halfExtents[0] * shape.halfExtents[1] * shape.halfExtents[2];
    return {
      volume,
      center: [0, 0, 0],
      tensor: [diagonal[0] * volume, 0, 0, 0, diagonal[1] * volume, 0, 0, 0, diagonal[2] * volume]
    };
  }
  const {height, radiusBottom, radiusTop} = shape;
  if (
    ![height, radiusBottom, radiusTop].every(Number.isFinite) ||
    height <= 0 ||
    Math.min(radiusBottom, radiusTop) < 0 ||
    Math.max(radiusBottom, radiusTop) <= 0
  )
    throw new Error('Invalid tapered shape');
  const segments: {lower: number; upper: number; radiusSquared: number[]}[] = [];
  const sphere = (center: number, radius: number, lower: number, upper: number) =>
    segments.push({
      lower,
      upper,
      radiusSquared: [radius * radius - center * center, 2 * center, -1]
    });
  const frustum = (lower: number, upper: number, bottom: number, top: number) => {
    const slope = (top - bottom) / (upper - lower),
      intercept = bottom - slope * lower;
    segments.push({
      lower,
      upper,
      radiusSquared: [intercept * intercept, 2 * intercept * slope, slope * slope]
    });
  };
  if (shape.type === 'cylinder') frustum(-height / 2, height / 2, radiusBottom, radiusTop);
  else if (Math.abs(radiusTop - radiusBottom) >= height) {
    const top = radiusTop >= radiusBottom;
    const center = top ? height / 2 : -height / 2;
    const radius = top ? radiusTop : radiusBottom;
    sphere(center, radius, center - radius, center + radius);
  } else {
    const slope = (radiusTop - radiusBottom) / height;
    const radial = Math.sqrt(1 - slope * slope);
    const lower = -height / 2 - radiusBottom * slope,
      upper = height / 2 - radiusTop * slope;
    sphere(-height / 2, radiusBottom, -height / 2 - radiusBottom, lower);
    frustum(lower, upper, radiusBottom * radial, radiusTop * radial);
    sphere(height / 2, radiusTop, upper, height / 2 + radiusTop);
  }
  const integrate = (coefficients: number[], lower: number, upper: number, shift = 0) =>
    coefficients.reduce(
      (sum, value, index) =>
        sum +
        (value * (upper ** (index + shift + 1) - lower ** (index + shift + 1))) /
          (index + shift + 1),
      0
    );
  let volume = 0,
    moment = 0,
    axial = 0,
    radial = 0;
  for (const {lower, upper, radiusSquared} of segments) {
    const squared = Array<number>(5).fill(0);
    for (let first = 0; first < 3; first++)
      for (let second = 0; second < 3; second++)
        squared[first + second] += radiusSquared[first] * radiusSquared[second];
    volume += Math.PI * integrate(radiusSquared, lower, upper);
    moment += Math.PI * integrate(radiusSquared, lower, upper, 1);
    axial += (Math.PI * integrate(squared, lower, upper)) / 2;
    radial +=
      Math.PI * (integrate(radiusSquared, lower, upper, 2) + integrate(squared, lower, upper) / 4);
  }
  const center = moment / volume;
  radial -= volume * center * center;
  return {volume, center: [0, center, 0], tensor: [radial, 0, 0, 0, axial, 0, 0, 0, radial]};
}
