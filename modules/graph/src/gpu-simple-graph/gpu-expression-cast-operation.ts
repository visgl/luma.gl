// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Buffer, type Device} from '@luma.gl/core';
import {Kernel} from '../execution/compute/kernel';
import {GPUDataEvaluator} from './operation/gpu-data-evaluator';
import {Operation, type OperationHandlerResult} from './operation/operation';
import type {GPUEvaluationScope} from './operation/gpu-evaluation-scope';
import type {
  GPUExpressionFormat,
  GPUExpressionOperation
} from '../gpu-core/gpu-expression-operation';
import {
  GPU_EXPRESSION_SHADER_TYPES,
  GPU_EXPRESSION_CAST_WGSL,
  getGPUExpressionCastWGSL
} from '../gpu-core/gpu-expression-cast';

/** Expression-only numeric casts; leaves the public castData evaluator unchanged. @internal */
export class GPUExpressionCastOperation extends Operation<{input: GPUDataEvaluator}> {
  readonly name = 'expression-cast';
  readonly output: GPUDataEvaluator;

  constructor(
    input: GPUDataEvaluator,
    readonly format: GPUExpressionFormat,
    readonly integerRounding: GPUExpressionOperation['integerRounding']
  ) {
    const source = input;
    super({input: source});
    this.output = new GPUDataEvaluator({
      type: format,
      format,
      size: 1,
      length: source.length,
      isConstant: source.isConstant,
      source: this
    });
  }

  toString(): string {
    return `${this.format}(${this.inputs.input})`;
  }

  override async execute(
    device: Device,
    target: Buffer,
    scope?: GPUEvaluationScope
  ): Promise<OperationHandlerResult> {
    const input = this.inputs.input;
    await input.evaluate(device, {scope});
    const sourceFormat = input.type as GPUExpressionFormat;
    if (device.type === 'webgl') {
      const {runRowTransform} = await import('./operations/webgl/common/row-transform');
      runRowTransform({
        module: {name: 'expressionCast', vs: GPU_EXPRESSION_CAST_GLSL},
        inputs: {sourceValue: input},
        output: this.output,
        operationType: input.type,
        outputBuffer: target,
        expression: () =>
          getGLSLExpressionCast('sourceValue[0]', sourceFormat, this.format, this.integerRounding)
      });
      return {success: true};
    }
    // WebGPU expression casts must share the graph's explicit evaluation scope.
    assert(scope);
    const encoder = scope.commandEncoder;
    const workgroups = Math.ceil(this.output.length / 64);
    const x = Math.min(workgroups, device.limits.maxComputeWorkgroupsPerDimension);
    const y = Math.ceil(workgroups / x);
    // The converted chunk must fit a two-dimensional dispatch.
    assert(y <= device.limits.maxComputeWorkgroupsPerDimension);
    const value = `inputValues[${input.offset / 4}u + index * ${input.stride / 4}u]`;
    const kernel = new Kernel(device, {
      source: `
@group(0) @binding(0) var<storage, read> inputValues: array<${GPU_EXPRESSION_SHADER_TYPES[sourceFormat]}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${GPU_EXPRESSION_SHADER_TYPES[this.format]}>;
${GPU_EXPRESSION_CAST_WGSL}
@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) workgroup: vec3u, @builtin(num_workgroups) dimensions: vec3u, @builtin(local_invocation_index) localIndex: u32) {
  let index = (workgroup.y * dimensions.x + workgroup.x) * 64u + localIndex;
  if (index >= ${this.output.length}u) { return; }
  outputValues[${this.output.offset / 4}u + index] = ${getGPUExpressionCastWGSL(value, sourceFormat, this.format, this.integerRounding)};
}`,
      shaderLayout: {
        bindings: [
          {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'outputValues', type: 'storage', group: 0, location: 1}
        ]
      }
    });
    try {
      const pass = encoder.beginComputePass();
      try {
        kernel.dispatch(pass, {bindings: {inputValues: input.buffer, outputValues: target}, x, y});
      } finally {
        pass.end();
      }
      scope.retain(() => kernel.destroy());
    } catch (error) {
      kernel.destroy();
      throw error;
    }
    return {success: true};
  }
}

const GPU_EXPRESSION_CAST_GLSL = `
float expression_round_nearest(float value) {
  float magnitude = abs(value);
  float integral = floor(magnitude);
  float rounded = integral + (magnitude - integral >= 0.5 ? 1.0 : 0.0);
  return sign(value) * rounded;
}
int expression_to_sint32(float value) {
  if (value >= 2147483648.0) { return 2147483647; }
  if (value <= -2147483648.0) { return -2147483647 - 1; }
  return int(value);
}
uint expression_to_uint32(float value) {
  if (value >= 4294967296.0) { return 4294967295u; }
  if (value <= 0.0) { return 0u; }
  return uint(value);
}`;

function getGLSLExpressionCast(
  value: string,
  source: GPUExpressionFormat,
  target: GPUExpressionFormat,
  integerRounding: GPUExpressionOperation['integerRounding']
): string {
  if (source === target) return value;
  if (target === 'float32') return `float(${value})`;
  if (source === 'float32') {
    const rounded = integerRounding === 'nearest' ? `expression_round_nearest(${value})` : value;
    return `expression_to_${target}(${rounded})`;
  }
  return target === 'uint32' ? `uint(max(${value}, 0))` : `int(min(${value}, 2147483647u))`;
}
