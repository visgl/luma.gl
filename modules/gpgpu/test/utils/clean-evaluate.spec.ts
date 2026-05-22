// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {add, cleanEvaluate, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import '../operations/fixtures';

test(`GPGPU#cleanEvaluate`, async t => {
  const device = await getTestDevice('webgl');
  if (!device) {
    t.annotate(`webgl not available`);
    return;
  }

  const x = GPUTableEvaluator.fromArray([1, 2, 3, 4], {type: 'sint32', size: 1});
  const y = GPUTableEvaluator.fromArray([10, 20, 30, 40], {type: 'sint32', size: 1});
  const z = GPUTableEvaluator.fromArray([100, 200, 300, 400], {type: 'sint32', size: 1});

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
