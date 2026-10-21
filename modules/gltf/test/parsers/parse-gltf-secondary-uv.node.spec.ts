// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {parseGLTF} from '@luma.gl/gltf/parsers/parse-gltf';
const device = new NullDevice({});
function makeCompressedImage() {
  return {
    compressed: true as const,
    mipmaps: true,
    data: [
      {
        data: new Uint8Array(16),
        width: 4,
        height: 4,
        textureFormat: 'bc7-rgba-unorm' as const
      }
    ]
  };
}

it('gltf#parseGLTF retains secondary-UV scatter strength textures in shared materials', () => {
  const material = {
    id: 'material-0',
    extensions: {
      KHR_materials_transmission: {transmissionFactor: 1},
      KHR_materials_scatter: {
        scatterStrengthFactor: 1,
        scatterStrengthTexture: {
          id: 'scatter-strength-texture-info',
          index: 0,
          texCoord: 1
        }
      }
    }
  } as GLTFPostprocessed['materials'][number];

  const primitive = {
    attributes: {
      POSITION: {
        components: 3,
        value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        min: [0, 0, 0],
        max: [1, 1, 0]
      },
      TEXCOORD_1: {
        components: 2,
        value: new Float32Array([0, 0, 1, 0, 0, 1])
      }
    },
    indices: {
      count: 3,
      value: new Uint16Array([0, 1, 2])
    },
    material
  };

  const mesh = {
    id: 'mesh-0',
    primitives: [primitive]
  } as GLTFPostprocessed['meshes'][number];

  const node = {
    id: 'node-0',
    mesh
  } as GLTFPostprocessed['nodes'][number];

  const scene = {
    id: 'scene-0',
    nodes: [node]
  } as GLTFPostprocessed['scenes'][number];

  const gltf = {
    id: 'test-gltf',
    accessors: [],
    animations: [],
    asset: {version: '2.0'},
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [material],
    meshes: [mesh],
    nodes: [node],
    samplers: [],
    scenes: [scene],
    skins: [],
    textures: [
      {
        id: 'clearcoat-texture',
        source: {image: makeCompressedImage()},
        sampler: {}
      }
    ]
  } as unknown as GLTFPostprocessed;

  const {materials} = parseGLTF(device, gltf, {});
  const bindings = materials[0].getBindings();

  expect(
    Boolean(bindings.pbr_diffuseTransmissionSampler),
    'shared material owns secondary-UV scatter strength binding'
  ).toBe(true);

  materials.forEach(parsedMaterial => parsedMaterial.destroy());
  void 0;
});
