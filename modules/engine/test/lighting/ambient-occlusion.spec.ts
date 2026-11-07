// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {Geometry} from '@luma.gl/engine';
import {
  AmbientOcclusionPass,
  PBRSurfacePass,
  createPBRSurfaceModel,
  createPBRModel,
  createPBRMaterial,
  createPrefilteredEnvironment,
  getPBREnvironmentBindings,
  getPBREnvironmentUniforms
} from '@luma.gl/engine/lighting';
import {Matrix4} from '@math.gl/core';

for (const mode of ['ssao', 'gtao'] as const) {
  test(`${mode} reuses camera surfaces, resets visibility and preserves borrowed inputs`, async context => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('No WebGPU');
    const surface = new PBRSurfacePass(device, {width: 64, height: 64});
    const occlusion = new AmbientOcclusionPass(device, {mode, resolutionScale: 1});
    const geometry = new Geometry({
      indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
      attributes: {
        POSITION: {
          size: 3,
          value: new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0])
        },
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])}
      }
    });
    const material = createPBRMaterial(device);
    const models = [0, 1].map(() =>
      createPBRSurfaceModel(device, {geometry, material, parameters: {cullMode: 'none'}})
    );
    const projection = new Matrix4()
      .perspective({fovy: Math.PI / 3, aspect: 1, near: 0.1, far: 10})
      .multiplyLeft(new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]));
    const view = new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0]});
    const matrices = [
      new Matrix4().scale([6, 6, 1]),
      new Matrix4().translate([0.25, 0.1, 0.25]).scale([0.5, 0.5, 1])
    ];
    models.forEach((model, index) =>
      model.shaderInputs.setProps({
        pbrProjection: {
          modelMatrix: matrices[index],
          normalMatrix: new Matrix4(),
          modelViewProjectionMatrix: new Matrix4(projection)
            .multiplyRight(view)
            .multiplyRight(matrices[index]),
          camera: [0, 0, 4]
        },
        pbrSurface: {viewMatrix: view}
      })
    );
    const readback = device.createBuffer({
      byteLength: 64 * 256,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    function record(blocked: boolean) {
      surface.render({
        drawSurfaces: target => {
          models[0].draw(target.renderPass);
          if (blocked) models[1].draw(target.renderPass);
        }
      });
      return occlusion.render({
        depthTexture: surface.depthTexture,
        normalTexture: surface.normalTexture,
        projectionMatrix: projection,
        near: 0.1,
        far: 10
      });
    }
    async function read(blocked: boolean) {
      const result = record(blocked);
      device.submit();
      result.readBuffer({x: 0, y: 0, width: 64, height: 64}, readback);
      device.submit();
      return new Uint8Array(await readback.readAsync());
    }
    try {
      const submit = vi.spyOn(device, 'submit');
      record(false);
      expect(submit).not.toHaveBeenCalled();
      submit.mockRestore();
      device.submit();
      const clear = await read(false);
      const blocked = await read(true);
      let affected = 0;
      for (let vertical = 12; vertical < 52; vertical++)
        for (let horizontal = 12; horizontal < 52; horizontal++) {
          const offset = (vertical * 64 + horizontal) * 4;
          if (blocked[offset] < clear[offset] - 10) affected++;
        }
      expect(affected).toBeGreaterThan(5);
      expect(Array.from(await read(false))).toEqual(Array.from(clear));
      const previous = record(false);
      device.submit();
      surface.resize({width: 32, height: 32});
      const resized = record(false);
      device.submit();
      expect([resized.width, resized.height]).toEqual([32, 32]);
      expect(previous.destroyed).toBe(true);
      occlusion.destroy();
      occlusion.destroy();
      expect(resized.destroyed).toBe(true);
      expect(surface.depthTexture.destroyed).toBe(false);
      expect(surface.normalTexture.destroyed).toBe(false);
    } finally {
      vi.restoreAllMocks();
      occlusion.destroy();
      surface.destroy();
      for (const model of models) model.destroy();
      material.destroy();
      readback.destroy();
    }
  });
}

for (const getDevice of [getWebGLTestDevice, getWebGPUTestDevice]) {
  test(`disabled AO is unoccluded and records no work (${getDevice.name})`, async context => {
    const device = await getDevice();
    if (!device) return context.skip('No device');
    const occlusion = new AmbientOcclusionPass(device, {mode: 'none'});
    const depth = device.createTexture({
      width: 1,
      height: 1,
      format: 'depth32float',
      usage: Texture.RENDER | Texture.SAMPLE
    });
    const normal = device.createTexture({
      width: 1,
      height: 1,
      data: new Uint8Array([128, 128, 255, 255])
    });
    try {
      const submit = vi.spyOn(device, 'submit');
      const result = occlusion.render({
        depthTexture: depth,
        normalTexture: normal,
        projectionMatrix: new Matrix4(),
        near: 0.1,
        far: 10
      });
      expect(submit).not.toHaveBeenCalled();
      submit.mockRestore();
      expect([result.width, result.height]).toEqual([1, 1]);
      occlusion.destroy();
      expect(result.destroyed).toBe(true);
      expect(depth.destroyed).toBe(false);
    } finally {
      vi.restoreAllMocks();
      occlusion.destroy();
      depth.destroy();
      normal.destroy();
    }
  });
  for (const extended of [false, true]) {
    test(`PBR AO preserves direct light and emission (${getDevice.name}, extended=${extended})`, async context => {
      const device = await getDevice();
      if (!device) return context.skip('No device');
      const geometry = new Geometry({
        attributes: {
          POSITION: {size: 3, value: new Float32Array([-1, -1, 0.5, 3, -1, 0.5, -1, 3, 0.5])},
          NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])}
        }
      });
      const material = createPBRMaterial(device, {
        uniforms: {
          baseColorFactor: [0.8, 0.8, 0.8, 1],
          metallicRoughnessValues: [0, 1],
          emissiveFactor: [0.05, 0.02, 0.01],
          IBLenabled: true,
          clearcoatFactor: 0.3
        }
      });
      const source = device.createTexture({width: 4, height: 2, data: new Uint8Array(32).fill(64)});
      const environment = createPrefilteredEnvironment(device, {
        source,
        size: 4,
        sampleCount: 8,
        format: 'rgba8unorm'
      });
      const mask = device.createTexture({
        width: 1,
        height: 1,
        data: new Uint8Array([0, 0, 0, 255])
      });
      const model = createPBRModel(device, {
        geometry,
        material,
        receiveAmbientOcclusion: true,
        defines: {
          USE_LIGHTS: true,
          USE_IBL: true,
          USE_SCENE_ENVIRONMENT: true,
          USE_TEX_LOD: true,
          HAS_CLEARCOAT: extended
        },
        bindings: getPBREnvironmentBindings(environment.textures),
        colorAttachmentFormats: ['rgba8unorm'],
        parameters: {depthWriteEnabled: false, cullMode: 'none'}
      });
      model.shaderInputs.setProps({
        pbrAmbientOcclusion: {ambientOcclusionTexture: mask, viewport: [0, 0, 16, 16]},
        pbrScene: getPBREnvironmentUniforms(environment.textures)
      });
      const color = device.createTexture({
        width: 16,
        height: 16,
        usage: Texture.RENDER | Texture.COPY_SRC
      });
      const framebuffer = device.createFramebuffer({colorAttachments: [color]});
      const readback = device.createBuffer({
        byteLength: 256,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      async function read(enabled: boolean, indirect: boolean) {
        material.setProps({pbrMaterial: {IBLenabled: indirect}});
        model.shaderInputs.setProps({
          pbrAmbientOcclusion: {enabled},
          lighting: {
            useByteColors: false,
            lights: [
              {type: 'directional', direction: [0, 0, -1], color: [0.5, 0.5, 0.5]},
              ...(indirect
                ? [{type: 'ambient' as const, color: [0.4, 0.4, 0.4] as [number, number, number]}]
                : [])
            ]
          }
        });
        const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
        pass.setParameters({viewport: [0, 0, 16, 16]});
        model.draw(pass);
        pass.end();
        device.submit();
        color.readBuffer({x: 8, y: 8, width: 1, height: 1}, readback);
        device.submit();
        return Array.from((await readback.readAsync()).slice(0, 4));
      }
      try {
        const occluded = await read(true, true);
        const directOnly = await read(false, false);
        const lit = await read(false, true);
        for (let channel = 0; channel < 4; channel++)
          expect(Math.abs(occluded[channel] - directOnly[channel])).toBeLessThanOrEqual(1);
        expect(lit[0]).toBeGreaterThan(occluded[0] + 10);
        expect(occluded[0]).toBeGreaterThan(20);
        expect(occluded[3]).toBe(255);
      } finally {
        model.destroy();
        material.destroy();
        environment.destroy();
        source.destroy();
        mask.destroy();
        framebuffer.destroy();
        color.destroy();
        readback.destroy();
      }
    });
  }
}
