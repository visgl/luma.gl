// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CommandEncoder, Device} from '@luma.gl/core';
import type {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import type {GPUDataEvaluator, GPUDataEvaluatorEvaluateOptions} from './gpu-data-evaluator';

/**
 * Experimental WebGPU evaluation scope with explicit submission.
 *
 * @remarks
 * This proof of concept supports single-chunk evaluators and opt-in WebGPU handlers.
 * Await each evaluation before starting another or submitting. Returned vectors can be
 * bound by later commands on this encoder, but must not be read or used elsewhere until
 * submission. Borrowed buffers must remain alive and unchanged until submission.
 */
export class GPUEvaluationBatch {
  /** Device on which all evaluations and commands are recorded. */
  readonly device: Device;
  /** Encoder owned by this batch. Append commands, but finish/submit only through the batch. */
  readonly commandEncoder: CommandEncoder;

  private state: 'open' | 'submitted' | 'cancelled' = 'open';
  private evaluating = false;
  private readonly finalizers: ((submitted: boolean) => void)[] = [];

  /** Creates an empty WebGPU batch; construction does not submit GPU work. */
  constructor(device: Device) {
    if (device.type !== 'webgpu') {
      throw new Error('GPUEvaluationBatch requires WebGPU');
    }
    this.device = device;
    this.commandEncoder = device.createCommandEncoder();
  }

  /** Encodes an evaluator and its dependencies without submitting or waiting for GPU completion. */
  async evaluate(
    evaluator: GPUDataEvaluator,
    options: Omit<GPUDataEvaluatorEvaluateOptions, 'batch'> = {}
  ): Promise<GPUVector> {
    this.assertOpen();
    if (this.evaluating) {
      throw new Error('Await the previous batch evaluation before starting another');
    }
    this.evaluating = true;
    try {
      return await evaluator.evaluate(this.device, {...options, batch: this});
    } catch (error) {
      // A failed dependency may have partially encoded work. Never submit that batch.
      this.finish(false);
      throw error;
    } finally {
      this.evaluating = false;
    }
  }

  /** Submits the recorded commands once; does not wait for GPU completion. */
  submit(): void {
    this.assertIdle();
    try {
      this.device.submit(this.commandEncoder.finish());
    } catch (error) {
      this.finish(false);
      throw error;
    }
    this.finish(true);
  }

  /** Discards recorded work and releases resources; harmless after submission or cancellation. */
  cancel(): void {
    if (this.state !== 'open') return;
    this.assertIdle();
    this.finish(false);
  }

  /** Checks that an internal dependency belongs to this active evaluation. @internal */
  assertEvaluating(device: Device): void {
    this.assertOpen();
    if (!this.evaluating || device !== this.device) {
      throw new Error('Use batch.evaluate() with the batch device');
    }
  }

  /** Retains an evaluator or computation until submission or cancellation. @internal */
  retain(finalize: (submitted: boolean) => void): void {
    this.assertOpen();
    this.finalizers.push(finalize);
  }

  private assertOpen(): void {
    if (this.state !== 'open') {
      throw new Error(`GPUEvaluationBatch is ${this.state}`);
    }
  }

  private assertIdle(): void {
    this.assertOpen();
    if (this.evaluating) {
      throw new Error('Await batch evaluation before submitting or cancelling');
    }
  }

  private finish(submitted: boolean): void {
    this.state = submitted ? 'submitted' : 'cancelled';
    this.commandEncoder.destroy();
    for (const finalize of this.finalizers.splice(0).reverse()) {
      finalize(submitted);
    }
  }
}
