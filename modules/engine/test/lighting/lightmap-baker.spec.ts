// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {Geometry} from '@luma.gl/engine';
import {LightmapBaker, createPBRMaterial, createPBRLightmapModel} from '@luma.gl/engine/lighting';

async function getDevices() {
  const webgl = await getWebGLTestDevice();
  return [...(await getTestDevices(['webgpu-core', 'webgpu'])), ...(webgl ? [webgl] : [])];
}

test('progressive irradiance averages samples, resets and copies owned results on both backends', async context => {
  const devices = await getDevices();
  if (!devices.length) return context.skip('No GPU');
  for (const device of devices) {
    const baker = new LightmapBaker(device, {width: 4, height: 4});
    const geometry = new Geometry({
      attributes: {
        POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0])},
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
        TANGENT: {size: 4, value: new Float32Array([1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1])},
        TEXCOORD_1: {size: 2, value: new Float32Array([0, 0, 2, 0, 0, 2])}
      }
    });
    const borrowed = device.createTexture({
      width: 1,
      height: 1,
      data: new Uint8Array([255, 0, 0, 255])
    });
    const material = createPBRMaterial(device, {
      bindings: {pbr_lightmapSampler: borrowed},
      uniforms: {baseColorFactor: [0.1, 0.2, 0.3, 1], emissiveFactor: [100, 100, 100]}
    });
    const model = createPBRLightmapModel(device, {geometry, material});
    const submit = vi.spyOn(device, 'submit');
    try {
      for (const intensity of [2, 4]) {
        submit.mockClear();
        baker.update({
          prepareSample: () => {
            model.shaderInputs.setProps({
              lighting: {lights: [{type: 'ambient', color: [255, 255, 255], intensity}]}
            });
          },
          drawSample: ({renderPass}) => {
            model.draw(renderPass);
          }
        });
        expect(submit).not.toHaveBeenCalled();
        device.submit();
      }
      expect(baker.sampleCount).toBe(2);
      const pixels = await readPixel(device, baker.textures.lightmapTexture);
      for (const value of pixels.slice(0, 3)) expect(value, device.type).toBeCloseTo(3, 2);
      expect(pixels[3]).toBe(1);
      const result = baker.createResult();
      device.submit();
      baker.reset();
      expect(baker.sampleCount).toBe(0);
      baker.update({
        drawSample: ({renderPass}) => {
          renderPass.setParameters({scissorRect: [0, 0, 0, 0]});
        }
      });
      device.submit();
      expect(await readPixel(device, baker.textures.lightmapTexture)).toEqual([0, 0, 0, 0]);
      const oldTexture = baker.textures.lightmapTexture;
      baker.resize({width: 8, height: 4});
      expect(oldTexture.destroyed).toBe(true);
      baker.destroy();
      baker.destroy();
      expect((await readPixel(device, result.textures.lightmapTexture))[0]).toBeCloseTo(3, 2);
      result.destroy();
      result.destroy();
      expect(borrowed.destroyed).toBe(false);
      expect(() => baker.reset()).toThrow();
    } finally {
      submit.mockRestore();
      model.destroy();
      material.destroy();
      borrowed.destroy();
      baker.destroy();
    }
  }
});

async function readPixel(device: Device, texture: Texture, x = 0, y = 0): Promise<number[]> {
  const buffer = device.createBuffer({byteLength: 256, usage: Buffer.COPY_DST | Buffer.MAP_READ});
  try {
    texture.readBuffer({x, y, width: 1, height: 1}, buffer);
    const bytes = await buffer.readAsync();
    const values = new Uint16Array(bytes.buffer, bytes.byteOffset, 4);
    return Array.from(values, value => {
      const sign = value & 0x8000 ? -1 : 1;
      const exponent = (value >> 10) & 31;
      const fraction = value & 1023;
      return sign * (exponent ? (1 + fraction / 1024) * 2 ** (exponent - 15) : fraction * 2 ** -24);
    });
  } finally {
    buffer.destroy();
  }
}

test('dilation respects chart IDs and failed draws preserve accumulation', async context => {
  const devices = await getDevices();
  if (!devices.length) return context.skip('No GPU');
  const {ClipSpace} = await import('@luma.gl/engine');
  for (const device of devices) {
    const baker = new LightmapBaker(device, {width: 8, height: 2});
    const chartData = new Float32Array(8 * 2 * 4);
    for (let index = 0; index < 16; index++) chartData[index * 4] = index % 8 < 4 ? 1 : 2;
    const charts = device.createTexture({
      width: 8,
      height: 2,
      format: 'rgba32float',
      data: chartData
    });
    const model = new ClipSpace(device, {
      colorAttachmentFormats: ['rgba16float'],
      parameters: {depthWriteEnabled: false},
      source: `@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
        if (inputs.Position.x < 1.0) {return vec4f(2,0,0,1);}
        if (inputs.Position.x > 7.0) {return vec4f(0,4,0,2);}
        discard; return vec4f(0.0);
      }`,
      fs: `#version 300 es
      out vec4 fragmentColor;
      void main() {
        if (gl_FragCoord.x < 1.0) {fragmentColor=vec4(2,0,0,1);}
        else if (gl_FragCoord.x > 7.0) {fragmentColor=vec4(0,4,0,2);}
        else {discard;}
      }`
    });
    try {
      baker.update({
        drawSample: ({renderPass}) => {
          model.draw(renderPass);
        },
        chartTexture: charts,
        dilationSteps: 4
      });
      device.submit();
      expect(await readPixel(device, baker.textures.lightmapTexture, 3)).toEqual([2, 0, 0, 1]);
      expect(await readPixel(device, baker.textures.lightmapTexture, 4)).toEqual([0, 4, 0, 2]);
      expect(() =>
        baker.update({
          drawSample: () => {
            throw new Error('draw failure');
          }
        })
      ).toThrow('draw failure');
      expect(baker.sampleCount).toBe(1);
      device.submit();
      expect(await readPixel(device, baker.textures.lightmapTexture, 3)).toEqual([2, 0, 0, 1]);
      baker.update({
        drawSample: ({renderPass}) => {
          model.draw(renderPass);
        }
      });
      device.submit();
      // Dilation is presentation-only: it must never enter the next accumulated sample.
      expect(await readPixel(device, baker.textures.lightmapTexture, 3)).toEqual([0, 0, 0, 0]);
    } finally {
      model.destroy();
      baker.destroy();
      expect(charts.destroyed).toBe(false);
      charts.destroy();
    }
  }
});

test('bake models honor alpha cutouts and directional shadow maps', async context => {
  const devices = await getDevices();
  if (!devices.length) return context.skip('No GPU');
  const {Matrix4} = await import('@math.gl/core');
  const {ShadowMapRenderer, createPBRShadowModel} = await import('@luma.gl/engine/lighting');
  for (const device of devices) {
    const baker = new LightmapBaker(device, {width: 8, height: 8});
    const geometry = new Geometry({
      attributes: {
        POSITION: {size: 3, value: new Float32Array([-2, -2, 0, 6, -2, 0, -2, 6, 0])},
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
        TEXCOORD_1: {size: 2, value: new Float32Array([0, 0, 2, 0, 0, 2])}
      }
    });
    const material = createPBRMaterial(device, {
      uniforms: {alphaCutoffEnabled: true, alphaCutoff: 0.5}
    });
    const model = createPBRLightmapModel(device, {
      geometry,
      material,
      receiveShadows: true,
      defines: {ALPHA_CUTOFF: true}
    });
    const shadows = new ShadowMapRenderer(device, {
      quality: 'low',
      directionalMapSize: 64,
      spotMapSize: 16,
      pointMapSize: 16
    });
    const casters = new Map<object, ReturnType<typeof createPBRShadowModel>>();
    const view = new Matrix4().lookAt({eye: [0, 0, 5], center: [0, 0, 0], up: [0, 1, 0]});
    const projection = new Matrix4().ortho({
      left: -3,
      right: 3,
      bottom: -3,
      top: 3,
      near: 0.1,
      far: 10
    });
    async function bake(blocked: boolean) {
      baker.reset();
      const shadowProps = shadows.render({
        camera: {viewMatrix: view, projectionMatrix: projection, near: 0.1, far: 10},
        directionalLights: [
          {direction: [0, 0, 1], shadowDistance: 9, normalBias: 0, sourceAngularRadius: 0}
        ],
        prepareShadowCasters: lightView => {
          if (!casters.has(lightView.framebuffer))
            casters.set(lightView.framebuffer, createPBRShadowModel(device, {geometry, material}));
          const matrix = new Matrix4().translate([0, 0, 1]).scale([4, 4, 1]);
          casters.get(lightView.framebuffer)!.shaderInputs.setProps({
            pbrProjection: {
              modelMatrix: matrix,
              normalMatrix: new Matrix4(),
              modelViewProjectionMatrix: new Matrix4(lightView.viewProjectionMatrix).multiplyRight(
                matrix
              ),
              camera: [0, 0, 5]
            }
          });
        },
        drawShadowCasters: lightView => {
          if (blocked) casters.get(lightView.framebuffer)!.draw(lightView.renderPass);
        }
      });
      baker.update({
        prepareSample: () =>
          model.shaderInputs.setProps({
            lighting: {
              lights: [
                {type: 'directional', direction: [0, 0, -1], intensity: 2, color: [255, 255, 255]}
              ]
            },
            shadow: shadowProps,
            pbrShadow: {viewMatrix: view}
          }),
        drawSample: ({renderPass}) => {
          model.draw(renderPass);
        }
      });
      device.submit();
      return readPixel(device, baker.textures.lightmapTexture, 2);
    }
    try {
      expect((await bake(false))[0], device.type).toBeCloseTo(2, 2);
      expect((await bake(true))[0], device.type).toBeLessThan(0.1);
      material.setProps({pbrMaterial: {baseColorFactor: [1, 1, 1, 0]}});
      expect(await bake(false)).toEqual([0, 0, 0, 0]);
    } finally {
      for (const caster of casters.values()) caster.destroy();
      model.destroy();
      material.destroy();
      shadows.destroy();
      baker.destroy();
    }
  }
});

test('standard example renders live lighting and freezes baked pixels', async context => {
  const devices = await getDevices();
  if (!devices.length) return context.skip('No GPU');
  const {LightmapPreview} = await import('../../../../examples/api/pbr-shadows/lightmap-preview');
  for (const device of devices) {
    const preview = new LightmapPreview(device);
    const texture = device.createTexture({
      width: 32,
      height: 32,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const depth = device.createTexture({
      width: 32,
      height: 32,
      format: 'depth24plus',
      usage: Texture.RENDER_ATTACHMENT
    });
    const framebuffer = device.createFramebuffer({
      width: 32,
      height: 32,
      colorAttachments: [texture],
      depthStencilAttachment: depth
    });
    const buffer = device.createBuffer({
      byteLength: 256 * 32,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    async function render(mode: 'live' | 'baking' | 'baked', time: number) {
      preview.render(framebuffer, mode, time);
      device.submit();
      texture.readBuffer({x: 0, y: 0, width: 32, height: 32}, buffer);
      return Array.from(await buffer.readAsync());
    }
    try {
      const initialBake = await render('baking', 0);
      expect(
        Math.max(...initialBake.filter((_, index) => index % 4 < 3)),
        device.type
      ).toBeGreaterThan(80);
      const live = await render('live', 0);
      expect(Math.max(...live.filter((_, index) => index % 4 < 3)), device.type).toBeGreaterThan(
        80
      );
      expect(await render('live', 2000)).toEqual(live);
      const baking = await render('baking', 150);
      expect(Math.max(...baking.filter((_, index) => index % 4 < 3)), device.type).toBeGreaterThan(
        80
      );
      await render('baked', 300);
      const frozen = await render('baked', 1000);
      expect(await render('baked', 2000)).toEqual(frozen);
      const exported = await preview.exportData();
      preview.reset();
      preview.loadData(exported);
      expect(await render('baked', 2100)).toEqual(frozen);
      expect(await preview.exportData()).toEqual(exported);
      preview.reset();
      expect(preview.baker.sampleCount).toBe(0);
      await render('baked', 3000);
      expect(preview.baker.sampleCount).toBe(1);
    } finally {
      preview.destroy();
      framebuffer.destroy();
      texture.destroy();
      depth.destroy();
      buffer.destroy();
    }
  }
});

test('long default bakes retain later samples in float32 history', {
  timeout: 180000
}, async context => {
  const devices = await getDevices();
  if (!devices.length) return context.skip('No GPU');
  const {ClipSpace} = await import('@luma.gl/engine');
  for (const device of devices) {
    const baker = new LightmapBaker(device, {width: 1, height: 1});
    const samples = [1, 2].map(
      value =>
        new ClipSpace(device, {
          colorAttachmentFormats: ['rgba16float'],
          parameters: {depthWriteEnabled: false},
          source: `@fragment fn fragmentMain() -> @location(0) vec4f {return vec4f(${value}.0,0.0,0.0,1.0);}`,
          fs: `#version 300 es\nout vec4 fragmentColor;\nvoid main(){fragmentColor=vec4(${value}.0,0.0,0.0,1.0);}`
        })
    );
    try {
      for (let index = 0; index < 8192; index++) {
        const model = samples[index < 4096 ? 0 : 1];
        baker.update({
          drawSample: ({renderPass}) => {
            model.draw(renderPass);
          }
        });
        device.submit();
        // Periodically drain the queue; do not retain thousands of pending GPU submissions.
        if (index % 256 === 255) await readPixel(device, baker.textures.lightmapTexture);
      }
      expect(baker.sampleCount).toBe(8192);
      expect((await readPixel(device, baker.textures.lightmapTexture))[0], device.type).toBeCloseTo(
        1.5,
        2
      );
    } finally {
      samples.forEach(model => model.destroy());
      baker.destroy();
    }
  }
});
