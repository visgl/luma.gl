// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {
  exportGLTF,
  getGLTFExtensionSupport,
  getTextureTransformSlotDefinitions
} from '@luma.gl/gltf';
import {parseGLTFAnimations} from '@luma.gl/gltf/parsers/parse-gltf-animations';
import {parsePBRMaterial} from '@luma.gl/gltf/parsers/parse-pbr-material';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';

const device = new NullDevice({});

function makeTextureInfo(id: string, textureCoordinateSet = 0): any {
  return {
    id,
    texCoord: textureCoordinateSet,
    extensions: {
      KHR_texture_transform: {offset: [0.25, 0.5], scale: [2, 3]}
    },
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

function makeAccessor(values: number[], type: 'SCALAR' | 'VEC3'): any {
  return {
    componentType: 5126,
    count: values.length / (type === 'VEC3' ? 3 : 1),
    type,
    bufferView: {data: {buffer: new Float32Array(values).buffer}}
  };
}

function makeGLTF(overrides: Record<string, unknown>): GLTFPostprocessed {
  return {
    id: 'experimental-pbr',
    accessors: [],
    animations: [],
    asset: {version: '2.0'},
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [],
    meshes: [],
    nodes: [],
    samplers: [],
    scenes: [],
    skins: [],
    textures: [],
    ...overrides
  } as GLTFPostprocessed;
}

describe('next-generation glTF PBR materials', () => {
  test('parses experimental bump, release-candidate diffuse transmission, and draft volume scattering', () => {
    const parsedMaterial = parsePBRMaterial(
      device,
      {
        extensions: {
          EXT_materials_bump: {
            bumpFactor: 0.65,
            bumpTexture: makeTextureInfo('bump')
          },
          KHR_materials_diffuse_transmission: {
            diffuseTransmissionFactor: 0.8,
            diffuseTransmissionTexture: makeTextureInfo('diffuse-transmission', 1),
            diffuseTransmissionColorFactor: [0.9, 0.35, 0.15],
            diffuseTransmissionColorTexture: makeTextureInfo('diffuse-transmission-color')
          },
          KHR_materials_volume: {
            thicknessFactor: 0.6,
            attenuationDistance: 1.5,
            attenuationColor: [0.8, 0.7, 0.5]
          },
          KHR_materials_volume_scatter: {
            multiscatterColorFactor: [0.75, 0.45, 0.2],
            multiscatterColorTexture: makeTextureInfo('multiscatter-color'),
            scatterAnisotropy: 0.4
          }
        }
      },
      {NORMAL: {}, TEXCOORD_0: {}, TEXCOORD_1: {}},
      {}
    );

    try {
      expect(parsedMaterial.uniforms).toMatchObject({
        bumpFactor: 0.65,
        bumpMapEnabled: true,
        diffuseTransmissionFactor: 0.8,
        diffuseTransmissionMapEnabled: true,
        diffuseTransmissionColorFactor: [0.9, 0.35, 0.15],
        diffuseTransmissionColorMapEnabled: true,
        diffuseTransmissionUVSet: 1,
        multiscatterColorFactor: [0.75, 0.45, 0.2],
        multiscatterColorMapEnabled: true,
        scatterAnisotropy: 0.4
      });
      expect(parsedMaterial.defines).toMatchObject({
        USE_MATERIAL_EXTENSIONS: true,
        HAS_BUMPMAP: true,
        HAS_DIFFUSETRANSMISSIONMAP: true,
        HAS_DIFFUSETRANSMISSIONCOLORMAP: true,
        HAS_MULTISCATTERCOLORMAP: true
      });
      expect(Object.keys(parsedMaterial.bindings)).toEqual(
        expect.arrayContaining([
          'pbr_bumpSampler',
          'pbr_diffuseTransmissionSampler',
          'pbr_diffuseTransmissionColorSampler',
          'pbr_multiscatterColorSampler'
        ])
      );
      expect(parsedMaterial.uniforms.diffuseTransmissionUVTransform).toEqual([
        2, 0, 0, 0, 3, 0, 0.25, 0.5, 1
      ]);
    } finally {
      parsedMaterial.generatedTextures.forEach(texture => texture.destroy());
    }
  });

  test('clamps authored factors, accepts the legacy scatter spelling, and requires a real volume', () => {
    const clampedMaterial = parsePBRMaterial(
      device,
      {
        extensions: {
          EXT_materials_bump: {bumpFactor: -2},
          KHR_materials_diffuse_transmission: {diffuseTransmissionFactor: 4},
          KHR_materials_volume: {thicknessFactor: 1},
          KHR_materials_volume_scatter: {
            multiscatterColor: [0.2, 0.4, 0.6],
            scatterAnisotropy: 2
          }
        }
      },
      {},
      {}
    );
    expect(clampedMaterial.uniforms).toMatchObject({
      bumpFactor: 0,
      diffuseTransmissionFactor: 1,
      diffuseTransmissionColorFactor: [1, 1, 1],
      multiscatterColorFactor: [0.2, 0.4, 0.6],
      scatterAnisotropy: 0.999
    });

    const noVolumeMaterial = parsePBRMaterial(
      device,
      {extensions: {KHR_materials_volume_scatter: {multiscatterColorFactor: [1, 0, 0]}}},
      {},
      {}
    );
    expect(noVolumeMaterial.uniforms.multiscatterColorFactor).toBeUndefined();
  });

  test('keeps authored factor textures linear and color textures sRGB', () => {
    const definitions = new Map(
      getTextureTransformSlotDefinitions().map(definition => [definition.slot, definition])
    );
    expect(definitions.get('bump')?.colorSpace).toBe('linear');
    expect(definitions.get('diffuseTransmission')?.colorSpace).toBe('linear');
    expect(definitions.get('diffuseTransmissionColor')?.colorSpace).toBe('srgb');
    expect(definitions.get('multiscatterColor')?.colorSpace).toBe('srgb');
  });

  test('exposes truthful draft maturity and explicitly approximate scatter support', () => {
    const support = getGLTFExtensionSupport(
      makeGLTF({
        extensionsUsed: [
          'EXT_materials_bump',
          'KHR_materials_diffuse_transmission',
          'KHR_materials_volume_scatter'
        ]
      })
    );

    expect(support.get('EXT_materials_bump')).toMatchObject({supported: true});
    expect(support.get('KHR_materials_diffuse_transmission')?.comment).toContain(
      'release candidate'
    );
    expect(support.get('KHR_materials_volume_scatter')?.comment).toContain('approximated');
  });

  test('round-trips experimental material records and automatically declares their extensions', () => {
    const material = {
      extensions: {
        EXT_materials_bump: {bumpFactor: 0.4, bumpTexture: {index: 0}},
        KHR_materials_diffuse_transmission: {
          diffuseTransmissionFactor: 0.75,
          diffuseTransmissionColorFactor: [1, 0.4, 0.2],
          diffuseTransmissionTexture: {index: 1}
        },
        KHR_materials_volume: {thicknessFactor: 0.5},
        KHR_materials_volume_scatter: {
          multiscatterColorFactor: [0.8, 0.3, 0.1],
          scatterAnisotropy: 0.2
        }
      }
    };
    const document = JSON.parse(exportGLTF({materials: [material]}));

    expect(document.materials[0]).toEqual(material);
    expect(document.extensionsUsed).toEqual(
      expect.arrayContaining([
        'EXT_materials_bump',
        'KHR_materials_diffuse_transmission',
        'KHR_materials_volume',
        'KHR_materials_volume_scatter'
      ])
    );
  });

  test.each([
    ['EXT_materials_bump', 'bumpFactor', 'bumpFactor'],
    [
      'KHR_materials_diffuse_transmission',
      'diffuseTransmissionFactor',
      'diffuseTransmissionFactor'
    ],
    [
      'KHR_materials_diffuse_transmission',
      'diffuseTransmissionColorFactor',
      'diffuseTransmissionColorFactor'
    ],
    ['KHR_materials_volume_scatter', 'multiscatterColorFactor', 'multiscatterColorFactor'],
    ['KHR_materials_volume_scatter', 'multiscatterColor', 'multiscatterColorFactor'],
    ['KHR_materials_volume_scatter', 'scatterAnisotropy', 'scatterAnisotropy']
  ])('resolves animated %s.%s', (extensionName, sourceProperty, canonicalProperty) => {
    const color = sourceProperty.toLowerCase().includes('color');
    const accessors = [
      makeAccessor([0, 1], 'SCALAR'),
      makeAccessor(color ? [0, 0, 0, 1, 1, 1] : [0, 1], color ? 'VEC3' : 'SCALAR')
    ];
    const pointer = `/materials/0/extensions/${extensionName}/${sourceProperty}`;
    const animations = parseGLTFAnimations(
      makeGLTF({
        accessors,
        materials: [{id: 'animated-material', extensions: {[extensionName]: {}}}],
        animations: [
          {
            channels: [
              {
                sampler: 0,
                target: {
                  path: 'pointer',
                  extensions: {KHR_animation_pointer: {pointer}}
                }
              }
            ],
            samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
          }
        ]
      })
    );

    expect(animations[0]?.channels[0]).toMatchObject({
      type: 'material',
      property: canonicalProperty,
      pointer
    });
  });
});
