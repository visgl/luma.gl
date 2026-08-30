// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder, type Device, type VertexFormat} from '@luma.gl/core';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUVolume,
  GPUVolumeClosing,
  GPUVolumeConnectedComponents,
  GPUVolumeRegionMeasurements,
  GPUVolumeThreshold
} from '@luma.gl/experimental/lucim';
import {VOLUME_LAB_DEFAULT_THRESHOLD, type VolumeLabDataset} from './volume-lab-data';

export type VolumeLabAnalysisStatus = {
  version: number;
  converged: boolean;
  iterationCount: number;
  regionOverflow: boolean;
};

/** Owns the synthetic volume buffers and one reusable LuCIM segmentation graph. */
export class VolumeLabEngine {
  readonly device: Device;
  readonly dataset: VolumeLabDataset;
  readonly volume: GPUVolume;
  readonly sourceValues: Buffer;
  readonly sourceValidity: Buffer;
  readonly thresholdValues: Buffer;
  readonly thresholdMask: Buffer;
  readonly morphologyMask: Buffer;
  readonly morphologyValidity: Buffer;
  readonly componentLabels: Buffer;
  readonly componentValidity: Buffer;
  readonly convergence: Buffer;
  readonly iterationCount: Buffer;
  readonly regionVoxelCounts: Buffer;
  readonly regionMinimumCoordinates: Buffer;
  readonly regionMaximumCoordinates: Buffer;
  readonly regionOverflow: Buffer;
  readonly compiled: CompiledGPUCommandGraph<void>;
  readonly buffers: readonly Buffer[];
  readonly nodeCount: number;
  readonly residentByteLength: number;
  readonly maximumComponentIterations: number;

  threshold = VOLUME_LAB_DEFAULT_THRESHOLD;
  version = 0;

  private analysisPending = true;
  private destroyed = false;

  constructor(device: Device, dataset: VolumeLabDataset) {
    if (device.type !== 'webgpu') {
      throw new Error('LuCIM Volume Lab requires WebGPU');
    }
    this.device = device;
    this.dataset = dataset;
    const voxelCount = dataset.values.length;
    this.maximumComponentIterations = Math.min(
      64,
      Math.max(1, Math.ceil(Math.log2(voxelCount)) + 16)
    );
    const scalarByteLength = voxelCount * Uint32Array.BYTES_PER_ELEMENT;
    const coordinateByteLength = scalarByteLength * 3;
    const sourceUsage = Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST;
    const outputUsage = Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST;

    this.sourceValues = device.createBuffer({
      id: 'lucim-volume-lab-source-values',
      data: dataset.values,
      usage: sourceUsage
    });
    this.sourceValidity = device.createBuffer({
      id: 'lucim-volume-lab-source-validity',
      data: dataset.validity,
      usage: sourceUsage
    });
    this.thresholdValues = device.createBuffer({
      id: 'lucim-volume-lab-threshold-value',
      data: new Float32Array([this.threshold]),
      usage: outputUsage
    });
    this.thresholdMask = makeOutputBuffer(
      device,
      'lucim-volume-lab-threshold-mask',
      scalarByteLength,
      outputUsage
    );
    this.morphologyMask = makeOutputBuffer(
      device,
      'lucim-volume-lab-morphology-mask',
      scalarByteLength,
      outputUsage
    );
    this.morphologyValidity = makeOutputBuffer(
      device,
      'lucim-volume-lab-morphology-validity',
      scalarByteLength,
      outputUsage
    );
    this.componentLabels = makeOutputBuffer(
      device,
      'lucim-volume-lab-component-labels',
      scalarByteLength,
      outputUsage
    );
    this.componentValidity = makeOutputBuffer(
      device,
      'lucim-volume-lab-component-validity',
      scalarByteLength,
      outputUsage
    );
    this.convergence = makeOutputBuffer(
      device,
      'lucim-volume-lab-convergence',
      Uint32Array.BYTES_PER_ELEMENT,
      outputUsage
    );
    this.iterationCount = makeOutputBuffer(
      device,
      'lucim-volume-lab-iteration-count',
      Uint32Array.BYTES_PER_ELEMENT,
      outputUsage
    );
    this.regionVoxelCounts = makeOutputBuffer(
      device,
      'lucim-volume-lab-region-voxel-counts',
      scalarByteLength,
      outputUsage
    );
    this.regionMinimumCoordinates = makeOutputBuffer(
      device,
      'lucim-volume-lab-region-minimum-coordinates',
      coordinateByteLength,
      outputUsage
    );
    this.regionMaximumCoordinates = makeOutputBuffer(
      device,
      'lucim-volume-lab-region-maximum-coordinates',
      coordinateByteLength,
      outputUsage
    );
    this.regionOverflow = makeOutputBuffer(
      device,
      'lucim-volume-lab-region-overflow',
      Uint32Array.BYTES_PER_ELEMENT,
      outputUsage
    );
    this.buffers = [
      this.sourceValues,
      this.sourceValidity,
      this.thresholdValues,
      this.thresholdMask,
      this.morphologyMask,
      this.morphologyValidity,
      this.componentLabels,
      this.componentValidity,
      this.convergence,
      this.iterationCount,
      this.regionVoxelCounts,
      this.regionMinimumCoordinates,
      this.regionMaximumCoordinates,
      this.regionOverflow
    ];

    const graph = new GPUCommandGraph(device, {id: 'lucim-volume-lab-analysis'});
    const sourceValues = importView(
      graph,
      'source-values',
      this.sourceValues,
      'float32',
      voxelCount
    );
    const sourceValidity = importView(
      graph,
      'source-validity',
      this.sourceValidity,
      'uint32',
      voxelCount
    );
    const thresholdValues = importView(
      graph,
      'threshold-values',
      this.thresholdValues,
      'float32',
      1
    );
    const thresholdMask = importView(
      graph,
      'threshold-mask',
      this.thresholdMask,
      'uint32',
      voxelCount
    );
    const morphologyMask = importView(
      graph,
      'morphology-mask',
      this.morphologyMask,
      'uint32',
      voxelCount
    );
    const morphologyValidity = importView(
      graph,
      'morphology-validity',
      this.morphologyValidity,
      'uint32',
      voxelCount
    );
    const componentLabels = importView(
      graph,
      'component-labels',
      this.componentLabels,
      'uint32',
      voxelCount
    );
    const componentValidity = importView(
      graph,
      'component-validity',
      this.componentValidity,
      'uint32',
      voxelCount
    );

    this.volume = new GPUVolume({
      id: 'synthetic-ct-phantom',
      metadata: dataset.metadata,
      channels: [
        {
          id: 'density',
          format: 'float32',
          values: sourceValues,
          validity: sourceValidity
        }
      ]
    });
    const dimensions = dataset.metadata;
    new GPUVolumeThreshold({
      id: 'lucim-volume-lab-threshold',
      ...dimensions,
      input: this.volume.getChannel('density'),
      output: thresholdMask,
      threshold: thresholdValues,
      operation: 'above'
    }).addToGraph(graph);
    new GPUVolumeClosing({
      id: 'lucim-volume-lab-closing',
      mode: 'binary',
      ...dimensions,
      radius: 1,
      structuringElement: 'ball',
      borderMode: 'constant',
      borderValue: 0,
      noDataPolicy: 'ignore',
      input: {
        id: 'threshold-mask',
        format: 'uint32',
        values: thresholdMask,
        validity: sourceValidity
      },
      output: morphologyMask,
      outputValidity: morphologyValidity
    }).addToGraph(graph);
    new GPUVolumeConnectedComponents({
      id: 'lucim-volume-lab-components',
      ...dimensions,
      input: {
        id: 'closed-mask',
        format: 'uint32',
        values: morphologyMask,
        validity: morphologyValidity
      },
      output: componentLabels,
      outputValidity: componentValidity,
      converged: importView(graph, 'convergence', this.convergence, 'uint32', 1),
      iterationCount: importView(graph, 'iteration-count', this.iterationCount, 'uint32', 1),
      connectivity: 6,
      maximumIterations: this.maximumComponentIterations
    }).addToGraph(graph);
    new GPUVolumeRegionMeasurements({
      id: 'lucim-volume-lab-measurements',
      ...dimensions,
      labels: componentLabels,
      labelValidity: componentValidity,
      output: {
        voxelCounts: importView(
          graph,
          'region-voxel-counts',
          this.regionVoxelCounts,
          'uint32',
          voxelCount
        ),
        minimumCoordinates: importView(
          graph,
          'region-minimum-coordinates',
          this.regionMinimumCoordinates,
          'uint32x3',
          voxelCount
        ),
        maximumCoordinates: importView(
          graph,
          'region-maximum-coordinates',
          this.regionMaximumCoordinates,
          'uint32x3',
          voxelCount
        )
      },
      overflow: importView(graph, 'region-overflow', this.regionOverflow, 'uint32', 1)
    }).addToGraph(graph);

    this.compiled = graph.compile();
    this.nodeCount = this.compiled.stats.nodeOrder.length;
    this.residentByteLength =
      this.buffers.reduce((byteLength, buffer) => byteLength + buffer.byteLength, 0) +
      this.compiled.stats.physicalTransientResourceBytes;
  }

  setThreshold(threshold: number): void {
    if (!Number.isFinite(threshold)) return;
    const nextThreshold = Math.max(-900, Math.min(1200, threshold));
    if (nextThreshold === this.threshold) return;
    this.threshold = nextThreshold;
    this.version++;
    this.thresholdValues.write(new Float32Array([nextThreshold]));
    this.analysisPending = true;
  }

  /** Records a changed analysis exactly once and returns its synchronous encoding metadata. */
  encodeIfNeeded(commandEncoder: CommandEncoder): GPUCommandGraphEncoding | null {
    if (this.destroyed || !this.analysisPending) return null;
    this.analysisPending = false;
    return this.compiled.encode(commandEncoder, {parameters: undefined});
  }

  /** Reads only three scalar status fields; source values, masks, labels, and regions stay resident. */
  async readStatus(version = this.version): Promise<VolumeLabAnalysisStatus> {
    const [convergenceBytes, iterationBytes, overflowBytes] = await Promise.all([
      this.convergence.readAsync(),
      this.iterationCount.readAsync(),
      this.regionOverflow.readAsync()
    ]);
    return {
      version,
      converged: new Uint32Array(convergenceBytes.buffer, convergenceBytes.byteOffset, 1)[0] === 1,
      iterationCount: new Uint32Array(iterationBytes.buffer, iterationBytes.byteOffset, 1)[0]!,
      regionOverflow: new Uint32Array(overflowBytes.buffer, overflowBytes.byteOffset, 1)[0] !== 0
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.compiled.destroy();
    for (const buffer of [...this.buffers].reverse()) buffer.destroy();
  }
}

function makeOutputBuffer(device: Device, id: string, byteLength: number, usage: number): Buffer {
  return device.createBuffer({id, byteLength: Math.max(byteLength, 4), usage});
}

function importView<Format extends VertexFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}
