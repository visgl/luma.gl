// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CanvasContext, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '@luma.gl/experimental';
import {
  GPURasterContrast,
  GPURasterHistogram,
  GPURasterNDVI,
  GPURasterOtsuThreshold,
  GPURasterStatistics,
  GPURasterThreshold,
  type GPURasterBufferBand
} from '@luma.gl/experimental/luraster';
import {RASTER_LAB_NO_DATA_VALUE, type RasterLabDataset} from './raster-data';
import {
  RasterLabRenderer,
  type RasterLabDisplaySettings,
  type RasterLabViewport
} from './raster-renderer';

const HISTOGRAM_BIN_COUNT = 48;
const DOMAIN_BYTE_LENGTH = Float32Array.BYTES_PER_ELEMENT * 2;
const HISTOGRAM_BYTE_LENGTH = HISTOGRAM_BIN_COUNT * Uint32Array.BYTES_PER_ELEMENT;
const COUNT_BYTE_OFFSET = DOMAIN_BYTE_LENGTH + HISTOGRAM_BYTE_LENGTH;
const SUM_BYTE_OFFSET = COUNT_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;
const MEAN_BYTE_OFFSET = SUM_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT;
const THRESHOLD_BYTE_OFFSET = MEAN_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT;
const SUMMARY_BYTE_LENGTH = THRESHOLD_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT;

/** Compact post-submit aggregate data; source reflectance and NDVI pixels are never downloaded. */
export type RasterLabSummary = {
  bins: Uint32Array;
  domain: readonly [number, number];
  validPixelCount: number;
  sum: number;
  mean: number;
  mode: RasterLabDisplaySettings['mode'];
  contrast: number;
  gamma: number;
  threshold: number;
  thresholdEnabled: boolean;
  automaticThreshold: boolean;
  nodeCount: number;
  residentByteLength: number;
  executionCount: number;
  elapsedMilliseconds: number;
};

type RasterLabBuffers = {
  red: Buffer;
  nearInfrared: Buffer;
  sourceValidity: Buffer;
  vegetationIndex: Buffer;
  outputValidity: Buffer;
  analyzedValues: Buffer;
  analyzedValidity: Buffer;
  thresholdValidity: Buffer;
  automaticThreshold: Buffer;
  baselineHistogram: Buffer;
  baselineDomain: Buffer;
  validCount: Buffer;
  sum: Buffer;
  mean: Buffer;
  histogram: Buffer;
  domain: Buffer;
  summaryReadback: Buffer;
};

/** Runs NDVI, validity-aware extent, and histogram as one explicitly submitted GPU command graph. */
export class RasterLabEngine {
  readonly device: Device;
  readonly dataset: RasterLabDataset;

  private readonly buffers: RasterLabBuffers;
  private readonly renderer: RasterLabRenderer;
  private compiledGraph: CompiledGPUCommandGraph;
  private settings: RasterLabDisplaySettings = {
    mode: 'ndvi',
    contrast: 1.15,
    gamma: 1,
    threshold: 0.35,
    thresholdEnabled: false,
    automaticThreshold: false
  };
  private epsilon = 0.0001;
  private executionCount = 0;
  private destroyed = false;

  constructor(device: Device, dataset: RasterLabDataset) {
    this.device = device;
    this.dataset = dataset;
    const sourceUsage = Buffer.STORAGE | Buffer.COPY_DST;
    const outputUsage = Buffer.STORAGE | Buffer.COPY_SRC;
    this.buffers = {
      red: device.createBuffer({id: 'raster-lab-red', data: dataset.red, usage: sourceUsage}),
      nearInfrared: device.createBuffer({
        id: 'raster-lab-near-infrared',
        data: dataset.nearInfrared,
        usage: sourceUsage
      }),
      sourceValidity: device.createBuffer({
        id: 'raster-lab-source-validity',
        data: dataset.validity,
        usage: sourceUsage
      }),
      vegetationIndex: device.createBuffer({
        id: 'raster-lab-vegetation-index',
        byteLength: dataset.pixelCount * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      outputValidity: device.createBuffer({
        id: 'raster-lab-output-validity',
        byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      analyzedValues: device.createBuffer({
        id: 'raster-lab-analyzed-values',
        byteLength: dataset.pixelCount * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      analyzedValidity: device.createBuffer({
        id: 'raster-lab-analyzed-validity',
        byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      thresholdValidity: device.createBuffer({
        id: 'raster-lab-threshold-validity',
        byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      automaticThreshold: device.createBuffer({
        id: 'raster-lab-automatic-threshold',
        byteLength: Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      baselineHistogram: device.createBuffer({
        id: 'raster-lab-baseline-histogram',
        byteLength: HISTOGRAM_BYTE_LENGTH,
        usage: outputUsage
      }),
      baselineDomain: device.createBuffer({
        id: 'raster-lab-baseline-domain',
        byteLength: DOMAIN_BYTE_LENGTH,
        usage: outputUsage
      }),
      validCount: device.createBuffer({
        id: 'raster-lab-valid-count',
        byteLength: Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      sum: device.createBuffer({
        id: 'raster-lab-valid-sum',
        byteLength: Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      mean: device.createBuffer({
        id: 'raster-lab-valid-mean',
        byteLength: Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      histogram: device.createBuffer({
        id: 'raster-lab-histogram',
        byteLength: HISTOGRAM_BYTE_LENGTH,
        usage: outputUsage
      }),
      domain: device.createBuffer({
        id: 'raster-lab-valid-domain',
        byteLength: DOMAIN_BYTE_LENGTH,
        usage: outputUsage
      }),
      summaryReadback: device.createBuffer({
        id: 'raster-lab-summary-readback',
        byteLength: SUMMARY_BYTE_LENGTH,
        usage: Buffer.MAP_READ | Buffer.COPY_DST
      })
    };

    let initializedGraph: CompiledGPUCommandGraph | undefined;
    let initializedRenderer: RasterLabRenderer | undefined;
    try {
      initializedGraph = this.createCompiledGraph();
      initializedRenderer = new RasterLabRenderer(device, {
        width: dataset.width,
        height: dataset.height,
        red: this.buffers.red,
        nearInfrared: this.buffers.nearInfrared,
        vegetationIndex: this.buffers.vegetationIndex,
        analyzedValues: this.buffers.analyzedValues,
        validity: this.buffers.outputValidity,
        thresholdValidity: this.buffers.thresholdValidity
      });
      this.compiledGraph = initializedGraph;
      this.renderer = initializedRenderer;
    } catch (error) {
      initializedRenderer?.destroy();
      initializedGraph?.destroy();
      for (const buffer of Object.values(this.buffers)) buffer.destroy();
      throw error;
    }
  }

  get nodeCount(): number {
    return this.compiledGraph.stats.nodeOrder.length;
  }

  /** Reconfigures specialized graph passes without reallocating resident raster buffers. */
  configure(settings: RasterLabDisplaySettings, epsilon: number): boolean {
    if (
      settings.mode === this.settings.mode &&
      Math.abs(settings.contrast - this.settings.contrast) < 0.0000001 &&
      Math.abs(settings.gamma - this.settings.gamma) < 0.0000001 &&
      Math.abs(settings.threshold - this.settings.threshold) < 0.0000001 &&
      settings.thresholdEnabled === this.settings.thresholdEnabled &&
      settings.automaticThreshold === this.settings.automaticThreshold &&
      Math.abs(epsilon - this.epsilon) < 0.0000001
    ) {
      return false;
    }

    const previousGraph = this.compiledGraph;
    const previousSettings = this.settings;
    const previousEpsilon = this.epsilon;
    this.settings = {...settings};
    this.epsilon = epsilon;
    try {
      this.compiledGraph = this.createCompiledGraph();
      previousGraph.destroy();
      return true;
    } catch (error) {
      this.settings = previousSettings;
      this.epsilon = previousEpsilon;
      throw error;
    }
  }

  /** Encodes every dependent compute pass before copying only bins and extent for presentation. */
  async update(): Promise<RasterLabSummary> {
    const startedAt = performance.now();
    const encoder = this.device.createCommandEncoder({
      id: `raster-lab-analysis-${this.executionCount}`
    });
    this.compiledGraph.encode(encoder, {parameters: undefined});
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.domain,
      destinationBuffer: this.buffers.summaryReadback,
      size: DOMAIN_BYTE_LENGTH
    });
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.histogram,
      destinationBuffer: this.buffers.summaryReadback,
      destinationOffset: DOMAIN_BYTE_LENGTH,
      size: this.buffers.histogram.byteLength
    });
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.validCount,
      destinationBuffer: this.buffers.summaryReadback,
      destinationOffset: COUNT_BYTE_OFFSET,
      size: Uint32Array.BYTES_PER_ELEMENT
    });
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.sum,
      destinationBuffer: this.buffers.summaryReadback,
      destinationOffset: SUM_BYTE_OFFSET,
      size: Float32Array.BYTES_PER_ELEMENT
    });
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.mean,
      destinationBuffer: this.buffers.summaryReadback,
      destinationOffset: MEAN_BYTE_OFFSET,
      size: Float32Array.BYTES_PER_ELEMENT
    });
    if (this.settings.automaticThreshold && this.settings.thresholdEnabled) {
      encoder.copyBufferToBuffer({
        sourceBuffer: this.buffers.automaticThreshold,
        destinationBuffer: this.buffers.summaryReadback,
        destinationOffset: THRESHOLD_BYTE_OFFSET,
        size: Float32Array.BYTES_PER_ELEMENT
      });
    }
    this.device.submit(encoder.finish());
    this.executionCount++;

    const summaryBytes = await this.buffers.summaryReadback.readAsync();
    const domain = new Float32Array(summaryBytes.buffer, summaryBytes.byteOffset, 2);
    const bins = new Uint32Array(
      summaryBytes.buffer,
      summaryBytes.byteOffset + DOMAIN_BYTE_LENGTH,
      HISTOGRAM_BIN_COUNT
    );
    const copiedBins = new Uint32Array(bins);
    const aggregateView = new DataView(
      summaryBytes.buffer,
      summaryBytes.byteOffset,
      SUMMARY_BYTE_LENGTH
    );
    const validPixelCount = aggregateView.getUint32(COUNT_BYTE_OFFSET, true);

    return {
      bins: copiedBins,
      domain: [domain[0], domain[1]],
      validPixelCount,
      sum: aggregateView.getFloat32(SUM_BYTE_OFFSET, true),
      mean: aggregateView.getFloat32(MEAN_BYTE_OFFSET, true),
      mode: this.settings.mode,
      contrast: this.settings.contrast,
      gamma: this.settings.gamma,
      threshold: this.settings.automaticThreshold
        ? aggregateView.getFloat32(THRESHOLD_BYTE_OFFSET, true)
        : this.settings.threshold,
      thresholdEnabled: this.settings.thresholdEnabled,
      automaticThreshold: this.settings.automaticThreshold,
      nodeCount: this.nodeCount,
      residentByteLength:
        this.compiledGraph.stats.importedBufferBytes +
        this.compiledGraph.stats.physicalTransientBytes +
        this.buffers.summaryReadback.byteLength,
      executionCount: this.executionCount,
      elapsedMilliseconds: performance.now() - startedAt
    };
  }

  render(
    canvasContext: CanvasContext,
    viewport: RasterLabViewport,
    settings: RasterLabDisplaySettings
  ): void {
    this.renderer.render(canvasContext, viewport, settings);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.renderer.destroy();
    this.compiledGraph.destroy();
    for (const buffer of Object.values(this.buffers)) buffer.destroy();
  }

  private createCompiledGraph(): CompiledGPUCommandGraph {
    const graph = new GPUCommandGraph(this.device, {id: 'raster-lab-analysis-graph'});
    const redValues = this.importView(
      graph,
      'red',
      this.buffers.red,
      'float32',
      this.dataset.pixelCount
    );
    const nearInfraredValues = this.importView(
      graph,
      'near-infrared',
      this.buffers.nearInfrared,
      'float32',
      this.dataset.pixelCount
    );
    const sourceValidity = this.importView(
      graph,
      'source-validity',
      this.buffers.sourceValidity,
      'uint32',
      this.dataset.pixelCount
    );
    const vegetationIndex = this.importView(
      graph,
      'vegetation-index',
      this.buffers.vegetationIndex,
      'float32',
      this.dataset.pixelCount
    );
    const outputValidity = this.importView(
      graph,
      'output-validity',
      this.buffers.outputValidity,
      'uint32',
      this.dataset.pixelCount
    );
    const analyzedValues = this.importView(
      graph,
      'analyzed-values',
      this.buffers.analyzedValues,
      'float32',
      this.dataset.pixelCount
    );
    const analyzedValidity = this.importView(
      graph,
      'analyzed-validity',
      this.buffers.analyzedValidity,
      'uint32',
      this.dataset.pixelCount
    );
    const thresholdValidity = this.importView(
      graph,
      'threshold-validity',
      this.buffers.thresholdValidity,
      'uint32',
      this.dataset.pixelCount
    );
    const automaticThreshold = this.importView(
      graph,
      'automatic-threshold',
      this.buffers.automaticThreshold,
      'float32',
      1
    );
    const baselineHistogram = this.importView(
      graph,
      'baseline-histogram',
      this.buffers.baselineHistogram,
      'uint32',
      HISTOGRAM_BIN_COUNT
    );
    const baselineDomain = this.importView(
      graph,
      'baseline-domain',
      this.buffers.baselineDomain,
      'float32',
      2
    );
    const validCount = this.importView(graph, 'valid-count', this.buffers.validCount, 'uint32', 1);
    const sum = this.importView(graph, 'sum', this.buffers.sum, 'float32', 1);
    const mean = this.importView(graph, 'mean', this.buffers.mean, 'float32', 1);
    const histogram = this.importView(
      graph,
      'histogram',
      this.buffers.histogram,
      'uint32',
      HISTOGRAM_BIN_COUNT
    );
    const domain = this.importView(graph, 'domain', this.buffers.domain, 'float32', 2);

    const red: GPURasterBufferBand<'float32'> = {
      id: 'red-reflectance',
      format: 'float32',
      storage: {kind: 'buffer', values: redValues},
      validity: sourceValidity,
      noDataValue: RASTER_LAB_NO_DATA_VALUE
    };
    const nearInfrared: GPURasterBufferBand<'float32'> = {
      id: 'near-infrared-reflectance',
      format: 'float32',
      storage: {kind: 'buffer', values: nearInfraredValues},
      validity: sourceValidity,
      noDataValue: RASTER_LAB_NO_DATA_VALUE
    };

    new GPURasterNDVI({
      id: 'raster-lab-ndvi',
      width: this.dataset.width,
      height: this.dataset.height,
      nearInfrared,
      red,
      output: vegetationIndex,
      outputValidity,
      epsilon: this.epsilon
    }).addToGraph(graph);

    const selectedValues =
      this.settings.mode === 'ndvi'
        ? vegetationIndex
        : this.settings.mode === 'red'
          ? redValues
          : nearInfraredValues;

    new GPURasterContrast({
      id: 'raster-lab-contrast',
      width: this.dataset.width,
      height: this.dataset.height,
      input: {
        id: `${this.settings.mode}-source`,
        format: 'float32',
        storage: {kind: 'buffer', values: selectedValues},
        validity: outputValidity,
        ...(this.settings.mode === 'ndvi' ? {} : {noDataValue: RASTER_LAB_NO_DATA_VALUE})
      },
      output: analyzedValues,
      outputValidity: analyzedValidity,
      domain: this.settings.mode === 'ndvi' ? [-1, 1] : [0, 1],
      contrast: this.settings.contrast,
      gamma: this.settings.gamma,
      mode: this.settings.gamma === 1 ? 'linear' : 'gamma'
    }).addToGraph(graph);

    const analyzedBand: GPURasterBufferBand<'float32'> = {
      id: `${this.settings.mode}-contrast-adjusted`,
      format: 'float32',
      storage: {kind: 'buffer', values: analyzedValues},
      validity: analyzedValidity
    };

    if (this.settings.thresholdEnabled) {
      if (this.settings.automaticThreshold) {
        new GPURasterHistogram({
          id: 'raster-lab-baseline-histogram',
          input: analyzedBand,
          output: baselineHistogram,
          domainOutput: baselineDomain
        }).addToGraph(graph);

        new GPURasterOtsuThreshold({
          id: 'raster-lab-otsu-threshold',
          histogram: baselineHistogram,
          domain: baselineDomain,
          output: automaticThreshold
        }).addToGraph(graph);
      }

      new GPURasterThreshold({
        id: 'raster-lab-threshold',
        width: this.dataset.width,
        height: this.dataset.height,
        input: analyzedBand,
        output: thresholdValidity,
        threshold: this.settings.automaticThreshold ? automaticThreshold : this.settings.threshold,
        operation: 'above',
        inclusive: true
      }).addToGraph(graph);
    }

    const selectedBand: GPURasterBufferBand<'float32'> = {
      ...analyzedBand,
      validity: this.settings.thresholdEnabled ? thresholdValidity : analyzedValidity
    };

    new GPURasterStatistics({
      id: 'raster-lab-valid-statistics',
      width: this.dataset.width,
      height: this.dataset.height,
      input: selectedBand,
      count: validCount,
      sum,
      mean,
      extent: domain
    }).addToGraph(graph);

    new GPURasterHistogram({
      id: 'raster-lab-valid-histogram',
      input: selectedBand,
      output: histogram,
      domain
    }).addToGraph(graph);

    return graph.compile();
  }

  private importView<Format extends 'float32' | 'uint32'>(
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
}
