// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  bloomShaderPassPipeline,
  brightnessContrast,
  createMotionBlurShaderPassPipeline,
  createOutlineShaderPassPipeline,
  createSSAOShaderPassPipeline,
  createSSRShaderPassPipeline,
  createTAAShaderPassPipeline,
  createVolumetricFogShaderPassPipeline,
  depthAwareBlurShaderPassPipeline,
  dofShaderPassPipeline
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
  testCase.equal(createSSRShaderPassPipeline().steps.length, 2, 'SSR traces then composites');
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
