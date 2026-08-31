// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {log, type TextureFormat} from '@luma.gl/core';
import {parsePBRMaterial} from '@luma.gl/gltf/parsers/parse-pbr-material';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

class CompressedTextureNullDevice extends NullDevice {
  override isTextureFormatSupported(_format: TextureFormat): boolean {
    return true;
  }
}

const device = new CompressedTextureNullDevice({});

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

it('gltf#parsePBRMaterial enables core material maps and factors', () => {
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

  expect(parsedMaterial.uniforms.baseColorMapEnabled, 'base color map enabled').toBe(true);
  expect(
    parsedMaterial.uniforms.metallicRoughnessMapEnabled,
    'metallic-roughness map enabled'
  ).toBe(true);
  expect(parsedMaterial.uniforms.normalMapEnabled, 'normal map enabled').toBe(true);
  expect(parsedMaterial.uniforms.occlusionMapEnabled, 'occlusion map enabled').toBe(true);
  expect(parsedMaterial.uniforms.baseColorFactor, 'base color factor parsed').toEqual([
    0.1, 0.2, 0.3, 0.4
  ]);
  expect(
    parsedMaterial.uniforms.metallicRoughnessValues,
    'metallic-roughness values parsed'
  ).toEqual([0.6, 0.7]);
  expect(parsedMaterial.uniforms.normalScale, 'normal scale parsed').toBe(0.25);
  expect(parsedMaterial.uniforms.occlusionStrength, 'occlusion strength parsed').toBe(0.5);
  expect(
    parsedMaterial.uniforms.emissiveFactor,
    'emissive factor is preserved without an emissive texture'
  ).toEqual([0.2, 0.4, 0.6]);
  expect(
    Boolean(parsedMaterial.defines['ALPHA_CUTOFF']),
    'opaque material leaves alpha cutoff disabled'
  ).toBe(false);
  expect(
    Boolean(parsedMaterial.defines['USE_MATERIAL_EXTENSIONS']),
    'plain metallic-roughness material keeps extension shading disabled'
  ).toBe(false);

  destroyParsedTextures(parsedMaterial);
});

it('gltf#parsePBRMaterial accepts normalized geometry attribute names', () => {
  const warnings = captureWarnings(() => {
    const parsedMaterial = parsePBRMaterial(
      device,
      {
        pbrMetallicRoughness: {
          baseColorTexture: makeCompressedTextureInfo('base-color')
        },
        normalTexture: makeCompressedTextureInfo('normal')
      },
      {normals: {}, texCoords: {}},
      {}
    );

    expect(parsedMaterial.defines['HAS_NORMALS'], 'normalized normals enable HAS_NORMALS').toBe(
      true
    );
    expect(parsedMaterial.defines['HAS_UV'], 'normalized texCoords enable HAS_UV').toBe(true);
    expect(parsedMaterial.uniforms.baseColorMapEnabled, 'base color map stays enabled').toBe(true);

    destroyParsedTextures(parsedMaterial);
  });

  expect(
    Boolean(warnings.some(warning => warning.includes('missing TEXCOORD_0'))),
    'normalized texCoords avoid missing TEXCOORD_0 warning'
  ).toBe(false);
  expect(
    Boolean(warnings.some(warning => warning.includes('missing NORMAL'))),
    'normalized normals avoid missing NORMAL warning'
  ).toBe(false);
});

it('gltf#parsePBRMaterial parses KHR_materials extensions', () => {
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
          thicknessTexture: makeCompressedTextureInfo('thickness'),
          attenuationDistance: 12,
          attenuationColor: [0.7, 0.8, 0.9]
        },
        KHR_materials_dispersion: {
          dispersion: 0.65
        },
        KHR_materials_clearcoat: {
          clearcoatFactor: 0.8,
          clearcoatTexture: makeCompressedTextureInfo('clearcoat'),
          clearcoatRoughnessFactor: 0.2,
          clearcoatRoughnessTexture: makeCompressedTextureInfo('clearcoat-roughness'),
          clearcoatNormalTexture: makeCompressedTextureInfo('clearcoat-normal')
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
          iridescenceThicknessMaximum: 350,
          iridescenceThicknessTexture: makeCompressedTextureInfo('iridescence-thickness')
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

  expect(parsedMaterial.uniforms.specularColorFactor, 'specular color factor parsed').toEqual([
    0.3, 0.4, 0.5
  ]);
  expect(parsedMaterial.uniforms.specularIntensityFactor, 'specular factor parsed').toBe(0.9);
  expect(parsedMaterial.uniforms.specularColorMapEnabled, 'specular color map enabled').toBe(true);
  expect(
    parsedMaterial.uniforms.specularIntensityMapEnabled,
    'specular intensity map enabled'
  ).toBe(true);
  expect(parsedMaterial.uniforms.ior, 'ior parsed').toBe(1.7);
  expect(parsedMaterial.uniforms.transmissionFactor, 'transmission factor parsed').toBe(0.6);
  expect(parsedMaterial.uniforms.dispersion, 'ratified chromatic dispersion parsed').toBe(0.65);
  expect(parsedMaterial.uniforms.transmissionMapEnabled, 'transmission map enabled').toBe(true);
  expect(parsedMaterial.uniforms.thicknessFactor, 'volume thickness parsed').toBe(0.4);
  expect(Boolean(parsedMaterial.bindings.pbr_thicknessSampler), 'thickness binding created').toBe(
    true
  );
  expect(parsedMaterial.uniforms.attenuationDistance, 'attenuation distance parsed').toBe(12);
  expect(parsedMaterial.uniforms.attenuationColor, 'attenuation color parsed').toEqual([
    0.7, 0.8, 0.9
  ]);
  expect(parsedMaterial.uniforms.clearcoatFactor, 'clearcoat factor parsed').toBe(0.8);
  expect(
    parsedMaterial.uniforms.clearcoatRoughnessFactor,
    'clearcoat roughness factor parsed'
  ).toBe(0.2);
  expect(parsedMaterial.uniforms.clearcoatMapEnabled, 'clearcoat maps enabled').toBe(true);
  expect(
    parsedMaterial.uniforms.clearcoatRoughnessMapEnabled,
    'clearcoat roughness map enabled'
  ).toBe(true);
  expect(
    Boolean(parsedMaterial.bindings.pbr_clearcoatNormalSampler),
    'clearcoat normal binding created'
  ).toBe(true);
  expect(parsedMaterial.uniforms.sheenColorFactor, 'sheen color factor parsed').toEqual([
    0.15, 0.25, 0.35
  ]);
  expect(parsedMaterial.uniforms.sheenRoughnessFactor, 'sheen roughness factor parsed').toBe(0.45);
  expect(parsedMaterial.uniforms.sheenColorMapEnabled, 'sheen color map enabled').toBe(true);
  expect(parsedMaterial.uniforms.sheenRoughnessMapEnabled, 'sheen roughness map enabled').toBe(
    true
  );
  expect(parsedMaterial.uniforms.iridescenceFactor, 'iridescence factor parsed').toBe(0.55);
  expect(parsedMaterial.uniforms.iridescenceIor, 'iridescence ior parsed').toBe(1.4);
  expect(
    parsedMaterial.uniforms.iridescenceThicknessRange,
    'iridescence thickness range parsed'
  ).toEqual([50, 350]);
  expect(parsedMaterial.uniforms.iridescenceMapEnabled, 'iridescence map enabled').toBe(true);
  expect(
    Boolean(parsedMaterial.bindings.pbr_iridescenceThicknessSampler),
    'iridescence thickness binding created'
  ).toBe(true);
  expect(parsedMaterial.uniforms.anisotropyStrength, 'anisotropy strength parsed').toBe(0.65);
  expect(parsedMaterial.uniforms.anisotropyRotation, 'anisotropy rotation parsed').toBe(0.75);
  expect(parsedMaterial.uniforms.anisotropyMapEnabled, 'anisotropy map enabled').toBe(true);
  expect(parsedMaterial.uniforms.emissiveStrength, 'emissive strength parsed').toBe(5);

  expect(
    Boolean(parsedMaterial.defines['HAS_SPECULARCOLORMAP']),
    'specular color define added'
  ).toBe(true);
  expect(
    Boolean(parsedMaterial.defines['HAS_SPECULARINTENSITYMAP']),
    'specular intensity define added'
  ).toBe(true);
  expect(Boolean(parsedMaterial.defines['HAS_TRANSMISSIONMAP']), 'transmission define added').toBe(
    true
  );
  expect(Boolean(parsedMaterial.defines['HAS_THICKNESSMAP']), 'thickness define added').toBe(true);
  expect(Boolean(parsedMaterial.defines['HAS_CLEARCOATMAP']), 'clearcoat define added').toBe(true);
  expect(
    Boolean(parsedMaterial.defines['HAS_CLEARCOATROUGHNESSMAP']),
    'clearcoat roughness define added'
  ).toBe(true);
  expect(
    Boolean(parsedMaterial.defines['HAS_CLEARCOATNORMALMAP']),
    'clearcoat normal define added'
  ).toBe(true);
  expect(Boolean(parsedMaterial.defines['HAS_SHEENCOLORMAP']), 'sheen define added').toBe(true);
  expect(
    Boolean(parsedMaterial.defines['HAS_SHEENROUGHNESSMAP']),
    'sheen roughness define added'
  ).toBe(true);
  expect(Boolean(parsedMaterial.defines['HAS_IRIDESCENCEMAP']), 'iridescence define added').toBe(
    true
  );
  expect(
    Boolean(parsedMaterial.defines['HAS_IRIDESCENCETHICKNESSMAP']),
    'iridescence thickness define added'
  ).toBe(true);
  expect(Boolean(parsedMaterial.defines['HAS_ANISOTROPYMAP']), 'anisotropy define added').toBe(
    true
  );
  expect(
    Boolean(parsedMaterial.defines['USE_MATERIAL_EXTENSIONS']),
    'material extension shading define added'
  ).toBe(true);

  expect(
    Boolean(parsedMaterial.bindings.pbr_specularColorSampler),
    'specular color binding created'
  ).toBe(true);
  expect(
    Boolean(parsedMaterial.bindings.pbr_specularIntensitySampler),
    'specular intensity binding created'
  ).toBe(true);
  expect(
    Boolean(parsedMaterial.bindings.pbr_transmissionSampler),
    'transmission binding created'
  ).toBe(true);
  expect(Boolean(parsedMaterial.bindings.pbr_clearcoatSampler), 'clearcoat binding created').toBe(
    true
  );
  expect(
    Boolean(parsedMaterial.bindings.pbr_clearcoatRoughnessSampler),
    'clearcoat roughness binding created'
  ).toBe(true);
  expect(
    Boolean(parsedMaterial.bindings.pbr_sheenColorSampler),
    'sheen color binding created'
  ).toBe(true);
  expect(
    Boolean(parsedMaterial.bindings.pbr_sheenRoughnessSampler),
    'sheen roughness binding created'
  ).toBe(true);
  expect(
    Boolean(parsedMaterial.bindings.pbr_iridescenceSampler),
    'iridescence binding created'
  ).toBe(true);
  expect(Boolean(parsedMaterial.bindings.pbr_anisotropySampler), 'anisotropy binding created').toBe(
    true
  );

  destroyParsedTextures(parsedMaterial);
});

it('gltf#parsePBRMaterial configures runtime UV selectors and baked transforms', () => {
  const parsedMaterial = parsePBRMaterial(
    device,
    {
      pbrMetallicRoughness: {
        baseColorTexture: {
          ...makeCompressedTextureInfo('base-color'),
          texCoord: 1,
          extensions: {
            KHR_texture_transform: {
              offset: [0.25, 0.5],
              rotation: 0.2,
              scale: [1.5, 0.75]
            }
          }
        }
      },
      normalTexture: makeCompressedTextureInfo('normal')
    } as any,
    {TEXCOORD_0: {}, TEXCOORD_1: {}},
    {}
  );

  expect(
    parsedMaterial.uniforms.baseColorUVSet,
    'texture texCoord is preserved for runtime sampling'
  ).toBe(1);
  expect(
    parsedMaterial.uniforms.baseColorUVTransform?.map(value => Number(value.toFixed(6))),
    'baked texture transform matrix is captured for runtime delta computation'
  ).toEqual([1.4701, 0.298004, 0, -0.149002, 0.73505, 0, 0.25, 0.5, 1]);
  expect(
    parsedMaterial.uniforms.normalUVTransform,
    'textures without KHR_texture_transform keep the identity matrix'
  ).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);

  destroyParsedTextures(parsedMaterial);
});

it('gltf#parsePBRMaterial skips texture slots that require unsupported TEXCOORD sets', () => {
  const warnings = captureWarnings(() => {
    const parsedMaterial = parsePBRMaterial(
      device,
      {
        pbrMetallicRoughness: {
          baseColorTexture: {
            ...makeCompressedTextureInfo('base-color'),
            texCoord: 2
          }
        }
      } as any,
      {TEXCOORD_0: {}, TEXCOORD_1: {}},
      {}
    );

    expect(
      Boolean(parsedMaterial.bindings.pbr_baseColorSampler),
      'unsupported TEXCOORD texture binding is skipped'
    ).toBe(false);
    expect(
      Boolean(parsedMaterial.uniforms.baseColorMapEnabled),
      'unsupported TEXCOORD texture is not enabled'
    ).toBe(false);
  });

  expect(
    Boolean(
      warnings.some(warning =>
        warning.includes('only TEXCOORD_0 and TEXCOORD_1 are currently available')
      )
    ),
    'unsupported TEXCOORD usage is warned'
  ).toBe(true);
});

it('gltf#parsePBRMaterial reads KHR_materials_unlit from material.extensions', () => {
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

  expect(parsedMaterial.uniforms.unlit, 'unlit extension enables unlit shading').toBe(true);

  destroyParsedTextures(parsedMaterial);
});

it('gltf#parsePBRMaterial skips unresolved extension textures', () => {
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

  expect(parsedMaterial.uniforms.transmissionFactor, 'factor is preserved').toBe(0.6);
  expect(
    Boolean(parsedMaterial.bindings.pbr_transmissionSampler),
    'binding is skipped when image is missing'
  ).toBe(false);
  expect(Boolean(parsedMaterial.uniforms.transmissionMapEnabled), 'map flag stays disabled').toBe(
    false
  );
  expect(Boolean(parsedMaterial.defines['HAS_TRANSMISSIONMAP']), 'map define stays disabled').toBe(
    false
  );

  destroyParsedTextures(parsedMaterial);
});

it('gltf#parsePBRMaterial resolves extension textures from parent gltf textures', () => {
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

  expect(
    Boolean(parsedMaterial.bindings.pbr_clearcoatSampler),
    'clearcoat binding resolved from gltf texture'
  ).toBe(true);
  expect(
    Boolean(parsedMaterial.bindings.pbr_clearcoatRoughnessSampler),
    'clearcoat roughness binding resolved from gltf texture'
  ).toBe(true);
  expect(parsedMaterial.uniforms.clearcoatMapEnabled, 'clearcoat map flag enabled').toBe(true);
  expect(
    parsedMaterial.uniforms.clearcoatRoughnessMapEnabled,
    'clearcoat roughness map flag enabled'
  ).toBe(true);
  expect(Boolean(parsedMaterial.defines['HAS_CLEARCOATMAP']), 'clearcoat map define enabled').toBe(
    true
  );
  expect(
    Boolean(parsedMaterial.defines['HAS_CLEARCOATROUGHNESSMAP']),
    'clearcoat roughness map define enabled'
  ).toBe(true);

  destroyParsedTextures(parsedMaterial);
});

it('gltf#parsePBRMaterial warns when textured materials are missing TEXCOORD_0', () => {
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

  expect(
    Boolean(
      warnings.some(
        warning => warning.includes('missing TEXCOORD_0') && warning.includes('baseColorTexture')
      )
    ),
    'missing TEXCOORD_0 warning emitted for textured material'
  ).toBe(true);
});

it('gltf#parsePBRMaterial warns when lit materials are missing NORMAL', () => {
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

  expect(
    Boolean(
      warnings.some(
        warning =>
          warning.includes('missing NORMAL') &&
          warning.includes('lit PBR shading with normalTexture')
      )
    ),
    'missing NORMAL warning emitted for lit normal-mapped material'
  ).toBe(true);
});

it('gltf#parsePBRMaterial can suppress attribute warnings for shared material parsing', () => {
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

  expect(warnings, 'shared material parsing can skip primitive attribute diagnostics').toEqual([]);
});
