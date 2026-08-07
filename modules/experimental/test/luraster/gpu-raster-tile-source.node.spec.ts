// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {
  GPURasterTileReader,
  type GPURasterDecodedBand,
  type GPURasterDecodedTile,
  type GPURasterPixelBounds,
  type GPURasterTileBandMetadata,
  type GPURasterTileLevel,
  type GPURasterTileRequest,
  type GPURasterTileSource,
  type GPURasterTileSourceMetadata
} from '@luma.gl/experimental/luraster';

describe('GPURasterTileReader source metadata contracts', () => {
  test('rejects missing application-owned source contracts', () => {
    expect(() => new GPURasterTileReader(undefined as never)).toThrow(/readTile/);
    expect(() => new GPURasterTileReader({metadata: makeMetadata()} as never)).toThrow(/readTile/);
    expect(() => new GPURasterTileReader({readTile: async () => ({})} as never)).toThrow(
      /dataset metadata/
    );
  });

  test.each([
    ['zero dataset width', (metadata: GPURasterTileSourceMetadata) => ({...metadata, width: 0})],
    [
      'fractional dataset height',
      (metadata: GPURasterTileSourceMetadata) => ({...metadata, height: 2.5})
    ],
    [
      'malformed affine',
      (metadata: GPURasterTileSourceMetadata) => ({...metadata, affine: [1, 0, 0]})
    ],
    [
      'nonfinite affine',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        affine: [1, 0, Number.NaN, 0, 1, 0]
      })
    ],
    [
      'singular affine',
      (metadata: GPURasterTileSourceMetadata) => ({...metadata, affine: [1, 2, 0, 2, 4, 0]})
    ],
    [
      'unknown pixel interpretation',
      (metadata: GPURasterTileSourceMetadata) => ({...metadata, pixelInterpretation: 'center'})
    ],
    [
      'nonfinite level-zero origin',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        levelZeroOrigin: [1, Number.POSITIVE_INFINITY]
      })
    ],
    ['missing bands', (metadata: GPURasterTileSourceMetadata) => ({...metadata, bands: []})],
    [
      'duplicate band identifiers',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        bands: [metadata.bands[0], metadata.bands[0]]
      })
    ],
    [
      'empty band identifier',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        bands: [{...metadata.bands[0], id: ''}]
      })
    ],
    [
      'unsupported sample format',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        bands: [{...metadata.bands[0], format: 'float64'}]
      })
    ],
    [
      'negative unsigned nodata',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        bands: [{id: 'unsigned', format: 'uint32', noDataValue: -1}]
      })
    ],
    [
      'unsigned nodata overflow',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        bands: [{id: 'unsigned', format: 'uint32', noDataValue: 4294967296}]
      })
    ],
    [
      'signed nodata overflow',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        bands: [{id: 'signed', format: 'sint32', noDataValue: 2147483648}]
      })
    ],
    [
      'nonfinite floating nodata',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        bands: [{id: 'floating', format: 'float32', noDataValue: Number.POSITIVE_INFINITY}]
      })
    ],
    [
      'nonfinite calibration scale',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        bands: [{...metadata.bands[0], scale: Number.NaN}]
      })
    ],
    [
      'nonfinite calibration offset',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        bands: [{...metadata.bands[0], offset: Number.POSITIVE_INFINITY}]
      })
    ],
    ['missing levels', (metadata: GPURasterTileSourceMetadata) => ({...metadata, levels: []})],
    [
      'missing level zero',
      (metadata: GPURasterTileSourceMetadata) => ({...metadata, levels: [metadata.levels[1]]})
    ],
    [
      'duplicate overview identifier',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        levels: [metadata.levels[0], metadata.levels[0]]
      })
    ],
    [
      'negative overview identifier',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        levels: [{...metadata.levels[0], level: -1}]
      })
    ],
    [
      'zero tile extent',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        levels: [{...metadata.levels[0], tileWidth: 0}]
      })
    ],
    [
      'missing explicit downsample',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        levels: [{...metadata.levels[0], downsample: undefined}]
      })
    ],
    [
      'nonpositive explicit downsample',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        levels: [{...metadata.levels[0], downsample: [0, 1]}]
      })
    ],
    [
      'inconsistent ragged overview dimensions',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        levels: [metadata.levels[0], {...metadata.levels[1], width: 5}]
      })
    ],
    [
      'nonidentity level-zero downsample',
      (metadata: GPURasterTileSourceMetadata) => ({
        ...metadata,
        width: 1,
        height: 1,
        levels: [{...metadata.levels[0], width: 1, height: 1, downsample: [2, 2]}]
      })
    ]
  ])('rejects %s', (_description, mutateMetadata) => {
    const source = new SyntheticTileSource(mutateMetadata(makeMetadata()) as never);
    expect(() => new GPURasterTileReader(source)).toThrow();
  });

  test('accepts NaN float nodata and exact signed and unsigned sentinel limits', async () => {
    const metadata = makeMetadata({
      bands: [
        {id: 'floating', format: 'float32', noDataValue: Number.NaN},
        {id: 'unsigned', format: 'uint32', noDataValue: 4294967295},
        {id: 'signed', format: 'sint32', noDataValue: -2147483648}
      ]
    });
    const decoded = await new GPURasterTileReader(new SyntheticTileSource(metadata)).readTile({
      level: 0,
      column: 0,
      row: 0
    });

    expect(Number.isNaN(decoded.bands[0].noDataValue as number)).toBe(true);
    expect(decoded.bands[1].noDataValue).toBe(4294967295);
    expect(decoded.bands[2].noDataValue).toBe(-2147483648);
  });
});

describe('GPURasterTileReader selected bands, tiles, and spatial coordinates', () => {
  test('normalizes full-level requests while retaining exact dataset coordinates and CRS', async () => {
    const source = new SyntheticTileSource();
    const reader = new GPURasterTileReader(source);
    const controller = new AbortController();
    const decoded = await reader.readTile({level: 0}, controller.signal);

    expect(reader.source).toBe(source);
    expect(reader.metadata).toBe(source.metadata);
    expect(source.requests).toEqual([
      {
        level: 0,
        bandIds: ['red', 'near-infrared', 'labels'],
        pixelBounds: [0, 0, 11, 7],
        coordinateSpace: 'level'
      }
    ]);
    expect(source.signals).toEqual([controller.signal]);
    expect(Object.isFrozen(source.requests[0].bandIds)).toBe(true);
    expect(decoded.level).toBe(0);
    expect(decoded.column).toBe(0);
    expect(decoded.row).toBe(0);
    expect(decoded.pixelBounds).toEqual([0, 0, 11, 7]);
    expect(decoded.levelZeroBounds).toEqual([0, 0, 11, 7]);
    expect(decoded.metadata).toEqual({
      width: 11,
      height: 7,
      affine: source.metadata.affine,
      pixelInterpretation: 'area',
      coordinateReferenceSystem: source.metadata.coordinateReferenceSystem,
      level: 0,
      levelZeroOrigin: [101, 203]
    });
    expect(decoded.metadata.coordinateReferenceSystem).toBe(
      source.metadata.coordinateReferenceSystem
    );
    expect(decoded.bands.map(band => band.format)).toEqual(['float32', 'uint32', 'sint32']);
  });

  test('preserves selected native bands and their explicitly requested ordering', async () => {
    const source = new SyntheticTileSource();
    const decoded = await new GPURasterTileReader(source).readTile({
      level: 0,
      column: 1,
      row: 0,
      bandIds: ['labels', 'red']
    });

    expect(source.requests[0].bandIds).toEqual(['labels', 'red']);
    expect(decoded.bands.map(band => band.id)).toEqual(['labels', 'red']);
    expect(decoded.bands[0].values).toBeInstanceOf(Int32Array);
    expect(decoded.bands[1].values).toBeInstanceOf(Float32Array);
    expect(decoded.bands[1].noDataValue).toBe(-9999);
    expect(decoded.bands[1].scale).toBe(0.5);
    expect(decoded.bands[1].offset).toBe(2);
  });

  test('clips ragged tile edges and intersects an additional half-open pixel window', async () => {
    const source = new SyntheticTileSource();
    const reader = new GPURasterTileReader(source);
    const ragged = await reader.readTile({level: 0, column: 2, row: 2});
    const cropped = await reader.readTile({
      level: 0,
      column: 2,
      row: 2,
      pixelBounds: [9, 5, 20, 10]
    });

    expect(ragged.pixelBounds).toEqual([8, 6, 11, 7]);
    expect([ragged.metadata.width, ragged.metadata.height]).toEqual([3, 1]);
    expect(cropped.pixelBounds).toEqual([9, 6, 11, 7]);
    expect(cropped.levelZeroBounds).toEqual([9, 6, 11, 7]);
    expect(cropped.metadata.levelZeroOrigin).toEqual([110, 209]);
    expect(cropped.metadata.affine).toEqual([30, 2, 500282.25, -3, -40, 4099733.75]);
  });

  test('uses explicit twofold spacing instead of fractional odd-overview dimension ratios', async () => {
    const metadata = makeOddMetadata();
    const decoded = await new GPURasterTileReader(new SyntheticTileSource(metadata)).readTile({
      level: 1
    });

    expect([decoded.metadata.width, decoded.metadata.height]).toEqual([3, 4]);
    expect(decoded.levelZeroBounds).toEqual([0, 0, 5, 7]);
    expect(decoded.metadata.affine).toEqual([60, 4, 500000.25, -6, -80, 4100000.75]);
    expect(decoded.metadata.affine[0]).not.toBe(30 * (5 / 3));
  });

  test('converts level-zero windows conservatively using floor minima and ceil maxima', async () => {
    const source = new SyntheticTileSource(makeOddMetadata());
    const decoded = await new GPURasterTileReader(source).readTile({
      level: 1,
      pixelBounds: [1, 2, 5, 7],
      coordinateSpace: 'level-zero'
    });

    expect(source.requests[0].coordinateSpace).toBe('level');
    expect(source.requests[0].pixelBounds).toEqual([0, 1, 3, 4]);
    expect(decoded.pixelBounds).toEqual([0, 1, 3, 4]);
    expect(decoded.levelZeroBounds).toEqual([0, 2, 5, 7]);
    expect(decoded.metadata.levelZeroOrigin).toEqual([101, 205]);
    expect(decoded.metadata.affine).toEqual([60, 4, 500004.25, -6, -80, 4099920.75]);
  });

  test('preserves rotated/sheared anisotropic overview geometry and ragged edge coverage', async () => {
    const source = new SyntheticTileSource(makeOddMetadata());
    const decoded = await new GPURasterTileReader(source).readTile({
      level: 2,
      column: 1,
      row: 1
    });

    expect(decoded.pixelBounds).toEqual([2, 2, 3, 3]);
    expect(decoded.levelZeroBounds).toEqual([4, 6, 5, 7]);
    expect(decoded.metadata.levelZeroOrigin).toEqual([105, 209]);
    expect(decoded.metadata.affine).toEqual([60, 6, 500132.25, -6, -120, 4099748.75]);
    expect([decoded.metadata.width, decoded.metadata.height]).toEqual([1, 1]);
  });

  test('defaults unspecified dataset origins while retaining point-pixel interpretation', async () => {
    const metadata = makeMetadata({levelZeroOrigin: undefined, pixelInterpretation: 'point'});
    const decoded = await new GPURasterTileReader(new SyntheticTileSource(metadata)).readTile({
      level: 0,
      column: 1,
      row: 1
    });

    expect(decoded.metadata.levelZeroOrigin).toEqual([4, 3]);
    expect(decoded.metadata.pixelInterpretation).toBe('point');
  });

  test('keeps uint32 values above float32 precision and validity separate from zero samples', async () => {
    const source = new SyntheticTileSource();
    const decoded = await new GPURasterTileReader(source).readTile({
      level: 0,
      column: 0,
      row: 0,
      bandIds: ['near-infrared']
    });
    const band = decoded.bands[0];

    expect(band.values).toBeInstanceOf(Uint32Array);
    expect(band.values[0]).toBe(16777217);
    expect(band.values[1]).toBe(0);
    expect(band.values[2]).toBe(4294967295);
    expect(band.validity).toBeInstanceOf(Uint32Array);
    expect(band.validity?.[1]).toBe(1);
    expect(band.validity?.[2]).toBe(0);
    expect(band.noDataValue).toBe(4294967295);
    expect(band.scale).toBe(0.25);
    expect(band.offset).toBe(1);
  });

  test.each([
    ['missing request', undefined],
    ['unknown overview', {level: 99}],
    ['negative overview', {level: -1}],
    ['fractional overview', {level: 0.5}],
    ['column without row', {level: 0, column: 0}],
    ['row without column', {level: 0, row: 0}],
    ['negative column', {level: 0, column: -1, row: 0}],
    ['fractional row', {level: 0, column: 0, row: 1.5}],
    ['outside tile grid', {level: 0, column: 3, row: 0}],
    ['unsupported coordinate frame', {level: 0, coordinateSpace: 'world'}],
    ['empty bounds', {level: 0, pixelBounds: [1, 1, 1, 2]}],
    ['fractional bounds', {level: 0, pixelBounds: [0, 0, 2.5, 2]}],
    ['disjoint window', {level: 0, column: 0, row: 0, pixelBounds: [7, 0, 8, 1]}],
    ['empty selected bands', {level: 0, bandIds: []}],
    ['unknown selected band', {level: 0, bandIds: ['missing']}],
    ['duplicate selected bands', {level: 0, bandIds: ['red', 'red']}]
  ])('rejects %s before invoking the application-owned decoder', async (_description, request) => {
    const source = new SyntheticTileSource();
    await expect(new GPURasterTileReader(source).readTile(request as never)).rejects.toThrow();
    expect(source.requests).toHaveLength(0);
  });

  test('rejects unsafe whole-dataset pixel counts before decoding while allowing bounded tiles', async () => {
    const metadata = makeMetadata({
      width: 100_000_000,
      height: 100_000_000,
      levels: [
        {
          level: 0,
          width: 100_000_000,
          height: 100_000_000,
          tileWidth: 2,
          tileHeight: 2,
          downsample: [1, 1]
        }
      ]
    });
    const source = new SyntheticTileSource(metadata);
    const reader = new GPURasterTileReader(source);

    await expect(reader.readTile({level: 0})).rejects.toThrow(/pixel count.*safe integer/);
    expect(source.requests).toHaveLength(0);

    const bounded = await reader.readTile({level: 0, column: 0, row: 0});
    expect(bounded.pixelBounds).toEqual([0, 0, 2, 2]);
    expect(bounded.bands[0].values).toHaveLength(4);
  });
});

describe('GPURasterTileReader independent application-owned decoder adapters', () => {
  test('accepts a separately owned GeoTIFF-shaped adapter without coupling to its decoder', async () => {
    const metadata = makeMetadata();
    const decoder = new FakeExternalGeoTIFFDecoder(metadata);
    const adapter = new FakeGeoTIFFTileSource(metadata, decoder);
    const controller = new AbortController();
    const decoded = await new GPURasterTileReader(adapter).readTile(
      {level: 1, column: 1, row: 0, bandIds: ['near-infrared', 'red']},
      controller.signal
    );

    expect(decoder.calls).toEqual([
      {
        imageIndex: 1,
        window: [3, 0, 6, 2],
        samples: [1, 0],
        signal: controller.signal
      }
    ]);
    expect(decoded.pixelBounds).toEqual([3, 0, 6, 2]);
    expect(decoded.levelZeroBounds).toEqual([6, 0, 11, 4]);
    expect(decoded.bands.map(band => band.id)).toEqual(['near-infrared', 'red']);
    expect(decoded.bands[0].values).toBeInstanceOf(Uint32Array);
    expect(decoded.bands[1].values).toBeInstanceOf(Float32Array);
  });

  test('produces equivalent contracts from independent synthetic and GeoTIFF-shaped sources', async () => {
    const metadata = makeMetadata();
    const synthetic = new GPURasterTileReader(new SyntheticTileSource(metadata));
    const adapted = new GPURasterTileReader(
      new FakeGeoTIFFTileSource(metadata, new FakeExternalGeoTIFFDecoder(metadata))
    );
    const request: GPURasterTileRequest = {
      level: 2,
      column: 1,
      row: 0,
      bandIds: ['labels', 'near-infrared']
    };

    expect(await adapted.readTile(request)).toEqual(await synthetic.readTile(request));
  });
});

describe('GPURasterTileReader cancellation ownership', () => {
  test('rejects an already-aborted request without invoking the external source', async () => {
    const source = new SyntheticTileSource();
    const controller = new AbortController();
    const reason = new DOMException('Application cancelled the request', 'AbortError');
    controller.abort(reason);

    await expect(
      new GPURasterTileReader(source).readTile({level: 0}, controller.signal)
    ).rejects.toBe(reason);
    expect(source.requests).toHaveLength(0);
  });

  test('rejects promptly during decoding even when the app-owned decoder ignores cancellation', async () => {
    const metadata = makeMetadata();
    let resolveRead: ((decoded: GPURasterDecodedTile) => void) | undefined;
    let receivedRequest: GPURasterTileRequest | undefined;
    const source: GPURasterTileSource = {
      metadata,
      readTile: (request, _signal) => {
        receivedRequest = request;
        return new Promise(resolve => {
          resolveRead = resolve;
        });
      }
    };
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    const reason = new DOMException('Viewport moved', 'AbortError');
    const pending = new GPURasterTileReader(source).readTile({level: 0}, controller.signal);

    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    resolveRead?.(makeDecodedTile(metadata, receivedRequest as GPURasterTileRequest));
  });

  test('cleans abort listeners after successful and rejected adapter reads', async () => {
    const successfulController = new AbortController();
    const successfulRemoveListener = vi.spyOn(successfulController.signal, 'removeEventListener');
    await new GPURasterTileReader(new SyntheticTileSource()).readTile(
      {level: 0, column: 0, row: 0},
      successfulController.signal
    );
    expect(successfulRemoveListener).toHaveBeenCalledWith('abort', expect.any(Function));

    const adapterError = new Error('External decoder failed');
    const failedController = new AbortController();
    const failedRemoveListener = vi.spyOn(failedController.signal, 'removeEventListener');
    const failingSource: GPURasterTileSource = {
      metadata: makeMetadata(),
      readTile: async () => {
        throw adapterError;
      }
    };
    await expect(
      new GPURasterTileReader(failingSource).readTile({level: 0}, failedController.signal)
    ).rejects.toBe(adapterError);
    expect(failedRemoveListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  test('rejects when an application-owned adapter aborts while returning its decoded tile', async () => {
    const metadata = makeMetadata();
    const controller = new AbortController();
    const reason = new DOMException('Source completed after cancellation', 'AbortError');
    const source: GPURasterTileSource = {
      metadata,
      readTile: async request => {
        const decoded = makeDecodedTile(metadata, request);
        controller.abort(reason);
        return decoded;
      }
    };

    await expect(
      new GPURasterTileReader(source).readTile({level: 0}, controller.signal)
    ).rejects.toBe(reason);
  });
});

describe('GPURasterTileReader malformed external decoder responses', () => {
  test.each([
    ['missing decoded tile', () => undefined],
    ['wrong overview', (decoded: GPURasterDecodedTile) => ({...decoded, level: 1})],
    ['wrong tile column', (decoded: GPURasterDecodedTile) => ({...decoded, column: 1})],
    ['wrong tile row', (decoded: GPURasterDecodedTile) => ({...decoded, row: 1})],
    [
      'wrong overview bounds',
      (decoded: GPURasterDecodedTile) => ({...decoded, pixelBounds: [1, 0, 4, 3]})
    ],
    [
      'wrong level-zero bounds',
      (decoded: GPURasterDecodedTile) => ({...decoded, levelZeroBounds: [0, 0, 3, 3]})
    ],
    [
      'wrong decoded width',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        metadata: {...decoded.metadata, width: decoded.metadata.width + 1}
      })
    ],
    [
      'wrong decoded height',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        metadata: {...decoded.metadata, height: decoded.metadata.height + 1}
      })
    ],
    [
      'wrong decoded affine',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        metadata: {...decoded.metadata, affine: [1, 0, 0, 0, 1, 0]}
      })
    ],
    [
      'wrong decoded CRS',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        metadata: {...decoded.metadata, coordinateReferenceSystem: {authority: 'EPSG:4326'}}
      })
    ],
    [
      'wrong decoded pixel interpretation',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        metadata: {...decoded.metadata, pixelInterpretation: 'point'}
      })
    ],
    [
      'wrong decoded level-zero origin',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        metadata: {...decoded.metadata, levelZeroOrigin: [0, 0]}
      })
    ],
    ['missing requested bands', (decoded: GPURasterDecodedTile) => ({...decoded, bands: []})],
    [
      'wrong band identifier',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        bands: [{...decoded.bands[0], id: 'near-infrared'}]
      })
    ],
    [
      'wrong band sample format',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        bands: [{...decoded.bands[0], format: 'uint32'}]
      })
    ],
    [
      'wrong band typed array',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        bands: [{...decoded.bands[0], values: new Uint32Array(decoded.bands[0].values.length)}]
      })
    ],
    [
      'short decoded samples',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        bands: [{...decoded.bands[0], values: new Float32Array(1)}]
      })
    ],
    [
      'noncanonical validity type',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        bands: [{...decoded.bands[0], validity: new Int32Array(decoded.bands[0].values.length)}]
      })
    ],
    [
      'short validity mask',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        bands: [{...decoded.bands[0], validity: new Uint32Array(1)}]
      })
    ],
    [
      'changed raw nodata sentinel',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        bands: [{...decoded.bands[0], noDataValue: -1}]
      })
    ],
    [
      'changed source calibration scale',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        bands: [{...decoded.bands[0], scale: 1}]
      })
    ],
    [
      'changed source calibration offset',
      (decoded: GPURasterDecodedTile) => ({
        ...decoded,
        bands: [{...decoded.bands[0], offset: 0}]
      })
    ]
  ])('rejects %s', async (_description, mutateDecodedTile) => {
    const metadata = makeMetadata();
    const source: GPURasterTileSource = {
      metadata,
      readTile: async request =>
        mutateDecodedTile(makeDecodedTile(metadata, request)) as GPURasterDecodedTile
    };

    await expect(
      new GPURasterTileReader(source).readTile({
        level: 0,
        column: 0,
        row: 0,
        bandIds: ['red']
      })
    ).rejects.toThrow();
  });
});

class SyntheticTileSource implements GPURasterTileSource {
  readonly metadata: GPURasterTileSourceMetadata;
  readonly requests: GPURasterTileRequest[] = [];
  readonly signals: AbortSignal[] = [];

  constructor(metadata: GPURasterTileSourceMetadata = makeMetadata()) {
    this.metadata = metadata;
  }

  async readTile(
    request: GPURasterTileRequest,
    signal: AbortSignal
  ): Promise<GPURasterDecodedTile> {
    this.requests.push(request);
    this.signals.push(signal);
    return makeDecodedTile(this.metadata, request);
  }
}

type FakeGeoTIFFReadOptions = {
  imageIndex: number;
  window: GPURasterPixelBounds;
  samples: readonly number[];
  signal: AbortSignal;
};

class FakeExternalGeoTIFFDecoder {
  readonly calls: FakeGeoTIFFReadOptions[] = [];
  private readonly metadata: GPURasterTileSourceMetadata;

  constructor(metadata: GPURasterTileSourceMetadata) {
    this.metadata = metadata;
  }

  async readRasters(options: FakeGeoTIFFReadOptions): Promise<{
    values: GPURasterDecodedBand['values'][];
    validity: Uint32Array[];
  }> {
    this.calls.push(options);
    const decoded = makeDecodedTile(this.metadata, {
      level: options.imageIndex,
      bandIds: options.samples.map(index => this.metadata.bands[index].id),
      pixelBounds: options.window
    });
    return {
      values: decoded.bands.map(band => band.values),
      validity: decoded.bands.map(band => band.validity as Uint32Array)
    };
  }
}

class FakeGeoTIFFTileSource implements GPURasterTileSource {
  readonly metadata: GPURasterTileSourceMetadata;
  private readonly decoder: FakeExternalGeoTIFFDecoder;

  constructor(metadata: GPURasterTileSourceMetadata, decoder: FakeExternalGeoTIFFDecoder) {
    this.metadata = metadata;
    this.decoder = decoder;
  }

  async readTile(
    request: GPURasterTileRequest,
    signal: AbortSignal
  ): Promise<GPURasterDecodedTile> {
    const rasterSamples = await this.decoder.readRasters({
      imageIndex: request.level,
      window: request.pixelBounds as GPURasterPixelBounds,
      samples: (request.bandIds as readonly string[]).map(identifier =>
        this.metadata.bands.findIndex(band => band.id === identifier)
      ),
      signal
    });
    const decoded = makeDecodedTile(this.metadata, request);
    return {
      ...decoded,
      bands: decoded.bands.map((band, index) => ({
        ...band,
        values: rasterSamples.values[index],
        validity: rasterSamples.validity[index]
      })) as GPURasterDecodedBand[]
    };
  }
}

function makeMetadata(
  overrides: Partial<GPURasterTileSourceMetadata> = {}
): GPURasterTileSourceMetadata {
  return {
    id: 'synthetic-raster-tile-source',
    width: 11,
    height: 7,
    affine: [30, 2, 500000.25, -3, -40, 4100000.75],
    pixelInterpretation: 'area',
    coordinateReferenceSystem: {
      authority: 'EPSG:32610',
      wellKnownText: 'LOCAL-WKT',
      projectionJson: {type: 'ProjectedCRS', name: 'Synthetic test projection'}
    },
    levelZeroOrigin: [101, 203],
    bands: [
      {id: 'red', format: 'float32', noDataValue: -9999, scale: 0.5, offset: 2},
      {id: 'near-infrared', format: 'uint32', noDataValue: 4294967295, scale: 0.25, offset: 1},
      {id: 'labels', format: 'sint32', noDataValue: -2147483648}
    ],
    levels: [
      {level: 0, width: 11, height: 7, tileWidth: 4, tileHeight: 3, downsample: [1, 1]},
      {level: 1, width: 6, height: 4, tileWidth: 3, tileHeight: 2, downsample: [2, 2]},
      {level: 2, width: 6, height: 3, tileWidth: 4, tileHeight: 2, downsample: [2, 3]}
    ],
    ...overrides
  };
}

function makeOddMetadata(): GPURasterTileSourceMetadata {
  return makeMetadata({
    width: 5,
    height: 7,
    levels: [
      {level: 0, width: 5, height: 7, tileWidth: 4, tileHeight: 3, downsample: [1, 1]},
      {level: 1, width: 3, height: 4, tileWidth: 2, tileHeight: 2, downsample: [2, 2]},
      {level: 2, width: 3, height: 3, tileWidth: 2, tileHeight: 2, downsample: [2, 3]}
    ]
  });
}

function makeDecodedTile(
  metadata: GPURasterTileSourceMetadata,
  request: GPURasterTileRequest
): GPURasterDecodedTile {
  const level = metadata.levels.find(
    candidate => candidate.level === request.level
  ) as GPURasterTileLevel;
  const bounds = request.pixelBounds as GPURasterPixelBounds;
  const width = bounds[2] - bounds[0];
  const height = bounds[3] - bounds[1];
  const pixelCount = width * height;
  const levelZeroX = bounds[0] * level.downsample[0];
  const levelZeroY = bounds[1] * level.downsample[1];
  const [
    horizontalScale,
    horizontalShear,
    horizontalOrigin,
    verticalShear,
    verticalScale,
    verticalOrigin
  ] = metadata.affine;
  const origin = metadata.levelZeroOrigin ?? [0, 0];
  return {
    level: level.level,
    column: request.column ?? 0,
    row: request.row ?? 0,
    pixelBounds: bounds,
    levelZeroBounds: [
      Math.floor(levelZeroX),
      Math.floor(levelZeroY),
      Math.min(metadata.width, Math.ceil(bounds[2] * level.downsample[0])),
      Math.min(metadata.height, Math.ceil(bounds[3] * level.downsample[1]))
    ],
    metadata: {
      width,
      height,
      affine: [
        horizontalScale * level.downsample[0],
        horizontalShear * level.downsample[1],
        horizontalOrigin + horizontalScale * levelZeroX + horizontalShear * levelZeroY,
        verticalShear * level.downsample[0],
        verticalScale * level.downsample[1],
        verticalOrigin + verticalShear * levelZeroX + verticalScale * levelZeroY
      ],
      pixelInterpretation: metadata.pixelInterpretation,
      ...(metadata.coordinateReferenceSystem
        ? {coordinateReferenceSystem: metadata.coordinateReferenceSystem}
        : {}),
      level: level.level,
      levelZeroOrigin: [origin[0] + levelZeroX, origin[1] + levelZeroY]
    },
    bands: (request.bandIds as readonly string[]).map(identifier =>
      makeDecodedBand(
        metadata.bands.find(candidate => candidate.id === identifier) as GPURasterTileBandMetadata,
        pixelCount
      )
    )
  };
}

function makeDecodedBand(
  metadata: GPURasterTileBandMetadata,
  pixelCount: number
): GPURasterDecodedBand {
  const validity = Uint32Array.from({length: pixelCount}, (_unused, index) =>
    index === 2 ? 0 : 1
  );
  switch (metadata.format) {
    case 'float32':
      return {
        ...metadata,
        values: Float32Array.from({length: pixelCount}, (_unused, index) => index + 0.125),
        validity
      };
    case 'uint32':
      return {
        ...metadata,
        values: Uint32Array.from({length: pixelCount}, (_unused, index) =>
          index === 1 ? 0 : index === 2 ? 4294967295 : 16777217 + index
        ),
        validity
      };
    case 'sint32':
      return {
        ...metadata,
        values: Int32Array.from({length: pixelCount}, (_unused, index) => -index),
        validity
      };
  }
}
