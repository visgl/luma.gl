// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Buffer} from '@luma.gl/core';
import type {TypedArray} from '@math.gl/types';
import {GPUDataEvaluator} from './gpu-data-evaluator';
import {backendRegistry} from './backend-registry';

/** Minimal lazy operation output shape used by backend handlers. */
export type OperationOutput = {
  /** Number of logical output rows. */
  length: number;
  /** Number of bytes in the materialized output buffer. */
  byteLength: number;
};

/** Backend implementation for a single lazy GPGPU operation. */
export type OperationHandler<
  InputsT extends Record<string, any> = any,
  OutputT extends OperationOutput = GPUDataEvaluator
> = (args: {
  /** Device selected for execution. */
  device: Device;
  /** Operation inputs. */
  inputs: InputsT;
  /** Logical output evaluator describing the target layout. */
  output: OutputT;
  /** GPU buffer that receives operation output. */
  target: Buffer;
}) => Promise<OperationHandlerResult>;
export type OperationHandlerResult = {
  success: boolean;
  value?: TypedArray;
  error?: Error;
};

/**
 * Base class for deferred GPGPU operations.
 *
 * Operations form a lazy dependency graph. Calling {@link Operation.execute} first materializes
 * dependent evaluators, then dispatches either a CPU handler or a backend-specific GPU handler.
 */
export abstract class Operation<
  InputsT extends Record<string, any> = Record<string, any>,
  OutputT extends OperationOutput = GPUDataEvaluator
> {
  /** Input evaluator map for this operation. */
  inputs: InputsT;
  /** Input evaluators that need evaluation before this operation can run. */
  dependencies: GPUDataEvaluator[];

  constructor(inputs: InputsT) {
    this.inputs = inputs;
    this.dependencies = Object.values(inputs).filter(i => i instanceof GPUDataEvaluator);
  }

  /** Unique identifier of this operation, e.g. 'add' */
  abstract get name(): string;

  /** Logical output evaluator produced by this operation. */
  abstract get output(): OutputT;

  /** Human friendly string that describes this operation */
  abstract toString(): string;

  /** Evaluates dependencies and writes this operation's result into `target`. */
  async execute(device: Device, target: Buffer): Promise<OperationHandlerResult> {
    // Resolve dependencies
    for (const dep of this.dependencies) {
      await dep.evaluate(device);
    }
    const handlerRegistry = this.shouldExecuteOnCPU() ? 'cpu' : device.type;
    const handler = await backendRegistry.get<InputsT, OutputT>(handlerRegistry, this.name);
    return handler({
      device: target.device,
      inputs: this.inputs,
      output: this.output,
      target
    });
  }

  /** Returns `true` when all inputs are CPU-backed constants small enough for CPU execution. */
  protected shouldExecuteOnCPU() {
    return this.output.length <= 1 && Array.from(this.dependencies).every(t => Boolean(t.value));
  }
}
