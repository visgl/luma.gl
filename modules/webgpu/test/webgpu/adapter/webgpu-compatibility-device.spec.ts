// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import type {WebGPUTexture} from '@luma.gl/webgpu';

it('WebGPU best-available fallback requests adapter-supported limits', async () => {
  const device = await getWebGPUTestDevice('best-available');
  if (!device || device.info.featureLevel !== 'compatibility') {
    return;
  }

  for (const limitName of [
    'maxStorageBuffersInVertexStage',
    'maxStorageBuffersPerShaderStage',
    'maxComputeInvocationsPerWorkgroup'
  ] as const) {
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
