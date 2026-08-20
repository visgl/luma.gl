// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  GraphBufferHandle,
  GraphDataView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterOtsuThreshold,
  GPURasterThreshold,
  type GPURasterBufferBand,
  type GPURasterScalarFormat,
  type GPURasterThresholdOperation,
  type GPURasterThresholdProps
} from '@luma.gl/experimental/gpu-raster';

type GraphOwner = GraphBufferHandle['graph'];
type RecordingGraph = GPUCommandGraph & {passes: GPUCommandGraphComputeNode[]};

describe('GPURasterThreshold graph contributor contracts', () => {
  test('defaults to inclusive calibrated above-threshold selection', () => {
    const owner = {id: 'threshold-defaults'} as GraphOwner;
    const props = makeThresholdProps(owner);
    const contributor = new GPURasterThreshold({
      ...props,
      input: {...props.input, scale: 0.25, offset: 2, noDataValue: -999}
    });

    expect(contributor.id).toBe('gpu-raster-threshold');
    expect(contributor.operation).toBe('above');
    expect(contributor.inclusive).toBe(true);
    expect(contributor.threshold).toBe(0.5);
    expect(contributor.input.scale).toBe(0.25);
    expect(contributor.input.noDataValue).toBe(-999);
  });

  test('accepts strict below, literal ranges, and caller-owned GPU scalar ranges', () => {
    const owner = {id: 'threshold-operations'} as GraphOwner;
    const props = makeThresholdProps(owner);
    const below = new GPURasterThreshold({...props, operation: 'below', inclusive: false});
    const literalRange = new GPURasterThreshold({
      ...props,
      operation: 'range',
      threshold: [-0.5, 0.75]
    });
    const gpuThreshold = makeView(owner, 'gpu-threshold', 'float32', 1);
    const gpuRange = makeView(owner, 'gpu-range', 'float32', 2);

    expect(below.inclusive).toBe(false);
    expect(literalRange.threshold).toEqual([-0.5, 0.75]);
    expect(new GPURasterThreshold({...props, threshold: gpuThreshold}).threshold).toBe(
      gpuThreshold
    );
    expect(
      new GPURasterThreshold({...props, threshold: gpuRange, operation: 'range'}).threshold
    ).toBe(gpuRange);
  });

  test('rejects malformed dimensions, modes, thresholds, and calibration', () => {
    const owner = {id: 'threshold-validation'} as GraphOwner;
    const props = makeThresholdProps(owner);

    for (const dimensions of [
      {width: 0, height: 2},
      {width: 1.5, height: 2},
      {width: 2, height: -1}
    ]) {
      expect(() => new GPURasterThreshold({...props, ...dimensions})).toThrow(/positive integers/);
    }
    expect(() => new GPURasterThreshold({...props, width: 65536, height: 65536})).toThrow(
      /fit in uint32/
    );
    expect(
      () => new GPURasterThreshold({...props, operation: 'equals' as GPURasterThresholdOperation})
    ).toThrow(/above, below, or range/);
    expect(() => new GPURasterThreshold({...props, threshold: Number.NaN})).toThrow(/finite/);
    expect(() => new GPURasterThreshold({...props, threshold: Number.POSITIVE_INFINITY})).toThrow(
      /finite/
    );
    expect(() => new GPURasterThreshold({...props, operation: 'range'})).toThrow(
      /scalar threshold/
    );
    expect(() => new GPURasterThreshold({...props, threshold: [0, 1]})).toThrow(/range threshold/);
    expect(
      () => new GPURasterThreshold({...props, threshold: [1, -1], operation: 'range'})
    ).toThrow(/ordered finite/);
    expect(
      () => new GPURasterThreshold({...props, threshold: [0, Number.NaN], operation: 'range'})
    ).toThrow(/ordered finite/);
    expect(
      () =>
        new GPURasterThreshold({
          ...props,
          input: {...props.input, scale: Number.MAX_VALUE}
        })
    ).toThrow(/finite float32/);
  });

  test('preserves exact native integer nodata and rejects aliases and foreign ownership', () => {
    const owner = {id: 'threshold-aliases'} as GraphOwner;
    const foreignOwner = {id: 'threshold-foreign'} as GraphOwner;
    const props = makeThresholdProps(owner);
    const signed = makeBand(owner, 'signed', 'sint32', 6);
    const unsigned = makeBand(owner, 'unsigned', 'uint32', 6);

    expect(
      new GPURasterThreshold({
        ...props,
        input: {...signed, noDataValue: -2147483648}
      }).input.noDataValue
    ).toBe(-2147483648);
    expect(
      new GPURasterThreshold({
        ...props,
        input: {...unsigned, noDataValue: 4294967295}
      }).input.noDataValue
    ).toBe(4294967295);
    expect(
      () =>
        new GPURasterThreshold({
          ...props,
          output: makeView(foreignOwner, 'foreign-output', 'uint32', 6)
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterThreshold({
          ...props,
          threshold: makeView(foreignOwner, 'foreign-threshold', 'float32', 1)
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterThreshold({
          ...props,
          threshold: makeView(owner, 'wrong-threshold', 'float32', 2)
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () => new GPURasterThreshold({...props, input: {...props.input, validity: props.output}})
    ).toThrow(/separate buffers/);
  });

  test('declares source, output, mask, and GPU threshold hazards without submitting', () => {
    const graph = makeRecordingGraph('threshold-graph');
    const props = makeThresholdProps(graph);
    const threshold = makeView(graph, 'gpu-threshold', 'float32', 1);
    const input = {...props.input, validity: makeView(graph, 'source-validity', 'uint32', 6)};

    new GPURasterThreshold({...props, input, threshold}).addToGraph(graph);

    expect(graph.passes).toHaveLength(1);
    expect(graph.passes[0].id).toBe('gpu-raster-threshold');
    expect(graph.passes[0].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-read',
      'storage-read'
    ]);
  });

  test('rejects unsupported two-dimensional workgroups and oversized aligned bindings', () => {
    const limitedWorkgroups = makeRecordingGraph('threshold-workgroups', {
      maxComputeInvocationsPerWorkgroup: 32
    });
    expect(() =>
      new GPURasterThreshold(makeThresholdProps(limitedWorkgroups)).addToGraph(limitedWorkgroups)
    ).toThrow(/workgroup limits/);

    const limitedStorage = makeRecordingGraph('threshold-storage', {
      maxStorageBufferBindingSize: 20
    });
    expect(() =>
      new GPURasterThreshold(makeThresholdProps(limitedStorage)).addToGraph(limitedStorage)
    ).toThrow(/storage binding limit/);
  });
});

describe('GPURasterOtsuThreshold graph contributor contracts', () => {
  test('accepts fixed or GPU-resident histogram domains', () => {
    const owner = {id: 'otsu-contract'} as GraphOwner;
    const histogram = makeView(owner, 'histogram', 'uint32', 48);
    const output = makeView(owner, 'threshold', 'float32', 1);
    const domain = makeView(owner, 'domain', 'float32', 2);

    expect(new GPURasterOtsuThreshold({histogram, domain: [-1, 1], output}).domain).toEqual([
      -1, 1
    ]);
    expect(new GPURasterOtsuThreshold({histogram, domain, output}).domain).toBe(domain);
  });

  test('rejects unbounded histograms, invalid domains, foreign resources, and aliases', () => {
    const owner = {id: 'otsu-validation'} as GraphOwner;
    const foreignOwner = {id: 'otsu-foreign'} as GraphOwner;
    const histogram = makeView(owner, 'histogram', 'uint32', 4);
    const output = makeView(owner, 'threshold', 'float32', 1);

    expect(
      () =>
        new GPURasterOtsuThreshold({
          histogram: makeView(owner, 'empty', 'uint32', 0),
          domain: [0, 1],
          output
        })
    ).toThrow(/between one and 256/);
    expect(
      () =>
        new GPURasterOtsuThreshold({
          histogram: makeView(owner, 'large', 'uint32', 257),
          domain: [0, 1],
          output
        })
    ).toThrow(/between one and 256/);
    expect(() => new GPURasterOtsuThreshold({histogram, domain: [1, -1], output})).toThrow(
      /ordered finite/
    );
    expect(
      () =>
        new GPURasterOtsuThreshold({
          histogram,
          domain: makeView(foreignOwner, 'foreign-domain', 'float32', 2),
          output
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterOtsuThreshold({
          histogram,
          domain: [0, 1],
          output: makeView(foreignOwner, 'foreign-output', 'float32', 1)
        })
    ).toThrow(/same graph/);
  });

  test('declares optional GPU-domain dependency without executing analysis', () => {
    const graph = makeRecordingGraph('otsu-graph');
    const histogram = makeView(graph, 'histogram', 'uint32', 4);
    const domain = makeView(graph, 'domain', 'float32', 2);
    const output = makeView(graph, 'threshold', 'float32', 1);

    new GPURasterOtsuThreshold({histogram, domain, output}).addToGraph(graph);

    expect(graph.passes).toHaveLength(1);
    expect(graph.passes[0].resources.map(resource => resource.usage)).toEqual([
      'storage-read',
      'storage-write',
      'storage-read'
    ]);
  });
});

function makeThresholdProps(owner: GraphOwner): GPURasterThresholdProps {
  return {
    width: 3,
    height: 2,
    input: makeBand(owner, 'source', 'float32', 6),
    output: makeView(owner, 'output', 'uint32', 6),
    threshold: 0.5
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

function makeBand<Format extends GPURasterScalarFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number
): GPURasterBufferBand<Format> {
  return {
    id,
    format,
    storage: {kind: 'buffer', values: makeView(owner, id, format, length)}
  } as GPURasterBufferBand<Format>;
}

function makeView<Format extends GPURasterScalarFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = new GraphBufferHandle(
    owner,
    {id, byteLength: Math.max(length, 1) * 4, usage: 0},
    false
  );
  return new GraphDataView(handle, {
    format,
    length,
    byteOffset: 0,
    byteStride: 4,
    rowByteLength: 4
  });
}
