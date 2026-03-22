// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {NullDevice} from '@luma.gl/test-utils';
import {log} from '@luma.gl/core';

import {parsePBRMaterial} from '@luma.gl/gltf/parsers/parse-pbr-material';

const device = new NullDevice({});

function makeCompressedTextureInfo(id: string) {
  return {
    id,
    texture: {
      source: {
        image: {
          compressed: true,
          mipmaps: true,
          data: [
            {
              data: new Uint8Array(16),
              width: 4,
              height: 4,
              textureFormat: 'bc7-rgba-unorm'
            }
          ]
        }
      },
      sampler: {}
    }
  };
}

function makeUnresolvedTextureInfo(id: string) {
  return {
    id,
    texture: {}
  };
}

function makeIndexedTextureInfo(id: string, index: number) {
  return {
    id,
    index
  };
}

function destroyParsedTextures(parsedMaterial: ReturnType<typeof parsePBRMaterial>): void {
  parsedMaterial.generatedTextures.forEach(texture => texture.destroy());
}

function captureWarnings(runTestCase: () => void): string[] {
  const warnings: string[] = [];
  const originalWarn = log.warn.bind(log);

  log.warn = ((message: string) => {
    return () => {
      warnings.push(message);
    };
  }) as typeof log.warn;

  try {
    runTestCase();
  } finally {
    log.warn = originalWarn;
  }

  return warnings;
}

test('gltf#parsePBRMaterial enables core material maps and factors', t => {
  const parsedMaterial = parsePBRMaterial(
    device,
    {
      pbrMetallicRoughness: {
        baseColorTexture: makeCompressedTextureInfo('base-color'),
        baseColorFactor: [0.1, 0.2, 0.3, 0.4],
        metallicRoughnessTexture: makeCompressedTextureInfo('metallic-roughness'),
        metallicFactor: 0.6,
        roughnessFactor: 0.7
      },
      normalTexture: {...makeCompressedTextureInfo('normal'), scale: 0.25},
      occlusionTexture: {...makeCompressedTextureInfo('occlusion'), strength: 0.5},
      emissiveFactor: [0.2, 0.4, 0.6],
      alphaMode: 'OPAQUE'
    },
    {NORMAL: {}, TEXCOORD_0: {}},
    {}
  );

  t.equal(parsedMaterial.uniforms.baseColorMapEnabled, true, 'base color map enabled');
  t.equal(
    parsedMaterial.uniforms.metallicRoughnessMapEnabled,
    true,
    'metallic-roughness map enabled'
  );
  t.equal(parsedMaterial.uniforms.normalMapEnabled, true, 'normal map enabled');
  t.equal(parsedMaterial.uniforms.occlusionMapEnabled, true, 'occlusion map enabled');
  t.deepEqual(
    parsedMaterial.uniforms.baseColorFactor,
    [0.1, 0.2, 0.3, 0.4],
    'base color factor parsed'
  );
  t.deepEqual(
    parsedMaterial.uniforms.metallicRoughnessValues,
    [0.6, 0.7],
    'metallic-roughness values parsed'
  );
  t.equal(parsedMaterial.uniforms.normalScale, 0.25, 'normal scale parsed');
  t.equal(parsedMaterial.uniforms.occlusionStrength, 0.5, 'occlusion strength parsed');
  t.deepEqual(
    parsedMaterial.uniforms.emissiveFactor,
    [0.2, 0.4, 0.6],
    'emissive factor is preserved without an emissive texture'
  );
  t.notOk(parsedMaterial.defines['ALPHA_CUTOFF'], 'opaque material leaves alpha cutoff disabled');
  t.notOk(
    parsedMaterial.defines['USE_MATERIAL_EXTENSIONS'],
    'plain metallic-roughness material keeps extension shading disabled'
  );

  destroyParsedTextures(parsedMaterial);
  t.end();
});

test('gltf#parsePBRMaterial parses KHR_materials extensions', t => {
  const parsedMaterial = parsePBRMaterial(
    device,
    {
      extensions: {
        KHR_materials_specular: {
          specularFactor: 0.9,
          specularTexture: makeCompressedTextureInfo('specular-intensity'),
          specularColorFactor: [0.3, 0.4, 0.5],
          specularColorTexture: makeCompressedTextureInfo('specular-color')
        },
        KHR_materials_ior: {
          ior: 1.7
        },
        KHR_materials_transmission: {
          transmissionFactor: 0.6,
          transmissionTexture: makeCompressedTextureInfo('transmission')
        },
        KHR_materials_volume: {
          thicknessFactor: 0.4,
          attenuationDistance: 12,
          attenuationColor: [0.7, 0.8, 0.9]
        },
        KHR_materials_clearcoat: {
          clearcoatFactor: 0.8,
          clearcoatTexture: makeCompressedTextureInfo('clearcoat'),
          clearcoatRoughnessFactor: 0.2,
          clearcoatRoughnessTexture: makeCompressedTextureInfo('clearcoat-roughness')
        },
        KHR_materials_sheen: {
          sheenColorFactor: [0.15, 0.25, 0.35],
          sheenColorTexture: makeCompressedTextureInfo('sheen-color'),
          sheenRoughnessFactor: 0.45,
          sheenRoughnessTexture: makeCompressedTextureInfo('sheen-roughness')
        },
        KHR_materials_iridescence: {
          iridescenceFactor: 0.55,
          iridescenceTexture: makeCompressedTextureInfo('iridescence'),
          iridescenceIor: 1.4,
          iridescenceThicknessMinimum: 50,
          iridescenceThicknessMaximum: 350
        },
        KHR_materials_anisotropy: {
          anisotropyStrength: 0.65,
          anisotropyRotation: 0.75,
          anisotropyTexture: makeCompressedTextureInfo('anisotropy')
        },
        KHR_materials_emissive_strength: {
          emissiveStrength: 5
        }
      }
    },
    {TEXCOORD_0: {}},
    {}
  );

  t.deepEqual(
    parsedMaterial.uniforms.specularColorFactor,
    [0.3, 0.4, 0.5],
    'specular color factor parsed'
  );
  t.equal(parsedMaterial.uniforms.specularIntensityFactor, 0.9, 'specular factor parsed');
  t.equal(parsedMaterial.uniforms.specularColorMapEnabled, true, 'specular color map enabled');
  t.equal(
    parsedMaterial.uniforms.specularIntensityMapEnabled,
    true,
    'specular intensity map enabled'
  );
  t.equal(parsedMaterial.uniforms.ior, 1.7, 'ior parsed');
  t.equal(parsedMaterial.uniforms.transmissionFactor, 0.6, 'transmission factor parsed');
  t.equal(parsedMaterial.uniforms.transmissionMapEnabled, true, 'transmission map enabled');
  t.equal(parsedMaterial.uniforms.thicknessFactor, 0.4, 'volume thickness parsed');
  t.equal(parsedMaterial.uniforms.attenuationDistance, 12, 'attenuation distance parsed');
  t.deepEqual(
    parsedMaterial.uniforms.attenuationColor,
    [0.7, 0.8, 0.9],
    'attenuation color parsed'
  );
  t.equal(parsedMaterial.uniforms.clearcoatFactor, 0.8, 'clearcoat factor parsed');
  t.equal(
    parsedMaterial.uniforms.clearcoatRoughnessFactor,
    0.2,
    'clearcoat roughness factor parsed'
  );
  t.equal(parsedMaterial.uniforms.clearcoatMapEnabled, true, 'clearcoat maps enabled');
  t.equal(
    parsedMaterial.uniforms.clearcoatRoughnessMapEnabled,
    true,
    'clearcoat roughness map enabled'
  );
  t.deepEqual(
    parsedMaterial.uniforms.sheenColorFactor,
    [0.15, 0.25, 0.35],
    'sheen color factor parsed'
  );
  t.equal(parsedMaterial.uniforms.sheenRoughnessFactor, 0.45, 'sheen roughness factor parsed');
  t.equal(parsedMaterial.uniforms.sheenColorMapEnabled, true, 'sheen color map enabled');
  t.equal(parsedMaterial.uniforms.sheenRoughnessMapEnabled, true, 'sheen roughness map enabled');
  t.equal(parsedMaterial.uniforms.iridescenceFactor, 0.55, 'iridescence factor parsed');
  t.equal(parsedMaterial.uniforms.iridescenceIor, 1.4, 'iridescence ior parsed');
  t.deepEqual(
    parsedMaterial.uniforms.iridescenceThicknessRange,
    [50, 350],
    'iridescence thickness range parsed'
  );
  t.equal(parsedMaterial.uniforms.iridescenceMapEnabled, true, 'iridescence map enabled');
  t.equal(parsedMaterial.uniforms.anisotropyStrength, 0.65, 'anisotropy strength parsed');
  t.equal(parsedMaterial.uniforms.anisotropyRotation, 0.75, 'anisotropy rotation parsed');
  t.equal(parsedMaterial.uniforms.anisotropyMapEnabled, true, 'anisotropy map enabled');
  t.equal(parsedMaterial.uniforms.emissiveStrength, 5, 'emissive strength parsed');

  t.ok(parsedMaterial.defines['HAS_SPECULARCOLORMAP'], 'specular color define added');
  t.ok(parsedMaterial.defines['HAS_SPECULARINTENSITYMAP'], 'specular intensity define added');
  t.ok(parsedMaterial.defines['HAS_TRANSMISSIONMAP'], 'transmission define added');
  t.ok(parsedMaterial.defines['HAS_CLEARCOATMAP'], 'clearcoat define added');
  t.ok(parsedMaterial.defines['HAS_CLEARCOATROUGHNESSMAP'], 'clearcoat roughness define added');
  t.ok(parsedMaterial.defines['HAS_SHEENCOLORMAP'], 'sheen define added');
  t.ok(parsedMaterial.defines['HAS_SHEENROUGHNESSMAP'], 'sheen roughness define added');
  t.ok(parsedMaterial.defines['HAS_IRIDESCENCEMAP'], 'iridescence define added');
  t.ok(parsedMaterial.defines['HAS_ANISOTROPYMAP'], 'anisotropy define added');
  t.ok(
    parsedMaterial.defines['USE_MATERIAL_EXTENSIONS'],
    'material extension shading define added'
  );

  t.ok(parsedMaterial.bindings.pbr_specularColorSampler, 'specular color binding created');
  t.ok(parsedMaterial.bindings.pbr_specularIntensitySampler, 'specular intensity binding created');
  t.ok(parsedMaterial.bindings.pbr_transmissionSampler, 'transmission binding created');
  t.ok(parsedMaterial.bindings.pbr_clearcoatSampler, 'clearcoat binding created');
  t.ok(
    parsedMaterial.bindings.pbr_clearcoatRoughnessSampler,
    'clearcoat roughness binding created'
  );
  t.ok(parsedMaterial.bindings.pbr_sheenColorSampler, 'sheen color binding created');
  t.ok(parsedMaterial.bindings.pbr_sheenRoughnessSampler, 'sheen roughness binding created');
  t.ok(parsedMaterial.bindings.pbr_iridescenceSampler, 'iridescence binding created');
  t.ok(parsedMaterial.bindings.pbr_anisotropySampler, 'anisotropy binding created');

  destroyParsedTextures(parsedMaterial);
  t.end();
});

test('gltf#parsePBRMaterial reads KHR_materials_unlit from material.extensions', t => {
  const parsedMaterial = parsePBRMaterial(
    device,
    {
      extensions: {
        KHR_materials_unlit: {}
      }
    },
    {},
    {}
  );

  t.equal(parsedMaterial.uniforms.unlit, true, 'unlit extension enables unlit shading');

  destroyParsedTextures(parsedMaterial);
  t.end();
});

test('gltf#parsePBRMaterial skips unresolved extension textures', t => {
  const parsedMaterial = parsePBRMaterial(
    device,
    {
      extensions: {
        KHR_materials_transmission: {
          transmissionFactor: 0.6,
          transmissionTexture: makeUnresolvedTextureInfo('transmission')
        }
      }
    },
    {TEXCOORD_0: {}},
    {}
  );

  t.equal(parsedMaterial.uniforms.transmissionFactor, 0.6, 'factor is preserved');
  t.notOk(
    parsedMaterial.bindings.pbr_transmissionSampler,
    'binding is skipped when image is missing'
  );
  t.notOk(parsedMaterial.uniforms.transmissionMapEnabled, 'map flag stays disabled');
  t.notOk(parsedMaterial.defines['HAS_TRANSMISSIONMAP'], 'map define stays disabled');

  destroyParsedTextures(parsedMaterial);
  t.end();
});

test('gltf#parsePBRMaterial resolves extension textures from parent gltf textures', t => {
  const parsedMaterial = parsePBRMaterial(
    device,
    {
      extensions: {
        KHR_materials_clearcoat: {
          clearcoatFactor: 1,
          clearcoatTexture: makeIndexedTextureInfo('clearcoat', 0),
          clearcoatRoughnessTexture: makeIndexedTextureInfo('clearcoat-roughness', 1)
        }
      }
    },
    {TEXCOORD_0: {}},
    {
      gltf: {
        textures: [
          makeCompressedTextureInfo('resolved-clearcoat'),
          makeCompressedTextureInfo('resolved-clearcoat-roughness')
        ]
      } as any
    }
  );

  t.ok(
    parsedMaterial.bindings.pbr_clearcoatSampler,
    'clearcoat binding resolved from gltf texture'
  );
  t.ok(
    parsedMaterial.bindings.pbr_clearcoatRoughnessSampler,
    'clearcoat roughness binding resolved from gltf texture'
  );
  t.equal(parsedMaterial.uniforms.clearcoatMapEnabled, true, 'clearcoat map flag enabled');
  t.equal(
    parsedMaterial.uniforms.clearcoatRoughnessMapEnabled,
    true,
    'clearcoat roughness map flag enabled'
  );
  t.ok(parsedMaterial.defines['HAS_CLEARCOATMAP'], 'clearcoat map define enabled');
  t.ok(
    parsedMaterial.defines['HAS_CLEARCOATROUGHNESSMAP'],
    'clearcoat roughness map define enabled'
  );

  destroyParsedTextures(parsedMaterial);
  t.end();
});

test('gltf#parsePBRMaterial warns when textured materials are missing TEXCOORD_0', t => {
  const warnings = captureWarnings(() => {
    const parsedMaterial = parsePBRMaterial(
      device,
      {
        pbrMetallicRoughness: {
          baseColorTexture: makeCompressedTextureInfo('base-color')
        }
      },
      {NORMAL: {}},
      {}
    );
    destroyParsedTextures(parsedMaterial);
  });

  t.ok(
    warnings.some(
      warning => warning.includes('missing TEXCOORD_0') && warning.includes('baseColorTexture')
    ),
    'missing TEXCOORD_0 warning emitted for textured material'
  );

  t.end();
});

test('gltf#parsePBRMaterial warns when lit materials are missing NORMAL', t => {
  const warnings = captureWarnings(() => {
    const parsedMaterial = parsePBRMaterial(
      device,
      {
        normalTexture: makeCompressedTextureInfo('normal')
      },
      {TEXCOORD_0: {}},
      {}
    );
    destroyParsedTextures(parsedMaterial);
  });

  t.ok(
    warnings.some(
      warning =>
        warning.includes('missing NORMAL') && warning.includes('lit PBR shading with normalTexture')
    ),
    'missing NORMAL warning emitted for lit normal-mapped material'
  );

  t.end();
});

test('gltf#parsePBRMaterial can suppress attribute warnings for shared material parsing', t => {
  const warnings = captureWarnings(() => {
    const parsedMaterial = parsePBRMaterial(
      device,
      {
        pbrMetallicRoughness: {
          baseColorTexture: makeCompressedTextureInfo('base-color')
        },
        normalTexture: makeCompressedTextureInfo('normal')
      },
      {},
      {validateAttributes: false}
    );
    destroyParsedTextures(parsedMaterial);
  });

  t.deepEqual(warnings, [], 'shared material parsing can skip primitive attribute diagnostics');

  t.end();
});
