// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {parsePBRMaterial} from '../../src/parsers/parse-pbr-material';
import {
  getSingleScatterAlbedo,
  getScatterVolumeCoefficients,
  getThinWallScatterWeights
} from '../../src/gltf/gltf-materials-scatter';

test('scatter albedo recovers exact absorption and remains finite near phase limits', () => {
  for (const anisotropy of [-0.999, 0, 0.999]) {
    expect(getSingleScatterAlbedo(0, anisotropy)).toBe(0);
    for (const albedo of [0.001, 0.25, 0.5, 1]) {
      const result = getSingleScatterAlbedo(albedo, anisotropy);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    }
  }
});

test('thin-wall scatter conserves the transmission budget across both hemispheres', () => {
  for (const strength of [0, 0.5, 1]) {
    for (const anisotropy of [-0.999, 0, 0.999]) {
      const weights = getThinWallScatterWeights(strength, 0.7, anisotropy);
      expect(
        weights.specularTransmission + weights.diffuseTransmission + weights.diffuseReflection
      ).toBeCloseTo(0.7);
    }
  }
  expect(getThinWallScatterWeights(0, 0.7, 0)).toEqual({
    specularTransmission: 0.7,
    diffuseTransmission: 0,
    diffuseReflection: 0
  });
});

test('volume scatter partitions extinction and exactly recovers absorption-only transport', () => {
  const original = getScatterVolumeCoefficients([0.2, 0.5, 1], 2, [0.8, 0.4, 0], 0, 0.5);
  expect(original.scattering).toEqual([0, 0, 0]);
  expect(original.absorption).toEqual(original.extinction);
  const scattered = getScatterVolumeCoefficients([0.2, 0.5, 1], 2, [0.8, 0.4, 0], 0.7, 0.5);
  for (let channel = 0; channel < 3; channel++) {
    expect(scattered.scattering[channel] + scattered.absorption[channel]).toBeCloseTo(
      scattered.extinction[channel]
    );
  }
  expect(getScatterVolumeCoefficients([0, 0.5, 1], Infinity, [1, 1, 1], 1, 0).extinction).toEqual([
    0, 0, 0
  ]);
  expect(getScatterVolumeCoefficients([0, 0.5, 1], 1, [0, 0, 0], 1, 0).scattering).toEqual([
    0, 0, 0
  ]);
});

test('scatter thin-wall material parses the draft factors and defaults', () => {
  const material = parsePBRMaterial(
    new NullDevice({}),
    {
      extensions: {
        KHR_materials_transmission: {transmissionFactor: 0.8},
        KHR_materials_scatter: {scatterStrengthFactor: 0.6, scatterAnisotropy: 0.2}
      }
    },
    {},
    {}
  );
  expect(material.defines.HAS_MATERIAL_SCATTER).toBe(true);
  expect(material.uniforms.scatterStrengthFactor).toBe(0.6);
  expect(material.uniforms.multiscatterColorFactor).toEqual([1, 1, 1]);
  expect(material.uniforms.scatterAnisotropy).toBe(0.2);
});

test('scatter ignores absent transmission and rejects excluded material combinations', () => {
  const device = new NullDevice({});
  const parsed = parsePBRMaterial(
    device,
    {extensions: {KHR_materials_scatter: {scatterStrengthFactor: 1}}},
    {},
    {}
  );
  expect(parsed.defines.HAS_MATERIAL_SCATTER).toBeUndefined();
  for (const exclusion of [
    'KHR_materials_unlit',
    'KHR_materials_diffuse_transmission',
    'KHR_materials_pbrSpecularGlossiness'
  ]) {
    expect(() =>
      parsePBRMaterial(
        device,
        {
          extensions: {
            KHR_materials_transmission: {transmissionFactor: 1},
            KHR_materials_scatter: {scatterStrengthFactor: 1},
            [exclusion]: {}
          }
        },
        {},
        {}
      )
    ).toThrow();
  }
});
