// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright (c) three.js authors

// Forked from THREE.js under MIT license

import {expect, it} from 'vitest';
import {toHalfFloat, fromHalfFloat} from '@luma.gl/shadertools';

it('fp16#toHalfFloat', () => {
  expect(Boolean(toHalfFloat(0) === 0), 'Passed!').toBe(true);

  // surpress the following console message during testing
  // THREE.toHalfFloat(): Value out of range.

  expect(Boolean(toHalfFloat(100000) === 31743), 'Passed!').toBe(true);
  expect(Boolean(toHalfFloat(-100000) === 64511), 'Passed!').toBe(true);

  expect(Boolean(toHalfFloat(65504) === 31743), 'Passed!').toBe(true);
  expect(Boolean(toHalfFloat(-65504) === 64511), 'Passed!').toBe(true);
  expect(Boolean(toHalfFloat(Math.PI) === 16968), 'Passed!').toBe(true);
  expect(Boolean(toHalfFloat(-Math.PI) === 49736), 'Passed!').toBe(true);

  void 0;
});

it('fp16#fromHalfFloat', () => {
  expect(Boolean(fromHalfFloat(0) === 0), 'Passed!').toBe(true);
  expect(Boolean(fromHalfFloat(31744) === Infinity), 'Passed!').toBe(true);
  expect(Boolean(fromHalfFloat(64512) === -Infinity), 'Passed!').toBe(true);
  expect(Boolean(fromHalfFloat(31743) === 65504), 'Passed!').toBe(true);
  expect(Boolean(fromHalfFloat(64511) === -65504), 'Passed!').toBe(true);
  expect(Boolean(fromHalfFloat(16968) === 3.140625), 'Passed!').toBe(true);
  expect(Boolean(fromHalfFloat(49736) === -3.140625), 'Passed!').toBe(true);

  void 0;
});
