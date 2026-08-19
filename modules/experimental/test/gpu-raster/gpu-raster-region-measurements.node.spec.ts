// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GraphBufferHandle,
  GraphDataView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from '@luma.gl/experimental';
import {
  getRasterRegionWorldCentroid,
  GPURasterRegionMeasurements,
  type GPURasterMetadata,
  type GPURasterRegionMeasurementOutputs,
  type GPURasterRegionMeasurementsProps,
  type GPURasterScalarFormat
} from '@luma.gl/experimental/gpu-raster';
import {describe, expect, test} from 'vitest';

type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientBuffers: GraphBufferHandle[];
};

describe('GPURasterRegionMeasurements public contracts', () => {
  test('preserves affine metadata, float-only observations, and all eleven caller-owned region columns', () => {
    const graph = makeRecordingGraph('region-defaults');
    const props = makeProps(graph, 3, 2, 4, 4);
    const contributor = new GPURasterRegionMeasurements(props);

    expect(contributor.id).toBe('gpu-raster-region-measurements');
    expect(contributor.metadata).toBe(props.metadata);
    expect(contributor.width).toBe(3);
    expect(contributor.height).toBe(2);
    expect(contributor.labels).toBe(props.labels);
    expect(contributor.labelValidity).toBe(props.labelValidity);
    expect(contributor.converged).toBe(props.converged);
    expect(contributor.componentCount).toBe(props.componentCount);
    expect(contributor.overflow).toBe(props.overflow);
    expect(contributor.intensity).toBe(props.intensity);
    expect(contributor.output).toBe(props.output);
    expect(contributor.capacity).toBe(4);
    expect(Object.keys(contributor.output)).toEqual([
      'pixelCounts',
      'intensityCounts',
      'intensitySums',
      'intensityMinimums',
      'intensityMaximums',
      'intensityMeans',
      'columnSums',
      'rowSums',
      'centroidColumns',
      'centroidRows',
      'areas'
    ]);
    expect(contributor.output.pixelCounts.byteOffset).toBe(4);
    expect(new GPURasterRegionMeasurements({...props, capacity: 0}).capacity).toBe(0);
  });

  test('applies rotated local centroids at JavaScript precision without adding tile origins twice', () => {
    const metadata: GPURasterMetadata = {
      width: 3,
      height: 2,
      affine: [2, -3, 20000000.25, 4, 5, -30000000.75],
      pixelInterpretation: 'area',
      levelZeroOrigin: [4096, 2048]
    };
    expect(getRasterRegionWorldCentroid(metadata, 1.25, 0.5)).toEqual([20000001.25, -29999993.25]);
    expect(getRasterRegionWorldCentroid(metadata, 0.5, 0.5)[0]).toBe(19999999.75);
    expect(() => getRasterRegionWorldCentroid(metadata, Number.NaN, 0)).toThrow(/finite local/);
    expect(() => getRasterRegionWorldCentroid(metadata, 0, Number.POSITIVE_INFINITY)).toThrow(
      /finite local/
    );
  });

  test('rejects invalid metadata, implicit integer intensity, and unrepresentable float calibration', () => {
    const graph = makeRecordingGraph('region-description');
    const props = makeProps(graph, 3, 2, 4);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          metadata: {...props.metadata, affine: [1, 2, 0, 2, 4, 0]}
        })
    ).toThrow(/invertible/);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          metadata: {...props.metadata, pixelInterpretation: 'corner' as never}
        })
    ).toThrow(/pixelInterpretation/);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          intensity: {
            ...props.intensity,
            format: 'uint32',
            storage: {kind: 'buffer', values: makeView(graph, 'integer-intensity', 'uint32', 6)}
          } as never
        })
    ).toThrow(/explicitly promoted.*float32/);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          intensity: {...props.intensity, scale: Number.MAX_VALUE}
        })
    ).toThrow(/finite float32/);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          intensity: {...props.intensity, offset: Number.POSITIVE_INFINITY}
        })
    ).toThrow(/finite/);
  });

  test('requires equally sized unsigned populations, floating measurements, and valid scalar inputs', () => {
    const graph = makeRecordingGraph('region-column-validation');
    const props = makeProps(graph, 3, 2, 4);

    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          labels: makeView(graph, 'short-labels', 'uint32', 5)
        })
    ).toThrow(/one sample per pixel/);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          labelValidity: makeView(graph, 'floating-label-validity', 'float32', 6) as never
        })
    ).toThrow(/uint32/);
    for (const scalar of ['converged', 'componentCount', 'overflow'] as const) {
      expect(
        () =>
          new GPURasterRegionMeasurements({
            ...props,
            [scalar]: makeView(graph, `${scalar}-extra`, 'uint32', 2)
          })
      ).toThrow(/one flag per pixel/);
    }
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          output: {
            ...props.output,
            pixelCounts: makeView(graph, 'floating-population', 'float32', 4) as never
          }
        })
    ).toThrow(/uint32/);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          output: {
            ...props.output,
            intensityMeans: makeView(graph, 'integer-mean', 'uint32', 4) as never
          }
        })
    ).toThrow(/float32/);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          output: {...props.output, areas: makeView(graph, 'short-area', 'float32', 3)}
        })
    ).toThrow(/identical lengths/);
    for (const capacity of [-1, 1.5, 5, Number.NaN]) {
      expect(() => new GPURasterRegionMeasurements({...props, capacity})).toThrow(/capacity/);
    }
  });

  test('rejects foreign or aliased results while allowing one read-only validity mask to be shared', () => {
    const graph = makeRecordingGraph('region-ownership');
    const foreign = makeRecordingGraph('region-foreign');
    const props = makeProps(graph, 3, 2, 4);

    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          output: {...props.output, areas: makeView(foreign, 'foreign-area', 'float32', 4)}
        })
    ).toThrow(/same graph/);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          output: {...props.output, intensityCounts: props.output.pixelCounts}
        })
    ).toThrow(/distinct buffers/);
    expect(
      () =>
        new GPURasterRegionMeasurements({
          ...props,
          output: {...props.output, intensitySums: props.intensity.storage.values}
        })
    ).toThrow(/identical lengths|distinct buffers/);

    const sharedMask = new GPURasterRegionMeasurements({
      ...props,
      intensity: {...props.intensity, validity: props.labelValidity}
    });
    expect(sharedMask.intensity.validity).toBe(sharedMask.labelValidity);
  });
});

describe('GPURasterRegionMeasurements graph composition', () => {
  test('declares separate topology/intensity populations, seven grouped operations, and two finalizers', () => {
    const graph = makeRecordingGraph('region-group-plan');
    const contributor = new GPURasterRegionMeasurements({
      ...makeProps(graph, 3, 2, 4),
      id: 'affine-regions',
      capacity: 3
    });
    contributor.addToGraph(graph);

    expect(graph.transientBuffers.map(buffer => buffer.id)).toEqual([
      'affine-regions-group-keys',
      'affine-regions-topology-mask',
      'affine-regions-intensity-mask',
      'affine-regions-calibrated-intensity',
      'affine-regions-column-values',
      'affine-regions-row-values'
    ]);
    expect(graph.passes.map(pass => pass.id)).toEqual([
      'affine-regions-prepare-membership',
      'affine-regions-prepare-observations',
      'affine-regions-pixel-count-clear',
      'affine-regions-pixel-count-local',
      'affine-regions-intensity-count-clear',
      'affine-regions-intensity-count-local',
      'affine-regions-intensity-sum-clear',
      'affine-regions-intensity-sum-sum',
      'affine-regions-intensity-minimum-initialize',
      'affine-regions-intensity-minimum-min',
      'affine-regions-intensity-minimum-finalize',
      'affine-regions-intensity-maximum-initialize',
      'affine-regions-intensity-maximum-max',
      'affine-regions-intensity-maximum-finalize',
      'affine-regions-column-sum-clear',
      'affine-regions-column-sum-sum',
      'affine-regions-row-sum-clear',
      'affine-regions-row-sum-sum',
      'affine-regions-finalize-intensity',
      'affine-regions-finalize-geometry'
    ]);
    expect(graph.passes[0]?.resources).toHaveLength(7);
    expect(graph.passes[1]?.resources).toHaveLength(7);
    expect(graph.passes.at(-1)?.resources).toHaveLength(6);
    expect(graph.passes.every(pass => (pass.resources?.length ?? 0) <= 7)).toBe(true);
    expect(graph.transientBuffers.every(buffer => buffer.transient)).toBe(true);
  });

  test('accepts zero-length output tables without invoking the nonempty grouped primitive', () => {
    const graph = makeRecordingGraph('region-empty-capacity');
    const contributor = new GPURasterRegionMeasurements(makeProps(graph, 3, 2, 0));
    expect(contributor.capacity).toBe(0);
    contributor.addToGraph(graph);
    expect(graph.passes).toHaveLength(0);
    expect(graph.transientBuffers).toHaveLength(0);

    const initialized = makeRecordingGraph('region-zero-active-capacity');
    new GPURasterRegionMeasurements({...makeProps(initialized, 3, 2, 2), capacity: 0}).addToGraph(
      initialized
    );
    expect(initialized.passes).toHaveLength(20);
  });

  test('preflights WebGPU identity, seven bindings, grouped workgroups, storage, and dispatches', () => {
    const notWebGPU = makeRecordingGraph('region-webgl', {}, 'webgl');
    expect(() =>
      new GPURasterRegionMeasurements(makeProps(notWebGPU, 3, 2, 2)).addToGraph(notWebGPU)
    ).toThrow(/WebGPU device/);

    const limitedBindings = makeRecordingGraph('region-bindings', {
      maxStorageBuffersPerShaderStage: 6
    });
    expect(() =>
      new GPURasterRegionMeasurements(makeProps(limitedBindings, 3, 2, 2)).addToGraph(
        limitedBindings
      )
    ).toThrow(/binding count/);

    const limitedInvocations = makeRecordingGraph('region-group-invocations', {
      maxComputeInvocationsPerWorkgroup: 255
    });
    expect(() =>
      new GPURasterRegionMeasurements(makeProps(limitedInvocations, 3, 2, 2)).addToGraph(
        limitedInvocations
      )
    ).toThrow(/grouped reductions.*workgroup limits/);

    const limitedThreads = makeRecordingGraph('region-group-threads', {
      maxComputeWorkgroupSizeX: 255
    });
    expect(() =>
      new GPURasterRegionMeasurements(makeProps(limitedThreads, 3, 2, 2)).addToGraph(limitedThreads)
    ).toThrow(/grouped reductions.*workgroup limits/);

    const limitedStorage = makeRecordingGraph('region-storage', {maxStorageBufferBindingSize: 27});
    expect(() =>
      new GPURasterRegionMeasurements(makeProps(limitedStorage, 3, 2, 2, 4)).addToGraph(
        limitedStorage
      )
    ).toThrow(/storage binding limit/);

    const limitedGroups = makeRecordingGraph('region-group-dispatch', {
      maxComputeWorkgroupsPerDimension: 1
    });
    expect(() =>
      new GPURasterRegionMeasurements(makeProps(limitedGroups, 3, 2, 257)).addToGraph(limitedGroups)
    ).toThrow(/region output count.*dispatch limits/);

    const limitedRaster = makeRecordingGraph('region-raster-dispatch', {
      maxComputeWorkgroupsPerDimension: 1
    });
    expect(() =>
      new GPURasterRegionMeasurements(makeProps(limitedRaster, 9, 2, 1)).addToGraph(limitedRaster)
    ).toThrow(/dispatch limits/);
  });

  test('rejects command graphs different from the validated borrowed source and destinations', () => {
    const owner = makeRecordingGraph('region-owner');
    const target = makeRecordingGraph('region-other-target');
    expect(() =>
      new GPURasterRegionMeasurements(makeProps(owner, 3, 2, 2)).addToGraph(target)
    ).toThrow(/target graph/);
  });
});

function makeRecordingGraph(
  id: string,
  limitOverrides: Partial<GPUCommandGraph['device']['limits']> = {},
  deviceType: string = 'webgpu'
): RecordingGraph {
  const passes: GPUCommandGraphComputeNode[] = [];
  const transientBuffers: GraphBufferHandle[] = [];
  const graph = {
    id,
    device: {
      type: deviceType,
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

function makeProps(
  graph: RecordingGraph,
  width: number,
  height: number,
  regionCount: number,
  byteOffset: number = 0
): GPURasterRegionMeasurementsProps {
  const pixelCount = width * height;
  return {
    metadata: {
      width,
      height,
      affine: [2, 1, 10000000.125, -1, 3, -20000000.625],
      pixelInterpretation: 'area'
    },
    labels: makeView(graph, 'dense-labels', 'uint32', pixelCount, byteOffset),
    labelValidity: makeView(graph, 'dense-validity', 'uint32', pixelCount, byteOffset),
    converged: makeView(graph, 'region-converged', 'uint32', 1, byteOffset),
    componentCount: makeView(graph, 'bounded-count', 'uint32', 1, byteOffset),
    overflow: makeView(graph, 'dense-overflow', 'uint32', 1, byteOffset),
    intensity: {
      id: 'float-intensity',
      format: 'float32',
      storage: {
        kind: 'buffer',
        values: makeView(graph, 'intensity', 'float32', pixelCount, byteOffset)
      },
      validity: makeView(graph, 'intensity-validity', 'uint32', pixelCount, byteOffset)
    },
    output: makeOutputs(graph, regionCount, byteOffset)
  };
}

function makeOutputs(
  graph: RecordingGraph,
  regionCount: number,
  byteOffset: number
): GPURasterRegionMeasurementOutputs {
  return {
    pixelCounts: makeView(graph, 'pixel-counts', 'uint32', regionCount, byteOffset),
    intensityCounts: makeView(graph, 'intensity-counts', 'uint32', regionCount, byteOffset),
    intensitySums: makeView(graph, 'intensity-sums', 'float32', regionCount, byteOffset),
    intensityMinimums: makeView(graph, 'intensity-minimums', 'float32', regionCount, byteOffset),
    intensityMaximums: makeView(graph, 'intensity-maximums', 'float32', regionCount, byteOffset),
    intensityMeans: makeView(graph, 'intensity-means', 'float32', regionCount, byteOffset),
    columnSums: makeView(graph, 'column-sums', 'float32', regionCount, byteOffset),
    rowSums: makeView(graph, 'row-sums', 'float32', regionCount, byteOffset),
    centroidColumns: makeView(graph, 'centroid-columns', 'float32', regionCount, byteOffset),
    centroidRows: makeView(graph, 'centroid-rows', 'float32', regionCount, byteOffset),
    areas: makeView(graph, 'areas', 'float32', regionCount, byteOffset)
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
    {id, byteLength: byteOffset + Math.max(length, 1) * 4, usage: Buffer.STORAGE},
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
