// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeShaderBlockLayout} from '@luma.gl/core';
import {
  aBuffer,
  emissiveMaterial,
  emissiveMaterialPlugin,
  glassMaterial,
  glassMaterialPlugin,
  MAX_OPTICAL_POINT_LIGHTS,
  opticalLighting,
  type OpticalPointLight,
  opticalPointLights,
  opticalPointLightsPlugin,
  reflectiveMaterial,
  reflectiveMaterialPlugin,
  wboit
} from '@luma.gl/experimental';
import {getShaderModuleUniformLayoutValidationResult, ShaderAssembler} from '@luma.gl/shadertools';
import {WgslReflect} from 'wgsl_reflect';

const PLATFORM_INFO = {
  type: 'webgpu' as const,
  shaderLanguage: 'wgsl' as const,
  shaderLanguageVersion: 300 as const,
  gpu: 'test',
  features: new Set<string>()
};

const GLSL_PLATFORM_INFO = {
  type: 'webgl' as const,
  shaderLanguage: 'glsl' as const,
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

const ILLUMINATED_OPTICAL_MATERIAL_SHADER = OPTICAL_MATERIAL_SHADER.replace(
  'glassMaterial_getColor(',
  'glassMaterial_getIlluminatedColor('
)
  .replace('reflectiveMaterial_getColor(', 'reflectiveMaterial_getIlluminatedColor(')
  .replace(
    '  return mix(glassColor, reflectedColor, 0.25);',
    `  let emittedColor = emissiveMaterial_getColor(
    normal,
    inputs.worldPosition,
    vec4<f32>(1.0, 0.2, 0.1, 1.0),
    cameraPosition
  );
  let pointLightColor = opticalPointLights_getColor(
    normal,
    inputs.worldPosition,
    cameraPosition
  );
  return mix(glassColor, reflectedColor, 0.25) + emittedColor * 0.2 +
    vec4<f32>(pointLightColor, 0.0);`
  );

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
  testCase.equal(
    emissiveMaterialPlugin.name,
    'emissiveMaterial',
    'emissive plugin has a stable name'
  );
  testCase.deepEqual(
    emissiveMaterialPlugin.modules,
    [emissiveMaterial],
    'emissive plugin installs emissive shading'
  );
  testCase.equal(
    opticalPointLightsPlugin.name,
    'opticalPointLights',
    'point-light plugin has a stable name'
  );
  testCase.deepEqual(
    opticalPointLightsPlugin.modules,
    [opticalPointLights],
    'point-light plugin installs local lighting explicitly'
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
  testCase.deepEqual(
    emissiveMaterial.dependencies,
    [opticalLighting],
    'emissive shading reuses shared optical lighting'
  );
  testCase.deepEqual(
    opticalPointLights.dependencies,
    [opticalLighting],
    'point-light shading reuses shared optical lighting'
  );
  testCase.equal(MAX_OPTICAL_POINT_LIGHTS, 16, 'point lights have a portable fixed capacity');
  testCase.match(opticalLighting.source, /fn opticalLighting_getFresnel/, 'WGSL helpers exist');
  testCase.match(opticalLighting.fs, /float opticalLighting_getFresnel/, 'GLSL helpers exist');
  testCase.match(emissiveMaterial.source, /fn emissiveMaterial_getColor/, 'WGSL emission exists');
  testCase.match(emissiveMaterial.fs, /vec4 emissiveMaterial_getColor/, 'GLSL emission exists');
  testCase.match(
    opticalPointLights.source,
    /fn opticalPointLights_getColor/,
    'WGSL point-light helper exists'
  );
  testCase.match(
    opticalPointLights.fs,
    /vec3 opticalPointLights_getColor/,
    'GLSL point-light helper exists'
  );
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

  const initialEmissiveUniforms = emissiveMaterial.getUniforms({});
  testCase.deepEqual(
    initialEmissiveUniforms,
    {intensity: 1, rimStrength: 0.35},
    'emissive uniforms expose stable defaults'
  );

  const updatedEmissiveUniforms = emissiveMaterial.getUniforms(
    {intensity: 2.5},
    initialEmissiveUniforms
  );
  testCase.equal(updatedEmissiveUniforms.intensity, 2.5, 'emissive intensity updates');
  testCase.equal(updatedEmissiveUniforms.rimStrength, 0.35, 'emissive rim strength is retained');
  testCase.end();
});

test('reflective materials follow the reflected view direction and preserve opaque alpha', testCase => {
  testCase.match(
    reflectiveMaterial.source,
    /let reflectionDirection = reflect\(-viewDirection, normalFacingCamera\);/,
    'WGSL environment reflections follow the camera-reflected view ray'
  );
  testCase.match(
    reflectiveMaterial.fs,
    /vec3 reflectionDirection = reflect\(-viewDirection, normalFacingCamera\);/,
    'GLSL environment reflections follow the camera-reflected view ray'
  );
  testCase.match(
    reflectiveMaterial.source,
    /opticalLighting_sampleEnvironment\(\s*reflectionDirection,/,
    'WGSL samples the environment along the reflected ray'
  );
  testCase.match(
    reflectiveMaterial.fs,
    /opticalLighting_sampleEnvironment\(\s*reflectionDirection,/,
    'GLSL samples the environment along the reflected ray'
  );
  testCase.match(
    reflectiveMaterial.source,
    /let opacity = clamp\([\s\S]*?0\.0,\s*1\.0\s*\);/,
    'WGSL reflective opacity supports the complete zero-to-one alpha range'
  );
  testCase.match(
    reflectiveMaterial.fs,
    /float opacity = clamp\([\s\S]*?0\.0,\s*1\.0\s*\);/,
    'GLSL reflective opacity supports the complete zero-to-one alpha range'
  );
  testCase.end();
});

test('optical point lights pack and retain a bounded portable uniform array', testCase => {
  const initialUniforms = opticalPointLights.getUniforms({});
  testCase.equal(initialUniforms.lightCount, 0, 'point lights start disabled');
  testCase.equal(initialUniforms.intensity, 1, 'point lights expose a stable global intensity');
  testCase.equal(
    initialUniforms.lights.length,
    MAX_OPTICAL_POINT_LIGHTS,
    'default lights occupy every fixed uniform slot'
  );
  testCase.ok(
    initialUniforms.lights.every(light => light.intensity === 0),
    'unused light slots do not illuminate existing materials'
  );

  const suppliedLights = Array.from(
    {length: MAX_OPTICAL_POINT_LIGHTS + 2},
    (_, lightIndex): OpticalPointLight => ({
      position: [lightIndex, lightIndex + 1, lightIndex + 2],
      color: [1, lightIndex % 2, 0],
      ...(lightIndex === 1 ? {intensity: 2.5, radius: 3.5} : {})
    })
  );
  const packedUniforms = opticalPointLights.getUniforms({lights: suppliedLights, intensity: 0.6});

  testCase.equal(
    packedUniforms.lightCount,
    MAX_OPTICAL_POINT_LIGHTS,
    'additional lights beyond the fixed capacity are ignored'
  );
  testCase.equal(packedUniforms.intensity, 0.6, 'global intensity is configurable');
  testCase.deepEqual(
    packedUniforms.lights[0],
    {position: [0, 1, 2], radius: 1, color: [1, 0, 0], intensity: 1},
    'point-light defaults are packed in portable field order'
  );
  testCase.deepEqual(
    packedUniforms.lights[1],
    {position: [1, 2, 3], radius: 3.5, color: [1, 1, 0], intensity: 2.5},
    'per-light radius and intensity are preserved'
  );

  const updatedUniforms = opticalPointLights.getUniforms({intensity: 1.4}, packedUniforms);
  testCase.equal(updatedUniforms.intensity, 1.4, 'global intensity updates independently');
  testCase.equal(updatedUniforms.lightCount, 16, 'partial updates preserve active lights');
  testCase.equal(updatedUniforms.lights, packedUniforms.lights, 'packed light arrays are reused');

  const clearedUniforms = opticalPointLights.getUniforms({lights: []}, updatedUniforms);
  testCase.equal(clearedUniforms.lightCount, 0, 'an explicit empty light list clears illumination');
  testCase.ok(
    clearedUniforms.lights.every(light => light.intensity === 0),
    'cleared light slots are reset'
  );
  testCase.end();
});

test('optical materials expose matching WGSL and GLSL uniform layouts', testCase => {
  for (const shaderModule of [emissiveMaterial, opticalPointLights]) {
    const wgslValidation = getShaderModuleUniformLayoutValidationResult(shaderModule, 'wgsl');
    const fragmentValidation = getShaderModuleUniformLayoutValidationResult(
      shaderModule,
      'fragment'
    );

    testCase.ok(wgslValidation?.matches, `${shaderModule.name} WGSL uniform layout matches`);
    testCase.ok(fragmentValidation?.matches, `${shaderModule.name} GLSL uniform layout matches`);
  }

  const shaderBlockLayout = makeShaderBlockLayout(opticalPointLights.uniformTypes);
  const shaderBlockFieldNames = Object.keys(shaderBlockLayout.fields);
  testCase.equal(shaderBlockLayout.byteLength, 528, '16 structured lights occupy 528 bytes');
  testCase.deepEqual(
    shaderBlockFieldNames.slice(0, 6),
    [
      'lightCount',
      'intensity',
      'lights[0].position',
      'lights[0].radius',
      'lights[0].color',
      'lights[0].intensity'
    ],
    'uniform block keeps its explicit count and structured light field order'
  );
  testCase.deepEqual(
    shaderBlockFieldNames.slice(-4),
    ['lights[15].position', 'lights[15].radius', 'lights[15].color', 'lights[15].intensity'],
    'uniform block includes the final fixed-capacity light'
  );
  testCase.end();
});

test('existing optical materials compose without the optional point-light module', testCase => {
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
  testCase.notOk(
    resources.some(resource => resource.name === 'opticalPointLights'),
    'existing glass and reflective plugins do not install optional point lights'
  );
  testCase.notOk(
    /fn glassMaterial_getIlluminatedColor/.test(assembledShader.source),
    'illuminated glass is omitted until the light plugin is installed'
  );
  testCase.notOk(
    /fn reflectiveMaterial_getIlluminatedColor/.test(assembledShader.source),
    'illuminated reflections are omitted until the light plugin is installed'
  );
  testCase.match(assembledShader.source, /fn aBuffer_captureStraightColor/, 'A-buffer composes');
  testCase.match(
    assembledShader.source,
    /fn wboit_captureStraightColor/,
    'weighted-blended OIT composes'
  );
  testCase.end();
});

test('illuminated optical materials compose once with emission and transparency', testCase => {
  const assembler = new ShaderAssembler();
  const assembledShader = assembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: ILLUMINATED_OPTICAL_MATERIAL_SHADER,
    modules: [
      glassMaterial,
      reflectiveMaterial,
      emissiveMaterial,
      opticalPointLights,
      aBuffer,
      wboit
    ]
  });
  const reflectedShader = new WgslReflect(assembledShader.source);

  testCase.equal(
    assembledShader.source.match(/fn opticalLighting_getFresnel\(/g)?.length,
    1,
    'shared optical-lighting helpers remain deduplicated'
  );
  testCase.equal(
    assembledShader.source.match(/fn opticalPointLights_getColor\(/g)?.length,
    1,
    'point-light helper is emitted once'
  );
  testCase.match(
    assembledShader.source,
    /fn glassMaterial_getIlluminatedColor/,
    'illuminated glass helper is enabled'
  );
  testCase.match(
    assembledShader.source,
    /fn reflectiveMaterial_getIlluminatedColor/,
    'illuminated reflective helper is enabled'
  );
  testCase.match(
    assembledShader.source,
    /fn emissiveMaterial_getColor/,
    'emissive helper composes with optical materials'
  );
  testCase.match(
    assembledShader.source,
    /lights: array<OpticalPointLightUniform, 16>/,
    'WGSL exposes a fixed 16-light uniform array'
  );
  testCase.ok(
    reflectedShader.uniforms.some(resource => resource.name === 'opticalPointLights'),
    'point-light uniforms are reflected'
  );
  testCase.ok(
    reflectedShader.uniforms.some(resource => resource.name === 'emissiveMaterial'),
    'emissive material uniforms are reflected'
  );
  testCase.end();
});

test('illuminated optical helpers assemble for GLSL', testCase => {
  const assembler = new ShaderAssembler();
  const assembledShader = assembler.assembleGLSLShaderPair({
    platformInfo: GLSL_PLATFORM_INFO,
    vs: `#version 300 es
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`,
    fs: `#version 300 es
precision highp float;
out vec4 fragmentColor;
void main(void) {
  vec3 normal = vec3(0.0, 1.0, 0.0);
  vec3 worldPosition = vec3(0.0);
  vec3 cameraPosition = vec3(0.0, 2.0, 4.0);
  vec4 baseColor = vec4(0.4, 0.6, 0.9, 0.5);
  vec4 glassColor = glassMaterial_getIlluminatedColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition,
    gl_FragCoord
  );
  vec4 reflectedColor = reflectiveMaterial_getIlluminatedColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition
  );
  fragmentColor = mix(glassColor, reflectedColor, 0.25) +
    emissiveMaterial_getColor(normal, worldPosition, baseColor, cameraPosition);
}
`,
    modules: [glassMaterial, reflectiveMaterial, emissiveMaterial, opticalPointLights]
  });

  testCase.match(
    assembledShader.fs,
    /OpticalPointLightUniform lights\[16\]/,
    'GLSL exposes a fixed 16-light uniform array'
  );
  testCase.match(
    assembledShader.fs,
    /vec4 glassMaterial_getIlluminatedColor/,
    'GLSL illuminated glass composes'
  );
  testCase.match(
    assembledShader.fs,
    /vec4 reflectiveMaterial_getIlluminatedColor/,
    'GLSL illuminated reflections compose'
  );
  testCase.match(assembledShader.fs, /vec4 emissiveMaterial_getColor/, 'GLSL emission composes');
  testCase.end();
});
