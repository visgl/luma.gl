// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parsePBRMaterial} from '@luma.gl/gltf/parsers/parse-pbr-material';
import {pbrMaterial} from '@luma.gl/shadertools';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';

describe('reference glTF physical material decoding', () => {
  test('preserves the authored Khronos CompareDispersion material factors', () => {
    const device = new NullDevice({});
    try {
      const material = parsePBRMaterial(
        device,
        {
          pbrMetallicRoughness: {metallicFactor: 0, roughnessFactor: 0.1},
          extensions: {
            KHR_materials_dispersion: {dispersion: 5},
            KHR_materials_ior: {ior: 2.42},
            KHR_materials_transmission: {transmissionFactor: 1},
            KHR_materials_volume: {attenuationDistance: 1, thicknessFactor: 0.5}
          }
        },
        {},
        {}
      );

      expect(material.uniforms).toMatchObject({
        dispersion: 5,
        ior: 2.42,
        transmissionFactor: 1,
        thicknessFactor: 0.5,
        attenuationDistance: 1,
        metallicRoughnessValues: [0, 0.1]
      });
      expect(material.defines.USE_MATERIAL_EXTENSIONS).toBe(true);
      expect(material.defines.MANUAL_SRGB).toBe(true);
      expect(material.defines).not.toHaveProperty('SRGB_FAST_APPROXIMATION');
    } finally {
      device.destroy();
    }
  });

  test('keeps omitted dispersion at zero and safely clamps invalid negative factors', () => {
    const device = new NullDevice({});
    try {
      const ordinaryMaterial = parsePBRMaterial(device, {}, {}, {});
      const invalidMaterial = parsePBRMaterial(
        device,
        {extensions: {KHR_materials_dispersion: {dispersion: -2}}},
        {},
        {}
      );

      expect(ordinaryMaterial.uniforms.dispersion).toBeUndefined();
      expect(pbrMaterial.defaultUniforms.dispersion).toBe(0);
      expect(invalidMaterial.uniforms.dispersion).toBe(0);
    } finally {
      device.destroy();
    }
  });
});
