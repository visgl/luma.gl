// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Buffer} from '@luma.gl/core';
import {GPUTable} from './gpu-table';
import {backendRegistry} from './backend-registry';
import type {TypedArray} from '@math.gl/types';

export type OperationHandler<InputsT extends Record<string, any> = any> = (args: {
  device: Device;
  inputs: InputsT;
  output: GPUTable;
  target: Buffer;
}) => Promise<void>;

export abstract class Operation<InputsT extends Record<string, any> = Record<string, any>> {
  inputs: InputsT;
  dependencies: GPUTable[];

  constructor(inputs: InputsT) {
    this.inputs = inputs;
    this.dependencies = Object.values(inputs).filter(i => i instanceof GPUTable);
  }

  /** Unique identifier of this operation, e.g. 'add' */
  abstract get name(): string;

  abstract get output(): GPUTable;

  /** Human friendly string that describes this operation */
  abstract toString(): string;

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

  protected shouldExecuteOnCPU() {
    return this.output.length <= 1 && Object.values(this.inputs).every(t => Boolean(t.value));
  }
}
