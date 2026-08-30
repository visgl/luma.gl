// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {makeShaderBlockLayout} from '@luma.gl/core';
import {
  aBuffer,
  emissiveMaterial,
  emissiveMaterialPlugin,
  glassMaterial,
  glassMaterialPlugin,
  glassTransmission,
  glassTransmissionPlugin,
  MAX_OPTICAL_CAUSTIC_LENSES,
  MAX_OPTICAL_POINT_LIGHTS,
  type OpticalCausticLens,
  opticalCaustics,
  opticalCausticsPlugin,
  opticalLighting,
  type OpticalPointLight,
  opticalPointLights,
  opticalPointLightsPlugin,
  reflectiveMaterial,
  reflectiveMaterialPlugin,
  wboit
} from '@luma.gl/experimental';
import {
  getShaderModuleUniformLayoutValidationResult,
  GLSLShaderAssembler,
  WGSLShaderAssembler
} from '@luma.gl/shadertools';
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
  let causticColor = opticalCaustics_getColor(
    normal,
    inputs.worldPosition,
    cameraPosition
  );
  let trailColor = emissiveMaterial_getTrailColor(
    normal,
    inputs.worldPosition,
    vec4<f32>(0.2, 1.0, 0.1, 0.5),
    cameraPosition,
    0.65,
    0.5
  );
  return mix(glassColor, reflectedColor, 0.25) + emittedColor * 0.2 + trailColor * 0.1 +
    vec4<f32>(pointLightColor + causticColor, 0.0);`
  );

test('optical material modules expose portable shared shader helpers', testCase => {
  testCase.equal(glassMaterialPlugin.name, 'glassMaterial', 'glass plugin has a stable name');
  testCase.deepEqual(glassMaterialPlugin.modules, [glassMaterial], 'glass plugin installs glass');
  testCase.equal(
    glassTransmissionPlugin.name,
    'glassTransmission',
    'rasterized transmission plugin has a stable name'
  );
  testCase.deepEqual(
    glassTransmissionPlugin.modules,
    [glassTransmission],
    'rasterized transmission plugin installs its optional extension'
  );
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
  testCase.equal(
    opticalCausticsPlugin.name,
    'opticalCaustics',
    'caustic-lens plugin has a stable name'
  );
  testCase.deepEqual(
    opticalCausticsPlugin.modules,
    [opticalCaustics],
    'caustic-lens plugin installs focused lighting explicitly'
  );
  testCase.deepEqual(
    glassMaterial.dependencies,
    [opticalLighting],
    'glass reuses shared optical lighting'
  );
  testCase.deepEqual(
    glassTransmission.dependencies,
    [glassMaterial],
    'rasterized transmission composes the existing glass material'
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
  testCase.deepEqual(
    opticalCaustics.dependencies,
    [opticalLighting],
    'caustic shading reuses shared optical lighting'
  );
  testCase.equal(MAX_OPTICAL_POINT_LIGHTS, 16, 'point lights have a portable fixed capacity');
  testCase.equal(MAX_OPTICAL_CAUSTIC_LENSES, 8, 'focusing lenses have a portable fixed capacity');
  testCase.match(opticalLighting.source, /fn opticalLighting_getFresnel/, 'WGSL helpers exist');
  testCase.match(opticalLighting.fs, /float opticalLighting_getFresnel/, 'GLSL helpers exist');
  testCase.match(
    opticalLighting.source,
    /fn opticalLighting_getFilteredRoughness[\s\S]*?dpdx\(normal\)[\s\S]*?dpdy\(normal\)/,
    'WGSL widens subpixel highlights using screen-space normal derivatives'
  );
  testCase.match(
    opticalLighting.fs,
    /float opticalLighting_getFilteredRoughness[\s\S]*?dFdx\(normal\)[\s\S]*?dFdy\(normal\)/,
    'GLSL uses matching geometric specular antialiasing'
  );
  testCase.match(
    opticalLighting.source,
    /fn opticalLighting_getMicrofacetSpecular/,
    'WGSL exposes GGX microfacet highlights'
  );
  testCase.match(
    opticalLighting.fs,
    /float opticalLighting_getMicrofacetSpecular/,
    'GLSL exposes GGX microfacet highlights'
  );
  testCase.match(emissiveMaterial.source, /fn emissiveMaterial_getColor/, 'WGSL emission exists');
  testCase.match(emissiveMaterial.fs, /vec4 emissiveMaterial_getColor/, 'GLSL emission exists');
  testCase.match(
    emissiveMaterial.source,
    /fn emissiveMaterial_getTrailColor/,
    'WGSL directional emission exists'
  );
  testCase.match(
    emissiveMaterial.fs,
    /vec4 emissiveMaterial_getTrailColor/,
    'GLSL directional emission exists'
  );
  testCase.match(
    emissiveMaterial.source,
    /pow\(smoothstep\(0\.0, 1\.0, trailProgress\), 1\.5\)/,
    'WGSL trails fade toward the packet tail'
  );
  testCase.match(
    emissiveMaterial.fs,
    /pow\(smoothstep\(0\.0, 1\.0, trailProgress\), 1\.5\)/,
    'GLSL trails fade toward the packet tail'
  );
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
  testCase.match(
    opticalCaustics.source,
    /fn opticalCaustics_getColor/,
    'WGSL focused-light helper exists'
  );
  testCase.match(
    opticalCaustics.fs,
    /vec3 opticalCaustics_getColor/,
    'GLSL focused-light helper exists'
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
      dispersion: 0.33,
      thickness: 1.05,
      refractionStrength: 1,
      reflectionStrength: 1,
      fresnelStrength: 1,
      clearcoatStrength: 0.7,
      iridescenceStrength: 0.1,
      internalReflectionStrength: 0.42,
      transmissionStrength: 1
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
  testCase.equal(updatedGlassUniforms.refractionStrength, 1, 'lens distortion is retained');
  testCase.equal(updatedGlassUniforms.clearcoatStrength, 0.7, 'glass clearcoat is retained');

  const cinematicGlassUniforms = glassMaterial.getUniforms(
    {fresnelStrength: 1.4, iridescenceStrength: 0.25, transmissionStrength: 1.1},
    updatedGlassUniforms
  );
  testCase.equal(cinematicGlassUniforms.fresnelStrength, 1.4, 'Fresnel edges are configurable');
  testCase.equal(
    cinematicGlassUniforms.iridescenceStrength,
    0.25,
    'spectral edge highlights are configurable'
  );
  testCase.equal(
    cinematicGlassUniforms.transmissionStrength,
    1.1,
    'glass transmission is configurable'
  );
  testCase.equal(
    cinematicGlassUniforms.internalReflectionStrength,
    0.42,
    'internal reflection is retained across partial updates'
  );

  const initialTransmissionUniforms = glassTransmission.getUniforms({});
  testCase.deepEqual(
    initialTransmissionUniforms,
    {
      viewportSize: [1, 1],
      depthRange: [0.1, 100],
      environmentIntensity: 1,
      environmentMipLevels: 1,
      environmentPrefilterStrength: 0,
      thicknessStrength: 1,
      roughTransmissionStrength: 0,
      spectralAbsorptionStrength: 0,
      thinFilmThickness: 0,
      thinFilmStrength: 0,
      volumeScatteringStrength: 0,
      contactShadowStrength: 0,
      depthBias: 0.00008,
      dynamicReflectionStrength: 0,
      secondaryBounceStrength: 0,
      faultDistortionStrength: 0,
      time: 0
    },
    'rasterized transmission exposes stable optical defaults'
  );
  const updatedTransmissionUniforms = glassTransmission.getUniforms(
    {
      environmentIntensity: 1.6,
      environmentMipLevels: 9,
      environmentPrefilterStrength: 0.85,
      contactShadowStrength: 0.4,
      thicknessStrength: 1.25
    },
    initialTransmissionUniforms
  );
  testCase.equal(
    updatedTransmissionUniforms.environmentIntensity,
    1.6,
    'environment reflections remain adjustable'
  );
  testCase.equal(updatedTransmissionUniforms.environmentMipLevels, 9, 'probe mip capacity updates');
  testCase.equal(
    updatedTransmissionUniforms.environmentPrefilterStrength,
    0.85,
    'roughness-selected environment filtering is configurable'
  );
  testCase.equal(
    updatedTransmissionUniforms.contactShadowStrength,
    0.4,
    'opaque-depth contact shadows are configurable'
  );
  testCase.equal(
    updatedTransmissionUniforms.thicknessStrength,
    1.25,
    'backface-derived thickness remains adjustable'
  );
  testCase.equal(
    updatedTransmissionUniforms.depthBias,
    0.00008,
    'foreground-depth tolerance is retained'
  );
  testCase.equal(
    updatedTransmissionUniforms.dynamicReflectionStrength,
    0,
    'dynamic reflections remain opt-in for existing consumers'
  );
  const animatedTransmissionUniforms = glassTransmission.getUniforms(
    {
      dynamicReflectionStrength: 0.45,
      secondaryBounceStrength: 0.7,
      faultDistortionStrength: 0.3,
      roughTransmissionStrength: 0.85,
      spectralAbsorptionStrength: 0.42,
      thinFilmThickness: 420,
      thinFilmStrength: 0.22,
      volumeScatteringStrength: 0.38,
      time: 2.5
    },
    updatedTransmissionUniforms
  );
  testCase.equal(
    animatedTransmissionUniforms.dynamicReflectionStrength,
    0.45,
    'captured-scene reflections are configurable'
  );
  testCase.equal(
    animatedTransmissionUniforms.secondaryBounceStrength,
    0.7,
    'secondary internal reflections are configurable'
  );
  testCase.equal(
    animatedTransmissionUniforms.faultDistortionStrength,
    0.3,
    'fault-driven lens distortion is configurable'
  );
  testCase.equal(
    animatedTransmissionUniforms.roughTransmissionStrength,
    0.85,
    'thickness-aware rough transmission is configurable'
  );
  testCase.equal(
    animatedTransmissionUniforms.spectralAbsorptionStrength,
    0.42,
    'wavelength-dependent volume absorption is configurable'
  );
  testCase.equal(
    animatedTransmissionUniforms.thinFilmThickness,
    420,
    'thin-film coating thickness is configured in nanometers'
  );
  testCase.equal(
    animatedTransmissionUniforms.thinFilmStrength,
    0.22,
    'angular thin-film interference is configurable'
  );
  testCase.equal(
    animatedTransmissionUniforms.volumeScatteringStrength,
    0.38,
    'localized optical volume scattering is configurable'
  );
  testCase.equal(animatedTransmissionUniforms.time, 2.5, 'fault animation accepts a scene clock');
  const retainedOpticalUniforms = glassTransmission.getUniforms(
    {environmentIntensity: 1.8},
    animatedTransmissionUniforms
  );
  testCase.equal(
    retainedOpticalUniforms.roughTransmissionStrength,
    0.85,
    'partial updates preserve rough transmission'
  );
  testCase.equal(
    retainedOpticalUniforms.spectralAbsorptionStrength,
    0.42,
    'partial updates preserve spectral volume absorption'
  );
  testCase.equal(
    retainedOpticalUniforms.thinFilmThickness,
    420,
    'partial updates preserve the coating thickness'
  );
  testCase.equal(
    retainedOpticalUniforms.volumeScatteringStrength,
    0.38,
    'partial updates preserve optical volume scattering'
  );
  testCase.equal(
    retainedOpticalUniforms.environmentMipLevels,
    9,
    'partial updates preserve the prefiltered environment pyramid'
  );
  testCase.equal(
    retainedOpticalUniforms.contactShadowStrength,
    0.4,
    'partial updates preserve contact-shadow strength'
  );

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

test('glass materials compose portable clearcoat, spectral rims, and soft transmission', testCase => {
  for (const [shaderSource, language] of [
    [glassMaterial.source, 'WGSL'],
    [glassMaterial.fs, 'GLSL']
  ] as const) {
    testCase.match(
      shaderSource,
      /glassMaterial_sampleTransmission/,
      `${language} isolates reusable chromatic transmission sampling`
    );
    testCase.match(
      shaderSource,
      /rayDeflection = refractionDirection \+ viewDirection/,
      `${language} distorts the background using the actual refracted ray`
    );
    testCase.match(
      shaderSource,
      /cameraRight/,
      `${language} projects refraction into camera-aligned screen coordinates`
    );
    testCase.match(
      shaderSource,
      /refractionStrength/,
      `${language} exposes adjustable lens distortion`
    );
    testCase.match(
      shaderSource,
      /dispersionHalfSpread = \(indexOfRefraction - 1\.0\) \* 0\.025/,
      `${language} follows glTF's Abbe-number wavelength-dependent index-of-refraction model`
    );
    testCase.match(
      shaderSource,
      /redRefractionDirection = refract/,
      `${language} traces the lower-index red transmission ray`
    );
    testCase.match(
      shaderSource,
      /blueRefractionDirection = refract/,
      `${language} traces the higher-index blue transmission ray`
    );
    testCase.match(
      shaderSource,
      /transmissionCoverage/,
      `${language} preserves displaced background instead of blending it away`
    );
    testCase.match(
      shaderSource,
      /opticalLighting_getMicrofacetSpecular/,
      `${language} shades glass with GGX microfacet highlights`
    );
    testCase.match(
      shaderSource,
      /opticalLighting_getFilteredRoughness/,
      `${language} prevents subpixel GGX highlights from sparkling or clipping`
    );
    testCase.match(shaderSource, /clearcoatStrength/, `${language} supports a clearcoat lobe`);
    testCase.match(
      shaderSource,
      /clearcoatFresnel/,
      `${language} computes the clearcoat's angular dielectric reflectance`
    );
    testCase.match(
      shaderSource,
      /baseLayerEnergy/,
      `${language} attenuates the underlying layer when clearcoat reflects incoming light`
    );
    testCase.match(
      shaderSource,
      /clearcoatEnvironment = environmentColor \* clearcoatFresnel/,
      `${language} restores clearcoat Fresnel energy as environment reflection`
    );
    testCase.match(
      shaderSource,
      /clearcoatReflection = \(clearcoatEnvironment \+ clearcoatSpecular\)/,
      `${language} combines clearcoat environment and direct-light reflections`
    );
    testCase.match(
      shaderSource,
      /clamp\(glassMaterial\.transmissionStrength, 0\.0, 1\.0\)/,
      `${language} prevents transmission from amplifying the captured background`
    );
    testCase.match(
      shaderSource,
      /internalReflectionStrength/,
      `${language} supports internal shell reflection`
    );
    testCase.match(
      shaderSource,
      /iridescenceStrength/,
      `${language} supports restrained spectral rim interference`
    );
    testCase.match(
      shaderSource,
      /softenedTransmission/,
      `${language} softens refraction according to surface roughness`
    );
    testCase.match(
      shaderSource,
      /studioRibbon/,
      `${language} adds camera-responsive studio-light reflections`
    );
    testCase.match(shaderSource, /glassBody/, `${language} retains a visible tinted glass body`);
  }
  testCase.end();
});

test('rasterized glass transmission composes thickness, depth, and environment maps', testCase => {
  for (const [shaderSource, language] of [
    [glassTransmission.source, 'WGSL'],
    [glassTransmission.fs, 'GLSL']
  ] as const) {
    testCase.match(shaderSource, /glassBackfaceTexture/, `${language} samples sphere backfaces`);
    testCase.match(shaderSource, /glassSceneDepthTexture/, `${language} samples opaque depth`);
    testCase.match(
      shaderSource,
      /glassEnvironmentTexture/,
      `${language} samples a studio environment map`
    );
    testCase.match(
      shaderSource,
      /glassTransmission_linearizeDepth/,
      `${language} measures optical thickness in linear view depth`
    );
    testCase.match(shaderSource, /entryDirection = refract/, `${language} refracts at entry`);
    testCase.match(shaderSource, /exitDirection = refract/, `${language} refracts at exit`);
    testCase.match(
      shaderSource,
      /redEntryDirection = refract[\s\S]*?blueEntryDirection = refract/,
      `${language} traces wavelength-dependent rays through the front glass surface`
    );
    testCase.match(
      shaderSource,
      /redExitDirection = refract[\s\S]*?blueExitDirection = refract/,
      `${language} refracts every wavelength again at the rear glass boundary`
    );
    testCase.match(
      shaderSource,
      /baseReflectance = pow\(\(indexOfRefraction - 1\.0\) \/ \(indexOfRefraction \+ 1\.0\), 2\.0\)/,
      `${language} derives dielectric Fresnel reflectance from the configured index of refraction`
    );
    testCase.match(
      shaderSource,
      /transmissionWeight = \(1\.0 - fresnel\)/,
      `${language} reserves reflected energy before transmitting the background`
    );
    testCase.match(
      shaderSource,
      /reflectionWeight = fresnel \* glassMaterial\.reflectionStrength/,
      `${language} weights environment reflections by the same angular Fresnel response`
    );
    testCase.match(
      shaderSource,
      /foregroundOcclusion/,
      `${language} preserves opaque foreground geometry`
    );
    testCase.match(
      shaderSource,
      /hasExitRay/,
      `${language} handles total internal reflection without ray marching`
    );
    testCase.match(
      shaderSource,
      /reflectedSceneColor/,
      `${language} reflects nearby captured-scene objects`
    );
    testCase.match(
      shaderSource,
      /dot\(reflectionDirection,\s*cameraRight\)/,
      `${language} projects dynamic scene reflections along the reflected view ray`
    );
    testCase.match(
      shaderSource,
      /secondaryDirection/,
      `${language} approximates a second internal environment bounce`
    );
    testCase.match(
      shaderSource,
      /faultRipple/,
      `${language} confines animated distortion to warm fault-colored glass`
    );
    testCase.match(
      shaderSource,
      /glassTransmission_sampleRoughTransmission/,
      `${language} filters transmission using optical thickness and surface roughness`
    );
    testCase.match(
      shaderSource,
      /glassTransmission_getSpectralAbsorption/,
      `${language} applies wavelength-dependent volume absorption`
    );
    testCase.match(
      shaderSource,
      /glassTransmission_getThinFilm/,
      `${language} computes angular thin-film interference`
    );
    testCase.match(
      shaderSource,
      /650\.0, 530\.0, 460\.0/,
      `${language} evaluates representative red, green, and blue wavelengths`
    );
    testCase.match(
      shaderSource,
      /volumeLightScattering/,
      `${language} scatters nearby colored lights inside the glass volume`
    );
    testCase.match(
      shaderSource,
      /opticalPointLights_getSpecularColor/,
      `${language} keeps local packet glints as front-surface reflections`
    );
    testCase.match(
      shaderSource,
      /filteredEnvironment/,
      `${language} filters environment reflections for rough optical surfaces`
    );
    testCase.match(
      shaderSource,
      /glassTransmission_sampleEnvironmentAtRoughness/,
      `${language} samples explicit roughness-dependent reflection lobes`
    );
    testCase.match(
      shaderSource,
      /reflectionLevel/,
      `${language} selects initialized studio-environment mip levels`
    );
    testCase.match(
      shaderSource,
      /glassTransmission_getContactShadow/,
      `${language} anchors translucent shells to nearby opaque geometry`
    );
  }
  const glslEnvironmentSampleCalls = [
    ...glassTransmission.fs.matchAll(/(texture(?:Lod)?)\(\s*glassEnvironmentTexture/g)
  ];
  testCase.ok(glslEnvironmentSampleCalls.length > 0, 'GLSL samples the environment texture');
  testCase.ok(
    glslEnvironmentSampleCalls.every(sampleCall => sampleCall[1] === 'textureLod'),
    'GLSL uses explicit mip levels for prefiltered and legacy environment sampling'
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
  testCase.match(
    opticalPointLights.source,
    /softSpecular/,
    'WGSL retains a broader packet reflection lobe on curved glass'
  );
  testCase.match(
    opticalPointLights.fs,
    /softSpecular/,
    'GLSL retains a broader packet reflection lobe on curved glass'
  );
  testCase.end();
});

test('optical caustics pack and retain a bounded portable lens array', testCase => {
  const initialUniforms = opticalCaustics.getUniforms({});
  testCase.equal(initialUniforms.lensCount, 0, 'focusing lenses start disabled');
  testCase.equal(initialUniforms.intensity, 1, 'caustics expose a stable global intensity');
  testCase.equal(initialUniforms.focus, 1, 'caustics expose a stable focus multiplier');
  testCase.equal(
    initialUniforms.lenses.length,
    MAX_OPTICAL_CAUSTIC_LENSES,
    'default lenses occupy every fixed uniform slot'
  );

  const suppliedLenses = Array.from(
    {length: MAX_OPTICAL_CAUSTIC_LENSES + 2},
    (_, lensIndex): OpticalCausticLens => ({
      position: [lensIndex, lensIndex + 1, lensIndex + 2],
      color: [lensIndex % 2, 1, 0],
      ...(lensIndex === 1 ? {intensity: 1.6, radius: 0.45} : {})
    })
  );
  const packedUniforms = opticalCaustics.getUniforms({
    lenses: suppliedLenses,
    intensity: 0.6,
    focus: 1.4
  });

  testCase.equal(
    packedUniforms.lensCount,
    MAX_OPTICAL_CAUSTIC_LENSES,
    'additional lenses beyond the fixed capacity are ignored'
  );
  testCase.equal(packedUniforms.intensity, 0.6, 'global caustic intensity is configurable');
  testCase.equal(packedUniforms.focus, 1.4, 'caustic focus is configurable');
  testCase.deepEqual(
    packedUniforms.lenses[0],
    {position: [0, 1, 2], radius: 1, color: [0, 1, 0], intensity: 1},
    'caustic-lens defaults are packed in portable field order'
  );
  testCase.deepEqual(
    packedUniforms.lenses[1],
    {position: [1, 2, 3], radius: 0.45, color: [1, 1, 0], intensity: 1.6},
    'per-lens radius and intensity are preserved'
  );

  const updatedUniforms = opticalCaustics.getUniforms({focus: 0.8}, packedUniforms);
  testCase.equal(updatedUniforms.focus, 0.8, 'focus updates independently');
  testCase.equal(updatedUniforms.lensCount, 8, 'partial updates preserve active lenses');
  testCase.equal(updatedUniforms.lenses, packedUniforms.lenses, 'packed lens arrays are reused');

  const clearedUniforms = opticalCaustics.getUniforms({lenses: []}, updatedUniforms);
  testCase.equal(clearedUniforms.lensCount, 0, 'an explicit empty lens list clears caustics');
  testCase.ok(
    clearedUniforms.lenses.every(lens => lens.intensity === 0),
    'cleared lens slots are reset'
  );
  testCase.end();
});

test('optical materials expose matching WGSL and GLSL uniform layouts', testCase => {
  for (const shaderModule of [
    emissiveMaterial,
    opticalPointLights,
    opticalCaustics,
    glassTransmission
  ]) {
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

test('rasterized glass transmission assembles portable optical and depth bindings', testCase => {
  const assembler = new WGSLShaderAssembler();
  const transmissionShader = ILLUMINATED_OPTICAL_MATERIAL_SHADER.replace(
    'glassMaterial_getIlluminatedColor(',
    'glassTransmission_getIlluminatedColor('
  );
  const assembledShader = assembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: transmissionShader,
    modules: [
      glassTransmission,
      reflectiveMaterial,
      emissiveMaterial,
      opticalPointLights,
      opticalCaustics
    ]
  });
  const reflectedShader = new WgslReflect(assembledShader.source);
  const textureNames = reflectedShader.textures.map(texture => texture.name);

  testCase.equal(
    assembledShader.source.match(/fn glassMaterial_getColor\(/g)?.length,
    1,
    'existing glass helpers are installed once'
  );
  testCase.match(
    assembledShader.source,
    /fn glassTransmission_getIlluminatedColor/,
    'rasterized transmission composes with local point lights'
  );
  testCase.ok(textureNames.includes('glassSceneDepthTexture'), 'opaque-depth binding is reflected');
  testCase.ok(
    textureNames.includes('glassBackfaceTexture'),
    'backface-normal and depth binding is reflected'
  );
  testCase.ok(
    textureNames.includes('glassEnvironmentTexture'),
    'studio environment binding is reflected'
  );
  testCase.end();
});

test('existing optical materials compose without the optional point-light module', testCase => {
  const assembler = new WGSLShaderAssembler();
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
  const assembler = new WGSLShaderAssembler();
  const assembledShader = assembler.assembleWGSLShader({
    platformInfo: PLATFORM_INFO,
    source: ILLUMINATED_OPTICAL_MATERIAL_SHADER,
    modules: [
      glassMaterial,
      reflectiveMaterial,
      emissiveMaterial,
      opticalPointLights,
      opticalCaustics,
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
  testCase.equal(
    assembledShader.source.match(/fn opticalCaustics_getColor\(/g)?.length,
    1,
    'focused-light helper is emitted once'
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
    /fn emissiveMaterial_getTrailColor/,
    'directional emissive helper composes with optical materials'
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
  testCase.ok(
    reflectedShader.uniforms.some(resource => resource.name === 'opticalCaustics'),
    'caustic-lens uniforms are reflected'
  );
  testCase.end();
});

test('illuminated optical helpers assemble for GLSL', testCase => {
  const assembler = new GLSLShaderAssembler();
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
    emissiveMaterial_getColor(normal, worldPosition, baseColor, cameraPosition) +
    emissiveMaterial_getTrailColor(normal, worldPosition, baseColor, cameraPosition, 0.65, 0.5) +
    vec4(opticalCaustics_getColor(normal, worldPosition, cameraPosition), 0.0);
}
`,
    modules: [
      glassMaterial,
      reflectiveMaterial,
      emissiveMaterial,
      opticalPointLights,
      opticalCaustics
    ]
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
  testCase.match(
    assembledShader.fs,
    /vec4 emissiveMaterial_getTrailColor/,
    'GLSL directional emission composes'
  );
  testCase.match(
    assembledShader.fs,
    /vec3 opticalCaustics_getColor/,
    'GLSL focused lighting composes'
  );
  testCase.end();
});
