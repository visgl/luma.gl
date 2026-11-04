// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@luma.gl/engine/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {pbrMaterial, skin} from '@luma.gl/shaders';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, test} from 'vitest';
import {createScenegraphsFromGLTF} from '../../../src/gltf/gltf/create-scenegraph-from-gltf';

/** Makes a black, unlit-by-lights surface with a half-intensity emissive texture. */
function makeScene(): GLTFPostprocessed {
  const material = {
    id: 'emissive',
    emissiveFactor: [0.1, 0.1, 0.1],
    emissiveTexture: {
      id: 'emissive-texture',
      texture: {
        source: {image: new ImageData(new Uint8ClampedArray([128, 128, 128, 255]), 1, 1)},
        sampler: {parameters: {}}
      }
    },
    extensions: {KHR_materials_emissive_strength: {emissiveStrength: 1}},
    pbrMetallicRoughness: {baseColorFactor: [0, 0, 0, 1], metallicFactor: 0, roughnessFactor: 1}
  };
  const mesh = {
    id: 'mesh',
    primitives: [
      {
        material,
        attributes: {
          POSITION: {
            components: 3,
            value: new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]),
            min: [-1, -1, 0],
            max: [1, 1, 0]
          },
          NORMAL: {components: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
          TEXCOORD_0: {components: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])}
        }
      }
    ]
  };
  const node = {id: 'node', mesh};
  return {
    asset: {version: '2.0'},
    accessors: [],
    animations: [],
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [material],
    meshes: [mesh],
    nodes: [node],
    samplers: [],
    scenes: [{id: 'scene', nodes: [node]}],
    skins: [],
    textures: []
  } as unknown as GLTFPostprocessed;
}

test('emissive strength and sRGB texture affect shared PBR rendering on both backends', async () => {
  const webgl = await getWebGLTestDevice();
  const webgpu = await getTestDevices(['webgpu-core']);
  const devices = webgl ? [webgl, ...webgpu] : webgpu;
  expect(devices.length).toBeGreaterThan(0);
  for (const device of devices) {
    const scene = createScenegraphsFromGLTF(device, makeScene(), {
      modelOptions: {modules: [pbrMaterial, skin]}
    });
    const nodes: ModelNode[] = [];
    scene.scenes[0].traverse(node => {
      if (node instanceof ModelNode) nodes.push(node);
    });
    const color = device.createTexture({
      width: 32,
      height: 32,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depth = device.createTexture({
      width: 32,
      height: 32,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 32,
      height: 32,
      colorAttachments: [color],
      depthStencilAttachment: depth
    });
    const layout = color.computeMemoryLayout({width: 32, height: 32});
    const readback = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const render = async (strength: number, useTexture: boolean) => {
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0], clearDepth: 1});
      for (const node of nodes) {
        node.model.material!.setProps({
          pbrMaterial: {emissiveStrength: strength, emissiveMapEnabled: useTexture}
        });
        node.model.shaderInputs.setProps({
          lighting: {lights: [], useByteColors: false},
          pbrProjection: {
            modelMatrix: new Matrix4(),
            modelViewProjectionMatrix: new Matrix4(),
            normalMatrix: new Matrix4(),
            camera: [0, 0, 3]
          }
        });
        node.model.draw(pass);
      }
      pass.end();
      device.submit();
      color.readBuffer({width: 32, height: 32}, readback);
      const pixels = await readback.readAsync(0, layout.byteLength);
      return pixels[(16 * 32 + 16) * 4];
    };
    try {
      const zero = await render(0, false);
      const normal = await render(1, false);
      const high = await render(4, false);
      const textured = await render(1, true);
      expect(zero).toBeLessThan(normal);
      expect(normal).toBeLessThan(high);
      expect(textured).toBeGreaterThan(zero);
      expect(textured).toBeLessThan(normal);
    } finally {
      readback.destroy();
      framebuffer.destroy();
      color.destroy();
      depth.destroy();
      scene.destroy();
    }
  }
});
