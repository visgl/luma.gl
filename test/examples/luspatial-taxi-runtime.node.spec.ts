// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {describe, expect, test} from 'vitest';
import {
  LU_SPATIAL_TAXI_QUERY_COUNTER_IDS,
  LU_SPATIAL_TAXI_QUERY_DIAGNOSTIC_BYTE_OFFSETS,
  LuSpatialTaxiQueryEffect,
  decodeLuSpatialTaxiQueryCounters,
  makeLuSpatialTaxiQueryInspectorCounters
} from '../../examples/deck/luspatial-taxi/luspatial-query-effect';
import type {LuSpatialTaxiData} from '../../examples/deck/luspatial-taxi/taxi-data';

describe('luSpatial taxi query-effect resource safety', () => {
  test('releases every completed effect allocation after a mid-construction failure', () => {
    const destroyedResourceIds: string[] = [];
    let bufferCreateCount = 0;
    const device = {
      type: 'webgpu',
      createBuffer: ({id}: {id?: string}) => {
        bufferCreateCount++;
        if (bufferCreateCount === 3) throw new Error('injected buffer allocation failure');
        const resourceId = id ?? `buffer-${bufferCreateCount}`;
        return {
          destroy: () => destroyedResourceIds.push(resourceId)
        };
      }
    } as unknown as Device;
    const taxiData: LuSpatialTaxiData = {
      pointCount: 1,
      corpusPointCount: 1,
      longitudeLatitudes: new Float32Array([-73.99, 40.73]),
      sourceBounds: [-74, 40.72, -73.94, 40.78],
      projectedBounds: [-1, -1, 1, 1],
      sourceKind: 'synthetic',
      sourceLabel: 'test fixture'
    };

    expect(() => new LuSpatialTaxiQueryEffect(device, taxiData)).toThrow(
      'injected buffer allocation failure'
    );
    expect(destroyedResourceIds).toEqual([
      'luspatial-taxi-projected-positions',
      'luspatial-taxi-longitude-latitudes'
    ]);
  });
});

describe('luSpatial taxi query telemetry', () => {
  test('decodes aligned GPU diagnostics and publishes a complete inspector sample', () => {
    expect(Object.values(LU_SPATIAL_TAXI_QUERY_DIAGNOSTIC_BYTE_OFFSETS)).toEqual([
      0, 256, 512, 768
    ]);
    const drawCommandBytes = new Uint8Array(80).subarray(8, 72);
    const viewportInstanceCountByteOffset = 20;
    const selectionInstanceCountByteOffset = 52;
    const drawCommandView = new DataView(
      drawCommandBytes.buffer,
      drawCommandBytes.byteOffset,
      drawCommandBytes.byteLength
    );
    drawCommandView.setUint32(viewportInstanceCountByteOffset, 41, true);
    drawCommandView.setUint32(selectionInstanceCountByteOffset, 7, true);

    const queryDiagnosticByteLength =
      LU_SPATIAL_TAXI_QUERY_DIAGNOSTIC_BYTE_OFFSETS.selectionCandidateCount +
      Uint32Array.BYTES_PER_ELEMENT;
    const queryDiagnosticBytes = new Uint8Array(queryDiagnosticByteLength + 12).subarray(
      4,
      4 + queryDiagnosticByteLength
    );
    const queryDiagnosticView = new DataView(
      queryDiagnosticBytes.buffer,
      queryDiagnosticBytes.byteOffset,
      queryDiagnosticBytes.byteLength
    );
    queryDiagnosticView.setUint32(
      LU_SPATIAL_TAXI_QUERY_DIAGNOSTIC_BYTE_OFFSETS.viewportIntersectedCellCount,
      12,
      true
    );
    queryDiagnosticView.setUint32(
      LU_SPATIAL_TAXI_QUERY_DIAGNOSTIC_BYTE_OFFSETS.viewportCandidateCount,
      83,
      true
    );
    queryDiagnosticView.setUint32(
      LU_SPATIAL_TAXI_QUERY_DIAGNOSTIC_BYTE_OFFSETS.selectionIntersectedCellCount,
      3,
      true
    );
    queryDiagnosticView.setUint32(
      LU_SPATIAL_TAXI_QUERY_DIAGNOSTIC_BYTE_OFFSETS.selectionCandidateCount,
      19,
      true
    );

    const counters = decodeLuSpatialTaxiQueryCounters(drawCommandBytes, queryDiagnosticBytes, {
      viewportInstanceCountByteOffset,
      selectionInstanceCountByteOffset
    });
    expect(counters).toEqual({
      viewportIntersectedCellCount: 12,
      viewportCandidateCount: 83,
      visiblePointCount: 41,
      selectionIntersectedCellCount: 3,
      selectionCandidateCount: 19,
      selectedPointCount: 7
    });
    expect(makeLuSpatialTaxiQueryInspectorCounters(counters)).toEqual({
      [LU_SPATIAL_TAXI_QUERY_COUNTER_IDS.viewportIntersectedCells]: 12,
      [LU_SPATIAL_TAXI_QUERY_COUNTER_IDS.viewportCandidates]: 83,
      [LU_SPATIAL_TAXI_QUERY_COUNTER_IDS.viewportMatches]: 41,
      [LU_SPATIAL_TAXI_QUERY_COUNTER_IDS.selectionIntersectedCells]: 3,
      [LU_SPATIAL_TAXI_QUERY_COUNTER_IDS.selectionCandidates]: 19,
      [LU_SPATIAL_TAXI_QUERY_COUNTER_IDS.selectionMatches]: 7
    });
  });
});
