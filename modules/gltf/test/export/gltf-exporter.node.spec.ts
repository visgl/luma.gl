// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {exportGLTF, type GLTFExportScene} from '@luma.gl/gltf';
import {describe, expect, test} from 'vitest';

describe('source-faithful glTF asset export', () => {
  test('preserves hierarchy, complete geometry, normalized weights, skins, and morph targets', () => {
    const document = JSON.parse(exportGLTF(makeAnimatedScene()));
    const primitive = document.meshes[0].primitives[0];

    expect(document.asset.version).toBe('2.0');
    expect(document.scenes[0].nodes).toEqual([0]);
    expect(document.nodes[0].children).toEqual([1, 2, 3]);
    expect(document.nodes[1].skin).toBe(0);
    expect(document.nodes[1].weights).toEqual([0.25, 0.75]);
    expect(document.skins[0].joints).toEqual([2]);
    expect(document.accessors[document.skins[0].inverseBindMatrices].type).toBe('MAT4');
    expect(Object.keys(primitive.attributes)).toEqual([
      'POSITION',
      'NORMAL',
      'TANGENT',
      'TEXCOORD_0',
      'TEXCOORD_1',
      'COLOR_0',
      'JOINTS_0',
      'WEIGHTS_0',
      '_TEMPERATURE'
    ]);
    expect(document.accessors[primitive.attributes.COLOR_0].type).toBe('VEC4');
    expect(document.accessors[primitive.attributes.TANGENT].type).toBe('VEC4');
    expect(document.accessors[primitive.attributes.JOINTS_0].componentType).toBe(5121);
    expect(document.accessors[primitive.attributes.WEIGHTS_0].componentType).toBe(5121);
    expect(document.accessors[primitive.attributes.WEIGHTS_0].normalized).toBe(true);
    expect(document.accessors[primitive.attributes.POSITION].min).toEqual([0, 0, 0]);
    expect(document.accessors[primitive.attributes.POSITION].max).toEqual([1, 1, 0]);
    expect(primitive.targets).toHaveLength(2);
    expect(Object.keys(primitive.targets[0])).toEqual(['POSITION', 'NORMAL', 'TANGENT']);
    expect(document.accessors[primitive.targets[0].TANGENT].type).toBe('VEC3');
    expect(document.accessors[primitive.attributes._TEMPERATURE].sparse.count).toBe(1);
    expect(document.buffers[0].uri).toMatch(/^data:application\/octet-stream;base64,/);

    for (const bufferView of document.bufferViews) {
      expect(bufferView.byteOffset % 4).toBe(0);
    }
  });

  test('round-trips animated pointers, variants, instancing, samplers, cameras, and lights', () => {
    const document = JSON.parse(exportGLTF(makeAnimatedScene()));
    const animation = document.animations[0];
    const material = document.materials[0];

    expect(animation.channels[0].target).toEqual({node: 1, path: 'translation'});
    expect(animation.channels[1].target).toEqual({node: 1, path: 'weights'});
    expect(animation.channels[2].target).toEqual({
      path: 'pointer',
      extensions: {
        KHR_animation_pointer: {
          pointer: '/materials/0/pbrMetallicRoughness/roughnessFactor'
        }
      }
    });
    expect(document.accessors[animation.samplers[1].output].type).toBe('SCALAR');
    expect(document.accessors[animation.samplers[1].output].count).toBe(4);
    expect(material.extensions.KHR_materials_clearcoat.clearcoatFactor).toBe(0.8);
    expect(material.pbrMetallicRoughness.baseColorTexture.texCoord).toBe(1);
    expect(document.samplers[0].minFilter).toBe(9987);
    expect(document.cameras[0].perspective.yfov).toBe(0.8);
    expect(document.extensions.KHR_lights_punctual.lights[0].intensity).toBe(2);
    expect(document.extensions.KHR_materials_variants.variants[0].name).toBe('Copper');
    expect(document.nodes[3].extensions.EXT_mesh_gpu_instancing.attributes).toEqual({
      TRANSLATION: expect.any(Number),
      _BATCH_ID: expect.any(Number)
    });
    expect(document.extensionsUsed).toEqual(
      expect.arrayContaining([
        'KHR_animation_pointer',
        'KHR_materials_clearcoat',
        'KHR_lights_punctual',
        'KHR_materials_variants',
        'EXT_mesh_gpu_instancing'
      ])
    );
  });

  test('creates standards-aligned GLB files accepted by the existing loaders.gl parser', async () => {
    const binary = exportGLTF(makeAnimatedScene(), {binary: true});
    const header = new DataView(binary);

    expect(header.getUint32(0, true)).toBe(0x46546c67);
    expect(header.getUint32(4, true)).toBe(2);
    expect(header.getUint32(8, true)).toBe(binary.byteLength);
    expect(header.getUint32(12, true) % 4).toBe(0);
    expect(header.getUint32(16, true)).toBe(0x4e4f534a);

    const source = await parse(binary, GLTFLoader, {gltf: {loadImages: false}});
    const gltf = postProcessGLTF(source);
    expect(gltf.scenes).toHaveLength(1);
    expect(gltf.meshes[0].primitives[0].attributes['COLOR_0'].value).toHaveLength(12);
    expect(gltf.meshes[0].primitives[0].attributes['JOINTS_0'].value).toBeInstanceOf(Uint8Array);
    expect(gltf.meshes[0].primitives[0].targets).toHaveLength(2);
    expect(gltf.skins).toHaveLength(1);
    expect(gltf.animations).toHaveLength(1);
  });

  test('keeps all caller-owned source arrays and scene descriptors unchanged', () => {
    const scene = makeAnimatedScene();
    const sourcePosition = scene.meshes?.[0].primitives[0].attributes['POSITION'].data;
    const sourceValues = [...(sourcePosition || [])];

    exportGLTF(scene);
    exportGLTF(scene, {binary: true});

    expect([
      ...((scene.meshes?.[0].primitives[0].attributes['POSITION'].data || []) as number[])
    ]).toEqual(sourceValues);
    expect(scene.nodes?.[1].weights).toEqual([0.25, 0.75]);
    expect(scene.images?.[0].data).toEqual(new Uint8Array([137, 80, 78, 71]));
  });
});

function makeAnimatedScene(): GLTFExportScene {
  return {
    name: 'Animated interchange',
    nodes: [
      {name: 'Root', children: [1, 2, 3]},
      {name: 'Character', mesh: 0, skin: 0, weights: [0.25, 0.75]},
      {name: 'Joint', translation: [0, 1, 0]},
      {
        name: 'Instances',
        mesh: 0,
        instances: {
          TRANSLATION: {data: new Float32Array([0, 0, 0, 2, 0, 0]), size: 3},
          _BATCH_ID: {data: new Uint16Array([4, 8]), size: 1}
        }
      }
    ],
    meshes: [
      {
        name: 'Animated mesh',
        weights: [0.25, 0.75],
        primitives: [
          {
            attributes: {
              POSITION: {data: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3},
              NORMAL: {data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), size: 3},
              TANGENT: {data: new Float32Array([1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1]), size: 4},
              TEXCOORD_0: {data: new Float32Array([0, 0, 1, 0, 0, 1]), size: 2},
              TEXCOORD_1: {data: new Float32Array([0.2, 0.3, 0.8, 0.3, 0.2, 0.9]), size: 2},
              COLOR_0: {
                data: new Float32Array([1, 0, 0, 0.5, 0, 1, 0, 0.6, 0, 0, 1, 0.7]),
                size: 4
              },
              JOINTS_0: {data: new Uint8Array(12), size: 4},
              WEIGHTS_0: {
                data: new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0]),
                size: 4,
                normalized: true
              },
              _TEMPERATURE: {
                data: new Float32Array([1, 1, 1]),
                size: 1,
                sparse: {indices: new Uint8Array([1]), values: new Float32Array([42])}
              }
            },
            indices: {data: new Uint16Array([0, 1, 2]), size: 1},
            material: 0,
            targets: [
              {
                POSITION: {data: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]), size: 3},
                NORMAL: {data: new Float32Array(9), size: 3},
                TANGENT: {data: new Float32Array(9), size: 3}
              },
              {
                POSITION: {data: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0]), size: 3}
              }
            ],
            extensions: {
              KHR_materials_variants: {mappings: [{material: 0, variants: [0]}]}
            }
          }
        ]
      }
    ],
    materials: [
      {
        name: 'Copper',
        pbrMetallicRoughness: {
          baseColorFactor: [0.8, 0.5, 0.3, 0.7],
          baseColorTexture: {index: 0, texCoord: 1},
          roughnessFactor: 0.4
        },
        extensions: {KHR_materials_clearcoat: {clearcoatFactor: 0.8}}
      }
    ],
    textures: [{name: 'Base color', source: 0, sampler: 0}],
    images: [{name: 'Color image', data: new Uint8Array([137, 80, 78, 71]), mimeType: 'image/png'}],
    samplers: [{wrapS: 33071, wrapT: 33648, minFilter: 9987, magFilter: 9729}],
    cameras: [{type: 'perspective', perspective: {yfov: 0.8, znear: 0.1}}],
    skins: [
      {
        name: 'Skeleton',
        joints: [2],
        skeleton: 2,
        inverseBindMatrices: {
          data: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
          size: 16
        }
      }
    ],
    animations: [
      {
        name: 'Animated material and morph',
        samplers: [
          {
            input: {data: new Float32Array([0, 1]), size: 1},
            output: {data: new Float32Array([0, 0, 0, 1, 0, 0]), size: 3}
          },
          {
            input: {data: new Float32Array([0, 1]), size: 1},
            output: {data: new Float32Array([0, 1, 1, 0]), size: 1},
            interpolation: 'LINEAR'
          },
          {
            input: {data: new Float32Array([0, 1]), size: 1},
            output: {data: new Float32Array([0.1, 0.7]), size: 1},
            interpolation: 'STEP'
          }
        ],
        channels: [
          {sampler: 0, target: {node: 1, path: 'translation'}},
          {sampler: 1, target: {node: 1, path: 'weights'}},
          {
            sampler: 2,
            target: {
              path: 'pointer',
              pointer: '/materials/0/pbrMetallicRoughness/roughnessFactor'
            }
          }
        ]
      }
    ],
    extensions: {
      KHR_lights_punctual: {lights: [{type: 'point', intensity: 2}]},
      KHR_materials_variants: {variants: [{name: 'Copper'}]}
    }
  };
}
