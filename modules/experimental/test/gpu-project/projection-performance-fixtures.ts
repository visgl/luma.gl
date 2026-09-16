// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Proj4Projection} from '@math.gl/proj4';
import {planCRSProjection} from '@luma.gl/experimental/gpu-project/crs';
import type {ProjectionBounds, ProjectionCoordinates} from '@luma.gl/experimental/gpu-project';
import type {ProjectionProgramBenchmarkOptions} from '@luma.gl/experimental/gpu-project/benchmarks';
import {
  geographicCRS,
  makeTransverseMercatorCRS,
  makeConicCRS,
  getConicOracleDefinition
} from './projection-crs-fixtures';

export const performanceFixtures = [
  {
    id: 'utm-local',
    bounds: [-122.5, 37.7, -122.3, 37.9],
    definition: makeTransverseMercatorCRS(10),
    serialized: '+proj=utm +zone=10 +datum=WGS84'
  },
  {
    id: 'utm-regional',
    bounds: [-123, 37.3, -122, 38.3],
    definition: makeTransverseMercatorCRS(10),
    serialized: '+proj=utm +zone=10 +datum=WGS84'
  },
  {
    id: 'albers-regional',
    bounds: [-72, 41.3, -71, 42.3],
    definition: makeConicCRS('albers'),
    serialized: getConicOracleDefinition('albers')
  }
] satisfies {
  id: string;
  bounds: ProjectionBounds;
  definition: ReturnType<typeof makeTransverseMercatorCRS> | ReturnType<typeof makeConicCRS>;
  serialized: string;
}[];

/** Strict opt-in controls: never silently run an empty or malformed measurement matrix. */
export function parsePerformanceSweep(value: string | undefined, defaults: number[]): number[] {
  if (value === undefined) return defaults;
  const values = value.split(',').map(Number);
  if (
    !values.length ||
    values.some(number => !Number.isSafeInteger(number) || number < 1) ||
    new Set(values).size !== values.length
  )
    throw new Error('expected unique positive integer sweep values');
  return values;
}

export function makePerformanceCoordinates(
  bounds: ProjectionBounds,
  rowCount: number
): ProjectionCoordinates[] {
  const [minimumX, minimumY, maximumX, maximumY] = bounds;
  const middleX = (minimumX + maximumX) / 2;
  const middleY = (minimumY + maximumY) / 2;
  return [
    ...Array.from(
      {length: rowCount},
      (_value, index): ProjectionCoordinates => [
        minimumX + (maximumX - minimumX) * ((index + 0.5) / rowCount),
        minimumY + (maximumY - minimumY) * (((index + 1) * 0.6180339887498949) % 1)
      ]
    ),
    // Probe outer boundaries and the first subdivision seams as well as ordinary rows.
    [minimumX, minimumY],
    [minimumX, maximumY],
    [maximumX, minimumY],
    [maximumX, maximumY],
    [middleX, minimumY],
    [middleX, maximumY],
    [minimumX, middleY],
    [maximumX, middleY],
    [middleX, middleY],
    [maximumX + 1, middleY],
    [NaN, 0]
  ];
}

export function makePerformanceOptions(
  fixture: (typeof performanceFixtures)[number],
  rowCount: number,
  consumerCount: number
): ProjectionProgramBenchmarkOptions {
  const provider = new Proj4Projection({from: 'EPSG:4326', to: fixture.serialized});
  const bounds = fixture.bounds;
  return {
    coordinates: makePerformanceCoordinates(bounds, rowCount),
    consumerCount,
    oracle: position => {
      const valid =
        position.every(Number.isFinite) &&
        position[0] >= bounds[0] &&
        position[1] >= bounds[1] &&
        position[0] <= bounds[2] &&
        position[1] <= bounds[3];
      if (!valid) return {position: [0, 0], valid: false};
      const projected = provider.project([...position]);
      return {position: [projected[0], projected[1]], valid: true};
    },
    variants: ([2, 3] as const).map(degree => ({
      id: `adaptive-degree-${degree}`,
      maximumError: 0.001,
      createProgram: () => {
        const result = planCRSProjection({
          from: geographicCRS,
          to: fixture.definition,
          bounds,
          degree,
          tolerance: 0.0005,
          precision: 'double-single'
        });
        if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
        return result.program;
      }
    }))
  };
}
