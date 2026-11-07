// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {Geometry, Model} from '@luma.gl/engine';
import {
  ShadowMapRenderer,
  PBRSurfacePass,
  createPBRSurfaceModel,
  createPBRMaterial,
  ContactShadowPass,
  createPBRModel,
  createPrefilteredEnvironment,
  getPBREnvironmentBindings,
  getPBREnvironmentUniforms
} from '@luma.gl/engine/lighting';
import {Matrix4} from '@math.gl/core';

for (const getDevice of [getWebGLTestDevice, getWebGPUTestDevice]) {
  test(`directional contact visibility respects occluders, self bias and ownership (${getDevice.name})`, async context => {
    const device = await getDevice();
    if (!device) return context.skip('No rendering device');
    const surfaces = new PBRSurfacePass(device, {width: 64, height: 64});
    const contacts = new ContactShadowPass(device, {quality: 'cinematic'});
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
    const material = createPBRMaterial(device, {uniforms: {metallicRoughnessValues: [0, 1]}});
    const ground = createPBRSurfaceModel(device, {
      geometry,
      material,
      parameters: {cullMode: 'none'}
    });
    const blocker = createPBRSurfaceModel(device, {
      geometry,
      material,
      parameters: {cullMode: 'none'}
    });
    const view = new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0]});
    let projection = new Matrix4().ortho({
      left: -1,
      right: 1,
      bottom: -1,
      top: 1,
      near: 0.1,
      far: 10
    });
    if (device.type === 'webgpu')
      projection.multiplyLeft(new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]));
    const matrices = [
      new Matrix4().scale([2, 2, 1]),
      new Matrix4().translate([0.36, 0.2, 0.3]).scale([0.4, 0.3, 1])
    ];
    function updateCameraProjection() {
      [ground, blocker].forEach((model, index) =>
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
    }
    updateCameraProjection();
    const readback = device.createBuffer({
      byteLength: 256,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    async function render(blocked: boolean) {
      surfaces.render({
        drawSurfaces: target => {
          ground.draw(target.renderPass);
          if (blocked) blocker.draw(target.renderPass);
        }
      });
      const mask = contacts.render({
        depthTexture: surfaces.depthTexture,
        normalTexture: surfaces.normalTexture,
        projectionMatrix: projection,
        lightDirectionView: [0.7, 0.4, 0.6],
        maxDistance: 1,
        thickness: 0.06,
        normalBias: 0.01,
        frameIndex: 0
      });
      device.submit();
      mask.readBuffer({x: 32, y: 32, width: 1, height: 1}, readback);
      device.submit();
      return {mask, pixel: Array.from((await readback.readAsync()).slice(0, 4))};
    }
    try {
      const submit = vi.spyOn(device, 'submit');
      surfaces.render({drawSurfaces: target => ground.draw(target.renderPass)});
      contacts.render({
        depthTexture: surfaces.depthTexture,
        normalTexture: surfaces.normalTexture,
        projectionMatrix: projection,
        lightDirectionView: [0.7, 0.4, 0.6],
        maxDistance: 1,
        normalBias: 0.01
      });
      expect(submit).not.toHaveBeenCalled();
      submit.mockRestore();
      device.submit();
      const clear = await render(false);
      const blocked = await render(true);
      expect(clear.pixel).toEqual([255, 255, 255, 255]);
      expect(
        blocked.pixel[0],
        `${device.type} an asymmetric raised occluder creates contact visibility`
      ).toBeLessThan(clear.pixel[0] - 20);
      // Exercise the actual traced mask through PBR receiving in an offset viewport.
      const receiver = createPBRModel(device, {
        geometry,
        material,
        receiveContactShadows: true,
        defines: {USE_LIGHTS: true},
        colorAttachmentFormats: ['rgba8unorm'],
        parameters: {depthWriteEnabled: false, cullMode: 'none'}
      });
      const receiverColor = device.createTexture({
        width: 80,
        height: 88,
        format: 'rgba8unorm',
        usage: Texture.RENDER | Texture.COPY_SRC
      });
      const receiverFramebuffer = device.createFramebuffer({colorAttachments: [receiverColor]});
      const imageReadback = device.createBuffer({
        byteLength: 64 * 256,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        receiver.shaderInputs.setProps({
          pbrProjection: {
            modelMatrix: matrices[0],
            normalMatrix: new Matrix4(),
            modelViewProjectionMatrix: new Matrix4(projection)
              .multiplyRight(view)
              .multiplyRight(matrices[0]),
            camera: [0, 0, 4]
          },
          lighting: {
            useByteColors: false,
            lights: [{type: 'directional', direction: [-0.7, -0.4, -0.6], color: [1, 1, 1]}]
          },
          pbrContactShadow: {contactShadowTexture: blocked.mask, viewport: [7, 11, 64, 64]}
        });
        blocked.mask.readBuffer({x: 0, y: 0, width: 64, height: 64}, imageReadback);
        device.submit();
        const visibility = new Uint8Array(await imageReadback.readAsync());
        async function readReceiver(enabled: boolean) {
          receiver.shaderInputs.setProps({pbrContactShadow: {enabled}});
          const pass = device.beginRenderPass({
            framebuffer: receiverFramebuffer,
            clearColor: [0, 0, 0, 1]
          });
          pass.setParameters({viewport: [7, 11, 64, 64]});
          receiver.draw(pass);
          pass.end();
          device.submit();
          receiverColor.readBuffer({x: 7, y: 11, width: 64, height: 64}, imageReadback);
          device.submit();
          return new Uint8Array(await imageReadback.readAsync());
        }
        const litImage = await readReceiver(false);
        const shadowImage = await readReceiver(true);
        let shadowedPixels = 0;
        let clearPixels = 0;
        for (let vertical = 8; vertical < 56; vertical++) {
          for (let horizontal = 8; horizontal < 56; horizontal++) {
            if (Math.abs(horizontal - 32) < 4 || Math.abs(vertical - 32) < 4) continue;
            const offset = (vertical * 64 + horizontal) * 4;
            const attenuation = litImage[offset] - shadowImage[offset];
            if (visibility[offset] < 190) {
              expect(attenuation, `shadow at ${horizontal},${vertical}`).toBeGreaterThan(10);
              shadowedPixels++;
            } else if (visibility[offset] === 255) {
              expect(attenuation, `clear at ${horizontal},${vertical}`).toBeLessThanOrEqual(1);
              clearPixels++;
            }
          }
        }
        expect(shadowedPixels).toBeGreaterThan(5);
        expect(clearPixels).toBeGreaterThan(100);
      } finally {
        receiver.destroy();
        receiverFramebuffer.destroy();
        receiverColor.destroy();
        imageReadback.destroy();
      }
      projection = new Matrix4().perspective({fovy: Math.PI / 3, aspect: 1, near: 0.1, far: 10});
      if (device.type === 'webgpu')
        projection.multiplyLeft(new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]));
      updateCameraProjection();
      const perspectiveClear = await render(false);
      const perspectiveBlocked = await render(true);
      expect(perspectiveClear.pixel).toEqual([255, 255, 255, 255]);
      expect(
        perspectiveBlocked.pixel[0],
        'perspective depth reconstruction preserves contact visibility'
      ).toBeLessThan(perspectiveClear.pixel[0] - 20);
      const final = await render(false);
      expect(final.pixel).toEqual(clear.pixel);
      const oldMask = final.mask;
      surfaces.resize({width: 32, height: 32});
      surfaces.render({drawSurfaces: target => ground.draw(target.renderPass)});
      const resized = contacts.render({
        depthTexture: surfaces.depthTexture,
        normalTexture: surfaces.normalTexture,
        projectionMatrix: projection,
        lightDirectionView: [0.7, 0.4, 0.6],
        maxDistance: 1,
        normalBias: 0.01
      });
      device.submit();
      expect(resized.width).toBe(32);
      expect(resized.height).toBe(32);
      expect(oldMask.destroyed).toBe(true);
      contacts.destroy();
      contacts.destroy();
      expect(resized.destroyed).toBe(true);
      expect(surfaces.normalTexture.destroyed).toBe(false);
      expect(surfaces.depthTexture.destroyed).toBe(false);
    } finally {
      vi.restoreAllMocks();
      contacts.destroy();
      ground.destroy();
      blocker.destroy();
      material.destroy();
      surfaces.destroy();
      readback.destroy();
    }
  });

  test(`PBR contact shadows preserve other lights and indirect energy (${getDevice.name})`, async context => {
    const device = await getDevice();
    if (!device) return context.skip('No rendering device');
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
        emissiveFactor: [0.02, 0.01, 0.005],
        IBLenabled: true
      }
    });
    const source = device.createTexture({width: 4, height: 2, data: new Uint8Array(32).fill(64)});
    const environment = createPrefilteredEnvironment(device, {
      source,
      size: 4,
      sampleCount: 8,
      format: 'rgba8unorm'
    });
    const mask = device.createTexture({width: 1, height: 1, data: new Uint8Array([0, 0, 0, 255])});
    const model = createPBRModel(device, {
      geometry,
      material,
      receiveContactShadows: true,
      defines: {USE_LIGHTS: true, USE_IBL: true, USE_SCENE_ENVIRONMENT: true, USE_TEX_LOD: true},
      bindings: getPBREnvironmentBindings(environment.textures),
      colorAttachmentFormats: ['rgba8unorm'],
      parameters: {depthWriteEnabled: false, cullMode: 'none'}
    });
    model.shaderInputs.setProps({
      pbrContactShadow: {contactShadowTexture: mask, viewport: [0, 0, 16, 16]},
      pbrScene: getPBREnvironmentUniforms(environment.textures)
    });
    const color = device.createTexture({
      width: 16,
      height: 16,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [color]});
    const readback = device.createBuffer({
      byteLength: 256,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const first = {
      type: 'directional' as const,
      direction: [0, 0, -1] as [number, number, number],
      color: [1, 0, 0] as [number, number, number]
    };
    const remaining = [
      {
        type: 'directional' as const,
        direction: [0, 0, -1] as [number, number, number],
        color: [0, 1, 0] as [number, number, number]
      },
      {
        type: 'point' as const,
        position: [0, 0, 2] as [number, number, number],
        color: [0, 0, 1] as [number, number, number],
        attenuation: [1, 0, 0] as [number, number, number]
      },
      {type: 'ambient' as const, color: [0.1, 0.1, 0.1] as [number, number, number]}
    ];
    async function read(enabled: boolean, withFirst: boolean, targetModel: Model = model) {
      targetModel.shaderInputs.setProps({
        pbrContactShadow: {enabled},
        lighting: {useByteColors: false, lights: withFirst ? [first, ...remaining] : remaining}
      });
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
      pass.setParameters({viewport: [0, 0, 16, 16]});
      targetModel.draw(pass);
      pass.end();
      device.submit();
      color.readBuffer({x: 8, y: 8, width: 1, height: 1}, readback);
      device.submit();
      return Array.from((await readback.readAsync()).slice(0, 4));
    }
    try {
      const shadowed = await read(true, true);
      const baseline = await read(false, false);
      for (let channel = 0; channel < 4; channel++)
        expect(Math.abs(shadowed[channel] - baseline[channel])).toBeLessThanOrEqual(1);
      const lit = await read(false, true);
      expect(lit[0]).toBeGreaterThan(shadowed[0] + 20);
      expect(shadowed[1]).toBeGreaterThan(20);
      expect(shadowed[2]).toBeGreaterThan(20);
      const shadowMaps = new ShadowMapRenderer(device, {
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
      const combined = createPBRModel(device, {
        geometry,
        material,
        receiveShadows: true,
        receiveContactShadows: true,
        defines: {USE_LIGHTS: true, USE_IBL: true, USE_SCENE_ENVIRONMENT: true, USE_TEX_LOD: true},
        bindings: getPBREnvironmentBindings(environment.textures),
        colorAttachmentFormats: ['rgba8unorm'],
        parameters: {depthWriteEnabled: false, cullMode: 'none'}
      });
      try {
        const view = new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0]});
        const projection = new Matrix4().ortho({
          left: -1,
          right: 1,
          bottom: -1,
          top: 1,
          near: 0.1,
          far: 10
        });
        const props = shadowMaps.render({
          camera: {viewMatrix: view, projectionMatrix: projection, near: 0.1, far: 10},
          directionalLights: [
            {
              direction: [0, 0, 1],
              strength: 0.5,
              shadowDistance: 9,
              normalBias: 0,
              sourceAngularRadius: 0
            }
          ],
          drawShadowCasters: target => caster.draw(target.renderPass)
        });
        device.submit();
        mask.writeData(new Uint8Array([128, 128, 128, 255]));
        combined.shaderInputs.setProps({
          shadow: props,
          pbrShadow: {viewMatrix: view},
          pbrContactShadow: {contactShadowTexture: mask, viewport: [0, 0, 16, 16]},
          pbrScene: getPBREnvironmentUniforms(environment.textures)
        });
        const combinedPixel = await read(true, true, combined);
        const mappedPixel = await read(false, true, combined);
        for (let channel = 0; channel < 4; channel++)
          expect(
            Math.abs(combinedPixel[channel] - mappedPixel[channel]),
            'overlapping half-visible masks use minimum rather than multiply'
          ).toBeLessThanOrEqual(1);
      } finally {
        combined.destroy();
        caster.destroy();
        shadowMaps.destroy();
      }
    } finally {
      model.destroy();
      material.destroy();
      environment.destroy();
      source.destroy();
      mask.destroy();
      readback.destroy();
      framebuffer.destroy();
      color.destroy();
    }
  });
}
