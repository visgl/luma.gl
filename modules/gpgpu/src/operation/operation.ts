// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Buffer} from '@luma.gl/core';
import { GPUTable } from './gpu-table';
import { backendRegistry } from './backend-registry';
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

  /** Sometimes it is faster to run the operation on CPU. Return the result if execution is successful. */
  protected abstract executeCPU(): TypedArray | null;

  async execute(device: Device, target: Buffer): Promise<void> {
    // Resolve dependencies
    for (const dep of this.dependencies) {
      await dep.evaluate(device);
    }
    const value = this.executeCPU();
    if (value) {
      target.write(value);
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

}
