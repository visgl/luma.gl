// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {type AreaLight, pbrScene, pbrMaterial, skin} from '@luma.gl/shadertools';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, test} from 'vitest';
import {createScenegraphsFromGLTF} from '../../src/gltf/create-scenegraph-from-gltf';

function makeReceiver(doubleSided = false): GLTFPostprocessed {
  const material = {
    id: 'matte',
    doubleSided,
    pbrMetallicRoughness: {metallicFactor: 0, roughnessFactor: 1}
  };
  const mesh = {
    id: 'receiver',
    primitives: [
      {
        material,
        attributes: {
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

test('area lights render one-sided rectangles and disks with physical size and intensity on both backends', async () => {
  const [webgl, webgpu] = await Promise.all([getWebGLTestDevice(), getTestDevices(['webgpu'])]);
  const devices = webgl ? [webgl, ...webgpu] : webgpu;
  expect(devices.length).toBeGreaterThan(0);
  for (const device of devices) {
    for (const doubleSided of [false, true]) {
      const bundle = createScenegraphsFromGLTF(device, makeReceiver(doubleSided), {
        modelOptions: {
          modules: [pbrScene, pbrMaterial, skin],
          defines: {USE_SCENE_COLOR_MANAGEMENT: true}
        }
      });
      const models: ModelNode[] = [];
      bundle.scenes[0].traverse(node => {
        if (node instanceof ModelNode) models.push(node);
      });
      const color = device.createTexture({
        width: 64,
        height: 64,
        format: 'rgba8unorm',
        usage: Texture.RENDER | Texture.COPY_SRC
      });
      const depth = device.createTexture({
        width: 64,
        height: 64,
        format: 'depth24plus',
        usage: Texture.RENDER
      });
      const framebuffer = device.createFramebuffer({
        width: 64,
        height: 64,
        colorAttachments: [color],
        depthStencilAttachment: depth
      });
      const layout = color.computeMemoryLayout({width: 64, height: 64});
      const readback = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      const light: AreaLight = {
        type: 'rect',
        position: [0, 0, 1],
        normal: [0, 0, -1],
        halfAxisX: [0.5, 0, 0],
        halfAxisY: [0, 0.5, 0],
        intensity: 1
      };
      const render = async (area: AreaLight): Promise<number> => {
        const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0], clearDepth: 1});
        for (const node of models) {
          node.model.shaderInputs.setProps({
            lighting: {lights: [{type: 'ambient', color: [0, 0, 0], intensity: 0}]},
            areaLighting: {lights: [area]},
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
        color.readBuffer({width: 64, height: 64}, readback);
        const pixels = await readback.readAsync(0, layout.byteLength);
        return pixels[(32 * 64 + 32) * 4];
      };
      try {
        const rectangle = await render(light);
        const disk = await render({...light, type: 'disk'});
        const brighter = await render({...light, intensity: 2});
        const smaller = await render({...light, halfAxisX: [0.25, 0, 0], halfAxisY: [0, 0.25, 0]});
        const backface = await render({...light, normal: [0, 0, 1]});
        expect(rectangle, `${device.type} rectangle illuminates receiver`).toBeGreaterThan(20);
        expect(disk, `${device.type} disk illuminates receiver`).toBeGreaterThan(20);
        expect(brighter, `${device.type} luminance scales emitted light`).toBeGreaterThan(
          rectangle + 10
        );
        expect(
          smaller,
          `${device.type} smaller area emits less flux at fixed luminance`
        ).toBeLessThan(rectangle - 10);
        expect(backface, `${device.type} area surface emits on one side`).toBe(0);
      } finally {
        readback.destroy();
        framebuffer.destroy();
        color.destroy();
        depth.destroy();
        bundle.destroy();
      }
    }
  }
});
