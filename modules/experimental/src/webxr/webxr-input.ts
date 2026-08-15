// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray3} from '@math.gl/core';
import type {WebXRInputState} from './webxr-manager';

/** Experimental v10 world-space target ray derived from one WebXR input source. */
export type WebXRInputRay = {
  inputState: WebXRInputState;
  origin: NumberArray3;
  direction: NumberArray3;
  matrix: Float32Array;
};

/** Experimental v10 world-space grip pose derived from one tracked WebXR input source. */
export type WebXRInputGrip = {
  inputState: WebXRInputState;
  position: NumberArray3;
  matrix: Float32Array;
};

export type WebXRInputRayPlaneIntersectionProps = {
  planePoint?: NumberArray3;
  planeNormal?: NumberArray3;
  minDistance?: number;
  maxDistance?: number;
};

/** Experimental v10 world-space hit derived from one input ray and plane. */
export type WebXRInputRayPlaneIntersection = {
  ray: WebXRInputRay;
  point: NumberArray3;
  distance: number;
};

export function getWebXRInputRay(inputState: WebXRInputState): WebXRInputRay | null {
  const matrix = inputState.targetRayMatrix;
  if (!matrix) {
    return null;
  }

  const direction: NumberArray3 = [-matrix[8], -matrix[9], -matrix[10]];
  normalizeVector3(direction);

  return {
    inputState,
    origin: [matrix[12], matrix[13], matrix[14]],
    direction,
    matrix
  };
}

export function getWebXRInputGrip(inputState: WebXRInputState): WebXRInputGrip | null {
  const matrix = inputState.gripMatrix;
  if (!matrix) {
    return null;
  }

  return {
    inputState,
    position: [matrix[12], matrix[13], matrix[14]],
    matrix
  };
}

export function getWebXRInputRayPlaneIntersection(
  ray: WebXRInputRay,
  props: WebXRInputRayPlaneIntersectionProps = {}
): WebXRInputRayPlaneIntersection | null {
  const planePoint = props.planePoint || [0, 0, 0];
  const sourcePlaneNormal = props.planeNormal || [0, 1, 0];
  const planeNormal: NumberArray3 = [
    sourcePlaneNormal[0],
    sourcePlaneNormal[1],
    sourcePlaneNormal[2]
  ];
  if (!normalizeVector3(planeNormal, null)) {
    return null;
  }

  const denominator = dotVector3(ray.direction, planeNormal);
  if (Math.abs(denominator) < 1e-6) {
    return null;
  }

  const distance =
    dotVector3(
      [planePoint[0] - ray.origin[0], planePoint[1] - ray.origin[1], planePoint[2] - ray.origin[2]],
      planeNormal
    ) / denominator;

  if (
    distance < (props.minDistance ?? 0) ||
    (props.maxDistance !== undefined && distance > props.maxDistance)
  ) {
    return null;
  }

  return {
    ray,
    distance,
    point: [
      ray.origin[0] + ray.direction[0] * distance,
      ray.origin[1] + ray.direction[1] * distance,
      ray.origin[2] + ray.direction[2] * distance
    ]
  };
}

function dotVector3(left: NumberArray3, right: NumberArray3): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function normalizeVector3(
  vector: NumberArray3,
  fallback: NumberArray3 | null = [0, 0, -1]
): boolean {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length === 0) {
    if (!fallback) {
      return false;
    }
    vector[0] = fallback[0];
    vector[1] = fallback[1];
    vector[2] = fallback[2];
    return true;
  }

  vector[0] /= length;
  vector[1] /= length;
  vector[2] /= length;
  vector[0] ||= 0;
  vector[1] ||= 0;
  vector[2] ||= 0;
  return true;
}
