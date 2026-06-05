// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUVector} from '@luma.gl/tables';
import {expect, test} from 'vitest';
import {add, cleanEvaluate, GPUDataEvaluator, GPUVectorEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import '../operations/fixtures';

test(`GPGPU#cleanEvaluate`, async t => {
  const device = await getTestDevice('webgl');
  if (!device) {
    t.annotate(`webgl not available`);
    return;
  }

  const x = GPUDataEvaluator.fromArray([1, 2, 3, 4], {type: 'sint32', size: 1});
  const y = GPUDataEvaluator.fromArray([10, 20, 30, 40], {type: 'sint32', size: 1});
  const z = GPUDataEvaluator.fromArray([100, 200, 300, 400], {type: 'sint32', size: 1});

  const partial = add(x, y);
  const sum = add(partial, z);

  await cleanEvaluate(device, {sum, x});

  expect(sum.gpuVector).toBeTruthy();
  expect(x.gpuVector).toBeTruthy();

  expect((x as any).evaluated).toBe(true);
  expect((y as any).evaluated).toBe(false);
  expect((z as any).evaluated).toBe(false);
  expect((partial as any).evaluated).toBe(false);
  expect((sum as any).evaluated).toBe(true);

  x.destroy();
  sum.destroy();
});

test(`GPGPU#cleanEvaluate preserves GPUVectorEvaluator outputs`, async t => {
  const device = await getTestDevice('webgl');
  if (!device) {
    t.annotate(`webgl not available`);
    return;
  }

  const x0 = GPUDataEvaluator.fromArray([1, 2], {size: 1});
  const x1 = GPUDataEvaluator.fromArray([3, 4], {size: 1});
  await Promise.all([x0.evaluate(device), x1.evaluate(device)]);
  const vector = new GPUVector({
    type: 'data',
    name: 'values',
    format: 'float32',
    data: [x0.gpuVector.data[0], x1.gpuVector.data[0]]
  });
  const offset = GPUDataEvaluator.fromConstant(1);
  const partials: GPUDataEvaluator[] = [];
  const sum = GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(data => {
    const partial = add(data, offset);
    partials.push(partial);
    return add(partial, offset);
  });

  await cleanEvaluate(device, sum);

  expect(sum.gpuVector.data).toHaveLength(2);
  expect(sum.gpuDataEvaluators.every(evaluator => evaluator.evaluated)).toBe(true);
  expect(partials.every(evaluator => !evaluator.evaluated)).toBe(true);

  sum.destroy();
  offset.destroy();
  vector.destroy();
  x0.destroy();
  x1.destroy();
});
