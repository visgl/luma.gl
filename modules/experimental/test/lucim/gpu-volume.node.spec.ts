// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type VertexFormat} from '@luma.gl/core';
import {
  GraphBufferHandle,
  GraphDataView,
  type GPUCommandGraph,
  type GPUCommandGraphComputeNode
} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUVolume,
  GPUVolumeConnectedComponents,
  GPUVolumeDilation,
  GPUVolumeOpening,
  GPUVolumeRegionMeasurements,
  GPUVolumeThreshold,
  type GPUVolumeBufferChannel,
  type GPUVolumeMetadata
} from '@luma.gl/experimental/lucim';
import {describe, expect, test} from 'vitest';

type GraphOwner = GraphBufferHandle['graph'];
type RecordingGraph = GPUCommandGraph & {
  passes: GPUCommandGraphComputeNode[];
  transientBuffers: GraphBufferHandle[];
};

describe('GPUVolume physical and ownership contract', () => {
  test('retains x-fastest channels and maps cell centers through spacing, direction, and origin', () => {
    const graph = makeRecordingGraph('volume-metadata');
    const metadata: GPUVolumeMetadata = {
      width: 2,
      height: 2,
      depth: 2,
      spacing: [2, 3, 4],
      origin: [10, 20, 30],
      direction: [0, -1, 0, 1, 0, 0, 0, 0, 1],
      voxelInterpretation: 'cell'
    };
    const density = makeChannel(graph, 'density', 'float32', 8);
    const volume = new GPUVolume({id: 'scan', metadata, channels: [density]});

    expect(volume.voxelCount).toBe(8);
    expect(volume.graph).toBe(graph);
    expect(volume.getChannel('density')).toBe(density);
    expect(volume.getVoxelWorldPosition(0, 0, 0)).toEqual([8.5, 21, 32]);
    expect(volume.getVoxelPhysicalVolume()).toBe(24);
    expect(() => volume.getChannel('missing')).toThrow(/does not contain/);
  });

  test('rejects singular physical grids, duplicate channels, and mixed graph owners', () => {
    const graph = makeRecordingGraph('volume-validation');
    const metadata = makeMetadata();
    expect(
      () =>
        new GPUVolume({
          metadata: {...metadata, direction: [1, 0, 0, 0, 0, 0, 0, 0, 1]},
          channels: [makeChannel(graph, 'density', 'float32', 8)]
        })
    ).toThrow(/invertible/);

    const first = makeChannel(graph, 'density', 'float32', 8);
    const duplicate = makeChannel(graph, 'density', 'uint32', 8);
    expect(() => new GPUVolume({metadata, channels: [first, duplicate]})).toThrow(/unique/);

    const foreign = makeRecordingGraph('foreign-volume');
    expect(
      () =>
        new GPUVolume({
          metadata,
          channels: [first, makeChannel(foreign, 'mask', 'uint32', 8)]
        })
    ).toThrow(/same graph/);
  });
});

describe('LuCIM tranche contracts and graph composition', () => {
  test('exposes stable threshold, morphology, and component defaults', () => {
    const graph = makeRecordingGraph('lucim-defaults');
    const source = makeChannel(graph, 'source', 'float32', 8);
    const threshold = new GPUVolumeThreshold({
      width: 2,
      height: 2,
      depth: 2,
      input: source,
      output: makeView(graph, 'threshold-output', 'uint32', 8),
      threshold: 0.5
    });
    expect(threshold.operation).toBe('above');
    expect(threshold.inclusive).toBe(true);

    const dilation = new GPUVolumeDilation({
      width: 2,
      height: 2,
      depth: 2,
      radius: 1,
      input: source,
      output: makeView(graph, 'dilation-output', 'float32', 8),
      outputValidity: makeView(graph, 'dilation-validity', 'uint32', 8)
    });
    expect(dilation.mode).toBe('grayscale');
    expect(dilation.structuringElement).toBe('cube');
    expect(dilation.requiredHalo).toBe(1);

    const components = new GPUVolumeConnectedComponents(
      makeComponentProps(graph, {maximumIterations: undefined})
    );
    expect(components.connectivity).toBe(6);
    expect(components.maximumIterations).toBe(5);
  });

  test('declares one pass per local stage, bounded component rounds, and three measurements', () => {
    const thresholdGraph = makeRecordingGraph('threshold-plan');
    new GPUVolumeThreshold({
      width: 2,
      height: 2,
      depth: 2,
      input: makeChannel(thresholdGraph, 'source', 'sint32', 8),
      output: makeView(thresholdGraph, 'output', 'uint32', 8),
      threshold: [-1, 1],
      operation: 'range'
    }).addToGraph(thresholdGraph);
    expect(thresholdGraph.passes.map(pass => pass.id)).toEqual(['gpu-volume-threshold']);

    const morphologyGraph = makeRecordingGraph('morphology-plan');
    const binaryProps = makeBinaryMorphologyProps(morphologyGraph);
    new GPUVolumeOpening({...binaryProps, id: 'open-volume'}).addToGraph(morphologyGraph);
    expect(morphologyGraph.passes.map(pass => pass.id)).toEqual([
      'open-volume-erode',
      'open-volume-dilate'
    ]);
    expect(morphologyGraph.transientBuffers.map(buffer => buffer.id).sort()).toEqual([
      'open-volume-intermediate-validity',
      'open-volume-intermediate-values'
    ]);

    const componentGraph = makeRecordingGraph('component-plan');
    new GPUVolumeConnectedComponents(
      makeComponentProps(componentGraph, {id: 'segment-volume', maximumIterations: 2})
    ).addToGraph(componentGraph);
    expect(componentGraph.passes.map(pass => pass.id)).toEqual([
      'segment-volume-initialize',
      'segment-volume-hook-0',
      'segment-volume-compress-0',
      'segment-volume-convergence-0',
      'segment-volume-hook-1',
      'segment-volume-compress-1',
      'segment-volume-convergence-1',
      'segment-volume-publish'
    ]);
    expect(componentGraph.transientBuffers).toHaveLength(3);
    expect(componentGraph.transientBuffers[2]?.usage).toBe(Buffer.STORAGE | Buffer.INDIRECT);

    const measurementGraph = makeRecordingGraph('measurement-plan');
    new GPUVolumeRegionMeasurements(makeMeasurementProps(measurementGraph)).addToGraph(
      measurementGraph
    );
    expect(measurementGraph.passes.map(pass => pass.id)).toEqual([
      'gpu-volume-region-measurements-initialize',
      'gpu-volume-region-measurements-accumulate',
      'gpu-volume-region-measurements-finalize'
    ]);
  });

  test('rejects unstable radii, connectivity, measurement capacity, and foreign target graphs', () => {
    const graph = makeRecordingGraph('lucim-rejections');
    const binaryProps = makeBinaryMorphologyProps(graph);
    expect(() => new GPUVolumeDilation({...binaryProps, radius: 5})).toThrow(/zero through four/);
    expect(
      () => new GPUVolumeConnectedComponents(makeComponentProps(graph, {connectivity: 8 as never}))
    ).toThrow(/six, eighteen, or twenty-six/);
    const measurements = makeMeasurementProps(graph);
    expect(
      () =>
        new GPUVolumeRegionMeasurements({
          ...measurements,
          output: {
            ...measurements.output,
            voxelCounts: makeView(graph, 'empty-counts', 'uint32', 0)
          }
        })
    ).toThrow(/positive safe integer/);

    const foreign = makeRecordingGraph('foreign-target');
    expect(() => new GPUVolumeDilation(binaryProps).addToGraph(foreign)).toThrow(/target graph/);
  });
});

function makeMetadata(): GPUVolumeMetadata {
  return {
    width: 2,
    height: 2,
    depth: 2,
    spacing: [1, 1, 1],
    origin: [0, 0, 0],
    direction: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    voxelInterpretation: 'cell'
  };
}

function makeBinaryMorphologyProps(graph: RecordingGraph) {
  return {
    mode: 'binary' as const,
    width: 2,
    height: 2,
    depth: 2,
    radius: 1,
    input: makeChannel(graph, 'mask', 'uint32', 8),
    output: makeView(graph, 'morphology-output', 'uint32', 8),
    outputValidity: makeView(graph, 'morphology-validity', 'uint32', 8)
  };
}

function makeComponentProps(
  graph: RecordingGraph,
  overrides: Partial<ConstructorParameters<typeof GPUVolumeConnectedComponents>[0]> = {}
) {
  return {
    width: 2,
    height: 2,
    depth: 2,
    input: makeChannel(graph, 'foreground', 'uint32', 8),
    output: makeView(graph, 'component-labels', 'uint32', 8),
    outputValidity: makeView(graph, 'component-validity', 'uint32', 8),
    converged: makeView(graph, 'component-converged', 'uint32', 1),
    iterationCount: makeView(graph, 'component-iterations', 'uint32', 1),
    ...overrides
  };
}

function makeMeasurementProps(graph: RecordingGraph) {
  return {
    width: 2,
    height: 2,
    depth: 2,
    labels: makeView(graph, 'measurement-labels', 'uint32', 8),
    labelValidity: makeView(graph, 'measurement-validity', 'uint32', 8),
    output: {
      voxelCounts: makeView(graph, 'voxel-counts', 'uint32', 8),
      minimumCoordinates: makeView(graph, 'minimum-coordinates', 'uint32x3', 8),
      maximumCoordinates: makeView(graph, 'maximum-coordinates', 'uint32x3', 8)
    },
    overflow: makeView(graph, 'measurement-overflow', 'uint32', 1)
  };
}

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
        maxComputeInvocationsPerWorkgroup: 256,
        maxComputeWorkgroupSizeX: 256,
        maxComputeWorkgroupSizeY: 256,
        maxComputeWorkgroupSizeZ: 64,
        maxComputeWorkgroupsPerDimension: 65535,
        maxComputeWorkgroupStorageSize: 16384,
        maxStorageBuffersPerShaderStage: 8,
        maxStorageBufferBindingSize: 134217728,
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
      const handle = new GraphBufferHandle(graph as unknown as GraphOwner, descriptor, true);
      transientBuffers.push(handle);
      return handle;
    },
    createDataView<Format extends VertexFormat>(
      buffer: GraphBufferHandle,
      props: {format: Format; length: number}
    ): GraphDataView<Format> {
      return new GraphDataView(buffer, {
        format: props.format,
        length: props.length,
        byteOffset: 0,
        byteStride: 4,
        rowByteLength: 4
      });
    }
  };
  return graph as unknown as RecordingGraph;
}

function makeChannel<Format extends 'float32' | 'uint32' | 'sint32'>(
  graph: RecordingGraph,
  id: string,
  format: Format,
  length: number
): GPUVolumeBufferChannel<Format> {
  return {
    id,
    format,
    values: makeView(graph, id, format, length)
  } as GPUVolumeBufferChannel<Format>;
}

function makeView<Format extends VertexFormat>(
  owner: GraphOwner,
  id: string,
  format: Format,
  length: number
): GraphDataView<Format> {
  const rowByteLength = format === 'uint32x3' ? 12 : 4;
  const buffer = new GraphBufferHandle(
    owner,
    {id, byteLength: Math.max(length, 1) * rowByteLength, usage: Buffer.STORAGE},
    false
  );
  return new GraphDataView(buffer, {
    format,
    length,
    byteOffset: 0,
    byteStride: rowByteLength,
    rowByteLength
  });
}
