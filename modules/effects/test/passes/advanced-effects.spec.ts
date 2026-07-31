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
  gtaoAmbientComposite,
  gtaoEvaluate,
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
  testCase.ok(
    gtaoEvaluate.source.includes('gtaoEvaluate_integrateSlice'),
    'GTAO integrates cosine-weighted visibility between signed horizon angles'
  );
  testCase.ok(
    gtaoEvaluate.source.includes('gtaoEvaluate.frameIndex *'),
    'GTAO rotates and jitters horizon samples across animation frames'
  );

  const ambientOnlyGTAO = createGTAOShaderPassPipeline({composition: 'ambient-only'});
  testCase.equal(
    ambientOnlyGTAO.steps[5].shaderPass,
    gtaoAmbientComposite,
    'ambient-only GTAO selects the composable ambient-light correction'
  );
  testCase.ok(
    gtaoAmbientComposite.bindingLayout.some(binding => binding.name === 'ambientLightingTexture'),
    'ambient-only composition explicitly consumes the isolated ambient contribution'
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

test('ambient-only GTAO preserves non-ambient scene lighting on WebGPU', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU unavailable, skipping ambient-only composition execution');
    testCase.end();
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

    testCase.ok(outputTexture, 'ambient-only composition produces a scene-color texture');
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
          testCase.ok(
            Math.abs(pixel[channel]! / 255 - expected[channel]!) < 0.015,
            `channel ${channel} preserves direct/emissive light while occluding ambient`
          );
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
      bindings: {depthTexture, normalTexture, velocityTexture}
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
  }

  testCase.end();
});
