// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';

import {
  decodeColorPickInfo,
  decodeIndexPickInfo,
  resolvePickingMode,
  supportsIndexPicking
} from '../../src/modules/picking/picking-manager';
import {getNullTestDevice} from '@luma.gl/test-utils';

test('PickingManager#resolvePickingMode', t => {
  t.equal(resolvePickingMode('webgl'), 'color', 'color is the default mode');
  t.equal(resolvePickingMode('webgl', 'auto'), 'color', 'WebGL auto-selects color picking');
  t.equal(resolvePickingMode('webgpu', 'auto'), 'index', 'WebGPU auto-selects index picking');
  t.equal(resolvePickingMode('webgpu', 'color'), 'color', 'explicit color override honored');
  t.equal(resolvePickingMode('webgpu', 'index'), 'index', 'explicit index override honored');
  t.equal(
    resolvePickingMode('webgl', 'index', true),
    'index',
    'explicit index override is allowed on capable WebGL devices'
  );
  t.throws(
    () => resolvePickingMode('webgl', 'index', false),
    /requires WebGPU or a WebGL device that supports renderable rg32sint textures/,
    'forcing index on unsupported WebGL fails clearly'
  );
  t.end();
});

test('PickingManager#supportsIndexPicking', t => {
  const device = getNullTestDevice();
  t.equal(supportsIndexPicking(device), false, 'NullDevice does not support index picking');
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
