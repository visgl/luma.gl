// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@luma.gl/engine/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {pbrMaterial, pbrScene, skin} from '@luma.gl/shaders';
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
      modelOptions: {
        modules: [pbrScene, pbrMaterial, skin],
        defines: {USE_SCENE_COLOR_MANAGEMENT: true}
      }
    });
    const nodes: ModelNode[] = [];
    scene.scenes[0].traverse(node => {
      if (node instanceof ModelNode) nodes.push(node);
    });
    const supportsFloat = device.isTextureFormatRenderable('rgba32float');
    const color = device.createTexture({
      width: 32,
      height: 32,
      format: supportsFloat ? 'rgba32float' : 'rgba8unorm',
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
          lighting: {
            lights: [{type: 'ambient', color: [0, 0, 0], intensity: 0}],
            useByteColors: false
          },
          pbrScene: {exposure: 1, toneMapMode: 0, outputEncoding: 0},
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
      const offset = 16 * layout.bytesPerRow + 16 * layout.bytesPerPixel;
      return supportsFloat
        ? new Float32Array(pixels.buffer, pixels.byteOffset + offset, 1)[0]
        : pixels[offset] / 255;
    };
    try {
      const zero = await render(0, false);
      const normal = await render(1, false);
      const high = await render(supportsFloat ? 20 : 4, false);
      const textured = await render(1, true);
      expect(zero).toBe(0);
      expect(normal).toBeCloseTo(0.1, 2);
      expect(high).toBeCloseTo(supportsFloat ? 2 : 0.4, 2);
      expect(textured / normal).toBeCloseTo(0.216, 1);
    } finally {
      readback.destroy();
      framebuffer.destroy();
      color.destroy();
      depth.destroy();
      scene.destroy();
    }
  }
});
