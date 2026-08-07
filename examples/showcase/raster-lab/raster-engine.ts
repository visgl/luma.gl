// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CanvasContext, type Device} from '@luma.gl/core';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GraphDataView
} from '@luma.gl/experimental';
import {
  GPURasterBoxBlur,
  GPURasterClosing,
  GPURasterContrast,
  GPURasterContours,
  GPURasterDilation,
  GPURasterErosion,
  GPURasterGaussianBlur,
  GPURasterGradientMagnitude,
  GPURasterHistogram,
  GPURasterLaplacian,
  GPURasterNDVI,
  GPURasterOtsuThreshold,
  GPURasterOpening,
  GPURasterScharr,
  GPURasterSobel,
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
const CONTOUR_COUNT_BYTE_OFFSET = THRESHOLD_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT;
const CONTOUR_OVERFLOW_BYTE_OFFSET = CONTOUR_COUNT_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;
const CONTOUR_REQUIRED_BYTE_OFFSET = CONTOUR_OVERFLOW_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;
const SUMMARY_BYTE_LENGTH = CONTOUR_REQUIRED_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;

/** Compact post-submit aggregate data; source reflectance and NDVI pixels are never downloaded. */
export type RasterLabSummary = {
  bins: Uint32Array;
  domain: readonly [number, number];
  validPixelCount: number;
  sum: number;
  mean: number;
  mode: RasterLabDisplaySettings['mode'];
  smoothingMode: RasterLabDisplaySettings['smoothingMode'];
  smoothingRadius: number;
  smoothingSigma: number;
  edgeMode: RasterLabDisplaySettings['edgeMode'];
  edgeDirection: RasterLabDisplaySettings['edgeDirection'];
  morphologyOperation: RasterLabDisplaySettings['morphologyOperation'];
  morphologyMode: RasterLabDisplaySettings['morphologyMode'];
  morphologyShape: RasterLabDisplaySettings['morphologyShape'];
  morphologyRadius: number;
  morphologyNoDataPolicy: RasterLabDisplaySettings['morphologyNoDataPolicy'];
  morphologyBorderMode: RasterLabDisplaySettings['morphologyBorderMode'];
  morphologyBorderValue: number;
  contrast: number;
  gamma: number;
  threshold: number;
  thresholdEnabled: boolean;
  automaticThreshold: boolean;
  contoursEnabled: boolean;
  contourLevel: number;
  contourSegmentCount: number;
  contourOverflow: boolean;
  contourRequiredSegmentCount: number;
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
  smoothedValues: Buffer;
  smoothedValidity: Buffer;
  edgeValues: Buffer;
  edgeValidity: Buffer;
  morphologyValues: Buffer;
  grayscaleMorphologyValidity: Buffer;
  analyzedValues: Buffer;
  analyzedValidity: Buffer;
  thresholdSeed: Buffer;
  thresholdValidity: Buffer;
  binaryMorphologyValidity: Buffer;
  automaticThreshold: Buffer;
  baselineHistogram: Buffer;
  baselineDomain: Buffer;
  validCount: Buffer;
  sum: Buffer;
  mean: Buffer;
  histogram: Buffer;
  domain: Buffer;
  contourVertices: Buffer;
  contourSegmentCount: Buffer;
  contourOverflow: Buffer;
  contourRequiredSegmentCount: Buffer;
  summaryReadback: Buffer;
};

/** Runs NDVI, validity-aware extent, and histogram as one explicitly submitted GPU command graph. */
export class RasterLabEngine {
  readonly device: Device;
  readonly dataset: RasterLabDataset;

  private readonly buffers: RasterLabBuffers;
  private readonly renderer: RasterLabRenderer;
  private readonly contourCommands: DrawCommandBuffer;
  private readonly contourSegmentCapacity: number;
  private compiledGraph: CompiledGPUCommandGraph;
  private settings: RasterLabDisplaySettings = {
    mode: 'ndvi',
    smoothingMode: 'none',
    smoothingRadius: 2,
    smoothingSigma: 1.25,
    edgeMode: 'none',
    edgeDirection: 'magnitude',
    morphologyOperation: 'none',
    morphologyMode: 'grayscale',
    morphologyShape: 'square',
    morphologyRadius: 2,
    morphologyNoDataPolicy: 'ignore',
    morphologyBorderMode: 'clamp',
    morphologyBorderValue: 0,
    contrast: 1.15,
    gamma: 1,
    threshold: 0.35,
    thresholdEnabled: false,
    automaticThreshold: false,
    contoursEnabled: true,
    contourLevel: 0.35
  };
  private epsilon = 0.0001;
  private executionCount = 0;
  private destroyed = false;

  constructor(device: Device, dataset: RasterLabDataset) {
    this.device = device;
    this.dataset = dataset;
    this.contourSegmentCapacity = Math.max((dataset.width - 1) * (dataset.height - 1) * 2, 1);
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
      smoothedValues: device.createBuffer({
        id: 'raster-lab-smoothed-values',
        byteLength: dataset.pixelCount * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      smoothedValidity: device.createBuffer({
        id: 'raster-lab-smoothed-validity',
        byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      edgeValues: device.createBuffer({
        id: 'raster-lab-edge-values',
        byteLength: dataset.pixelCount * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      edgeValidity: device.createBuffer({
        id: 'raster-lab-edge-validity',
        byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      morphologyValues: device.createBuffer({
        id: 'raster-lab-grayscale-morphology-values',
        byteLength: dataset.pixelCount * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      grayscaleMorphologyValidity: device.createBuffer({
        id: 'raster-lab-grayscale-morphology-validity',
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
      thresholdSeed: device.createBuffer({
        id: 'raster-lab-threshold-seed',
        byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      thresholdValidity: device.createBuffer({
        id: 'raster-lab-threshold-validity',
        byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      binaryMorphologyValidity: device.createBuffer({
        id: 'raster-lab-binary-morphology-validity',
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
      contourVertices: device.createBuffer({
        id: 'raster-lab-contour-vertices',
        byteLength: this.contourSegmentCapacity * 2 * Float32Array.BYTES_PER_ELEMENT * 2,
        usage: outputUsage
      }),
      contourSegmentCount: device.createBuffer({
        id: 'raster-lab-contour-segment-count',
        byteLength: Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      contourOverflow: device.createBuffer({
        id: 'raster-lab-contour-overflow',
        byteLength: Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      contourRequiredSegmentCount: device.createBuffer({
        id: 'raster-lab-required-contour-segments',
        byteLength: Uint32Array.BYTES_PER_ELEMENT,
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
    let initializedContourCommands: DrawCommandBuffer | undefined;
    try {
      initializedContourCommands = new DrawCommandBuffer(device, {
        id: 'raster-lab-contour-draw',
        type: 'draw',
        commands: [{vertexCount: 2, instanceCount: 0}]
      });
      this.contourCommands = initializedContourCommands;
      initializedGraph = this.createCompiledGraph();
      initializedRenderer = new RasterLabRenderer(device, {
        width: dataset.width,
        height: dataset.height,
        red: this.buffers.red,
        nearInfrared: this.buffers.nearInfrared,
        vegetationIndex: this.buffers.vegetationIndex,
        analyzedValues: this.buffers.analyzedValues,
        validity: this.buffers.analyzedValidity,
        thresholdValidity: this.buffers.thresholdValidity,
        morphologyValidity: this.buffers.binaryMorphologyValidity,
        contourVertices: this.buffers.contourVertices,
        contourCommands: initializedContourCommands
      });
      this.compiledGraph = initializedGraph;
      this.renderer = initializedRenderer;
    } catch (error) {
      initializedRenderer?.destroy();
      initializedGraph?.destroy();
      initializedContourCommands?.destroy();
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
      settings.smoothingMode === this.settings.smoothingMode &&
      settings.smoothingRadius === this.settings.smoothingRadius &&
      Math.abs(settings.smoothingSigma - this.settings.smoothingSigma) < 0.0000001 &&
      settings.edgeMode === this.settings.edgeMode &&
      settings.edgeDirection === this.settings.edgeDirection &&
      settings.morphologyOperation === this.settings.morphologyOperation &&
      settings.morphologyMode === this.settings.morphologyMode &&
      settings.morphologyShape === this.settings.morphologyShape &&
      settings.morphologyRadius === this.settings.morphologyRadius &&
      settings.morphologyNoDataPolicy === this.settings.morphologyNoDataPolicy &&
      settings.morphologyBorderMode === this.settings.morphologyBorderMode &&
      Math.abs(settings.morphologyBorderValue - this.settings.morphologyBorderValue) < 0.0000001 &&
      Math.abs(settings.contrast - this.settings.contrast) < 0.0000001 &&
      Math.abs(settings.gamma - this.settings.gamma) < 0.0000001 &&
      Math.abs(settings.threshold - this.settings.threshold) < 0.0000001 &&
      settings.thresholdEnabled === this.settings.thresholdEnabled &&
      settings.automaticThreshold === this.settings.automaticThreshold &&
      settings.contoursEnabled === this.settings.contoursEnabled &&
      Math.abs(settings.contourLevel - this.settings.contourLevel) < 0.0000001 &&
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
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.contourSegmentCount,
      destinationBuffer: this.buffers.summaryReadback,
      destinationOffset: CONTOUR_COUNT_BYTE_OFFSET,
      size: Uint32Array.BYTES_PER_ELEMENT
    });
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.contourOverflow,
      destinationBuffer: this.buffers.summaryReadback,
      destinationOffset: CONTOUR_OVERFLOW_BYTE_OFFSET,
      size: Uint32Array.BYTES_PER_ELEMENT
    });
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.contourRequiredSegmentCount,
      destinationBuffer: this.buffers.summaryReadback,
      destinationOffset: CONTOUR_REQUIRED_BYTE_OFFSET,
      size: Uint32Array.BYTES_PER_ELEMENT
    });
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
      smoothingMode: this.settings.smoothingMode,
      smoothingRadius: this.settings.smoothingRadius,
      smoothingSigma: this.settings.smoothingSigma,
      edgeMode: this.settings.edgeMode,
      edgeDirection: this.settings.edgeDirection,
      morphologyOperation: this.settings.morphologyOperation,
      morphologyMode: this.settings.morphologyMode,
      morphologyShape: this.settings.morphologyShape,
      morphologyRadius: this.settings.morphologyRadius,
      morphologyNoDataPolicy: this.settings.morphologyNoDataPolicy,
      morphologyBorderMode: this.settings.morphologyBorderMode,
      morphologyBorderValue: this.settings.morphologyBorderValue,
      contrast: this.settings.contrast,
      gamma: this.settings.gamma,
      threshold: this.settings.automaticThreshold
        ? aggregateView.getFloat32(THRESHOLD_BYTE_OFFSET, true)
        : this.settings.threshold,
      thresholdEnabled: this.settings.thresholdEnabled,
      automaticThreshold: this.settings.automaticThreshold,
      contoursEnabled: this.settings.contoursEnabled,
      contourLevel:
        this.settings.morphologyOperation !== 'none' && this.settings.morphologyMode === 'binary'
          ? 0.5
          : this.settings.contourLevel,
      contourSegmentCount: this.settings.contoursEnabled
        ? aggregateView.getUint32(CONTOUR_COUNT_BYTE_OFFSET, true)
        : 0,
      contourOverflow:
        this.settings.contoursEnabled &&
        aggregateView.getUint32(CONTOUR_OVERFLOW_BYTE_OFFSET, true) !== 0,
      contourRequiredSegmentCount: this.settings.contoursEnabled
        ? aggregateView.getUint32(CONTOUR_REQUIRED_BYTE_OFFSET, true)
        : 0,
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
    this.contourCommands.destroy();
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
    const smoothedValues = this.importView(
      graph,
      'smoothed-values',
      this.buffers.smoothedValues,
      'float32',
      this.dataset.pixelCount
    );
    const smoothedValidity = this.importView(
      graph,
      'smoothed-validity',
      this.buffers.smoothedValidity,
      'uint32',
      this.dataset.pixelCount
    );
    const edgeValues = this.importView(
      graph,
      'edge-values',
      this.buffers.edgeValues,
      'float32',
      this.dataset.pixelCount
    );
    const edgeValidity = this.importView(
      graph,
      'edge-validity',
      this.buffers.edgeValidity,
      'uint32',
      this.dataset.pixelCount
    );
    const morphologyValues = this.importView(
      graph,
      'grayscale-morphology-values',
      this.buffers.morphologyValues,
      'float32',
      this.dataset.pixelCount
    );
    const grayscaleMorphologyValidity = this.importView(
      graph,
      'grayscale-morphology-validity',
      this.buffers.grayscaleMorphologyValidity,
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
    const thresholdSeed = this.importView(
      graph,
      'threshold-seed',
      this.buffers.thresholdSeed,
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
    const binaryMorphologyValidity = this.importView(
      graph,
      'binary-morphology-validity',
      this.buffers.binaryMorphologyValidity,
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
    const contourVertexHandle = graph.importBuffer(
      {
        id: 'contour-vertices',
        byteLength: this.buffers.contourVertices.byteLength,
        usage: this.buffers.contourVertices.usage
      },
      this.buffers.contourVertices
    );
    const contourVertices = graph.createDataView(contourVertexHandle, {
      format: 'float32x2',
      length: this.contourSegmentCapacity * 2
    });
    const contourSegmentCount = this.importView(
      graph,
      'contour-segment-count',
      this.buffers.contourSegmentCount,
      'uint32',
      1
    );
    const contourOverflow = this.importView(
      graph,
      'contour-overflow',
      this.buffers.contourOverflow,
      'uint32',
      1
    );
    const contourRequiredSegmentCount = this.importView(
      graph,
      'contour-required-segment-count',
      this.buffers.contourRequiredSegmentCount,
      'uint32',
      1
    );

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

    const sourceBand: GPURasterBufferBand<'float32'> = {
      id: `${this.settings.mode}-source`,
      format: 'float32',
      storage: {kind: 'buffer', values: selectedValues},
      validity: outputValidity,
      ...(this.settings.mode === 'ndvi' ? {} : {noDataValue: RASTER_LAB_NO_DATA_VALUE})
    };

    if (this.settings.smoothingMode !== 'none') {
      const smoothingProps = {
        id: `raster-lab-${this.settings.smoothingMode}-blur`,
        width: this.dataset.width,
        height: this.dataset.height,
        input: sourceBand,
        output: smoothedValues,
        outputValidity: smoothedValidity,
        radius: this.settings.smoothingRadius,
        borderMode: 'reflect' as const,
        noDataPolicy: 'ignore-renormalize' as const
      };
      const smoothing =
        this.settings.smoothingMode === 'gaussian'
          ? new GPURasterGaussianBlur({...smoothingProps, sigma: this.settings.smoothingSigma})
          : new GPURasterBoxBlur(smoothingProps);
      smoothing.addToGraph(graph);
    }

    const filteredBand: GPURasterBufferBand<'float32'> =
      this.settings.smoothingMode === 'none'
        ? sourceBand
        : {
            id: `${this.settings.mode}-${this.settings.smoothingMode}-smoothed`,
            format: 'float32',
            storage: {kind: 'buffer', values: smoothedValues},
            validity: smoothedValidity
          };

    if (this.settings.edgeMode !== 'none') {
      const edgeProps = {
        id: `raster-lab-${this.settings.edgeMode}-${this.settings.edgeDirection}`,
        width: this.dataset.width,
        height: this.dataset.height,
        input: filteredBand,
        output: edgeValues,
        outputValidity: edgeValidity,
        borderMode: 'reflect' as const,
        scale: this.settings.edgeMode === 'scharr' ? 0.25 : 1
      };

      if (this.settings.edgeMode === 'laplacian') {
        new GPURasterLaplacian({...edgeProps, connectivity: 4}).addToGraph(graph);
      } else if (this.settings.edgeDirection === 'magnitude') {
        new GPURasterGradientMagnitude({
          ...edgeProps,
          operator: this.settings.edgeMode
        }).addToGraph(graph);
      } else if (this.settings.edgeMode === 'sobel') {
        new GPURasterSobel({...edgeProps, direction: this.settings.edgeDirection}).addToGraph(
          graph
        );
      } else {
        new GPURasterScharr({...edgeProps, direction: this.settings.edgeDirection}).addToGraph(
          graph
        );
      }
    }

    const derivativeBand: GPURasterBufferBand<'float32'> =
      this.settings.edgeMode === 'none'
        ? filteredBand
        : {
            id: `${this.settings.mode}-${this.settings.edgeMode}-edges`,
            format: 'float32',
            storage: {kind: 'buffer', values: edgeValues},
            validity: edgeValidity
          };
    const morphologyClass =
      this.settings.morphologyOperation === 'dilate'
        ? GPURasterDilation
        : this.settings.morphologyOperation === 'erode'
          ? GPURasterErosion
          : this.settings.morphologyOperation === 'open'
            ? GPURasterOpening
            : GPURasterClosing;
    const morphologyProps = {
      id: `raster-lab-${this.settings.morphologyMode}-${this.settings.morphologyOperation}`,
      width: this.dataset.width,
      height: this.dataset.height,
      radius: this.settings.morphologyRadius,
      structuringElement: this.settings.morphologyShape,
      borderMode: this.settings.morphologyBorderMode,
      borderValue: this.settings.morphologyBorderValue,
      noDataPolicy: this.settings.morphologyNoDataPolicy
    };
    const grayscaleMorphologyEnabled =
      this.settings.morphologyOperation !== 'none' && this.settings.morphologyMode === 'grayscale';
    const binaryMorphologyEnabled =
      this.settings.morphologyOperation !== 'none' && this.settings.morphologyMode === 'binary';

    if (grayscaleMorphologyEnabled) {
      new morphologyClass({
        ...morphologyProps,
        mode: 'grayscale',
        input: derivativeBand,
        output: morphologyValues,
        outputValidity: grayscaleMorphologyValidity
      }).addToGraph(graph);
    }

    const morphologyBand: GPURasterBufferBand<'float32'> = grayscaleMorphologyEnabled
      ? {
          id: `${this.settings.mode}-${this.settings.morphologyOperation}-morphology`,
          format: 'float32',
          storage: {kind: 'buffer', values: morphologyValues},
          validity: grayscaleMorphologyValidity
        }
      : derivativeBand;

    new GPURasterContrast({
      id: 'raster-lab-contrast',
      width: this.dataset.width,
      height: this.dataset.height,
      input: morphologyBand,
      output: analyzedValues,
      outputValidity: analyzedValidity,
      domain:
        this.settings.edgeMode === 'none'
          ? this.settings.mode === 'ndvi'
            ? [-1, 1]
            : [0, 1]
          : this.settings.edgeMode !== 'laplacian' && this.settings.edgeDirection === 'magnitude'
            ? [0, 1]
            : [-1, 1],
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

    if (this.settings.thresholdEnabled || binaryMorphologyEnabled) {
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
        output: binaryMorphologyEnabled ? thresholdSeed : thresholdValidity,
        threshold: this.settings.automaticThreshold ? automaticThreshold : this.settings.threshold,
        operation: 'above',
        inclusive: true
      }).addToGraph(graph);
    }

    if (binaryMorphologyEnabled) {
      const binarySeed: GPURasterBufferBand<'uint32'> = {
        id: 'raster-lab-binary-threshold-seed',
        format: 'uint32',
        storage: {kind: 'buffer', values: thresholdSeed},
        validity: analyzedValidity
      };
      new morphologyClass({
        ...morphologyProps,
        mode: 'binary',
        input: binarySeed,
        output: thresholdValidity,
        outputValidity: binaryMorphologyValidity
      }).addToGraph(graph);
    }

    if (this.settings.contoursEnabled) {
      const contourDraw = this.contourCommands.importToGraph(graph);
      const contourBand: GPURasterBufferBand = binaryMorphologyEnabled
        ? {
            id: 'raster-lab-binary-morphology-mask',
            format: 'uint32',
            storage: {kind: 'buffer', values: thresholdValidity},
            validity: binaryMorphologyValidity
          }
        : analyzedBand;
      new GPURasterContours({
        id: 'raster-lab-contours',
        width: this.dataset.width,
        height: this.dataset.height,
        input: contourBand,
        level: binaryMorphologyEnabled ? 0.5 : this.settings.contourLevel,
        vertices: contourVertices,
        segmentCount: contourSegmentCount,
        overflow: contourOverflow,
        requiredSegmentCount: contourRequiredSegmentCount,
        draw: contourDraw
      }).addToGraph(graph);
    }

    const selectedBand: GPURasterBufferBand<'float32'> = {
      ...analyzedBand,
      validity:
        this.settings.thresholdEnabled || binaryMorphologyEnabled
          ? thresholdValidity
          : analyzedValidity
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
