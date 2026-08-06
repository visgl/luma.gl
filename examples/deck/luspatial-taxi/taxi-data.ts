// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  PAUL_TAYLOR_POINT_COUNT,
  makeSyntheticTaxiPositions,
  makeTaxiZones
} from '../../showcase/billion-point-spatial-atlas/spatial-atlas-data';
import type {TaxiPointResidentWindow} from '../../showcase/billion-point-spatial-atlas/taxi-resident-window';
import type {
  TaxiPointSourceMetadata,
  TaxiPointSourceTelemetry
} from '../../showcase/billion-point-spatial-atlas/taxi-source';

export const TAXI_POINT_COUNT = 1_000_000;
export const TAXI_CORPUS_POINT_COUNT = PAUL_TAYLOR_POINT_COUNT;
export const TAXI_PROJECTION_ORIGIN = [-73.97, 40.75] as const;
export const TAXI_GRID_SIZE = [256, 256] as const;

const TAXI_GENERATION_CHUNK_SIZE = 20_000;
const TAXI_SOURCE_BOUNDS_PADDING = 0.002;
const LOCAL_LONGITUDE_SCALE = 8;
const LOCAL_LATITUDE_SCALE = 9;
const KILOMETRES_PER_DEGREE = 40_000 / 360;
const DEGREES_TO_RADIANS = Math.PI / 180;

export type LuSpatialTaxiData = {
  pointCount: number;
  corpusPointCount: number;
  longitudeLatitudes: Float32Array;
  sourceBounds: readonly [number, number, number, number];
  projectedBounds: readonly [number, number, number, number];
  sourceRowIndices?: Float64Array;
  sourceKind: 'synthetic' | 'packed';
  sourceLabel: string;
  sourceTelemetry?: TaxiPointSourceTelemetry;
};

export type LuSpatialTaxiDataGenerationOptions = {
  chunkSize?: number;
  onProgress?: (processedPointCount: number, totalPointCount: number) => void;
  signal?: AbortSignal;
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
  const longitudeLatitudes = new Float32Array(pointCount * 2);
  const sourceBounds = [Infinity, Infinity, -Infinity, -Infinity];

  for (let firstPointIndex = 0; firstPointIndex < pointCount; ) {
    const chunkPointCount = Math.min(TAXI_GENERATION_CHUNK_SIZE, pointCount - firstPointIndex);
    appendTaxiPositionChunk(longitudeLatitudes, sourceBounds, firstPointIndex, chunkPointCount);
    firstPointIndex += chunkPointCount;
  }

  return makeTaxiDataFromBounds(pointCount, longitudeLatitudes, sourceBounds);
}

/** Generates deterministic taxi rows progressively without monopolizing the browser main thread. */
export async function makeLuSpatialTaxiDataAsync(
  pointCount = TAXI_POINT_COUNT,
  options: LuSpatialTaxiDataGenerationOptions = {}
): Promise<LuSpatialTaxiData> {
  const {onProgress, signal} = options;
  const chunkSize = Math.max(1, Math.floor(options.chunkSize ?? TAXI_GENERATION_CHUNK_SIZE));
  const longitudeLatitudes = new Float32Array(pointCount * 2);
  const sourceBounds = [Infinity, Infinity, -Infinity, -Infinity];

  signal?.throwIfAborted();
  onProgress?.(0, pointCount);

  for (let firstPointIndex = 0; firstPointIndex < pointCount; ) {
    await yieldTaxiGeneration(signal);
    signal?.throwIfAborted();

    const chunkPointCount = Math.min(chunkSize, pointCount - firstPointIndex);
    appendTaxiPositionChunk(longitudeLatitudes, sourceBounds, firstPointIndex, chunkPointCount);
    firstPointIndex += chunkPointCount;
    onProgress?.(firstPointIndex, pointCount);
  }

  signal?.throwIfAborted();
  return makeTaxiDataFromBounds(pointCount, longitudeLatitudes, sourceBounds);
}

function appendTaxiPositionChunk(
  longitudeLatitudes: Float32Array,
  sourceBounds: number[],
  firstPointIndex: number,
  pointCount: number
): void {
  const localPositions = makeSyntheticTaxiPositions(pointCount, firstPointIndex);

  for (let localPointIndex = 0; localPointIndex < pointCount; localPointIndex++) {
    const localOffset = localPointIndex * 3;
    const longitudeLatitudeOffset = (firstPointIndex + localPointIndex) * 2;
    const longitude =
      localPositions[localOffset] / LOCAL_LONGITUDE_SCALE + TAXI_PROJECTION_ORIGIN[0];
    const latitude =
      localPositions[localOffset + 1] / LOCAL_LATITUDE_SCALE + TAXI_PROJECTION_ORIGIN[1];
    longitudeLatitudes[longitudeLatitudeOffset] = longitude;
    longitudeLatitudes[longitudeLatitudeOffset + 1] = latitude;
    sourceBounds[0] = Math.min(sourceBounds[0], longitude);
    sourceBounds[1] = Math.min(sourceBounds[1], latitude);
    sourceBounds[2] = Math.max(sourceBounds[2], longitude);
    sourceBounds[3] = Math.max(sourceBounds[3], latitude);
  }
}

function makeTaxiDataFromBounds(
  pointCount: number,
  longitudeLatitudes: Float32Array,
  sourceBounds: number[]
): LuSpatialTaxiData {
  const projectionSourceBounds = makeProjectionSourceBounds(sourceBounds);
  const projectedCorners = [
    projectTaxiLongitudeLatitude([sourceBounds[0], sourceBounds[1]]),
    projectTaxiLongitudeLatitude([sourceBounds[0], sourceBounds[3]]),
    projectTaxiLongitudeLatitude([sourceBounds[2], sourceBounds[1]]),
    projectTaxiLongitudeLatitude([sourceBounds[2], sourceBounds[3]])
  ];
  const projectedBounds = [Infinity, Infinity, -Infinity, -Infinity];

  for (const [projectedX, projectedY] of projectedCorners) {
    projectedBounds[0] = Math.min(projectedBounds[0], projectedX);
    projectedBounds[1] = Math.min(projectedBounds[1], projectedY);
    projectedBounds[2] = Math.max(projectedBounds[2], projectedX);
    projectedBounds[3] = Math.max(projectedBounds[3], projectedY);
  }

  const padding = 0.25;
  return {
    pointCount,
    corpusPointCount: TAXI_CORPUS_POINT_COUNT,
    longitudeLatitudes,
    sourceBounds: projectionSourceBounds,
    projectedBounds: [
      projectedBounds[0] - padding,
      projectedBounds[1] - padding,
      projectedBounds[2] + padding,
      projectedBounds[3] + padding
    ],
    sourceKind: 'synthetic',
    sourceLabel: 'Synthetic public-sample expansion'
  };
}

function makeProjectionSourceBounds(
  sourceBounds: readonly number[]
): readonly [number, number, number, number] {
  const longitudeExtent =
    Math.max(
      TAXI_PROJECTION_ORIGIN[0] - sourceBounds[0],
      sourceBounds[2] - TAXI_PROJECTION_ORIGIN[0]
    ) + TAXI_SOURCE_BOUNDS_PADDING;
  const latitudeExtent =
    Math.max(
      TAXI_PROJECTION_ORIGIN[1] - sourceBounds[1],
      sourceBounds[3] - TAXI_PROJECTION_ORIGIN[1]
    ) + TAXI_SOURCE_BOUNDS_PADDING;
  const projectionSourceBounds = [
    TAXI_PROJECTION_ORIGIN[0] - longitudeExtent,
    TAXI_PROJECTION_ORIGIN[1] - latitudeExtent,
    TAXI_PROJECTION_ORIGIN[0] + longitudeExtent,
    TAXI_PROJECTION_ORIGIN[1] + latitudeExtent
  ] as const;
  return projectionSourceBounds;
}

function yieldTaxiGeneration(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', abortGeneration);
      resolve();
    }, 0);
    const abortGeneration = () => {
      clearTimeout(timeout);
      reject(signal?.reason ?? new DOMException('Taxi generation was cancelled', 'AbortError'));
    };

    signal?.addEventListener('abort', abortGeneration, {once: true});
  });
}

/**
 * Converts an explicitly WGS84 longitude/latitude resident window into deck.gl taxi data.
 *
 * Packed sources remain coordinate-neutral until this adapter. CRS84 and the browser convention
 * for WGS84/EPSG:4326 are interpreted as X=longitude and Y=latitude.
 */
export function makeLuSpatialTaxiDataFromResidentWindow(
  window: TaxiPointResidentWindow
): LuSpatialTaxiData {
  assertLongitudeLatitudeTaxiMetadata(window.metadata);
  if (window.positions.length !== window.rowCount * 2) {
    throw new Error('Taxi resident window positions must contain two values per row');
  }
  if (window.sourceRowIndices.length !== window.rowCount) {
    throw new Error('Taxi resident window sourceRowIndices must align with positions');
  }

  const sourceBounds = [Infinity, Infinity, -Infinity, -Infinity];
  const projectedBounds = [Infinity, Infinity, -Infinity, -Infinity];
  let finiteRowCount = 0;
  for (let rowIndex = 0; rowIndex < window.rowCount; rowIndex++) {
    const longitude = window.positions[rowIndex * 2];
    const latitude = window.positions[rowIndex * 2 + 1];
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new Error(
        `Taxi source row ${window.sourceRowIndices[rowIndex]} is outside longitude/latitude bounds`
      );
    }
    sourceBounds[0] = Math.min(sourceBounds[0], longitude);
    sourceBounds[1] = Math.min(sourceBounds[1], latitude);
    sourceBounds[2] = Math.max(sourceBounds[2], longitude);
    sourceBounds[3] = Math.max(sourceBounds[3], latitude);
    const [projectedX, projectedY] = projectTaxiLongitudeLatitude([longitude, latitude]);
    projectedBounds[0] = Math.min(projectedBounds[0], projectedX);
    projectedBounds[1] = Math.min(projectedBounds[1], projectedY);
    projectedBounds[2] = Math.max(projectedBounds[2], projectedX);
    projectedBounds[3] = Math.max(projectedBounds[3], projectedY);
    finiteRowCount++;
  }
  if (finiteRowCount === 0) {
    throw new Error('Taxi resident window does not contain a finite longitude/latitude row');
  }

  const padding = 0.25;
  return {
    pointCount: window.rowCount,
    corpusPointCount: window.sourceRowCount,
    longitudeLatitudes: window.positions,
    sourceBounds: makeProjectionSourceBounds(sourceBounds),
    projectedBounds: [
      projectedBounds[0] - padding,
      projectedBounds[1] - padding,
      projectedBounds[2] + padding,
      projectedBounds[3] + padding
    ],
    sourceRowIndices: window.sourceRowIndices,
    sourceKind: 'packed',
    sourceLabel: 'Packed row-group source',
    sourceTelemetry: window.telemetry
  };
}

/** Rejects source-XY data until its manifest explicitly declares WGS84 longitude/latitude. */
export function assertLongitudeLatitudeTaxiMetadata(metadata: TaxiPointSourceMetadata): void {
  const coordinateReferenceSystem = metadata.coordinateSpace.crs?.trim().toUpperCase();
  if (
    coordinateReferenceSystem !== 'OGC:CRS84' &&
    coordinateReferenceSystem !== 'CRS84' &&
    coordinateReferenceSystem !== 'EPSG:4326' &&
    coordinateReferenceSystem !== 'WGS84'
  ) {
    throw new Error(
      'luSpatial taxi sources must explicitly declare OGC:CRS84 or WGS84/EPSG:4326 longitude/latitude coordinates'
    );
  }
}

/** CPU projection provider and tiny query-input companion for the adaptive luProj GPU plan. */
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
): {
  longitude: number;
  latitude: number;
  sourceRowIndex: number;
  sourceKind: LuSpatialTaxiData['sourceKind'];
} | null {
  if (!Number.isSafeInteger(pointIndex) || pointIndex < 0 || pointIndex >= data.pointCount) {
    return null;
  }
  return {
    longitude: data.longitudeLatitudes[pointIndex * 2],
    latitude: data.longitudeLatitudes[pointIndex * 2 + 1],
    sourceRowIndex: data.sourceRowIndices?.[pointIndex] ?? pointIndex,
    sourceKind: data.sourceKind
  };
}
