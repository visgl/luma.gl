// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, assert, type Device} from '@luma.gl/core';
import {
  GPUDataEvaluator,
  GPUEvaluationScope,
  add,
  subtract,
  multiply,
  divide
} from '@luma.gl/graph/gpu-simple-graph';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import type {GPUGraph} from '../gpu-core/gpu-graph';
import {GPUExpressionOperation, type GPUExpression} from '../gpu-core/gpu-expression-operation';
import {
  GPUExpressionProgram,
  type GPUGraphCompileOptions,
  type GPUGraphRunBindings,
  type GPUGraphRunOptions
} from '../gpu-core/gpu-expression-plan';

/** Reusable expression program implemented through the unchanged evaluator API. */
export class CompiledGPUSimpleExpressionGraph {
  private readonly program: GPUExpressionProgram;
  private running = false;
  private destroyed = false;

  constructor(
    readonly device: Device,
    source: GPUGraph,
    options: GPUGraphCompileOptions = {}
  ) {
    this.program = new GPUExpressionProgram(source, options);
    if (this.program.operations.some(operation => !(operation instanceof GPUExpressionOperation)))
      throw new Error('SimpleGraph declarative execution supports expression operations only');
  }

  async run(
    bindings: GPUGraphRunBindings,
    options: GPUGraphRunOptions = {}
  ): Promise<Record<string, GPUVector>> {
    // Evaluators do not support concurrent evaluation on one execution scope.
    assert(!this.running && !this.destroyed);
    this.running = true;
    const evaluators = new Set<GPUDataEvaluator>();
    let scope: GPUEvaluationScope | undefined;
    let invocation: ReturnType<GPUExpressionProgram['prepare']> | undefined;
    try {
      invocation = this.program.prepare(this.device, bindings, options);
      if (this.device.type === 'webgpu') scope = new GPUEvaluationScope(this.device);
      const retain = (evaluator: GPUDataEvaluator): GPUDataEvaluator => {
        evaluators.add(evaluator);
        return evaluator;
      };
      for (const plan of this.program.expressions) {
        const target = invocation.values.get(plan.operation.output) as GPUVector;
        for (const [chunkIndex, chunk] of target.data.entries()) {
          if (!chunk.length) continue;
          const lower = (expression: GPUExpression): GPUDataEvaluator | number => {
            switch (expression.kind) {
              case 'literal':
                return expression.value;
              case 'reference': {
                const value = invocation!.values.get(expression.name)!;
                if (typeof value === 'number') return value;
                const scalar = this.program.scalars.some(
                  declaration => declaration.id === expression.name
                );
                const input = value.data[scalar ? 0 : chunkIndex];
                return retain(
                  new GPUDataEvaluator({
                    type: 'float32',
                    size: 1,
                    length: input.length,
                    format: 'float32',
                    buffer: input.buffer,
                    offset: input.byteOffset,
                    stride: input.byteStride,
                    isConstant: scalar
                  })
                );
              }
              case 'negate':
                return retain(multiply(lower(expression.argument), -1));
              case 'binary': {
                const operation = {'+': add, '-': subtract, '*': multiply, '/': divide}[
                  expression.operator
                ];
                return retain(operation(lower(expression.left), lower(expression.right)));
              }
            }
          };
          // Force a deferred output even for an identity or literal expression.
          const evaluator = retain(multiply(lower(plan.expression), 1));
          if (evaluator.length !== chunk.length)
            throw new Error('Scalar-only expressions require a scalar output');
          const targetBuffer = chunk.buffer instanceof Buffer ? chunk.buffer : chunk.buffer.buffer;
          // The legacy CPU arithmetic handler writes at byte zero. Keep that evaluator unchanged
          // and copy its scalar result into the requested subrange on WebGL.
          if (
            this.device.type === 'webgl' &&
            chunk.byteOffset !== 0 &&
            evaluator.length === 1 &&
            plan.references.every(name => typeof invocation!.values.get(name) === 'number')
          ) {
            await evaluator.evaluate(this.device);
            const encoder = this.device.createCommandEncoder();
            try {
              encoder.copyBufferToBuffer({
                sourceBuffer: evaluator.buffer,
                sourceOffset: evaluator.offset,
                destinationBuffer: targetBuffer,
                destinationOffset: chunk.byteOffset,
                size: 4
              });
              this.device.submit(encoder.finish());
            } finally {
              encoder.destroy();
            }
            continue;
          }
          evaluator.setTargetBuffer({
            buffer: targetBuffer,
            byteOffset: chunk.byteOffset,
            byteStride: chunk.byteStride
          });
          if (scope) await scope.evaluate(evaluator);
          else await evaluator.evaluate(this.device);
        }
      }
      scope?.submit();
      return invocation.finish();
    } catch (error) {
      scope?.cancel();
      invocation?.destroy();
      throw error;
    } finally {
      for (const evaluator of evaluators) evaluator.destroy();
      this.running = false;
    }
  }

  destroy(): void {
    // A running program owns evaluator resources until execution finishes.
    assert(!this.running);
    this.destroyed = true;
  }
}
