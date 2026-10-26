// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {afterEach, expect, it, vi} from 'vitest';
import {resolveDeckExampleDeviceType} from '../../examples/deck/deck-example-device';

afterEach(() => vi.unstubAllGlobals());

it.each([
  'webgpu',
  'webgl'
] as const)('honors an explicit %s backend without probing WebGPU', async backend => {
  const requestAdapter = vi.fn(() => {
    throw new Error('Explicit selection must not probe an adapter');
  });
  vi.stubGlobal('navigator', {gpu: {requestAdapter}});
  expect(await resolveDeckExampleDeviceType(backend)).toBe(backend);
  expect(requestAdapter).not.toHaveBeenCalled();
});

it('prefers WebGPU when the default adapter is available', async () => {
  const requestAdapter = vi.fn(async () => ({}));
  vi.stubGlobal('navigator', {gpu: {requestAdapter}});
  expect(await resolveDeckExampleDeviceType(null)).toBe('webgpu');
  expect(requestAdapter).toHaveBeenCalledOnce();
});

it.each([
  'absent',
  'null',
  'rejected'
])('falls back to WebGL when WebGPU is %s', async availability => {
  const requestAdapter = vi.fn(async () => {
    if (availability === 'rejected') throw new Error('Adapter unavailable');
    return null;
  });
  vi.stubGlobal('navigator', {gpu: availability === 'absent' ? undefined : {requestAdapter}});
  expect(await resolveDeckExampleDeviceType(null)).toBe('webgl');
  expect(requestAdapter).toHaveBeenCalledTimes(availability === 'absent' ? 0 : 1);
});
