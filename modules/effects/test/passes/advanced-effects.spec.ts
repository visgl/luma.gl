// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  bloomShaderPassPipeline,
  brightnessContrast,
  clusteredVolumetricTemporal,
  clusteredVolumetricTrace,
  createClusteredVolumetricLightingShaderPassPipeline,
  createMotionBlurShaderPassPipeline,
  createGTAOShaderPassPipeline,
  createOutlineShaderPassPipeline,
  createSSAOShaderPassPipeline,
  createSSGIShaderPassPipeline,
  createSSRShaderPassPipeline,
  createTAAShaderPassPipeline,
  createVolumetricFogShaderPassPipeline,
  depthAwareBlurShaderPassPipeline,
  dofShaderPassPipeline,
  gtaoTemporal,
  ssgiTemporal,
  ssrTemporal
} from '../../src';

test('advanced effects expose composable pipeline shapes', testCase => {
  const ssao = createSSAOShaderPassPipeline({
    normalSource: 'normal-texture',
    resolutionScale: 0.5
  });
  testCase.equal(ssao.steps.length, 4, 'SSAO evaluates, blurs twice, and composites');
  testCase.deepEqual(ssao.renderTargets?.ssaoRaw.scale, [0.5, 0.5], 'SSAO honors scale');
  testCase.equal(
    ssao.steps[0].inputs?.normalTexture,
    undefined,
    'normal-texture mode consumes the external normal binding'
  );

  const gtao = createGTAOShaderPassPipeline({resolutionScale: 0.5});
  testCase.equal(gtao.steps.length, 6, 'GTAO evaluates, stabilizes, denoises, and composites');
  testCase.deepEqual(gtao.renderTargets?.gtaoRaw.scale, [0.5, 0.5], 'GTAO honors scale');
  testCase.equal(gtao.renderTargets?.gtaoHistory.lifetime, 'history', 'GTAO retains AO history');
  testCase.equal(
    gtao.renderTargets?.gtaoHistoryDepth.lifetime,
    'history',
    'GTAO retains depth history for disocclusion rejection'
  );
  testCase.equal(
    gtao.steps[1].inputs?.historyTexture,
    gtao.steps[1].output,
    'GTAO intentionally reprojects one logical history target'
  );
  testCase.equal(
    gtaoTemporal.uniformTypes.inverseProjectionMatrix,
    'mat4x4<f32>',
    'GTAO temporal rejection reconstructs linear view-space depth'
  );

  const globalIllumination = createSSGIShaderPassPipeline({resolutionScale: 0.5});
  testCase.equal(
    globalIllumination.steps.length,
    6,
    'SSGI traces, stabilizes, denoises twice, and composites diffuse bounce'
  );
  testCase.deepEqual(
    globalIllumination.renderTargets?.ssgiRaw.scale,
    [0.5, 0.5],
    'SSGI honors the requested tracing resolution'
  );
  testCase.equal(
    globalIllumination.renderTargets?.ssgiHistory.lifetime,
    'history',
    'SSGI retains indirect-radiance history'
  );
  testCase.equal(
    globalIllumination.renderTargets?.ssgiHistoryDepth.lifetime,
    'history',
    'SSGI retains depth history for disocclusion rejection'
  );
  testCase.equal(
    globalIllumination.steps[1].inputs?.historyTexture,
    globalIllumination.steps[1].output,
    'SSGI intentionally reprojects one logical indirect-radiance history target'
  );
  testCase.equal(
    ssgiTemporal.uniformTypes.inverseProjectionMatrix,
    'mat4x4<f32>',
    'SSGI temporal rejection reconstructs linear view-space depth'
  );

  const volumetricLighting = createClusteredVolumetricLightingShaderPassPipeline({
    resolutionScale: 0.4
  });
  testCase.equal(
    volumetricLighting.steps.length,
    6,
    'clustered volumetric lighting integrates, stabilizes, denoises, and composites'
  );
  testCase.deepEqual(
    volumetricLighting.renderTargets?.clusteredVolumeRaw.scale,
    [0.4, 0.4],
    'clustered volumetric lighting honors low-resolution integration'
  );
  testCase.equal(
    volumetricLighting.renderTargets?.clusteredVolumeHistory.lifetime,
    'history',
    'clustered volumetric lighting retains scattering history'
  );
  testCase.equal(
    volumetricLighting.renderTargets?.clusteredVolumeDepthHistory.lifetime,
    'history',
    'clustered volumetric lighting retains depth history'
  );
  testCase.equal(
    clusteredVolumetricTemporal.uniformTypes.inverseProjectionMatrix,
    'mat4x4<f32>',
    'clustered volumetric temporal rejection reconstructs linear view-space depth'
  );
  testCase.ok(
    clusteredVolumetricTrace.source.includes('lightIndex % CLUSTERED_VOLUMETRIC_MAX_LIGHTS'),
    'clustered volumetric lighting chooses nearby lights in stable global-index slots'
  );
  testCase.notOk(
    clusteredVolumetricTrace.source.includes('min(clusterCount, CLUSTERED_VOLUMETRIC_MAX_LIGHTS)'),
    'clustered volumetric lighting never truncates tile-local candidates before selection'
  );
  testCase.equal(
    clusteredVolumetricTrace.uniformTypes.godRayPosition,
    'vec2<f32>',
    'crepuscular god rays expose a configurable screen-space sun position'
  );
  testCase.ok(
    clusteredVolumetricTrace.source.includes('clusteredVolumetricTrace_godRayVisibility'),
    'crepuscular god rays trace scene-depth visibility toward the sun'
  );

  const reconstructedSSAO = createSSAOShaderPassPipeline();
  testCase.equal(
    reconstructedSSAO.steps[0].inputs?.normalTexture,
    'previous',
    'depth reconstruction mode supplies a harmless fallback normal binding'
  );

  const outlines = createOutlineShaderPassPipeline({normalSource: 'normal-texture'});
  testCase.equal(outlines.steps[0].output, 'previous', 'outlines compose into previous');

  const taa = createTAAShaderPassPipeline();
  testCase.equal(taa.renderTargets?.taaHistoryColor.lifetime, 'history', 'TAA retains color');
  testCase.equal(taa.renderTargets?.taaHistoryDepth.lifetime, 'history', 'TAA retains depth');
  testCase.equal(
    taa.steps[0].inputs?.historyTexture,
    taa.steps[0].output,
    'TAA intentionally reads and writes one logical history target'
  );

  const fog = createVolumetricFogShaderPassPipeline();
  testCase.equal(
    fog.renderTargets?.fogHistory.initialize,
    'original',
    'fog history starts from source'
  );

  testCase.equal(depthAwareBlurShaderPassPipeline.steps.length, 2, 'depth blur is separable');
  testCase.equal(createMotionBlurShaderPassPipeline().steps.length, 1, 'motion blur is one stage');
  const reflections = createSSRShaderPassPipeline({resolutionScale: 0.5});
  testCase.equal(
    reflections.steps.length,
    6,
    'SSR traces, stabilizes, denoises twice, and composites'
  );
  testCase.deepEqual(
    reflections.renderTargets?.ssrRaw.scale,
    [0.5, 0.5],
    'SSR honors the requested tracing resolution'
  );
  testCase.equal(
    reflections.renderTargets?.ssrHistory.lifetime,
    'history',
    'SSR retains reflection radiance history'
  );
  testCase.equal(
    reflections.renderTargets?.ssrHistoryDepth.lifetime,
    'history',
    'SSR retains depth history for disocclusion rejection'
  );
  testCase.equal(
    reflections.steps[1].inputs?.historyTexture,
    reflections.steps[1].output,
    'SSR intentionally reprojects one logical reflection history target'
  );
  testCase.equal(
    ssrTemporal.uniformTypes.inverseProjectionMatrix,
    'mat4x4<f32>',
    'SSR temporal rejection reconstructs linear view-space depth'
  );
  testCase.end();
});

test('clustered volumetric lighting stays continuous across screen-tile boundaries', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU unavailable, skipping volumetric tile-boundary regression');
    testCase.end();
    return;
  }

  const width = 8;
  const height = 1;
  const maxLightsPerCluster = 12;
  const pointLightCount = 11;
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
  for (let lightIndex = 0; lightIndex < pointLightCount - 1; lightIndex++) {
    pointLightData.set([4, 4, 0.5, 0.1, 1, 0, 0, 1], lightIndex * 8);
  }
  pointLightData.set([0, 0, 0.5, 0.48, 0, 1, 0, 18], (pointLightCount - 1) * 8);
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
  for (let lightIndex = 0; lightIndex < pointLightCount; lightIndex++) {
    clusterIndexData[lightIndex] = lightIndex;
  }
  clusterIndexData[maxLightsPerCluster] = pointLightCount - 1;
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

    testCase.ok(outputTexture, 'clustered volumetric regression scene renders');
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
        const leftScattering = pixelBytes[(width / 2 - 1) * 4 + 1]!;
        const rightScattering = pixelBytes[(width / 2) * 4 + 1]!;
        testCase.ok(
          leftScattering > 20 && rightScattering > 20,
          'both tiles retain the shared nearby light beyond the old ten-light prefix'
        );
        testCase.ok(
          Math.abs(leftScattering - rightScattering) < 45,
          'adjacent tiles produce comparable fog scattering'
        );
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

  testCase.end();
});

test('advanced effects compose in order with existing effects', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU unavailable, skipping mixed effect execution');
    testCase.end();
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

    testCase.ok(outputTexture, 'mixed old and new effect stack renders on WebGPU');
    testCase.deepEqual(
      renderer.passRenderers.map(passRenderer => passRenderer.passDefinition.name),
      mixedEffectStack.map(effect => effect.name),
      'renderer preserves the declared old/new effect order'
    );

    testCase.notOk(
      hasBinding('brightnessContrast', 'depthTexture'),
      'color-only effects do not receive scene depth'
    );
    testCase.ok(hasBinding('ssaoEvaluate', 'depthTexture'), 'SSAO receives scene depth');
    testCase.ok(hasBinding('ssaoEvaluate', 'normalTexture'), 'SSAO receives scene normals');
    testCase.ok(hasBinding('gtaoEvaluate', 'depthTexture'), 'GTAO receives scene depth');
    testCase.ok(hasBinding('gtaoEvaluate', 'normalTexture'), 'GTAO receives scene normals');
    testCase.ok(hasBinding('gtaoTemporal', 'velocityTexture'), 'GTAO receives scene velocity');
    testCase.ok(hasBinding('ssgiTrace', 'depthTexture'), 'SSGI tracing receives scene depth');
    testCase.ok(hasBinding('ssgiTrace', 'normalTexture'), 'SSGI tracing receives scene normals');
    testCase.ok(
      hasBinding('ssgiTemporal', 'velocityTexture'),
      'SSGI history receives scene velocity'
    );
    testCase.ok(
      hasBinding('ssgiSpatial', 'normalTexture'),
      'SSGI denoising receives scene normals'
    );
    testCase.ok(hasBinding('ssrTrace', 'depthTexture'), 'SSR tracing receives scene depth');
    testCase.ok(hasBinding('ssrTrace', 'normalTexture'), 'SSR tracing receives scene normals');
    testCase.ok(
      hasBinding('ssrTemporal', 'velocityTexture'),
      'SSR history receives scene velocity'
    );
    testCase.ok(hasBinding('ssrSpatial', 'normalTexture'), 'SSR denoising receives scene normals');
    testCase.ok(hasBinding('ssrComposite', 'depthTexture'), 'SSR upsampling preserves depth edges');
    testCase.ok(
      hasBinding('ssrComposite', 'normalTexture'),
      'SSR upsampling preserves surface-normal edges'
    );
    testCase.ok(
      hasBinding('clusteredVolumetricTrace', 'pointLights'),
      'volumetric integration receives the shared point-light storage buffer'
    );
    testCase.ok(
      hasBinding('clusteredVolumetricTrace', 'clusterLightCounts'),
      'volumetric integration receives compute-built cluster occupancy'
    );
    testCase.ok(
      hasBinding('clusteredVolumetricTrace', 'clusterLightIndices'),
      'volumetric integration receives compute-built local light lists'
    );
    testCase.ok(
      hasBinding('clusteredVolumetricTemporal', 'velocityTexture'),
      'volumetric history receives scene velocity'
    );
    testCase.notOk(
      hasBinding('bloomExtract', 'velocityTexture'),
      'bloom does not receive scene velocity'
    );
    testCase.ok(hasBinding('dof', 'depthTexture'), 'DOF receives scene depth');
    testCase.notOk(hasBinding('dof', 'normalTexture'), 'DOF does not receive scene normals');
    testCase.ok(hasBinding('taaResolve', 'depthTexture'), 'TAA receives scene depth');
    testCase.ok(hasBinding('taaResolve', 'velocityTexture'), 'TAA receives scene velocity');
    testCase.notOk(hasBinding('taaResolve', 'normalTexture'), 'TAA does not receive scene normals');
    testCase.ok(hasBinding('motionBlur', 'depthTexture'), 'motion blur receives scene depth');
    testCase.ok(hasBinding('motionBlur', 'velocityTexture'), 'motion blur receives scene velocity');
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

  testCase.end();
});
