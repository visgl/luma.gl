// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Stats} from '@probe.gl/stats';
import {describe, expect, test, vi} from 'vitest';
import type {WebGPUDevice} from '../../../src/adapter/webgpu-device';
import {WebGPUTexture} from '../../../src/adapter/resources/webgpu-texture';

describe('borrowed WebGPU textures', () => {
  test('never modifies opaque borrowed texture labels or destroys their handles', () => {
    const device = makeMockWebGPUDevice();
    const handle = makeMockGPUTexture({readOnlyLabel: true});
    const texture = new WebGPUTexture(device, {
      id: 'xr-compositor-color',
      handle,
      width: handle.width,
      height: handle.height,
      _isHandleBorrowed: true
    });

    expect(texture.isHandleBorrowed).toBe(true);
    expect(texture.handle).toBe(handle);
    expect(handle.label).toBe('');
    expect(handle.createView).toHaveBeenCalledOnce();

    texture.destroy();

    expect(handle.destroy).not.toHaveBeenCalled();
  });

  test('preserves existing labels and fills unlabeled ordinary supplied handles', () => {
    const device = makeMockWebGPUDevice();
    const unlabeledHandle = makeMockGPUTexture();
    const labeledHandle = makeMockGPUTexture({label: 'application-owned'});
    const unlabeledTexture = new WebGPUTexture(device, {
      id: 'generated-label',
      handle: unlabeledHandle,
      width: unlabeledHandle.width,
      height: unlabeledHandle.height
    });
    const labeledTexture = new WebGPUTexture(device, {
      id: 'replacement-label',
      handle: labeledHandle,
      width: labeledHandle.width,
      height: labeledHandle.height
    });

    expect(unlabeledHandle.label).toBe('generated-label');
    expect(labeledHandle.label).toBe('application-owned');

    unlabeledTexture.destroy();
    labeledTexture.destroy();
  });

  test('does not mutate a borrowed handle when updating an existing texture wrapper', () => {
    const device = makeMockWebGPUDevice();
    const initialHandle = makeMockGPUTexture({readOnlyLabel: true});
    const nextHandle = makeMockGPUTexture({readOnlyLabel: true});
    const texture = new WebGPUTexture(device, {
      id: 'xr-compositor-swapchain',
      handle: initialHandle,
      width: initialHandle.width,
      height: initialHandle.height,
      _isHandleBorrowed: true
    });

    texture._reinitialize(nextHandle);

    expect(texture.handle).toBe(nextHandle);
    expect(nextHandle.label).toBe('');
    expect(nextHandle.createView).toHaveBeenCalledOnce();

    texture.destroy();

    expect(initialHandle.destroy).not.toHaveBeenCalled();
    expect(nextHandle.destroy).not.toHaveBeenCalled();
  });

  test('continues labeling ordinary replacement texture handles', () => {
    const device = makeMockWebGPUDevice();
    const initialHandle = makeMockGPUTexture();
    const nextHandle = makeMockGPUTexture();
    const texture = new WebGPUTexture(device, {
      id: 'ordinary-swapchain',
      handle: initialHandle,
      width: initialHandle.width,
      height: initialHandle.height
    });

    texture._reinitialize(nextHandle);

    expect(initialHandle.label).toBe('ordinary-swapchain');
    expect(nextHandle.label).toBe('ordinary-swapchain');

    texture.destroy();
  });
});

function makeMockWebGPUDevice(): WebGPUDevice {
  const statisticsByName = new Map<string, Stats>();

  return {
    type: 'webgpu',
    userData: {},
    statsManager: {
      getStats(name: string): Stats {
        let statistics = statisticsByName.get(name);
        if (!statistics) {
          statistics = new Stats({id: name});
          statisticsByName.set(name, statistics);
        }
        return statistics;
      }
    },
    incrementTimestamp: () => 1,
    isExternalImage: () => false,
    getDefaultSampler: () => ({}),
    pushErrorScope: () => {},
    popErrorScope: () => {}
  } as unknown as WebGPUDevice;
}

function makeMockGPUTexture(options: {label?: string; readOnlyLabel?: boolean} = {}): GPUTexture {
  const handle = {
    label: options.label ?? '',
    width: 8,
    height: 4,
    createView: vi.fn(() => ({label: ''})),
    destroy: vi.fn()
  };

  if (options.readOnlyLabel) {
    Object.defineProperty(handle, 'label', {writable: false});
  }

  return handle as unknown as GPUTexture;
}
