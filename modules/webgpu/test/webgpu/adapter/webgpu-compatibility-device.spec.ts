// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import type {WebGPUTexture} from '@luma.gl/webgpu';

const COMPATIBILITY_LIMIT_NAMES = [
  'maxStorageBuffersInVertexStage',
  'maxStorageBuffersPerShaderStage',
  'maxComputeInvocationsPerWorkgroup'
] as const;

// WebGPU compatibility-mode defaults that are lower than the core defaults
// https://www.w3.org/TR/webgpu/#limits
const COMPATIBILITY_DEFAULT_LIMITS = {
  maxStorageBuffersInVertexStage: 0,
  maxComputeInvocationsPerWorkgroup: 128
} as const;

it('WebGPU compatibility devices keep compatibility default limits', async () => {
  for (const featureLevel of ['compatibility', 'best-available'] as const) {
    const device = await getWebGPUTestDevice(featureLevel);
    if (!device || device.info.featureLevel !== 'compatibility') {
      continue;
    }

    for (const [limitName, defaultLimit] of Object.entries(COMPATIBILITY_DEFAULT_LIMITS)) {
      expect(
        device.handle.limits[limitName as keyof typeof COMPATIBILITY_DEFAULT_LIMITS],
        `${featureLevel} ${limitName} uses the compatibility default`
      ).toBe(defaultLimit);
    }
  }
});

it('WebGPU compatibility-max devices request adapter-supported limits', async () => {
  const device = await getWebGPUTestDevice('compatibility-max');
  if (!device || device.info.featureLevel !== 'compatibility') {
    return;
  }

  expect(
    device.features.has('core-features-and-limits'),
    'compatibility-max does not upgrade to core'
  ).toBe(false);
  for (const limitName of COMPATIBILITY_LIMIT_NAMES) {
    expect(device.handle.limits[limitName], `${limitName} matches the adapter`).toBe(
      device.adapter.limits[limitName]
    );
  }
});

it('WebGPU compatibility devices bind cube textures as cube views', async () => {
  const device = await getWebGPUTestDevice('compatibility');
  if (!device || device.info.featureLevel !== 'compatibility') {
    return;
  }

  const cubeTexture = device.createTexture({
    dimension: 'cube',
    width: 4,
    height: 4,
    format: 'rgba8unorm'
  }) as WebGPUTexture;

  expect(
    cubeTexture.handle.textureBindingViewDimension,
    'cube textures declare their binding view dimension'
  ).toBe('cube');

  device.handle.pushErrorScope('validation');
  device.handle.createBindGroup({
    layout: device.handle.createBindGroupLayout({
      entries: [{binding: 0, visibility: 0x2, texture: {viewDimension: 'cube'}}]
    }),
    entries: [{binding: 0, resource: cubeTexture.view.handle}]
  });
  const error = await device.handle.popErrorScope();
  expect(error?.message, 'a cube view binds without a validation error').toBeUndefined();

  cubeTexture.destroy();
});
