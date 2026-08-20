// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  GraphBufferHandle,
  GraphDataView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from '@luma.gl/experimental';
import {
  GPURasterTileCache,
  GPURasterTileCoreExtract,
  GPURasterTileHaloAssembler,
  GPURasterTileHaloFill,
  GPURasterTileReader,
  type GPURasterBufferBand,
  type GPURasterDecodedTile,
  type GPURasterHaloStage,
  type GPURasterPixelBounds,
  type GPURasterScalarFormat,
  type GPURasterTileCacheBudgets,
  type GPURasterTileHaloFillProps,
  type GPURasterTileRequest,
  type GPURasterTileSource,
  type GPURasterTileSourceMetadata
} from '@luma.gl/experimental/gpu-raster';
import {describe, expect, test, vi} from 'vitest';

type GraphOwner = GraphBufferHandle['graph'];

type FakeBuffer = {
  byteLength: number;
  usage: number;
  destroyed: boolean;
  destroy: ReturnType<typeof vi.fn>;
};

type HaloFixture = {
  cache: GPURasterTileCache;
  assembler: GPURasterTileHaloAssembler;
  source: SyntheticHaloSource;
  buffers: FakeBuffer[];
};

type RecordingGraph = GPUCommandGraph & {passes: GPUCommandGraphComputeNode[]};

describe('GPURasterTileHaloAssembler cumulative planning', () => {
  test('includes every horizontal, vertical, diagonal, and ragged neighbor exactly once', () => {
    const {assembler, cache} = makeFixture();
    const plan = assembler.plan({
      level: 0,
      column: 1,
      row: 1,
      stages: [{requiredHalo: 2}, {requiredHalo: 1}]
    });

    expect(plan.corePixelBounds).toEqual([4, 3, 8, 6]);
    expect(plan.availablePixelBounds).toEqual([1, 0, 9, 7]);
    expect(plan).toMatchObject({
      level: 0,
      column: 1,
      row: 1,
      requiredHalo: 3,
      horizontalHalo: 3,
      verticalHalo: 3,
      levelZeroHalo: [3, 3],
      width: 8,
      height: 7,
      coreWidth: 4,
      coreHeight: 3
    });
    expect(plan.requests.map(request => [request.column, request.row])).toEqual([
      [1, 1],
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2]
    ]);
    expect(plan.requests[0].pixelBounds).toEqual([4, 3, 8, 6]);
    expect(plan.requests[8].pixelBounds).toEqual([8, 6, 9, 7]);
    expect(plan.requests.every(request => request.coordinateSpace === 'level')).toBe(true);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.requests)).toBe(true);
    expect(Object.isFrozen(plan.corePixelBounds)).toBe(true);
    expect(Object.isFrozen(plan.availablePixelBounds)).toBe(true);
    cache.destroy();
  });

  test('accumulates anisotropic stages and projects exact odd overview factors independently', () => {
    const {assembler, cache} = makeFixture();
    const plan = assembler.plan({
      level: 1,
      column: 1,
      row: 0,
      stages: [
        {requiredHalo: 2, horizontalRadius: 2, verticalRadius: 0},
        {requiredHalo: 1, horizontalRadius: 0, verticalRadius: 1}
      ]
    });

    expect(plan).toMatchObject({
      corePixelBounds: [2, 0, 4, 2],
      availablePixelBounds: [0, 0, 5, 3],
      horizontalHalo: 2,
      verticalHalo: 1,
      requiredHalo: 2,
      levelZeroHalo: [4, 3],
      width: 5,
      height: 3
    });
    expect(plan.requests).toHaveLength(6);
    expect(plan.requests[0].pixelBounds).toEqual([2, 0, 4, 2]);
    expect(plan.requests.at(-1)?.pixelBounds).toEqual([4, 2, 5, 3]);

    const fractional = assembler.plan({
      level: 2,
      column: 0,
      row: 0,
      stages: [{requiredHalo: 1}]
    });
    expect(fractional.levelZeroHalo).toEqual([3, 2]);
    cache.destroy();
  });

  test('uses complete composed-stage radii without substituting a primitive morphology radius', () => {
    const {assembler, cache} = makeFixture();
    const plan = assembler.plan({
      level: 0,
      column: 1,
      row: 1,
      stages: [{requiredHalo: 4}, {requiredHalo: 2}, {requiredHalo: 1}]
    });
    expect(plan.horizontalHalo).toBe(7);
    expect(plan.verticalHalo).toBe(7);
    expect(plan.availablePixelBounds).toEqual([0, 0, 9, 7]);
    cache.destroy();
  });

  test('retains a single full-level request rather than implicitly enumerating source tiles', () => {
    const {assembler, cache} = makeFixture();
    const fullLevel = assembler.plan({level: 0, stages: [{requiredHalo: 4}]});
    expect(fullLevel.corePixelBounds).toEqual([0, 0, 9, 7]);
    expect(fullLevel.availablePixelBounds).toEqual([0, 0, 9, 7]);
    expect(fullLevel.requests).toHaveLength(1);
    expect(fullLevel.requests[0].column).toBeUndefined();

    const window = assembler.plan({
      level: 0,
      pixelBounds: [3, 1, 6, 5],
      stages: [{requiredHalo: 2}]
    });
    expect(window.availablePixelBounds).toEqual([1, 0, 8, 7]);
    expect(window.requests).toHaveLength(1);
    expect(window.requests[0].pixelBounds).toEqual([1, 0, 8, 7]);
    cache.destroy();
  });

  test('normalizes overview-level-zero selections and preserves explicitly selected source bands', () => {
    const {assembler, cache} = makeFixture();
    const plan = assembler.plan({
      level: 1,
      column: 1,
      row: 0,
      pixelBounds: [4, 0, 7, 5],
      coordinateSpace: 'level-zero',
      bandIds: ['elevation'],
      stages: []
    });
    expect(plan.corePixelBounds).toEqual([2, 0, 4, 2]);
    expect(plan.availablePixelBounds).toEqual([2, 0, 4, 2]);
    expect(plan.requests).toHaveLength(1);
    expect(plan.requests[0]).toMatchObject({
      coordinateSpace: 'level',
      bandIds: ['elevation']
    });
    cache.destroy();
  });

  test('rejects missing, negative, fractional, excessive, and overflowing receptive fields', () => {
    const {assembler, cache} = makeFixture();
    expect(() => new GPURasterTileHaloAssembler({} as GPURasterTileCache)).toThrow(/cache/);
    expect(() => assembler.plan({level: 0} as never)).toThrow(/stage list/);
    const invalidStages: GPURasterHaloStage[][] = [
      [{requiredHalo: -1}],
      [{requiredHalo: 1.5}],
      [{requiredHalo: Number.NaN}],
      [{requiredHalo: 1, horizontalRadius: 2}],
      [{requiredHalo: 1, verticalRadius: -1}],
      [{requiredHalo: Number.MAX_SAFE_INTEGER}, {requiredHalo: 1}]
    ];
    for (const stages of invalidStages) {
      expect(() => assembler.plan({level: 0, stages})).toThrow(/halo|receptive|safe/i);
    }
    cache.destroy();
  });
});

describe('GPURasterTileHaloAssembler bounded ownership', () => {
  test('pins the canonical core and every diagonal source until the composite lease releases', async () => {
    const {assembler, source, cache} = makeFixture();
    const lease = await assembler.acquire({
      level: 0,
      column: 1,
      row: 1,
      stages: [{requiredHalo: 3}]
    });

    expect(lease.tiles).toHaveLength(9);
    expect(lease.core).toBe(lease.tiles[0]);
    expect(source.requests).toHaveLength(9);
    expect(cache.stats).toMatchObject({residentTiles: 9, pinnedTiles: 9, tileMisses: 9});
    expect(lease.tiles.at(-1)?.decoded.pixelBounds).toEqual([8, 6, 9, 7]);
    lease.release();
    lease.release();
    expect(cache.stats.pinnedTiles).toBe(0);
    cache.destroy();
  });

  test('reuses already resident canonical tiles instead of requesting narrow halo stripes', async () => {
    const {assembler, source, cache} = makeFixture();
    const original = await cache.acquire({level: 0, column: 0, row: 0});
    original.release();
    const assembled = await assembler.acquire({
      level: 0,
      column: 1,
      row: 0,
      stages: [{requiredHalo: 1}]
    });

    expect(assembled.tiles.some(tile => tile.tile === original.tile)).toBe(true);
    expect(cache.stats.tileHits).toBeGreaterThanOrEqual(1);
    expect(
      source.requests.filter(request => request.column === 0 && request.row === 0)
    ).toHaveLength(1);
    assembled.release();
    cache.destroy();
  });

  test('releases every partial source pin when a bounded cache rejects a later neighbor', async () => {
    const {assembler, cache} = makeFixture({maxTiles: 2});

    await expect(
      assembler.acquire({level: 0, column: 1, row: 1, stages: [{requiredHalo: 3}]})
    ).rejects.toThrow(/pinned|budget/);

    expect(cache.stats.pinnedTiles).toBe(0);
    cache.destroy();
    expect(cache.stats.residentTiles).toBe(0);
  });

  test('releases every prior source pin when a later decode fails or is canceled', async () => {
    const failure = makeFixture();
    failure.source.failOnRead = 3;
    await expect(
      failure.assembler.acquire({
        level: 0,
        column: 1,
        row: 1,
        stages: [{requiredHalo: 3}]
      })
    ).rejects.toThrow(/synthetic decode failure/);
    expect(failure.cache.stats.pinnedTiles).toBe(0);
    failure.cache.destroy();

    const cancellation = makeFixture();
    const controller = new AbortController();
    cancellation.source.abortOnRead = {count: 2, controller};
    await expect(
      cancellation.assembler.acquire(
        {level: 0, column: 1, row: 1, stages: [{requiredHalo: 3}]},
        controller.signal
      )
    ).rejects.toMatchObject({name: 'AbortError'});
    expect(cancellation.cache.stats.pinnedTiles).toBe(0);
    cancellation.cache.destroy();
  });

  test('keeps every imported tile alive through one shared post-submit fence', async () => {
    const {assembler, cache, buffers} = makeFixture();
    const lease = await assembler.acquire({
      level: 0,
      column: 1,
      row: 1,
      stages: [{requiredHalo: 1}]
    });
    const completion = makeDeferred<void>();
    const first = lease.releaseAfter({signaled: completion.promise});
    const second = lease.releaseAfter(completion.promise);

    expect(second).toBe(first);
    lease.release();
    cache.destroy();
    expect(buffers.every(buffer => !buffer.destroyed)).toBe(true);
    expect(cache.stats.pinnedTiles).toBe(lease.tiles.length);
    completion.resolve();
    await first;
    expect(buffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(cache.stats).toMatchObject({pinnedTiles: 0, residentTiles: 0, gpuBytes: 0});
  });
});

describe('GPURasterTileHaloFill and GPURasterTileCoreExtract graph contracts', () => {
  test.each([
    'float32',
    'uint32',
    'sint32'
  ] as const)('declares one native %s compute gather per disjoint source and one core-only extraction', format => {
    const graph = makeRecordingGraph(`halo-${format}`);
    const props = makeFillProps(graph, format);
    const fill = new GPURasterTileHaloFill(props);
    fill.addToGraph(graph);

    expect(fill.width).toBe(4);
    expect(fill.height).toBe(3);
    expect(graph.passes.map(pass => pass.id)).toEqual([
      'gather-0',
      'gather-1',
      'gather-2',
      'gather-3'
    ]);
    expect(graph.passes[0].resources?.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-write',
      'storage-read'
    ]);

    new GPURasterTileCoreExtract({
      id: 'publish',
      availablePixelBounds: [2, 3, 6, 6],
      corePixelBounds: [3, 4, 5, 6],
      input: {
        id: 'result',
        format,
        storage: {kind: 'buffer', values: props.output},
        validity: props.outputValidity
      } as GPURasterBufferBand<typeof format>,
      output: makeView(graph, 'core', format, 4),
      outputValidity: makeView(graph, 'core-validity', 'uint32', 4)
    }).addToGraph(graph);
    expect(graph.passes.at(-1)?.id).toBe('publish');
    expect(graph.passes.at(-1)?.resources).toHaveLength(4);
  });

  test('rejects gaps, overlap, foreign graphs, metadata mismatch, and aliased writable buffers', () => {
    const graph = makeRecordingGraph('halo-validation');
    const props = makeFillProps(graph, 'float32');
    expect(() => new GPURasterTileHaloFill({...props, sources: []})).toThrow(/source tile/);
    expect(() => new GPURasterTileHaloFill({...props, sources: props.sources.slice(0, 3)})).toThrow(
      /cover every/
    );
    expect(
      () => new GPURasterTileHaloFill({...props, sources: [...props.sources, props.sources[0]]})
    ).toThrow(/nonoverlapping/);
    expect(
      () =>
        new GPURasterTileHaloFill({
          ...props,
          sources: props.sources.map((source, index) =>
            index === 1 ? {...source, input: {...source.input, scale: 9}} : source
          )
        })
    ).toThrow(/calibration metadata/);
    const foreign = makeRecordingGraph('foreign-halo');
    expect(
      () =>
        new GPURasterTileHaloFill({...props, output: makeView(foreign, 'output', 'float32', 12)})
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterTileHaloFill({
          ...props,
          output: props.sources[0].input.storage.values as GraphDataView<'float32'>
        })
    ).toThrow(/one sample per pixel|separate/);
  });

  test('rejects uncovered cores, partial packed views, and insufficient storage-binding limits', () => {
    const graph = makeRecordingGraph('core-validation');
    const props = makeFillProps(graph, 'uint32');
    const input: GPURasterBufferBand<'uint32'> = {
      id: 'result',
      format: 'uint32',
      storage: {kind: 'buffer', values: props.output},
      validity: props.outputValidity
    };
    const extract = {
      availablePixelBounds: [2, 3, 6, 6] as const,
      corePixelBounds: [3, 4, 5, 6] as const,
      input,
      output: makeView(graph, 'core', 'uint32', 4),
      outputValidity: makeView(graph, 'mask', 'uint32', 4)
    };
    expect(() => new GPURasterTileCoreExtract({...extract, corePixelBounds: [1, 4, 5, 6]})).toThrow(
      /inside/
    );
    expect(
      () =>
        new GPURasterTileCoreExtract({...extract, output: makeView(graph, 'short', 'uint32', 3)})
    ).toThrow(/one sample per pixel/);
    expect(
      () => new GPURasterTileCoreExtract({...extract, output: extract.outputValidity})
    ).toThrow(/separate buffers/);
    const limited = makeRecordingGraph('limited-halo', {maxStorageBuffersPerShaderStage: 3});
    const limitedProps = makeFillProps(limited, 'float32');
    expect(() => new GPURasterTileHaloFill(limitedProps).addToGraph(limited)).toThrow(
      /binding count/
    );
  });
});

class SyntheticHaloSource implements GPURasterTileSource {
  readonly metadata: GPURasterTileSourceMetadata = {
    id: 'halo-source',
    width: 9,
    height: 7,
    affine: [2, 0, 10, 0, -3, 20],
    pixelInterpretation: 'area',
    levelZeroOrigin: [5, 8],
    bands: [{id: 'elevation', format: 'float32', noDataValue: -9999, scale: 0.5, offset: 4}],
    levels: [
      {level: 0, width: 9, height: 7, tileWidth: 4, tileHeight: 3, downsample: [1, 1]},
      {level: 1, width: 5, height: 3, tileWidth: 2, tileHeight: 2, downsample: [2, 3]},
      {level: 2, width: 4, height: 4, tileWidth: 2, tileHeight: 2, downsample: [2.5, 2]}
    ]
  };

  readonly requests: GPURasterTileRequest[] = [];
  failOnRead?: number;
  abortOnRead?: {count: number; controller: AbortController};

  async readTile(
    request: GPURasterTileRequest,
    signal: AbortSignal
  ): Promise<GPURasterDecodedTile> {
    this.requests.push(request);
    if (this.abortOnRead?.count === this.requests.length) this.abortOnRead.controller.abort();
    signal.throwIfAborted();
    if (this.failOnRead === this.requests.length) throw new Error('synthetic decode failure');
    const level = this.metadata.levels.find(candidate => candidate.level === request.level)!;
    const bounds = request.pixelBounds!;
    const width = bounds[2] - bounds[0];
    const height = bounds[3] - bounds[1];
    const values = Float32Array.from(
      Array.from(
        {length: width * height},
        (_, index) => (bounds[1] + Math.floor(index / width)) * 100 + bounds[0] + (index % width)
      )
    );
    const validity = Uint32Array.from(Array.from({length: values.length}, () => 1));
    const levelZeroColumn = bounds[0] * level.downsample[0];
    const levelZeroRow = bounds[1] * level.downsample[1];
    return {
      level: level.level,
      column: request.column ?? 0,
      row: request.row ?? 0,
      pixelBounds: bounds,
      levelZeroBounds: [
        Math.max(0, Math.floor(levelZeroColumn)),
        Math.max(0, Math.floor(levelZeroRow)),
        Math.min(this.metadata.width, Math.ceil(bounds[2] * level.downsample[0])),
        Math.min(this.metadata.height, Math.ceil(bounds[3] * level.downsample[1]))
      ],
      metadata: {
        width,
        height,
        affine: [
          2 * level.downsample[0],
          0,
          10 + 2 * levelZeroColumn,
          0,
          -3 * level.downsample[1],
          20 - 3 * levelZeroRow
        ],
        pixelInterpretation: 'area',
        level: level.level,
        levelZeroOrigin: [5 + levelZeroColumn, 8 + levelZeroRow]
      },
      bands: [
        {
          id: 'elevation',
          format: 'float32',
          noDataValue: -9999,
          scale: 0.5,
          offset: 4,
          values,
          validity
        }
      ]
    };
  }
}

function makeFixture(overrides: Partial<GPURasterTileCacheBudgets> = {}): HaloFixture {
  const buffers: FakeBuffer[] = [];
  const device = {
    createBuffer: vi.fn((props: {data: ArrayBufferView; usage: number}) => {
      const buffer: FakeBuffer = {
        byteLength: props.data.byteLength,
        usage: props.usage,
        destroyed: false,
        destroy: vi.fn(() => {
          buffer.destroyed = true;
        })
      };
      buffers.push(buffer);
      return buffer;
    })
  } as unknown as Device;
  const source = new SyntheticHaloSource();
  const cache = new GPURasterTileCache({
    reader: new GPURasterTileReader(source),
    device,
    maxTiles: 16,
    maxGraphs: 4,
    maxCpuBytes: 16_384,
    maxGpuBytes: 16_384,
    ...overrides
  });
  return {cache, assembler: new GPURasterTileHaloAssembler(cache), source, buffers};
}

function makeFillProps<Format extends GPURasterScalarFormat>(
  graph: RecordingGraph,
  format: Format
): GPURasterTileHaloFillProps<Format> {
  const bounds: GPURasterPixelBounds[] = [
    [2, 3, 4, 4],
    [4, 3, 6, 4],
    [2, 4, 4, 6],
    [4, 4, 6, 6]
  ];
  return {
    id: 'gather',
    pixelBounds: [2, 3, 6, 6],
    sources: bounds.map((pixelBounds, index) => {
      const length = (pixelBounds[2] - pixelBounds[0]) * (pixelBounds[3] - pixelBounds[1]);
      return {
        pixelBounds,
        input: {
          id: 'source',
          format,
          storage: {kind: 'buffer', values: makeView(graph, `source-${index}`, format, length)},
          validity: makeView(graph, `source-validity-${index}`, 'uint32', length)
        } as GPURasterBufferBand<Format>
      };
    }),
    output: makeView(graph, 'assembled', format, 12),
    outputValidity: makeView(graph, 'assembled-validity', 'uint32', 12)
  };
}

function makeRecordingGraph(
  id: string,
  limitOverrides: Partial<GPUCommandGraph['device']['limits']> = {}
): RecordingGraph {
  const passes: GPUCommandGraphComputeNode[] = [];
  return {
    id,
    device: {
      limits: {
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupsPerDimension: 65535,
        maxStorageBuffersPerShaderStage: 8,
        maxStorageBufferBindingSize: 134217728,
        ...limitOverrides
      }
    },
    passes,
    addComputePass(pass: GPUCommandGraphComputeNode): void {
      passes.push(pass);
    }
  } as unknown as RecordingGraph;
}

function makeView<Format extends GPURasterScalarFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const buffer = new GraphBufferHandle(
    owner,
    {id, byteLength: Math.max(length, 1) * 4, usage: 0},
    false
  );
  return new GraphDataView(buffer, {
    format,
    length,
    byteOffset: 0,
    byteStride: 4,
    rowByteLength: 4
  });
}

function makeDeferred<Value>(): {promise: Promise<Value>; resolve: (value: Value) => void} {
  let resolve = (_value: Value): void => {};
  const promise = new Promise<Value>(resolvePromise => {
    resolve = resolvePromise;
  });
  return {promise, resolve};
}
