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
} from '../gpu-primitives/gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import {GPUScan} from '../gpu-primitives/gpu-scan';
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

/** A fixed calibrated sample range or a caller-owned, two-row GPU-resident float32 range. */
export type GPURasterContrastDomain = readonly [number, number] | GraphDataView<'float32'>;

/** Linear stretching, gamma-corrected stretching, or histogram-CDF equalization. */
export type GPURasterContrastMode = 'linear' | 'gamma' | 'equalize';

/** Explicit source values, calibration domain, and caller-owned graph-native destinations. */
export type GPURasterContrastProps = {
  id?: string;
  width: number;
  height: number;
  /** Native-format samples are checked for nodata and calibrated before transformation. */
  input: GPURasterBufferBand;
  /** Caller-owned packed float32 destination in the same calibrated domain as the input. */
  output: GraphDataView<'float32'>;
  /** Caller-owned packed validity flags; rejected samples receive zero and a quiet-NaN value. */
  outputValidity: GraphDataView<'uint32'>;
  /** Inclusive calibrated range. Defaults to [0, 1]; GPU ranges remain entirely device-resident. */
  domain?: GPURasterContrastDomain;
  /** Midpoint-centered strength. Zero selects the midpoint and one preserves the input. */
  contrast?: number;
  /** Positive gamma exponent applied as pow(normalized, 1 / gamma). Defaults to one. */
  gamma?: number;
  /** Defaults to linear; equalize requires histogram counts in the same domain. */
  mode?: GPURasterContrastMode;
  /** Caller-owned histogram counts used by the optional graph-native inclusive CDF scan. */
  histogram?: GraphDataView<'uint32'>;
};

/**
 * Contributes nodata-aware contrast stretching without submitting work or reading raster pixels.
 *
 * Samples retain their calibrated scalar domain: with unit contrast and gamma, every in-domain
 * valid value is unchanged. Equalization composes an inclusive {@link GPUScan} into graph-owned
 * CDF scratch before one bounded two-dimensional transform. Literal and GPU-resident domains,
 * exact integer nodata sentinels, nonzero masks, and nonzero byte offsets are all explicit.
 */
export class GPURasterContrast implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand;
  readonly output: GraphDataView<'float32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly domain: GPURasterContrastDomain;
  readonly contrast: number;
  readonly gamma: number;
  readonly mode: GPURasterContrastMode;
  readonly histogram?: GraphDataView<'uint32'>;

  constructor(props: GPURasterContrastProps) {
    this.id = props.id ?? 'gpu-raster-contrast';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.domain = props.domain ?? [0, 1];
    this.contrast = props.contrast ?? 1;
    this.gamma = props.gamma ?? 1;
    this.mode = props.mode ?? 'linear';
    this.histogram = props.histogram;

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
    if (this.mode !== 'linear' && this.mode !== 'gamma' && this.mode !== 'equalize') {
      throw new Error(`${this.id} contrast mode is not supported`);
    }
    if (!Number.isFinite(this.contrast) || this.contrast < 0) {
      throw new Error(`${this.id} contrast must be finite and non-negative`);
    }
    if (!Number.isFinite(this.gamma) || this.gamma <= 0) {
      throw new Error(`${this.id} gamma must be finite and positive`);
    }
    getRasterFloatLiteral(this.contrast);
    getRasterFloatLiteral(this.gamma);
    if (
      Math.fround(this.gamma) <= 0 ||
      !Number.isFinite(Math.fround(1 / Math.fround(this.gamma)))
    ) {
      throw new Error(`${this.id} gamma must be representable as a positive float32`);
    }

    if (this.input.storage.kind !== 'buffer') {
      throw new Error(`${this.id} requires a buffer-backed input band`);
    }
    const owner = validateRasterBand(this.input, this, `${this.id} input`);
    validateRasterScalarView(this.output, 'float32', pixelCount, `${this.id} output`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    if (this.output.buffer.graph !== owner || this.outputValidity.buffer.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }

    const readOnlyBuffers = [
      this.input.storage.values.buffer,
      ...(this.input.validity ? [this.input.validity.buffer] : [])
    ];
    if (isRasterContrastDomainView(this.domain)) {
      validatePackedView(this.domain, ['float32'], `${this.id} domain`);
      if (this.domain.length !== 2) {
        throw new Error(`${this.id} domain must contain exactly two samples`);
      }
      if (this.domain.buffer.graph !== owner) {
        throw new Error(`${this.id} resources must belong to the same graph`);
      }
      readOnlyBuffers.push(this.domain.buffer);
    } else {
      if (
        this.domain.length !== 2 ||
        !Number.isFinite(this.domain[0]) ||
        !Number.isFinite(this.domain[1]) ||
        this.domain[0] >= this.domain[1]
      ) {
        throw new Error(`${this.id} domain must contain an increasing finite range`);
      }
      getRasterFloatLiteral(this.domain[0]);
      getRasterFloatLiteral(this.domain[1]);
      if (
        Math.fround(this.domain[0]) >= Math.fround(this.domain[1]) ||
        !Number.isFinite(Math.fround(Math.fround(this.domain[1]) - Math.fround(this.domain[0])))
      ) {
        throw new Error(`${this.id} domain width must be a finite positive float32`);
      }
    }

    if (this.mode === 'equalize' && !this.histogram) {
      throw new Error(`${this.id} histogram equalization requires histogram counts`);
    }
    if (this.mode !== 'equalize' && this.histogram) {
      throw new Error(`${this.id} histogram counts require equalize mode`);
    }
    if (this.histogram) {
      validatePackedUint32View(this.histogram, `${this.id} histogram`);
      if (this.histogram.length === 0 || this.histogram.length > MAXIMUM_RASTER_PIXEL_COUNT) {
        throw new Error(`${this.id} histogram must contain a bounded positive bin count`);
      }
      if (this.histogram.buffer.graph !== owner) {
        throw new Error(`${this.id} resources must belong to the same graph`);
      }
      readOnlyBuffers.push(this.histogram.buffer);
    }

    if (
      this.output.buffer === this.outputValidity.buffer ||
      readOnlyBuffers.includes(this.output.buffer) ||
      readOnlyBuffers.includes(this.outputValidity.buffer)
    ) {
      throw new Error(`${this.id} inputs and outputs must use separate buffers`);
    }
    getRasterFloatLiteral(this.input.scale ?? 1);
    getRasterFloatLiteral(this.input.offset ?? 0);
  }

  /** Adds an optional inclusive histogram scan and one caller-visible raster transform pass. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views: GraphDataView[] = [
      this.input.storage.values,
      this.output,
      this.outputValidity,
      ...(this.input.validity ? [this.input.validity] : []),
      ...(isRasterContrastDomainView(this.domain) ? [this.domain] : []),
      ...(this.histogram ? [this.histogram] : [])
    ];
    for (const view of views) {
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

    let cumulativeHistogram: GraphDataView<'uint32'> | undefined;
    let histogramSummary: GraphDataView<'uint32'> | undefined;
    if (this.histogram) {
      if (
        graph.device.limits.maxComputeInvocationsPerWorkgroup < 256 ||
        graph.device.limits.maxComputeWorkgroupSizeX < 256
      ) {
        throw new Error(`${this.id} histogram scan exceeds device workgroup limits`);
      }
      cumulativeHistogram = createTransientView(
        graph,
        `${this.id}-cumulative-histogram`,
        'uint32',
        this.histogram.length
      );
      new GPUScan({
        id: `${this.id}-histogram-cdf`,
        input: this.histogram,
        output: cumulativeHistogram,
        mode: 'inclusive'
      }).addToGraph(graph);
      histogramSummary = createTransientView(graph, `${this.id}-histogram-summary`, 'uint32', 2);
      this.addHistogramSummaryPass(graph, cumulativeHistogram, histogramSummary);
    }

    const resources: GraphResourceUse[] = [
      {buffer: this.input.storage.values, usage: 'storage-read'},
      {buffer: this.output, usage: 'storage-write'},
      {buffer: this.outputValidity, usage: 'storage-write'}
    ];
    if (this.input.validity) {
      resources.push({buffer: this.input.validity, usage: 'storage-read'});
    }
    if (isRasterContrastDomainView(this.domain)) {
      resources.push({buffer: this.domain, usage: 'storage-read'});
    }
    if (cumulativeHistogram) {
      resources.push({buffer: cumulativeHistogram, usage: 'storage-read'});
    }
    if (histogramSummary) {
      resources.push({buffer: histogramSummary, usage: 'storage-read'});
    }

    graph.addComputePass({
      id: this.id,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'outputValues', type: 'storage', group: 0, location: 1},
          {name: 'outputValidity', type: 'storage', group: 0, location: 2}
        ];
        let bindingIndex = bindings.length;
        if (this.input.validity) {
          bindings.push({
            name: 'inputValidity',
            type: 'read-only-storage',
            group: 0,
            location: bindingIndex++
          });
        }
        if (isRasterContrastDomainView(this.domain)) {
          bindings.push({
            name: 'domainValues',
            type: 'read-only-storage',
            group: 0,
            location: bindingIndex++
          });
        }
        if (cumulativeHistogram) {
          bindings.push({
            name: 'cumulativeHistogram',
            type: 'read-only-storage',
            group: 0,
            location: bindingIndex++
          });
        }
        if (histogramSummary) {
          bindings.push({
            name: 'histogramSummary',
            type: 'read-only-storage',
            group: 0,
            location: bindingIndex
          });
        }

        const computation = new Computation(device, {
          id: this.id,
          source: this.getShaderSource(cumulativeHistogram, histogramSummary),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              inputValues: getViewBinding(this.input.storage.values, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer),
              outputValidity: getViewBinding(this.outputValidity, getBuffer)
            };
            if (this.input.validity) {
              resolvedBindings['inputValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            if (isRasterContrastDomainView(this.domain)) {
              resolvedBindings['domainValues'] = getViewBinding(this.domain, getBuffer);
            }
            if (cumulativeHistogram) {
              resolvedBindings['cumulativeHistogram'] = getViewBinding(
                cumulativeHistogram,
                getBuffer
              );
            }
            if (histogramSummary) {
              resolvedBindings['histogramSummary'] = getViewBinding(histogramSummary, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, horizontalCount, verticalCount);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addHistogramSummaryPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    cumulativeHistogram: GraphDataView<'uint32'>,
    histogramSummary: GraphDataView<'uint32'>
  ): void {
    graph.addComputePass({
      id: `${this.id}-histogram-summary`,
      resources: [
        {buffer: cumulativeHistogram, usage: 'storage-read'},
        {buffer: histogramSummary, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${this.id}-histogram-summary`,
          source: /* wgsl */ `
const HISTOGRAM_OFFSET: u32 = ${getViewElementOffset(cumulativeHistogram)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(histogramSummary)}u;
const HISTOGRAM_BIN_COUNT: u32 = ${cumulativeHistogram.length}u;
@group(0) @binding(0) var<storage, read> cumulativeHistogram: array<u32>;
@group(0) @binding(1) var<storage, read_write> histogramSummary: array<u32>;

@compute @workgroup_size(1)
fn main() {
  let totalCount = cumulativeHistogram[HISTOGRAM_OFFSET + HISTOGRAM_BIN_COUNT - 1u];
  var firstIndex = 0u;
  var pastLastIndex = HISTOGRAM_BIN_COUNT;
  while (firstIndex < pastLastIndex) {
    let middleIndex = firstIndex + (pastLastIndex - firstIndex) / 2u;
    if (cumulativeHistogram[HISTOGRAM_OFFSET + middleIndex] == 0u) {
      firstIndex = middleIndex + 1u;
    } else {
      pastLastIndex = middleIndex;
    }
  }
  var firstCount = 0u;
  if (firstIndex < HISTOGRAM_BIN_COUNT) {
    firstCount = cumulativeHistogram[HISTOGRAM_OFFSET + firstIndex];
  }
  histogramSummary[SUMMARY_OFFSET] = firstCount;
  histogramSummary[SUMMARY_OFFSET + 1u] = totalCount;
}`,
          shaderLayout: {
            bindings: [
              {name: 'cumulativeHistogram', type: 'read-only-storage', group: 0, location: 0},
              {name: 'histogramSummary', type: 'storage', group: 0, location: 1}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              cumulativeHistogram: getViewBinding(cumulativeHistogram, getBuffer),
              histogramSummary: getViewBinding(histogramSummary, getBuffer)
            });
            computation.dispatch(computePass, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getShaderSource(
    cumulativeHistogram?: GraphDataView<'uint32'>,
    histogramSummary?: GraphDataView<'uint32'>
  ): string {
    let bindingIndex = 3;
    const validityDeclaration = this.input.validity
      ? `@group(0) @binding(${bindingIndex++}) var<storage, read> inputValidity: array<u32>;\nconst INPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.input.validity)}u;`
      : '';
    const domainDeclaration = isRasterContrastDomainView(this.domain)
      ? `@group(0) @binding(${bindingIndex++}) var<storage, read> domainValues: array<f32>;\nconst DOMAIN_OFFSET: u32 = ${getViewElementOffset(this.domain)}u;`
      : '';
    const histogramDeclaration = cumulativeHistogram
      ? `@group(0) @binding(${bindingIndex++}) var<storage, read> cumulativeHistogram: array<u32>;\nconst HISTOGRAM_OFFSET: u32 = ${getViewElementOffset(cumulativeHistogram)}u;\nconst HISTOGRAM_BIN_COUNT: u32 = ${cumulativeHistogram.length}u;`
      : '';
    const summaryDeclaration = histogramSummary
      ? `@group(0) @binding(${bindingIndex}) var<storage, read> histogramSummary: array<u32>;\nconst SUMMARY_OFFSET: u32 = ${getViewElementOffset(histogramSummary)}u;`
      : '';
    const minimumExpression = isRasterContrastDomainView(this.domain)
      ? 'domainValues[DOMAIN_OFFSET]'
      : getRasterFloatLiteral(this.domain[0]);
    const maximumExpression = isRasterContrastDomainView(this.domain)
      ? 'domainValues[DOMAIN_OFFSET + 1u]'
      : getRasterFloatLiteral(this.domain[1]);
    const validityConditions = [
      'isFiniteValue(rawSampleFloat)',
      'isFiniteValue(calibratedSample)',
      'isFiniteValue(domainMinimum)',
      'isFiniteValue(domainMaximum)',
      'isFiniteValue(domainWidth)',
      'domainWidth > 0.0',
      ...(this.input.validity ? ['inputValidity[INPUT_VALIDITY_OFFSET + pixelIndex] != 0u'] : []),
      ...(this.input.noDataValue !== undefined && !Number.isNaN(this.input.noDataValue)
        ? [`rawSample != ${getRasterScalarLiteral(this.input.noDataValue, this.input.format)}`]
        : [])
    ];
    const equalization = cumulativeHistogram
      ? `
    let histogramIndex = min(
      u32(normalizedSample * f32(HISTOGRAM_BIN_COUNT)),
      HISTOGRAM_BIN_COUNT - 1u
    );
    let totalCount = histogramSummary[SUMMARY_OFFSET + 1u];
    if (totalCount == 0u) {
      validSample = false;
    } else {
      let firstCount = histogramSummary[SUMMARY_OFFSET];
      let cumulativeCount = cumulativeHistogram[HISTOGRAM_OFFSET + histogramIndex];
      let cumulativeWidth = totalCount - firstCount;
      if (cumulativeWidth > 0u) {
        normalizedSample = f32(cumulativeCount - min(cumulativeCount, firstCount)) / f32(cumulativeWidth);
      }
    }`
      : '';
    const resultExpression =
      this.mode === 'linear' || (this.mode === 'gamma' && this.gamma === 1)
        ? this.contrast === 1
          ? 'clamp(calibratedSample, domainMinimum, domainMaximum)'
          : `clamp((calibratedSample - (domainMinimum + domainWidth * 0.5)) * ${getRasterFloatLiteral(this.contrast)} + domainMinimum + domainWidth * 0.5, domainMinimum, domainMaximum)`
        : 'domainMinimum + correctedSample * domainWidth';

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${getRasterShaderScalarType(this.input.format)}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> outputValidity: array<u32>;
${validityDeclaration}
${domainDeclaration}
${histogramDeclaration}
${summaryDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let rawSample = inputValues[INPUT_OFFSET + pixelIndex];
  let rawSampleFloat = f32(rawSample);
  let calibratedSample = rawSampleFloat * ${getRasterFloatLiteral(this.input.scale ?? 1)} + ${getRasterFloatLiteral(this.input.offset ?? 0)};
  let domainMinimum = ${minimumExpression};
  let domainMaximum = ${maximumExpression};
  let domainWidth = domainMaximum - domainMinimum;
  var validSample = ${validityConditions.join(' && ')};
  var outputSample = bitcast<f32>(0x7fc00000u | (pixelIndex & 0u));
  if (validSample) {
    var normalizedSample = clamp((calibratedSample - domainMinimum) / domainWidth, 0.0, 1.0);${equalization}
    if (validSample) {
      let centeredSample = clamp((normalizedSample - 0.5) * ${getRasterFloatLiteral(this.contrast)} + 0.5, 0.0, 1.0);
      let correctedSample = pow(centeredSample, 1.0 / ${getRasterFloatLiteral(this.gamma)});
      let result = ${resultExpression};
      if (isFiniteValue(result)) {
        outputSample = result;
      } else {
        validSample = false;
      }
    }
  }
  outputValues[OUTPUT_OFFSET + pixelIndex] = outputSample;
  outputValidity[OUTPUT_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, validSample);
}`;
  }
}

function isRasterContrastDomainView(
  domain: GPURasterContrastDomain
): domain is GraphDataView<'float32'> {
  return !Array.isArray(domain);
}
