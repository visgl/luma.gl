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
  getRasterTextureSampleType,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterScalarFormat, GPURasterTextureBand} from './types';

/** Explicit graph-native conversion from one sampled raster texture to packed scalar storage. */
export type GPURasterTextureToBufferProps<
  InputFormat extends GPURasterScalarFormat = GPURasterScalarFormat,
  OutputFormat extends GPURasterScalarFormat = GPURasterScalarFormat
> = {
  id?: string;
  input: GPURasterTextureBand<InputFormat>;
  /** Caller-owned packed output; format remains unchanged unless calibration is explicitly enabled. */
  output: GraphDataView<OutputFormat>;
  /** Caller-owned canonical source-aligned uint32 validity flags. */
  outputValidity: GraphDataView<'uint32'>;
  /** Applies scale/offset once and explicitly promotes integer samples to float32. */
  applyCalibration?: boolean;
};

/**
 * Gathers one borrowed texture channel into a tightly packed caller-owned GPU buffer.
 *
 * Nodata is evaluated on raw samples before optional calibration. Odd texture widths never acquire
 * WebGPU copy-row padding because gathering is performed by an explicit compute pass.
 */
export class GPURasterTextureToBuffer<
  InputFormat extends GPURasterScalarFormat = GPURasterScalarFormat,
  OutputFormat extends GPURasterScalarFormat = GPURasterScalarFormat
> implements GPUCommandGraphContributor
{
  readonly id: string;
  readonly input: GPURasterTextureBand<InputFormat>;
  readonly output: GraphDataView<OutputFormat>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly applyCalibration: boolean;
  readonly width: number;
  readonly height: number;

  constructor(props: GPURasterTextureToBufferProps<InputFormat, OutputFormat>) {
    this.id = props.id ?? 'gpu-raster-texture-to-buffer';
    this.input = props.input;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.applyCalibration = props.applyCalibration ?? false;
    if (this.input.storage.kind !== 'texture') {
      throw new Error(`${this.id} requires a texture-backed input band`);
    }
    this.width = this.input.storage.view.width;
    this.height = this.input.storage.view.height;
    const pixelCount = this.width * this.height;
    const owner = validateRasterBand(this.input, this, this.id);
    const outputFormat = this.applyCalibration ? 'float32' : this.input.format;
    validateRasterScalarView(this.output, outputFormat, pixelCount, `${this.id} output`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    if (this.output.buffer.graph !== owner || this.outputValidity.buffer.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    if (
      this.output.buffer === this.outputValidity.buffer ||
      this.input.validity?.buffer === this.output.buffer ||
      this.input.validity?.buffer === this.outputValidity.buffer
    ) {
      throw new Error(`${this.id} source validity and outputs must use separate buffers`);
    }
    if (this.applyCalibration) {
      getRasterFloatLiteral(this.input.scale ?? 1);
      getRasterFloatLiteral(this.input.offset ?? 0);
    }
  }

  /** Contributes one explicit sampled-texture/storage-buffer compute pass without submitting it. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (
      this.input.storage.view.texture.graph !== graph ||
      this.output.buffer.graph !== graph ||
      this.outputValidity.buffer.graph !== graph ||
      (this.input.validity && this.input.validity.buffer.graph !== graph)
    ) {
      throw new Error(`${this.id} resources must belong to the target graph`);
    }
    assertRasterStorageBindingFits(graph.device, this.output, `${this.id} output`);
    assertRasterStorageBindingFits(graph.device, this.outputValidity, `${this.id} output validity`);
    if (this.input.validity) {
      assertRasterStorageBindingFits(
        graph.device,
        this.input.validity,
        `${this.id} input validity`
      );
    }
    const [horizontalCount, verticalCount] = getRasterDispatchSize(
      graph.device,
      this.width,
      this.height,
      this.id
    );
    const resources: GraphResourceUse[] = [
      {texture: this.input.storage.view, usage: 'sampled'},
      {buffer: this.output, usage: 'storage-write'},
      {buffer: this.outputValidity, usage: 'storage-write'}
    ];
    if (this.input.validity) {
      resources.push({buffer: this.input.validity, usage: 'storage-read'});
    }

    graph.addComputePass({
      id: this.id,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {
            name: 'sourceTexture',
            type: 'texture',
            group: 0,
            location: 0,
            sampleType: getRasterTextureSampleType(this.input.format)
          },
          {name: 'outputValues', type: 'storage', group: 0, location: 1},
          {name: 'outputValidity', type: 'storage', group: 0, location: 2}
        ];
        if (this.input.validity) {
          bindings.push({name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 3});
        }
        const computation = new Computation(device, {
          id: this.id,
          source: this.getShaderSource(),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer, getTextureView}) => {
            const resolvedBindings: Record<string, Binding> = {
              sourceTexture: getTextureView(this.input.storage.view),
              outputValues: getViewBinding(this.output, getBuffer),
              outputValidity: getViewBinding(this.outputValidity, getBuffer)
            };
            if (this.input.validity) {
              resolvedBindings['sourceValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, horizontalCount, verticalCount);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getShaderSource(): string {
    const inputScalarType = getRasterShaderScalarType(this.input.format);
    const outputScalarType = getRasterShaderScalarType(this.output.format);
    const channel = ['x', 'y', 'z', 'w'][this.input.storage.channel ?? 0];
    const sourceValidity = this.input.validity;
    const validityDeclaration = sourceValidity
      ? `@group(0) @binding(3) var<storage, read> sourceValidity: array<u32>;\nconst SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(sourceValidity)}u;`
      : '';
    const validityConditions: string[] = [];
    if (sourceValidity) {
      validityConditions.push('sourceValidity[SOURCE_VALIDITY_OFFSET + pixelIndex] != 0u');
    }
    if (this.input.format === 'float32') {
      validityConditions.push('rawSample == rawSample && abs(rawSample) <= 3.402823466e+38');
    }
    if (this.input.noDataValue !== undefined && !Number.isNaN(this.input.noDataValue)) {
      validityConditions.push(
        `rawSample != ${getRasterScalarLiteral(this.input.noDataValue, this.input.format)}`
      );
    }
    const outputExpression = this.applyCalibration
      ? `f32(rawSample) * ${getRasterFloatLiteral(this.input.scale ?? 1)} + ${getRasterFloatLiteral(this.input.offset ?? 0)}`
      : 'rawSample';
    if (this.applyCalibration) {
      validityConditions.push(
        'outputSample == outputSample && abs(outputSample) <= 3.402823466e+38'
      );
    }
    const validityExpression = validityConditions.join(' && ') || 'true';
    const calibratedDeclaration = this.applyCalibration
      ? `let outputSample = ${outputExpression};`
      : '';
    const invalidExpression =
      this.output.format === 'float32'
        ? 'bitcast<f32>(0x7fc00000u | (pixelIndex & 0u))'
        : this.output.format === 'uint32'
          ? '0u'
          : '0i';

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
@group(0) @binding(0) var sourceTexture: texture_2d<${inputScalarType}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${outputScalarType}>;
@group(0) @binding(2) var<storage, read_write> outputValidity: array<u32>;
${validityDeclaration}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let rawSample = textureLoad(sourceTexture, vec2<i32>(globalId.xy), 0).${channel};
  ${calibratedDeclaration}
  let validSample = ${validityExpression};
  outputValidity[OUTPUT_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, validSample);
  if (validSample) {
    outputValues[OUTPUT_OFFSET + pixelIndex] = ${this.applyCalibration ? 'outputSample' : 'rawSample'};
  } else {
    outputValues[OUTPUT_OFFSET + pixelIndex] = ${invalidExpression};
  }
}`;
  }
}
