// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView,
  GraphResourceUse,
  GraphTextureView
} from '../gpu-core/gpu-command-graph';
import {getViewBinding, getViewElementOffset} from '../gpu-core/graph-data-view-utils';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  getRasterScalarFormatFromTexture,
  getRasterScalarLiteral,
  getRasterShaderScalarType,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterTextureChannel,
  validateRasterTextureView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterBufferBand, GPURasterScalarFormat, GPURasterTextureFormat} from './types';

/** Explicit graph-native conversion from packed raster samples into a caller-owned storage texture. */
export type GPURasterBufferToTextureProps<
  InputFormat extends GPURasterScalarFormat = GPURasterScalarFormat,
  OutputFormat extends GPURasterScalarFormat = GPURasterScalarFormat
> = {
  id?: string;
  input: GPURasterBufferBand<InputFormat>;
  output: GraphTextureView<GPURasterTextureFormat<OutputFormat>>;
  /** Optional caller-owned destination for the resolved source validity flags. */
  outputValidity?: GraphDataView<'uint32'>;
  /** Selected destination channel; other texture channels are explicitly zero-filled. */
  channel?: 0 | 1 | 2 | 3;
  /** Applies scale/offset once and explicitly promotes integer samples to float32. */
  applyCalibration?: boolean;
};

/**
 * Scatters one packed borrowed scalar buffer into a single texture mip/layer.
 *
 * Invalid floating values are written as canonical NaNs. Integer invalid values are zero-filled;
 * the optional caller-owned output mask remains the canonical validity representation.
 */
export class GPURasterBufferToTexture<
  InputFormat extends GPURasterScalarFormat = GPURasterScalarFormat,
  OutputFormat extends GPURasterScalarFormat = GPURasterScalarFormat
> implements GPUCommandGraphContributor
{
  readonly id: string;
  readonly input: GPURasterBufferBand<InputFormat>;
  readonly output: GraphTextureView<GPURasterTextureFormat<OutputFormat>>;
  readonly outputValidity?: GraphDataView<'uint32'>;
  readonly channel: 0 | 1 | 2 | 3;
  readonly applyCalibration: boolean;
  readonly width: number;
  readonly height: number;

  constructor(props: GPURasterBufferToTextureProps<InputFormat, OutputFormat>) {
    this.id = props.id ?? 'gpu-raster-buffer-to-texture';
    this.input = props.input;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.channel = props.channel ?? 0;
    this.applyCalibration = props.applyCalibration ?? false;
    this.width = this.output.width;
    this.height = this.output.height;
    if (this.input.storage.kind !== 'buffer') {
      throw new Error(`${this.id} requires a buffer-backed input band`);
    }
    const owner = validateRasterBand(this.input, this, this.id);
    const outputFormat = getRasterScalarFormatFromTexture(this.output.format);
    if (outputFormat !== (this.applyCalibration ? 'float32' : this.input.format)) {
      throw new Error(`${this.id} output must preserve or explicitly promote its input format`);
    }
    if (
      outputFormat !== 'float32' &&
      (this.input.validity || this.input.noDataValue !== undefined) &&
      !this.outputValidity
    ) {
      throw new Error(`${this.id} integer outputs require an explicit output validity mask`);
    }
    validateRasterTextureView(this.output, outputFormat, `${this.id} output`);
    validateRasterTextureChannel(this.output.format, this.channel, `${this.id} output channel`);
    if (this.output.texture.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    if (this.outputValidity) {
      validateRasterValidityView(
        this.outputValidity,
        this.width * this.height,
        `${this.id} output validity`
      );
      if (this.outputValidity.buffer.graph !== owner) {
        throw new Error(`${this.id} output validity must belong to the same graph`);
      }
      if (
        this.outputValidity.buffer === this.input.storage.values.buffer ||
        this.outputValidity.buffer === this.input.validity?.buffer
      ) {
        throw new Error(`${this.id} input and output validity must use separate buffers`);
      }
    }
    if (this.applyCalibration) {
      getRasterFloatLiteral(this.input.scale ?? 1);
      getRasterFloatLiteral(this.input.offset ?? 0);
    }
  }

  /** Contributes one storage-texture compute pass; the application controls command submission. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (
      this.input.storage.values.buffer.graph !== graph ||
      this.output.texture.graph !== graph ||
      (this.input.validity && this.input.validity.buffer.graph !== graph) ||
      (this.outputValidity && this.outputValidity.buffer.graph !== graph)
    ) {
      throw new Error(`${this.id} resources must belong to the target graph`);
    }
    if (!graph.device.getTextureFormatCapabilities(this.output.format).store) {
      throw new Error(`${this.id} output format does not support storage writes`);
    }
    assertRasterStorageBindingFits(graph.device, this.input.storage.values, `${this.id} input`);
    if (this.input.validity) {
      assertRasterStorageBindingFits(
        graph.device,
        this.input.validity,
        `${this.id} input validity`
      );
    }
    if (this.outputValidity) {
      assertRasterStorageBindingFits(
        graph.device,
        this.outputValidity,
        `${this.id} output validity`
      );
    }
    const [horizontalCount, verticalCount] = getRasterDispatchSize(
      graph.device,
      this.width,
      this.height,
      this.id
    );
    const resources: GraphResourceUse[] = [
      {buffer: this.input.storage.values, usage: 'storage-read'},
      {texture: this.output, usage: 'storage-write'}
    ];
    if (this.input.validity) {
      resources.push({buffer: this.input.validity, usage: 'storage-read'});
    }
    if (this.outputValidity) {
      resources.push({buffer: this.outputValidity, usage: 'storage-write'});
    }

    graph.addComputePass({
      id: this.id,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
          {
            name: 'outputTexture',
            type: 'storage',
            group: 0,
            location: 1,
            access: 'write-only',
            format: this.output.format
          }
        ];
        if (this.input.validity) {
          bindings.push({name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 2});
        }
        if (this.outputValidity) {
          bindings.push({name: 'outputValidity', type: 'storage', group: 0, location: 3});
        }
        const computation = new Computation(device, {
          id: this.id,
          source: this.getShaderSource(),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer, getTextureView}) => {
            const resolvedBindings: Record<string, Binding> = {
              inputValues: getViewBinding(this.input.storage.values, getBuffer),
              outputTexture: getTextureView(this.output)
            };
            if (this.input.validity) {
              resolvedBindings['sourceValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            if (this.outputValidity) {
              resolvedBindings['outputValidity'] = getViewBinding(this.outputValidity, getBuffer);
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
    const outputScalarFormat = getRasterScalarFormatFromTexture(this.output.format);
    const outputScalarType = getRasterShaderScalarType(outputScalarFormat);
    const sourceValidity = this.input.validity;
    const sourceValidityDeclaration = sourceValidity
      ? `@group(0) @binding(2) var<storage, read> sourceValidity: array<u32>;\nconst SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(sourceValidity)}u;`
      : '';
    const outputValidityDeclaration = this.outputValidity
      ? `@group(0) @binding(3) var<storage, read_write> outputValidity: array<u32>;\nconst OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;`
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
      outputScalarFormat === 'float32'
        ? 'bitcast<f32>(0x7fc00000u | (pixelIndex & 0u))'
        : outputScalarFormat === 'uint32'
          ? '0u'
          : '0i';
    const zeroExpression =
      outputScalarFormat === 'float32' ? '0.0' : outputScalarFormat === 'uint32' ? '0u' : '0i';
    const outputValidityWrite = this.outputValidity
      ? 'outputValidity[OUTPUT_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, validSample);'
      : '';

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${inputScalarType}>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<${this.output.format}, write>;
${sourceValidityDeclaration}
${outputValidityDeclaration}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let rawSample = inputValues[INPUT_OFFSET + pixelIndex];
  ${calibratedDeclaration}
  let validSample = ${validityExpression};
  ${outputValidityWrite}
  var outputTexel = vec4<${outputScalarType}>(${zeroExpression});
  if (validSample) {
    outputTexel[${this.channel}] = ${this.applyCalibration ? 'outputSample' : 'rawSample'};
  } else {
    outputTexel[${this.channel}] = ${invalidExpression};
  }
  textureStore(outputTexture, vec2<i32>(globalId.xy), outputTexel);
}`;
  }
}
