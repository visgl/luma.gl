// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Buffer} from '@luma.gl/core';
import type {TypedArray} from '@math.gl/types';
import {GPUDataEvaluator} from './gpu-data-evaluator';
import {backendRegistry} from './backend-registry';
import type {GPUEvaluationScope} from './gpu-evaluation-scope';

/** Backend implementation for a single lazy GPGPU operation. */
export type OperationInputs = Record<string, any> | readonly any[];

export type OperationHandler<InputsT extends OperationInputs = any> = ((args: {
  /** Optional explicit WebGPU execution scope. */
  scope?: GPUEvaluationScope;
  /** Device selected for execution. */
  device: Device;
  /** Operation inputs. */
  inputs: InputsT;
  /** Logical output evaluator describing the target layout. */
  output: GPUDataEvaluator;
  /** GPU buffer that receives operation output. */
  target: Buffer;
}) => OperationHandlerResult | Promise<OperationHandlerResult>) & {
  /** Whether this handler encodes all work into the supplied scope without submitting. */
  supportsEvaluationScope?: boolean;
};
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
export abstract class Operation<InputsT extends OperationInputs = Record<string, any>> {
  /** Inputs for this operation. */
  inputs: InputsT;
  /** Input evaluators that need evaluation before this operation can run. */
  dependencies: GPUDataEvaluator[];

  constructor(inputs: InputsT) {
    this.inputs = inputs;
    this.dependencies = Array.from(inputs instanceof Array ? inputs : Object.values(inputs)).filter(
      i => i instanceof GPUDataEvaluator
    );
  }

  /** Unique identifier of this operation, e.g. 'add' */
  abstract get name(): string;

  /** Logical output evaluator produced by this operation. */
  abstract get output(): GPUDataEvaluator;

  /** Human friendly string that describes this operation */
  abstract toString(): string;

  /** Evaluates dependencies and writes this operation's result into `target`. */
  async execute(
    device: Device,
    target: Buffer,
    scope?: GPUEvaluationScope
  ): Promise<OperationHandlerResult> {
    if (!scope) await this._resolveDependencies(device);
    const handler = await backendRegistry.get(this._getHandlerRegistry(device), this.name);
    if (scope && (device.type !== 'webgpu' || !handler.supportsEvaluationScope)) {
      throw new Error(`${this.name} does not support deferred-submission evaluation`);
    }
    if (scope) await this._resolveDependencies(device, scope);
    return await this._executeWithHandler(handler, target, scope);
  }

  /** Evaluates dependencies synchronously and writes this operation's result into `target`. */
  executeSync(device: Device, target: Buffer): OperationHandlerResult {
    this._resolveDependenciesSync(device);
    const result = this._executeWithHandler(
      backendRegistry.getSync(this._getHandlerRegistry(device), this.name),
      target
    );
    if (isPromise(result)) {
      throw new Error(`${this.name} returned a Promise in executeSync()`);
    }
    return result;
  }

  /** Returns `true` when all inputs are CPU-backed constants small enough for CPU execution. */
  protected shouldExecuteOnCPU() {
    return this.output.length <= 1 && Array.from(this.dependencies).every(t => Boolean(t.value));
  }

  private _getHandlerRegistry(device: Device): string {
    return this.shouldExecuteOnCPU() ? 'cpu' : device.type;
  }

  private async _resolveDependencies(device: Device, scope?: GPUEvaluationScope): Promise<void> {
    for (const dep of this.dependencies) {
      await dep.evaluate(device, {scope});
    }
    const handlerRegistry = this._getHandlerRegistry(device);
    if (handlerRegistry === 'cpu' || device.type === 'null') {
      for (const dependency of this.dependencies) {
        await dependency.ensureCPUValue();
      }
    }
  }

  private _resolveDependenciesSync(device: Device): void {
    for (const dep of this.dependencies) {
      dep.evaluateSync(device);
    }
    const handlerRegistry = this._getHandlerRegistry(device);
    if (handlerRegistry === 'cpu' || device.type === 'null') {
      for (const dependency of this.dependencies) {
        dependency.ensureCPUValueSync();
      }
    }
  }

  private _executeWithHandler(
    handler: OperationHandler,
    target: Buffer,
    scope?: GPUEvaluationScope
  ): OperationHandlerResult | Promise<OperationHandlerResult> {
    return handler({
      scope,
      device: target.device,
      inputs: this.inputs,
      output: this.output,
      target
    });
  }
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T>)?.then === 'function';
}
