// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GraphBufferHandle,
  GraphDataView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from '@luma.gl/experimental';
import {
  GPURasterGlobalHistogramMerge,
  GPURasterGlobalInitialize,
  GPURasterGlobalPercentile,
  GPURasterGlobalStatisticsMerge,
  type GPURasterBufferBand,
  type GPURasterGlobalAccumulator,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {describe, expect, test} from 'vitest';

type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientBuffers: GraphBufferHandle[];
};

describe('GPURasterGlobalInitialize persistent dataset contracts', () => {
  test('requires caller-owned exact scalar layouts and an explicit one-to-256-bin histogram', () => {
    const graph = makeRecordingGraph('global-accumulator-shape');
    const accumulator = makeAccumulator(graph, 8);
    const contributor = new GPURasterGlobalInitialize({id: 'reset-dataset', accumulator});
    expect(contributor.id).toBe('reset-dataset');
    expect(contributor.accumulator).toBe(accumulator);

    for (const length of [0, 257]) {
      expect(
        () =>
          new GPURasterGlobalInitialize({
            accumulator: {...accumulator, histogram: makeView(graph, 'bad-bins', 'uint32', length)}
          })
      ).toThrow(/one through 256 bins/);
    }
    expect(
      () =>
        new GPURasterGlobalInitialize({
          accumulator: {...accumulator, extent: makeView(graph, 'short-extent', 'float32', 1)}
        })
    ).toThrow(/exactly one sample per pixel/);
    expect(
      () =>
        new GPURasterGlobalInitialize({
          accumulator: {...accumulator, count: makeView(graph, 'long-count', 'uint32', 2)}
        })
    ).toThrow(/exactly one flag per pixel/);
    expect(
      () =>
        new GPURasterGlobalInitialize({
          accumulator: {...accumulator, sum: makeView(graph, 'integer-sum', 'uint32', 1) as never}
        })
    ).toThrow(/float32/);
    expect(
      () =>
        new GPURasterGlobalInitialize({
          accumulator: {
            ...accumulator,
            overflow: makeView(graph, 'floating-overflow', 'float32', 1) as never
          }
        })
    ).toThrow(/uint32/);
  });

  test('rejects foreign or aliased persistent buffers instead of inventing hidden ownership', () => {
    const graph = makeRecordingGraph('global-accumulator-ownership');
    const foreign = makeRecordingGraph('foreign-global-accumulator');
    const accumulator = makeAccumulator(graph, 4);
    expect(
      () =>
        new GPURasterGlobalInitialize({
          accumulator: {...accumulator, count: makeView(foreign, 'foreign-count', 'uint32', 1)}
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterGlobalInitialize({accumulator: {...accumulator, overflow: accumulator.count}})
    ).toThrow(/separate buffers/);
    expect(() => new GPURasterGlobalInitialize({accumulator: null as never})).toThrow(
      /persistent global accumulators/
    );
  });

  test('declares five independent graph writes only when explicit initialization is requested', () => {
    const graph = makeRecordingGraph('explicit-global-initialization');
    const accumulator = makeAccumulator(graph, 8, 4);
    new GPURasterGlobalInitialize({id: 'initialize-dataset', accumulator}).addToGraph(graph);
    expect(graph.passes).toHaveLength(1);
    expect(graph.passes[0]!.id).toBe('initialize-dataset');
    expect(graph.passes[0]!.resources?.map(resource => resource.usage)).toEqual([
      'storage-write',
      'storage-write',
      'storage-write',
      'storage-write',
      'storage-write'
    ]);
    expect(graph.passes[0]!.resources?.map(resource => resource.buffer)).toEqual([
      accumulator.extent,
      accumulator.count,
      accumulator.sum,
      accumulator.histogram,
      accumulator.overflow
    ]);
    expect(graph.transientBuffers).toHaveLength(0);
  });

  test('preflights portable bindings, aligned-prefix storage capacity, and target ownership', () => {
    const bindingLimited = makeRecordingGraph('global-binding-limit', {
      maxStorageBuffersPerShaderStage: 4
    });
    expect(() =>
      new GPURasterGlobalInitialize({accumulator: makeAccumulator(bindingLimited, 4)}).addToGraph(
        bindingLimited
      )
    ).toThrow(/binding count/);

    const storageLimited = makeRecordingGraph('global-storage-limit', {
      maxStorageBufferBindingSize: 12
    });
    expect(() =>
      new GPURasterGlobalInitialize({
        accumulator: makeAccumulator(storageLimited, 2, 8)
      }).addToGraph(storageLimited)
    ).toThrow(/storage binding limit/);

    const graph = makeRecordingGraph('global-owner');
    const foreign = makeRecordingGraph('global-target');
    expect(() =>
      new GPURasterGlobalInitialize({accumulator: makeAccumulator(graph, 4)}).addToGraph(foreign)
    ).toThrow(/target graph/);
  });
});

describe('GPURasterGlobalStatisticsMerge and GPURasterGlobalHistogramMerge tile contracts', () => {
  test.each([
    GPURasterGlobalStatisticsMerge,
    GPURasterGlobalHistogramMerge
  ])('%s preserves calibrated tile identity and rejects unsafe extents', Contributor => {
    const graph = makeRecordingGraph('global-tile-shape');
    const accumulator = makeAccumulator(graph, 8);
    const input = makeBand(graph, 'calibrated-tile', 6);
    const contributor = new Contributor({
      id: 'merge-calibrated-tile',
      width: 3,
      height: 2,
      input,
      accumulator
    });
    expect(contributor.id).toBe('merge-calibrated-tile');
    expect(contributor.width).toBe(3);
    expect(contributor.height).toBe(2);
    expect(contributor.input).toBe(input);
    expect(contributor.input.noDataValue).toBe(-999);
    expect(contributor.input.scale).toBe(0.5);
    expect(contributor.input.offset).toBe(2);
    expect(contributor.accumulator).toBe(accumulator);

    for (const [width, height] of [
      [0, 2],
      [-1, 2],
      [1.5, 2],
      [3, 0],
      [Number.NaN, 2]
    ]) {
      expect(() => new Contributor({width, height, input, accumulator})).toThrow(/dimensions/);
    }
    expect(() => new Contributor({width: 65536, height: 65536, input, accumulator})).toThrow(
      /fit in uint32/
    );
  });

  test.each([
    GPURasterGlobalStatisticsMerge,
    GPURasterGlobalHistogramMerge
  ])('%s rejects foreign, aliased, short, and non-finite-calibrated source bands', Contributor => {
    const graph = makeRecordingGraph('global-tile-input');
    const foreign = makeRecordingGraph('foreign-global-tile');
    const accumulator = makeAccumulator(graph, 4);
    const input = makeBand(graph, 'tile', 6);
    const props = {width: 3, height: 2, input, accumulator};

    expect(
      () =>
        new Contributor({
          ...props,
          input: {
            ...input,
            format: 'uint32',
            storage: {kind: 'buffer', values: accumulator.count}
          } as never
        })
    ).toThrow(/float32/);
    expect(() => new Contributor({...props, input: makeBand(graph, 'short-tile', 5)})).toThrow(
      /one sample per pixel/
    );
    expect(
      () =>
        new Contributor({
          ...props,
          input: {...input, validity: makeView(graph, 'short-mask', 'uint32', 5)}
        })
    ).toThrow(/one flag per pixel/);
    expect(() => new Contributor({...props, input: makeBand(foreign, 'foreign-tile', 6)})).toThrow(
      /same graph/
    );
    expect(
      () =>
        new Contributor({
          ...props,
          input: {
            ...input,
            validity: accumulator.histogram,
            storage: {kind: 'buffer', values: makeView(graph, 'aliased-values', 'float32', 4)}
          },
          width: 2,
          height: 2
        })
    ).toThrow(/separate buffers/);
    for (const scale of [Number.NaN, Number.POSITIVE_INFINITY, 1e39]) {
      expect(() => new Contributor({...props, input: {...input, scale}})).toThrow(/finite/);
    }
    for (const offset of [Number.NEGATIVE_INFINITY, -1e39]) {
      expect(() => new Contributor({...props, input: {...input, offset}})).toThrow(/finite/);
    }
  });

  test('declares reusable graph-owned partials and a bounded seven-binding persistent merge', () => {
    const graph = makeRecordingGraph('global-statistics-plan');
    const accumulator = makeAccumulator(graph, 8, 4);
    const input = makeBand(graph, 'tile', 6, 8);
    new GPURasterGlobalStatisticsMerge({
      id: 'tile-statistics',
      width: 3,
      height: 2,
      input,
      accumulator
    }).addToGraph(graph);

    expect(graph.transientBuffers.every(buffer => buffer.transient)).toBe(true);
    const merge = graph.passes.find(pass => pass.id === 'tile-statistics-merge');
    expect(merge?.resources).toHaveLength(7);
    expect(merge?.resources?.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-read',
      'storage-read',
      'storage-read-write',
      'storage-read-write',
      'storage-read-write',
      'storage-read-write'
    ]);
    expect(graph.passes.every(pass => (pass.resources?.length ?? 0) <= 8)).toBe(true);
    expect(graph.passes.some(pass => pass.id.includes('initialize'))).toBe(false);

    const limited = makeRecordingGraph('global-seven-binding-limit', {
      maxStorageBuffersPerShaderStage: 6
    });
    expect(() =>
      new GPURasterGlobalStatisticsMerge({
        width: 3,
        height: 2,
        input: makeBand(limited, 'limited-tile', 6),
        accumulator: makeAccumulator(limited, 8)
      }).addToGraph(limited)
    ).toThrow(/binding count/);
  });

  test('clears only graph-owned tile bins and imports the stable global GPU domain explicitly', () => {
    const graph = makeRecordingGraph('global-histogram-replay-plan');
    const accumulator = makeAccumulator(graph, 8);
    new GPURasterGlobalHistogramMerge({
      id: 'tile-replay',
      width: 3,
      height: 2,
      input: makeBand(graph, 'tile', 6),
      accumulator
    }).addToGraph(graph);

    expect(graph.passes.some(pass => pass.id.endsWith('-calibrate'))).toBe(true);
    const tileClear = graph.passes.find(pass => pass.id.endsWith('-clear'));
    expect(tileClear?.resources?.[0]?.buffer.buffer.transient).toBe(true);
    expect(tileClear?.resources?.[0]?.buffer.buffer).not.toBe(accumulator.histogram.buffer);
    const tileBinning = graph.passes.find(pass => pass.id.endsWith('-local'));
    expect(tileBinning?.resources?.some(resource => resource.buffer === accumulator.extent)).toBe(
      true
    );
    const merge = graph.passes.find(pass => pass.id === 'tile-replay-merge');
    expect(merge?.resources?.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-read-write',
      'storage-read-write'
    ]);
    expect(graph.passes.every(pass => (pass.resources?.length ?? 0) <= 8)).toBe(true);
  });
});

describe('GPURasterGlobalPercentile histogram estimate contracts', () => {
  test('accepts exact closed-interval endpoints and preserves optional validity identity', () => {
    for (const percentile of [0, 0.5, 1]) {
      const graph = makeRecordingGraph(`global-percentile-${percentile}`);
      const accumulator = makeAccumulator(graph, 8);
      const output = makeView(graph, 'estimated', 'float32', 1, 4);
      const outputValidity = makeView(graph, 'estimated-validity', 'uint32', 1, 8);
      const contributor = new GPURasterGlobalPercentile({
        id: 'dataset-percentile',
        accumulator,
        percentile,
        output,
        outputValidity
      });
      expect(contributor.percentile).toBe(percentile);
      expect(contributor.output).toBe(output);
      expect(contributor.outputValidity).toBe(outputValidity);
      contributor.addToGraph(graph);
      expect(graph.passes[0]?.resources?.map(resource => resource.usage)).toEqual([
        'storage-read',
        'storage-read',
        'storage-read',
        'storage-read',
        'storage-write',
        'storage-write'
      ]);
    }
  });

  test('rejects out-of-range percentiles, malformed outputs, ownership mismatches, and aliases', () => {
    const graph = makeRecordingGraph('global-percentile-layout');
    const foreign = makeRecordingGraph('foreign-global-percentile');
    const accumulator = makeAccumulator(graph, 4);
    const output = makeView(graph, 'result', 'float32', 1);
    const props = {accumulator, percentile: 0.5, output};
    for (const percentile of [-0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new GPURasterGlobalPercentile({...props, percentile})).toThrow(/unit interval/);
    }
    expect(
      () =>
        new GPURasterGlobalPercentile({
          ...props,
          output: makeView(graph, 'long-output', 'float32', 2)
        })
    ).toThrow(/one sample per pixel/);
    expect(() => new GPURasterGlobalPercentile({...props, output: accumulator.sum})).toThrow(
      /separate buffer/
    );
    expect(
      () =>
        new GPURasterGlobalPercentile({
          ...props,
          output: makeView(foreign, 'foreign-output', 'float32', 1)
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterGlobalPercentile({
          ...props,
          outputValidity: makeView(graph, 'short-validity', 'uint32', 2)
        })
    ).toThrow(/one flag per pixel/);
    expect(
      () => new GPURasterGlobalPercentile({...props, outputValidity: accumulator.overflow})
    ).toThrow(/separate buffer/);
  });

  test('adds five bindings without validity and preflights the optional sixth binding', () => {
    const graph = makeRecordingGraph('global-percentile-five-bindings', {
      maxStorageBuffersPerShaderStage: 5
    });
    const accumulator = makeAccumulator(graph, 4);
    new GPURasterGlobalPercentile({
      accumulator,
      percentile: 0.5,
      output: makeView(graph, 'estimated', 'float32', 1)
    }).addToGraph(graph);
    expect(graph.passes[0]?.resources).toHaveLength(5);

    expect(() =>
      new GPURasterGlobalPercentile({
        accumulator,
        percentile: 0.5,
        output: makeView(graph, 'second-estimated', 'float32', 1),
        outputValidity: makeView(graph, 'estimated-validity', 'uint32', 1)
      }).addToGraph(graph)
    ).toThrow(/binding count/);
  });
});

function makeRecordingGraph(
  id: string,
  limitOverrides: Partial<GPUCommandGraph['device']['limits']> = {}
): RecordingGraph {
  const passes: GPUCommandGraphComputeNode[] = [];
  const transientBuffers: GraphBufferHandle[] = [];
  const graph = {
    id,
    device: {
      type: 'webgpu',
      limits: {
        maxTextureDimension2D: 8192,
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupsPerDimension: 65535,
        maxStorageBuffersPerShaderStage: 8,
        maxStorageBufferBindingSize: 134217728,
        maxBufferSize: 134217728,
        minStorageBufferOffsetAlignment: 256,
        ...limitOverrides
      }
    },
    passes,
    transientBuffers,
    addComputePass(pass: GPUCommandGraphComputeNode): void {
      passes.push(pass);
    },
    createTransientBuffer(descriptor: {
      id: string;
      byteLength: number;
      usage: number;
    }): GraphBufferHandle {
      const buffer = new GraphBufferHandle(graph as never, descriptor, true);
      transientBuffers.push(buffer);
      return buffer;
    },
    createDataView<Format extends GPURasterScalarFormat>(
      buffer: GraphBufferHandle,
      props: {format: Format; length: number; byteOffset?: number}
    ): GraphDataView<Format> {
      return new GraphDataView(buffer, {
        format: props.format,
        length: props.length,
        byteOffset: props.byteOffset ?? 0,
        byteStride: 4,
        rowByteLength: 4
      });
    }
  };
  return graph as unknown as RecordingGraph;
}

function makeAccumulator(
  graph: RecordingGraph,
  histogramLength: number,
  byteOffset: number = 0
): GPURasterGlobalAccumulator {
  return {
    extent: makeView(graph, 'global-extent', 'float32', 2, byteOffset),
    count: makeView(graph, 'global-count', 'uint32', 1, byteOffset),
    sum: makeView(graph, 'global-sum', 'float32', 1, byteOffset),
    histogram: makeView(graph, 'global-histogram', 'uint32', histogramLength, byteOffset),
    overflow: makeView(graph, 'global-overflow', 'uint32', 1, byteOffset)
  };
}

function makeBand(
  graph: RecordingGraph,
  id: string,
  length: number,
  byteOffset: number = 0
): GPURasterBufferBand<'float32'> {
  return {
    id,
    format: 'float32',
    noDataValue: -999,
    scale: 0.5,
    offset: 2,
    storage: {
      kind: 'buffer',
      values: makeView(graph, `${id}-values`, 'float32', length, byteOffset)
    },
    validity: makeView(graph, `${id}-validity`, 'uint32', length, byteOffset)
  };
}

function makeView<Format extends GPURasterScalarFormat>(
  graph: RecordingGraph,
  id: string,
  format: Format,
  length: number,
  byteOffset: number = 0
): GraphDataView<Format> {
  const buffer = new GraphBufferHandle(
    graph,
    {id, byteLength: byteOffset + Math.max(length, 1) * 4, usage: 0},
    false
  );
  return new GraphDataView(buffer, {
    format,
    length,
    byteOffset,
    byteStride: 4,
    rowByteLength: 4
  });
}
