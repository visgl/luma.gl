// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import type {ScientificVectorFieldInput} from './scientific-flow-field';

test('scientific flow input contract', t => {
  const input: ScientificVectorFieldInput = {
    dimensions: ['y', 'x'],
    shape: [2, 2],
    eastward: new Float32Array([1, 2, 3, 4]),
    northward: new Float32Array([0, 0, 0, 0]),
    valid: new Uint8Array([1, 1, 0, 1]),
    geographic: {
      longitudeStart: -80,
      latitudeStart: 20,
      longitudeStep: 1,
      latitudeStep: 1
    }
  };
  t.equal(input.shape[0] * input.shape[1], input.eastward.length);
  t.deepEqual(Array.from(input.valid), [1, 1, 0, 1]);
  t.end();
});
