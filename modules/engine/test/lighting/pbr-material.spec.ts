// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {ClipSpace, ShaderInputs} from '@luma.gl/engine';
import {
  createPBRMaterial,
  createPBRMaterialFactory,
  createPrefilteredEnvironment,
  getPBREnvironmentBindings,
  getPBREnvironmentUniforms
} from '@luma.gl/engine/lighting';
import {pbrMaterial, pbrScene} from '@luma.gl/shaders';

test('shared PBR materials and environment bindings render on both backends', async context => {
  const webglDevice = await getWebGLTestDevice();
  const devices = [...(await getTestDevices(['webgpu'])), ...(webglDevice ? [webglDevice] : [])];
  if (!devices.length) return context.skip('No rendering device');
  for (const device of devices) {
    const source = device.createTexture({
      width: 2,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255])
    });
    const environment = createPrefilteredEnvironment(device, {
      source,
      format: 'rgba8unorm',
      size: 2,
      irradianceSize: 2,
      brdfLUTSize: 2,
      sampleCount: 8
    });
    const factory = createPBRMaterialFactory(device);
    const materials = [
      createPBRMaterial(device, {factory, uniforms: {baseColorFactor: [1, 0, 0, 1]}}),
      createPBRMaterial(device, {factory, uniforms: {baseColorFactor: [0, 1, 0, 1]}})
    ];
    const target = device.createTexture({
      width: 4,
      height: 4,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [target]});
    const readback = device.createBuffer({
      byteLength: 1024,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    const models = materials.map(
      material =>
        new ClipSpace(device, {
          material,
          colorAttachmentFormats: ['rgba8unorm'],
          modules: [pbrMaterial, pbrScene],
          shaderInputs: new ShaderInputs({pbrMaterial, pbrScene}),
          defines: {USE_IBL: true},
          bindings: getPBREnvironmentBindings(environment.textures),
          parameters: {depthWriteEnabled: false},
          source: `@fragment fn fragmentMain() -> @location(0) vec4f {
        let light = textureSample(pbr_diffuseEnvSampler, pbr_diffuseEnvSamplerSampler, vec3f(0, 0, 1)).rgb;
        return vec4f(pbrMaterial.baseColorFactor.rgb * light * pbrScene.environmentIntensity, 1);
      }`,
          fs: `#version 300 es
      out vec4 fragmentColor;
      void main() {
        vec3 light = texture(pbr_diffuseEnvSampler, vec3(0, 0, 1)).rgb;
        fragmentColor = vec4(pbrMaterial.baseColorFactor.rgb * light * pbrScene.environmentIntensity, 1);
      }`
        })
    );
    try {
      for (const [index, model] of models.entries()) {
        model.shaderInputs.setProps({
          pbrScene: getPBREnvironmentUniforms({...environment.textures, intensity: 0.5})
        });
        const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
        model.draw(pass);
        pass.end();
        device.submit();
        target.readBuffer({width: 1, height: 1}, readback);
        const pixels = await readback.readAsync();
        expect(pixels[index], device.type).toBeGreaterThan(120);
        expect(pixels[1 - index], device.type).toBeLessThan(3);
      }
      models[0].destroy();
      materials[0].destroy();
      expect(environment.textures.diffuseTexture.destroyed).toBe(false);
      expect(materials[1].factory).toBe(factory);
    } finally {
      for (const model of models) model.destroy();
      for (const material of materials) material.destroy();
      readback.destroy();
      framebuffer.destroy();
      target.destroy();
      environment.destroy();
      source.destroy();
    }
  }
});

test('loaded environment uploads resolve complete borrowed cubemaps and specular mips', async context => {
  const {loadPBREnvironment, resolveLoadedPBREnvironment} = await import('@luma.gl/engine/gltf');
  const webglDevice = await getWebGLTestDevice();
  const devices = [...(await getTestDevices(['webgpu'])), ...(webglDevice ? [webglDevice] : [])];
  if (!devices.length) return context.skip('No rendering device');
  for (const device of devices) {
    const loaded = loadPBREnvironment(device, {
      brdfLutUrl: 'lookup',
      getTexUrl: (name, face, level) => `${name}-${face}-${level}`,
      specularMipLevels: 2,
      loadImage: async url => {
        const width = url.endsWith('-1') ? 1 : 2;
        return new ImageData(new Uint8ClampedArray(width * width * 4).fill(255), width, width);
      }
    });
    try {
      const environment = await resolveLoadedPBREnvironment(loaded);
      expect(environment.specularTexture.mipLevels, device.type).toBe(2);
      expect(loaded.specularEnvSampler.sampler.props.mipmapFilter).toBe('linear');
      expect(getPBREnvironmentUniforms(environment).environmentMipCount).toBe(2);
      expect(getPBREnvironmentBindings(environment).pbr_diffuseEnvSampler).toBe(
        loaded.diffuseEnvSampler.texture
      );
    } finally {
      loaded.diffuseEnvSampler.destroy();
      loaded.specularEnvSampler.destroy();
      loaded.brdfLutTexture.destroy();
    }
  }
});
