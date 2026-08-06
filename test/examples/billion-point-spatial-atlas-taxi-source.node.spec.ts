// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  PackedTaxiShardSource,
  type TaxiPointSource
} from '../../examples/showcase/billion-point-spatial-atlas/taxi-source';

const MANIFEST_URL = 'https://example.test/taxi/manifest.json';
const SOURCE_URL = 'https://example.test/original.arrow.gz';

describe('PackedTaxiShardSource', () => {
  test('caches versioned metadata and streams selected row groups with provenance', async () => {
    const manifest = makeManifest();
    const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
    const shardBytes = [
      makePackedPositions([
        [913_175.125, 120_121.875],
        [913_200.5, 120_180.25]
      ]),
      makePackedPositions([[1_067_382.5, 272_844.28125]])
    ];
    const requests: RecordedRequest[] = [];
    const fetchImplementation = makeFetch(
      new Map([
        [
          MANIFEST_URL,
          () =>
            makeResponse(manifestBytes, {
              etag: '"manifest-v2"',
              lastModified: 'Mon, 03 Aug 2026 12:00:00 GMT'
            })
        ],
        [
          'https://example.test/taxi/points-0000.f32',
          () => makeResponse(shardBytes[0], {etag: '"shard-0"'})
        ],
        [
          'https://example.test/taxi/points-0001.f32',
          () =>
            makeResponse(shardBytes[1], {
              lastModified: 'Mon, 03 Aug 2026 12:01:00 GMT'
            })
        ]
      ]),
      requests
    );
    const source: TaxiPointSource = new PackedTaxiShardSource(MANIFEST_URL, {
      fetch: fetchImplementation
    });

    const firstMetadata = await source.getMetadata();
    const secondMetadata = await source.getMetadata();
    expect(secondMetadata).toBe(firstMetadata);
    expect(firstMetadata).toEqual({
      manifestVersion: 2,
      rowCount: 3,
      rowGroups: [
        {
          index: 0,
          rowCount: 2,
          originalRowOffset: 0,
          byteLength: 16,
          url: 'https://example.test/taxi/points-0000.f32',
          bounds: [913_175.125, 120_121.875, 913_200.5, 120_180.25]
        },
        {
          index: 1,
          rowCount: 1,
          originalRowOffset: 2,
          byteLength: 8,
          url: 'https://example.test/taxi/points-0001.f32',
          bounds: [1_067_382.5, 272_844.28125, 1_067_382.5, 272_844.28125]
        }
      ],
      coordinateColumns: ['x', 'y'],
      coordinateSpace: {kind: 'source-xy', crs: null},
      bounds: [913_175.125, 120_121.875, 1_067_382.5, 272_844.28125],
      source: SOURCE_URL,
      objectVersion: {
        etag: '"manifest-v2"',
        lastModified: 'Mon, 03 Aug 2026 12:00:00 GMT'
      }
    });
    expect(Object.isFrozen(firstMetadata)).toBe(true);
    expect(Object.isFrozen(firstMetadata.rowGroups)).toBe(true);
    expect(Object.isFrozen(firstMetadata.coordinateSpace)).toBe(true);
    expect(requests.map(request => request.url)).toEqual([MANIFEST_URL]);

    const batches = [];
    for await (const batch of source.read({
      rowGroups: [1, 0],
      columns: ['y', 'x']
    })) {
      batches.push(batch);
    }
    expect(batches).toHaveLength(2);
    expect(batches[0]?.rowCount).toBe(1);
    expect(batches[0]?.provenance).toEqual({rowGroupIndex: 1, originalRowOffset: 2});
    expect(Array.from(batches[0]?.positions ?? [])).toEqual(
      Array.from(new Float32Array([1_067_382.5, 272_844.28125]))
    );
    expect(batches[1]?.rowCount).toBe(2);
    expect(batches[1]?.provenance).toEqual({rowGroupIndex: 0, originalRowOffset: 0});
    expect(Array.from(batches[1]?.positions ?? [])).toEqual(
      Array.from(new Float32Array([913_175.125, 120_121.875, 913_200.5, 120_180.25]))
    );

    const telemetry = source.getTelemetry();
    expect(telemetry.requestCount).toBe(3);
    expect(telemetry.downloadedByteCount).toBe(
      manifestBytes.byteLength + shardBytes[0].byteLength + shardBytes[1].byteLength
    );
    expect(telemetry.decodedRowCount).toBe(3);
    expect(telemetry.networkTimeMilliseconds).toBeGreaterThanOrEqual(0);
    expect(telemetry.decodeTimeMilliseconds).toBeGreaterThanOrEqual(0);
    telemetry.requestCount = -1;
    expect(source.getTelemetry().requestCount).toBe(3);

    await source.read({rowGroups: [0]}).next();
    expect(requests.at(-1)).toMatchObject({
      url: 'https://example.test/taxi/points-0000.f32',
      headers: {'if-match': '"shard-0"'}
    });
    await source.read({rowGroups: [1]}).next();
    expect(requests.at(-1)).toMatchObject({
      url: 'https://example.test/taxi/points-0001.f32',
      headers: {'if-unmodified-since': 'Mon, 03 Aug 2026 12:01:00 GMT'}
    });
    expect(source.getTelemetry()).toMatchObject({
      requestCount: 5,
      downloadedByteCount:
        manifestBytes.byteLength + shardBytes[0].byteLength * 2 + shardBytes[1].byteLength * 2,
      decodedRowCount: 6
    });
  });

  test('treats legacy version 1 coordinates as source XY with an unspecified CRS', async () => {
    const manifest = makeManifest({version: 1});
    delete manifest.coordinateSpace;
    const metadata = await makeSourceWithManifest(manifest).getMetadata();

    expect(metadata.manifestVersion).toBe(1);
    expect(metadata.coordinateSpace).toEqual({kind: 'source-xy', crs: null});
  });

  test('preserves an explicitly declared source coordinate reference system', async () => {
    const manifest = makeManifest({
      coordinateSpace: {kind: 'source-xy', crs: 'EPSG:2263'}
    });
    const metadata = await makeSourceWithManifest(manifest).getMetadata();

    expect(metadata.coordinateSpace).toEqual({kind: 'source-xy', crs: 'EPSG:2263'});
  });

  test('rejects malformed manifests', async () => {
    const unsupportedVersion = makeManifest({version: 3});
    await expect(makeSourceWithManifest(unsupportedVersion).getMetadata()).rejects.toThrow(
      'Taxi point manifest version must be 1 or 2'
    );

    const missingCoordinateSpace = makeManifest();
    delete missingCoordinateSpace.coordinateSpace;
    await expect(makeSourceWithManifest(missingCoordinateSpace).getMetadata()).rejects.toThrow(
      'Taxi point manifest coordinateSpace is required in version 2'
    );

    const invalidCoordinateReferenceSystem = makeManifest({
      coordinateSpace: {kind: 'source-xy', crs: ''}
    });
    await expect(
      makeSourceWithManifest(invalidCoordinateReferenceSystem).getMetadata()
    ).rejects.toThrow('Taxi point manifest coordinateSpace crs must be a non-empty string or null');

    const discontinuousManifest = makeManifest();
    discontinuousManifest.shards[1]!.firstRow = 3;
    await expect(makeSourceWithManifest(discontinuousManifest).getMetadata()).rejects.toThrow(
      'Taxi point manifest shard 1 starts at row 3; expected 2'
    );

    const duplicateCoordinateColumns = makeManifest({coordinateColumns: ['x', 'x']});
    await expect(makeSourceWithManifest(duplicateCoordinateColumns).getMetadata()).rejects.toThrow(
      'Taxi point manifest coordinate columns must be distinct'
    );

    const duplicateResolvedUrl = makeManifest();
    duplicateResolvedUrl.shards[1]!.file = './points-0000.f32#duplicate';
    await expect(makeSourceWithManifest(duplicateResolvedUrl).getMetadata()).rejects.toThrow(
      'Taxi point manifest shard 1 repeats resolved URL https://example.test/taxi/points-0000.f32'
    );

    const invertedBounds = makeManifest();
    invertedBounds.shards[0]!.bounds = [2, 0, 1, 3];
    await expect(makeSourceWithManifest(invertedBounds).getMetadata()).rejects.toThrow(
      'Taxi point manifest shard 0 bounds are inverted'
    );

    const incompleteRows = makeManifest({pointCount: 4});
    await expect(makeSourceWithManifest(incompleteRows).getMetadata()).rejects.toThrow(
      'Taxi point manifest row groups contain 3 rows; expected 4'
    );
  });

  test('validates selected columns and row groups before requesting shard data', async () => {
    const requests: RecordedRequest[] = [];
    const source = makeSourceWithManifest(makeManifest(), requests);
    await source.getMetadata();

    await expect(source.read({columns: ['fare_amount']}).next()).rejects.toThrow(
      'Taxi point source does not provide requested column fare_amount'
    );
    await expect(source.read({columns: []}).next()).rejects.toThrow(
      'Taxi point source read columns must not be empty'
    );
    await expect(source.read({columns: ['x', 'x']}).next()).rejects.toThrow(
      'Taxi point source read repeats column x'
    );
    await expect(source.read({rowGroups: [2]}).next()).rejects.toThrow(
      'Taxi point row group index 2 is out of range'
    );
    await expect(source.read({rowGroups: [0, 0]}).next()).rejects.toThrow(
      'Taxi point source read repeats row group 0'
    );

    const emptyRead = source.read({rowGroups: [], columns: ['x']});
    expect(await emptyRead.next()).toEqual({done: true, value: undefined});
    expect(requests.map(request => request.url)).toEqual([MANIFEST_URL]);
  });

  test('checks shard byte lengths without counting invalid rows as decoded', async () => {
    const manifest = makeManifest({
      pointCount: 1,
      shardPointCount: 1,
      shards: [
        {
          file: 'points-0000.f32',
          firstRow: 0,
          pointCount: 1,
          bounds: [913_175.125, 120_121.875, 913_175.125, 120_121.875]
        }
      ]
    });
    const manifestText = JSON.stringify(manifest);
    const shortSource = new PackedTaxiShardSource(MANIFEST_URL, {
      fetch: makeFetch(
        new Map([
          [MANIFEST_URL, () => makeResponse(manifestText)],
          ['https://example.test/taxi/points-0000.f32', () => makeResponse(new Uint8Array(4))]
        ])
      )
    });

    await expect(shortSource.read().next()).rejects.toThrow(
      'Taxi point row group 0 has 4 bytes; expected 8'
    );
    expect(shortSource.getTelemetry()).toMatchObject({
      requestCount: 2,
      downloadedByteCount: new TextEncoder().encode(manifestText).byteLength + 4,
      decodedRowCount: 0
    });
  });

  test('rejects changed object validators and uses Last-Modified for weak ETags', async () => {
    const manifest = makeManifest({
      pointCount: 1,
      shardPointCount: 1,
      shards: [
        {
          file: 'points-0000.f32',
          firstRow: 0,
          pointCount: 1,
          bounds: [913_175.125, 120_121.875, 913_175.125, 120_121.875]
        }
      ]
    });
    let shardVersion = '"shard-v1"';
    let shardLastModified = 'Mon, 03 Aug 2026 12:02:00 GMT';
    const requests: RecordedRequest[] = [];
    const versionedSource = new PackedTaxiShardSource(MANIFEST_URL, {
      fetch: makeFetch(
        new Map([
          [MANIFEST_URL, () => makeResponse(JSON.stringify(manifest))],
          [
            'https://example.test/taxi/points-0000.f32',
            () =>
              makeResponse(makePackedPositions([[913_175.125, 120_121.875]]), {
                etag: shardVersion,
                lastModified: shardLastModified
              })
          ]
        ]),
        requests
      )
    });
    await versionedSource.read().next();
    shardLastModified = 'Mon, 03 Aug 2026 12:03:00 GMT';
    await versionedSource.read().next();
    expect(requests.at(-1)?.headers).toEqual({'if-match': '"shard-v1"'});
    shardVersion = '"shard-v2"';
    await expect(versionedSource.read().next()).rejects.toThrow(
      'Taxi point source ETag changed while reading https://example.test/taxi/points-0000.f32'
    );
    expect(requests.at(-1)?.headers).toEqual({'if-match': '"shard-v1"'});

    const weakEtagRequests: RecordedRequest[] = [];
    let weakEtagLastModified = 'Mon, 03 Aug 2026 12:02:00 GMT';
    const weakEtagSource = new PackedTaxiShardSource(MANIFEST_URL, {
      fetch: makeFetch(
        new Map([
          [MANIFEST_URL, () => makeResponse(JSON.stringify(manifest))],
          [
            'https://example.test/taxi/points-0000.f32',
            () =>
              makeResponse(makePackedPositions([[913_175.125, 120_121.875]]), {
                etag: 'W/"weak-shard"',
                lastModified: weakEtagLastModified
              })
          ]
        ]),
        weakEtagRequests
      )
    });
    await weakEtagSource.read().next();
    await weakEtagSource.read().next();
    expect(weakEtagRequests.at(-1)?.headers).toEqual({
      'if-unmodified-since': 'Mon, 03 Aug 2026 12:02:00 GMT'
    });
    weakEtagLastModified = 'Mon, 03 Aug 2026 12:03:00 GMT';
    await expect(weakEtagSource.read().next()).rejects.toThrow(
      'Taxi point source Last-Modified changed while reading https://example.test/taxi/points-0000.f32'
    );
  });

  test('isolates cached metadata callers and closes idempotently', async () => {
    const firstResponse = makeDeferred<Response>();
    const firstRequestSignals: AbortSignal[] = [];
    const firstSource = new PackedTaxiShardSource(MANIFEST_URL, {
      fetch: async (_input, init) => {
        const signal = init?.signal;
        if (!signal) throw new Error('Expected source request signal');
        firstRequestSignals.push(signal);
        return await firstResponse.promise;
      }
    });
    const firstAbortController = new AbortController();
    const canceledFirstCaller = firstSource.getMetadata(firstAbortController.signal);
    const survivingSecondCaller = firstSource.getMetadata();
    firstAbortController.abort(new Error('first caller stopped'));
    await expect(canceledFirstCaller).rejects.toThrow('first caller stopped');
    expect(firstRequestSignals).toHaveLength(1);
    expect(firstRequestSignals[0]?.aborted).toBe(false);
    firstResponse.resolve(makeResponse(JSON.stringify(makeManifest())));
    const firstMetadata = await survivingSecondCaller;
    expect(await firstSource.getMetadata()).toBe(firstMetadata);

    const secondResponse = makeDeferred<Response>();
    const secondRequestSignals: AbortSignal[] = [];
    const secondSource = new PackedTaxiShardSource(MANIFEST_URL, {
      fetch: async (_input, init) => {
        const signal = init?.signal;
        if (!signal) throw new Error('Expected source request signal');
        secondRequestSignals.push(signal);
        return await secondResponse.promise;
      }
    });
    const survivingFirstCaller = secondSource.getMetadata();
    const secondAbortController = new AbortController();
    const canceledSecondCaller = secondSource.getMetadata(secondAbortController.signal);
    secondAbortController.abort(new Error('second caller stopped'));
    await expect(canceledSecondCaller).rejects.toThrow('second caller stopped');
    expect(secondRequestSignals).toHaveLength(1);
    expect(secondRequestSignals[0]?.aborted).toBe(false);
    secondResponse.resolve(makeResponse(JSON.stringify(makeManifest())));
    await expect(survivingFirstCaller).resolves.toMatchObject({rowCount: 3});

    const closedRequestSignals: AbortSignal[] = [];
    const closeAwareFetch: typeof fetch = async (_input, init) => {
      const signal = init?.signal;
      if (!signal) throw new Error('Expected source request signal');
      closedRequestSignals.push(signal);
      return await new Promise<Response>((_resolve, reject) => {
        if (signal.aborted) {
          reject(signal.reason);
        } else {
          signal.addEventListener('abort', () => reject(signal.reason), {once: true});
        }
      });
    };

    const closedSource = new PackedTaxiShardSource(MANIFEST_URL, {fetch: closeAwareFetch});
    const closedMetadata = closedSource.getMetadata();
    closedSource.close();
    closedSource.close();
    await expect(closedMetadata).rejects.toThrow('Packed taxi point source closed');
    expect(closedRequestSignals[0]?.aborted).toBe(true);
    await expect(closedSource.getMetadata()).rejects.toThrow('Packed taxi point source is closed');
  });
});

type TestManifest = {
  version: number;
  source: string;
  coordinateColumns: [string, string];
  coordinateSpace?: {kind: string; crs: string | null};
  format: string;
  pointCount: number;
  shardPointCount: number;
  shards: {
    file: string;
    firstRow: number;
    pointCount: number;
    bounds: [number, number, number, number] | null;
  }[];
};

type RecordedRequest = {
  url: string;
  headers: Record<string, string>;
  signal?: AbortSignal | null;
};

function makeManifest(overrides: Partial<TestManifest> = {}): TestManifest {
  return {
    version: 2,
    source: SOURCE_URL,
    coordinateColumns: ['x', 'y'],
    coordinateSpace: {kind: 'source-xy', crs: null},
    format: 'float32x2-little-endian',
    pointCount: 3,
    shardPointCount: 2,
    shards: [
      {
        file: 'points-0000.f32',
        firstRow: 0,
        pointCount: 2,
        bounds: [913_175.125, 120_121.875, 913_200.5, 120_180.25]
      },
      {
        file: 'points-0001.f32',
        firstRow: 2,
        pointCount: 1,
        bounds: [1_067_382.5, 272_844.28125, 1_067_382.5, 272_844.28125]
      }
    ],
    ...overrides
  };
}

function makeSourceWithManifest(
  manifest: TestManifest,
  requests: RecordedRequest[] = []
): PackedTaxiShardSource {
  return new PackedTaxiShardSource(MANIFEST_URL, {
    fetch: makeFetch(
      new Map([[MANIFEST_URL, () => makeResponse(JSON.stringify(manifest))]]),
      requests
    )
  });
}

function makePackedPositions(rows: readonly (readonly [number, number])[]): Uint8Array {
  const bytes = new Uint8Array(rows.length * 2 * Float32Array.BYTES_PER_ELEMENT);
  const dataView = new DataView(bytes.buffer);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]!;
    dataView.setFloat32(rowIndex * 8, row[0], true);
    dataView.setFloat32(rowIndex * 8 + 4, row[1], true);
  }
  return bytes;
}

function makeResponse(
  body: string | Uint8Array,
  version: {etag?: string; lastModified?: string} = {}
): Response {
  const headers = new Headers();
  if (version.etag) headers.set('etag', version.etag);
  if (version.lastModified) headers.set('last-modified', version.lastModified);
  return new Response(body, {status: 200, headers});
}

function makeFetch(
  responses: Map<string, () => Response>,
  requests: RecordedRequest[] = []
): typeof fetch {
  return async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const headers = Object.fromEntries(new Headers(init?.headers).entries());
    requests.push({url, headers, signal: init?.signal});
    const makeRequestedResponse = responses.get(url);
    if (!makeRequestedResponse) {
      return new Response('Not found', {status: 404});
    }
    return makeRequestedResponse();
  };
}

function makeDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, resolve, reject};
}
