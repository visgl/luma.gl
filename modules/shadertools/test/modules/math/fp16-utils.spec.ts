// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from THREE.js under MIT license

import test from 'tape-promise/tape';
import {toHalfFloat, fromHalfFloat} from '@luma.gl/shadertools';

test('fp16#toHalfFloat', t => {
  t.ok(toHalfFloat(0) === 0, 'Passed!');

  // surpress the following console message during testing
  // THREE.toHalfFloat(): Value out of range.

  t.ok(toHalfFloat(100000) === 31743, 'Passed!');
  t.ok(toHalfFloat(-100000) === 64511, 'Passed!');

  t.ok(toHalfFloat(65504) === 31743, 'Passed!');
  t.ok(toHalfFloat(-65504) === 64511, 'Passed!');
  t.ok(toHalfFloat(Math.PI) === 16968, 'Passed!');
  t.ok(toHalfFloat(-Math.PI) === 49736, 'Passed!');

  t.end();
});

test('fp16#fromHalfFloat', t => {
  t.ok(fromHalfFloat(0) === 0, 'Passed!');
  t.ok(fromHalfFloat(31744) === Infinity, 'Passed!');
  t.ok(fromHalfFloat(64512) === -Infinity, 'Passed!');
  t.ok(fromHalfFloat(31743) === 65504, 'Passed!');
  t.ok(fromHalfFloat(64511) === -65504, 'Passed!');
  t.ok(fromHalfFloat(16968) === 3.140625, 'Passed!');
  t.ok(fromHalfFloat(49736) === -3.140625, 'Passed!');

  t.end();
});
