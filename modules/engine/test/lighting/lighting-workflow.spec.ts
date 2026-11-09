// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, Texture, type Device} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevices} from '@luma.gl/core/test-utils';
import {Geometry, Model} from '@luma.gl/engine';
import {
  AmbientOcclusionPass,
  ContactShadowPass,
  PBRSurfacePass,
  LightmapBaker,
  ClusteredLightGrid,
  ShadowMapRenderer,
  createPBRMaterial,
  createPBRModel,
  createPBRSurfaceModel,
  createPBRLightmapModel,
  createPrefilteredEnvironment,
  getPBREnvironmentBindings,
  getPBREnvironmentUniforms,
  type LightmapBakeResult
} from '@luma.gl/engine/lighting';
import {Matrix4} from '@math.gl/core';

function createGeometry() {
  return new Geometry({
    attributes: {
      POSITION: {size: 3, value: new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
      TEXCOORD_1: {size: 2, value: new Float32Array([0, 0, 2, 0, 0, 2])}
    }
  });
}

async function readPixel(device: Device, texture: Texture, x: number, y: number) {
  const buffer = device.createBuffer({byteLength: 256, usage: Buffer.COPY_DST | Buffer.MAP_READ});
  try {
    texture.readBuffer({x, y, width: 1, height: 1}, buffer);
    device.submit();
    return Array.from((await buffer.readAsync()).slice(0, 4));
  } finally {
    buffer.destroy();
  }
}

// Neutral/occluded fixtures isolate receiving math from each visibility evaluator's noise.
test('combined PBR visibility preserves emission and separates direct from baked/environment light', async context => {
  const webgl = await getWebGLTestDevice();
  const devices = [...(await getWebGPUTestDevices()), ...(webgl ? [webgl] : [])];
  if (!devices.length) return context.skip('No GPU');
  for (const device of devices) {
    const geometry = createGeometry();
    const source = device.createTexture({width: 4, height: 2, data: new Uint8Array(32).fill(64)});
    const environment = createPrefilteredEnvironment(device, {
      source,
      size: 4,
      sampleCount: 8,
      format: 'rgba8unorm'
    });
    const baker = new LightmapBaker(device, {width: 2, height: 2});
    const bakeMaterial = createPBRMaterial(device);
    const bakeModel = createPBRLightmapModel(device, {geometry, material: bakeMaterial});
    baker.update({
      prepareSample: () =>
        bakeModel.shaderInputs.setProps({
          lighting: {
            useByteColors: false,
            lights: [{type: 'ambient', color: [0.5, 0.5, 0.5]}]
          }
        }),
      drawSample: ({renderPass}) => bakeModel.draw(renderPass)
    });
    device.submit();
    const baked = baker.createResult();
    device.submit();
    baker.destroy();
    bakeModel.destroy();
    bakeMaterial.destroy();
    const lightmap = baked.textures.lightmapTexture;
    // Center sampling lands in column 8; omitting viewport.x would land in white column 10.
    const maskData = new Uint8Array(16 * 12 * 4);
    for (let pixel = 0; pixel < 16 * 12; pixel++) {
      maskData.set([...(pixel % 16 < 9 ? [0, 0, 0] : [255, 255, 255]), 255], pixel * 4);
    }
    const mask = device.createTexture({
      width: 16,
      height: 12,
      data: maskData,
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
    const material = createPBRMaterial(device, {
      bindings: {pbr_lightmapSampler: lightmap},
      uniforms: {
        baseColorFactor: [0.5, 0.5, 0.5, 1],
        metallicRoughnessValues: [0, 1],
        emissiveFactor: [0.02, 0.03, 0.04],
        IBLenabled: true
      }
    });
    const receiver = createPBRModel(device, {
      geometry,
      material,
      receiveShadows: true,
      receiveContactShadows: true,
      receiveAmbientOcclusion: true,
      defines: {USE_LIGHTS: true, USE_IBL: true, USE_SCENE_ENVIRONMENT: true, USE_TEX_LOD: true},
      bindings: getPBREnvironmentBindings(environment.textures),
      colorAttachmentFormats: ['rgba8unorm'],
      parameters: {depthWriteEnabled: false, cullMode: 'none'}
    });
    const shadows = new ShadowMapRenderer(device, {
      quality: 'low',
      directionalMapSize: 16,
      spotMapSize: 16,
      pointMapSize: 16
    });
    const caster = new Model(device, {
      source: `@vertex fn vertexMain(@builtin(vertex_index) index:u32)->@builtin(position) vec4f {let positions=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));return vec4f(positions[index],0,1);}
      @fragment fn fragmentMain(){}`,
      vs: `#version 300 es
      void main(){vec2 positions[3]=vec2[3](vec2(-1,-1),vec2(3,-1),vec2(-1,3));gl_Position=vec4(positions[gl_VertexID],-1,1);}`,
      fs: `#version 300 es
      precision highp float;void main(){}`,
      vertexCount: 3,
      colorAttachmentFormats: [],
      depthStencilAttachmentFormat: 'depth32float',
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', cullMode: 'none'}
    });
    const color = device.createTexture({
      width: 20,
      height: 18,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: 20,
      height: 18,
      colorAttachments: [color]
    });
    const view = new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0]});
    const projection = new Matrix4().ortho({
      left: -1,
      right: 1,
      bottom: -1,
      top: 1,
      near: 0.1,
      far: 10
    });
    const viewport: [number, number, number, number] = [2, 3, 16, 12];
    async function render(
      ambientOcclusion: boolean,
      contact: boolean,
      mapped: boolean,
      indirect: boolean | 'environment' | 'lightmap',
      direct: boolean
    ) {
      material.setProps({
        pbrMaterial: {
          IBLenabled: indirect === true || indirect === 'environment',
          lightmapIntensity: indirect === true || indirect === 'lightmap' ? 1 : 0
        }
      });
      receiver.shaderInputs.setProps({
        pbrAmbientOcclusion: {ambientOcclusionTexture: mask, viewport, enabled: ambientOcclusion},
        pbrContactShadow: {contactShadowTexture: mask, viewport, enabled: contact},
        pbrShadow: {viewMatrix: view, enabled: mapped},
        pbrScene: getPBREnvironmentUniforms(environment.textures),
        lighting: {
          useByteColors: false,
          lights: [
            ...(direct
              ? [
                  {
                    type: 'directional' as const,
                    direction: [0, 0, -1] as [number, number, number],
                    color: [0.6, 0.6, 0.6] as [number, number, number]
                  }
                ]
              : []),
            {
              type: 'ambient' as const,
              color: (indirect === true ? [0.1, 0.1, 0.1] : [0, 0, 0]) as [number, number, number]
            }
          ]
        }
      });
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
      pass.setParameters({viewport});
      receiver.draw(pass);
      pass.end();
      device.submit();
      return readPixel(device, color, 10, 9);
    }
    try {
      receiver.shaderInputs.setProps({
        shadow: shadows.render({
          camera: {viewMatrix: view, projectionMatrix: projection, near: 0.1, far: 10},
          directionalLights: [
            {direction: [0, 0, 1], shadowDistance: 9, normalBias: 0, sourceAngularRadius: 0}
          ],
          drawShadowCasters: target => caster.draw(target.renderPass)
        })
      });
      device.submit();
      const emission = await render(false, false, false, false, false);
      const direct = await render(false, false, false, false, true);
      const indirect = await render(false, false, false, true, false);
      const environmentOnly = await render(false, false, false, 'environment', false);
      const lightmapOnly = await render(false, false, false, 'lightmap', false);
      const environmentBlocked = await render(true, false, false, 'environment', false);
      const lightmapBlocked = await render(true, false, false, 'lightmap', false);
      const full = await render(false, false, false, true, true);
      const rightFull = await readPixel(device, color, 15, 9);
      const ambientBlocked = await render(true, false, false, true, true);
      const rightAmbient = await readPixel(device, color, 15, 9);
      const contactBlocked = await render(false, true, false, true, true);
      const rightContact = await readPixel(device, color, 15, 9);
      const mapBlocked = await render(false, false, true, true, true);
      const allBlocked = await render(true, true, true, true, true);
      for (let channel = 0; channel < 3; channel++) {
        expect(Math.abs(emission[channel] - [5, 8, 10][channel])).toBeLessThanOrEqual(1);
        expect(environmentOnly[channel]).toBeGreaterThan(emission[channel] + 2);
        expect(lightmapOnly[channel]).toBeGreaterThan(emission[channel] + 15);
        expect(Math.abs(environmentBlocked[channel] - emission[channel])).toBeLessThanOrEqual(1);
        expect(Math.abs(lightmapBlocked[channel] - emission[channel])).toBeLessThanOrEqual(1);
        expect(Math.abs(rightAmbient[channel] - rightFull[channel])).toBeLessThanOrEqual(1);
        expect(Math.abs(rightContact[channel] - rightFull[channel])).toBeLessThanOrEqual(1);
        expect(full[channel]).toBeGreaterThan(direct[channel] + 10);
        expect(full[channel]).toBeGreaterThan(indirect[channel] + 10);
        expect(Math.abs(ambientBlocked[channel] - direct[channel])).toBeLessThanOrEqual(1);
        expect(Math.abs(contactBlocked[channel] - indirect[channel])).toBeLessThanOrEqual(1);
        expect(Math.abs(mapBlocked[channel] - indirect[channel])).toBeLessThanOrEqual(1);
        expect(Math.abs(allBlocked[channel] - emission[channel])).toBeLessThanOrEqual(1);
      }
      expect(allBlocked[3]).toBe(255);
      expect(await readPixel(device, color, 0, 0)).toEqual([0, 0, 0, 0]);
      // Destruction must preserve caller-owned material inputs.
      shadows.destroy();
      receiver.destroy();
      material.destroy();
      environment.destroy();
      expect(lightmap.destroyed).toBe(false);
      expect(mask.destroyed).toBe(false);
      expect(source.destroyed).toBe(false);
    } finally {
      receiver.destroy();
      material.destroy();
      environment.destroy();
      shadows.destroy();
      caster.destroy();
      source.destroy();
      baked.destroy();
      baker.destroy();
      bakeModel.destroy();
      bakeMaterial.destroy();
      mask.destroy();
      framebuffer.destroy();
      color.destroy();
    }
  }
});

test('shared frame reuses resources, replaces resized outputs and recovers from failed surface draws', async context => {
  const devices = await getWebGPUTestDevices();
  if (!devices.length) return context.skip('No WebGPU');
  for (const device of devices) {
    const geometry = createGeometry();
    const material = createPBRMaterial(device);
    const surface = new PBRSurfacePass(device, {width: 17, height: 13});
    const ambient = new AmbientOcclusionPass(device, {mode: 'gtao'});
    const contact = new ContactShadowPass(device, {quality: 'low'});
    const baker = new LightmapBaker(device, {width: 8, height: 8});
    const surfaceModel = createPBRSurfaceModel(device, {
      geometry,
      material,
      parameters: {cullMode: 'none'}
    });
    const bakeModel = createPBRLightmapModel(device, {geometry, material});
    const grid = new ClusteredLightGrid(device, {
      clusterDimensions: [2, 2, 2],
      maxLightCount: 1,
      maxLightsPerCluster: 1
    });
    const lights = device.createBuffer({
      data: new Float32Array([0, 0, -2, 10, 1, 1, 1, 1]),
      usage: Buffer.STORAGE
    });
    const projection = new Matrix4().perspective({fovy: 1, aspect: 17 / 13, near: 0.1, far: 10});
    const depthConversion = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]);
    const view = new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0]});
    let stable: LightmapBakeResult | undefined;
    function record() {
      const nativeProjection = new Matrix4(projection).multiplyLeft(depthConversion);
      surface.render({
        prepareSurfaces: () =>
          surfaceModel.shaderInputs.setProps({
            pbrProjection: {
              modelViewProjectionMatrix: new Matrix4(nativeProjection).multiplyRight(view)
            },
            pbrSurface: {viewMatrix: view}
          }),
        drawSurfaces: ({renderPass}) => surfaceModel.draw(renderPass)
      });
      const input = {
        depthTexture: surface.depthTexture,
        normalTexture: surface.normalTexture,
        projectionMatrix: nativeProjection
      };
      const ambientTexture = ambient.render({...input, near: 0.1, far: 10});
      const contactTexture = contact.render({...input, lightDirectionView: [0, 0, -1]});
      grid.encode(device.commandEncoder, {
        pointLights: lights,
        pointLightCount: 1,
        projectionMatrix: projection,
        nearPlane: 0.1,
        farPlane: 10
      });
      baker.update({
        prepareSample: () =>
          bakeModel.shaderInputs.setProps({
            lighting: {useByteColors: false, lights: [{type: 'ambient', color: [1, 1, 1]}]}
          }),
        drawSample: ({renderPass}) => bakeModel.draw(renderPass)
      });
      return [ambientTexture, contactTexture, baker.textures.lightmapTexture];
    }
    try {
      record();
      device.submit();
      const createTexture = vi.spyOn(device, 'createTexture');
      const createBuffer = vi.spyOn(device, 'createBuffer');
      const submit = vi.spyOn(device, 'submit');
      for (let iteration = 0; iteration < 3; iteration++) {
        submit.mockClear();
        record();
        expect(submit).not.toHaveBeenCalled();
        device.submit();
      }
      expect(createTexture).not.toHaveBeenCalled();
      // Ordered uniform uploads may allocate submission-scoped COPY_SRC staging buffers.
      for (const [props] of createBuffer.mock.calls) expect(props.usage).toBe(Buffer.COPY_SRC);
      const stagingBuffers = createBuffer.mock.results.map(result => result.value);
      createTexture.mockRestore();
      createBuffer.mockRestore();
      submit.mockRestore();
      // Readback yields until prior submissions and their staging cleanup have completed.
      await readPixel(device, surface.normalTexture, 0, 0);
      for (const buffer of stagingBuffers) expect(buffer.destroyed).toBe(true);
      const previous = record();
      device.submit();
      const oldDepth = surface.depthTexture;
      const oldNormal = surface.normalTexture;
      surface.resize({width: 17, height: 13});
      baker.resize({width: 8, height: 8});
      expect(surface.depthTexture).toBe(oldDepth);
      expect(baker.sampleCount).toBe(5);
      stable = baker.createResult();
      device.submit();
      surface.resize({width: 23, height: 19});
      baker.resize({width: 4, height: 6});
      projection.perspective({fovy: 1, aspect: 23 / 19, near: 0.1, far: 10});
      expect(oldDepth.destroyed).toBe(true);
      expect(oldNormal.destroyed).toBe(true);
      expect(baker.sampleCount).toBe(0);
      expect(() =>
        surface.render({
          drawSurfaces: () => {
            throw new Error('fixture failure');
          }
        })
      ).toThrow('fixture failure');
      const resized = record();
      device.submit();
      expect(resized.map(texture => [texture.width, texture.height])).toEqual([
        [23, 19],
        [23, 19],
        [4, 6]
      ]);
      for (const texture of previous) expect(texture.destroyed).toBe(true);
      expect(baker.sampleCount).toBe(1);
      const counts = await grid.clusterLightCounts.readAsync();
      expect(Array.from(new Uint32Array(counts.buffer, counts.byteOffset, 8))).toEqual(
        Array(8).fill(1)
      );
      baker.reset();
      record();
      device.submit();
      expect(baker.sampleCount).toBe(1);
      {
        const recordingTimes: number[] = [];
        const completionTimes: number[] = [];
        for (let iteration = 0; iteration < 25; iteration++) {
          const start = performance.now();
          const outputs = record();
          device.submit();
          const recorded = performance.now();
          await readPixel(device, outputs[1], 0, 0);
          if (iteration >= 5) {
            recordingTimes.push(recorded - start);
            completionTimes.push(performance.now() - start);
          }
        }
        function median(values: number[]) {
          return values.sort((left, right) => left - right)[Math.floor(values.length / 2)];
        }
        const measurement = {
          renderer: device.info.renderer,
          featureLevel: device.info.featureLevel,
          surface: [surface.width, surface.height],
          atlas: [baker.width, baker.height],
          frames: recordingTimes.length,
          recordingMedianMilliseconds: median(recordingTimes),
          completionWithReadbackMedianMilliseconds: median(completionTimes)
        };
        context.task.meta[`lighting-${device.info.featureLevel}`] = measurement;
        await context.annotate(JSON.stringify(measurement), 'measurement');
      }
      ambient.destroy();
      contact.destroy();
      baker.destroy();
      grid.destroy();
      for (const texture of resized) expect(texture.destroyed).toBe(true);
      expect(surface.depthTexture.destroyed).toBe(false);
      expect(lights.destroyed).toBe(false);
      expect(stable.textures.lightmapTexture.destroyed).toBe(false);
      stable.destroy();
      expect(() =>
        ambient.render({
          depthTexture: surface.depthTexture,
          normalTexture: surface.normalTexture,
          projectionMatrix: projection,
          near: 0.1,
          far: 10
        })
      ).toThrow();
    } finally {
      vi.restoreAllMocks();
      ambient.destroy();
      contact.destroy();
      baker.destroy();
      grid.destroy();
      surface.destroy();
      stable?.destroy();
      surfaceModel.destroy();
      bakeModel.destroy();
      material.destroy();
      lights.destroy();
    }
  }
});

test('failed lighting target replacement keeps the previous usable resources', async context => {
  const devices = await getWebGPUTestDevices();
  if (!devices.length) return context.skip('No WebGPU');
  for (const device of devices) {
    const surface = new PBRSurfacePass(device, {width: 7, height: 5});
    const baker = new LightmapBaker(device, {width: 4, height: 4});
    const previous = [surface.normalTexture, surface.depthTexture, baker.textures.lightmapTexture];
    const createTexture = device.createTexture.bind(device);
    const replacements: Texture[] = [];
    let allocations = 0;
    const allocation = vi.spyOn(device, 'createTexture').mockImplementation(props => {
      if (++allocations === 2) throw new Error('allocation fixture');
      const texture = createTexture(props);
      replacements.push(texture);
      return texture;
    });
    try {
      expect(() => surface.resize({width: 9, height: 7})).toThrow('allocation fixture');
      expect([surface.width, surface.height]).toEqual([7, 5]);
      allocations = 0;
      expect(() => baker.resize({width: 6, height: 6})).toThrow('allocation fixture');
      expect([baker.width, baker.height]).toEqual([4, 4]);
      for (const texture of replacements) expect(texture.destroyed).toBe(true);
      for (const texture of previous) expect(texture.destroyed).toBe(false);
      allocation.mockRestore();
      surface.render({drawSurfaces: () => {}});
      baker.update({drawSample: () => {}});
      device.submit();
      expect(baker.sampleCount).toBe(1);
      surface.resize({width: 9, height: 7});
      baker.resize({width: 6, height: 6});
      for (const texture of previous) expect(texture.destroyed).toBe(true);
    } finally {
      allocation.mockRestore();
      surface.destroy();
      baker.destroy();
    }
  }
});
