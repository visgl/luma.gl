// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {getNullTestDevice} from '@luma.gl/core/test-utils';
import type {Device, Texture} from '@luma.gl/core';
import {PrefilteredEnvironment, PrefilteredEnvironmentGenerator} from '@luma.gl/engine/lighting';

const textureDevice = {};
function makeTexture(dimension = 'cube') {
  return {destroy: vi.fn(), device: textureDevice, dimension} as unknown as Texture;
}

test('environment releases only owned textures once', () => {
  const textures = {
    diffuseTexture: makeTexture(),
    specularTexture: makeTexture(),
    brdfLUTTexture: makeTexture('2d')
  };
  const environment = new PrefilteredEnvironment(textures, false);
  expect(environment.getBindings().pbr_specularEnvSampler).toBe(textures.specularTexture);
  environment.destroy();
  environment.destroy();
  expect(textures.diffuseTexture.destroy).toHaveBeenCalledTimes(1);
  expect(textures.specularTexture.destroy).toHaveBeenCalledTimes(1);
  expect(textures.brdfLUTTexture.destroy).not.toHaveBeenCalled();
});

test('allocation failures release already allocated textures without touching source', () => {
  const first = makeTexture();
  const device = {
    getTextureFormatCapabilities: () => ({render: true, filter: true}),
    getMipLevelCount: () => 3,
    createTexture: vi
      .fn()
      .mockReturnValueOnce(first)
      .mockImplementationOnce(() => {
        throw new Error('allocation failed');
      })
  } as unknown as Device;
  const source = {
    device,
    dimension: '2d',
    destroyed: false,
    destroy: vi.fn()
  } as unknown as Texture;
  const generator = new PrefilteredEnvironmentGenerator(device);
  expect(() => generator.prepare({source})).toThrow('allocation failed');
  expect(first.destroy).toHaveBeenCalledTimes(1);
  expect(source.destroy).not.toHaveBeenCalled();
  generator.destroy();
});

test('default precision does not silently fall back to unorm', () => {
  const device = {
    getTextureFormatCapabilities: vi.fn(() => ({render: false, filter: false})),
    createTexture: vi.fn()
  } as unknown as Device;
  const source = {device, dimension: '2d', destroyed: false} as unknown as Texture;
  expect(() => new PrefilteredEnvironmentGenerator(device).prepare({source})).toThrow();
  expect(device.getTextureFormatCapabilities).toHaveBeenCalledWith('rgba16float');
  expect(device.createTexture).not.toHaveBeenCalled();
});

test('never manually decodes hardware-sRGB source textures a second time', async () => {
  const device = await getNullTestDevice();
  const rawSRGBSource = device.createTexture({
    width: 4,
    height: 2,
    format: 'rgba8unorm'
  });
  const hardwareSRGBSource = device.createTexture({
    width: 4,
    height: 2,
    format: 'rgba8unorm-srgb'
  });
  const generator = new PrefilteredEnvironmentGenerator(device);
  const prepareOptions = {
    size: 2,
    irradianceSize: 2,
    brdfLUTSize: 2,
    sampleCount: 2,
    format: 'rgba8unorm' as const,
    sourceEncoding: 'srgb' as const
  };

  try {
    const rawEnvironment = generator.prepare({...prepareOptions, source: rawSRGBSource});
    const filterModel = (
      generator as unknown as {
        model: {shaderInputs: {getUniformValues(): Record<string, {sourceEncoding: number}>}};
      }
    ).model;
    expect(filterModel.shaderInputs.getUniformValues().pbrEnvironmentFilter.sourceEncoding).toBe(1);
    rawEnvironment.destroy();

    const hardwareEnvironment = generator.prepare({
      ...prepareOptions,
      source: hardwareSRGBSource
    });
    expect(filterModel.shaderInputs.getUniformValues().pbrEnvironmentFilter.sourceEncoding).toBe(0);
    hardwareEnvironment.destroy();
  } finally {
    generator.destroy();
    rawSRGBSource.destroy();
    hardwareSRGBSource.destroy();
  }
});
