// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {
  decodeColorPickInfo,
  decodeIndexPickInfo,
  resolvePickingBackend
} from '../../src/modules/picking/picking-manager';

test('PickingManager#resolvePickingBackend', t => {
  t.equal(resolvePickingBackend('webgl', 'auto'), 'color', 'WebGL auto-selects color picking');
  t.equal(resolvePickingBackend('webgpu', 'auto'), 'index', 'WebGPU auto-selects index picking');
  t.equal(resolvePickingBackend('webgpu', 'color'), 'color', 'explicit color override honored');
  t.equal(resolvePickingBackend('webgpu', 'index'), 'index', 'explicit index override honored');
  t.throws(
    () => resolvePickingBackend('webgl', 'index'),
    /only supported on WebGPU/,
    'forcing index on WebGL fails clearly'
  );
  t.end();
});

test('PickingManager#decodeIndexPickInfo', t => {
  t.deepEqual(
    decodeIndexPickInfo(new Int32Array([-1, -1])),
    {objectIndex: null, batchIndex: null},
    'invalid index pick decodes to null'
  );
  t.deepEqual(
    decodeIndexPickInfo(new Int32Array([17, 3])),
    {objectIndex: 17, batchIndex: 3},
    'valid index pick decodes correctly'
  );
  t.end();
});

test('PickingManager#decodeColorPickInfo', t => {
  t.deepEqual(
    decodeColorPickInfo(new Uint8Array([0, 0, 0, 0])),
    {objectIndex: null, batchIndex: null},
    'all-zero color pick decodes to null'
  );
  t.deepEqual(
    decodeColorPickInfo(new Uint8Array([18, 0, 0, 4])),
    {objectIndex: 17, batchIndex: 3},
    'encoded color pick decodes to object and batch indices'
  );
  t.end();
});
