// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@luma.gl/engine/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {
  type AreaLight,
  pbrScene,
  createAreaLightLTCTextures,
  pbrMaterial,
  skin
} from '@luma.gl/shadertools';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, test} from 'vitest';
import {createScenegraphsFromGLTF} from '../../../src/gltf/gltf/create-scenegraph-from-gltf';

function makeReceiver(
  doubleSided = false,
  clearcoat = false,
  authoredNormals = true
): GLTFPostprocessed {
  const material = {
    id: 'matte',
    extensions: clearcoat
      ? {KHR_materials_clearcoat: {clearcoatFactor: 0.8, clearcoatRoughnessFactor: 0.5}}
      : {},
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
  false,
  true
])('LTC area lights match numerical integration on both backends (clearcoat=%s)', async clearcoat => {
  const [webgl, webgpu] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu-core'])
  ]);
  const devices = webgl ? [webgl, ...webgpu] : webgpu;
  expect(devices.length).toBeGreaterThan(0);
  for (const device of devices) {
    const reference: number[] = [];
    for (const useLTC of [false, true]) {
      const ltc = useLTC ? createAreaLightLTCTextures(device) : undefined;
      for (const authoredNormals of [true, false]) {
        for (const doubleSided of [false, true]) {
          const bundle = createScenegraphsFromGLTF(
            device,
            makeReceiver(doubleSided, clearcoat, authoredNormals),
            {
              modelOptions: {
                modules: [pbrScene, pbrMaterial, skin],
                defines: {USE_SCENE_COLOR_MANAGEMENT: true, USE_AREA_LIGHT_LTC: useLTC}
              }
            }
          );
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
          const render = async (area: AreaLight, roughness = 1, metallic = 0): Promise<number> => {
            const pass = device.beginRenderPass({
              framebuffer,
              clearColor: [0, 0, 0, 0],
              clearDepth: 1
            });
            for (const node of models) {
              expect(node.model.material).not.toBeNull();
              node.model.material!.setProps({
                pbrMaterial: {metallicRoughnessValues: [metallic, roughness]}
              });
              node.model.shaderInputs.setProps({
                lighting: {
                  lights: useLTC ? [area] : [{type: 'ambient', color: [0, 0, 0], intensity: 0}],
                  useByteColors: false
                },
                ...(ltc ? {bindings: ltc.bindings} : {}),
                areaLighting: {lights: useLTC ? [] : [area], sampleCount: 256},
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
            const smaller = await render({
              ...light,
              halfAxisX: [0.25, 0, 0],
              halfAxisY: [0, 0.25, 0]
            });
            const backface = await render({...light, normal: [0, 0, 1]});
            if (!doubleSided) {
              for (const roughness of [0.3, 0.5, 0.8]) {
                const estimate = await render(light, roughness, 1);
                if (!useLTC) reference.push(estimate);
                else {
                  const expected = reference.shift()!;
                  expect(
                    Math.abs(estimate - expected),
                    `${device.type} GGX roughness ${roughness} agrees with numerical integration`
                  ).toBeLessThanOrEqual(Math.max(4, expected * 0.12));
                }
              }
            }

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
      ltc?.destroy();
    }
  }
});
