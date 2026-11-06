// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {Geometry} from '@luma.gl/engine';
import {postProcessGLTF} from '@luma.gl/engine/gltf';
import {
  createPBRMaterial,
  createPBRModel,
  createPrefilteredEnvironment,
  getPBREnvironmentBindings,
  getPBREnvironmentUniforms
} from '@luma.gl/engine/lighting';
import {Matrix4} from '@math.gl/core';

async function getDevices() {
  const webglDevice = await getWebGLTestDevice();
  return [...(await getTestDevices(['webgpu'])), ...(webglDevice ? [webglDevice] : [])];
}

test('standalone normal transforms agree for ordinary and instanced reflected nonuniform models', async context => {
  const devices = await getDevices();
  if (!devices.length) return context.skip('No rendering device');
  for (const device of devices) {
    const geometry = new Geometry({
      attributes: {
        POSITION: {size: 3, value: new Float32Array([-0.8, -0.8, 0, 0.8, -0.8, 0, 0, 0.8, 0])},
        NORMAL: {size: 3, value: new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1])},
        TANGENT: {size: 4, value: new Float32Array([1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1])},
        TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])},
        TEXCOORD_1: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])},
        COLOR_0: {size: 4, value: new Float32Array(12).fill(1)},
        JOINTS_0: {size: 4, value: new Uint16Array(12)},
        WEIGHTS_0: {size: 4, value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])}
      }
    });
    const material = createPBRMaterial(device);
    const texture = device.createTexture({
      width: 32,
      height: 32,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [texture]});
    const buffer = device.createBuffer({byteLength: 256, usage: Buffer.COPY_DST | Buffer.MAP_READ});
    try {
      for (const variant of ['ordinary', 'instanced', 'skinned', 'tangents']) {
        const instanced = variant === 'instanced';
        const skinned = variant === 'skinned';
        const instanceMatrix = new Matrix4().scale([0.8, 0.7, 0.5]);
        const modelMatrix = new Matrix4().scale([-0.5, 0.6, 1]);
        const instanceBuffers = instanced
          ? [0, 1, 2, 3].map(column =>
              device.createBuffer({
                data: new Float32Array(instanceMatrix.slice(column * 4, column * 4 + 4)),
                usage: Buffer.VERTEX
              })
            )
          : [];
        const names = [0, 1, 2, 3].map(column => `instanceModelMatrixCol${column}`);
        const model = createPBRModel(device, {
          geometry,
          material,
          colorAttachmentFormats: ['rgba8unorm'],
          attributes: Object.fromEntries(
            names
              .slice(0, instanceBuffers.length)
              .map((name, index) => [name, instanceBuffers[index]])
          ),
          bufferLayout: instanced
            ? names.map(name => ({name, format: 'float32x4', stepMode: 'instance'}))
            : [],
          defines: {
            HAS_INSTANCING: instanced,
            HAS_SKIN: skinned,
            HAS_TANGENTS: variant === 'tangents',
            DEBUG_NORMALS: true
          },
          parameters: {depthWriteEnabled: false, cullMode: 'none'}
        });
        try {
          if (skinned)
            model.shaderInputs.setProps({
              skin: {jointMatrices: new Matrix4().translate([0.1, 0, 0])}
            });
          model.shaderInputs.setProps({
            pbrProjection: {
              modelMatrix,
              modelViewProjectionMatrix: modelMatrix,
              normalMatrix: new Matrix4(modelMatrix).invert().transpose(),
              camera: [0, 0, 2]
            }
          });
          const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
          pass.setParameters({viewport: [0, 0, 32, 32]});
          model.draw(pass);
          pass.end();
          device.submit();
          texture.readBuffer({x: 16, y: 16, width: 1, height: 1}, buffer);
          const pixels = await buffer.readAsync();
          const normal = instanced ? [-1 / 0.4, 1 / 0.42, 1 / 0.5] : [-2, 1 / 0.6, 1];
          const length = Math.hypot(...normal);
          normal.forEach((value, channel) =>
            expect(
              Math.abs(pixels[channel] - ((value / length) * 0.5 + 0.5) * 255),
              `${device.type} instanced=${instanced} channel=${channel}`
            ).toBeLessThan(2)
          );
        } finally {
          model.destroy();
          for (const instanceBuffer of instanceBuffers) instanceBuffer.destroy();
        }
      }
    } finally {
      material.destroy();
      buffer.destroy();
      framebuffer.destroy();
      texture.destroy();
    }
  }
});

test('loaded glTF geometry renders through the standalone factory with linear color and shared materials', async context => {
  const devices = await getDevices();
  if (!devices.length) return context.skip('No rendering device');
  const gltf = postProcessGLTF(
    await load('/test/data/box.glb', GLTFLoader, {gltf: {loadImages: false}})
  );
  const primitive = gltf.meshes[0].primitives[0];
  const geometry = new Geometry({
    attributes: Object.fromEntries(
      Object.entries(primitive.attributes).map(([name, accessor]) => [
        name,
        {size: accessor.components, value: Float32Array.from(accessor.value)}
      ])
    ),
    indices: primitive.indices ? Uint16Array.from(primitive.indices.value) : undefined
  });
  for (const device of devices) {
    const material = createPBRMaterial(device, {
      uniforms: {unlit: true, baseColorFactor: [0.25, 0.5, 0.75, 1]}
    });
    const texture = device.createTexture({
      width: 16,
      height: 16,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [texture]});
    const buffer = device.createBuffer({byteLength: 256, usage: Buffer.COPY_DST | Buffer.MAP_READ});
    const models = [0, 1].map(() =>
      createPBRModel(device, {
        geometry,
        material,
        colorAttachmentFormats: ['rgba8unorm'],
        parameters: {depthWriteEnabled: false, cullMode: 'none'}
      })
    );
    try {
      for (const model of models) {
        const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
        pass.setParameters({viewport: [0, 0, 16, 16]});
        model.draw(pass);
        pass.end();
        device.submit();
        texture.readBuffer({x: 8, y: 8, width: 1, height: 1}, buffer);
        const pixels = await buffer.readAsync();
        [64, 128, 191].forEach((value, channel) =>
          expect(Math.abs(pixels[channel] - value), device.type).toBeLessThan(2)
        );
      }
    } finally {
      for (const model of models) model.destroy();
      material.destroy();
      buffer.destroy();
      framebuffer.destroy();
      texture.destroy();
    }
  }
});

test('standalone PBR models consume generated linear environment lighting', async context => {
  const devices = await getDevices();
  if (!devices.length) return context.skip('No rendering device');
  for (const device of devices) {
    const source = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array(8).fill(255)
    });
    const environment = createPrefilteredEnvironment(device, {
      source,
      format: 'rgba8unorm',
      size: 2,
      irradianceSize: 2,
      brdfLUTSize: 4,
      sampleCount: 16
    });
    const material = createPBRMaterial(device, {
      uniforms: {
        IBLenabled: true,
        baseColorFactor: [0.5, 0.1, 0.1, 1],
        metallicRoughnessValues: [0, 0.5]
      }
    });
    const geometry = new Geometry({
      attributes: {
        POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0])},
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])}
      }
    });
    const texture = device.createTexture({
      width: 4,
      height: 4,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [texture]});
    const buffer = device.createBuffer({byteLength: 256, usage: Buffer.COPY_DST | Buffer.MAP_READ});
    const model = createPBRModel(device, {
      geometry,
      material,
      defines: {USE_IBL: true, USE_SCENE_ENVIRONMENT: true, USE_TEX_LOD: true},
      bindings: getPBREnvironmentBindings(environment.textures),
      colorAttachmentFormats: ['rgba8unorm'],
      parameters: {depthWriteEnabled: false, cullMode: 'none'}
    });
    try {
      model.shaderInputs.setProps({pbrScene: getPBREnvironmentUniforms(environment.textures)});
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
      pass.setParameters({viewport: [0, 0, 4, 4]});
      model.draw(pass);
      pass.end();
      device.submit();
      texture.readBuffer({width: 1, height: 1}, buffer);
      const pixels = await buffer.readAsync();
      expect(pixels[0], device.type).toBeGreaterThan(pixels[1] + 50);
      expect(pixels[1], device.type).toBeGreaterThan(5);
    } finally {
      model.destroy();
      material.destroy();
      buffer.destroy();
      framebuffer.destroy();
      texture.destroy();
      environment.destroy();
      source.destroy();
    }
  }
});
