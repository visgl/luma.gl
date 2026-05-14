// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Buffer} from '@luma.gl/core';
import {GPUTableEvaluator} from './gpu-table';
import {backendRegistry} from './backend-registry';

/** Backend implementation for a single lazy GPGPU operation. */
export type OperationHandler<InputsT extends Record<string, any> = any> = (args: {
  /** Device selected for execution. */
  device: Device;
  /** Operation inputs. */
  inputs: InputsT;
  /** Logical output table describing the target layout. */
  output: GPUTableEvaluator;
  /** GPU buffer that receives operation output. */
  target: Buffer;
}) => Promise<void>;

/**
 * Base class for deferred GPGPU operations.
 *
 * Operations form a lazy dependency graph. Calling {@link Operation.execute} first materializes
 * dependent tables, then dispatches either a CPU handler or a backend-specific GPU handler.
 */
export abstract class Operation<InputsT extends Record<string, any> = Record<string, any>> {
  /** Input table map for this operation. */
  inputs: InputsT;
  /** Input tables that need evaluation before this operation can run. */
  dependencies: GPUTableEvaluator[];

  constructor(inputs: InputsT) {
    this.inputs = inputs;
    this.dependencies = Object.values(inputs).filter(i => i instanceof GPUTableEvaluator);
  }

  /** Unique identifier of this operation, e.g. 'add' */
  abstract get name(): string;

  /** Logical output table produced by this operation. */
  abstract get output(): GPUTableEvaluator;

  /** Human friendly string that describes this operation */
  abstract toString(): string;

  /** Evaluates dependencies and writes this operation's result into `target`. */
  async execute(device: Device, target: Buffer): Promise<void> {
    // Resolve dependencies
    for (const dep of this.dependencies) {
      await dep.evaluate(device);
    }
    if (this.shouldExecuteOnCPU()) {
      const handler = await backendRegistry.get('cpu', this.name);
      handler({
        device: target.device,
        inputs: this.inputs,
        output: this.output,
        target
      });
    } else {
      const handler = await backendRegistry.get(device.type, this.name);
      await handler({
        device,
        inputs: this.inputs,
        output: this.output,
        target
      });
    }
  }

  /** Returns `true` when all inputs are CPU-backed constants small enough for CPU execution. */
  protected shouldExecuteOnCPU() {
    return this.output.length <= 1 && Object.values(this.inputs).every(t => Boolean(t.value));
  }
}
