// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, assert, type Device} from '@luma.gl/core';
import {GPUDataEvaluator, GPUEvaluationScope} from '@luma.gl/graph/gpu-simple-graph';
import {
  ArithmeticOperation,
  type ArithmeticOp,
  type ArithmeticArgument
} from './operations/arithmetic-operation';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import type {GPUGraph} from '../gpu-core/gpu-graph';
import {
  GPUExpressionOperation,
  getGPUExpressionRowInfo,
  type GPUExpression
} from '../gpu-core/gpu-expression-operation';
import {
  GPUExpressionProgram,
  type GPUGraphCompileOptions,
  type GPUGraphRunBindings,
  type GPUGraphRunOptions
} from '../gpu-core/gpu-expression-plan';

import {GPUExpressionCastOperation} from './gpu-expression-cast-operation';

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
    const scalarBuffers = new Set<Buffer>();
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
          // Existing evaluator formatters append .0 to integer literals. Bind exponential
          // integers and float32 overflow as typed data instead of invalid shader literals.
          const lowerNumber = (inputValue: number): GPUDataEvaluator | number => {
            const value = Math.fround(inputValue);
            if (!Number.isFinite(value)) {
              // A host value would be inlined by the WebGPU evaluator. Keep overflow in storage.
              const buffer = this.device.createBuffer({
                data: new Float32Array([value]),
                usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
              });
              scalarBuffers.add(buffer);
              return retain(
                new GPUDataEvaluator({
                  type: 'float32',
                  format: 'float32',
                  size: 1,
                  length: 1,
                  isConstant: true,
                  buffer
                })
              );
            }
            return Number.isInteger(value) && String(value).includes('e')
              ? retain(
                  new GPUDataEvaluator({
                    type: 'float32',
                    format: 'float32',
                    size: 1,
                    length: 1,
                    isConstant: true,
                    value: new Float32Array([value])
                  })
                )
              : value;
          };
          const arithmetic = (operation: ArithmeticOp, ...arguments_: ArithmeticArgument[]) =>
            retain(new GPUExpressionArithmeticOperation(operation, arguments_).output);
          const lower = (expression: GPUExpression): GPUDataEvaluator | number => {
            switch (expression.kind) {
              case 'literal':
                return lowerNumber(expression.value);
              case 'reference': {
                const value = invocation!.values.get(expression.name)!;
                const format = plan.formats.get(expression.name)!;
                const {componentType, components} = getGPUExpressionRowInfo(format);
                if (typeof value === 'number') {
                  if (format === 'float32') return lowerNumber(value);
                  return retain(
                    new GPUDataEvaluator({
                      type: componentType,
                      format,
                      size: 1,
                      length: 1,
                      isConstant: true,
                      value:
                        format === 'uint32' ? new Uint32Array([value]) : new Int32Array([value])
                    })
                  );
                }
                const scalar = this.program.scalars.some(
                  declaration => declaration.id === expression.name
                );
                const input = value.data[scalar ? 0 : chunkIndex];
                return retain(
                  new GPUDataEvaluator({
                    type: componentType,
                    size: components,
                    length: input.length,
                    format,
                    buffer: input.buffer,
                    offset: input.byteOffset,
                    stride: input.byteStride,
                    isConstant: scalar
                  })
                );
              }
              case 'negate':
                return arithmetic('multiply', lower(expression.argument), -1);
              case 'cast': {
                const value = lower(expression.argument);
                const input =
                  typeof value === 'number'
                    ? retain(
                        new GPUDataEvaluator({
                          type: 'float32',
                          format: 'float32',
                          size: 1,
                          length: 1,
                          isConstant: true,
                          value: new Float32Array([value])
                        })
                      )
                    : value;
                return retain(
                  new GPUExpressionCastOperation(
                    input,
                    expression.format,
                    plan.operation.integerRounding
                  ).output
                );
              }
              case 'call': {
                const first = lower(expression.arguments[0]);
                if (expression.name === 'pow')
                  return arithmetic('pow', first, lower(expression.arguments[1]));
                return arithmetic(expression.name, first);
              }
              case 'binary': {
                const operation = (
                  {'+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide'} as const
                )[expression.operator];
                return arithmetic(operation, lower(expression.left), lower(expression.right));
              }
            }
          };
          // Force a deferred output even for an identity or literal expression.
          const evaluator = arithmetic('multiply', lower(plan.expression), 1);
          if (evaluator.length !== chunk.length)
            throw new Error('Scalar-only expressions require a scalar output');
          const targetBuffer = chunk.buffer instanceof Buffer ? chunk.buffer : chunk.buffer.buffer;
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
      for (const buffer of scalarBuffers) buffer.destroy();
      this.running = false;
    }
  }

  destroy(): void {
    // A running program owns evaluator resources until execution finishes.
    assert(!this.running);
    this.destroyed = true;
  }
}

/** Keep graph scalar arithmetic on the GPU with the same float32 boundaries as vectors. */
class GPUExpressionArithmeticOperation extends ArithmeticOperation {
  protected override shouldExecuteOnCPU(): boolean {
    return false;
  }
}
