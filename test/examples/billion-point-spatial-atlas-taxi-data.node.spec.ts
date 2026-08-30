// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {makeSyntheticTaxiPositions} from '../../examples/showcase/billion-point-spatial-atlas/spatial-atlas-data';
import {
  getSpatialAtlasTaxiSourceRow,
  makeSpatialAtlasTaxiDataFromResidentWindow,
  makeSyntheticSpatialAtlasTaxiData
} from '../../examples/showcase/billion-point-spatial-atlas/taxi-atlas-data';
import {
  getTaxiLongitudeLatitude,
  TAXI_LOCAL_LATITUDE_SCALE,
  TAXI_LOCAL_LONGITUDE_SCALE,
  TAXI_PROJECTION_ORIGIN
} from '../../examples/showcase/billion-point-spatial-atlas/taxi-coordinate-space';
import type {TaxiPointResidentWindow} from '../../examples/showcase/billion-point-spatial-atlas/taxi-resident-window';
import type {
  TaxiPointSourceMetadata,
  TaxiPointSourceTelemetry
} from '../../examples/showcase/billion-point-spatial-atlas/taxi-source';

describe('Spatial Atlas taxi data', () => {
  test('converts packed geographic rows to local XYZ and preserves source provenance', () => {
    const longitudeLatitudes = new Float32Array([-73.99, 40.73, -73.96, 40.78]);
    const sourceRowIndices = new Float64Array([25_000_010, 25_000_011]);
    const telemetry = makeTelemetry(2);
    const residentWindow = makeResidentWindow({
      positions: longitudeLatitudes,
      sourceRowIndices,
      rowCount: 2,
      sourceRowCount: 168_898_952,
      telemetry
    });

    const data = makeSpatialAtlasTaxiDataFromResidentWindow(residentWindow);

    expect(data).toMatchObject({
      pointCount: 2,
      corpusPointCount: 168_898_952,
      sourceKind: 'packed',
      sourceLabel: 'Packed row-group source'
    });
    expect(data.sourceRowIndices).toBe(sourceRowIndices);
    expect(data.sourceTelemetry).toBe(telemetry);
    expect(data.positions).toEqual(
      new Float32Array([
        (longitudeLatitudes[0] - TAXI_PROJECTION_ORIGIN[0]) * TAXI_LOCAL_LONGITUDE_SCALE,
        (longitudeLatitudes[1] - TAXI_PROJECTION_ORIGIN[1]) * TAXI_LOCAL_LATITUDE_SCALE,
        0,
        (longitudeLatitudes[2] - TAXI_PROJECTION_ORIGIN[0]) * TAXI_LOCAL_LONGITUDE_SCALE,
        (longitudeLatitudes[3] - TAXI_PROJECTION_ORIGIN[1]) * TAXI_LOCAL_LATITUDE_SCALE,
        0
      ])
    );
    expect(getSpatialAtlasTaxiSourceRow(data, 0)).toBe(25_000_010);
    expect(getSpatialAtlasTaxiSourceRow(data, 1)).toBe(25_000_011);
    const restoredLongitudeLatitude = getTaxiLongitudeLatitude([
      data.positions[3],
      data.positions[4]
    ]);
    expect(restoredLongitudeLatitude[0]).toBeCloseTo(longitudeLatitudes[2], 5);
    expect(restoredLongitudeLatitude[1]).toBeCloseTo(longitudeLatitudes[3], 5);
  });

  test('keeps the deterministic generated fallback and resident-row provenance', () => {
    const data = makeSyntheticSpatialAtlasTaxiData(3);

    expect(data).toMatchObject({
      pointCount: 3,
      corpusPointCount: 168_898_952,
      sourceKind: 'synthetic',
      sourceLabel: 'Synthetic public-sample expansion'
    });
    expect(data.positions).toEqual(makeSyntheticTaxiPositions(3));
    expect(data.sourceRowIndices).toBeUndefined();
    expect(getSpatialAtlasTaxiSourceRow(data, 0)).toBe(0);
    expect(getSpatialAtlasTaxiSourceRow(data, 2)).toBe(2);
    expect(getSpatialAtlasTaxiSourceRow(data, 3)).toBeNull();
  });

  test('rejects missing and unknown packed coordinate reference systems', () => {
    for (const coordinateReferenceSystem of [null, '', 'EPSG:2263', 'unknown']) {
      expect(() =>
        makeSpatialAtlasTaxiDataFromResidentWindow(
          makeResidentWindow({metadata: makeMetadata(coordinateReferenceSystem)})
        )
      ).toThrow(
        'must explicitly declare OGC:CRS84 or WGS84/EPSG:4326 longitude/latitude coordinates'
      );
    }
  });
});

function makeResidentWindow(
  overrides: Partial<TaxiPointResidentWindow> = {}
): TaxiPointResidentWindow {
  const positions = overrides.positions ?? new Float32Array([-73.99, 40.73]);
  const rowCount = overrides.rowCount ?? positions.length / 2;
  return {
    positions,
    sourceRowIndices: overrides.sourceRowIndices ?? new Float64Array(rowCount),
    rowCount,
    sourceRowCount: overrides.sourceRowCount ?? rowCount,
    metadata: overrides.metadata ?? makeMetadata('OGC:CRS84', rowCount),
    telemetry: overrides.telemetry ?? makeTelemetry(rowCount)
  };
}

function makeMetadata(
  coordinateReferenceSystem: string | null,
  rowCount = 1
): TaxiPointSourceMetadata {
  return {
    manifestVersion: 2,
    rowCount,
    rowGroups: [],
    coordinateColumns: ['longitude', 'latitude'],
    coordinateSpace: {kind: 'source-xy', crs: coordinateReferenceSystem},
    bounds: [-74, 40.7, -73.9, 40.8],
    source: 'https://example.test/taxi.arrow',
    objectVersion: {etag: '"taxi-data-fixture"'}
  };
}

function makeTelemetry(decodedRowCount: number): TaxiPointSourceTelemetry {
  return {
    downloadedByteCount: decodedRowCount * 2 * Float32Array.BYTES_PER_ELEMENT,
    requestCount: decodedRowCount > 0 ? 1 : 0,
    networkTimeMilliseconds: 2,
    decodeTimeMilliseconds: 1,
    decodedRowCount
  };
}
