// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OrbitControllerProps} from '../../orbit-controller';

export const TEMPEST_OCEAN_FIELD_OF_VIEW_DEGREES = 54;

/** Camera bounds keep manual and cinematic views above the largest authored crests. */
export const TEMPEST_OCEAN_CAMERA_PROPS = Object.freeze({
  target: Object.freeze([0, 2.8, 0]) as readonly [number, number, number],
  distance: 126,
  yaw: 0.68,
  pitch: 0.16,
  minDistance: 72,
  maxDistance: 248,
  minPitch: 0.1,
  maxPitch: 0.72,
  rotateSpeed: 0.0042,
  zoomSpeed: 0.001,
  autoRotate: true,
  autoRotateSpeed: 0.025
}) satisfies Readonly<OrbitControllerProps>;

/** Lowest possible camera eye height under the shared orbit-controller clamps. */
export function getTempestOceanMinimumCameraHeight(): number {
  return (
    TEMPEST_OCEAN_CAMERA_PROPS.target[1] +
    TEMPEST_OCEAN_CAMERA_PROPS.minDistance * Math.sin(TEMPEST_OCEAN_CAMERA_PROPS.minPitch)
  );
}

/**
 * Deterministic celestial key anchored in camera space so the authored storm break stays
 * upper-right throughout cinematic orbiting. The returned world direction also lights the water.
 */
export function getTempestOceanSunDirection(
  cameraPosition: readonly [number, number, number]
): readonly [number, number, number] {
  const forward = normalizeVector([
    TEMPEST_OCEAN_CAMERA_PROPS.target[0] - cameraPosition[0],
    TEMPEST_OCEAN_CAMERA_PROPS.target[1] - cameraPosition[1],
    TEMPEST_OCEAN_CAMERA_PROPS.target[2] - cameraPosition[2]
  ]);
  const right = normalizeVector([-forward[2], 0, forward[0]]);
  const cameraUp = normalizeVector([
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0]
  ]);
  const forwardWeight = 1;
  const rightWeight = 0.12;
  const upWeight = 0.34;
  return Object.freeze(
    [
      forward[0] * forwardWeight + right[0] * rightWeight + cameraUp[0] * upWeight,
      forward[1] * forwardWeight + right[1] * rightWeight + cameraUp[1] * upWeight,
      forward[2] * forwardWeight + right[2] * rightWeight + cameraUp[2] * upWeight
    ].map(component => component / Math.hypot(forwardWeight, rightWeight, upWeight))
  ) as readonly [number, number, number];
}

function normalizeVector(
  vector: readonly [number, number, number]
): readonly [number, number, number] {
  const length = Math.hypot(...vector);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}
