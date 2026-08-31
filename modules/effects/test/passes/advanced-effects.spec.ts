// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  bloomShaderPassPipeline,
  brightnessContrast,
  clusteredVolumetricDepthHistoryCopy,
  clusteredVolumetricTemporal,
  clusteredVolumetricTrace,
  createBloomShaderPassPipeline,
  createCameraReprojectionTAAShaderPassPipeline,
  createClusteredVolumetricLightingShaderPassPipeline,
  createMotionBlurShaderPassPipeline,
  createGTAOShaderPassPipeline,
  createHDRAutoExposureShaderPassPipeline,
  createOutlineShaderPassPipeline,
  createSSAOShaderPassPipeline,
  createSSGIShaderPassPipeline,
  createSSRShaderPassPipeline,
  createTAAShaderPassPipeline,
  createVolumetricFogShaderPassPipeline,
  depthAwareBlurShaderPassPipeline,
  dofShaderPassPipeline,
  gtaoAmbientComposite,
  gtaoEvaluate,
  gtaoTemporal,
  hdrAutoExposureAdapt,
  hdrAutoExposureApply,
  hdrLuminanceExtract,
  hdrLuminanceReduce,
  ssgiTemporal,
  cameraReprojectionTaaResolve,
  ssrComposite,
  ssrSpatial,
  ssrTrace,
  ssrTemporal
} from '../../src';

it('advanced effects expose composable pipeline shapes', () => {
  expect(
    createSSAOShaderPassPipeline().renderTargets?.ssaoRaw.scale,
    'SSAO defaults to full-resolution intermediate framebuffers'
  ).toEqual([1, 1]);
  expect(
    createGTAOShaderPassPipeline().renderTargets?.gtaoRaw.scale,
    'GTAO defaults to full-resolution intermediate framebuffers'
  ).toEqual([1, 1]);
  expect(
    createSSGIShaderPassPipeline().renderTargets?.ssgiRaw.scale,
    'diffuse global illumination defaults to full-resolution intermediate framebuffers'
  ).toEqual([1, 1]);
  expect(
    createSSRShaderPassPipeline().renderTargets?.ssrRaw.scale,
    'screen-space reflections default to full-resolution intermediate framebuffers'
  ).toEqual([1, 1]);
  expect(
    createClusteredVolumetricLightingShaderPassPipeline().renderTargets?.clusteredVolumeRaw.scale,
    'clustered volumetric lighting defaults to full-resolution intermediate framebuffers'
  ).toEqual([1, 1]);

  const ssao = createSSAOShaderPassPipeline({
    normalSource: 'normal-texture',
    resolutionScale: 0.5
  });
  expect(ssao.steps.length, 'SSAO evaluates, blurs twice, and composites').toBe(4);
  expect(ssao.renderTargets?.ssaoRaw.scale, 'SSAO honors scale').toEqual([0.5, 0.5]);
  expect(
    ssao.steps[0].inputs?.normalTexture,
    'normal-texture mode consumes the external normal binding'
  ).toBe(undefined);

  const gtao = createGTAOShaderPassPipeline({resolutionScale: 0.5});
  expect(gtao.steps.length, 'GTAO evaluates, stabilizes, denoises, and composites').toBe(6);
  expect(gtao.renderTargets?.gtaoRaw.scale, 'GTAO honors scale').toEqual([0.5, 0.5]);
  expect(gtao.renderTargets?.gtaoHistory.lifetime, 'GTAO retains AO history').toBe('history');
  expect(
    gtao.renderTargets?.gtaoHistoryDepth.lifetime,
    'GTAO retains depth history for disocclusion rejection'
  ).toBe('history');
  expect(
    gtao.steps[1].inputs?.historyTexture,
    'GTAO intentionally reprojects one logical history target'
  ).toBe(gtao.steps[1].output);
  expect(
    gtaoTemporal.uniformTypes.inverseProjectionMatrix,
    'GTAO temporal rejection reconstructs linear view-space depth'
  ).toBe('mat4x4<f32>');
  expect(
    Boolean(gtaoEvaluate.source.includes('gtaoEvaluate_integrateSlice')),
    'GTAO integrates cosine-weighted visibility between signed horizon angles'
  ).toBe(true);
  expect(
    Boolean(gtaoEvaluate.source.includes('gtaoEvaluate.frameIndex *')),
    'GTAO rotates and jitters horizon samples across animation frames'
  ).toBe(true);

  const ambientOnlyGTAO = createGTAOShaderPassPipeline({composition: 'ambient-only'});
  expect(
    ambientOnlyGTAO.steps[5].shaderPass,
    'ambient-only GTAO selects the composable ambient-light correction'
  ).toBe(gtaoAmbientComposite);
  expect(
    Boolean(
      gtaoAmbientComposite.bindingLayout.some(binding => binding.name === 'ambientLightingTexture')
    ),
    'ambient-only composition explicitly consumes the isolated ambient contribution'
  ).toBe(true);

  const globalIllumination = createSSGIShaderPassPipeline({resolutionScale: 0.5});
  expect(
    globalIllumination.steps.length,
    'SSGI traces, stabilizes, denoises twice, and composites diffuse bounce'
  ).toBe(6);
  expect(
    globalIllumination.renderTargets?.ssgiRaw.scale,
    'SSGI honors the requested tracing resolution'
  ).toEqual([0.5, 0.5]);
  expect(
    globalIllumination.renderTargets?.ssgiHistory.lifetime,
    'SSGI retains indirect-radiance history'
  ).toBe('history');
  expect(
    globalIllumination.renderTargets?.ssgiHistoryDepth.lifetime,
    'SSGI retains depth history for disocclusion rejection'
  ).toBe('history');
  expect(
    globalIllumination.steps[1].inputs?.historyTexture,
    'SSGI intentionally reprojects one logical indirect-radiance history target'
  ).toBe(globalIllumination.steps[1].output);
  expect(
    ssgiTemporal.uniformTypes.inverseProjectionMatrix,
    'SSGI temporal rejection reconstructs linear view-space depth'
  ).toBe('mat4x4<f32>');

  const volumetricLighting = createClusteredVolumetricLightingShaderPassPipeline({
    resolutionScale: 0.4
  });
  expect(
    volumetricLighting.steps.length,
    'clustered volumetric lighting integrates, stabilizes, denoises, and composites'
  ).toBe(6);
  expect(
    volumetricLighting.renderTargets?.clusteredVolumeRaw.scale,
    'clustered volumetric lighting honors low-resolution integration'
  ).toEqual([0.4, 0.4]);
  expect(
    volumetricLighting.renderTargets?.clusteredVolumeHistory.lifetime,
    'clustered volumetric lighting retains scattering history'
  ).toBe('history');
  expect(
    volumetricLighting.renderTargets?.clusteredVolumeDepthHistory.lifetime,
    'clustered volumetric lighting retains depth history'
  ).toBe('history');
  expect(
    clusteredVolumetricTemporal.uniformTypes.inverseProjectionMatrix,
    'clustered volumetric temporal rejection reconstructs linear view-space depth'
  ).toBe('mat4x4<f32>');
  expect(
    clusteredVolumetricTemporal.uniformTypes.inverseViewProjectionMatrix,
    'clustered volumetric temporal reprojection reconstructs current world positions'
  ).toBe('mat4x4<f32>');
  expect(
    clusteredVolumetricTemporal.uniformTypes.previousViewProjectionMatrix,
    'clustered volumetric temporal reprojection projects through the previous camera'
  ).toBe('mat4x4<f32>');
  expect(
    volumetricLighting.renderTargets?.clusteredVolumeDepthHistory.format,
    'clustered volumetric lighting stores compact core-filterable linear depth'
  ).toBe('rg16float');
  expect(
    clusteredVolumetricDepthHistoryCopy.uniformTypes.inverseProjectionMatrix,
    'clustered volumetric depth history linearizes depth when it is captured'
  ).toBe('mat4x4<f32>');
  expect(
    Boolean(
      clusteredVolumetricTemporal.source.includes('cameraPreviousCoord(texCoord, currentDepth)')
    ),
    'empty-space volume history follows explicit camera reprojection'
  ).toBe(true);
  expect(
    Boolean(
      clusteredVolumetricTemporal.source.includes('currentDepth < 0.99999 && velocityIsFinite')
    ),
    'surface volume history preserves valid object velocity'
  ).toBe(true);
  expect(
    Boolean(clusteredVolumetricTemporal.source.includes('previousViewDepth = textureLoad')),
    'temporal rejection compares stored linear depth directly'
  ).toBe(true);

  const adaptiveExposure = createHDRAutoExposureShaderPassPipeline();
  const minimumScaleAdaptiveExposure = createHDRAutoExposureShaderPassPipeline({
    meteringScale: 0.125
  });
  const seededAdaptiveExposure = createHDRAutoExposureShaderPassPipeline({
    initialExposure: 0.35
  });
  expect(
    adaptiveExposure.steps.length,
    'HDR auto exposure extracts, reduces, adapts persistent history, and applies exposure'
  ).toBe(7);
  expect(
    adaptiveExposure.renderTargets?.hdrExposureHistory.lifetime,
    'HDR auto exposure keeps its adapted state on the GPU between frames'
  ).toBe('history');
  expect(
    adaptiveExposure.renderTargets?.hdrExposureHistory.initialize?.clearColor,
    'HDR auto exposure preserves its neutral default history seed'
  ).toEqual([1, 1, 1, 1]);
  expect(
    seededAdaptiveExposure.renderTargets?.hdrExposureHistory.initialize?.clearColor,
    'HDR auto exposure can start at the scene minimum without a bright first frame'
  ).toEqual([0.35, 1, 1, 1]);
  expect(
    adaptiveExposure.steps[5].inputs?.historyTexture,
    'HDR auto exposure reprojects one logical exposure-history target'
  ).toBe(adaptiveExposure.steps[5].output);
  expect(
    hdrAutoExposureAdapt.uniformTypes.deltaTime,
    'HDR auto exposure adapts according to elapsed frame time'
  ).toBe('f32');
  expect(
    Boolean(hdrLuminanceExtract.source.includes('weightedLogLuminance, totalWeight')),
    'HDR metering preserves weighted luminance and weight until the final reduction'
  ).toBe(true);
  expect(
    minimumScaleAdaptiveExposure.renderTargets?.hdrLuminanceQuarter.scale,
    'HDR metering clamps sub-quarter scales so its 4x4 footprint covers the complete source'
  ).toEqual([0.25, 0.25]);
  expect(
    Boolean(hdrLuminanceReduce.source.includes('.rg')),
    'HDR metering reduces weighted luminance and weight together'
  ).toBe(true);
  expect(
    Boolean(hdrAutoExposureAdapt.source.includes('textureLoad(sourceTexture')),
    'HDR exposure consumes every texel in the final luminance level'
  ).toBe(true);
  expect(
    Boolean(
      hdrAutoExposureAdapt.source.includes(
        'min(hdrAutoExposureAdapt.minimumExposure, hdrAutoExposureAdapt.maximumExposure)'
      )
    ),
    'HDR exposure canonicalizes inverted exposure limits'
  ).toBe(true);
  expect(
    Boolean(
      /let exposure = clamp\([\s\S]*mix\(previousExposure, targetExposure, adaptationWeight\)/.test(
        hdrAutoExposureAdapt.source
      )
    ),
    'HDR exposure clamps the temporally adapted result to the configured limits'
  ).toBe(true);
  expect(
    hdrAutoExposureApply.uniformTypes.enabled,
    'HDR exposure can bypass application while preserving adaptation history'
  ).toBe('f32');

  const hdrBloom = createBloomShaderPassPipeline({resolutionScale: 0.75});
  expect(
    hdrBloom.renderTargets?.blurHalf.format,
    'cinematic bloom preserves HDR highlight energy in floating-point intermediates'
  ).toBe('rgba16float');
  expect(
    hdrBloom.renderTargets?.blurHalf.scale,
    'cinematic bloom scales its complete multiresolution pyramid'
  ).toEqual([0.375, 0.375]);
  expect(
    Boolean(
      clusteredVolumetricTrace.source.includes('lightIndex % CLUSTERED_VOLUMETRIC_MAX_LIGHTS')
    ),
    'clustered volumetric lighting does not discard candidates through hash collisions'
  ).toBe(false);
  expect(
    Boolean(clusteredVolumetricTrace.source.includes('lightScore < worstScore')),
    'clustered volumetric lighting retains a bounded best-scoring light set'
  ).toBe(true);
  expect(
    Boolean(clusteredVolumetricTrace.source.includes('dot(viewDirection, lightDirection)')),
    'point-light anisotropy uses the camera-to-sample propagation direction'
  ).toBe(true);
  expect(
    Boolean(
      clusteredVolumetricTrace.source.includes(
        'dot(viewDirection, normalize(clusteredVolumetricTrace.directionalLightDirectionView))'
      )
    ),
    'directional anisotropy uses the camera-to-sample propagation direction'
  ).toBe(true);
  expect(
    Boolean(
      clusteredVolumetricTrace.source.includes(
        'let candidateCount = min(clusterCount, storedCandidateCapacity)'
      )
    ),
    'clustered volumetric lighting bounds overflow work to stored tile-local candidates'
  ).toBe(true);
  expect(
    Boolean(
      clusteredVolumetricTrace.source.includes(
        'min(clusteredVolumetricTrace.pointLightCount, arrayLength(&pointLights)),\n    overflowed'
      )
    ),
    'cluster overflow never falls back to scanning every active light per ray step'
  ).toBe(false);
  expect(
    clusteredVolumetricTrace.uniformTypes.godRayPosition,
    'crepuscular god rays expose a configurable screen-space sun position'
  ).toBe('vec2<f32>');
  expect(
    Boolean(clusteredVolumetricTrace.source.includes('clusteredVolumetricTrace_godRayVisibility')),
    'crepuscular god rays trace scene-depth visibility toward the sun'
  ).toBe(true);
  expect(
    clusteredVolumetricTrace.uniformTypes.godRaysOnly,
    'crepuscular god rays expose a separable diagnostic mode'
  ).toBe('f32');
  expect(
    Boolean(clusteredVolumetricTrace.source.includes('farPosition - rayOrigin')),
    'volume tracing derives a projection-independent view ray'
  ).toBe(true);
  expect(
    Boolean(clusteredVolumetricTrace.source.includes('rayOrigin + viewDirection * travel')),
    'volume tracing preserves the per-pixel origin required by orthographic projection'
  ).toBe(true);

  const reconstructedSSAO = createSSAOShaderPassPipeline();
  expect(
    reconstructedSSAO.steps[0].inputs?.normalTexture,
    'depth reconstruction mode supplies a harmless fallback normal binding'
  ).toBe('previous');

  const outlines = createOutlineShaderPassPipeline({normalSource: 'normal-texture'});
  expect(outlines.steps[0].output, 'outlines compose into previous').toBe('previous');

  const taa = createTAAShaderPassPipeline();
  expect(taa.renderTargets?.taaHistoryColor.lifetime, 'TAA retains color').toBe('history');
  expect(taa.renderTargets?.taaHistoryDepth.lifetime, 'TAA retains depth').toBe('history');
  expect(
    taa.steps[0].inputs?.historyTexture,
    'TAA intentionally reads and writes one logical history target'
  ).toBe(taa.steps[0].output);

  const cameraReprojectionTaa = createCameraReprojectionTAAShaderPassPipeline();
  expect(
    cameraReprojectionTaa.renderTargets?.cameraReprojectionTaaHistoryColor.format,
    'camera-reprojection TAA preserves HDR history'
  ).toBe('rgba16float');
  expect(
    cameraReprojectionTaa.renderTargets?.cameraReprojectionTaaHistoryDepth.lifetime,
    'camera-reprojection TAA retains depth history'
  ).toBe('history');
  expect(
    cameraReprojectionTaa.steps[0].inputs?.historyTexture,
    'camera-reprojection TAA reads and writes one logical history target'
  ).toBe(cameraReprojectionTaa.steps[0].output);
  expect(
    cameraReprojectionTaaResolve.uniformTypes.inverseViewProjectionMatrix,
    'camera-reprojection TAA receives the current inverse view-projection matrix'
  ).toBe('mat4x4<f32>');
  expect(
    cameraReprojectionTaaResolve.uniformTypes.previousViewProjectionMatrix,
    'camera-reprojection TAA receives the previous view-projection matrix'
  ).toBe('mat4x4<f32>');
  expect(
    Boolean(cameraReprojectionTaaResolve.source.includes('textureLoad(previousDepthTexture')),
    'camera-reprojection TAA validates each bilinear history tap against depth'
  ).toBe(true);

  const fog = createVolumetricFogShaderPassPipeline();
  expect(fog.renderTargets?.fogHistory.initialize, 'fog history starts from source').toBe(
    'original'
  );

  expect(depthAwareBlurShaderPassPipeline.steps.length, 'depth blur is separable').toBe(2);
  expect(createMotionBlurShaderPassPipeline().steps.length, 'motion blur is one stage').toBe(1);
  const reflections = createSSRShaderPassPipeline({resolutionScale: 0.5});
  expect(reflections.steps.length, 'SSR traces, stabilizes, denoises twice, and composites').toBe(
    6
  );
  expect(
    reflections.renderTargets?.ssrRaw.scale,
    'SSR honors the requested tracing resolution'
  ).toEqual([0.5, 0.5]);
  expect(
    reflections.renderTargets?.ssrHistory.lifetime,
    'SSR retains reflection radiance history'
  ).toBe('history');
  expect(
    reflections.renderTargets?.ssrHistoryDepth.lifetime,
    'SSR retains depth history for disocclusion rejection'
  ).toBe('history');
  expect(
    reflections.steps[1].inputs?.historyTexture,
    'SSR intentionally reprojects one logical reflection history target'
  ).toBe(reflections.steps[1].output);
  expect(
    ssrTemporal.uniformTypes.inverseProjectionMatrix,
    'SSR temporal rejection reconstructs linear view-space depth'
  ).toBe('mat4x4<f32>');
  expect(
    Boolean(ssrTrace.source.includes('ssrTrace_hash(pixelCoordinate, ssrTrace.frameIndex)')),
    'SSR rotates its stochastic trace sample every frame'
  ).toBe(true);
  expect(
    ssrSpatial.uniformTypes.inverseProjectionMatrix,
    'SSR denoising compares linear view-space depth'
  ).toBe('mat4x4<f32>');
  expect(
    Boolean(ssrSpatial.source.includes('relativeDepthDelta')),
    'SSR denoising rejects relative view-depth discontinuities'
  ).toBe(true);
  expect(
    ssrComposite.uniformTypes.inverseProjectionMatrix,
    'SSR upsampling compares linear view-space depth'
  ).toBe('mat4x4<f32>');
  expect(
    Boolean(ssrTemporal.source.includes('let hasCurrentSupport = maximumReflection.a > 0.001')),
    'SSR temporal accumulation detects frame-local hit support'
  ).toBe(true);
  expect(
    Boolean(ssrTemporal.source.includes('historyReflection.a * ssrTemporal.historyWeight')),
    'SSR temporal accumulation decays valid history across stochastic misses'
  ).toBe(true);
});

it('ambient-only GTAO preserves non-ambient scene lighting on WebGPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const width = 4;
  const height = 4;
  const textureProperties = {
    format: 'rgba8unorm' as const,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  };
  const sourceTexture = device.createTexture({id: 'gtao-ambient-source', ...textureProperties});
  const ambientLightingTexture = device.createTexture({
    id: 'gtao-ambient-lighting',
    ...textureProperties
  });
  const ambientOcclusionTexture = device.createTexture({
    id: 'gtao-ambient-visibility',
    ...textureProperties
  });
  const framebuffer = device.createFramebuffer({
    id: 'gtao-ambient-inputs',
    width,
    height,
    colorAttachments: [sourceTexture, ambientLightingTexture, ambientOcclusionTexture]
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [gtaoAmbientComposite],
    colorFormat: 'rgba8unorm',
    flipY: false
  });
  renderer.resize([width, height]);

  try {
    const renderPass = device.beginRenderPass({
      framebuffer,
      clearColors: [
        new Float32Array([0.8, 0.6, 0.4, 1]),
        new Float32Array([0.2, 0.1, 0.05, 1]),
        new Float32Array([0.25, 0.25, 0.25, 1])
      ]
    });
    renderPass.end();

    const outputTexture = renderer.renderToTexture({
      sourceTexture,
      bindings: {ambientLightingTexture, ambientOcclusionTexture},
      uniforms: {gtaoAmbientComposite: {strength: 1}}
    });
    device.submit();

    expect(Boolean(outputTexture), 'ambient-only composition produces a scene-color texture').toBe(
      true
    );
    if (outputTexture) {
      const layout = outputTexture.computeMemoryLayout({width: 1, height: 1});
      const readbackBuffer = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        outputTexture.readBuffer({width: 1, height: 1}, readbackBuffer);
        const outputBytes = await readbackBuffer.readAsync(0, layout.byteLength);
        const pixel = new Uint8Array(outputBytes.buffer, outputBytes.byteOffset, 4);
        const expected = [0.65, 0.525, 0.3625];
        for (let channel = 0; channel < expected.length; channel++) {
          expect(
            Boolean(Math.abs(pixel[channel]! / 255 - expected[channel]!) < 0.015),
            `channel ${channel} preserves direct/emissive light while occluding ambient`
          ).toBe(true);
        }
      } finally {
        readbackBuffer.destroy();
      }
    }
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    sourceTexture.destroy();
    ambientLightingTexture.destroy();
    ambientOcclusionTexture.destroy();
  }
});

it('clustered volumetric lighting stays continuous across screen-tile boundaries', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const width = 8;
  const height = 1;
  const maxLightsPerCluster = 12;
  const pointLightCount = 14;
  const sourceTexture = device.createTexture({
    id: 'volumetric-tile-boundary-source',
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const depthTexture = device.createTexture({
    id: 'volumetric-tile-boundary-depth',
    format: 'depth24plus',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const sceneFramebuffer = device.createFramebuffer({
    id: 'volumetric-tile-boundary-scene',
    width,
    height,
    colorAttachments: [sourceTexture],
    depthStencilAttachment: depthTexture
  });
  const pointLightData = new Float32Array(pointLightCount * 8);
  pointLightData.set([0, 0, 0.5, 0.48, 1, 0, 0, 18], 0);
  for (let lightIndex = 1; lightIndex < pointLightCount; lightIndex++) {
    pointLightData.set([4, 4, 0.5, 0.1, 1, 0, 0, 1], lightIndex * 8);
  }
  const finalStoredLightIndex = maxLightsPerCluster - 1;
  pointLightData.set([0, 0, 0.5, 0.48, 0, 1, 0, 18], finalStoredLightIndex * 8);
  const pointLights = device.createBuffer({
    id: 'volumetric-tile-boundary-lights',
    data: pointLightData,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const clusterLightCounts = device.createBuffer({
    id: 'volumetric-tile-boundary-counts',
    data: new Uint32Array([pointLightCount, 1]),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const clusterIndexData = new Uint32Array(2 * maxLightsPerCluster);
  for (let lightIndex = 0; lightIndex < maxLightsPerCluster; lightIndex++) {
    clusterIndexData[lightIndex] = lightIndex;
  }
  clusterIndexData[maxLightsPerCluster] = finalStoredLightIndex;
  const clusterLightIndices = device.createBuffer({
    id: 'volumetric-tile-boundary-indices',
    data: clusterIndexData,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [clusteredVolumetricTrace],
    colorFormat: 'rgba8unorm',
    flipY: false
  });
  renderer.resize([width, height]);
  const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

  try {
    const sceneRenderPass = device.beginRenderPass({
      framebuffer: sceneFramebuffer,
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });
    sceneRenderPass.end();

    const outputTexture = renderer.renderToTexture({
      sourceTexture,
      bindings: {depthTexture, pointLights, clusterLightCounts, clusterLightIndices},
      uniforms: {
        clusteredVolumetricTrace: {
          projectionMatrix: identityMatrix,
          inverseProjectionMatrix: identityMatrix,
          inverseViewMatrix: identityMatrix,
          directionalLightDirectionView: [0, 0, 1],
          directionalLightColor: [0, 0, 0],
          fogColor: [0, 0, 0],
          density: 0.35,
          heightFalloff: 0,
          fogHeight: 0,
          anisotropy: 0,
          directionalIntensity: 0,
          pointLightIntensity: 4,
          maxDistance: 1,
          sampleCount: 8,
          shadowStrength: 0,
          clusterCountX: 2,
          clusterCountY: 1,
          clusterCountZ: 1,
          maxLightsPerCluster,
          pointLightCount,
          clusterNearPlane: 0.1,
          clusterFarPlane: 10
        }
      }
    });
    device.submit();

    expect(Boolean(outputTexture), 'clustered volumetric regression scene renders').toBe(true);
    if (outputTexture) {
      const memoryLayout = outputTexture.computeMemoryLayout({width, height});
      const readbackBuffer = device.createBuffer({
        id: 'volumetric-tile-boundary-readback',
        byteLength: memoryLayout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        outputTexture.readBuffer({width, height}, readbackBuffer);
        const pixelBytes = await readbackBuffer.readAsync(0, memoryLayout.byteLength);
        const leftPixelOffset = (width / 2 - 1) * 4;
        const rightPixelOffset = (width / 2) * 4;
        const leftRedScattering = pixelBytes[leftPixelOffset]!;
        const leftGreenScattering = pixelBytes[leftPixelOffset + 1]!;
        const rightGreenScattering = pixelBytes[rightPixelOffset + 1]!;
        expect(
          Boolean(leftRedScattering > 20 && leftGreenScattering > 20),
          'an overflowing cluster selects its best lights across all stored candidates'
        ).toBe(true);
        expect(
          Boolean(leftGreenScattering > 20 && rightGreenScattering > 20),
          'both tiles retain the shared nearby light at the stored candidate boundary'
        ).toBe(true);
        expect(
          Boolean(Math.abs(leftGreenScattering - rightGreenScattering) < 45),
          'adjacent tiles produce comparable fog scattering'
        ).toBe(true);
      } finally {
        readbackBuffer.destroy();
      }
    }
  } finally {
    renderer.destroy();
    clusterLightIndices.destroy();
    clusterLightCounts.destroy();
    pointLights.destroy();
    sceneFramebuffer.destroy();
    depthTexture.destroy();
    sourceTexture.destroy();
  }
});

it('advanced effects compose in order with existing effects', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    return;
  }

  const width = 8;
  const height = 8;
  const sourceTexture = device.createTexture({
    id: 'mixed-effects-source',
    format: device.preferredColorFormat,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const normalTexture = device.createTexture({
    id: 'mixed-effects-normal',
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const velocityTexture = device.createTexture({
    id: 'mixed-effects-velocity',
    format: 'rg16float',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const depthTexture = device.createTexture({
    id: 'mixed-effects-depth',
    format: 'depth24plus',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const pointLights = device.createBuffer({
    id: 'mixed-effects-point-lights',
    byteLength: 32,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const clusterLightCounts = device.createBuffer({
    id: 'mixed-effects-cluster-counts',
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const clusterLightIndices = device.createBuffer({
    id: 'mixed-effects-cluster-indices',
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const sceneFramebuffer = device.createFramebuffer({
    id: 'mixed-effects-scene',
    width,
    height,
    colorAttachments: [sourceTexture, normalTexture, velocityTexture],
    depthStencilAttachment: depthTexture
  });
  const mixedEffectStack = [
    brightnessContrast,
    createSSAOShaderPassPipeline({normalSource: 'normal-texture'}),
    createGTAOShaderPassPipeline(),
    createSSGIShaderPassPipeline(),
    createSSRShaderPassPipeline(),
    createClusteredVolumetricLightingShaderPassPipeline(),
    createHDRAutoExposureShaderPassPipeline(),
    bloomShaderPassPipeline,
    dofShaderPassPipeline,
    createTAAShaderPassPipeline(),
    createMotionBlurShaderPassPipeline()
  ];
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: mixedEffectStack,
    flipY: false
  });
  renderer.resize([width, height]);

  const observedBindingNames = new Map<string, Set<string>>();
  for (const passRenderer of renderer.passRenderers) {
    for (const execution of passRenderer.subPassExecutions) {
      const originalPrepare = execution.subPassRenderer.prepare.bind(execution.subPassRenderer);
      execution.subPassRenderer.prepare = options => {
        const bindingNames =
          observedBindingNames.get(execution.shaderPass.name) || new Set<string>();
        for (const bindingName of Object.keys(options.bindings)) {
          bindingNames.add(bindingName);
        }
        observedBindingNames.set(execution.shaderPass.name, bindingNames);
        originalPrepare(options);
      };
    }
  }

  const hasBinding = (shaderPassName: string, bindingName: string): boolean =>
    observedBindingNames.get(shaderPassName)?.has(bindingName) || false;

  try {
    const sceneRenderPass = device.beginRenderPass({
      framebuffer: sceneFramebuffer,
      clearColor: [0.5, 0.5, 0.5, 1],
      clearDepth: 0.5
    });
    sceneRenderPass.end();

    const outputTexture = renderer.renderToTexture({
      sourceTexture,
      bindings: {
        depthTexture,
        normalTexture,
        velocityTexture,
        pointLights,
        clusterLightCounts,
        clusterLightIndices
      }
    });
    device.submit();

    expect(Boolean(outputTexture), 'mixed old and new effect stack renders on WebGPU').toBe(true);
    expect(
      renderer.passRenderers.map(passRenderer => passRenderer.passDefinition.name),
      'renderer preserves the declared old/new effect order'
    ).toEqual(mixedEffectStack.map(effect => effect.name));

    expect(
      Boolean(hasBinding('brightnessContrast', 'depthTexture')),
      'color-only effects do not receive scene depth'
    ).toBe(false);
    expect(Boolean(hasBinding('ssaoEvaluate', 'depthTexture')), 'SSAO receives scene depth').toBe(
      true
    );
    expect(
      Boolean(hasBinding('ssaoEvaluate', 'normalTexture')),
      'SSAO receives scene normals'
    ).toBe(true);
    expect(Boolean(hasBinding('gtaoEvaluate', 'depthTexture')), 'GTAO receives scene depth').toBe(
      true
    );
    expect(
      Boolean(hasBinding('gtaoEvaluate', 'normalTexture')),
      'GTAO receives scene normals'
    ).toBe(true);
    expect(
      Boolean(hasBinding('gtaoTemporal', 'velocityTexture')),
      'GTAO receives scene velocity'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssgiTrace', 'depthTexture')),
      'SSGI tracing receives scene depth'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssgiTrace', 'normalTexture')),
      'SSGI tracing receives scene normals'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssgiTemporal', 'velocityTexture')),
      'SSGI history receives scene velocity'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssgiSpatial', 'normalTexture')),
      'SSGI denoising receives scene normals'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssrTrace', 'depthTexture')),
      'SSR tracing receives scene depth'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssrTrace', 'normalTexture')),
      'SSR tracing receives scene normals'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssrTemporal', 'velocityTexture')),
      'SSR history receives scene velocity'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssrSpatial', 'normalTexture')),
      'SSR denoising receives scene normals'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssrComposite', 'depthTexture')),
      'SSR upsampling preserves depth edges'
    ).toBe(true);
    expect(
      Boolean(hasBinding('ssrComposite', 'normalTexture')),
      'SSR upsampling preserves surface-normal edges'
    ).toBe(true);
    expect(
      Boolean(hasBinding('clusteredVolumetricTrace', 'pointLights')),
      'volumetric integration receives the shared point-light storage buffer'
    ).toBe(true);
    expect(
      Boolean(hasBinding('clusteredVolumetricTrace', 'clusterLightCounts')),
      'volumetric integration receives compute-built cluster occupancy'
    ).toBe(true);
    expect(
      Boolean(hasBinding('clusteredVolumetricTrace', 'clusterLightIndices')),
      'volumetric integration receives compute-built local light lists'
    ).toBe(true);
    expect(
      Boolean(hasBinding('clusteredVolumetricTemporal', 'velocityTexture')),
      'volumetric history receives scene velocity'
    ).toBe(true);
    expect(
      Boolean(hasBinding('hdrAutoExposureAdapt', 'historyTexture')),
      'GPU-driven HDR metering retains adapted exposure history'
    ).toBe(true);
    expect(
      Boolean(hasBinding('hdrAutoExposureApply', 'exposureTexture')),
      'HDR exposure resolve receives the adapted luminance state'
    ).toBe(true);
    expect(
      Boolean(hasBinding('bloomExtract', 'velocityTexture')),
      'bloom does not receive scene velocity'
    ).toBe(false);
    expect(Boolean(hasBinding('dof', 'depthTexture')), 'DOF receives scene depth').toBe(true);
    expect(Boolean(hasBinding('dof', 'normalTexture')), 'DOF does not receive scene normals').toBe(
      false
    );
    expect(Boolean(hasBinding('taaResolve', 'depthTexture')), 'TAA receives scene depth').toBe(
      true
    );
    expect(
      Boolean(hasBinding('taaResolve', 'velocityTexture')),
      'TAA receives scene velocity'
    ).toBe(true);
    expect(
      Boolean(hasBinding('taaResolve', 'normalTexture')),
      'TAA does not receive scene normals'
    ).toBe(false);
    expect(
      Boolean(hasBinding('motionBlur', 'depthTexture')),
      'motion blur receives scene depth'
    ).toBe(true);
    expect(
      Boolean(hasBinding('motionBlur', 'velocityTexture')),
      'motion blur receives scene velocity'
    ).toBe(true);
  } finally {
    renderer.destroy();
    sceneFramebuffer.destroy();
    sourceTexture.destroy();
    normalTexture.destroy();
    velocityTexture.destroy();
    depthTexture.destroy();
    pointLights.destroy();
    clusterLightCounts.destroy();
    clusterLightIndices.destroy();
  }
});
