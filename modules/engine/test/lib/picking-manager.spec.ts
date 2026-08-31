// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Framebuffer} from '@luma.gl/core';

import {
  PickingManager,
  decodeColorPickInfo,
  decodeIndexPickInfo,
  resolvePickingMode,
  supportsIndexPicking
} from '../../src/modules/picking/picking-manager';
import {getNullTestDevice} from '@luma.gl/test-utils';

it('PickingManager#resolvePickingMode', () => {
  expect(resolvePickingMode('webgl'), 'color is the default mode').toBe('color');
  expect(resolvePickingMode('webgl', 'auto'), 'WebGL auto-selects color picking').toBe('color');
  expect(resolvePickingMode('webgpu', 'auto'), 'WebGPU auto-selects index picking').toBe('index');
  expect(resolvePickingMode('webgpu', 'color'), 'explicit color override honored').toBe('color');
  expect(resolvePickingMode('webgpu', 'index'), 'explicit index override honored').toBe('index');
  expect(
    resolvePickingMode('webgl', 'index', true),
    'explicit index override is allowed on capable WebGL devices'
  ).toBe('index');
  expect(
    () => resolvePickingMode('webgl', 'index', false),
    'forcing index on unsupported WebGL fails clearly'
  ).toThrow(/requires WebGPU or a WebGL device that supports renderable rg32sint textures/);
  void 0;
});

it('PickingManager#supportsIndexPicking', () => {
  const device = getNullTestDevice();
  expect(supportsIndexPicking(device), 'NullDevice does not support index picking').toBe(false);
  void 0;
});

it('PickingManager#shouldPick', () => {
  const picker = new PickingManager(getNullTestDevice(), {});
  expect(picker.shouldPick([12, 34]), 'first cursor position should pick').toBe(true);
  expect(picker.shouldPick([12, 34]), 'same cursor position is suppressed').toBe(false);
  expect(picker.shouldPick([12, 34], {force: true}), 'forced pick reruns in place').toBe(true);
  expect(picker.shouldPick([13, 34]), 'cursor movement should pick').toBe(true);
  expect(picker.shouldPick(null), 'missing cursor position clears without picking').toBe(false);
  expect(picker.shouldPick([13, 34]), 'cursor can pick again after clearing').toBe(true);
  picker.destroy();
  void 0;
});

it('PickingManager#getTooltip', async () => {
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
  expect(pickInfo, 'pick result is returned').toEqual({batchIndex: 2, objectIndex: 7});
  expect(tooltipPickInfo, 'tooltip formatter receives the decoded pick info').toEqual({
    batchIndex: 2,
    objectIndex: 7
  });
  picker.destroy();
  void 0;
});

it('PickingManager#decodeIndexPickInfo', () => {
  expect(
    decodeIndexPickInfo(new Int32Array([-1, -1])),
    'invalid index pick decodes to null'
  ).toEqual({objectIndex: null, batchIndex: null});
  expect(
    decodeIndexPickInfo(new Int32Array([17, 3])),
    'valid index pick decodes correctly'
  ).toEqual({objectIndex: 17, batchIndex: 3});
  void 0;
});

it('PickingManager#decodeColorPickInfo', () => {
  expect(
    decodeColorPickInfo(new Uint8Array([0, 0, 0, 0])),
    'all-zero color pick decodes to null'
  ).toEqual({objectIndex: null, batchIndex: null});
  expect(
    decodeColorPickInfo(new Uint8Array([18, 0, 0, 4])),
    'encoded color pick decodes to object and batch indices'
  ).toEqual({objectIndex: 17, batchIndex: 3});
  void 0;
});
