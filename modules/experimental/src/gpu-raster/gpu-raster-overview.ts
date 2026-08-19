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
} from '../gpu-core/gpu-command-graph';
import {getViewBinding, getViewElementOffset} from '../gpu-core/graph-data-view-utils';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  getRasterScalarLiteral,
  getRasterShaderScalarType,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterMetadata,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterBufferBand, GPURasterMetadata} from './types';

/** Symmetric or independent positive integer source pixels per generated overview pixel. */
export type GPURasterOverviewScale = number | readonly [number, number];

/** Explicit target level and aligned source-grid tile origin. */
export type GPURasterOverviewMetadataOptions = {
  /** Defaults to one greater than the supplied source metadata level. */
  level?: number;
  /** Current source-level pixel coordinates; both axes must align to the requested scale. */
  sourcePixelOrigin?: readonly [number, number];
};

/** Complete caller-owned floating overview values and reusable weighted coverage outputs. */
export type GPURasterOverviewProps = GPURasterOverviewMetadataOptions & {
  id?: string;
  metadata: GPURasterMetadata;
  scale: GPURasterOverviewScale;
  input: GPURasterBufferBand<'float32'>;
  /** Previously accumulated calibrated sums; must be supplied with inputValidCount. */
  inputSum?: GraphDataView<'float32'>;
  /** Previously accumulated coverage; must be supplied with inputSum and an explicit bound. */
  inputValidCount?: GraphDataView<'uint32'>;
  /** Conservative maximum coverage of any single incoming aggregate pixel. */
  maximumInputValidCount?: number;
  /** Calibrated coverage-weighted mean; all-invalid pixels receive a canonical quiet NaN. */
  output: GraphDataView<'float32'>;
  outputValidity: GraphDataView<'uint32'>;
  /** Calibrated source-domain sum carried forward to subsequent generated levels. */
  sum: GraphDataView<'float32'>;
  /** Exact non-overflowing source-pixel coverage carried forward to subsequent levels. */
  validCount: GraphDataView<'uint32'>;
};

/** Exact native categorical and label representations accepted by non-interpolating overviews. */
export type GPURasterCategoricalOverviewFormat = 'uint32' | 'sint32';

/** Upper-left nearest-center sample or most common valid native integer label. */
export type GPURasterOverviewCategoricalPolicy = 'nearest' | 'mode';

/** Caller-owned exact-format categorical overview with an optional coverage-count destination. */
export type GPURasterCategoricalOverviewProps<
  Format extends GPURasterCategoricalOverviewFormat = GPURasterCategoricalOverviewFormat
> = GPURasterOverviewMetadataOptions & {
  id?: string;
  metadata: GPURasterMetadata;
  scale: GPURasterOverviewScale;
  input: GPURasterBufferBand<Format>;
  policy: GPURasterOverviewCategoricalPolicy;
  output: GraphDataView<Format>;
  outputValidity: GraphDataView<'uint32'>;
  /** Counts every valid footprint sample, including valid alternatives to an invalid nearest. */
  validCount?: GraphDataView<'uint32'>;
};

type NormalizedOverviewShape = {
  sourceMetadata: GPURasterMetadata;
  metadata: GPURasterMetadata;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  horizontalScale: number;
  verticalScale: number;
  sourcePixelOrigin: readonly [number, number];
};

const MAXIMUM_OVERVIEW_SCALE = 8;

/**
 * Derives one independently scaled, nodata-agnostic analytical overview grid without GPU work.
 *
 * Odd source dimensions retain partial final footprints. Rotation, shear, negative y scale,
 * coordinate-system identity, pixel-center interpretation, and level-zero origin remain exact
 * JavaScript metadata; the application must supply a globally aligned source tile when needed.
 */
export function makeRasterOverviewMetadata(
  metadata: GPURasterMetadata,
  scale: GPURasterOverviewScale,
  options: GPURasterOverviewMetadataOptions = {}
): GPURasterMetadata {
  return normalizeOverviewShape(metadata, scale, options, 'Raster overview').metadata;
}

/**
 * Computes calibrated, nodata-aware floating means together with reusable sums and coverage.
 *
 * Subsequent levels consume the previous level's sum and validCount rather than averaging
 * already-rounded means. A caller-declared input-count bound proves that every output remains
 * representable as uint32 before graph work is registered.
 */
export class GPURasterOverview implements GPUCommandGraphContributor {
  readonly id: string;
  readonly sourceMetadata: GPURasterMetadata;
  readonly metadata: GPURasterMetadata;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly width: number;
  readonly height: number;
  readonly horizontalScale: number;
  readonly verticalScale: number;
  readonly sourcePixelOrigin: readonly [number, number];
  readonly input: GPURasterBufferBand<'float32'>;
  readonly inputSum?: GraphDataView<'float32'>;
  readonly inputValidCount?: GraphDataView<'uint32'>;
  readonly maximumInputValidCount: number;
  readonly output: GraphDataView<'float32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly sum: GraphDataView<'float32'>;
  readonly validCount: GraphDataView<'uint32'>;

  constructor(props: GPURasterOverviewProps) {
    this.id = props.id ?? 'gpu-raster-overview';
    const shape = normalizeOverviewShape(props.metadata, props.scale, props, this.id);
    this.sourceMetadata = shape.sourceMetadata;
    this.metadata = shape.metadata;
    this.sourceWidth = shape.sourceWidth;
    this.sourceHeight = shape.sourceHeight;
    this.width = shape.width;
    this.height = shape.height;
    this.horizontalScale = shape.horizontalScale;
    this.verticalScale = shape.verticalScale;
    this.sourcePixelOrigin = shape.sourcePixelOrigin;
    this.input = props.input;
    this.inputSum = props.inputSum;
    this.inputValidCount = props.inputValidCount;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.sum = props.sum;
    this.validCount = props.validCount;

    if (this.input.storage.kind !== 'buffer' || this.input.format !== 'float32') {
      throw new Error(`${this.id} requires a packed float32 source band`);
    }
    const hasInputAggregates = Boolean(this.inputSum || this.inputValidCount);
    if (Boolean(this.inputSum) !== Boolean(this.inputValidCount)) {
      throw new Error(`${this.id} weighted inputs require both source sums and valid counts`);
    }
    if (hasInputAggregates && props.maximumInputValidCount === undefined) {
      throw new Error(`${this.id} weighted inputs require an explicit maximum valid-count bound`);
    }
    this.maximumInputValidCount = props.maximumInputValidCount ?? 1;
    if (
      !Number.isSafeInteger(this.maximumInputValidCount) ||
      this.maximumInputValidCount <= 0 ||
      (!hasInputAggregates && this.maximumInputValidCount !== 1)
    ) {
      throw new Error(`${this.id} maximum input valid count must be an exact positive bound`);
    }
    const maximumOutputCount =
      this.horizontalScale * this.verticalScale * this.maximumInputValidCount;
    if (
      !Number.isSafeInteger(maximumOutputCount) ||
      maximumOutputCount > MAXIMUM_RASTER_PIXEL_COUNT
    ) {
      throw new Error(`${this.id} weighted valid counts could overflow uint32`);
    }

    const owner = validateRasterBand(this.input, props.metadata, `${this.id} input`);
    const sourcePixelCount = this.sourceWidth * this.sourceHeight;
    const pixelCount = this.width * this.height;
    const inputs: GraphDataView[] = [
      this.input.storage.values,
      ...(this.input.validity ? [this.input.validity] : [])
    ];
    if (this.inputSum && this.inputValidCount) {
      validateRasterScalarView(this.inputSum, 'float32', sourcePixelCount, `${this.id} input sum`);
      validateRasterValidityView(
        this.inputValidCount,
        sourcePixelCount,
        `${this.id} input valid count`
      );
      inputs.push(this.inputSum, this.inputValidCount);
    }
    validateRasterScalarView(this.output, 'float32', pixelCount, `${this.id} output`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    validateRasterScalarView(this.sum, 'float32', pixelCount, `${this.id} sum`);
    validateRasterValidityView(this.validCount, pixelCount, `${this.id} valid count`);
    assertOverviewOwnership(
      owner,
      inputs,
      [this.output, this.outputValidity, this.sum, this.validCount],
      this.id
    );
    getRasterFloatLiteral(this.input.scale ?? 1);
    getRasterFloatLiteral(this.input.offset ?? 0);
  }

  /** Registers one bounded GPU pass; no decoded input, GPU buffer, or submission is owned. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const bindings: Array<{name: string; view: GraphDataView; readonly: boolean}> = [
      {name: 'sourceValues', view: this.input.storage.values, readonly: true},
      {name: 'outputValues', view: this.output, readonly: false},
      {name: 'outputValidity', view: this.outputValidity, readonly: false},
      {name: 'outputSums', view: this.sum, readonly: false},
      {name: 'outputValidCounts', view: this.validCount, readonly: false}
    ];
    if (this.input.validity) {
      bindings.push({name: 'sourceValidity', view: this.input.validity, readonly: true});
    }
    if (this.inputSum && this.inputValidCount) {
      bindings.push({name: 'sourceSums', view: this.inputSum, readonly: true});
      bindings.push({name: 'sourceValidCounts', view: this.inputValidCount, readonly: true});
    }
    addOverviewPass(graph, this.id, this.width, this.height, bindings, locations =>
      this.getShaderSource(locations)
    );
  }

  private getShaderSource(locations: ReadonlyMap<string, number>): string {
    const inputValidity = this.input.validity
      ? `@group(0) @binding(${locations.get('sourceValidity')}) var<storage, read> sourceValidity: array<u32>;
const SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.input.validity)}u;`
      : '';
    const weightedInputs =
      this.inputSum && this.inputValidCount
        ? `@group(0) @binding(${locations.get('sourceSums')}) var<storage, read> sourceSums: array<f32>;
@group(0) @binding(${locations.get('sourceValidCounts')}) var<storage, read> sourceValidCounts: array<u32>;
const SOURCE_SUM_OFFSET: u32 = ${getViewElementOffset(this.inputSum)}u;
const SOURCE_COUNT_OFFSET: u32 = ${getViewElementOffset(this.inputValidCount)}u;`
        : '';
    const noDataCondition =
      this.input.noDataValue !== undefined && !Number.isNaN(this.input.noDataValue)
        ? ` && rawSample != ${getRasterScalarLiteral(this.input.noDataValue, 'float32')}`
        : '';
    const maskCondition = this.input.validity
      ? ' && sourceValidity[SOURCE_VALIDITY_OFFSET + sourceIndex] != 0u'
      : '';
    const contribution =
      this.inputSum && this.inputValidCount
        ? `let sourceCount = sourceValidCounts[SOURCE_COUNT_OFFSET + sourceIndex];
          let sourceSum = sourceSums[SOURCE_SUM_OFFSET + sourceIndex];
          if (sourceCount > MAXIMUM_INPUT_COUNT) {
            coverageOverflowed = true;
          } else if (sourceCount != 0u && isFiniteValue(sourceSum)) {
            accumulatedSum += sourceSum;
            accumulatedCount += sourceCount;
          }`
        : `let calibratedSample = rawSample * ${getRasterFloatLiteral(this.input.scale ?? 1)} + ${getRasterFloatLiteral(this.input.offset ?? 0)};
          if (isFiniteValue(calibratedSample)) {
            accumulatedSum += calibratedSample;
            accumulatedCount += 1u;
          }`;

    return /* wgsl */ `
const SOURCE_WIDTH: u32 = ${this.sourceWidth}u;
const SOURCE_HEIGHT: u32 = ${this.sourceHeight}u;
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const SCALE_X: u32 = ${this.horizontalScale}u;
const SCALE_Y: u32 = ${this.verticalScale}u;
const MAXIMUM_INPUT_COUNT: u32 = ${this.maximumInputValidCount}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
const OUTPUT_SUM_OFFSET: u32 = ${getViewElementOffset(this.sum)}u;
const OUTPUT_COUNT_OFFSET: u32 = ${getViewElementOffset(this.validCount)}u;
@group(0) @binding(${locations.get('sourceValues')}) var<storage, read> sourceValues: array<f32>;
@group(0) @binding(${locations.get('outputValues')}) var<storage, read_write> outputValues: array<f32>;
@group(0) @binding(${locations.get('outputValidity')}) var<storage, read_write> outputValidity: array<u32>;
@group(0) @binding(${locations.get('outputSums')}) var<storage, read_write> outputSums: array<f32>;
@group(0) @binding(${locations.get('outputValidCounts')}) var<storage, read_write> outputValidCounts: array<u32>;
${inputValidity}
${weightedInputs}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let minimumColumn = globalId.x * SCALE_X;
  let minimumRow = globalId.y * SCALE_Y;
  let maximumColumn = min(minimumColumn + SCALE_X, SOURCE_WIDTH);
  let maximumRow = min(minimumRow + SCALE_Y, SOURCE_HEIGHT);
  var accumulatedSum = 0.0;
  var accumulatedCount = 0u;
  var coverageOverflowed = false;
  for (var row = minimumRow; row < maximumRow; row++) {
    for (var column = minimumColumn; column < maximumColumn; column++) {
      let sourceIndex = row * SOURCE_WIDTH + column;
      let rawSample = sourceValues[SOURCE_OFFSET + sourceIndex];
      if (isFiniteValue(rawSample)${noDataCondition}${maskCondition}) {
        ${contribution}
      }
    }
  }
  let outputIndex = globalId.y * WIDTH + globalId.x;
  let mean = accumulatedSum / f32(max(accumulatedCount, 1u));
  let outputIsValid =
    accumulatedCount != 0u && !coverageOverflowed &&
    isFiniteValue(accumulatedSum) && isFiniteValue(mean);
  let invalidValue = bitcast<f32>(0x7fc00000u | (outputIndex & 0u));
  outputValues[OUTPUT_OFFSET + outputIndex] = select(invalidValue, mean, outputIsValid);
  outputValidity[OUTPUT_VALIDITY_OFFSET + outputIndex] = select(0u, 1u, outputIsValid);
  outputSums[OUTPUT_SUM_OFFSET + outputIndex] = select(0.0, accumulatedSum, outputIsValid);
  outputValidCounts[OUTPUT_COUNT_OFFSET + outputIndex] = select(0u, accumulatedCount, outputIsValid);
}`;
  }
}

/**
 * Downsamples integer categories without averaging, interpolation, or floating conversion.
 *
 * Nearest selects the upper-left center on ties and preserves invalid chosen centers. Mode
 * ignores masked/nodata samples and resolves equal population deterministically to the smallest
 * exact signed or unsigned source label.
 */
export class GPURasterCategoricalOverview<
  Format extends GPURasterCategoricalOverviewFormat = GPURasterCategoricalOverviewFormat
> implements GPUCommandGraphContributor
{
  readonly id: string;
  readonly sourceMetadata: GPURasterMetadata;
  readonly metadata: GPURasterMetadata;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly width: number;
  readonly height: number;
  readonly horizontalScale: number;
  readonly verticalScale: number;
  readonly sourcePixelOrigin: readonly [number, number];
  readonly input: GPURasterBufferBand<Format>;
  readonly policy: GPURasterOverviewCategoricalPolicy;
  readonly output: GraphDataView<Format>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly validCount?: GraphDataView<'uint32'>;

  constructor(props: GPURasterCategoricalOverviewProps<Format>) {
    this.id = props.id ?? 'gpu-raster-categorical-overview';
    const shape = normalizeOverviewShape(props.metadata, props.scale, props, this.id);
    this.sourceMetadata = shape.sourceMetadata;
    this.metadata = shape.metadata;
    this.sourceWidth = shape.sourceWidth;
    this.sourceHeight = shape.sourceHeight;
    this.width = shape.width;
    this.height = shape.height;
    this.horizontalScale = shape.horizontalScale;
    this.verticalScale = shape.verticalScale;
    this.sourcePixelOrigin = shape.sourcePixelOrigin;
    this.input = props.input;
    this.policy = props.policy;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.validCount = props.validCount;

    if (
      this.input.storage.kind !== 'buffer' ||
      (this.input.format !== 'uint32' && this.input.format !== 'sint32')
    ) {
      throw new Error(`${this.id} requires exact uint32 or sint32 categorical samples`);
    }
    if (this.policy !== 'nearest' && this.policy !== 'mode') {
      throw new Error(`${this.id} category policy must be nearest or mode`);
    }
    const owner = validateRasterBand(this.input, props.metadata, `${this.id} input`);
    const pixelCount = this.width * this.height;
    validateRasterScalarView(this.output, this.input.format, pixelCount, `${this.id} output`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    const inputs = [
      this.input.storage.values,
      ...(this.input.validity ? [this.input.validity] : [])
    ];
    const outputs: GraphDataView[] = [this.output, this.outputValidity];
    if (this.validCount) {
      validateRasterValidityView(this.validCount, pixelCount, `${this.id} valid count`);
      outputs.push(this.validCount);
    }
    assertOverviewOwnership(owner, inputs, outputs, this.id);
  }

  /** Adds one bounded exact-native categorical selection pass with explicit graph hazards. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const bindings: Array<{name: string; view: GraphDataView; readonly: boolean}> = [
      {name: 'sourceValues', view: this.input.storage.values, readonly: true},
      {name: 'outputValues', view: this.output, readonly: false},
      {name: 'outputValidity', view: this.outputValidity, readonly: false}
    ];
    if (this.input.validity) {
      bindings.push({name: 'sourceValidity', view: this.input.validity, readonly: true});
    }
    if (this.validCount) {
      bindings.push({name: 'outputValidCounts', view: this.validCount, readonly: false});
    }
    addOverviewPass(graph, this.id, this.width, this.height, bindings, locations =>
      this.getShaderSource(locations)
    );
  }

  private getShaderSource(locations: ReadonlyMap<string, number>): string {
    const scalarType = getRasterShaderScalarType(this.input.format);
    const inputValidity = this.input.validity
      ? `@group(0) @binding(${locations.get('sourceValidity')}) var<storage, read> sourceValidity: array<u32>;
const SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.input.validity)}u;`
      : '';
    const outputCount = this.validCount
      ? `@group(0) @binding(${locations.get('outputValidCounts')}) var<storage, read_write> outputValidCounts: array<u32>;
const OUTPUT_COUNT_OFFSET: u32 = ${getViewElementOffset(this.validCount)}u;`
      : '';
    const noDataCondition =
      this.input.noDataValue !== undefined
        ? ` && value != ${getRasterScalarLiteral(this.input.noDataValue, this.input.format)}`
        : '';
    const maskCondition = this.input.validity
      ? ' && sourceValidity[SOURCE_VALIDITY_OFFSET + index] != 0u'
      : '';
    const zero = this.input.format === 'uint32' ? '0u' : '0i';
    const selection =
      this.policy === 'nearest'
        ? `let nearestColumn = minimumColumn + (maximumColumn - minimumColumn - 1u) / 2u;
  let nearestRow = minimumRow + (maximumRow - minimumRow - 1u) / 2u;
  let nearestIndex = nearestRow * SOURCE_WIDTH + nearestColumn;
  selectedValue = sourceValues[SOURCE_OFFSET + nearestIndex];
  selectedIsValid = isValidCategory(nearestIndex, selectedValue);`
        : `var highestFrequency = 0u;
  for (var candidateRow = minimumRow; candidateRow < maximumRow; candidateRow++) {
    for (var candidateColumn = minimumColumn; candidateColumn < maximumColumn; candidateColumn++) {
      let candidateIndex = candidateRow * SOURCE_WIDTH + candidateColumn;
      let candidate = sourceValues[SOURCE_OFFSET + candidateIndex];
      if (!isValidCategory(candidateIndex, candidate)) { continue; }
      var frequency = 0u;
      for (var comparisonRow = minimumRow; comparisonRow < maximumRow; comparisonRow++) {
        for (
          var comparisonColumn = minimumColumn;
          comparisonColumn < maximumColumn;
          comparisonColumn++
        ) {
          let comparisonIndex = comparisonRow * SOURCE_WIDTH + comparisonColumn;
          let comparison = sourceValues[SOURCE_OFFSET + comparisonIndex];
          if (isValidCategory(comparisonIndex, comparison) && comparison == candidate) {
            frequency++;
          }
        }
      }
      if (
        frequency > highestFrequency ||
        (frequency == highestFrequency && (!selectedIsValid || candidate < selectedValue))
      ) {
        highestFrequency = frequency;
        selectedValue = candidate;
        selectedIsValid = true;
      }
    }
  }`;
    const countWrite = this.validCount
      ? 'outputValidCounts[OUTPUT_COUNT_OFFSET + outputIndex] = coverageCount;'
      : '';

    return /* wgsl */ `
const SOURCE_WIDTH: u32 = ${this.sourceWidth}u;
const SOURCE_HEIGHT: u32 = ${this.sourceHeight}u;
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const SCALE_X: u32 = ${this.horizontalScale}u;
const SCALE_Y: u32 = ${this.verticalScale}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
@group(0) @binding(${locations.get('sourceValues')}) var<storage, read> sourceValues: array<${scalarType}>;
@group(0) @binding(${locations.get('outputValues')}) var<storage, read_write> outputValues: array<${scalarType}>;
@group(0) @binding(${locations.get('outputValidity')}) var<storage, read_write> outputValidity: array<u32>;
${inputValidity}
${outputCount}

fn isValidCategory(index: u32, value: ${scalarType}) -> bool {
  return true${noDataCondition}${maskCondition};
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let minimumColumn = globalId.x * SCALE_X;
  let minimumRow = globalId.y * SCALE_Y;
  let maximumColumn = min(minimumColumn + SCALE_X, SOURCE_WIDTH);
  let maximumRow = min(minimumRow + SCALE_Y, SOURCE_HEIGHT);
  var coverageCount = 0u;
  for (var row = minimumRow; row < maximumRow; row++) {
    for (var column = minimumColumn; column < maximumColumn; column++) {
      let sourceIndex = row * SOURCE_WIDTH + column;
      let sample = sourceValues[SOURCE_OFFSET + sourceIndex];
      if (isValidCategory(sourceIndex, sample)) { coverageCount++; }
    }
  }
  var selectedValue = ${zero};
  var selectedIsValid = false;
  ${selection}
  let outputIndex = globalId.y * WIDTH + globalId.x;
  outputValues[OUTPUT_OFFSET + outputIndex] = select(${zero}, selectedValue, selectedIsValid);
  outputValidity[OUTPUT_VALIDITY_OFFSET + outputIndex] = select(0u, 1u, selectedIsValid);
  ${countWrite}
}`;
  }
}

function normalizeOverviewShape(
  metadata: GPURasterMetadata,
  scale: GPURasterOverviewScale,
  options: GPURasterOverviewMetadataOptions,
  label: string
): NormalizedOverviewShape {
  validateRasterMetadata(metadata, `${label} source`);
  const scales = typeof scale === 'number' ? [scale, scale] : scale;
  if (
    !Array.isArray(scales) ||
    scales.length !== 2 ||
    !scales.every(
      value => Number.isSafeInteger(value) && value >= 1 && value <= MAXIMUM_OVERVIEW_SCALE
    )
  ) {
    throw new Error(`${label} overview scale must contain integers from one through eight`);
  }
  const sourceLevel = metadata.level ?? 0;
  const levelZeroOrigin = metadata.levelZeroOrigin;
  if (
    options.sourcePixelOrigin === undefined &&
    sourceLevel > 0 &&
    levelZeroOrigin &&
    (levelZeroOrigin[0] !== 0 || levelZeroOrigin[1] !== 0)
  ) {
    throw new Error(
      `${label} nonzero overview tile origins require explicit current-level source coordinates`
    );
  }
  const sourcePixelOrigin =
    options.sourcePixelOrigin ?? (sourceLevel === 0 && levelZeroOrigin ? levelZeroOrigin : [0, 0]);
  if (
    !Array.isArray(sourcePixelOrigin) ||
    sourcePixelOrigin.length !== 2 ||
    !sourcePixelOrigin.every(value => Number.isSafeInteger(value) && value >= 0)
  ) {
    throw new Error(`${label} source pixel origin must contain non-negative safe integers`);
  }
  if (sourcePixelOrigin[0] % scales[0] !== 0 || sourcePixelOrigin[1] % scales[1] !== 0) {
    throw new Error(`${label} source pixel origin must align to the generated overview grid`);
  }
  const targetLevel = options.level ?? sourceLevel + 1;
  if (!Number.isSafeInteger(targetLevel) || targetLevel <= sourceLevel) {
    throw new Error(`${label} target overview level must exceed its source level`);
  }
  const width = Math.ceil(metadata.width / scales[0]);
  const height = Math.ceil(metadata.height / scales[1]);
  const [first, second, third, fourth, fifth, sixth] = metadata.affine;
  const horizontalCenter = metadata.pixelInterpretation === 'point' ? (scales[0] - 1) / 2 : 0;
  const verticalCenter = metadata.pixelInterpretation === 'point' ? (scales[1] - 1) / 2 : 0;
  const outputMetadata: GPURasterMetadata = Object.freeze({
    width,
    height,
    affine: Object.freeze([
      first * scales[0],
      second * scales[1],
      third + first * horizontalCenter + second * verticalCenter,
      fourth * scales[0],
      fifth * scales[1],
      sixth + fourth * horizontalCenter + fifth * verticalCenter
    ]) as GPURasterMetadata['affine'],
    pixelInterpretation: metadata.pixelInterpretation,
    ...(metadata.coordinateReferenceSystem
      ? {coordinateReferenceSystem: metadata.coordinateReferenceSystem}
      : {}),
    ...(metadata.levelZeroOrigin
      ? {levelZeroOrigin: Object.freeze([...metadata.levelZeroOrigin]) as readonly [number, number]}
      : {}),
    level: targetLevel
  });
  validateRasterMetadata(outputMetadata, `${label} target`);
  return {
    sourceMetadata: metadata,
    metadata: outputMetadata,
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    width,
    height,
    horizontalScale: scales[0],
    verticalScale: scales[1],
    sourcePixelOrigin: Object.freeze([...sourcePixelOrigin]) as readonly [number, number]
  };
}

function assertOverviewOwnership(
  owner: GraphDataView['buffer']['graph'],
  inputs: readonly GraphDataView[],
  outputs: readonly GraphDataView[],
  label: string
): void {
  const inputBuffers = inputs.map(input => input.buffer);
  for (const [index, output] of outputs.entries()) {
    if (output.buffer.graph !== owner || inputs.some(input => input.buffer.graph !== owner)) {
      throw new Error(`${label} resources must belong to the same graph`);
    }
    if (
      inputBuffers.includes(output.buffer) ||
      outputs.slice(index + 1).some(other => other.buffer === output.buffer)
    ) {
      throw new Error(`${label} inputs and outputs must use separate buffers`);
    }
  }
}

function addOverviewPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  width: number,
  height: number,
  bindings: readonly {name: string; view: GraphDataView; readonly: boolean}[],
  getShaderSource: (locations: ReadonlyMap<string, number>) => string
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
    resources.push({
      buffer: binding.view,
      usage: binding.readonly ? 'storage-read' : 'storage-write'
    });
    declarations.push({
      name: binding.name,
      type: binding.readonly ? 'read-only-storage' : 'storage',
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
        source: getShaderSource(locations),
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
