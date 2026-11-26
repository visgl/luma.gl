// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  WGSLShaderAssembler,
  pbrMaterial,
  pbrScene,
  pbrShadow,
  pbrContactShadow,
  contactShadowTrace,
  contactShadowBilateralBlur,
  contactShadowComposite
} from '@luma.gl/shaders';
import {
  createContactShadowCompositeShaderPass,
  PBR_MODEL_WGSL_SHADER
} from '@luma.gl/engine/lighting';
import {getFragmentShaderForRenderPass} from '../../src/passes/get-fragment-shader';
import {textureTransform} from '../../src/passes/texture-transform-module';
import {
  contactShadowTrace as compatibleTrace,
  createContactShadowCompositeShaderPass as compatibleComposite
} from '../../../anari/src/shadows/contact-shadow';

const platformInfo = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300,
  gpu: 'test',
  features: new Set<string>()
};
const vertex = `struct FragmentInputs {@builtin(position) Position:vec4f,@location(0) coordinate:vec2f};
@vertex fn vertexMain(@builtin(vertex_index) index:u32)->FragmentInputs {var result:FragmentInputs;result.Position=vec4f(0,0,0,1);result.coordinate=vec2f(0.5);return result;}`;

test('contact trace, blur and separated-light composite reflect portable bindings', () => {
  for (const shaderPass of [
    contactShadowTrace,
    contactShadowBilateralBlur,
    contactShadowComposite
  ]) {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo,
      source:
        vertex +
        getFragmentShaderForRenderPass({shaderPass, action: 'sample', shadingLanguage: 'wgsl'}),
      modules: [shaderPass, textureTransform]
    });
    expect(shader.shaderLayout?.bindings?.length).toBeGreaterThan(2);
    expect(shaderPass.fs).toContain(`${shaderPass.name}_sampleColor`);
  }
  expect(compatibleTrace).toBe(contactShadowTrace);
  expect(compatibleComposite).toBe(createContactShadowCompositeShaderPass);
});

test('PBR contact receiving compiles alone and with ordinary shadow maps', () => {
  for (const receiveShadows of [false, true]) {
    const shader = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo,
      source: PBR_MODEL_WGSL_SHADER,
      modules: [pbrScene, pbrMaterial, pbrContactShadow, ...(receiveShadows ? [pbrShadow] : [])],
      defines: {
        HAS_NORMALS: true,
        PBR_RECEIVE_CONTACT_SHADOWS: true,
        PBR_RECEIVE_SHADOWS: receiveShadows,
        USE_LIGHTS: true
      }
    });
    expect(
      shader.shaderLayout?.bindings?.some(binding => binding.name === 'contactShadowTexture')
    ).toBe(true);
  }
});
