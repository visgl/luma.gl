// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {Framebuffer} from '@luma.gl/core';

import {
  PickingManager,
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

test('PickingManager#shouldPick', t => {
  const picker = new PickingManager(getNullTestDevice(), {});
  t.equal(picker.shouldPick([12, 34]), true, 'first cursor position should pick');
  t.equal(picker.shouldPick([12, 34]), false, 'same cursor position is suppressed');
  t.equal(picker.shouldPick([12, 34], {force: true}), true, 'forced pick reruns in place');
  t.equal(picker.shouldPick([13, 34]), true, 'cursor movement should pick');
  t.equal(picker.shouldPick(null), false, 'missing cursor position clears without picking');
  t.equal(picker.shouldPick([13, 34]), true, 'cursor can pick again after clearing');
  picker.destroy();
  t.end();
});

test('PickingManager#getTooltip', async t => {
  let tooltipPickInfo: {batchIndex: number | null; objectIndex: number | null} | null = null;
  class TooltipPickingManager extends PickingManager {
    override getFramebuffer(): Framebuffer {
      return {} as Framebuffer;
    }

    override getPickPosition(mousePosition: [number, number]): [number, number] {
      return mousePosition;
    }

    protected override async readPickInfo(): Promise<{
      batchIndex: number | null;
      objectIndex: number | null;
    }> {
      return {batchIndex: 2, objectIndex: 7};
    }
  }

  const picker = new TooltipPickingManager(getNullTestDevice(), {
    getTooltip: pickInfo => {
      tooltipPickInfo = pickInfo;
      return pickInfo.objectIndex === null ? null : `row ${pickInfo.objectIndex}`;
    }
  });

  const pickInfo = await picker.updatePickInfo([12, 34]);
  t.deepEqual(pickInfo, {batchIndex: 2, objectIndex: 7}, 'pick result is returned');
  t.deepEqual(
    tooltipPickInfo,
    {batchIndex: 2, objectIndex: 7},
    'tooltip formatter receives the decoded pick info'
  );
  picker.destroy();
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
