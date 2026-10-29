// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import './post-process-gltf-half-float.spec';
import './post-process-gltf-images.spec';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, type GLTFWithBuffers as LoaderGLTFWithBuffers} from '@loaders.gl/scene/gltf';
import {
  createScenegraphsFromGLTF,
  postProcessGLTF,
  type GLTF,
  type GLTFPostprocessed,
  type GLTFWithBuffers
} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils/device';
import {describe, expect, expectTypeOf, test} from 'vitest';

function makeTriangle(): GLTFWithBuffers {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  return {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: positions.byteLength}],
      bufferViews: [{buffer: 0, byteLength: positions.byteLength}],
      accessors: [
        {bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0]}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 0}}]}],
      nodes: [{mesh: 0}],
      scenes: [{nodes: [0]}],
      scene: 0
    },
    buffers: [{arrayBuffer: positions.buffer, byteOffset: 0, byteLength: positions.byteLength}]
  };
}

describe('luma-owned glTF postprocessing', () => {
  test('keeps loaders.gl input and output structurally compatible', () => {
    expectTypeOf<LoaderGLTFWithBuffers>().toExtend<GLTFWithBuffers>();
    expectTypeOf<GLTFPostprocessed['id']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<GLTFPostprocessed['animations'][number]['id']>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<
      Parameters<typeof createScenegraphsFromGLTF>[1]
    >().toEqualTypeOf<GLTFPostprocessed>();
  });

  test('renders plain glTF with caller-supplied buffers and leaves source data unchanged', () => {
    const source = makeTriangle();
    const snapshot = structuredClone(source);
    const gltf = postProcessGLTF(source);
    expect(gltf.scene).toBe(gltf.scenes[0]);
    expect(gltf.scenes[0].nodes?.[0]).toBe(gltf.nodes[0]);
    expect(gltf.nodes[0].mesh).toBe(gltf.meshes[0]);
    expect(gltf.meshes[0].primitives[0].attributes['POSITION']).toBe(gltf.accessors[0]);
    expect(gltf.accessors[0].value).toEqual(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]));
    const scenegraphs = createScenegraphsFromGLTF(new NullDevice({}), gltf);
    expect(scenegraphs.scenes).toHaveLength(1);
    scenegraphs.destroy();
    expect(source).toEqual(snapshot);
  });

  test('materializes interleaved, offset, normalized and sparse accessors without changing bytes', () => {
    const bytes = new Uint8Array(40);
    const view = new DataView(bytes.buffer);
    view.setFloat32(8, 1, true);
    view.setFloat32(12, 2, true);
    view.setFloat32(20, 3, true);
    view.setFloat32(24, 4, true);
    bytes[32] = 1;
    bytes.set([255, 128], 34);
    const json: GLTF = {
      asset: {version: '2.0'},
      bufferViews: [
        {buffer: 0, byteOffset: 4, byteLength: 20, byteStride: 12},
        {buffer: 0, byteOffset: 28, byteLength: 1},
        {buffer: 0, byteOffset: 30, byteLength: 2}
      ],
      accessors: [
        {bufferView: 0, componentType: 5126, count: 2, type: 'VEC2'},
        {
          componentType: 5121,
          count: 2,
          type: 'VEC2',
          normalized: true,
          sparse: {count: 1, indices: {bufferView: 1, componentType: 5121}, values: {bufferView: 2}}
        }
      ]
    };
    const originalBytes = bytes.slice();
    const gltf = postProcessGLTF({
      json,
      buffers: [{arrayBuffer: bytes.buffer, byteOffset: 4, byteLength: 36}]
    });
    expect(gltf.accessors[0].value).toEqual(new Float32Array([1, 2, 3, 4]));
    expect(gltf.accessors[1].value).toEqual(new Uint8Array([0, 0, 255, 128]));
    expect(gltf.accessors[1].normalized).toBe(true);
    expect(bytes).toEqual(originalBytes);
  });

  test('removes matrix column padding from base and sparse values', () => {
    const bytes = new Uint8Array([1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0, 0]);
    const gltf = postProcessGLTF({
      json: {
        asset: {version: '2.0'},
        bufferViews: [
          {buffer: 0, byteLength: 12},
          {buffer: 0, byteOffset: 12, byteLength: 1}
        ],
        accessors: [
          {bufferView: 0, componentType: 5121, count: 1, type: 'MAT3'},
          {
            componentType: 5121,
            count: 1,
            type: 'MAT3',
            sparse: {
              count: 1,
              indices: {bufferView: 1, componentType: 5121},
              values: {bufferView: 0}
            }
          }
        ]
      },
      buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}]
    });
    expect(gltf.accessors[0].value).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    expect(gltf.accessors[1].value).toEqual(gltf.accessors[0].value);
  });

  test.each([
    2, 6
  ])('normalizes portable topology for mode %s without changing source indices', mode => {
    const source = makeTriangle();
    source.json.meshes![0].primitives[0].mode = mode;
    const gltf = postProcessGLTF(source);
    const primitive = gltf.meshes[0].primitives[0];
    expect(primitive.mode).toBe(mode === 2 ? 1 : 4);
    expect(primitive.indices?.value).toEqual(
      new Uint16Array(mode === 2 ? [0, 1, 1, 2, 2, 0] : [0, 1, 2])
    );
    expect(source.json.meshes![0].primitives[0].mode).toBe(mode);
    expect(source.json.meshes![0].primitives[0].indices).toBeUndefined();
  });

  test.each([
    {byteOffset: 4, byteLength: 4},
    {byteOffset: -1, byteLength: 4}
  ])('rejects buffer views outside a supplied range without needing accessors: %j', view => {
    expect(() =>
      postProcessGLTF({
        json: {asset: {version: '2.0'}, bufferViews: [{buffer: 0, ...view}]},
        buffers: [{arrayBuffer: new ArrayBuffer(32), byteOffset: 8, byteLength: 4}]
      })
    ).toThrow();
  });

  test('rejects negative sparse offsets before reading borrowed bytes', () => {
    expect(() =>
      postProcessGLTF({
        json: {
          asset: {version: '2.0'},
          bufferViews: [{buffer: 0, byteLength: 4}],
          accessors: [
            {
              componentType: 5121,
              count: 1,
              type: 'SCALAR',
              sparse: {
                count: 1,
                indices: {bufferView: 0, byteOffset: -1, componentType: 5121},
                values: {bufferView: 0}
              }
            }
          ]
        },
        buffers: [{arrayBuffer: new ArrayBuffer(32), byteOffset: 8, byteLength: 4}]
      })
    ).toThrow();
  });

  test('keeps absent source IDs optional while generating IDs for resolved scene objects', () => {
    const source = makeTriangle();
    source.json.animations = [
      {
        channels: [{sampler: 0, target: {node: 0, path: 'translation'}}],
        samplers: [{input: 0, output: 0}]
      }
    ];
    const gltf = postProcessGLTF(source);
    expect(gltf.id).toBeUndefined();
    expect(gltf.animations[0].id).toBeUndefined();
    expect(gltf.animations[0].channels[0].id).toBeUndefined();
    expect(gltf.animations[0].channels[0].target.id).toBeUndefined();
    expect(gltf.animations[0].samplers[0].id).toBeUndefined();
    expect(gltf.nodes[0].id).toBe('node-0');
    expect(gltf.meshes[0].id).toBe('mesh-0');
  });

  test('keeps emissive textures dark unless an emissive factor is authored', () => {
    const source = makeTriangle();
    source.json.images = [{uri: 'emissive.png'}];
    source.json.textures = [{source: 0}];
    source.json.materials = [
      {emissiveTexture: {index: 0}},
      {emissiveTexture: {index: 0}, emissiveFactor: [0.2, 0.3, 0.4]}
    ];
    const gltf = postProcessGLTF(source);
    expect(gltf.materials[0].emissiveFactor).toEqual([0, 0, 0]);
    expect(gltf.materials[1].emissiveFactor).toEqual([0.2, 0.3, 0.4]);
    expect(source.json.materials[0].emissiveFactor).toBeUndefined();
  });

  test('normalizes explicitly undefined optional collections', () => {
    const gltf = postProcessGLTF({
      json: {asset: {version: '2.0'}, meshes: undefined, nodes: undefined, scenes: undefined},
      buffers: []
    });
    expect(gltf.meshes).toEqual([]);
    expect(gltf.nodes).toEqual([]);
    expect(gltf.scenes).toEqual([]);
  });

  test('preserves decoder-supplied values on accessors referenced by primitive indices', () => {
    const source = makeTriangle();
    const values = new Float32Array([0, 0, 0, 2, 0, 0, 0, 2, 0]);
    const accessor = {...source.json.accessors![0], value: values, max: [2, 2, 0]};
    delete accessor.bufferView;
    source.json.accessors = [accessor];
    const gltf = postProcessGLTF(source);
    expect(gltf.accessors[0].value).toBe(values);
    expect(gltf.meshes[0].primitives[0].attributes['POSITION']).toBe(gltf.accessors[0]);
    const scenegraphs = createScenegraphsFromGLTF(new NullDevice({}), gltf);
    expect(scenegraphs.modelBounds.bounds).toEqual([
      [0, 0, 0],
      [2, 2, 0]
    ]);
    scenegraphs.destroy();
  });

  test('copies decoder-provided values before applying sparse replacements', () => {
    const bytes = new Uint8Array(16);
    new Float32Array(bytes.buffer, 4, 3).set([4, 5, 6]);
    const values = new Float32Array([1, 2, 3]);
    const gltf = postProcessGLTF({
      json: {
        asset: {version: '2.0'},
        bufferViews: [
          {buffer: 0, byteLength: 1},
          {buffer: 0, byteOffset: 4, byteLength: 12}
        ],
        accessors: [
          {
            componentType: 5126,
            type: 'VEC3',
            count: 1,
            value: values,
            sparse: {
              count: 1,
              indices: {bufferView: 0, componentType: 5121},
              values: {bufferView: 1}
            }
          }
        ]
      },
      buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}]
    });
    expect(gltf.accessors[0].value).toEqual(new Float32Array([4, 5, 6]));
    expect(values).toEqual(new Float32Array([1, 2, 3]));
  });

  test('copies Node Buffer payloads before sparse replacements', () => {
    const values = Buffer.from([1, 2]);
    const bytes = new Uint8Array([1, 9]);
    const gltf = postProcessGLTF({
      json: {
        asset: {version: '2.0'},
        bufferViews: [
          {buffer: 0, byteLength: 1},
          {buffer: 0, byteOffset: 1, byteLength: 1}
        ],
        accessors: [
          {
            componentType: 5121,
            type: 'SCALAR',
            count: 2,
            value: values,
            sparse: {
              count: 1,
              indices: {bufferView: 0, componentType: 5121},
              values: {bufferView: 1}
            }
          }
        ]
      },
      buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}]
    });
    expect([...gltf.accessors[0].value]).toEqual([1, 9]);
    expect([...values]).toEqual([1, 2]);
  });

  test('links materials, images, cameras and skins without copying borrowed images', () => {
    const image = {width: 1, height: 1, data: new Uint8Array(4)};
    const source = makeTriangle();
    Object.assign(source.json, {
      images: [{uri: 'texture.png'}],
      textures: [{source: 0}],
      materials: [{pbrMetallicRoughness: {baseColorTexture: {index: 0}}}],
      cameras: [{type: 'perspective', perspective: {yfov: 1, znear: 0.1}}],
      skins: [{joints: [0], inverseBindMatrices: 0}],
      nodes: [{mesh: 0, skin: 0, camera: 0}]
    });
    source.images = [image];
    const gltf = postProcessGLTF(source);
    expect(gltf.images[0].image).toBe(image);
    expect(gltf.textures[0].source).toBe(gltf.images[0]);
    expect(gltf.materials[0].pbrMetallicRoughness?.baseColorTexture?.texture).toBe(
      gltf.textures[0]
    );
    expect(gltf.nodes[0].camera).toBe(gltf.cameras[0]);
    expect(gltf.nodes[0].skin).toBe(gltf.skins[0]);
    expect(gltf.skins[0].inverseBindMatrices).toBe(gltf.accessors[0]);
    expect(source.json.nodes?.[0].skin).toBe(0);
  });

  test.each([
    {
      filename: 'AnimatedMorphCube.glb',
      digest: '4aba93918adba56c1cc688a38c527bc647e26f2c386802e119b4d01b7250dd23'
    },
    {
      filename: 'SimpleSkin.gltf',
      digest: '28fb3a2d0d38b157a378839bae082e842d2025783e43b3431ac84ecc4a87ea30'
    }
  ])('loads and animates decoded geometry for $filename', async ({filename, digest}) => {
    const bytes = await readFile(
      new URL(`../../../../examples/anari/scenes/public/gltf/${filename}`, import.meta.url)
    );
    const source = await parse(bytes, GLTFLoader, {gltf: {loadImages: false}});
    const gltf = postProcessGLTF(source);
    // Fixed fingerprints cover every decoded geometry and animation value, independently of loaders.gl.
    // Derived from the fixtures' authored accessor byte ranges, excluding stride padding.
    const decodedValues = createHash('sha256');
    for (const {value} of gltf.accessors) {
      decodedValues.update(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
    }
    expect(decodedValues.digest('hex')).toBe(digest);
    expect(gltf.animations.length).toBeGreaterThan(0);
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, gltf);
    scenegraphs.animator.setTime(500);
    expect(scenegraphs.scenes.length).toBeGreaterThan(0);
    scenegraphs.destroy();
    device.destroy();
  });
});
