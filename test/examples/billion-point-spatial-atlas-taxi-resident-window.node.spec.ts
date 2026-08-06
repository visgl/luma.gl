// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  assertLongitudeLatitudeTaxiMetadata,
  getTaxiPoint,
  makeLuSpatialTaxiData,
  makeLuSpatialTaxiDataFromResidentWindow
} from '../../examples/deck/luspatial-taxi/taxi-data';
import {
  loadTaxiPointResidentWindow,
  type TaxiPointResidentWindow
} from '../../examples/showcase/billion-point-spatial-atlas/taxi-resident-window';
import type {
  TaxiPointBatch,
  TaxiPointSource,
  TaxiPointSourceMetadata,
  TaxiPointSourceReadOptions,
  TaxiPointSourceTelemetry
} from '../../examples/showcase/billion-point-spatial-atlas/taxi-source';

describe('loadTaxiPointResidentWindow', () => {
  test('retains a capacity-bounded prefix with original row provenance', async () => {
    const metadata = makeMetadata();
    const batches = new Map<number, TaxiPointBatch>([
      [
        0,
        {
          positions: new Float32Array([-73.99, 40.73, -73.98, 40.74]),
          rowCount: 2,
          provenance: {rowGroupIndex: 0, originalRowOffset: 0}
        }
      ],
      [
        1,
        {
          positions: new Float32Array([-73.97, 40.75, -73.96, 40.76, -73.95, 40.77]),
          rowCount: 3,
          provenance: {rowGroupIndex: 1, originalRowOffset: 2}
        }
      ]
    ]);
    const requestedRowGroups: number[][] = [];
    const progressRowCounts: number[] = [];
    const progressDecodedRowCounts: number[] = [];
    const source = makeSource(metadata, batches, requestedRowGroups);

    const residentWindow = await loadTaxiPointResidentWindow(source, {
      capacity: 3,
      onProgress: progress => {
        progressRowCounts.push(progress.residentRowCount);
        progressDecodedRowCounts.push(progress.telemetry.decodedRowCount);
      }
    });

    expect(requestedRowGroups).toEqual([[0, 1]]);
    expect(residentWindow.rowCount).toBe(3);
    expect(residentWindow.sourceRowCount).toBe(5);
    expect(Array.from(residentWindow.positions)).toEqual(
      Array.from(new Float32Array([-73.99, 40.73, -73.98, 40.74, -73.97, 40.75]))
    );
    expect(Array.from(residentWindow.sourceRowIndices)).toEqual([0, 1, 2]);
    expect(progressRowCounts).toEqual([2, 3]);
    expect(progressDecodedRowCounts).toEqual([2, 5]);
    expect(residentWindow.telemetry).toMatchObject({
      decodedRowCount: 5,
      downloadedByteCount: 40,
      requestCount: 2
    });
  });

  test('returns an empty window without reading row groups', async () => {
    const metadata = makeMetadata({rowCount: 0, rowGroups: []});
    const requestedRowGroups: number[][] = [];
    const residentWindow = await loadTaxiPointResidentWindow(
      makeSource(metadata, new Map(), requestedRowGroups),
      {capacity: 10}
    );

    expect(residentWindow.rowCount).toBe(0);
    expect(residentWindow.positions).toHaveLength(0);
    expect(residentWindow.sourceRowIndices).toHaveLength(0);
    expect(requestedRowGroups).toEqual([]);
  });

  test('rejects malformed, incomplete, and invalid-provenance batches', async () => {
    const metadata = makeMetadata({
      rowCount: 2,
      rowGroups: [makeRowGroup(0, 2, 0)]
    });
    const malformedBatch: TaxiPointBatch = {
      positions: new Float32Array([1, 2, 3]),
      rowCount: 2,
      provenance: {rowGroupIndex: 0, originalRowOffset: 0}
    };
    await expect(
      loadTaxiPointResidentWindow(makeSource(metadata, new Map([[0, malformedBatch]])), {
        capacity: 2
      })
    ).rejects.toThrow('contains 3 coordinate values for 2 rows');

    const incompleteBatch: TaxiPointBatch = {
      positions: new Float32Array([1, 2]),
      rowCount: 1,
      provenance: {rowGroupIndex: 0, originalRowOffset: 0}
    };
    await expect(
      loadTaxiPointResidentWindow(makeSource(metadata, new Map([[0, incompleteBatch]])), {
        capacity: 2
      })
    ).rejects.toThrow('yielded 1 resident rows; expected 2');

    const invalidProvenanceBatch: TaxiPointBatch = {
      positions: new Float32Array([1, 2, 3, 4]),
      rowCount: 2,
      provenance: {rowGroupIndex: 0, originalRowOffset: -1}
    };
    await expect(
      loadTaxiPointResidentWindow(makeSource(metadata, new Map([[0, invalidProvenanceBatch]])), {
        capacity: 2
      })
    ).rejects.toThrow('starts batch at source row -1; expected 0');
  });

  test('validates capacity and honors a pre-aborted signal before source access', async () => {
    const metadata = makeMetadata();
    const requestedRowGroups: number[][] = [];
    const source = makeSource(metadata, new Map(), requestedRowGroups);
    await expect(loadTaxiPointResidentWindow(source, {capacity: 0})).rejects.toThrow(
      'capacity must be a positive safe integer'
    );

    const controller = new AbortController();
    controller.abort(new Error('cancelled test source'));
    await expect(
      loadTaxiPointResidentWindow(source, {capacity: 1, signal: controller.signal})
    ).rejects.toThrow('cancelled test source');
    expect(requestedRowGroups).toEqual([]);
  });

  test('passes one cancellation signal through metadata and row-group reads', async () => {
    const metadata = makeMetadata({rowCount: 1, rowGroups: [makeRowGroup(0, 1, 0)]});
    const controller = new AbortController();
    let metadataSignal: AbortSignal | undefined;
    let readSignal: AbortSignal | undefined;
    const source: TaxiPointSource = {
      async getMetadata(signal): Promise<TaxiPointSourceMetadata> {
        metadataSignal = signal;
        return metadata;
      },
      async *read(options = {}): AsyncIterable<TaxiPointBatch> {
        readSignal = options.signal;
        yield {
          positions: new Float32Array([-73.99, 40.73]),
          rowCount: 1,
          provenance: {rowGroupIndex: 0, originalRowOffset: 0}
        };
      },
      getTelemetry: makeEmptyTelemetry,
      close(): void {}
    };

    await loadTaxiPointResidentWindow(source, {capacity: 1, signal: controller.signal});

    expect(metadataSignal).toBe(controller.signal);
    expect(readSignal).toBe(controller.signal);
  });
});

describe('luSpatial taxi resident-window adapter', () => {
  test('accepts explicitly declared longitude/latitude data and preserves source rows', () => {
    const residentWindow = makeResidentWindow({
      positions: new Float32Array([-73.99, 40.73, Number.NaN, Number.NaN]),
      sourceRowIndices: new Float64Array([18, 19]),
      rowCount: 2,
      sourceRowCount: 168_898_952
    });

    const taxiData = makeLuSpatialTaxiDataFromResidentWindow(residentWindow);

    expect(taxiData).toMatchObject({
      pointCount: 2,
      corpusPointCount: 168_898_952,
      sourceKind: 'packed',
      sourceLabel: 'Packed row-group source'
    });
    expect(taxiData.longitudeLatitudes).toBe(residentWindow.positions);
    expect(getTaxiPoint(taxiData, 0)).toEqual({
      longitude: Math.fround(-73.99),
      latitude: Math.fround(40.73),
      sourceRowIndex: 18,
      sourceKind: 'packed'
    });
    expect(getTaxiPoint(taxiData, 2)).toBeNull();
  });

  test('requires explicit supported CRS metadata before interpreting source XY as longitude/latitude', () => {
    for (const crs of ['OGC:CRS84', 'crs84', 'WGS84', 'epsg:4326']) {
      expect(() => assertLongitudeLatitudeTaxiMetadata(makeMetadata({crs}))).not.toThrow();
    }
    for (const crs of [null, 'EPSG:2263']) {
      expect(() => assertLongitudeLatitudeTaxiMetadata(makeMetadata({crs}))).toThrow(
        'must explicitly declare OGC:CRS84 or WGS84/EPSG:4326'
      );
    }
  });

  test('rejects impossible or entirely non-finite geographic windows', () => {
    expect(() =>
      makeLuSpatialTaxiDataFromResidentWindow(
        makeResidentWindow({positions: new Float32Array([181, 40])})
      )
    ).toThrow('outside longitude/latitude bounds');
    expect(() =>
      makeLuSpatialTaxiDataFromResidentWindow(
        makeResidentWindow({positions: new Float32Array([Number.NaN, Number.NaN])})
      )
    ).toThrow('does not contain a finite longitude/latitude row');
  });

  test('keeps the deterministic synthetic source as the default', () => {
    const taxiData = makeLuSpatialTaxiData(2);
    expect(taxiData).toMatchObject({
      pointCount: 2,
      corpusPointCount: 168_898_952,
      sourceKind: 'synthetic',
      sourceLabel: 'Synthetic public-sample expansion'
    });
    expect(taxiData.sourceRowIndices).toBeUndefined();
    expect(getTaxiPoint(taxiData, 1)).toMatchObject({
      sourceRowIndex: 1,
      sourceKind: 'synthetic'
    });
  });
});

function makeSource(
  metadata: TaxiPointSourceMetadata,
  batches: ReadonlyMap<number, TaxiPointBatch>,
  requestedRowGroups: number[][] = []
): TaxiPointSource {
  const telemetry: TaxiPointSourceTelemetry = {
    downloadedByteCount: 0,
    requestCount: 0,
    networkTimeMilliseconds: 0,
    decodeTimeMilliseconds: 0,
    decodedRowCount: 0
  };
  return {
    async getMetadata(): Promise<TaxiPointSourceMetadata> {
      return metadata;
    },
    async *read(options: TaxiPointSourceReadOptions = {}): AsyncIterable<TaxiPointBatch> {
      const rowGroups = [
        ...(options.rowGroups ?? metadata.rowGroups.map(rowGroup => rowGroup.index))
      ];
      requestedRowGroups.push(rowGroups);
      for (const rowGroupIndex of rowGroups) {
        options.signal?.throwIfAborted();
        const batch = batches.get(rowGroupIndex);
        if (!batch) continue;
        telemetry.requestCount++;
        telemetry.downloadedByteCount += batch.positions.byteLength;
        telemetry.decodedRowCount += batch.rowCount;
        yield batch;
      }
    },
    getTelemetry(): TaxiPointSourceTelemetry {
      return {...telemetry};
    },
    close(): void {}
  };
}

function makeEmptyTelemetry(): TaxiPointSourceTelemetry {
  return {
    downloadedByteCount: 0,
    requestCount: 0,
    networkTimeMilliseconds: 0,
    decodeTimeMilliseconds: 0,
    decodedRowCount: 0
  };
}

function makeMetadata(
  overrides: {
    rowCount?: number;
    rowGroups?: TaxiPointSourceMetadata['rowGroups'];
    crs?: string | null;
  } = {}
): TaxiPointSourceMetadata {
  const rowGroups = overrides.rowGroups ?? [makeRowGroup(0, 2, 0), makeRowGroup(1, 3, 2)];
  return {
    manifestVersion: 2,
    rowCount: overrides.rowCount ?? 5,
    rowGroups,
    coordinateColumns: ['longitude', 'latitude'],
    coordinateSpace: {
      kind: 'source-xy',
      crs: overrides.crs === undefined ? 'OGC:CRS84' : overrides.crs
    },
    bounds: [-74, 40.7, -73.9, 40.8],
    source: 'https://example.test/taxi.arrow',
    objectVersion: {etag: '"fixture"'}
  };
}

function makeRowGroup(
  index: number,
  rowCount: number,
  originalRowOffset: number
): TaxiPointSourceMetadata['rowGroups'][number] {
  return {
    index,
    rowCount,
    originalRowOffset,
    byteLength: rowCount * 2 * Float32Array.BYTES_PER_ELEMENT,
    url: `https://example.test/points-${index}.f32`,
    bounds: [-74, 40.7, -73.9, 40.8]
  };
}

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
    metadata: overrides.metadata ?? makeMetadata({rowCount}),
    telemetry: overrides.telemetry ?? {
      downloadedByteCount: positions.byteLength,
      requestCount: 1,
      networkTimeMilliseconds: 0,
      decodeTimeMilliseconds: 0,
      decodedRowCount: rowCount
    }
  };
}
