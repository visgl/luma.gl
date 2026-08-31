// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('optical material modules expose portable shared shader helpers', () => {
  expect(glassMaterialPlugin.name, 'glass plugin has a stable name').toBe('glassMaterial');
  expect(glassMaterialPlugin.modules, 'glass plugin installs glass').toEqual([glassMaterial]);
  expect(glassTransmissionPlugin.name, 'rasterized transmission plugin has a stable name').toBe(
    'glassTransmission'
  );
  expect(
    glassTransmissionPlugin.modules,
    'rasterized transmission plugin installs its optional extension'
  ).toEqual([glassTransmission]);
  expect(reflectiveMaterialPlugin.name, 'reflective plugin has a stable name').toBe(
    'reflectiveMaterial'
  );
  expect(reflectiveMaterialPlugin.modules, 'reflective plugin installs reflective shading').toEqual(
    [reflectiveMaterial]
  );
  expect(emissiveMaterialPlugin.name, 'emissive plugin has a stable name').toBe('emissiveMaterial');
  expect(emissiveMaterialPlugin.modules, 'emissive plugin installs emissive shading').toEqual([
    emissiveMaterial
  ]);
  expect(opticalPointLightsPlugin.name, 'point-light plugin has a stable name').toBe(
    'opticalPointLights'
  );
  expect(
    opticalPointLightsPlugin.modules,
    'point-light plugin installs local lighting explicitly'
  ).toEqual([opticalPointLights]);
  expect(opticalCausticsPlugin.name, 'caustic-lens plugin has a stable name').toBe(
    'opticalCaustics'
  );
  expect(
    opticalCausticsPlugin.modules,
    'caustic-lens plugin installs focused lighting explicitly'
  ).toEqual([opticalCaustics]);
  expect(glassMaterial.dependencies, 'glass reuses shared optical lighting').toEqual([
    opticalLighting
  ]);
  expect(
    glassTransmission.dependencies,
    'rasterized transmission composes the existing glass material'
  ).toEqual([glassMaterial]);
  expect(
    reflectiveMaterial.dependencies,
    'reflective shading reuses shared optical lighting'
  ).toEqual([opticalLighting]);
  expect(emissiveMaterial.dependencies, 'emissive shading reuses shared optical lighting').toEqual([
    opticalLighting
  ]);
  expect(
    opticalPointLights.dependencies,
    'point-light shading reuses shared optical lighting'
  ).toEqual([opticalLighting]);
  expect(opticalCaustics.dependencies, 'caustic shading reuses shared optical lighting').toEqual([
    opticalLighting
  ]);
  expect(MAX_OPTICAL_POINT_LIGHTS, 'point lights have a portable fixed capacity').toBe(16);
  expect(MAX_OPTICAL_CAUSTIC_LENSES, 'focusing lenses have a portable fixed capacity').toBe(8);
  expect(opticalLighting.source, 'WGSL helpers exist').toMatch(/fn opticalLighting_getFresnel/);
  expect(opticalLighting.fs, 'GLSL helpers exist').toMatch(/float opticalLighting_getFresnel/);
  expect(
    opticalLighting.source,
    'WGSL widens subpixel highlights using screen-space normal derivatives'
  ).toMatch(/fn opticalLighting_getFilteredRoughness[\s\S]*?dpdx\(normal\)[\s\S]*?dpdy\(normal\)/);
  expect(opticalLighting.fs, 'GLSL uses matching geometric specular antialiasing').toMatch(
    /float opticalLighting_getFilteredRoughness[\s\S]*?dFdx\(normal\)[\s\S]*?dFdy\(normal\)/
  );
  expect(opticalLighting.source, 'WGSL exposes GGX microfacet highlights').toMatch(
    /fn opticalLighting_getMicrofacetSpecular/
  );
  expect(opticalLighting.fs, 'GLSL exposes GGX microfacet highlights').toMatch(
    /float opticalLighting_getMicrofacetSpecular/
  );
  expect(emissiveMaterial.source, 'WGSL emission exists').toMatch(/fn emissiveMaterial_getColor/);
  expect(emissiveMaterial.fs, 'GLSL emission exists').toMatch(/vec4 emissiveMaterial_getColor/);
  expect(emissiveMaterial.source, 'WGSL directional emission exists').toMatch(
    /fn emissiveMaterial_getTrailColor/
  );
  expect(emissiveMaterial.fs, 'GLSL directional emission exists').toMatch(
    /vec4 emissiveMaterial_getTrailColor/
  );
  expect(emissiveMaterial.source, 'WGSL trails fade toward the packet tail').toMatch(
    /pow\(smoothstep\(0\.0, 1\.0, trailProgress\), 1\.5\)/
  );
  expect(emissiveMaterial.fs, 'GLSL trails fade toward the packet tail').toMatch(
    /pow\(smoothstep\(0\.0, 1\.0, trailProgress\), 1\.5\)/
  );
  expect(opticalPointLights.source, 'WGSL point-light helper exists').toMatch(
    /fn opticalPointLights_getColor/
  );
  expect(opticalPointLights.fs, 'GLSL point-light helper exists').toMatch(
    /vec3 opticalPointLights_getColor/
  );
  expect(opticalCaustics.source, 'WGSL focused-light helper exists').toMatch(
    /fn opticalCaustics_getColor/
  );
  expect(opticalCaustics.fs, 'GLSL focused-light helper exists').toMatch(
    /vec3 opticalCaustics_getColor/
  );
  void 0;
});

it('optical materials retain defaults while applying partial updates', () => {
  const initialGlassUniforms = glassMaterial.getUniforms({});
  expect(initialGlassUniforms, 'glass uniforms expose stable defaults').toEqual({
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
  });

  const updatedGlassUniforms = glassMaterial.getUniforms(
    {indexOfRefraction: 1.6, thickness: 1.8},
    initialGlassUniforms
  );
  expect(updatedGlassUniforms.indexOfRefraction, 'glass refraction updates').toBe(1.6);
  expect(updatedGlassUniforms.thickness, 'glass thickness updates').toBe(1.8);
  expect(updatedGlassUniforms.roughness, 'glass roughness is retained').toBe(0.14);
  expect(updatedGlassUniforms.refractionStrength, 'lens distortion is retained').toBe(1);
  expect(updatedGlassUniforms.clearcoatStrength, 'glass clearcoat is retained').toBe(0.7);

  const cinematicGlassUniforms = glassMaterial.getUniforms(
    {fresnelStrength: 1.4, iridescenceStrength: 0.25, transmissionStrength: 1.1},
    updatedGlassUniforms
  );
  expect(cinematicGlassUniforms.fresnelStrength, 'Fresnel edges are configurable').toBe(1.4);
  expect(
    cinematicGlassUniforms.iridescenceStrength,
    'spectral edge highlights are configurable'
  ).toBe(0.25);
  expect(cinematicGlassUniforms.transmissionStrength, 'glass transmission is configurable').toBe(
    1.1
  );
  expect(
    cinematicGlassUniforms.internalReflectionStrength,
    'internal reflection is retained across partial updates'
  ).toBe(0.42);

  const initialTransmissionUniforms = glassTransmission.getUniforms({});
  expect(
    initialTransmissionUniforms,
    'rasterized transmission exposes stable optical defaults'
  ).toEqual({
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
  });
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
  expect(
    updatedTransmissionUniforms.environmentIntensity,
    'environment reflections remain adjustable'
  ).toBe(1.6);
  expect(updatedTransmissionUniforms.environmentMipLevels, 'probe mip capacity updates').toBe(9);
  expect(
    updatedTransmissionUniforms.environmentPrefilterStrength,
    'roughness-selected environment filtering is configurable'
  ).toBe(0.85);
  expect(
    updatedTransmissionUniforms.contactShadowStrength,
    'opaque-depth contact shadows are configurable'
  ).toBe(0.4);
  expect(
    updatedTransmissionUniforms.thicknessStrength,
    'backface-derived thickness remains adjustable'
  ).toBe(1.25);
  expect(updatedTransmissionUniforms.depthBias, 'foreground-depth tolerance is retained').toBe(
    0.00008
  );
  expect(
    updatedTransmissionUniforms.dynamicReflectionStrength,
    'dynamic reflections remain opt-in for existing consumers'
  ).toBe(0);
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
  expect(
    animatedTransmissionUniforms.dynamicReflectionStrength,
    'captured-scene reflections are configurable'
  ).toBe(0.45);
  expect(
    animatedTransmissionUniforms.secondaryBounceStrength,
    'secondary internal reflections are configurable'
  ).toBe(0.7);
  expect(
    animatedTransmissionUniforms.faultDistortionStrength,
    'fault-driven lens distortion is configurable'
  ).toBe(0.3);
  expect(
    animatedTransmissionUniforms.roughTransmissionStrength,
    'thickness-aware rough transmission is configurable'
  ).toBe(0.85);
  expect(
    animatedTransmissionUniforms.spectralAbsorptionStrength,
    'wavelength-dependent volume absorption is configurable'
  ).toBe(0.42);
  expect(
    animatedTransmissionUniforms.thinFilmThickness,
    'thin-film coating thickness is configured in nanometers'
  ).toBe(420);
  expect(
    animatedTransmissionUniforms.thinFilmStrength,
    'angular thin-film interference is configurable'
  ).toBe(0.22);
  expect(
    animatedTransmissionUniforms.volumeScatteringStrength,
    'localized optical volume scattering is configurable'
  ).toBe(0.38);
  expect(animatedTransmissionUniforms.time, 'fault animation accepts a scene clock').toBe(2.5);
  const retainedOpticalUniforms = glassTransmission.getUniforms(
    {environmentIntensity: 1.8},
    animatedTransmissionUniforms
  );
  expect(
    retainedOpticalUniforms.roughTransmissionStrength,
    'partial updates preserve rough transmission'
  ).toBe(0.85);
  expect(
    retainedOpticalUniforms.spectralAbsorptionStrength,
    'partial updates preserve spectral volume absorption'
  ).toBe(0.42);
  expect(
    retainedOpticalUniforms.thinFilmThickness,
    'partial updates preserve the coating thickness'
  ).toBe(420);
  expect(
    retainedOpticalUniforms.volumeScatteringStrength,
    'partial updates preserve optical volume scattering'
  ).toBe(0.38);
  expect(
    retainedOpticalUniforms.environmentMipLevels,
    'partial updates preserve the prefiltered environment pyramid'
  ).toBe(9);
  expect(
    retainedOpticalUniforms.contactShadowStrength,
    'partial updates preserve contact-shadow strength'
  ).toBe(0.4);

  const initialReflectiveUniforms = reflectiveMaterial.getUniforms({});
  expect(initialReflectiveUniforms, 'reflective uniforms expose stable defaults').toEqual({
    roughness: 0.62,
    reflectionStrength: 0.32,
    specularStrength: 0.42,
    opacityScale: 1
  });

  const updatedReflectiveUniforms = reflectiveMaterial.getUniforms(
    {roughness: 0.35, opacityScale: 0.5},
    initialReflectiveUniforms
  );
  expect(updatedReflectiveUniforms.roughness, 'reflective roughness updates').toBe(0.35);
  expect(updatedReflectiveUniforms.opacityScale, 'reflective opacity updates').toBe(0.5);
  expect(
    updatedReflectiveUniforms.specularStrength,
    'reflective specular strength is retained'
  ).toBe(0.42);

  const initialEmissiveUniforms = emissiveMaterial.getUniforms({});
  expect(initialEmissiveUniforms, 'emissive uniforms expose stable defaults').toEqual({
    intensity: 1,
    rimStrength: 0.35
  });

  const updatedEmissiveUniforms = emissiveMaterial.getUniforms(
    {intensity: 2.5},
    initialEmissiveUniforms
  );
  expect(updatedEmissiveUniforms.intensity, 'emissive intensity updates').toBe(2.5);
  expect(updatedEmissiveUniforms.rimStrength, 'emissive rim strength is retained').toBe(0.35);
  void 0;
});

it('reflective materials follow the reflected view direction and preserve opaque alpha', () => {
  expect(
    reflectiveMaterial.source,
    'WGSL environment reflections follow the camera-reflected view ray'
  ).toMatch(/let reflectionDirection = reflect\(-viewDirection, normalFacingCamera\);/);
  expect(
    reflectiveMaterial.fs,
    'GLSL environment reflections follow the camera-reflected view ray'
  ).toMatch(/vec3 reflectionDirection = reflect\(-viewDirection, normalFacingCamera\);/);
  expect(reflectiveMaterial.source, 'WGSL samples the environment along the reflected ray').toMatch(
    /opticalLighting_sampleEnvironment\(\s*reflectionDirection,/
  );
  expect(reflectiveMaterial.fs, 'GLSL samples the environment along the reflected ray').toMatch(
    /opticalLighting_sampleEnvironment\(\s*reflectionDirection,/
  );
  expect(
    reflectiveMaterial.source,
    'WGSL reflective opacity supports the complete zero-to-one alpha range'
  ).toMatch(/let opacity = clamp\([\s\S]*?0\.0,\s*1\.0\s*\);/);
  expect(
    reflectiveMaterial.fs,
    'GLSL reflective opacity supports the complete zero-to-one alpha range'
  ).toMatch(/float opacity = clamp\([\s\S]*?0\.0,\s*1\.0\s*\);/);
  void 0;
});

it('glass materials compose portable clearcoat, spectral rims, and soft transmission', () => {
  for (const [shaderSource, language] of [
    [glassMaterial.source, 'WGSL'],
    [glassMaterial.fs, 'GLSL']
  ] as const) {
    expect(shaderSource, `${language} isolates reusable chromatic transmission sampling`).toMatch(
      /glassMaterial_sampleTransmission/
    );
    expect(
      shaderSource,
      `${language} distorts the background using the actual refracted ray`
    ).toMatch(/rayDeflection = refractionDirection \+ viewDirection/);
    expect(
      shaderSource,
      `${language} projects refraction into camera-aligned screen coordinates`
    ).toMatch(/cameraRight/);
    expect(shaderSource, `${language} exposes adjustable lens distortion`).toMatch(
      /refractionStrength/
    );
    expect(
      shaderSource,
      `${language} follows glTF's Abbe-number wavelength-dependent index-of-refraction model`
    ).toMatch(/dispersionHalfSpread = \(indexOfRefraction - 1\.0\) \* 0\.025/);
    expect(shaderSource, `${language} traces the lower-index red transmission ray`).toMatch(
      /redRefractionDirection = refract/
    );
    expect(shaderSource, `${language} traces the higher-index blue transmission ray`).toMatch(
      /blueRefractionDirection = refract/
    );
    expect(
      shaderSource,
      `${language} preserves displaced background instead of blending it away`
    ).toMatch(/transmissionCoverage/);
    expect(shaderSource, `${language} shades glass with GGX microfacet highlights`).toMatch(
      /opticalLighting_getMicrofacetSpecular/
    );
    expect(
      shaderSource,
      `${language} prevents subpixel GGX highlights from sparkling or clipping`
    ).toMatch(/opticalLighting_getFilteredRoughness/);
    expect(shaderSource, `${language} supports a clearcoat lobe`).toMatch(/clearcoatStrength/);
    expect(
      shaderSource,
      `${language} computes the clearcoat's angular dielectric reflectance`
    ).toMatch(/clearcoatFresnel/);
    expect(
      shaderSource,
      `${language} attenuates the underlying layer when clearcoat reflects incoming light`
    ).toMatch(/baseLayerEnergy/);
    expect(
      shaderSource,
      `${language} restores clearcoat Fresnel energy as environment reflection`
    ).toMatch(/clearcoatEnvironment = environmentColor \* clearcoatFresnel/);
    expect(
      shaderSource,
      `${language} combines clearcoat environment and direct-light reflections`
    ).toMatch(/clearcoatReflection = \(clearcoatEnvironment \+ clearcoatSpecular\)/);
    expect(
      shaderSource,
      `${language} prevents transmission from amplifying the captured background`
    ).toMatch(/clamp\(glassMaterial\.transmissionStrength, 0\.0, 1\.0\)/);
    expect(shaderSource, `${language} supports internal shell reflection`).toMatch(
      /internalReflectionStrength/
    );
    expect(shaderSource, `${language} supports restrained spectral rim interference`).toMatch(
      /iridescenceStrength/
    );
    expect(shaderSource, `${language} softens refraction according to surface roughness`).toMatch(
      /softenedTransmission/
    );
    expect(shaderSource, `${language} adds camera-responsive studio-light reflections`).toMatch(
      /studioRibbon/
    );
    expect(shaderSource, `${language} retains a visible tinted glass body`).toMatch(/glassBody/);
  }
  void 0;
});

it('rasterized glass transmission composes thickness, depth, and environment maps', () => {
  for (const [shaderSource, language] of [
    [glassTransmission.source, 'WGSL'],
    [glassTransmission.fs, 'GLSL']
  ] as const) {
    expect(shaderSource, `${language} samples sphere backfaces`).toMatch(/glassBackfaceTexture/);
    expect(shaderSource, `${language} samples opaque depth`).toMatch(/glassSceneDepthTexture/);
    expect(shaderSource, `${language} samples a studio environment map`).toMatch(
      /glassEnvironmentTexture/
    );
    expect(shaderSource, `${language} measures optical thickness in linear view depth`).toMatch(
      /glassTransmission_linearizeDepth/
    );
    expect(shaderSource, `${language} refracts at entry`).toMatch(/entryDirection = refract/);
    expect(shaderSource, `${language} refracts at exit`).toMatch(/exitDirection = refract/);
    expect(
      shaderSource,
      `${language} traces wavelength-dependent rays through the front glass surface`
    ).toMatch(/redEntryDirection = refract[\s\S]*?blueEntryDirection = refract/);
    expect(
      shaderSource,
      `${language} refracts every wavelength again at the rear glass boundary`
    ).toMatch(/redExitDirection = refract[\s\S]*?blueExitDirection = refract/);
    expect(
      shaderSource,
      `${language} derives dielectric Fresnel reflectance from the configured index of refraction`
    ).toMatch(
      /baseReflectance = pow\(\(indexOfRefraction - 1\.0\) \/ \(indexOfRefraction \+ 1\.0\), 2\.0\)/
    );
    expect(
      shaderSource,
      `${language} reserves reflected energy before transmitting the background`
    ).toMatch(/transmissionWeight = \(1\.0 - fresnel\)/);
    expect(
      shaderSource,
      `${language} weights environment reflections by the same angular Fresnel response`
    ).toMatch(/reflectionWeight = fresnel \* glassMaterial\.reflectionStrength/);
    expect(shaderSource, `${language} preserves opaque foreground geometry`).toMatch(
      /foregroundOcclusion/
    );
    expect(
      shaderSource,
      `${language} handles total internal reflection without ray marching`
    ).toMatch(/hasExitRay/);
    expect(shaderSource, `${language} reflects nearby captured-scene objects`).toMatch(
      /reflectedSceneColor/
    );
    expect(
      shaderSource,
      `${language} projects dynamic scene reflections along the reflected view ray`
    ).toMatch(/dot\(reflectionDirection,\s*cameraRight\)/);
    expect(shaderSource, `${language} approximates a second internal environment bounce`).toMatch(
      /secondaryDirection/
    );
    expect(
      shaderSource,
      `${language} confines animated distortion to warm fault-colored glass`
    ).toMatch(/faultRipple/);
    expect(
      shaderSource,
      `${language} filters transmission using optical thickness and surface roughness`
    ).toMatch(/glassTransmission_sampleRoughTransmission/);
    expect(shaderSource, `${language} applies wavelength-dependent volume absorption`).toMatch(
      /glassTransmission_getSpectralAbsorption/
    );
    expect(shaderSource, `${language} computes angular thin-film interference`).toMatch(
      /glassTransmission_getThinFilm/
    );
    expect(
      shaderSource,
      `${language} evaluates representative red, green, and blue wavelengths`
    ).toMatch(/650\.0, 530\.0, 460\.0/);
    expect(
      shaderSource,
      `${language} scatters nearby colored lights inside the glass volume`
    ).toMatch(/volumeLightScattering/);
    expect(
      shaderSource,
      `${language} keeps local packet glints as front-surface reflections`
    ).toMatch(/opticalPointLights_getSpecularColor/);
    expect(
      shaderSource,
      `${language} filters environment reflections for rough optical surfaces`
    ).toMatch(/filteredEnvironment/);
    expect(
      shaderSource,
      `${language} samples explicit roughness-dependent reflection lobes`
    ).toMatch(/glassTransmission_sampleEnvironmentAtRoughness/);
    expect(shaderSource, `${language} selects initialized studio-environment mip levels`).toMatch(
      /reflectionLevel/
    );
    expect(
      shaderSource,
      `${language} anchors translucent shells to nearby opaque geometry`
    ).toMatch(/glassTransmission_getContactShadow/);
  }
  const glslEnvironmentSampleCalls = [
    ...glassTransmission.fs.matchAll(/(texture(?:Lod)?)\(\s*glassEnvironmentTexture/g)
  ];
  expect(
    Boolean(glslEnvironmentSampleCalls.length > 0),
    'GLSL samples the environment texture'
  ).toBe(true);
  expect(
    Boolean(glslEnvironmentSampleCalls.every(sampleCall => sampleCall[1] === 'textureLod')),
    'GLSL uses explicit mip levels for prefiltered and legacy environment sampling'
  ).toBe(true);
  void 0;
});

it('optical point lights pack and retain a bounded portable uniform array', () => {
  const initialUniforms = opticalPointLights.getUniforms({});
  expect(initialUniforms.lightCount, 'point lights start disabled').toBe(0);
  expect(initialUniforms.intensity, 'point lights expose a stable global intensity').toBe(1);
  expect(initialUniforms.lights.length, 'default lights occupy every fixed uniform slot').toBe(
    MAX_OPTICAL_POINT_LIGHTS
  );
  expect(
    Boolean(initialUniforms.lights.every(light => light.intensity === 0)),
    'unused light slots do not illuminate existing materials'
  ).toBe(true);

  const suppliedLights = Array.from(
    {length: MAX_OPTICAL_POINT_LIGHTS + 2},
    (_, lightIndex): OpticalPointLight => ({
      position: [lightIndex, lightIndex + 1, lightIndex + 2],
      color: [1, lightIndex % 2, 0],
      ...(lightIndex === 1 ? {intensity: 2.5, radius: 3.5} : {})
    })
  );
  const packedUniforms = opticalPointLights.getUniforms({lights: suppliedLights, intensity: 0.6});

  expect(packedUniforms.lightCount, 'additional lights beyond the fixed capacity are ignored').toBe(
    MAX_OPTICAL_POINT_LIGHTS
  );
  expect(packedUniforms.intensity, 'global intensity is configurable').toBe(0.6);
  expect(
    packedUniforms.lights[0],
    'point-light defaults are packed in portable field order'
  ).toEqual({position: [0, 1, 2], radius: 1, color: [1, 0, 0], intensity: 1});
  expect(packedUniforms.lights[1], 'per-light radius and intensity are preserved').toEqual({
    position: [1, 2, 3],
    radius: 3.5,
    color: [1, 1, 0],
    intensity: 2.5
  });

  const updatedUniforms = opticalPointLights.getUniforms({intensity: 1.4}, packedUniforms);
  expect(updatedUniforms.intensity, 'global intensity updates independently').toBe(1.4);
  expect(updatedUniforms.lightCount, 'partial updates preserve active lights').toBe(16);
  expect(updatedUniforms.lights, 'packed light arrays are reused').toBe(packedUniforms.lights);

  const clearedUniforms = opticalPointLights.getUniforms({lights: []}, updatedUniforms);
  expect(clearedUniforms.lightCount, 'an explicit empty light list clears illumination').toBe(0);
  expect(
    Boolean(clearedUniforms.lights.every(light => light.intensity === 0)),
    'cleared light slots are reset'
  ).toBe(true);
  expect(
    opticalPointLights.source,
    'WGSL retains a broader packet reflection lobe on curved glass'
  ).toMatch(/softSpecular/);
  expect(
    opticalPointLights.fs,
    'GLSL retains a broader packet reflection lobe on curved glass'
  ).toMatch(/softSpecular/);
  void 0;
});

it('optical caustics pack and retain a bounded portable lens array', () => {
  const initialUniforms = opticalCaustics.getUniforms({});
  expect(initialUniforms.lensCount, 'focusing lenses start disabled').toBe(0);
  expect(initialUniforms.intensity, 'caustics expose a stable global intensity').toBe(1);
  expect(initialUniforms.focus, 'caustics expose a stable focus multiplier').toBe(1);
  expect(initialUniforms.lenses.length, 'default lenses occupy every fixed uniform slot').toBe(
    MAX_OPTICAL_CAUSTIC_LENSES
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

  expect(packedUniforms.lensCount, 'additional lenses beyond the fixed capacity are ignored').toBe(
    MAX_OPTICAL_CAUSTIC_LENSES
  );
  expect(packedUniforms.intensity, 'global caustic intensity is configurable').toBe(0.6);
  expect(packedUniforms.focus, 'caustic focus is configurable').toBe(1.4);
  expect(
    packedUniforms.lenses[0],
    'caustic-lens defaults are packed in portable field order'
  ).toEqual({position: [0, 1, 2], radius: 1, color: [0, 1, 0], intensity: 1});
  expect(packedUniforms.lenses[1], 'per-lens radius and intensity are preserved').toEqual({
    position: [1, 2, 3],
    radius: 0.45,
    color: [1, 1, 0],
    intensity: 1.6
  });

  const updatedUniforms = opticalCaustics.getUniforms({focus: 0.8}, packedUniforms);
  expect(updatedUniforms.focus, 'focus updates independently').toBe(0.8);
  expect(updatedUniforms.lensCount, 'partial updates preserve active lenses').toBe(8);
  expect(updatedUniforms.lenses, 'packed lens arrays are reused').toBe(packedUniforms.lenses);

  const clearedUniforms = opticalCaustics.getUniforms({lenses: []}, updatedUniforms);
  expect(clearedUniforms.lensCount, 'an explicit empty lens list clears caustics').toBe(0);
  expect(
    Boolean(clearedUniforms.lenses.every(lens => lens.intensity === 0)),
    'cleared lens slots are reset'
  ).toBe(true);
  void 0;
});

it('optical materials expose matching WGSL and GLSL uniform layouts', () => {
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

    expect(
      Boolean(wgslValidation?.matches),
      `${shaderModule.name} WGSL uniform layout matches`
    ).toBe(true);
    expect(
      Boolean(fragmentValidation?.matches),
      `${shaderModule.name} GLSL uniform layout matches`
    ).toBe(true);
  }

  const shaderBlockLayout = makeShaderBlockLayout(opticalPointLights.uniformTypes);
  const shaderBlockFieldNames = Object.keys(shaderBlockLayout.fields);
  expect(shaderBlockLayout.byteLength, '16 structured lights occupy 528 bytes').toBe(528);
  expect(
    shaderBlockFieldNames.slice(0, 6),
    'uniform block keeps its explicit count and structured light field order'
  ).toEqual([
    'lightCount',
    'intensity',
    'lights[0].position',
    'lights[0].radius',
    'lights[0].color',
    'lights[0].intensity'
  ]);
  expect(
    shaderBlockFieldNames.slice(-4),
    'uniform block includes the final fixed-capacity light'
  ).toEqual([
    'lights[15].position',
    'lights[15].radius',
    'lights[15].color',
    'lights[15].intensity'
  ]);
  void 0;
});

it('rasterized glass transmission assembles portable optical and depth bindings', () => {
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

  expect(
    assembledShader.source.match(/fn glassMaterial_getColor\(/g)?.length,
    'existing glass helpers are installed once'
  ).toBe(1);
  expect(
    assembledShader.source,
    'rasterized transmission composes with local point lights'
  ).toMatch(/fn glassTransmission_getIlluminatedColor/);
  expect(
    Boolean(textureNames.includes('glassSceneDepthTexture')),
    'opaque-depth binding is reflected'
  ).toBe(true);
  expect(
    Boolean(textureNames.includes('glassBackfaceTexture')),
    'backface-normal and depth binding is reflected'
  ).toBe(true);
  expect(
    Boolean(textureNames.includes('glassEnvironmentTexture')),
    'studio environment binding is reflected'
  ).toBe(true);
  void 0;
});

it('existing optical materials compose without the optional point-light module', () => {
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

  expect(
    assembledShader.source.match(/fn opticalLighting_getFresnel\(/g)?.length,
    'shared Fresnel helpers are emitted once'
  ).toBe(1);
  expect(
    Boolean(resources.some(resource => resource.name === 'glassSceneColorTexture')),
    'glass scene-color texture is reflected'
  ).toBe(true);
  expect(
    Boolean(resources.some(resource => resource.name === 'glassSceneColorTextureSampler')),
    'glass scene-color sampler is reflected'
  ).toBe(true);
  expect(
    Boolean(resources.some(resource => resource.name === 'glassMaterial')),
    'glass material uniforms are reflected'
  ).toBe(true);
  expect(
    Boolean(resources.some(resource => resource.name === 'reflectiveMaterial')),
    'reflective material uniforms are reflected'
  ).toBe(true);
  expect(
    Boolean(resources.some(resource => resource.name === 'opticalPointLights')),
    'existing glass and reflective plugins do not install optional point lights'
  ).toBe(false);
  expect(
    Boolean(/fn glassMaterial_getIlluminatedColor/.test(assembledShader.source)),
    'illuminated glass is omitted until the light plugin is installed'
  ).toBe(false);
  expect(
    Boolean(/fn reflectiveMaterial_getIlluminatedColor/.test(assembledShader.source)),
    'illuminated reflections are omitted until the light plugin is installed'
  ).toBe(false);
  expect(assembledShader.source, 'A-buffer composes').toMatch(/fn aBuffer_captureStraightColor/);
  expect(assembledShader.source, 'weighted-blended OIT composes').toMatch(
    /fn wboit_captureStraightColor/
  );
  void 0;
});

it('illuminated optical materials compose once with emission and transparency', () => {
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

  expect(
    assembledShader.source.match(/fn opticalLighting_getFresnel\(/g)?.length,
    'shared optical-lighting helpers remain deduplicated'
  ).toBe(1);
  expect(
    assembledShader.source.match(/fn opticalPointLights_getColor\(/g)?.length,
    'point-light helper is emitted once'
  ).toBe(1);
  expect(
    assembledShader.source.match(/fn opticalCaustics_getColor\(/g)?.length,
    'focused-light helper is emitted once'
  ).toBe(1);
  expect(assembledShader.source, 'illuminated glass helper is enabled').toMatch(
    /fn glassMaterial_getIlluminatedColor/
  );
  expect(assembledShader.source, 'illuminated reflective helper is enabled').toMatch(
    /fn reflectiveMaterial_getIlluminatedColor/
  );
  expect(assembledShader.source, 'emissive helper composes with optical materials').toMatch(
    /fn emissiveMaterial_getColor/
  );
  expect(
    assembledShader.source,
    'directional emissive helper composes with optical materials'
  ).toMatch(/fn emissiveMaterial_getTrailColor/);
  expect(assembledShader.source, 'WGSL exposes a fixed 16-light uniform array').toMatch(
    /lights: array<OpticalPointLightUniform, 16>/
  );
  expect(
    Boolean(reflectedShader.uniforms.some(resource => resource.name === 'opticalPointLights')),
    'point-light uniforms are reflected'
  ).toBe(true);
  expect(
    Boolean(reflectedShader.uniforms.some(resource => resource.name === 'emissiveMaterial')),
    'emissive material uniforms are reflected'
  ).toBe(true);
  expect(
    Boolean(reflectedShader.uniforms.some(resource => resource.name === 'opticalCaustics')),
    'caustic-lens uniforms are reflected'
  ).toBe(true);
  void 0;
});

it('illuminated optical helpers assemble for GLSL', () => {
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

  expect(assembledShader.fs, 'GLSL exposes a fixed 16-light uniform array').toMatch(
    /OpticalPointLightUniform lights\[16\]/
  );
  expect(assembledShader.fs, 'GLSL illuminated glass composes').toMatch(
    /vec4 glassMaterial_getIlluminatedColor/
  );
  expect(assembledShader.fs, 'GLSL illuminated reflections compose').toMatch(
    /vec4 reflectiveMaterial_getIlluminatedColor/
  );
  expect(assembledShader.fs, 'GLSL emission composes').toMatch(/vec4 emissiveMaterial_getColor/);
  expect(assembledShader.fs, 'GLSL directional emission composes').toMatch(
    /vec4 emissiveMaterial_getTrailColor/
  );
  expect(assembledShader.fs, 'GLSL focused lighting composes').toMatch(
    /vec3 opticalCaustics_getColor/
  );
  void 0;
});
