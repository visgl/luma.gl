// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getNullTestDevice} from '@luma.gl/core/test-utils';
import {DynamicTexture} from '@luma.gl/core/dynamic';
import {getPBREnvironmentBindings, getPBREnvironmentUniforms} from '@luma.gl/engine/lighting';
import {resolveLoadedPBREnvironment} from '@luma.gl/engine/gltf';

async function makeEnvironment() {
  const device = await getNullTestDevice();
  return {
    diffuseTexture: device.createTexture({dimension: 'cube', width: 4, height: 4}),
    specularTexture: device.createTexture({dimension: 'cube', width: 4, height: 4, mipLevels: 3}),
    brdfLUTTexture: device.createTexture({width: 4, height: 4})
  };
}

test('environment adapters preserve texture identity and refresh lighting metadata', async () => {
  const environment = await makeEnvironment();
  expect(getPBREnvironmentBindings(environment).pbr_specularEnvSampler).toBe(
    environment.specularTexture
  );
  expect(getPBREnvironmentUniforms(environment)).toEqual({
    environmentIntensity: 1,
    environmentRotation: 0,
    environmentMipCount: 3
  });
  expect(getPBREnvironmentUniforms({...environment, intensity: 0, rotation: 1})).toEqual({
    environmentIntensity: 0,
    environmentRotation: 1,
    environmentMipCount: 3
  });
  expect(environment.specularTexture.destroyed).toBe(false);
  for (const texture of Object.values(environment)) texture.destroy();
  expect(() => getPBREnvironmentBindings(environment)).toThrow();
});

test('environment adapters reject mismatched devices and texture dimensions', async () => {
  const environment = await makeEnvironment();
  const device = await getNullTestDevice();
  const foreignTexture = device.createTexture({width: 4, height: 4});
  expect(() =>
    getPBREnvironmentBindings({...environment, diffuseTexture: environment.brdfLUTTexture})
  ).toThrow();
  // Use an explicit foreign device identity even when the test device helper is cached.
  expect(() =>
    getPBREnvironmentBindings({
      ...environment,
      brdfLUTTexture: Object.assign(Object.create(foreignTexture), {device: {}})
    })
  ).toThrow();
  foreignTexture.destroy();
  for (const texture of Object.values(environment)) texture.destroy();
});

test('loaded environment resolution waits for all textures and keeps dynamic ownership', async () => {
  const device = await getNullTestDevice();
  let complete!: (value: undefined) => void;
  const pending = new Promise<undefined>(resolve => {
    complete = resolve;
  });
  const environment = {
    diffuseEnvSampler: new DynamicTexture(device, {dimension: 'cube', width: 2, height: 2}),
    specularEnvSampler: new DynamicTexture(device, {dimension: 'cube', width: 4, height: 4}),
    brdfLutTexture: new DynamicTexture(device, {width: 2, height: 2, data: pending})
  };
  let resolved = false;
  const result = resolveLoadedPBREnvironment(environment, {intensity: 0.5}).then(value => {
    resolved = true;
    return value;
  });
  await environment.diffuseEnvSampler.ready;
  await environment.specularEnvSampler.ready;
  expect(resolved).toBe(false);
  complete(undefined);
  const lighting = await result;
  expect(lighting.diffuseTexture).toBe(environment.diffuseEnvSampler.texture);
  expect(lighting.brdfLUTTexture).toBe(environment.brdfLutTexture.texture);
  expect(lighting.intensity).toBe(0.5);
  for (const texture of Object.values(environment)) expect(texture.destroyed).toBe(false);
  for (const texture of Object.values(environment)) texture.destroy();
  await expect(resolveLoadedPBREnvironment(environment)).rejects.toThrow();
});
