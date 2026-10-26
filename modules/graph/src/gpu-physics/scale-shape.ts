// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBodyShape} from './rigid-body-properties';

/** Scale an analytic collider exactly. Mesh deformation and ellipsoids require recooking. */
export function scaleRigidBodyShape(
  shape: GPURigidBodyShape,
  scale: readonly number[]
): GPURigidBodyShape {
  if (scale.length !== 3 || scale.some(value => !Number.isFinite(value) || value <= 0))
    throw new Error('Invalid collider scale');
  const [horizontal, vertical, depth] = scale;
  const equal = (first: number, second: number) =>
    Math.abs(first - second) <= 1e-6 * Math.max(first, second);
  switch (shape.type) {
    case 'box':
      return {
        ...shape,
        halfExtents: [
          shape.halfExtents[0] * horizontal,
          shape.halfExtents[1] * vertical,
          shape.halfExtents[2] * depth
        ]
      };
    case 'plane':
      return {
        ...shape,
        sizeX: shape.sizeX === undefined ? undefined : shape.sizeX * horizontal,
        sizeZ: shape.sizeZ === undefined ? undefined : shape.sizeZ * depth
      };
    case 'sphere':
      if (!equal(horizontal, vertical) || !equal(horizontal, depth))
        throw new Error('Sphere scale requires an ellipsoid');
      return {...shape, radius: shape.radius * horizontal};
    case 'capsule':
    case 'cylinder':
      if (!equal(horizontal, depth) || (shape.type === 'capsule' && !equal(horizontal, vertical)))
        throw new Error('Unsupported tapered collider scale');
      return {
        ...shape,
        height: shape.height * vertical,
        radiusBottom: shape.radiusBottom * horizontal,
        radiusTop: shape.radiusTop * horizontal
      };
    default:
      throw new Error('Mesh scale requires a collider rebuild');
  }
}
