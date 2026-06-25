// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  createMotionBlurShaderPassPipeline,
  createOutlineShaderPassPipeline,
  createSSAOShaderPassPipeline,
  createSSRShaderPassPipeline,
  createTAAShaderPassPipeline,
  createVolumetricFogShaderPassPipeline,
  depthAwareBlurShaderPassPipeline
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
