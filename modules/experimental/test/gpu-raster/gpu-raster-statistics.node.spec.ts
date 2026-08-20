// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {GraphBufferHandle, GraphDataView, type GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPURasterStatistics,
  type GPURasterBufferBand,
  type GPURasterScalarFormat,
  type GPURasterStatisticsProps
} from '@luma.gl/experimental/gpu-raster';

type GraphOwner = GraphBufferHandle['graph'];

describe('GPURasterStatistics caller-owned aggregate contracts', () => {
  test('preserves source calibration, nodata, validity, and four explicit outputs', () => {
    const owner = {id: 'statistics-contract'} as GraphOwner;
    const props = makeStatisticsProps(owner);
    const input = {
      ...props.input,
      validity: makeView(owner, 'validity', 'uint32', 6),
      scale: 0.5,
      offset: 2,
      noDataValue: -999
    };
    const contributor = new GPURasterStatistics({...props, input});

    expect(contributor.id).toBe('gpu-raster-statistics');
    expect(contributor.input).toBe(input);
    expect(contributor.count).toBe(props.count);
    expect(contributor.sum).toBe(props.sum);
    expect(contributor.mean).toBe(props.mean);
    expect(contributor.extent).toBe(props.extent);
  });

  test('rejects invalid grids, non-float inputs, and unstable float32 calibration', () => {
    const owner = {id: 'statistics-options'} as GraphOwner;
    const props = makeStatisticsProps(owner);

    for (const dimensions of [
      {width: 0, height: 2},
      {width: 2.5, height: 2},
      {width: 3, height: -1}
    ]) {
      expect(() => new GPURasterStatistics({...props, ...dimensions})).toThrow(/positive integers/);
    }
    expect(() => new GPURasterStatistics({...props, width: 65536, height: 65536})).toThrow(
      /fit in uint32/
    );
    expect(
      () =>
        new GPURasterStatistics({
          ...props,
          input: makeBand(owner, 'integer', 'uint32', 6) as GPURasterBufferBand<'float32'>
        })
    ).toThrow(/float32 buffer-backed/);
    expect(
      () =>
        new GPURasterStatistics({
          ...props,
          input: {...props.input, scale: Number.MAX_VALUE}
        })
    ).toThrow(/finite float32/);
  });

  test('requires packed output shapes, one graph, and independent physical buffers', () => {
    const owner = {id: 'statistics-layout'} as GraphOwner;
    const foreignOwner = {id: 'statistics-foreign'} as GraphOwner;
    const props = makeStatisticsProps(owner);

    expect(
      () =>
        new GPURasterStatistics({
          ...props,
          count: makeView(owner, 'long-count', 'uint32', 2)
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterStatistics({
          ...props,
          extent: makeView(owner, 'short-extent', 'float32', 1)
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterStatistics({
          ...props,
          mean: makeView(foreignOwner, 'foreign-mean', 'float32', 1)
        })
    ).toThrow(/same graph/);
    expect(() => new GPURasterStatistics({...props, mean: props.sum})).toThrow(/separate buffers/);
    expect(
      () =>
        new GPURasterStatistics({
          ...props,
          input: {...props.input, validity: props.count}
        })
    ).toThrow(/one flag per pixel/);
  });

  test('rejects reduction dispatches larger than the bounded one-dimensional device limit', () => {
    const graph = makeRecordingGraph('statistics-dispatch', {maxComputeWorkgroupsPerDimension: 1});
    const props = makeStatisticsProps(graph, 17, 17);

    expect(() => new GPURasterStatistics(props).addToGraph(graph)).toThrow(
      /bounded scalar-analysis dispatch/
    );
  });

  test('rejects incompatible reduction workgroups and oversized aligned source bindings', () => {
    const workgroupGraph = makeRecordingGraph('statistics-workgroups', {
      maxComputeInvocationsPerWorkgroup: 128
    });
    expect(() =>
      new GPURasterStatistics(makeStatisticsProps(workgroupGraph)).addToGraph(workgroupGraph)
    ).toThrow(/workgroup size 256/);

    const storageGraph = makeRecordingGraph('statistics-storage', {
      maxStorageBufferBindingSize: 20
    });
    expect(() =>
      new GPURasterStatistics(makeStatisticsProps(storageGraph)).addToGraph(storageGraph)
    ).toThrow(/storage binding limit/);
  });
});

function makeStatisticsProps(
  owner: GraphOwner,
  width: number = 3,
  height: number = 2
): GPURasterStatisticsProps {
  return {
    width,
    height,
    input: makeBand(owner, 'values', 'float32', width * height),
    count: makeView(owner, 'count', 'uint32', 1),
    sum: makeView(owner, 'sum', 'float32', 1),
    mean: makeView(owner, 'mean', 'float32', 1),
    extent: makeView(owner, 'extent', 'float32', 2)
  };
}

function makeRecordingGraph(
  id: string,
  limitOverrides: Partial<GPUCommandGraph['device']['limits']> = {}
): GPUCommandGraph {
  return {
    id,
    device: {
      type: 'webgpu',
      limits: {
        maxTextureDimension2D: 8192,
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupsPerDimension: 65535,
        maxStorageBufferBindingSize: 134217728,
        maxBufferSize: 268435456,
        minStorageBufferOffsetAlignment: 256,
        ...limitOverrides
      }
    }
  } as GPUCommandGraph;
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
