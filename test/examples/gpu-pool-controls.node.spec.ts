// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getShotCharge, shouldRackBalls} from '../../examples/experimental/gpu-pool/shot-controls';

test('shot charge rises, pauses at full power and restarts from zero', () => {
  expect(getShotCharge(0)).toBe(0);
  expect(getShotCharge(800)).toBe(50);
  expect(getShotCharge(1600)).toBe(100);
  expect(getShotCharge(1949)).toBe(100);
  expect(getShotCharge(1950)).toBe(0);
  expect(getShotCharge(2750)).toBe(50);
});

test('only a cleared full rack requests automatic replacement', () => {
  expect(shouldRackBalls('rack', 14, 15)).toBe(false);
  expect(shouldRackBalls('rack', 15, 15)).toBe(true);
  expect(shouldRackBalls('follow', 1, 1)).toBe(false);
  expect(shouldRackBalls('cushion', 0, 0)).toBe(false);
});
