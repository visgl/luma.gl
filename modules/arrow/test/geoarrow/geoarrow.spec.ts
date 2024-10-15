// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {arraysEqual} from '../test-utils';
import {expandArrayToCoords} from '@luma.gl/arrow/geoarrow/geoarrow';

test('linestring vertex expansion#1', t => {
  const input = new Uint8Array([1, 2, 3, 4]);
  const size = 1;
  const geomOffsets = new Int32Array([0, 5, 8, 12]);
  const expanded = expandArrayToCoords(input, size, geomOffsets);
  const expected = new Uint8Array([1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3]);
  t.ok(arraysEqual(expanded, expected), 'expands correctly (size = 1)');

  t.end();
});

  test('linestring vertex expansion#3', t => {
    const input = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const size = 3;
  const geomOffsets = new Int32Array([0, 2, 5, 9]);
  const expanded = expandArrayToCoords(input, size, geomOffsets);
  const expected = new Uint8Array([
    0, 1, 2, 0, 1, 2, 3, 4, 5, 3, 4, 5, 3, 4, 5, 6, 7, 8, 6, 7, 8, 6, 7, 8, 6, 7, 8
  ]);
  t.ok(arraysEqual(expanded, expected), 'expands correctly (size = 3)');

  t.end();
});
