// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {add, multiply, swizzle, extent, GPUDataEvaluator, GPUEvaluationBatch} from '@luma.gl/gpgpu';

it('evaluation batch records distinct dependent passes and separate outputs before one submission', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3, 4]), {size: 2});
  const scaled = multiply(input, 2);
  // Non-contiguous swizzle prevents arithmetic-expression fusion and requires another pass.
  const reordered = swizzle(scaled, [1, 0]);
  const output = add(reordered, 1);
  const other = add(input, 10);
  const batch = new GPUEvaluationBatch(device);
  const submit = vi.spyOn(device, 'submit');
  const baselineRuns = device.statsManager
    .getStats('GPGPU Operation Counts')
    .get('Computation Runs').count;
  const copy = device.createBuffer({byteLength: 16, usage: Buffer.COPY_DST | Buffer.COPY_SRC});
  try {
    const vector = await batch.evaluate(output);
    await batch.evaluate(other);
    expect(submit).not.toHaveBeenCalled();
    expect(
      device.statsManager.getStats('GPGPU Operation Counts').get('Computation Runs').count -
        baselineRuns
    ).toBe(4);
    await expect(output.readValue()).rejects.toThrow('unsubmitted batch');
    await expect(output.evaluate(device)).rejects.toThrow('unsubmitted batch');
    expect(() => input.destroy()).toThrow('unsubmitted batch');
    // A caller can append a consumer on the same encoder before submission.
    batch.commandEncoder.copyBufferToBuffer({
      sourceBuffer: vector.data[0].buffer,
      destinationBuffer: copy,
      size: 16
    });
    batch.submit();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(Array.from(await output.readValue())).toEqual([5, 3, 9, 7]);
    expect(Array.from(await other.readValue())).toEqual([11, 12, 13, 14]);
    const bytes = await copy.readAsync();
    expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([5, 3, 9, 7]);
    expect(() => batch.submit()).toThrow('submitted');
    expect(() => batch.cancel()).not.toThrow();
  } finally {
    submit.mockRestore();
    copy.destroy();
    for (const evaluator of [output, other, reordered, scaled, input]) evaluator.destroy();
  }
});

it('cancelling a batch invalidates new views and restores borrowed targets for reevaluation', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2]), {size: 1});
  const output = multiply(input, 3);
  const target = device.createBuffer({
    byteLength: 16,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  output.setTargetBuffer({buffer: target, byteOffset: 8});
  const batch = new GPUEvaluationBatch(device);
  const submit = vi.spyOn(device, 'submit');
  try {
    await batch.evaluate(output);
    batch.cancel();
    expect(submit).not.toHaveBeenCalled();
    expect(() => batch.cancel()).not.toThrow();
    await expect(batch.evaluate(output)).rejects.toThrow('cancelled');
    const retry = new GPUEvaluationBatch(device);
    const vector = await retry.evaluate(output);
    expect(vector.data[0].buffer).toBe(target);
    expect(output.offset).toBe(8);
    retry.submit();
    expect(Array.from(await output.readValue())).toEqual([3, 6]);
  } finally {
    submit.mockRestore();
    output.destroy();
    input.destroy();
    target.destroy();
  }
});

it('unsupported handlers fail closed without internally submitting the batch', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 1});
  const pending = multiply(input, 2);
  const unsupported = extent(pending);
  const batch = new GPUEvaluationBatch(device);
  const submit = vi.spyOn(device, 'submit');
  try {
    await batch.evaluate(pending);
    await expect(batch.evaluate(unsupported)).rejects.toThrow(
      'does not support batched evaluation'
    );
    expect(submit).not.toHaveBeenCalled();
    expect(() => batch.submit()).toThrow('cancelled');
    // Failure releases all leases and discards materializations from earlier evaluations.
    expect(() => pending.destroy()).not.toThrow();
  } finally {
    submit.mockRestore();
    unsupported.destroy();
    input.destroy();
  }
});

it('a batch rejects another batch borrowing its pending output', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2]), {size: 1});
  const output = multiply(input, 2);
  const first = new GPUEvaluationBatch(device);
  const second = new GPUEvaluationBatch(device);
  try {
    await first.evaluate(output);
    await expect(second.evaluate(output)).rejects.toThrow('unsubmitted batch');
    first.submit();
    expect(Array.from(await output.readValue())).toEqual([2, 4]);
  } finally {
    output.destroy();
    input.destroy();
  }
});

it('a cached alias retains its backing evaluator and survives cancellation', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3, 4]), {size: 2});
  const output = multiply(input, 2);
  const alias = swizzle(output, [0]);
  await alias.evaluate(device);
  const originalBuffer = alias.buffer;
  const batch = new GPUEvaluationBatch(device);
  try {
    await batch.evaluate(alias);
    expect(() => output.destroy()).toThrow('unsubmitted batch');
    batch.cancel();
    expect(alias.buffer).toBe(originalBuffer);
    expect(Array.from(await alias.readValue())).toEqual([2, 6]);
  } finally {
    alias.destroy();
    output.destroy();
    input.destroy();
  }
});

it('submission and concurrent evaluation cannot race an outstanding encode', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2]), {size: 1});
  const output = multiply(input, 2);
  const batch = new GPUEvaluationBatch(device);
  try {
    const encoding = batch.evaluate(output);
    expect(() => batch.submit()).toThrow('Await batch evaluation');
    expect(() => batch.cancel()).toThrow('Await batch evaluation');
    await expect(batch.evaluate(output)).rejects.toThrow('Await the previous batch evaluation');
    await encoding;
    batch.submit();
    expect(Array.from(await output.readValue())).toEqual([2, 4]);
  } finally {
    output.destroy();
    input.destroy();
  }
});

it('the same workload retains the existing unbatched submission policy', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3, 4]), {size: 2});
  const scaled = multiply(input, 2);
  const reordered = swizzle(scaled, [1, 0]);
  const output = add(reordered, 1);
  const other = add(input, 10);
  const submit = vi.spyOn(device, 'submit');
  try {
    await output.evaluate(device);
    await other.evaluate(device);
    expect(submit).toHaveBeenCalledTimes(4);
    expect(Array.from(await output.readValue())).toEqual([5, 3, 9, 7]);
    expect(Array.from(await other.readValue())).toEqual([11, 12, 13, 14]);
  } finally {
    submit.mockRestore();
    for (const evaluator of [output, other, reordered, scaled, input]) evaluator.destroy();
  }
});
