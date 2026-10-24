// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import './post-process-gltf-half-float.spec';
import {parse} from '@loaders.gl/core';
import {
  GLTFLoader,
  postProcessGLTF as postProcessLoaderGLTF,
  type GLTFPostprocessed as LoaderGLTFPostprocessed,
  type GLTFWithBuffers as LoaderGLTFWithBuffers
} from '@loaders.gl/gltf';
import {
  createScenegraphsFromGLTF,
  postProcessGLTF,
  type GLTF,
  type GLTFPostprocessed,
  type GLTFWithBuffers
} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
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
    expectTypeOf<LoaderGLTFPostprocessed>().toExtend<GLTFPostprocessed>();
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
    'AnimatedMorphCube.glb',
    'SimpleSkin.gltf'
  ])('matches loaders.gl geometry and animations for %s', async filename => {
    const bytes = await readFile(
      new URL(`../../../../examples/anari/scenes/public/gltf/${filename}`, import.meta.url)
    );
    const source = await parse(bytes, GLTFLoader, {gltf: {loadImages: false}});
    const gltf = postProcessGLTF(source);
    const loaderGLTF = postProcessLoaderGLTF(source);
    expect(gltf.accessors).toEqual(loaderGLTF.accessors);
    expect(gltf.meshes).toEqual(loaderGLTF.meshes);
    expect(gltf.animations).toEqual(loaderGLTF.animations);
    const device = new NullDevice({});
    for (const document of [gltf, loaderGLTF]) {
      const scenegraphs = createScenegraphsFromGLTF(device, document);
      scenegraphs.animator.setTime(500);
      expect(scenegraphs.scenes.length).toBeGreaterThan(0);
      scenegraphs.destroy();
    }
    device.destroy();
  });
});
