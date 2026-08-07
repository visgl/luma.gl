// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphBufferUsage,
  GraphDataView,
  GraphResourceUse
} from '../gpu-primitives/gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-primitives/graph-data-view-utils';
import {GPURasterHistogram} from './gpu-raster-histogram';
import {GPURasterStatistics} from './gpu-raster-statistics';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterBufferBand} from './types';

/** Caller-owned persistent global outputs shared by separately encoded tile and replay graphs. */
export type GPURasterGlobalAccumulator = {
  /** Two calibrated floating extrema; an empty initialized dataset remains [0, 0]. */
  extent: GraphDataView<'float32'>;
  /** Saturating exact valid population; bit 1 of overflow records any lost excess. */
  count: GraphDataView<'uint32'>;
  /** Calibrated global floating sum; bit 4 of overflow records a nonfinite accumulation. */
  sum: GraphDataView<'float32'>;
  /** One to 256 independently saturating global bins; bit 2 records a saturated bin. */
  histogram: GraphDataView<'uint32'>;
  /** Sticky independent overflow bits: 1 = count, 2 = histogram bin, 4 = floating sum. */
  overflow: GraphDataView<'uint32'>;
};

/** Explicit dataset-boundary initialization; never implicitly included by a merge contributor. */
export type GPURasterGlobalInitializeProps = {
  id?: string;
  accumulator: GPURasterGlobalAccumulator;
};

/** One bounded, calibrated, validity-aware floating tile contributing global scalar partials. */
export type GPURasterGlobalStatisticsMergeProps = {
  id?: string;
  width: number;
  height: number;
  input: GPURasterBufferBand<'float32'>;
  accumulator: GPURasterGlobalAccumulator;
};

/** One replayed tile contributing bins against the final stable GPU-resident global domain. */
export type GPURasterGlobalHistogramMergeProps = {
  id?: string;
  width: number;
  height: number;
  input: GPURasterBufferBand<'float32'>;
  accumulator: GPURasterGlobalAccumulator;
};

/** Deterministic GPU histogram estimate; overflow and empty populations remain explicit. */
export type GPURasterGlobalPercentileProps = {
  id?: string;
  accumulator: GPURasterGlobalAccumulator;
  /** Closed unit interval; zero and one preserve the exact observed global extrema. */
  percentile: number;
  output: GraphDataView<'float32'>;
  /** Optional caller-owned validity for the empty, overflowing, or malformed global domain. */
  outputValidity?: GraphDataView<'uint32'>;
};

type GlobalBinding = {
  name: string;
  view: GraphDataView;
  usage: Extract<GraphBufferUsage, 'storage-read' | 'storage-write' | 'storage-read-write'>;
};

/** Initializes one caller-owned persistent dataset accumulator through an explicit graph pass. */
export class GPURasterGlobalInitialize implements GPUCommandGraphContributor {
  readonly id: string;
  readonly accumulator: GPURasterGlobalAccumulator;

  constructor(props: GPURasterGlobalInitializeProps) {
    this.id = props.id ?? 'gpu-raster-global-initialize';
    this.accumulator = props.accumulator;
    validateAccumulator(this.accumulator, this.id);
  }

  /** Encode once per dataset; replaying only tile merge graphs never resets global state. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {extent, count, sum, histogram, overflow} = this.accumulator;
    addGlobalPass(
      graph,
      this.id,
      histogram.length,
      1,
      [
        {name: 'extentValues', view: extent, usage: 'storage-write'},
        {name: 'countValues', view: count, usage: 'storage-write'},
        {name: 'sumValues', view: sum, usage: 'storage-write'},
        {name: 'histogramValues', view: histogram, usage: 'storage-write'},
        {name: 'overflowValues', view: overflow, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
const BIN_COUNT: u32 = ${histogram.length}u;
const EXTENT_OFFSET: u32 = ${getViewElementOffset(extent)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(count)}u;
const SUM_OFFSET: u32 = ${getViewElementOffset(sum)}u;
const HISTOGRAM_OFFSET: u32 = ${getViewElementOffset(histogram)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(overflow)}u;
@group(0) @binding(${locations.get('extentValues')}) var<storage, read_write> extentValues: array<f32>;
@group(0) @binding(${locations.get('countValues')}) var<storage, read_write> countValues: array<u32>;
@group(0) @binding(${locations.get('sumValues')}) var<storage, read_write> sumValues: array<f32>;
@group(0) @binding(${locations.get('histogramValues')}) var<storage, read_write> histogramValues: array<u32>;
@group(0) @binding(${locations.get('overflowValues')}) var<storage, read_write> overflowValues: array<atomic<u32>>;

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.y != 0u || globalId.x >= BIN_COUNT) { return; }
  histogramValues[HISTOGRAM_OFFSET + globalId.x] = 0u;
  if (globalId.x == 0u) {
    extentValues[EXTENT_OFFSET] = 0.0;
    extentValues[EXTENT_OFFSET + 1u] = 0.0;
    countValues[COUNT_OFFSET] = 0u;
    sumValues[SUM_OFFSET] = 0.0;
    atomicStore(&overflowValues[OVERFLOW_OFFSET], 0u);
  }
}`
    );
  }
}

/** Merges one reusable tile's calibrated scalar partials into persistent global GPU outputs. */
export class GPURasterGlobalStatisticsMerge implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand<'float32'>;
  readonly accumulator: GPURasterGlobalAccumulator;

  constructor(props: GPURasterGlobalStatisticsMergeProps) {
    this.id = props.id ?? 'gpu-raster-global-statistics-merge';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.accumulator = props.accumulator;
    validateTile(this.width, this.height, this.input, this.accumulator, this.id);
  }

  /** Recomputes only tile-owned scratch and preserves every separately initialized global value. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    assertAccumulatorGraph(graph, this.accumulator, this.id);
    const tileCount = createTransientView(graph, `${this.id}-tile-count`, 'uint32', 1);
    const tileSum = createTransientView(graph, `${this.id}-tile-sum`, 'float32', 1);
    const tileMean = createTransientView(graph, `${this.id}-tile-mean`, 'float32', 1);
    const tileExtent = createTransientView(graph, `${this.id}-tile-extent`, 'float32', 2);

    new GPURasterStatistics({
      id: `${this.id}-tile-statistics`,
      width: this.width,
      height: this.height,
      input: this.input,
      count: tileCount,
      sum: tileSum,
      mean: tileMean,
      extent: tileExtent
    }).addToGraph(graph);

    const {extent, count, sum, overflow} = this.accumulator;
    addGlobalPass(
      graph,
      `${this.id}-merge`,
      1,
      1,
      [
        {name: 'tileCount', view: tileCount, usage: 'storage-read'},
        {name: 'tileSum', view: tileSum, usage: 'storage-read'},
        {name: 'tileExtent', view: tileExtent, usage: 'storage-read'},
        {name: 'globalCount', view: count, usage: 'storage-read-write'},
        {name: 'globalSum', view: sum, usage: 'storage-read-write'},
        {name: 'globalExtent', view: extent, usage: 'storage-read-write'},
        {name: 'globalOverflow', view: overflow, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
const TILE_COUNT_OFFSET: u32 = ${getViewElementOffset(tileCount)}u;
const TILE_SUM_OFFSET: u32 = ${getViewElementOffset(tileSum)}u;
const TILE_EXTENT_OFFSET: u32 = ${getViewElementOffset(tileExtent)}u;
const GLOBAL_COUNT_OFFSET: u32 = ${getViewElementOffset(count)}u;
const GLOBAL_SUM_OFFSET: u32 = ${getViewElementOffset(sum)}u;
const GLOBAL_EXTENT_OFFSET: u32 = ${getViewElementOffset(extent)}u;
const GLOBAL_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(overflow)}u;
@group(0) @binding(${locations.get('tileCount')}) var<storage, read> tileCount: array<u32>;
@group(0) @binding(${locations.get('tileSum')}) var<storage, read> tileSum: array<f32>;
@group(0) @binding(${locations.get('tileExtent')}) var<storage, read> tileExtent: array<f32>;
@group(0) @binding(${locations.get('globalCount')}) var<storage, read_write> globalCount: array<u32>;
@group(0) @binding(${locations.get('globalSum')}) var<storage, read_write> globalSum: array<f32>;
@group(0) @binding(${locations.get('globalExtent')}) var<storage, read_write> globalExtent: array<f32>;
@group(0) @binding(${locations.get('globalOverflow')}) var<storage, read_write> globalOverflow: array<atomic<u32>>;

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x != 0u || globalId.y != 0u) { return; }
  let additionalCount = tileCount[TILE_COUNT_OFFSET];
  if (additionalCount == 0u) { return; }
  let previousCount = globalCount[GLOBAL_COUNT_OFFSET];
  if (0xffffffffu - previousCount < additionalCount) {
    globalCount[GLOBAL_COUNT_OFFSET] = 0xffffffffu;
    atomicOr(&globalOverflow[GLOBAL_OVERFLOW_OFFSET], 1u);
  } else {
    globalCount[GLOBAL_COUNT_OFFSET] = previousCount + additionalCount;
  }

  let mergedSum = globalSum[GLOBAL_SUM_OFFSET] + tileSum[TILE_SUM_OFFSET];
  if (isFiniteValue(mergedSum)) {
    globalSum[GLOBAL_SUM_OFFSET] = mergedSum;
  } else {
    atomicOr(&globalOverflow[GLOBAL_OVERFLOW_OFFSET], 4u);
  }

  let tileMinimum = tileExtent[TILE_EXTENT_OFFSET];
  let tileMaximum = tileExtent[TILE_EXTENT_OFFSET + 1u];
  if (previousCount == 0u) {
    globalExtent[GLOBAL_EXTENT_OFFSET] = tileMinimum;
    globalExtent[GLOBAL_EXTENT_OFFSET + 1u] = tileMaximum;
  } else {
    globalExtent[GLOBAL_EXTENT_OFFSET] = min(globalExtent[GLOBAL_EXTENT_OFFSET], tileMinimum);
    globalExtent[GLOBAL_EXTENT_OFFSET + 1u] = max(
      globalExtent[GLOBAL_EXTENT_OFFSET + 1u],
      tileMaximum
    );
  }
}`
    );
  }
}

/** Replays one calibrated tile against stable global extrema and merges only its cleared partial. */
export class GPURasterGlobalHistogramMerge implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand<'float32'>;
  readonly accumulator: GPURasterGlobalAccumulator;

  constructor(props: GPURasterGlobalHistogramMergeProps) {
    this.id = props.id ?? 'gpu-raster-global-histogram-merge';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.accumulator = props.accumulator;
    validateTile(this.width, this.height, this.input, this.accumulator, this.id);
  }

  /** Re-encoding clears its own graph-owned histogram but never erases persistent global bins. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    assertAccumulatorGraph(graph, this.accumulator, this.id);
    const pixelCount = this.width * this.height;
    const calibratedValues = createTransientView(
      graph,
      `${this.id}-calibrated-values`,
      'float32',
      pixelCount
    );
    const calibratedValidity = createTransientView(
      graph,
      `${this.id}-calibrated-validity`,
      'uint32',
      pixelCount
    );
    const tileHistogram = createTransientView(
      graph,
      `${this.id}-tile-histogram`,
      'uint32',
      this.accumulator.histogram.length
    );
    this.addCalibrationPass(graph, calibratedValues, calibratedValidity);
    new GPURasterHistogram({
      id: `${this.id}-tile-bins`,
      input: {
        id: `${this.id}-calibrated-band`,
        format: 'float32',
        storage: {kind: 'buffer', values: calibratedValues},
        validity: calibratedValidity
      },
      output: tileHistogram,
      domain: this.accumulator.extent
    }).addToGraph(graph);
    this.addHistogramMergePass(graph, tileHistogram);
  }

  private addCalibrationPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    values: GraphDataView<'float32'>,
    validity: GraphDataView<'uint32'>
  ): void {
    const bindings: GlobalBinding[] = [
      {name: 'sourceValues', view: this.input.storage.values, usage: 'storage-read'},
      {name: 'outputValues', view: values, usage: 'storage-write'},
      {name: 'outputValidity', view: validity, usage: 'storage-write'}
    ];
    if (this.input.validity) {
      bindings.push({name: 'sourceValidity', view: this.input.validity, usage: 'storage-read'});
    }
    const sourceValidity = this.input.validity;
    const noData = this.input.noDataValue;
    const noDataCondition =
      noData !== undefined && !Number.isNaN(noData)
        ? ` && rawSample != ${getRasterFloatLiteral(noData)}`
        : '';
    addGlobalPass(graph, `${this.id}-calibrate`, this.width, this.height, bindings, locations => {
      const maskDeclaration = sourceValidity
        ? `@group(0) @binding(${locations.get('sourceValidity')}) var<storage, read> sourceValidity: array<u32>;
const SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(sourceValidity)}u;`
        : '';
      const maskCondition = sourceValidity
        ? ' && sourceValidity[SOURCE_VALIDITY_OFFSET + pixelIndex] != 0u'
        : '';
      return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(values)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(validity)}u;
@group(0) @binding(${locations.get('sourceValues')}) var<storage, read> sourceValues: array<f32>;
@group(0) @binding(${locations.get('outputValues')}) var<storage, read_write> outputValues: array<f32>;
@group(0) @binding(${locations.get('outputValidity')}) var<storage, read_write> outputValidity: array<u32>;
${maskDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let rawSample = sourceValues[SOURCE_OFFSET + pixelIndex];
  let calibratedSample = rawSample * ${getRasterFloatLiteral(this.input.scale ?? 1)} + ${getRasterFloatLiteral(this.input.offset ?? 0)};
  let accepted = isFiniteValue(rawSample) && isFiniteValue(calibratedSample)${noDataCondition}${maskCondition};
  outputValues[OUTPUT_OFFSET + pixelIndex] = select(0.0, calibratedSample, accepted);
  outputValidity[OUTPUT_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, accepted);
}`;
    });
  }

  private addHistogramMergePass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    tileHistogram: GraphDataView<'uint32'>
  ): void {
    const {histogram, overflow} = this.accumulator;
    addGlobalPass(
      graph,
      `${this.id}-merge`,
      histogram.length,
      1,
      [
        {name: 'tileHistogram', view: tileHistogram, usage: 'storage-read'},
        {name: 'globalHistogram', view: histogram, usage: 'storage-read-write'},
        {name: 'globalOverflow', view: overflow, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
const BIN_COUNT: u32 = ${histogram.length}u;
const TILE_OFFSET: u32 = ${getViewElementOffset(tileHistogram)}u;
const GLOBAL_OFFSET: u32 = ${getViewElementOffset(histogram)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(overflow)}u;
@group(0) @binding(${locations.get('tileHistogram')}) var<storage, read> tileHistogram: array<u32>;
@group(0) @binding(${locations.get('globalHistogram')}) var<storage, read_write> globalHistogram: array<u32>;
@group(0) @binding(${locations.get('globalOverflow')}) var<storage, read_write> globalOverflow: array<atomic<u32>>;

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.y != 0u || globalId.x >= BIN_COUNT) { return; }
  let bin = globalId.x;
  let previous = globalHistogram[GLOBAL_OFFSET + bin];
  let additional = tileHistogram[TILE_OFFSET + bin];
  if (0xffffffffu - previous < additional) {
    globalHistogram[GLOBAL_OFFSET + bin] = 0xffffffffu;
    atomicOr(&globalOverflow[OVERFLOW_OFFSET], 2u);
  } else {
    globalHistogram[GLOBAL_OFFSET + bin] = previous + additional;
  }
}`
    );
  }
}

/** Publishes one explicit histogram-bin percentile without CPU readback or silent overflow use. */
export class GPURasterGlobalPercentile implements GPUCommandGraphContributor {
  readonly id: string;
  readonly accumulator: GPURasterGlobalAccumulator;
  readonly percentile: number;
  readonly output: GraphDataView<'float32'>;
  readonly outputValidity?: GraphDataView<'uint32'>;

  constructor(props: GPURasterGlobalPercentileProps) {
    this.id = props.id ?? 'gpu-raster-global-percentile';
    this.accumulator = props.accumulator;
    this.percentile = props.percentile;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    const owner = validateAccumulator(this.accumulator, this.id);
    if (!Number.isFinite(this.percentile) || this.percentile < 0 || this.percentile > 1) {
      throw new Error(`${this.id} percentile must belong to the closed unit interval`);
    }
    getRasterFloatLiteral(this.percentile);
    validateRasterScalarView(this.output, 'float32', 1, `${this.id} output`);
    if (
      this.output.buffer.graph !== owner ||
      getAccumulatorViews(this.accumulator).some(view => view.buffer === this.output.buffer)
    ) {
      throw new Error(`${this.id} output must use a separate buffer in the same graph`);
    }
    if (this.outputValidity) {
      validateRasterValidityView(this.outputValidity, 1, `${this.id} output validity`);
      if (
        this.outputValidity.buffer.graph !== owner ||
        this.outputValidity.buffer === this.output.buffer ||
        getAccumulatorViews(this.accumulator).some(
          view => view.buffer === this.outputValidity!.buffer
        )
      ) {
        throw new Error(`${this.id} output validity must use a separate buffer in the same graph`);
      }
    }
  }

  /** Endpoints are exact; interior estimates choose the center of their first matching bin. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {extent, count, histogram, overflow} = this.accumulator;
    const bindings: GlobalBinding[] = [
      {name: 'extentValues', view: extent, usage: 'storage-read'},
      {name: 'countValues', view: count, usage: 'storage-read'},
      {name: 'histogramValues', view: histogram, usage: 'storage-read'},
      {name: 'overflowValues', view: overflow, usage: 'storage-read'},
      {name: 'outputValues', view: this.output, usage: 'storage-write'}
    ];
    if (this.outputValidity) {
      bindings.push({name: 'outputValidity', view: this.outputValidity, usage: 'storage-write'});
    }
    addGlobalPass(graph, this.id, 1, 1, bindings, locations => {
      const outputValidity = this.outputValidity;
      const validityDeclaration = outputValidity
        ? `@group(0) @binding(${locations.get('outputValidity')}) var<storage, read_write> outputValidity: array<u32>;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(outputValidity)}u;`
        : '';
      const validityWrite = outputValidity
        ? 'outputValidity[OUTPUT_VALIDITY_OFFSET] = select(0u, 1u, accepted);'
        : '';
      return /* wgsl */ `
const BIN_COUNT: u32 = ${histogram.length}u;
const EXTENT_OFFSET: u32 = ${getViewElementOffset(extent)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(count)}u;
const HISTOGRAM_OFFSET: u32 = ${getViewElementOffset(histogram)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(overflow)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const PERCENTILE: f32 = ${getRasterFloatLiteral(this.percentile)};
@group(0) @binding(${locations.get('extentValues')}) var<storage, read> extentValues: array<f32>;
@group(0) @binding(${locations.get('countValues')}) var<storage, read> countValues: array<u32>;
@group(0) @binding(${locations.get('histogramValues')}) var<storage, read> histogramValues: array<u32>;
@group(0) @binding(${locations.get('overflowValues')}) var<storage, read> overflowValues: array<u32>;
@group(0) @binding(${locations.get('outputValues')}) var<storage, read_write> outputValues: array<f32>;
${validityDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x != 0u || globalId.y != 0u) { return; }
  let minimumValue = extentValues[EXTENT_OFFSET];
  let maximumValue = extentValues[EXTENT_OFFSET + 1u];
  let population = countValues[COUNT_OFFSET];
  var accepted =
    population != 0u && overflowValues[OVERFLOW_OFFSET] == 0u &&
    isFiniteValue(minimumValue) && isFiniteValue(maximumValue) && minimumValue <= maximumValue;
  var result = minimumValue;
  if (accepted && PERCENTILE == 1.0) {
    result = maximumValue;
  } else if (accepted && PERCENTILE != 0.0 && minimumValue < maximumValue) {
    let targetRank = min(u32(floor(f32(population - 1u) * PERCENTILE)), population - 1u);
    var accumulated = 0u;
    var found = false;
    for (var bin = 0u; bin < BIN_COUNT; bin++) {
      let frequency = histogramValues[HISTOGRAM_OFFSET + bin];
      if (0xffffffffu - accumulated < frequency) {
        accepted = false;
        break;
      }
      accumulated += frequency;
      if (!found && accumulated > targetRank) {
        result = minimumValue +
          (f32(bin) + 0.5) * (maximumValue - minimumValue) / f32(BIN_COUNT);
        found = true;
      }
    }
    accepted = accepted && found;
  }
  let invalidValue = bitcast<f32>(0x7fc00000u | (globalId.x & 0u));
  outputValues[OUTPUT_OFFSET] = select(invalidValue, result, accepted);
  ${validityWrite}
}`;
    });
  }
}

function validateAccumulator(
  accumulator: GPURasterGlobalAccumulator,
  label: string
): GraphDataView['buffer']['graph'] {
  if (!accumulator || typeof accumulator !== 'object') {
    throw new Error(`${label} requires caller-owned persistent global accumulators`);
  }
  validateRasterScalarView(accumulator.extent, 'float32', 2, `${label} global extent`);
  validateRasterValidityView(accumulator.count, 1, `${label} global count`);
  validateRasterScalarView(accumulator.sum, 'float32', 1, `${label} global sum`);
  if (accumulator.histogram.length < 1 || accumulator.histogram.length > 256) {
    throw new Error(`${label} global histogram must contain one through 256 bins`);
  }
  validateRasterValidityView(
    accumulator.histogram,
    accumulator.histogram.length,
    `${label} global histogram`
  );
  validateRasterValidityView(accumulator.overflow, 1, `${label} global overflow`);
  const views = getAccumulatorViews(accumulator);
  const owner = views[0].buffer.graph;
  for (const [index, view] of views.entries()) {
    if (view.buffer.graph !== owner) {
      throw new Error(`${label} accumulator buffers must belong to the same graph`);
    }
    if (views.slice(index + 1).some(other => other.buffer === view.buffer)) {
      throw new Error(`${label} persistent accumulator outputs must use separate buffers`);
    }
  }
  return owner;
}

function validateTile(
  width: number,
  height: number,
  input: GPURasterBufferBand<'float32'>,
  accumulator: GPURasterGlobalAccumulator,
  label: string
): void {
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`${label} tile dimensions must be positive safe integers`);
  }
  const pixelCount = width * height;
  if (!Number.isSafeInteger(pixelCount) || pixelCount > MAXIMUM_RASTER_PIXEL_COUNT) {
    throw new Error(`${label} tile pixel count must fit in uint32`);
  }
  if (input.storage.kind !== 'buffer' || input.format !== 'float32') {
    throw new Error(`${label} requires a packed float32 tile band`);
  }
  const owner = validateRasterBand(input, {width, height}, `${label} input`);
  if (validateAccumulator(accumulator, label) !== owner) {
    throw new Error(`${label} tile and global accumulators must belong to the same graph`);
  }
  const sourceBuffers = [
    input.storage.values.buffer,
    ...(input.validity ? [input.validity.buffer] : [])
  ];
  if (getAccumulatorViews(accumulator).some(view => sourceBuffers.includes(view.buffer))) {
    throw new Error(`${label} tile input and persistent global outputs must use separate buffers`);
  }
  getRasterFloatLiteral(input.scale ?? 1);
  getRasterFloatLiteral(input.offset ?? 0);
}

function assertAccumulatorGraph<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  accumulator: GPURasterGlobalAccumulator,
  label: string
): void {
  if (getAccumulatorViews(accumulator).some(view => view.buffer.graph !== graph)) {
    throw new Error(`${label} persistent outputs must belong to the target graph`);
  }
}

function getAccumulatorViews(accumulator: GPURasterGlobalAccumulator): GraphDataView[] {
  return [
    accumulator.extent,
    accumulator.count,
    accumulator.sum,
    accumulator.histogram,
    accumulator.overflow
  ];
}

function addGlobalPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  width: number,
  height: number,
  bindings: readonly GlobalBinding[],
  makeShader: (locations: ReadonlyMap<string, number>) => string
): void {
  if (bindings.length > graph.device.limits.maxStorageBuffersPerShaderStage) {
    throw new Error(`${id} exceeds the device storage binding count`);
  }
  const resources: GraphResourceUse[] = [];
  const declarations: BindingDeclaration[] = [];
  const locations = new Map<string, number>();
  for (const [index, binding] of bindings.entries()) {
    if (binding.view.buffer.graph !== graph) {
      throw new Error(`${id} resources must belong to the target graph`);
    }
    assertRasterStorageBindingFits(graph.device, binding.view, `${id} ${binding.view.buffer.id}`);
    resources.push({buffer: binding.view, usage: binding.usage});
    declarations.push({
      name: binding.name,
      type: binding.usage === 'storage-read' ? 'read-only-storage' : 'storage',
      group: 0,
      location: index
    });
    locations.set(binding.name, index);
  }
  const dispatch = getRasterDispatchSize(graph.device, width, height, id);
  graph.addComputePass({
    id,
    resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id,
        source: makeShader(locations),
        shaderLayout: {bindings: declarations}
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const binding of bindings) {
            resolved[binding.name] = getViewBinding(binding.view, getBuffer);
          }
          computation.setBindings(resolved);
          computation.dispatch(computePass, dispatch[0], dispatch[1]);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
