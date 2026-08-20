// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView,
  GraphResourceUse
} from '@luma.gl/gpgpu/gpu-core';
import {getViewBinding, getViewElementOffset} from '@luma.gl/gpgpu/gpu-core';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  getRasterScalarLiteral,
  getRasterShaderScalarType,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterBufferBand} from './types';

/** Direction of a GPU-native raster sample classification. */
export type GPURasterThresholdOperation = 'above' | 'below' | 'range';

/** Literal sample threshold, ordered literal range, or caller-owned GPU threshold values. */
export type GPURasterThresholdValue = number | readonly [number, number] | GraphDataView<'float32'>;

/** Borrowed source samples and caller-owned uint32 destination for raster classification. */
export type GPURasterThresholdProps = {
  id?: string;
  width: number;
  height: number;
  /** Source samples are calibrated only after exact raw-format nodata rejection. */
  input: GPURasterBufferBand;
  /** Caller-owned packed uint32 selection flags, canonicalized to zero or one. */
  output: GraphDataView<'uint32'>;
  /** One value for above/below, or two ordered values for range. */
  threshold: GPURasterThresholdValue;
  /** Defaults to above. */
  operation?: GPURasterThresholdOperation;
  /** Includes values equal to threshold boundaries by default. */
  inclusive?: boolean;
};

/** Literal histogram sample extent or caller-owned GPU-resident float32 extent. */
export type GPURasterOtsuDomain = readonly [number, number] | GraphDataView<'float32'>;

/** Caller-owned histogram, sample domain, and destination for one Otsu threshold. */
export type GPURasterOtsuThresholdProps = {
  id?: string;
  /** One to 256 uint32 bins whose combined pixel count must fit in uint32. */
  histogram: GraphDataView<'uint32'>;
  /** Scalar domain used to convert the selected bin boundary into sample space. */
  domain: GPURasterOtsuDomain;
  /** One caller-owned float32 threshold; an empty histogram resolves to zero. */
  output: GraphDataView<'float32'>;
};

/**
 * Classifies calibrated raster samples without reading them back or submitting commands.
 *
 * Source validity, exact native-format nodata, finite floating-point samples, calibrated values,
 * and GPU-provided thresholds are all intersected before publishing the canonical output mask.
 */
export class GPURasterThreshold implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand;
  readonly output: GraphDataView<'uint32'>;
  readonly threshold: GPURasterThresholdValue;
  readonly operation: GPURasterThresholdOperation;
  readonly inclusive: boolean;

  constructor(props: GPURasterThresholdProps) {
    this.id = props.id ?? 'gpu-raster-threshold';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.output = props.output;
    this.threshold = props.threshold;
    this.operation = props.operation ?? 'above';
    this.inclusive = props.inclusive ?? true;

    if (
      !Number.isSafeInteger(this.width) ||
      this.width <= 0 ||
      !Number.isSafeInteger(this.height) ||
      this.height <= 0
    ) {
      throw new Error(`${this.id} dimensions must be positive integers`);
    }
    const pixelCount = this.width * this.height;
    if (!Number.isSafeInteger(pixelCount) || pixelCount > MAXIMUM_RASTER_PIXEL_COUNT) {
      throw new Error(`${this.id} pixel count must fit in uint32`);
    }
    if (!['above', 'below', 'range'].includes(this.operation)) {
      throw new Error(`${this.id} operation must be above, below, or range`);
    }
    if (typeof this.inclusive !== 'boolean') {
      throw new Error(`${this.id} inclusive must be a boolean`);
    }
    if (this.input.storage.kind !== 'buffer') {
      throw new Error(`${this.id} requires a buffer-backed raster band`);
    }

    const owner = validateRasterBand(this.input, this, `${this.id} input`);
    validateRasterValidityView(this.output, pixelCount, `${this.id} output`);
    if (this.output.buffer.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    if (
      this.output.buffer === this.input.storage.values.buffer ||
      this.output.buffer === this.input.validity?.buffer
    ) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }

    if (typeof this.threshold === 'number') {
      if (this.operation === 'range' || !Number.isFinite(this.threshold)) {
        throw new Error(`${this.id} scalar threshold must be finite and use above or below`);
      }
      getRasterFloatLiteral(this.threshold);
    } else if (Array.isArray(this.threshold)) {
      if (
        this.operation !== 'range' ||
        this.threshold.length !== 2 ||
        !Number.isFinite(this.threshold[0]) ||
        !Number.isFinite(this.threshold[1]) ||
        this.threshold[0] > this.threshold[1]
      ) {
        throw new Error(`${this.id} range threshold must contain two ordered finite values`);
      }
      getRasterFloatLiteral(this.threshold[0]);
      getRasterFloatLiteral(this.threshold[1]);
    } else {
      const threshold = this.threshold as GraphDataView<'float32'>;
      validateRasterScalarView(
        threshold,
        'float32',
        this.operation === 'range' ? 2 : 1,
        `${this.id} threshold`
      );
      if (threshold.buffer.graph !== owner) {
        throw new Error(`${this.id} threshold must belong to the same graph`);
      }
      if (threshold.buffer === this.output.buffer) {
        throw new Error(`${this.id} threshold and output must use separate buffers`);
      }
    }

    getRasterFloatLiteral(this.input.scale ?? 1);
    getRasterFloatLiteral(this.input.offset ?? 0);
  }

  /** Adds one bounded two-dimensional classification pass; its pipeline belongs to the graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const gpuThreshold = getGPUThreshold(this.threshold);
    const inputViews = [
      this.input.storage.values,
      ...(this.input.validity ? [this.input.validity] : []),
      ...(gpuThreshold ? [gpuThreshold] : [])
    ];
    for (const view of [...inputViews, this.output]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    const [horizontalCount, verticalCount] = getRasterDispatchSize(
      graph.device,
      this.width,
      this.height,
      this.id
    );

    const resources: GraphResourceUse[] = [
      {buffer: this.input.storage.values, usage: 'storage-read'},
      {buffer: this.output, usage: 'storage-write'}
    ];
    if (this.input.validity) resources.push({buffer: this.input.validity, usage: 'storage-read'});
    if (gpuThreshold) resources.push({buffer: gpuThreshold, usage: 'storage-read'});

    graph.addComputePass({
      id: this.id,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'sourceValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'outputValidity', type: 'storage', group: 0, location: 1}
        ];
        if (this.input.validity) {
          bindings.push({name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 2});
        }
        if (gpuThreshold) {
          bindings.push({
            name: 'thresholdValues',
            type: 'read-only-storage',
            group: 0,
            location: this.input.validity ? 3 : 2
          });
        }
        const computation = new Computation(device, {
          id: this.id,
          source: this.getShaderSource(gpuThreshold),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              sourceValues: getViewBinding(this.input.storage.values, getBuffer),
              outputValidity: getViewBinding(this.output, getBuffer)
            };
            if (this.input.validity) {
              resolvedBindings['sourceValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            if (gpuThreshold) {
              resolvedBindings['thresholdValues'] = getViewBinding(gpuThreshold, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, horizontalCount, verticalCount);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getShaderSource(gpuThreshold?: GraphDataView<'float32'>): string {
    const sourceValidity = this.input.validity;
    const validityDeclaration = sourceValidity
      ? `@group(0) @binding(2) var<storage, read> sourceValidity: array<u32>;\nconst SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(sourceValidity)}u;`
      : '';
    const thresholdDeclaration = gpuThreshold
      ? `@group(0) @binding(${sourceValidity ? 3 : 2}) var<storage, read> thresholdValues: array<f32>;\nconst THRESHOLD_OFFSET: u32 = ${getViewElementOffset(gpuThreshold)}u;`
      : '';
    const thresholdExpression = gpuThreshold
      ? 'thresholdValues[THRESHOLD_OFFSET]'
      : getRasterFloatLiteral(
          typeof this.threshold === 'number'
            ? this.threshold
            : (this.threshold as readonly [number, number])[0]
        );
    const upperThresholdExpression =
      this.operation === 'range'
        ? gpuThreshold
          ? 'thresholdValues[THRESHOLD_OFFSET + 1u]'
          : getRasterFloatLiteral((this.threshold as readonly [number, number])[1])
        : undefined;

    const validityConditions = ['isFiniteValue(sample)', 'isFiniteValue(lowerThreshold)'];
    if (sourceValidity) {
      validityConditions.push('sourceValidity[SOURCE_VALIDITY_OFFSET + pixelIndex] != 0u');
    }
    if (this.input.format === 'float32') validityConditions.push('isFiniteValue(rawSample)');
    if (this.input.noDataValue !== undefined && !Number.isNaN(this.input.noDataValue)) {
      validityConditions.push(
        `rawSample != ${getRasterScalarLiteral(this.input.noDataValue, this.input.format)}`
      );
    }
    if (upperThresholdExpression) {
      validityConditions.push('isFiniteValue(upperThreshold)', 'lowerThreshold <= upperThreshold');
    }

    const lowerComparator = this.inclusive ? '>=' : '>';
    const upperComparator = this.inclusive ? '<=' : '<';
    const selectedExpression =
      this.operation === 'above'
        ? `sample ${lowerComparator} lowerThreshold`
        : this.operation === 'below'
          ? `sample ${upperComparator} lowerThreshold`
          : `sample ${lowerComparator} lowerThreshold && sample ${upperComparator} upperThreshold`;

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<${getRasterShaderScalarType(this.input.format)}>;
@group(0) @binding(1) var<storage, read_write> outputValidity: array<u32>;
${validityDeclaration}
${thresholdDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let rawSample = sourceValues[SOURCE_OFFSET + pixelIndex];
  let sample = f32(rawSample) * ${getRasterFloatLiteral(this.input.scale ?? 1)} + ${getRasterFloatLiteral(this.input.offset ?? 0)};
  let lowerThreshold = ${thresholdExpression};
  ${upperThresholdExpression ? `let upperThreshold = ${upperThresholdExpression};` : ''}
  let selected = ${validityConditions.join(' && ')} && (${selectedExpression});
  outputValidity[OUTPUT_OFFSET + pixelIndex] = select(0u, 1u, selected);
}`;
  }
}

/**
 * Computes a deterministic Otsu threshold directly from GPU-resident histogram bins.
 *
 * One invocation walks at most 256 bins, maximizing between-class variance and choosing the
 * lowest sample boundary when multiple splits have the same score. Empty histograms and invalid
 * GPU domains publish zero. Neither histogram bins nor the selected threshold are read back.
 */
export class GPURasterOtsuThreshold implements GPUCommandGraphContributor {
  readonly id: string;
  readonly histogram: GraphDataView<'uint32'>;
  readonly domain: GPURasterOtsuDomain;
  readonly output: GraphDataView<'float32'>;

  constructor(props: GPURasterOtsuThresholdProps) {
    this.id = props.id ?? 'gpu-raster-otsu-threshold';
    this.histogram = props.histogram;
    this.domain = props.domain;
    this.output = props.output;

    if (this.histogram.length < 1 || this.histogram.length > 256) {
      throw new Error(`${this.id} histogram must contain between one and 256 bins`);
    }
    validateRasterScalarView(
      this.histogram,
      'uint32',
      this.histogram.length,
      `${this.id} histogram`
    );
    validateRasterScalarView(this.output, 'float32', 1, `${this.id} output`);
    if (this.output.buffer.graph !== this.histogram.buffer.graph) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    if (this.output.buffer === this.histogram.buffer) {
      throw new Error(`${this.id} histogram and output must use separate buffers`);
    }

    if (Array.isArray(this.domain)) {
      if (
        this.domain.length !== 2 ||
        !Number.isFinite(this.domain[0]) ||
        !Number.isFinite(this.domain[1]) ||
        this.domain[0] > this.domain[1]
      ) {
        throw new Error(`${this.id} domain must contain two ordered finite values`);
      }
      getRasterFloatLiteral(this.domain[0]);
      getRasterFloatLiteral(this.domain[1]);
    } else {
      const domain = this.domain as GraphDataView<'float32'>;
      validateRasterScalarView(domain, 'float32', 2, `${this.id} domain`);
      if (domain.buffer.graph !== this.histogram.buffer.graph) {
        throw new Error(`${this.id} domain must belong to the same graph`);
      }
      if (domain.buffer === this.output.buffer) {
        throw new Error(`${this.id} domain and output must use separate buffers`);
      }
    }
  }

  /** Adds one bounded scalar graph pass; its pipeline is owned by the compiled graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const gpuDomain = getGPUOtsuDomain(this.domain);
    const views = [this.histogram, this.output, ...(gpuDomain ? [gpuDomain] : [])];
    for (const view of views) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    if (
      graph.device.limits.maxComputeInvocationsPerWorkgroup < 1 ||
      graph.device.limits.maxComputeWorkgroupSizeX < 1 ||
      graph.device.limits.maxComputeWorkgroupsPerDimension < 1
    ) {
      throw new Error(`${this.id} exceeds device workgroup limits`);
    }

    const resources: GraphResourceUse[] = [
      {buffer: this.histogram, usage: 'storage-read'},
      {buffer: this.output, usage: 'storage-write'}
    ];
    if (gpuDomain) resources.push({buffer: gpuDomain, usage: 'storage-read'});

    graph.addComputePass({
      id: this.id,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'histogramValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'outputThreshold', type: 'storage', group: 0, location: 1}
        ];
        if (gpuDomain) {
          bindings.push({name: 'domainValues', type: 'read-only-storage', group: 0, location: 2});
        }
        const computation = new Computation(device, {
          id: this.id,
          source: this.getShaderSource(gpuDomain),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              histogramValues: getViewBinding(this.histogram, getBuffer),
              outputThreshold: getViewBinding(this.output, getBuffer)
            };
            if (gpuDomain) resolvedBindings['domainValues'] = getViewBinding(gpuDomain, getBuffer);
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getShaderSource(gpuDomain?: GraphDataView<'float32'>): string {
    const domainDeclaration = gpuDomain
      ? `@group(0) @binding(2) var<storage, read> domainValues: array<f32>;\nconst DOMAIN_OFFSET: u32 = ${getViewElementOffset(gpuDomain)}u;`
      : '';
    const minimumExpression = gpuDomain
      ? 'domainValues[DOMAIN_OFFSET]'
      : getRasterFloatLiteral((this.domain as readonly [number, number])[0]);
    const maximumExpression = gpuDomain
      ? 'domainValues[DOMAIN_OFFSET + 1u]'
      : getRasterFloatLiteral((this.domain as readonly [number, number])[1]);

    return /* wgsl */ `
const HISTOGRAM_OFFSET: u32 = ${getViewElementOffset(this.histogram)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const BIN_COUNT: u32 = ${this.histogram.length}u;
@group(0) @binding(0) var<storage, read> histogramValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputThreshold: array<f32>;
${domainDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(1)
fn main() {
  let minimumValue = ${minimumExpression};
  let maximumValue = ${maximumExpression};
  if (!isFiniteValue(minimumValue) || !isFiniteValue(maximumValue) || minimumValue > maximumValue) {
    outputThreshold[OUTPUT_OFFSET] = 0.0;
    return;
  }

  var totalCount = 0u;
  var totalWeightedIndex = 0.0;
  for (var binIndex = 0u; binIndex < BIN_COUNT; binIndex++) {
    let count = histogramValues[HISTOGRAM_OFFSET + binIndex];
    totalCount += count;
    totalWeightedIndex += f32(binIndex) * f32(count);
  }
  if (totalCount == 0u) {
    outputThreshold[OUTPUT_OFFSET] = 0.0;
    return;
  }

  var lowerCount = 0u;
  var lowerWeightedIndex = 0.0;
  var bestScore = -1.0;
  var bestBoundary = 0u;
  for (var binIndex = 0u; binIndex + 1u < BIN_COUNT; binIndex++) {
    let count = histogramValues[HISTOGRAM_OFFSET + binIndex];
    lowerCount += count;
    lowerWeightedIndex += f32(binIndex) * f32(count);
    let upperCount = totalCount - lowerCount;
    if (lowerCount > 0u && upperCount > 0u) {
      let lowerMean = lowerWeightedIndex / f32(lowerCount);
      let upperMean = (totalWeightedIndex - lowerWeightedIndex) / f32(upperCount);
      let separation = lowerMean - upperMean;
      let score = f32(lowerCount) * f32(upperCount) * separation * separation;
      if (score > bestScore) {
        bestScore = score;
        bestBoundary = binIndex + 1u;
      }
    }
  }
  let fraction = f32(bestBoundary) / f32(BIN_COUNT);
  outputThreshold[OUTPUT_OFFSET] = minimumValue + (maximumValue - minimumValue) * fraction;
}`;
  }
}

function getGPUThreshold(threshold: GPURasterThresholdValue): GraphDataView<'float32'> | undefined {
  return typeof threshold === 'number' || Array.isArray(threshold)
    ? undefined
    : (threshold as GraphDataView<'float32'>);
}

function getGPUOtsuDomain(domain: GPURasterOtsuDomain): GraphDataView<'float32'> | undefined {
  return Array.isArray(domain) ? undefined : (domain as GraphDataView<'float32'>);
}
