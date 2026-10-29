// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {
  add,
  multiply,
  swizzle,
  extent,
  interleave,
  GPUDataEvaluator,
  GPUVectorEvaluator,
  GPUEvaluationScope
} from '@luma.gl/gpgpu';

it('evaluation scope records distinct dependent passes and separate outputs before one submission', async ({
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
  const scope = new GPUEvaluationScope(device);
  const submit = vi.spyOn(device, 'submit');
  const baselineRuns = device.statsManager
    .getStats('GPGPU Operation Counts')
    .get('Computation Runs').count;
  const copy = device.createBuffer({byteLength: 16, usage: Buffer.COPY_DST | Buffer.COPY_SRC});
  try {
    const vector = await scope.evaluate(output);
    await scope.evaluate(other);
    expect(submit).not.toHaveBeenCalled();
    expect(
      device.statsManager.getStats('GPGPU Operation Counts').get('Computation Runs').count -
        baselineRuns
    ).toBe(4);
    await expect(output.readValue()).rejects.toThrow('unsubmitted scope');
    await expect(output.evaluate(device)).rejects.toThrow('unsubmitted scope');
    expect(() => input.destroy()).toThrow('unsubmitted scope');
    // A caller can append a consumer on the same encoder before submission.
    scope.commandEncoder.copyBufferToBuffer({
      sourceBuffer: vector.data[0].buffer,
      destinationBuffer: copy,
      size: 16
    });
    scope.submit();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(Array.from(await output.readValue())).toEqual([5, 3, 9, 7]);
    expect(Array.from(await other.readValue())).toEqual([11, 12, 13, 14]);
    const bytes = await copy.readAsync();
    expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([5, 3, 9, 7]);
    expect(() => scope.submit()).toThrow('submitted');
    expect(() => scope.cancel()).not.toThrow();
  } finally {
    submit.mockRestore();
    copy.destroy();
    for (const evaluator of [output, other, reordered, scaled, input]) evaluator.destroy();
  }
});

it('cancelling a scope invalidates new views and restores borrowed targets for reevaluation', async ({
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
  const scope = new GPUEvaluationScope(device);
  const submit = vi.spyOn(device, 'submit');
  try {
    await scope.evaluate(output);
    scope.cancel();
    expect(submit).not.toHaveBeenCalled();
    expect(() => scope.cancel()).not.toThrow();
    await expect(scope.evaluate(output)).rejects.toThrow('cancelled');
    const retry = new GPUEvaluationScope(device);
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

it('unsupported handlers fail closed without internally submitting the scope', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 1});
  const pending = multiply(input, 2);
  const unsupported = extent(pending);
  const scope = new GPUEvaluationScope(device);
  const submit = vi.spyOn(device, 'submit');
  try {
    await scope.evaluate(pending);
    await expect(scope.evaluate(unsupported)).rejects.toThrow(
      'does not support deferred-submission evaluation'
    );
    expect(submit).not.toHaveBeenCalled();
    expect(() => scope.submit()).toThrow('cancelled');
    // Failure releases all leases and discards materializations from earlier evaluations.
    expect(() => pending.destroy()).not.toThrow();
  } finally {
    submit.mockRestore();
    unsupported.destroy();
    input.destroy();
  }
});

it('a scope rejects another scope borrowing its pending output', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2]), {size: 1});
  const output = multiply(input, 2);
  const first = new GPUEvaluationScope(device);
  const second = new GPUEvaluationScope(device);
  try {
    await first.evaluate(output);
    await expect(second.evaluate(output)).rejects.toThrow('unsubmitted scope');
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
  const scope = new GPUEvaluationScope(device);
  try {
    await scope.evaluate(alias);
    expect(() => output.destroy()).toThrow('unsubmitted scope');
    scope.cancel();
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
  const scope = new GPUEvaluationScope(device);
  try {
    const encoding = scope.evaluate(output);
    expect(() => scope.submit()).toThrow('Await scope evaluation');
    expect(() => scope.cancel()).toThrow('Await scope evaluation');
    await expect(scope.evaluate(output)).rejects.toThrow('Await the previous scope evaluation');
    await encoding;
    scope.submit();
    expect(Array.from(await output.readValue())).toEqual([2, 4]);
  } finally {
    output.destroy();
    input.destroy();
  }
});

it('the same workload retains the existing immediate-submission submission policy', async ({
  skip
}) => {
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

for (const inputKind of ['single-row attribute', 'constant evaluator', 'literal-only'] as const) {
  it(`an explicit scope uses WebGPU for ${inputKind} operations`, async ({skip}) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const input =
      inputKind === 'single-row attribute'
        ? GPUDataEvaluator.fromArray(new Float32Array([1, 2]), {size: 2})
        : GPUDataEvaluator.fromConstant([1, 2]);
    const scaled = multiply(input, 2);
    const reordered = swizzle(scaled, [1, 0]);
    const output = inputKind === 'literal-only' ? add([1, 2], [3, 4]) : add(reordered, 1);
    const scope = new GPUEvaluationScope(device);
    const submit = vi.spyOn(device, 'submit');
    try {
      await scope.evaluate(output);
      expect(submit).not.toHaveBeenCalled();
      scope.submit();
      expect(submit).toHaveBeenCalledTimes(1);
      expect(Array.from(await output.readValue())).toEqual(
        inputKind === 'literal-only' ? [4, 6] : [5, 3]
      );
    } finally {
      scope.cancel();
      submit.mockRestore();
      for (const evaluator of [output, reordered, scaled, input]) evaluator.destroy();
    }
  });
}

it('GPU-computed constants broadcast from row zero inside a scope', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const input = GPUDataEvaluator.fromConstant([1, 2]);
  const scaled = multiply(input, 2);
  const constant = swizzle(scaled, [1, 0]);
  const rows = GPUDataEvaluator.fromArray(new Float32Array([10, 20, 30, 40]), {size: 2});
  const output = add(rows, constant);
  const scope = new GPUEvaluationScope(device);
  const submit = vi.spyOn(device, 'submit');
  try {
    await scope.evaluate(output);
    expect(submit).not.toHaveBeenCalled();
    scope.submit();
    expect(Array.from(await output.readValue())).toEqual([14, 22, 34, 42]);
  } finally {
    scope.cancel();
    submit.mockRestore();
    for (const evaluator of [output, rows, constant, scaled, input]) evaluator.destroy();
  }
});

it('interleave binds a GPU-computed constant alongside row data', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const constant = add(1, 1);
  const rows = GPUDataEvaluator.fromArray(new Float32Array([10, 20]), {size: 1});
  const output = interleave(rows, constant);
  const scope = new GPUEvaluationScope(device);
  try {
    await scope.evaluate(output);
    scope.submit();
    expect(Array.from(await output.readValue())).toEqual([10, 2, 20, 2]);
  } finally {
    scope.cancel();
    output.destroy();
    rows.destroy();
    constant.destroy();
  }
});

it('vector scopes preserve chunks, roll back cancellation, and retain cached vectors', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const first = GPUDataEvaluator.fromArray(new Float32Array([1, 2]), {});
  const second = GPUDataEvaluator.fromArray(new Float32Array([3, 4, 5]), {});
  const outputs = [add(first, 10), add(second, 10)];
  const vector = GPUVectorEvaluator.fromGPUDataEvaluators(outputs);
  const submit = vi.spyOn(device, 'submit');
  let scope = new GPUEvaluationScope(device);
  try {
    const pending = await scope.evaluate(vector);
    expect(pending.data.map(data => data.length)).toEqual([2, 3]);
    expect(submit).not.toHaveBeenCalled();
    await expect(vector.evaluate(device)).rejects.toThrow('unsubmitted scope');
    expect(() => vector.evaluateSync(device)).toThrow('unsubmitted scope');
    expect(() => vector.destroy()).toThrow('unsubmitted scope');
    scope.cancel();
    expect(vector.evaluated).toBe(false);
    expect(outputs.every(output => !output.evaluated)).toBe(true);
    scope = new GPUEvaluationScope(device);
    const result = await scope.evaluate(vector);
    scope.submit();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(Array.from(await outputs[0].readValue())).toEqual([11, 12]);
    expect(Array.from(await outputs[1].readValue())).toEqual([13, 14, 15]);
    expect(await vector.evaluate(device)).toBe(result);
    scope = new GPUEvaluationScope(device);
    expect(await scope.evaluate(vector)).toBe(result);
    expect(() => outputs[0].destroy()).toThrow('unsubmitted scope');
    scope.cancel();
    expect(await vector.evaluate(device)).toBe(result);
  } finally {
    scope.cancel();
    submit.mockRestore();
    vector.destroy();
    first.destroy();
    second.destroy();
  }
});

it('a failing vector chunk cancels earlier chunks and permits ordinary evaluation afterward', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const first = GPUDataEvaluator.fromArray(new Float32Array([1, 2]), {});
  const second = GPUDataEvaluator.fromArray(new Float32Array([3, 4]), {});
  const vector = GPUVectorEvaluator.fromGPUDataEvaluators([first, second]);
  const failure = vi.spyOn(second, 'evaluate').mockRejectedValueOnce(new Error('chunk failed'));
  const scope = new GPUEvaluationScope(device);
  try {
    await expect(scope.evaluate(vector)).rejects.toThrow('chunk failed');
    expect(first.evaluated).toBe(false);
    expect(vector.evaluated).toBe(false);
    expect(() => scope.submit()).toThrow('cancelled');
    expect((await vector.evaluate(device)).data).toHaveLength(2);
  } finally {
    failure.mockRestore();
    scope.cancel();
    vector.destroy();
  }
});
