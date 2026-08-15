// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRBoundsPoint = [x: number, y: number, z: number];

export type WebXRBoundsState = {
  referenceSpace: XRBoundedReferenceSpace;
  boundsGeometry: readonly DOMPointReadOnly[];
  bounds: readonly WebXRBoundsPoint[];
  center: WebXRBoundsPoint;
  size: WebXRBoundsPoint;
  radius: number;
};

/** Experimental v10 helper for room-scale bounded-floor reference spaces. */
export function getWebXRBoundsState(
  referenceSpace: XRReferenceSpace | null
): WebXRBoundsState | null {
  if (!isWebXRBoundedReferenceSpace(referenceSpace)) {
    return null;
  }

  const boundsGeometry = Array.from(referenceSpace.boundsGeometry);
  const bounds = boundsGeometry.map(getWebXRBoundsPoint);
  const {center, size, radius} = getWebXRBoundsMetrics(bounds);

  return {
    referenceSpace,
    boundsGeometry,
    bounds,
    center,
    size,
    radius
  };
}

export function isWebXRBoundedReferenceSpace(
  referenceSpace: XRReferenceSpace | null
): referenceSpace is XRBoundedReferenceSpace {
  return Boolean(referenceSpace && 'boundsGeometry' in referenceSpace);
}

export function isPointInWebXRBounds(
  point: readonly [number, number, number],
  bounds: readonly WebXRBoundsPoint[]
): boolean {
  if (bounds.length < 3) {
    return false;
  }

  let inside = false;
  for (
    let index = 0, previousIndex = bounds.length - 1;
    index < bounds.length;
    previousIndex = index++
  ) {
    const current = bounds[index]!;
    const previous = bounds[previousIndex]!;
    const crossesZ =
      current[2] > point[2] !== previous[2] > point[2] &&
      point[0] <
        ((previous[0] - current[0]) * (point[2] - current[2])) / (previous[2] - current[2]) +
          current[0];

    if (crossesZ) {
      inside = !inside;
    }
  }

  return inside;
}

function getWebXRBoundsPoint(point: DOMPointReadOnly): WebXRBoundsPoint {
  return [point.x, point.y, point.z];
}

function getWebXRBoundsMetrics(bounds: readonly WebXRBoundsPoint[]): {
  center: WebXRBoundsPoint;
  size: WebXRBoundsPoint;
  radius: number;
} {
  if (bounds.length === 0) {
    return {
      center: [0, 0, 0],
      size: [0, 0, 0],
      radius: 0
    };
  }

  const minimum: WebXRBoundsPoint = [Infinity, Infinity, Infinity];
  const maximum: WebXRBoundsPoint = [-Infinity, -Infinity, -Infinity];
  for (const point of bounds) {
    minimum[0] = Math.min(minimum[0], point[0]);
    minimum[1] = Math.min(minimum[1], point[1]);
    minimum[2] = Math.min(minimum[2], point[2]);
    maximum[0] = Math.max(maximum[0], point[0]);
    maximum[1] = Math.max(maximum[1], point[1]);
    maximum[2] = Math.max(maximum[2], point[2]);
  }

  const center: WebXRBoundsPoint = [
    (minimum[0] + maximum[0]) * 0.5,
    (minimum[1] + maximum[1]) * 0.5,
    (minimum[2] + maximum[2]) * 0.5
  ];
  const size: WebXRBoundsPoint = [
    maximum[0] - minimum[0],
    maximum[1] - minimum[1],
    maximum[2] - minimum[2]
  ];
  let radius = 0;
  for (const point of bounds) {
    radius = Math.max(radius, Math.hypot(point[0] - center[0], point[2] - center[2]));
  }

  return {center, size, radius};
}
