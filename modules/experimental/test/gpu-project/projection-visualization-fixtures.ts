// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionBounds, ProjectionCoordinates} from '@luma.gl/experimental/gpu-project';

/** Spherical visualization only: deliberately no claim of ellipsoidal/geodetic equivalence. */
export function makeVisualizationFixture(
  method: 'gnom' | 'ortho',
  inverse = false,
  center: ProjectionCoordinates = [0, 0]
) {
  const radius = 6371000;
  const geographic = `+proj=longlat +a=${radius} +b=${radius}`;
  const projected = `+proj=${method} +a=${radius} +b=${radius} +lat_0=${center[1]} +lon_0=${center[0]} +units=m`;
  // Rectangles strictly inside the visible hemisphere/disk, not implicit horizon clipping.
  const extent = center[1] === 0 ? 1000000 : 500000;
  const bounds: ProjectionBounds = inverse
    ? [-extent, -extent, extent, extent]
    : [center[0] - 10, center[1] - 10, center[0] + 10, center[1] + 10];
  const centerLatitude = (center[1] * Math.PI) / 180;
  const project = (position: ProjectionCoordinates): ProjectionCoordinates => {
    if (inverse) {
      const radial = Math.hypot(...position);
      const angle = method === 'gnom' ? Math.atan(radial / radius) : Math.asin(radial / radius);
      if (!radial) return center;
      return [
        center[0] +
          (Math.atan2(
            position[0] * Math.sin(angle),
            radial * Math.cos(centerLatitude) * Math.cos(angle) -
              position[1] * Math.sin(centerLatitude) * Math.sin(angle)
          ) *
            180) /
            Math.PI,
        (Math.asin(
          Math.cos(angle) * Math.sin(centerLatitude) +
            (position[1] * Math.sin(angle) * Math.cos(centerLatitude)) / radial
        ) *
          180) /
          Math.PI
      ];
    }
    const longitude = ((position[0] - center[0]) * Math.PI) / 180;
    const latitude = (position[1] * Math.PI) / 180;
    const cosine =
      Math.sin(centerLatitude) * Math.sin(latitude) +
      Math.cos(centerLatitude) * Math.cos(latitude) * Math.cos(longitude);
    const scale = method === 'gnom' ? radius / cosine : radius;
    return [
      scale * Math.cos(latitude) * Math.sin(longitude),
      scale *
        (Math.cos(centerLatitude) * Math.sin(latitude) -
          Math.sin(centerLatitude) * Math.cos(latitude) * Math.cos(longitude))
    ];
  };
  const isValid = (position: ProjectionCoordinates) =>
    position.every(Number.isFinite) &&
    position[0] >= bounds[0] &&
    position[1] >= bounds[1] &&
    position[0] <= bounds[2] &&
    position[1] <= bounds[3];
  return {
    radius,
    from: inverse ? projected : geographic,
    to: inverse ? geographic : projected,
    bounds,
    project,
    isValid,
    tolerance: inverse ? 1e-8 : 0.001
  };
}
