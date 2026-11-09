// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {Geometry} from '@luma.gl/engine';
import {createPBRMaterial, createPBRModel} from '@luma.gl/engine/lighting';

test('standalone PBR receives linear irradiance with UV selection, transforms and independent emission', async context => {
  const webglDevice = await getWebGLTestDevice();
  const devices = [...(await getTestDevices(['webgpu'])), ...(webglDevice ? [webglDevice] : [])];
  if (!devices.length) return context.skip('No rendering device');
  for (const device of devices) {
    const geometry = new Geometry({
      attributes: {
        POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0])},
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
        TEXCOORD_0: {size: 2, value: new Float32Array([0.25, 0.5, 0.25, 0.5, 0.25, 0.5])},
        TEXCOORD_1: {size: 2, value: new Float32Array([0.75, 0.5, 0.75, 0.5, 0.75, 0.5])}
      }
    });
    const lightmap = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      sampler: {minFilter: 'nearest', magFilter: 'nearest'},
      data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
    });
    const material = createPBRMaterial(device, {
      bindings: {pbr_lightmapSampler: lightmap},
      uniforms: {
        baseColorFactor: [0.5, 0.5, 0.5, 1],
        metallicRoughnessValues: [0, 1],
        lightmapUVSet: 1,
        emissiveFactor: [0, 0, 0.1]
      }
    });
    const target = device.createTexture({
      width: 4,
      height: 4,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [target]});
    const readback = device.createBuffer({
      byteLength: 256,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const model = createPBRModel(device, {
      geometry,
      material,
      colorAttachmentFormats: ['rgba8unorm'],
      parameters: {depthWriteEnabled: false, cullMode: 'none'}
    });
    async function render() {
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
      pass.setParameters({viewport: [0, 0, 4, 4]});
      model.draw(pass);
      pass.end();
      device.submit();
      target.readBuffer({x: 2, y: 2, width: 1, height: 1}, readback);
      return Array.from((await readback.readAsync()).slice(0, 4));
    }
    try {
      const expected = (255 * 0.5) / Math.PI;
      const green = await render();
      expect(Math.abs(green[1] - expected), device.type).toBeLessThan(3);
      expect(green[0]).toBeLessThan(2);
      expect(Math.abs(green[2] - 25.5)).toBeLessThan(2);
      material.setProps({pbrMaterial: {lightmapUVSet: 0}});
      const red = await render();
      expect(Math.abs(red[0] - expected), device.type).toBeLessThan(3);
      expect(red[1]).toBeLessThan(2);
      material.setProps({pbrMaterial: {lightmapUVTransform: [1, 0, 0, 0, 1, 0, 0.5, 0, 1]}});
      expect((await render())[1]).toBeGreaterThan(38);
      material.setProps({pbrMaterial: {lightmapIntensity: 0}});
      const dark = await render();
      expect(dark[0] + dark[1]).toBeLessThan(3);
      expect(dark[2]).toBe(green[2]);
      expect(dark[3]).toBe(green[3]);
      expect(Object.keys(geometry.attributes)).toEqual([
        'POSITION',
        'NORMAL',
        'TEXCOORD_0',
        'TEXCOORD_1'
      ]);
    } finally {
      model.destroy();
      material.destroy();
      expect(lightmap.destroyed).toBe(false);
      lightmap.destroy();
      framebuffer.destroy();
      target.destroy();
      readback.destroy();
    }
  }
});
