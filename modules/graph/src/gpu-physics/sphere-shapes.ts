// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSpherePlane} from './gpu-sphere-world';

/** Static axis-aligned solid box, composed into six bounded outward-facing surfaces. */
export type GPUSphereBox = {
  center: readonly [number, number, number];
  halfExtents: readonly [number, number, number];
  material?: Omit<GPUSpherePlane, 'normal' | 'offset' | 'center' | 'halfExtents'>;
};

/** Bodies must start outside boxes. Faces share the world's 32-surface capacity. */
export function makeSphereBoxPlanes(box: GPUSphereBox): GPUSpherePlane[] {
  if (
    !box.center.every(Number.isFinite) ||
    box.halfExtents.some(value => !Number.isFinite(value) || value <= 0)
  ) {
    throw new Error('Invalid sphere box');
  }
  const surfaces: GPUSpherePlane[] = [];
  for (let axis = 0; axis < 3; axis++) {
    for (const side of [-1, 1]) {
      const normal: [number, number, number] = [0, 0, 0];
      normal[axis] = side;
      const center: [number, number, number] = [...box.center];
      center[axis] += side * box.halfExtents[axis];
      // Match GPUSphereWorld's deterministic tangent frame for each normal.
      const firstAxis = axis === 2 ? 0 : 2;
      const secondAxis = axis === 1 ? 0 : 1;
      surfaces.push({
        ...box.material,
        normal,
        center,
        halfExtents: [box.halfExtents[firstAxis], box.halfExtents[secondAxis]]
      });
    }
  }
  return surfaces;
}

/** Principal inertia for a solid sphere or axis-aligned solid box, in mass * length². */
export function getBodyInertia(
  mass: number,
  shape:
    | {type: 'sphere'; radius: number}
    | {type: 'box'; halfExtents: readonly [number, number, number]}
): [number, number, number] {
  if (!Number.isFinite(mass) || mass < 0) throw new Error('Invalid body mass');
  if (shape.type === 'sphere') {
    if (!(shape.radius > 0) || !Number.isFinite(shape.radius))
      throw new Error('Invalid sphere radius');
    const inertia = 0.4 * mass * shape.radius ** 2;
    return [inertia, inertia, inertia];
  }
  if (shape.halfExtents.some(value => !(value > 0) || !Number.isFinite(value)))
    throw new Error('Invalid box extents');
  const [horizontal, vertical, depth] = shape.halfExtents;
  return [
    (mass * (vertical ** 2 + depth ** 2)) / 3,
    (mass * (horizontal ** 2 + depth ** 2)) / 3,
    (mass * (horizontal ** 2 + vertical ** 2)) / 3
  ];
}
