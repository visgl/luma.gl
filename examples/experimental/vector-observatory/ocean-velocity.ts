// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Ocean velocity grids use eastward/northward metres per second on a regular lon/lat grid. */
export type OceanVelocityGrid = {
  width: number;
  height: number;
  west: number;
  east: number;
  south: number;
  north: number;
  eastward: Float32Array;
  northward: Float32Array;
  /** Zero marks land or missing observations. */
  valid?: Uint8Array;
};

export type GeographicPosition = {longitude: number; latitude: number};
export type GeographicVelocity = {eastward: number; northward: number};

const EARTH_RADIUS_METRES = 6371008.8;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Bilinear sampling with conservative missing-data handling. Undefined means no ocean velocity. */
export function sampleOceanVelocity(
  grid: OceanVelocityGrid,
  longitude: number,
  latitude: number
): GeographicVelocity | undefined {
  const {width, height, west, east, south, north, eastward, northward, valid} = grid;
  if (width < 2 || height < 2 || east <= west || north <= south) return undefined;
  if (eastward.length !== width * height || northward.length !== width * height) return undefined;
  if (valid && valid.length !== width * height) return undefined;
  const span = east - west;
  const periodic = Math.abs(span - 360) < 1e-6;
  const lon = periodic ? west + (((longitude - west) % span) + span) % span : longitude;
  const x = ((lon - west) / span) * (periodic ? width : width - 1);
  const y = ((latitude - south) / (north - south)) * (height - 1);
  if (x < 0 || x > width - 1 && !periodic || y < 0 || y > height - 1) return undefined;
  const x0 = Math.floor(x);
  const x1 = periodic ? (x0 + 1) % width : Math.min(width - 1, x0 + 1);
  const y0 = Math.floor(y);
  const y1 = Math.min(height - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const indices = [y0 * width + x0, y0 * width + x1, y1 * width + x0, y1 * width + x1];
  const weights = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy];
  let u = 0;
  let v = 0;
  for (let i = 0; i < 4; i++) {
    if (weights[i] === 0) continue;
    const index = indices[i];
    if ((valid && valid[index] === 0) || !Number.isFinite(eastward[index]) || !Number.isFinite(northward[index])) {
      return undefined;
    }
    u += weights[i] * eastward[index];
    v += weights[i] * northward[index];
  }
  return {eastward: u, northward: v};
}

/** Convert local east/north metres per second to longitude/latitude degrees per second. */
export function geographicDerivative(
  velocity: GeographicVelocity,
  latitude: number
): GeographicPosition | undefined {
  const cosine = Math.cos(latitude * DEG_TO_RAD);
  if (Math.abs(cosine) < 1e-6) return undefined;
  return {
    longitude: (velocity.eastward / (EARTH_RADIUS_METRES * cosine)) * RAD_TO_DEG,
    latitude: (velocity.northward / EARTH_RADIUS_METRES) * RAD_TO_DEG
  };
}

/** One midpoint (RK2) step; returns undefined if the path encounters missing/land data. */
export function advectOceanRK2(
  grid: OceanVelocityGrid,
  position: GeographicPosition,
  seconds: number
): GeographicPosition | undefined {
  const initial = sampleOceanVelocity(grid, position.longitude, position.latitude);
  if (!initial) return undefined;
  const k1 = geographicDerivative(initial, position.latitude);
  if (!k1) return undefined;
  const middle = {
    longitude: position.longitude + 0.5 * seconds * k1.longitude,
    latitude: position.latitude + 0.5 * seconds * k1.latitude
  };
  const velocity = sampleOceanVelocity(grid, middle.longitude, middle.latitude);
  if (!velocity) return undefined;
  const k2 = geographicDerivative(velocity, middle.latitude);
  if (!k2) return undefined;
  const longitude = position.longitude + seconds * k2.longitude;
  const latitude = position.latitude + seconds * k2.latitude;
  return Number.isFinite(longitude) && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    ? {longitude, latitude}
    : undefined;
}
