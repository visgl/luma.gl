// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  PAUL_TAYLOR_POINT_COUNT,
  makeSyntheticTaxiPositions,
  makeTaxiZones
} from '../../showcase/billion-point-spatial-atlas/spatial-atlas-data';

export const TAXI_POINT_COUNT = 1_000_000;
export const TAXI_CORPUS_POINT_COUNT = PAUL_TAYLOR_POINT_COUNT;
export const TAXI_PROJECTION_ORIGIN = [-73.97, 40.75] as const;
export const TAXI_GRID_SIZE = [256, 256] as const;

const LOCAL_LONGITUDE_SCALE = 8;
const LOCAL_LATITUDE_SCALE = 9;
const KILOMETRES_PER_DEGREE = 40_000 / 360;
const DEGREES_TO_RADIANS = Math.PI / 180;

export type LuSpatialTaxiData = {
  pointCount: number;
  longitudeLatitudes: Float32Array;
  projectedBounds: readonly [number, number, number, number];
};

export type TaxiZonePreset = {
  id: number;
  name: string;
  borough: string;
  center: readonly [number, number];
  zoom: number;
};

/** Builds a longitude/latitude resident window from the atlas' deterministic public fixture. */
export function makeLuSpatialTaxiData(pointCount = TAXI_POINT_COUNT): LuSpatialTaxiData {
  const localPositions = makeSyntheticTaxiPositions(pointCount);
  const longitudeLatitudes = new Float32Array(pointCount * 2);
  const projectedBounds = [Infinity, Infinity, -Infinity, -Infinity];

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const localOffset = pointIndex * 3;
    const longitudeLatitudeOffset = pointIndex * 2;
    const longitude =
      localPositions[localOffset] / LOCAL_LONGITUDE_SCALE + TAXI_PROJECTION_ORIGIN[0];
    const latitude =
      localPositions[localOffset + 1] / LOCAL_LATITUDE_SCALE + TAXI_PROJECTION_ORIGIN[1];
    longitudeLatitudes[longitudeLatitudeOffset] = longitude;
    longitudeLatitudes[longitudeLatitudeOffset + 1] = latitude;

    const [projectedX, projectedY] = projectTaxiLongitudeLatitude([longitude, latitude]);
    projectedBounds[0] = Math.min(projectedBounds[0], projectedX);
    projectedBounds[1] = Math.min(projectedBounds[1], projectedY);
    projectedBounds[2] = Math.max(projectedBounds[2], projectedX);
    projectedBounds[3] = Math.max(projectedBounds[3], projectedY);
  }

  const padding = 0.25;
  return {
    pointCount,
    longitudeLatitudes,
    projectedBounds: [
      projectedBounds[0] - padding,
      projectedBounds[1] - padding,
      projectedBounds[2] + padding,
      projectedBounds[3] + padding
    ]
  };
}

/** Mirrors GPUSinusoidalProjection for tiny mutable query inputs. */
export function projectTaxiLongitudeLatitude(
  longitudeLatitude: readonly [number, number]
): readonly [number, number] {
  const [longitude, latitude] = longitudeLatitude;
  const midpointLatitudeRadians = (latitude + TAXI_PROJECTION_ORIGIN[1]) * 0.5 * DEGREES_TO_RADIANS;
  return [
    (TAXI_PROJECTION_ORIGIN[0] - longitude) *
      KILOMETRES_PER_DEGREE *
      Math.cos(midpointLatitudeRadians),
    (TAXI_PROJECTION_ORIGIN[1] - latitude) * KILOMETRES_PER_DEGREE
  ];
}

/** Taxi-zone centers used as navigation and radius-query presets. */
export function makeTaxiZonePresets(): readonly TaxiZonePreset[] {
  return makeTaxiZones().map(zone => {
    const localWidth = zone.bounds[2] - zone.bounds[0];
    const localHeight = zone.bounds[3] - zone.bounds[1];
    const longitude =
      ((zone.bounds[0] + zone.bounds[2]) * 0.5) / LOCAL_LONGITUDE_SCALE + TAXI_PROJECTION_ORIGIN[0];
    const latitude =
      ((zone.bounds[1] + zone.bounds[3]) * 0.5) / LOCAL_LATITUDE_SCALE + TAXI_PROJECTION_ORIGIN[1];
    const maximumExtent = Math.max(
      localWidth / LOCAL_LONGITUDE_SCALE,
      localHeight / LOCAL_LATITUDE_SCALE
    );
    return {
      id: zone.id,
      name: zone.name,
      borough: zone.borough,
      center: [longitude, latitude],
      zoom: Math.max(11, Math.min(16, Math.log2(0.18 / Math.max(maximumExtent, 0.002)) + 12))
    };
  });
}

export function getTaxiPoint(
  data: LuSpatialTaxiData,
  pointIndex: number
): {longitude: number; latitude: number} | null {
  if (!Number.isSafeInteger(pointIndex) || pointIndex < 0 || pointIndex >= data.pointCount) {
    return null;
  }
  return {
    longitude: data.longitudeLatitudes[pointIndex * 2],
    latitude: data.longitudeLatitudes[pointIndex * 2 + 1]
  };
}
