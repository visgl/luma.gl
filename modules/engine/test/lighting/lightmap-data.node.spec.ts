// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  encodeLightmapData,
  decodeLightmapData,
  sampleLightmapEnvironment,
  type LightmapData
} from '@luma.gl/engine/lighting';
test('portable lightmap data preserves HDR, coverage and UV metadata without aliasing', () => {
  const original: LightmapData = {
    version: 1,
    width: 3,
    height: 2,
    uvSet: 1,
    encoding: 'linear-irradiance',
    data: Float32Array.from({length: 24}, (_, index) => index / 2)
  };
  const encoded = encodeLightmapData(original);
  const decoded = decodeLightmapData(encoded);
  expect(decoded).toEqual(original);
  decoded.data[0] = 99;
  expect(original.data[0]).toBe(0);
  expect(decodeLightmapData(encoded).data[0]).toBe(0);
  expect(() => decodeLightmapData(encoded.slice(0, -4))).toThrow();
  expect(() => decodeLightmapData(new ArrayBuffer(16))).toThrow();
  new DataView(encoded).setUint32(4, 0xffffffff, true);
  expect(() => decodeLightmapData(encoded)).toThrow();
});
test('uniform environment samples integrate radiance to pi times radiance', () => {
  const environment = {width: 1, height: 1, data: new Float32Array([2, 1, 0.5])};
  const count = 4096;
  const irradiance = [0, 0, 0];
  for (let index = 0; index < count; index++) {
    const sample = sampleLightmapEnvironment(environment, index, count);
    expect(Math.hypot(...sample.directionToLight)).toBeCloseTo(1, 6);
    for (let channel = 0; channel < 3; channel++)
      irradiance[channel] +=
        (sample.light.color[channel] * Math.max(0, sample.directionToLight[1])) / count;
  }
  irradiance.forEach((value, index) =>
    expect(value).toBeCloseTo(Math.PI * environment.data[index], 5)
  );
  expect(() => sampleLightmapEnvironment(environment, count, count)).toThrow();
});

test('environment lookup follows north-to-south rows and +X toward +Z longitudes', () => {
  const environment = {
    width: 4,
    height: 2,
    data: Float32Array.from({length: 24}, (_, index) => Math.floor(index / 3) + 1)
  };
  const expectedTexels = [1, 3, 2, 4, 5, 7, 6, 8];
  expectedTexels.forEach((value, index) => {
    const sample = sampleLightmapEnvironment(environment, index, 8);
    expect(sample.light.color[0]).toBeCloseTo(value * 4 * Math.PI, 6);
    expect(sample.light.direction).toEqual(sample.directionToLight.map(component => -component));
  });
});
