// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {pbrMaterial, skin} from '@luma.gl/shadertools';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, test} from 'vitest';
import {createScenegraphsFromGLTF} from '../../src/gltf/create-scenegraph-from-gltf';
function makeReceiver(
  strengthAlpha: number,
  doubleSided = false,
  authoredNormals = true
): GLTFPostprocessed {
  const material = {
    id: 'matte',
    extensions: {
      KHR_materials_transmission: {transmissionFactor: 1},
      KHR_materials_scatter: {
        scatterStrengthFactor: 1,
        scatterAnisotropy: 0,
        scatterStrengthTexture: {
          id: 'strength',
          texture: {
            source: {
              image: new ImageData(new Uint8ClampedArray([255, 255, 255, strengthAlpha]), 1, 1)
            },
            sampler: {parameters: {}}
          }
        }
      }
    },
    doubleSided,
    pbrMetallicRoughness: {metallicFactor: 0, roughnessFactor: 1}
  };
  const mesh = {
    id: 'receiver',
    primitives: [
      {
        material,
        attributes: {
          TEXCOORD_0: {components: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])},
          POSITION: {
            components: 3,
            value: new Float32Array(
              doubleSided ? [-1, -1, 0, 0, 1, 0, 1, -1, 0] : [-1, -1, 0, 1, -1, 0, 0, 1, 0]
            ),
            min: [-1, -1, 0],
            max: [1, 1, 0]
          },
          NORMAL: {
            components: 3,
            value: new Float32Array(
              doubleSided ? [0, 0, -1, 0, 0, -1, 0, 0, -1] : [0, 0, 1, 0, 0, 1, 0, 0, 1]
            )
          }
        }
      }
    ]
  };
  if (!authoredNormals) {
    const attributes: Record<string, unknown> = mesh.primitives[0].attributes;
    delete attributes.NORMAL;
  }
  const node = {id: 'receiver-node', mesh};
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

test.each([
  0, 128, 255
])('thin-wall scatter renders both hemispheres with strength alpha %s', async strengthAlpha => {
  const webgl = await getWebGLTestDevice();
  const webgpu = await getTestDevices(['webgpu-core']);
  for (const device of webgl ? [webgl, ...webgpu] : webgpu) {
    const bundle = createScenegraphsFromGLTF(device, makeReceiver(strengthAlpha), {
      modelOptions: {modules: [pbrMaterial, skin]}
    });
    const models: ModelNode[] = [];
    bundle.scenes[0].traverse(node => {
      if (node instanceof ModelNode) models.push(node);
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
    const render = async (direction: number[], anisotropy: number) => {
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0], clearDepth: 1});
      for (const node of models) {
        expect(node.model.material).not.toBeNull();
        node.model.material!.setProps({pbrMaterial: {scatterAnisotropy: anisotropy}});
        node.model.shaderInputs.setProps({
          lighting: {
            lights: [{type: 'directional', direction, color: [1, 1, 1], intensity: 1}],
            useByteColors: false
          },
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
      const forward = await render([0, 0, -1], 0.9);
      const backward = await render([0, 0, -1], -0.9);
      if (strengthAlpha === 0) expect(forward).toBe(backward);
      else expect(forward).toBeGreaterThan(backward + 10);
      const reflected = await render([0, 0, 1], -0.9);
      const transmitted = await render([0, 0, 1], 0.9);
      if (strengthAlpha === 0) expect(reflected).toBe(transmitted);
      else expect(reflected).toBeGreaterThan(transmitted + 10);
    } finally {
      readback.destroy();
      framebuffer.destroy();
      color.destroy();
      depth.destroy();
      bundle.destroy();
    }
  }
});
