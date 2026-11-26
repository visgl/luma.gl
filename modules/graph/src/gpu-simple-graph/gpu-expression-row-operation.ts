// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import {GPUDataEvaluator} from './operation/gpu-data-evaluator';
import {Operation, type OperationHandlerResult} from './operation/operation';
import type {GPUEvaluationScope} from './operation/gpu-evaluation-scope';
import {deduceOutputProps} from './utils/output-props';
import {
  getGPUExpressionRowInfo,
  type GPUExpressionRowFormat
} from '../gpu-core/gpu-expression-operation';

/** Reuse row handlers with graph-declared types and GPU float32 evaluation. @internal */
export class GPUExpressionRowOperation extends Operation<Record<string, GPUDataEvaluator>> {
  readonly output: GPUDataEvaluator;

  constructor(
    readonly name: 'dot' | 'length' | 'equalAll' | 'select' | 'expression-mask',
    inputs: Record<string, GPUDataEvaluator>,
    format: GPUExpressionRowFormat
  ) {
    super(inputs);
    const {componentType, components} = getGPUExpressionRowInfo(format);
    const {length, isConstant} = deduceOutputProps(...Object.values(inputs));
    this.output = new GPUDataEvaluator({
      type: componentType,
      size: components,
      format,
      length,
      isConstant,
      source: this
    });
  }

  toString(): string {
    return `${this.name}(${Object.values(this.inputs).join(', ')})`;
  }

  protected override shouldExecuteOnCPU(): boolean {
    return false;
  }

  override async execute(
    device: Device,
    target: Buffer,
    scope?: GPUEvaluationScope
  ): Promise<OperationHandlerResult> {
    if (this.name !== 'expression-mask' && !(this.name === 'select' && device.type === 'webgl'))
      return super.execute(device, target, scope);
    const input = this.inputs['condition'];
    for (const dependency of this.dependencies) await dependency.evaluate(device, {scope});
    // Test truth in the condition's own type before the legacy select handler
    // coerces its inputs to the branch type (which could truncate 0.5 to zero).
    if (device.type === 'webgl') {
      const {runRowTransform} = await import('./operations/webgl/common/row-transform');
      runRowTransform({
        module: {name: 'expressionRow', vs: ''},
        inputs: this.inputs,
        output: this.output,
        operationType: this.name === 'select' ? this.output.type : input.type,
        outputBuffer: target,
        expression: laneIndex => {
          if (this.name === 'expression-mask')
            return `uint(condition[${laneIndex}] != ${input.type === 'uint32' ? '0u' : input.type === 'sint32' ? '0' : '0.0'})`;
          // The legacy signed select handler emits a float zero. Keep its API
          // untouched and emit a correctly typed condition in the expression adapter.
          const lane = (name: string) => `${name}[${this.inputs[name].size === 1 ? 0 : laneIndex}]`;
          const zero =
            this.output.type === 'uint32' ? '0u' : this.output.type === 'sint32' ? '0' : '0.0';
          return `(${lane('condition')} != ${zero} ? ${lane('whenTrue')} : ${lane('whenFalse')})`;
        }
      });
    } else {
      const {runRowComputation} = await import('./operations/webgpu/common/row-transform');
      runRowComputation({
        scope,
        module: {name: 'expressionMask', source: '// numeric condition mask'},
        inputs: this.inputs,
        output: this.output,
        operationType: input.type,
        outputBuffer: target,
        expression: laneIndex =>
          `select(0u, 1u, condition[${laneIndex}] != ${input.type === 'uint32' ? '0u' : input.type === 'sint32' ? '0i' : '0.0'})`
      });
    }
    return {success: true};
  }
}
