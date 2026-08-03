// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ProjectionProvider} from './types';

/** WGS84 equatorial radius used by EPSG:3857, in metres. */
export const WEB_MERCATOR_EARTH_RADIUS = 6_378_137;

/** Latitude where the square Web Mercator world reaches its northern or southern edge. */
export const WEB_MERCATOR_MAX_LATITUDE = 85.05112877980659;

/**
 * Creates a dependency-free WGS84 longitude/latitude to EPSG:3857 projection provider.
 *
 * This is primarily a convenient zero-dependency input to {@link compileProjectionPlan}. Other
 * coordinate reference systems are supplied by adapters such as `@math.gl/proj4`.
 */
export function createWebMercatorProjection(): Exclude<ProjectionProvider, Function> {
  return {
    project: coordinates => {
      const [longitude, latitude] = coordinates;
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        throw new Error('Web Mercator longitude and latitude must be finite');
      }
      const clampedLatitude = Math.max(
        -WEB_MERCATOR_MAX_LATITUDE,
        Math.min(WEB_MERCATOR_MAX_LATITUDE, latitude)
      );
      const latitudeRadians = (clampedLatitude * Math.PI) / 180;
      return [
        (WEB_MERCATOR_EARTH_RADIUS * longitude * Math.PI) / 180,
        WEB_MERCATOR_EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2))
      ];
    },
    unproject: coordinates => {
      const [projectedX, projectedY] = coordinates;
      if (!Number.isFinite(projectedX) || !Number.isFinite(projectedY)) {
        throw new Error('Web Mercator projected coordinates must be finite');
      }
      return [
        (projectedX / WEB_MERCATOR_EARTH_RADIUS) * (180 / Math.PI),
        (2 * Math.atan(Math.exp(projectedY / WEB_MERCATOR_EARTH_RADIUS)) - Math.PI / 2) *
          (180 / Math.PI)
      ];
    }
  };
}
