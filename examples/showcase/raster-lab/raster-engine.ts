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
  GPURasterBandMath,
  GPURasterBoxBlur,
  GPURasterCategoricalOverview,
  GPURasterClosing,
  GPURasterConnectedComponents,
  GPURasterContrast,
  GPURasterContours,
  GPURasterDenseComponents,
  GPURasterDilation,
  GPURasterErosion,
  GPURasterGaussianBlur,
  GPURasterGlobalHistogramMerge,
  GPURasterGlobalInitialize,
  GPURasterGlobalPercentile,
  GPURasterGlobalStatisticsMerge,
  GPURasterGradientMagnitude,
  GPURasterHistogram,
  GPURasterLaplacian,
  GPURasterNDVI,
  GPURasterOtsuThreshold,
  GPURasterOverview,
  GPURasterOpening,
  GPURasterRegionMeasurements,
  GPURasterScharr,
  GPURasterSobel,
  GPURasterStatistics,
  GPURasterThreshold,
  GPURasterTileCoreExtract,
  GPURasterTileHaloFill,
  getRasterRegionWorldCentroid,
  type GPURasterBufferBand,
  type GPURasterGlobalAccumulator,
  type GPURasterMetadata,
  type GPURasterOverviewCategoricalPolicy,
  type GPURasterPixelBounds,
  type GPURasterTileHaloPlan
} from '@luma.gl/experimental/luraster';
import {RASTER_LAB_NO_DATA_VALUE, type RasterLabDataset} from './raster-data';
import {
  RasterLabRenderer,
  type RasterLabDisplaySettings,
  type RasterLabViewport
} from './raster-renderer';

const HISTOGRAM_BIN_COUNT = 48;
const REGION_MEASUREMENT_SCALAR_COUNT = 8;
const REGION_HISTOGRAM_BIN_COUNT = HISTOGRAM_BIN_COUNT - REGION_MEASUREMENT_SCALAR_COUNT;
const REGION_RESULT_CAPACITY = 2048;
const DOMAIN_BYTE_LENGTH = Float32Array.BYTES_PER_ELEMENT * 2;
const HISTOGRAM_BYTE_LENGTH = HISTOGRAM_BIN_COUNT * Uint32Array.BYTES_PER_ELEMENT;
const REGION_MEASUREMENT_BYTE_OFFSET =
  DOMAIN_BYTE_LENGTH + REGION_HISTOGRAM_BIN_COUNT * Uint32Array.BYTES_PER_ELEMENT;
const COUNT_BYTE_OFFSET = DOMAIN_BYTE_LENGTH + HISTOGRAM_BYTE_LENGTH;
const SUM_BYTE_OFFSET = COUNT_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;
const MEAN_BYTE_OFFSET = SUM_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT;
const THRESHOLD_BYTE_OFFSET = MEAN_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT;
const CONTOUR_COUNT_BYTE_OFFSET = THRESHOLD_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT;
const CONTOUR_OVERFLOW_BYTE_OFFSET = CONTOUR_COUNT_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;
const CONTOUR_REQUIRED_BYTE_OFFSET = CONTOUR_OVERFLOW_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;
const SUMMARY_BYTE_LENGTH = CONTOUR_REQUIRED_BYTE_OFFSET + Uint32Array.BYTES_PER_ELEMENT;

/** One selected GPU-computed dense region; every other region record remains GPU-resident. */
export type RasterLabRegionMeasurement = {
  id: number;
  pixelCount: number;
  intensitySum: number;
  intensityMinimum: number;
  intensityMaximum: number;
  intensityMean: number;
  centroidColumn: number;
  centroidRow: number;
  worldCentroid: readonly [number, number];
  area: number;
  areaUnits: string;
};

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
  globalMedian: number | null;
  componentsEnabled: boolean;
  componentConnectivity: RasterLabDisplaySettings['componentConnectivity'];
  componentLabelMode: RasterLabDisplaySettings['componentLabelMode'];
  componentCapacity: number;
  componentCount: number;
  componentPublishedCount: number;
  componentOverflow: boolean;
  componentMaximumIterations: number;
  componentIterations: number;
  componentConverged: boolean;
  regionMetricsEnabled: boolean;
  regionMeasurement: RasterLabRegionMeasurement | null;
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
  componentLabels: Buffer;
  componentValidity: Buffer;
  regionPixelCounts: Buffer;
  regionIntensityCounts: Buffer;
  regionIntensitySums: Buffer;
  regionIntensityMinimums: Buffer;
  regionIntensityMaximums: Buffer;
  regionIntensityMeans: Buffer;
  regionColumnSums: Buffer;
  regionRowSums: Buffer;
  regionCentroidColumns: Buffer;
  regionCentroidRows: Buffer;
  regionAreas: Buffer;
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

/** Tile inputs are borrowed from bounded residency; analysis outputs remain engine-owned. */
export type RasterLabResidentSources = {
  red: Buffer;
  nearInfrared: Buffer;
  validity: Buffer;
};

/** Borrowed resident tiles cover a padded domain; the selected tile alone owns published pixels. */
export type RasterLabHaloSources = {
  plan: GPURasterTileHaloPlan;
  tiles: readonly {
    pixelBounds: GPURasterPixelBounds;
    sources: RasterLabResidentSources;
  }[];
};

/** Native cache-resident source reduced directly into owned, target-resolution GPU buffers. */
export type RasterLabGeneratedOverviewSources = {
  metadata: GPURasterMetadata;
  sources: RasterLabResidentSources;
  categoryPolicy: GPURasterOverviewCategoricalPolicy;
};

/** Two borrowed canonical source cores are replayed without stitching or CPU pixel transfers. */
export type RasterLabGlobalSources = {
  tiles: readonly {
    name: 'west' | 'east';
    width: number;
    height: number;
    sources: RasterLabResidentSources;
  }[];
  order: 'forward' | 'reverse';
  pixelCount: number;
};

type RasterLabGlobalBand = {
  name: 'west' | 'east';
  width: number;
  height: number;
  input: GPURasterBufferBand<'float32'>;
};

/** Runs NDVI, validity-aware extent, and histogram as one explicitly submitted GPU command graph. */
export class RasterLabEngine {
  readonly device: Device;
  dataset: RasterLabDataset;

  private readonly buffers: RasterLabBuffers;
  private readonly borrowedSources: boolean;
  private readonly renderer: RasterLabRenderer;
  private readonly contourCommands: DrawCommandBuffer;
  private readonly contourSegmentCapacity: number;
  private compiledGraph: CompiledGPUCommandGraph;
  private halo: RasterLabHaloSources | undefined;
  private overview: RasterLabGeneratedOverviewSources | undefined;
  private global: RasterLabGlobalSources | undefined;
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
    componentsEnabled: false,
    componentConnectivity: 4,
    componentLabelMode: 'sparse',
    componentCapacity: 1024,
    componentMaximumIterations: 24,
    regionMetricsEnabled: false,
    contoursEnabled: true,
    contourLevel: 0.35
  };
  private epsilon = 0.0001;
  private executionCount = 0;
  private destroyed = false;

  constructor(
    device: Device,
    dataset: RasterLabDataset,
    sources?: RasterLabResidentSources,
    settings?: RasterLabDisplaySettings,
    epsilon = 0.0001,
    halo?: RasterLabHaloSources,
    overview?: RasterLabGeneratedOverviewSources,
    global?: RasterLabGlobalSources
  ) {
    this.device = device;
    this.dataset = dataset;
    this.borrowedSources = Boolean(sources) && !overview;
    this.halo = halo;
    this.overview = overview;
    this.global = global;
    if (settings) this.settings = {...settings};
    this.epsilon = epsilon;
    this.contourSegmentCapacity = Math.max((dataset.width - 1) * (dataset.height - 1) * 2, 1);
    const sourceUsage = Buffer.STORAGE | Buffer.COPY_DST;
    const outputUsage = Buffer.STORAGE | Buffer.COPY_SRC;
    this.buffers = {
      red: overview
        ? device.createBuffer({
            id: 'raster-lab-generated-red',
            byteLength: dataset.pixelCount * Float32Array.BYTES_PER_ELEMENT,
            usage: outputUsage
          })
        : (sources?.red ??
          device.createBuffer({id: 'raster-lab-red', data: dataset.red, usage: sourceUsage})),
      nearInfrared: overview
        ? device.createBuffer({
            id: 'raster-lab-generated-near-infrared',
            byteLength: dataset.pixelCount * Float32Array.BYTES_PER_ELEMENT,
            usage: outputUsage
          })
        : (sources?.nearInfrared ??
          device.createBuffer({
            id: 'raster-lab-near-infrared',
            data: dataset.nearInfrared,
            usage: sourceUsage
          })),
      sourceValidity: overview
        ? device.createBuffer({
            id: 'raster-lab-generated-categorical-validity',
            byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
            usage: outputUsage
          })
        : (sources?.validity ??
          device.createBuffer({
            id: 'raster-lab-source-validity',
            data: dataset.validity,
            usage: sourceUsage
          })),
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
      componentLabels: device.createBuffer({
        id: 'raster-lab-sparse-component-labels',
        byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      componentValidity: device.createBuffer({
        id: 'raster-lab-component-observation-validity',
        byteLength: dataset.pixelCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionPixelCounts: device.createBuffer({
        id: 'raster-lab-region-pixel-counts',
        byteLength: REGION_RESULT_CAPACITY * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionIntensityCounts: device.createBuffer({
        id: 'raster-lab-region-intensity-counts',
        byteLength: REGION_RESULT_CAPACITY * Uint32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionIntensitySums: device.createBuffer({
        id: 'raster-lab-region-intensity-sums',
        byteLength: REGION_RESULT_CAPACITY * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionIntensityMinimums: device.createBuffer({
        id: 'raster-lab-region-intensity-minimums',
        byteLength: REGION_RESULT_CAPACITY * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionIntensityMaximums: device.createBuffer({
        id: 'raster-lab-region-intensity-maximums',
        byteLength: REGION_RESULT_CAPACITY * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionIntensityMeans: device.createBuffer({
        id: 'raster-lab-region-intensity-means',
        byteLength: REGION_RESULT_CAPACITY * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionColumnSums: device.createBuffer({
        id: 'raster-lab-region-column-sums',
        byteLength: REGION_RESULT_CAPACITY * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionRowSums: device.createBuffer({
        id: 'raster-lab-region-row-sums',
        byteLength: REGION_RESULT_CAPACITY * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionCentroidColumns: device.createBuffer({
        id: 'raster-lab-region-centroid-columns',
        byteLength: REGION_RESULT_CAPACITY * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionCentroidRows: device.createBuffer({
        id: 'raster-lab-region-centroid-rows',
        byteLength: REGION_RESULT_CAPACITY * Float32Array.BYTES_PER_ELEMENT,
        usage: outputUsage
      }),
      regionAreas: device.createBuffer({
        id: 'raster-lab-region-affine-areas',
        byteLength: REGION_RESULT_CAPACITY * Float32Array.BYTES_PER_ELEMENT,
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
        componentLabels: this.buffers.componentLabels,
        contourVertices: this.buffers.contourVertices,
        contourCommands: initializedContourCommands
      });
      this.compiledGraph = initializedGraph;
      this.renderer = initializedRenderer;
    } catch (error) {
      initializedRenderer?.destroy();
      initializedGraph?.destroy();
      initializedContourCommands?.destroy();
      this.destroyOwnedBuffers();
      throw error;
    }
  }

  get nodeCount(): number {
    return this.compiledGraph.stats.nodeOrder.length;
  }

  get commandGraph(): CompiledGPUCommandGraph {
    return this.compiledGraph;
  }

  /** Analysis buffers exclude the externally owned, cache-resident source bands. */
  get ownedByteLength(): number {
    let byteLength = 0;
    for (const [name, buffer] of Object.entries(this.buffers)) {
      if (
        this.borrowedSources &&
        (name === 'red' || name === 'nearInfrared' || name === 'sourceValidity')
      ) {
        continue;
      }
      byteLength += buffer.byteLength;
    }
    return byteLength + this.contourCommands.buffer.byteLength + this.renderer.ownedByteLength;
  }

  /** Rebind a compatible resident tile without rebuilding pipelines or analysis outputs. */
  setResidentTile(
    dataset: RasterLabDataset,
    sources: RasterLabResidentSources,
    halo?: RasterLabHaloSources,
    overview?: RasterLabGeneratedOverviewSources,
    global?: RasterLabGlobalSources
  ): void {
    if (
      (!this.borrowedSources && !this.overview) ||
      dataset.width !== this.dataset.width ||
      dataset.height !== this.dataset.height ||
      Boolean(this.overview) !== Boolean(overview)
    ) {
      throw new Error('Raster tile graph reuse requires matching resident tile dimensions');
    }
    this.dataset = dataset;
    this.halo = halo;
    this.overview = overview;
    this.global = global;
    if (!overview) {
      this.buffers.red = sources.red;
      this.buffers.nearInfrared = sources.nearInfrared;
      this.buffers.sourceValidity = sources.validity;
      this.renderer.setSourceBuffers(sources.red, sources.nearInfrared);
    }
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
      settings.componentsEnabled === this.settings.componentsEnabled &&
      settings.componentConnectivity === this.settings.componentConnectivity &&
      settings.componentLabelMode === this.settings.componentLabelMode &&
      settings.componentCapacity === this.settings.componentCapacity &&
      settings.componentMaximumIterations === this.settings.componentMaximumIterations &&
      settings.regionMetricsEnabled === this.settings.regionMetricsEnabled &&
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
  async update(selectedRegionId = 1): Promise<RasterLabSummary> {
    const startedAt = performance.now();
    const encoder = this.device.createCommandEncoder({
      id: `raster-lab-analysis-${this.executionCount}`
    });
    const importedBuffers: Record<string, Buffer> = {
      red: this.buffers.red,
      'near-infrared': this.buffers.nearInfrared,
      'source-validity': this.buffers.sourceValidity
    };
    for (const [tileIndex, tile] of this.halo?.tiles.entries() ?? []) {
      importedBuffers[`halo-red-${tileIndex}`] = tile.sources.red;
      importedBuffers[`halo-near-infrared-${tileIndex}`] = tile.sources.nearInfrared;
      importedBuffers[`halo-validity-${tileIndex}`] = tile.sources.validity;
    }
    if (this.overview) {
      importedBuffers['overview-source-red'] = this.overview.sources.red;
      importedBuffers['overview-source-near-infrared'] = this.overview.sources.nearInfrared;
      importedBuffers['overview-source-validity'] = this.overview.sources.validity;
    }
    for (const tile of this.global?.tiles ?? []) {
      importedBuffers[`global-${tile.name}-red`] = tile.sources.red;
      importedBuffers[`global-${tile.name}-near-infrared`] = tile.sources.nearInfrared;
      importedBuffers[`global-${tile.name}-validity`] = tile.sources.validity;
    }
    this.compiledGraph.encode(encoder, {parameters: undefined, buffers: importedBuffers});
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.domain,
      destinationBuffer: this.buffers.summaryReadback,
      size: DOMAIN_BYTE_LENGTH
    });
    encoder.copyBufferToBuffer({
      sourceBuffer: this.buffers.histogram,
      destinationBuffer: this.buffers.summaryReadback,
      destinationOffset: DOMAIN_BYTE_LENGTH,
      size:
        (this.settings.regionMetricsEnabled ? REGION_HISTOGRAM_BIN_COUNT : HISTOGRAM_BIN_COUNT) *
        Uint32Array.BYTES_PER_ELEMENT
    });
    if (this.settings.regionMetricsEnabled) {
      const sourceOffset =
        Math.max(0, Math.min(selectedRegionId - 1, REGION_RESULT_CAPACITY - 1)) *
        Uint32Array.BYTES_PER_ELEMENT;
      const regionSources = [
        this.buffers.regionPixelCounts,
        this.buffers.regionIntensitySums,
        this.buffers.regionIntensityMinimums,
        this.buffers.regionIntensityMaximums,
        this.buffers.regionIntensityMeans,
        this.buffers.regionCentroidColumns,
        this.buffers.regionCentroidRows,
        this.buffers.regionAreas
      ];
      for (const [scalarIndex, sourceBuffer] of regionSources.entries()) {
        encoder.copyBufferToBuffer({
          sourceBuffer,
          sourceOffset,
          destinationBuffer: this.buffers.summaryReadback,
          destinationOffset:
            REGION_MEASUREMENT_BYTE_OFFSET + scalarIndex * Uint32Array.BYTES_PER_ELEMENT,
          size: Uint32Array.BYTES_PER_ELEMENT
        });
      }
    }
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
    if ((this.settings.automaticThreshold && this.settings.thresholdEnabled) || this.global) {
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
      this.settings.regionMetricsEnabled ? REGION_HISTOGRAM_BIN_COUNT : HISTOGRAM_BIN_COUNT
    );
    const copiedBins = new Uint32Array(bins);
    const aggregateView = new DataView(
      summaryBytes.buffer,
      summaryBytes.byteOffset,
      SUMMARY_BYTE_LENGTH
    );
    const validPixelCount = aggregateView.getUint32(COUNT_BYTE_OFFSET, true);
    const componentConverged =
      this.settings.componentsEnabled &&
      aggregateView.getUint32(CONTOUR_OVERFLOW_BYTE_OFFSET, true) !== 0;
    const componentCount = componentConverged
      ? aggregateView.getUint32(CONTOUR_COUNT_BYTE_OFFSET, true)
      : 0;
    const regionPixelCount = this.settings.regionMetricsEnabled
      ? aggregateView.getUint32(REGION_MEASUREMENT_BYTE_OFFSET, true)
      : 0;
    const regionAvailable =
      this.settings.regionMetricsEnabled &&
      componentConverged &&
      componentCount <= this.settings.componentCapacity &&
      selectedRegionId >= 1 &&
      selectedRegionId <= componentCount &&
      regionPixelCount > 0 &&
      Boolean(this.dataset.metadata);
    const centroidColumn = regionAvailable
      ? aggregateView.getFloat32(
          REGION_MEASUREMENT_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT * 5,
          true
        )
      : Number.NaN;
    const centroidRow = regionAvailable
      ? aggregateView.getFloat32(
          REGION_MEASUREMENT_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT * 6,
          true
        )
      : Number.NaN;
    const coordinateReferenceAuthority =
      this.dataset.metadata?.coordinateReferenceSystem?.authority ?? '';
    const regionMeasurement: RasterLabRegionMeasurement | null = regionAvailable
      ? {
          id: selectedRegionId,
          pixelCount: regionPixelCount,
          intensitySum: aggregateView.getFloat32(
            REGION_MEASUREMENT_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT,
            true
          ),
          intensityMinimum: aggregateView.getFloat32(
            REGION_MEASUREMENT_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT * 2,
            true
          ),
          intensityMaximum: aggregateView.getFloat32(
            REGION_MEASUREMENT_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT * 3,
            true
          ),
          intensityMean: aggregateView.getFloat32(
            REGION_MEASUREMENT_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT * 4,
            true
          ),
          centroidColumn,
          centroidRow,
          worldCentroid: getRasterRegionWorldCentroid(
            this.dataset.metadata!,
            centroidColumn,
            centroidRow
          ),
          area: aggregateView.getFloat32(
            REGION_MEASUREMENT_BYTE_OFFSET + Float32Array.BYTES_PER_ELEMENT * 7,
            true
          ),
          areaUnits: /^EPSG:32[67]\d{2}$/.test(coordinateReferenceAuthority)
            ? 'm²'
            : 'coordinate units²'
        }
      : null;

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
      globalMedian:
        this.global && !this.settings.automaticThreshold
          ? aggregateView.getFloat32(THRESHOLD_BYTE_OFFSET, true)
          : null,
      componentsEnabled: this.settings.componentsEnabled,
      componentConnectivity: this.settings.componentConnectivity,
      componentLabelMode: this.settings.componentLabelMode,
      componentCapacity: this.settings.componentCapacity,
      componentCount,
      componentPublishedCount: Math.min(componentCount, this.settings.componentCapacity),
      componentOverflow: componentConverged && componentCount > this.settings.componentCapacity,
      componentMaximumIterations: this.settings.componentMaximumIterations,
      componentIterations: this.settings.componentsEnabled
        ? aggregateView.getUint32(CONTOUR_REQUIRED_BYTE_OFFSET, true)
        : 0,
      componentConverged,
      regionMetricsEnabled: this.settings.regionMetricsEnabled,
      regionMeasurement,
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
    this.destroyOwnedBuffers();
  }

  private destroyOwnedBuffers(): void {
    for (const [name, buffer] of Object.entries(this.buffers)) {
      if (
        this.borrowedSources &&
        (name === 'red' || name === 'nearInfrared' || name === 'sourceValidity')
      ) {
        continue;
      }
      buffer.destroy();
    }
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

    if (this.overview) {
      const sourcePixelCount = this.overview.metadata.width * this.overview.metadata.height;
      const nativeRed = this.importView(
        graph,
        'overview-source-red',
        this.overview.sources.red,
        'float32',
        sourcePixelCount
      );
      const nativeNearInfrared = this.importView(
        graph,
        'overview-source-near-infrared',
        this.overview.sources.nearInfrared,
        'float32',
        sourcePixelCount
      );
      const nativeValidity = this.importView(
        graph,
        'overview-source-validity',
        this.overview.sources.validity,
        'uint32',
        sourcePixelCount
      );
      const redMeanValidity = this.createTransientView(
        graph,
        'overview-red-mean-validity',
        'uint32',
        this.dataset.pixelCount
      );
      const redSum = this.createTransientView(
        graph,
        'overview-red-sum',
        'float32',
        this.dataset.pixelCount
      );
      const redValidCount = this.createTransientView(
        graph,
        'overview-red-valid-count',
        'uint32',
        this.dataset.pixelCount
      );
      const nearInfraredMeanValidity = this.createTransientView(
        graph,
        'overview-near-infrared-mean-validity',
        'uint32',
        this.dataset.pixelCount
      );
      const nearInfraredSum = this.createTransientView(
        graph,
        'overview-near-infrared-sum',
        'float32',
        this.dataset.pixelCount
      );
      const nearInfraredValidCount = this.createTransientView(
        graph,
        'overview-near-infrared-valid-count',
        'uint32',
        this.dataset.pixelCount
      );
      const categoryValidity = this.createTransientView(
        graph,
        'overview-category-validity',
        'uint32',
        this.dataset.pixelCount
      );
      const categoryCoverage = this.createTransientView(
        graph,
        'overview-category-coverage',
        'uint32',
        this.dataset.pixelCount
      );
      const nativeRedBand: GPURasterBufferBand<'float32'> = {
        id: 'native-red-reflectance',
        format: 'float32',
        storage: {kind: 'buffer', values: nativeRed},
        validity: nativeValidity,
        noDataValue: RASTER_LAB_NO_DATA_VALUE
      };
      const nativeNearInfraredBand: GPURasterBufferBand<'float32'> = {
        id: 'native-near-infrared-reflectance',
        format: 'float32',
        storage: {kind: 'buffer', values: nativeNearInfrared},
        validity: nativeValidity,
        noDataValue: RASTER_LAB_NO_DATA_VALUE
      };

      new GPURasterOverview({
        id: 'raster-lab-generated-red-overview',
        metadata: this.overview.metadata,
        scale: 2,
        input: nativeRedBand,
        output: redValues,
        outputValidity: redMeanValidity,
        sum: redSum,
        validCount: redValidCount
      }).addToGraph(graph);
      new GPURasterOverview({
        id: 'raster-lab-generated-near-infrared-overview',
        metadata: this.overview.metadata,
        scale: 2,
        input: nativeNearInfraredBand,
        output: nearInfraredValues,
        outputValidity: nearInfraredMeanValidity,
        sum: nearInfraredSum,
        validCount: nearInfraredValidCount
      }).addToGraph(graph);

      const nativeCloudCategories: GPURasterBufferBand<'uint32'> = {
        id: 'native-cloud-category',
        format: 'uint32',
        storage: {kind: 'buffer', values: nativeValidity}
      };
      new GPURasterCategoricalOverview({
        id: `raster-lab-generated-cloud-${this.overview.categoryPolicy}`,
        metadata: this.overview.metadata,
        scale: 2,
        input: nativeCloudCategories,
        policy: this.overview.categoryPolicy,
        output: sourceValidity,
        outputValidity: categoryValidity,
        validCount: categoryCoverage
      }).addToGraph(graph);
    }

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
    const componentLabels = this.importView(
      graph,
      'component-labels',
      this.buffers.componentLabels,
      'uint32',
      this.dataset.pixelCount
    );
    const componentValidity = this.importView(
      graph,
      'component-validity',
      this.buffers.componentValidity,
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
      this.settings.regionMetricsEnabled ? REGION_HISTOGRAM_BIN_COUNT : HISTOGRAM_BIN_COUNT
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

    let processingWidth = this.dataset.width;
    let processingHeight = this.dataset.height;
    let selectedValues =
      this.settings.mode === 'ndvi'
        ? vegetationIndex
        : this.settings.mode === 'red'
          ? redValues
          : nearInfraredValues;
    let selectedValidity = outputValidity;
    let processingSmoothedValues = smoothedValues;
    let processingSmoothedValidity = smoothedValidity;
    let processingEdgeValues = edgeValues;
    let processingEdgeValidity = edgeValidity;
    let processingMorphologyValues = morphologyValues;
    let processingMorphologyValidity = grayscaleMorphologyValidity;

    if (this.halo) {
      const haloPixelCount = this.halo.plan.width * this.halo.plan.height;
      const assembledRed = this.createTransientView(graph, 'halo-red', 'float32', haloPixelCount);
      const assembledNearInfrared = this.createTransientView(
        graph,
        'halo-near-infrared',
        'float32',
        haloPixelCount
      );
      const assembledRedValidity = this.createTransientView(
        graph,
        'halo-red-validity',
        'uint32',
        haloPixelCount
      );
      const assembledNearInfraredValidity = this.createTransientView(
        graph,
        'halo-near-infrared-validity',
        'uint32',
        haloPixelCount
      );
      const assembledVegetationIndex = this.createTransientView(
        graph,
        'halo-vegetation-index',
        'float32',
        haloPixelCount
      );
      const assembledVegetationValidity = this.createTransientView(
        graph,
        'halo-vegetation-validity',
        'uint32',
        haloPixelCount
      );
      const redSources: Array<{
        pixelBounds: GPURasterPixelBounds;
        input: GPURasterBufferBand<'float32'>;
      }> = [];
      const nearInfraredSources: Array<{
        pixelBounds: GPURasterPixelBounds;
        input: GPURasterBufferBand<'float32'>;
      }> = [];

      for (const [tileIndex, tile] of this.halo.tiles.entries()) {
        const sourcePixelCount =
          (tile.pixelBounds[2] - tile.pixelBounds[0]) * (tile.pixelBounds[3] - tile.pixelBounds[1]);
        const tileValidity = this.importView(
          graph,
          `halo-validity-${tileIndex}`,
          tile.sources.validity,
          'uint32',
          sourcePixelCount
        );
        redSources.push({
          pixelBounds: tile.pixelBounds,
          input: {
            id: 'red-reflectance',
            format: 'float32',
            storage: {
              kind: 'buffer',
              values: this.importView(
                graph,
                `halo-red-${tileIndex}`,
                tile.sources.red,
                'float32',
                sourcePixelCount
              )
            },
            validity: tileValidity,
            noDataValue: RASTER_LAB_NO_DATA_VALUE
          }
        });
        nearInfraredSources.push({
          pixelBounds: tile.pixelBounds,
          input: {
            id: 'near-infrared-reflectance',
            format: 'float32',
            storage: {
              kind: 'buffer',
              values: this.importView(
                graph,
                `halo-near-infrared-${tileIndex}`,
                tile.sources.nearInfrared,
                'float32',
                sourcePixelCount
              )
            },
            validity: tileValidity,
            noDataValue: RASTER_LAB_NO_DATA_VALUE
          }
        });
      }

      new GPURasterTileHaloFill({
        id: 'raster-lab-red-halo-assembly',
        pixelBounds: this.halo.plan.availablePixelBounds,
        sources: redSources,
        output: assembledRed,
        outputValidity: assembledRedValidity
      }).addToGraph(graph);
      new GPURasterTileHaloFill({
        id: 'raster-lab-near-infrared-halo-assembly',
        pixelBounds: this.halo.plan.availablePixelBounds,
        sources: nearInfraredSources,
        output: assembledNearInfrared,
        outputValidity: assembledNearInfraredValidity
      }).addToGraph(graph);

      const paddedRed: GPURasterBufferBand<'float32'> = {
        id: 'assembled-red-reflectance',
        format: 'float32',
        storage: {kind: 'buffer', values: assembledRed},
        validity: assembledRedValidity,
        noDataValue: RASTER_LAB_NO_DATA_VALUE
      };
      const paddedNearInfrared: GPURasterBufferBand<'float32'> = {
        id: 'assembled-near-infrared-reflectance',
        format: 'float32',
        storage: {kind: 'buffer', values: assembledNearInfrared},
        validity: assembledNearInfraredValidity,
        noDataValue: RASTER_LAB_NO_DATA_VALUE
      };
      new GPURasterNDVI({
        id: 'raster-lab-padded-ndvi',
        width: this.halo.plan.width,
        height: this.halo.plan.height,
        nearInfrared: paddedNearInfrared,
        red: paddedRed,
        output: assembledVegetationIndex,
        outputValidity: assembledVegetationValidity,
        epsilon: this.epsilon
      }).addToGraph(graph);

      processingWidth = this.halo.plan.width;
      processingHeight = this.halo.plan.height;
      selectedValues =
        this.settings.mode === 'ndvi'
          ? assembledVegetationIndex
          : this.settings.mode === 'red'
            ? assembledRed
            : assembledNearInfrared;
      selectedValidity = assembledVegetationValidity;
      processingSmoothedValues = this.createTransientView(
        graph,
        'halo-smoothed-values',
        'float32',
        haloPixelCount
      );
      processingSmoothedValidity = this.createTransientView(
        graph,
        'halo-smoothed-validity',
        'uint32',
        haloPixelCount
      );
      processingEdgeValues = this.createTransientView(
        graph,
        'halo-edge-values',
        'float32',
        haloPixelCount
      );
      processingEdgeValidity = this.createTransientView(
        graph,
        'halo-edge-validity',
        'uint32',
        haloPixelCount
      );
      processingMorphologyValues = this.createTransientView(
        graph,
        'halo-morphology-values',
        'float32',
        haloPixelCount
      );
      processingMorphologyValidity = this.createTransientView(
        graph,
        'halo-morphology-validity',
        'uint32',
        haloPixelCount
      );
    }

    const sourceBand: GPURasterBufferBand<'float32'> = {
      id: `${this.settings.mode}-source`,
      format: 'float32',
      storage: {kind: 'buffer', values: selectedValues},
      validity: selectedValidity,
      ...(this.settings.mode === 'ndvi' ? {} : {noDataValue: RASTER_LAB_NO_DATA_VALUE})
    };

    if (this.settings.smoothingMode !== 'none') {
      const smoothingProps = {
        id: `raster-lab-${this.settings.smoothingMode}-blur`,
        width: processingWidth,
        height: processingHeight,
        input: sourceBand,
        output: processingSmoothedValues,
        outputValidity: processingSmoothedValidity,
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
            storage: {kind: 'buffer', values: processingSmoothedValues},
            validity: processingSmoothedValidity
          };

    if (this.settings.edgeMode !== 'none') {
      const edgeProps = {
        id: `raster-lab-${this.settings.edgeMode}-${this.settings.edgeDirection}`,
        width: processingWidth,
        height: processingHeight,
        input: filteredBand,
        output: processingEdgeValues,
        outputValidity: processingEdgeValidity,
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
            storage: {kind: 'buffer', values: processingEdgeValues},
            validity: processingEdgeValidity
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
      width: processingWidth,
      height: processingHeight,
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
        output: processingMorphologyValues,
        outputValidity: processingMorphologyValidity
      }).addToGraph(graph);
    }

    const morphologyBand: GPURasterBufferBand<'float32'> = grayscaleMorphologyEnabled
      ? {
          id: `${this.settings.mode}-${this.settings.morphologyOperation}-morphology`,
          format: 'float32',
          storage: {kind: 'buffer', values: processingMorphologyValues},
          validity: processingMorphologyValidity
        }
      : derivativeBand;

    const coreProcessingBand: GPURasterBufferBand<'float32'> = this.halo
      ? {
          id: 'owned-core-processed-values',
          format: 'float32',
          storage: {kind: 'buffer', values: morphologyValues},
          validity: grayscaleMorphologyValidity
        }
      : morphologyBand;

    if (this.halo) {
      new GPURasterTileCoreExtract({
        id: 'raster-lab-owned-core-extract',
        availablePixelBounds: this.halo.plan.availablePixelBounds,
        corePixelBounds: this.halo.plan.corePixelBounds,
        input: morphologyBand,
        output: morphologyValues,
        outputValidity: grayscaleMorphologyValidity
      }).addToGraph(graph);
    }

    const contrastDomain: readonly [number, number] =
      this.settings.edgeMode === 'none'
        ? this.settings.mode === 'ndvi'
          ? [-1, 1]
          : [0, 1]
        : this.settings.edgeMode !== 'laplacian' && this.settings.edgeDirection === 'magnitude'
          ? [0, 1]
          : [-1, 1];
    const contrastOptions = {
      domain: contrastDomain,
      contrast: this.settings.contrast,
      gamma: this.settings.gamma,
      mode: this.settings.gamma === 1 ? ('linear' as const) : ('gamma' as const)
    };

    new GPURasterContrast({
      id: 'raster-lab-contrast',
      width: this.dataset.width,
      height: this.dataset.height,
      input: coreProcessingBand,
      output: analyzedValues,
      outputValidity: analyzedValidity,
      ...contrastOptions
    }).addToGraph(graph);

    const analyzedBand: GPURasterBufferBand<'float32'> = {
      id: `${this.settings.mode}-contrast-adjusted`,
      format: 'float32',
      storage: {kind: 'buffer', values: analyzedValues},
      validity: analyzedValidity
    };
    const globalBands = this.global ? this.createGlobalBands(graph, contrastOptions) : [];

    if (this.settings.thresholdEnabled || binaryMorphologyEnabled) {
      if (this.settings.automaticThreshold) {
        if (this.global) {
          const baselineAccumulator: GPURasterGlobalAccumulator = {
            extent: baselineDomain,
            count: this.createTransientView(graph, 'global-baseline-count', 'uint32', 1),
            sum: this.createTransientView(graph, 'global-baseline-sum', 'float32', 1),
            histogram: baselineHistogram,
            overflow: this.createTransientView(graph, 'global-baseline-overflow', 'uint32', 1)
          };
          this.addGlobalAccumulator(graph, 'baseline', globalBands, baselineAccumulator);
        } else {
          new GPURasterHistogram({
            id: 'raster-lab-baseline-histogram',
            input: analyzedBand,
            output: baselineHistogram,
            domainOutput: baselineDomain
          }).addToGraph(graph);
        }

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
      if (this.halo) {
        const haloPixelCount = processingWidth * processingHeight;
        const paddedAnalyzedValues = this.createTransientView(
          graph,
          'halo-binary-analyzed-values',
          'float32',
          haloPixelCount
        );
        const paddedAnalyzedValidity = this.createTransientView(
          graph,
          'halo-binary-analyzed-validity',
          'uint32',
          haloPixelCount
        );
        const paddedThresholdSeed = this.createTransientView(
          graph,
          'halo-binary-threshold-seed',
          'uint32',
          haloPixelCount
        );
        const paddedBinaryMask = this.createTransientView(
          graph,
          'halo-binary-morphology-mask',
          'uint32',
          haloPixelCount
        );
        const paddedBinaryValidity = this.createTransientView(
          graph,
          'halo-binary-morphology-validity',
          'uint32',
          haloPixelCount
        );

        new GPURasterContrast({
          id: 'raster-lab-padded-binary-contrast',
          width: processingWidth,
          height: processingHeight,
          input: derivativeBand,
          output: paddedAnalyzedValues,
          outputValidity: paddedAnalyzedValidity,
          ...contrastOptions
        }).addToGraph(graph);

        const paddedAnalyzedBand: GPURasterBufferBand<'float32'> = {
          id: 'raster-lab-padded-binary-analysis',
          format: 'float32',
          storage: {kind: 'buffer', values: paddedAnalyzedValues},
          validity: paddedAnalyzedValidity
        };
        new GPURasterThreshold({
          id: 'raster-lab-padded-binary-threshold',
          width: processingWidth,
          height: processingHeight,
          input: paddedAnalyzedBand,
          output: paddedThresholdSeed,
          threshold: this.settings.automaticThreshold
            ? automaticThreshold
            : this.settings.threshold,
          operation: 'above',
          inclusive: true
        }).addToGraph(graph);

        const paddedBinarySeed: GPURasterBufferBand<'uint32'> = {
          id: 'raster-lab-padded-binary-threshold-seed',
          format: 'uint32',
          storage: {kind: 'buffer', values: paddedThresholdSeed},
          validity: paddedAnalyzedValidity
        };
        new morphologyClass({
          ...morphologyProps,
          mode: 'binary',
          input: paddedBinarySeed,
          output: paddedBinaryMask,
          outputValidity: paddedBinaryValidity
        }).addToGraph(graph);

        const paddedBinaryBand: GPURasterBufferBand<'uint32'> = {
          id: 'raster-lab-padded-binary-morphology-result',
          format: 'uint32',
          storage: {kind: 'buffer', values: paddedBinaryMask},
          validity: paddedBinaryValidity
        };
        new GPURasterTileCoreExtract({
          id: 'raster-lab-owned-binary-core-extract',
          availablePixelBounds: this.halo.plan.availablePixelBounds,
          corePixelBounds: this.halo.plan.corePixelBounds,
          input: paddedBinaryBand,
          output: thresholdValidity,
          outputValidity: binaryMorphologyValidity
        }).addToGraph(graph);
      } else {
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
    }

    if (this.settings.componentsEnabled) {
      const denseLabelMode = this.settings.componentLabelMode === 'dense';
      const sparseComponentLabels = denseLabelMode
        ? this.createTransientView(
            graph,
            'raster-lab-sparse-component-roots',
            'uint32',
            this.dataset.pixelCount
          )
        : componentLabels;
      const sparseComponentValidity = denseLabelMode
        ? this.createTransientView(
            graph,
            'raster-lab-sparse-component-validity',
            'uint32',
            this.dataset.pixelCount
          )
        : componentValidity;
      const componentInput: GPURasterBufferBand<'uint32'> = {
        id: 'raster-lab-classified-foreground',
        format: 'uint32',
        storage: {kind: 'buffer', values: thresholdValidity},
        validity: binaryMorphologyEnabled ? binaryMorphologyValidity : analyzedValidity
      };
      new GPURasterConnectedComponents({
        id: 'raster-lab-connected-components',
        width: this.dataset.width,
        height: this.dataset.height,
        input: componentInput,
        output: sparseComponentLabels,
        outputValidity: sparseComponentValidity,
        converged: contourOverflow,
        iterationCount: contourRequiredSegmentCount,
        connectivity: this.settings.componentConnectivity,
        maximumIterations: this.settings.componentMaximumIterations
      }).addToGraph(graph);

      const denseComponentLabels = denseLabelMode
        ? componentLabels
        : this.createTransientView(
            graph,
            'raster-lab-dense-component-identifiers',
            'uint32',
            this.dataset.pixelCount
          );
      const denseComponentValidity = denseLabelMode
        ? componentValidity
        : this.createTransientView(
            graph,
            'raster-lab-dense-component-validity',
            'uint32',
            this.dataset.pixelCount
          );
      const boundedComponentCount = this.createTransientView(
        graph,
        'raster-lab-bounded-component-count',
        'uint32',
        1
      );
      const componentOverflow = this.createTransientView(
        graph,
        'raster-lab-component-overflow',
        'uint32',
        1
      );
      const componentCapacity = Math.min(
        this.settings.componentCapacity,
        this.dataset.pixelCount,
        REGION_RESULT_CAPACITY
      );
      new GPURasterDenseComponents({
        id: 'raster-lab-dense-connected-components',
        width: this.dataset.width,
        height: this.dataset.height,
        input: sparseComponentLabels,
        inputValidity: sparseComponentValidity,
        converged: contourOverflow,
        output: denseComponentLabels,
        outputValidity: denseComponentValidity,
        componentCount: boundedComponentCount,
        overflow: componentOverflow,
        requiredComponentCount: contourSegmentCount,
        capacity: componentCapacity
      }).addToGraph(graph);

      if (this.settings.regionMetricsEnabled) {
        if (!this.dataset.metadata) {
          throw new Error('Raster region measurements require affine source metadata');
        }
        new GPURasterRegionMeasurements({
          id: 'raster-lab-dense-region-measurements',
          metadata: this.dataset.metadata,
          labels: denseComponentLabels,
          labelValidity: denseComponentValidity,
          converged: contourOverflow,
          componentCount: boundedComponentCount,
          overflow: componentOverflow,
          intensity: analyzedBand,
          output: {
            pixelCounts: this.importView(
              graph,
              'region-pixel-counts',
              this.buffers.regionPixelCounts,
              'uint32',
              REGION_RESULT_CAPACITY
            ),
            intensityCounts: this.importView(
              graph,
              'region-intensity-counts',
              this.buffers.regionIntensityCounts,
              'uint32',
              REGION_RESULT_CAPACITY
            ),
            intensitySums: this.importView(
              graph,
              'region-intensity-sums',
              this.buffers.regionIntensitySums,
              'float32',
              REGION_RESULT_CAPACITY
            ),
            intensityMinimums: this.importView(
              graph,
              'region-intensity-minimums',
              this.buffers.regionIntensityMinimums,
              'float32',
              REGION_RESULT_CAPACITY
            ),
            intensityMaximums: this.importView(
              graph,
              'region-intensity-maximums',
              this.buffers.regionIntensityMaximums,
              'float32',
              REGION_RESULT_CAPACITY
            ),
            intensityMeans: this.importView(
              graph,
              'region-intensity-means',
              this.buffers.regionIntensityMeans,
              'float32',
              REGION_RESULT_CAPACITY
            ),
            columnSums: this.importView(
              graph,
              'region-column-sums',
              this.buffers.regionColumnSums,
              'float32',
              REGION_RESULT_CAPACITY
            ),
            rowSums: this.importView(
              graph,
              'region-row-sums',
              this.buffers.regionRowSums,
              'float32',
              REGION_RESULT_CAPACITY
            ),
            centroidColumns: this.importView(
              graph,
              'region-centroid-columns',
              this.buffers.regionCentroidColumns,
              'float32',
              REGION_RESULT_CAPACITY
            ),
            centroidRows: this.importView(
              graph,
              'region-centroid-rows',
              this.buffers.regionCentroidRows,
              'float32',
              REGION_RESULT_CAPACITY
            ),
            areas: this.importView(
              graph,
              'region-affine-areas',
              this.buffers.regionAreas,
              'float32',
              REGION_RESULT_CAPACITY
            )
          },
          capacity: componentCapacity
        }).addToGraph(graph);
      }
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
        draw: contourDraw,
        ...(this.dataset.metadata ? {metadata: this.dataset.metadata} : {})
      }).addToGraph(graph);
    }

    const selectedBand: GPURasterBufferBand<'float32'> = {
      ...analyzedBand,
      validity:
        this.settings.thresholdEnabled || binaryMorphologyEnabled
          ? thresholdValidity
          : analyzedValidity
    };

    if (this.global) {
      const selectedGlobalBands = globalBands.map(tile => {
        if (!this.settings.thresholdEnabled) return tile;
        const selection = this.createTransientView(
          graph,
          `global-${tile.name}-threshold-selection`,
          'uint32',
          tile.width * tile.height
        );
        new GPURasterThreshold({
          id: `raster-lab-global-${tile.name}-threshold`,
          width: tile.width,
          height: tile.height,
          input: tile.input,
          output: selection,
          threshold: this.settings.automaticThreshold
            ? automaticThreshold
            : this.settings.threshold,
          operation: 'above',
          inclusive: true
        }).addToGraph(graph);
        return {...tile, input: {...tile.input, validity: selection}};
      });
      const accumulator: GPURasterGlobalAccumulator = {
        extent: domain,
        count: validCount,
        sum,
        histogram,
        overflow: this.createTransientView(graph, 'global-output-overflow', 'uint32', 1)
      };
      this.addGlobalAccumulator(graph, 'output', selectedGlobalBands, accumulator);
      if (!this.settings.automaticThreshold) {
        new GPURasterGlobalPercentile({
          id: 'raster-lab-global-median',
          accumulator,
          percentile: 0.5,
          output: automaticThreshold
        }).addToGraph(graph);
      }
      new GPURasterBandMath({
        id: 'raster-lab-global-mean',
        width: 1,
        height: 1,
        left: {
          id: 'raster-lab-global-sum',
          format: 'float32',
          storage: {kind: 'buffer', values: sum}
        },
        right: {
          id: 'raster-lab-global-count',
          format: 'uint32',
          storage: {kind: 'buffer', values: validCount}
        },
        operation: 'divide',
        output: mean,
        outputValidity: this.createTransientView(graph, 'global-mean-validity', 'uint32', 1)
      }).addToGraph(graph);
    } else {
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
    }

    return graph.compile();
  }

  /** Recompute the exact selected pointwise quantity from each bounded, GPU-resident core. */
  private createGlobalBands(
    graph: GPUCommandGraph,
    contrast: {
      domain: readonly [number, number];
      contrast: number;
      gamma: number;
      mode: 'linear' | 'gamma';
    }
  ): RasterLabGlobalBand[] {
    const bands: RasterLabGlobalBand[] = [];
    for (const tile of this.global?.tiles ?? []) {
      const pixelCount = tile.width * tile.height;
      const redValues = this.importView(
        graph,
        `global-${tile.name}-red`,
        tile.sources.red,
        'float32',
        pixelCount
      );
      const nearInfraredValues = this.importView(
        graph,
        `global-${tile.name}-near-infrared`,
        tile.sources.nearInfrared,
        'float32',
        pixelCount
      );
      const sourceValidity = this.importView(
        graph,
        `global-${tile.name}-validity`,
        tile.sources.validity,
        'uint32',
        pixelCount
      );
      const vegetation = this.createTransientView(
        graph,
        `global-${tile.name}-vegetation`,
        'float32',
        pixelCount
      );
      const vegetationValidity = this.createTransientView(
        graph,
        `global-${tile.name}-vegetation-validity`,
        'uint32',
        pixelCount
      );
      const red: GPURasterBufferBand<'float32'> = {
        id: `global-${tile.name}-red-reflectance`,
        format: 'float32',
        storage: {kind: 'buffer', values: redValues},
        validity: sourceValidity,
        noDataValue: RASTER_LAB_NO_DATA_VALUE
      };
      const nearInfrared: GPURasterBufferBand<'float32'> = {
        id: `global-${tile.name}-near-infrared-reflectance`,
        format: 'float32',
        storage: {kind: 'buffer', values: nearInfraredValues},
        validity: sourceValidity,
        noDataValue: RASTER_LAB_NO_DATA_VALUE
      };
      new GPURasterNDVI({
        id: `raster-lab-global-${tile.name}-ndvi`,
        width: tile.width,
        height: tile.height,
        nearInfrared,
        red,
        output: vegetation,
        outputValidity: vegetationValidity,
        epsilon: this.epsilon
      }).addToGraph(graph);

      const selectedValues =
        this.settings.mode === 'ndvi'
          ? vegetation
          : this.settings.mode === 'red'
            ? redValues
            : nearInfraredValues;
      const input: GPURasterBufferBand<'float32'> = {
        id: `global-${tile.name}-${this.settings.mode}`,
        format: 'float32',
        storage: {kind: 'buffer', values: selectedValues},
        validity: vegetationValidity
      };
      const values = this.createTransientView(
        graph,
        `global-${tile.name}-analyzed-values`,
        'float32',
        pixelCount
      );
      const validity = this.createTransientView(
        graph,
        `global-${tile.name}-analyzed-validity`,
        'uint32',
        pixelCount
      );
      new GPURasterContrast({
        id: `raster-lab-global-${tile.name}-contrast`,
        width: tile.width,
        height: tile.height,
        input,
        output: values,
        outputValidity: validity,
        ...contrast
      }).addToGraph(graph);
      bands.push({
        name: tile.name,
        width: tile.width,
        height: tile.height,
        input: {
          id: `global-${tile.name}-contrast-adjusted`,
          format: 'float32',
          storage: {kind: 'buffer', values},
          validity
        }
      });
    }
    return this.global?.order === 'reverse' ? bands.reverse() : bands;
  }

  /** Finalize all extrema before replaying each bounded tile against the one stable domain. */
  private addGlobalAccumulator(
    graph: GPUCommandGraph,
    phase: 'baseline' | 'output',
    tiles: readonly RasterLabGlobalBand[],
    accumulator: GPURasterGlobalAccumulator
  ): void {
    new GPURasterGlobalInitialize({
      id: `raster-lab-global-${phase}-initialize`,
      accumulator
    }).addToGraph(graph);
    for (const tile of tiles) {
      new GPURasterGlobalStatisticsMerge({
        id: `raster-lab-global-${phase}-${tile.name}-statistics`,
        width: tile.width,
        height: tile.height,
        input: tile.input,
        accumulator
      }).addToGraph(graph);
    }
    for (const tile of tiles) {
      new GPURasterGlobalHistogramMerge({
        id: `raster-lab-global-${phase}-${tile.name}-histogram`,
        width: tile.width,
        height: tile.height,
        input: tile.input,
        accumulator
      }).addToGraph(graph);
    }
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

  private createTransientView<Format extends 'float32' | 'uint32'>(
    graph: GPUCommandGraph,
    id: string,
    format: Format,
    length: number
  ): GraphDataView<Format> {
    const handle = graph.createTransientBuffer({
      id,
      byteLength: length * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    return graph.createDataView(handle, {format, length});
  }
}
