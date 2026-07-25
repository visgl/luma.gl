// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  aBuffer,
  glassMaterial,
  glassMaterialPlugin,
  opticalLighting,
  reflectiveMaterial,
  reflectiveMaterialPlugin,
  wboit
} from '@luma.gl/experimental';
import {ShaderAssembler} from '@luma.gl/shadertools';
import {WgslReflect} from 'wgsl_reflect';

const PLATFORM_INFO = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300 as const,
  gpu: 'test',
  features: new Set<string>()
};

const OPTICAL_MATERIAL_SHADER = /* wgsl */ `\
struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPosition: vec3<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutputs {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  var outputs: VertexOutputs;
  outputs.position = vec4<f32>(positions[vertexIndex], 0.5, 1.0);
  outputs.worldPosition = vec3<f32>(0.0);
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let normal = vec3<f32>(0.0, 1.0, 0.0);
  let cameraPosition = vec3<f32>(0.0, 2.0, 4.0);
  let glassColor = glassMaterial_getColor(
    normal,
    inputs.worldPosition,
    vec4<f32>(0.4, 0.6, 0.9, 0.5),
    cameraPosition,
    inputs.position
  );
  let reflectedColor = reflectiveMaterial_getColor(
    normal,
    inputs.worldPosition,
    vec4<f32>(0.2, 0.4, 0.8, 0.6),
    cameraPosition
  );
  return mix(glassColor, reflectedColor, 0.25);
}
`;

test('optical material modules expose portable shared shader helpers', testCase => {
  testCase.equal(glassMaterialPlugin.name, 'glassMaterial', 'glass plugin has a stable name');
  testCase.deepEqual(glassMaterialPlugin.modules, [glassMaterial], 'glass plugin installs glass');
  testCase.equal(
    reflectiveMaterialPlugin.name,
    'reflectiveMaterial',
    'reflective plugin has a stable name'
  );
  testCase.deepEqual(
    reflectiveMaterialPlugin.modules,
    [reflectiveMaterial],
    'reflective plugin installs reflective shading'
  );
  testCase.deepEqual(
    glassMaterial.dependencies,
    [opticalLighting],
    'glass reuses shared optical lighting'
  );
  testCase.deepEqual(
    reflectiveMaterial.dependencies,
    [opticalLighting],
    'reflective shading reuses shared optical lighting'
  );
  testCase.match(opticalLighting.source, /fn opticalLighting_getFresnel/, 'WGSL helpers exist');
  testCase.match(opticalLighting.fs, /float opticalLighting_getFresnel/, 'GLSL helpers exist');
  testCase.end();
});

test('optical materials retain defaults while applying partial updates', testCase => {
  const initialGlassUniforms = glassMaterial.getUniforms({});
  testCase.deepEqual(
    initialGlassUniforms,
    {
      viewportSize: [1, 1],
      indexOfRefraction: 1.48,
      roughness: 0.14,
      dispersion: 0.022,
      thickness: 1.05,
      reflectionStrength: 1
    },
    'glass uniforms expose stable defaults'
  );

  const updatedGlassUniforms = glassMaterial.getUniforms(
    {indexOfRefraction: 1.6, thickness: 1.8},
    initialGlassUniforms
  );
  testCase.equal(updatedGlassUniforms.indexOfRefraction, 1.6, 'glass refraction updates');
  testCase.equal(updatedGlassUniforms.thickness, 1.8, 'glass thickness updates');
  testCase.equal(updatedGlassUniforms.roughness, 0.14, 'glass roughness is retained');

  const initialReflectiveUniforms = reflectiveMaterial.getUniforms({});
  testCase.deepEqual(
    initialReflectiveUniforms,
    {roughness: 0.62, reflectionStrength: 0.32, specularStrength: 0.42, opacityScale: 1},
    'reflective uniforms expose stable defaults'
  );

  const updatedReflectiveUniforms = reflectiveMaterial.getUniforms(
    {roughness: 0.35, opacityScale: 0.5},
    initialReflectiveUniforms
  );
  testCase.equal(updatedReflectiveUniforms.roughness, 0.35, 'reflective roughness updates');
  testCase.equal(updatedReflectiveUniforms.opacityScale, 0.5, 'reflective opacity updates');
  testCase.equal(
    updatedReflectiveUniforms.specularStrength,
    0.42,
    'reflective specular strength is retained'
  );
  testCase.end();
});

test('optical materials compose once with both transparency modules', testCase => {
  const assembler = new ShaderAssembler();
  const assembledShader = assembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: OPTICAL_MATERIAL_SHADER,
    modules: [glassMaterial, reflectiveMaterial, aBuffer, wboit]
  });
  const reflectedShader = new WgslReflect(assembledShader.source);
  const resources = [
    ...reflectedShader.uniforms,
    ...reflectedShader.textures,
    ...reflectedShader.samplers
  ];

  testCase.equal(
    assembledShader.source.match(/fn opticalLighting_getFresnel\(/g)?.length,
    1,
    'shared Fresnel helpers are emitted once'
  );
  testCase.ok(
    resources.some(resource => resource.name === 'glassSceneColorTexture'),
    'glass scene-color texture is reflected'
  );
  testCase.ok(
    resources.some(resource => resource.name === 'glassSceneColorTextureSampler'),
    'glass scene-color sampler is reflected'
  );
  testCase.ok(
    resources.some(resource => resource.name === 'glassMaterial'),
    'glass material uniforms are reflected'
  );
  testCase.ok(
    resources.some(resource => resource.name === 'reflectiveMaterial'),
    'reflective material uniforms are reflected'
  );
  testCase.match(assembledShader.source, /fn aBuffer_captureStraightColor/, 'A-buffer composes');
  testCase.match(
    assembledShader.source,
    /fn wboit_captureStraightColor/,
    'weighted-blended OIT composes'
  );
  testCase.end();
});
