// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {bloom, bloomShaderPassPipeline} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('bloom#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(bloom, {}, {});

  t.ok(uniforms, 'bloom module build is ok');
  t.equal(uniforms.radius, 4, 'bloom radius uniform is ok');
  t.equal(uniforms.threshold, 0.8, 'bloom threshold uniform is ok');
  t.equal(uniforms.intensity, 1, 'bloom intensity uniform is ok');
  t.end();
});

test('bloomShaderPassPipeline#routing', t => {
  const extractionSteps = bloomShaderPassPipeline.steps.filter(
    step => step.shaderPass.name === 'bloomExtract'
  );

  t.equal(extractionSteps.length, 3, 'pipeline extracts three bloom scales');
  for (const extractionStep of extractionSteps) {
    t.equal(
      extractionStep.inputs.sourceTexture,
      'previous',
      'bloom extraction consumes the preceding effect output'
    );
  }
  for (const target of Object.values(bloomShaderPassPipeline.renderTargets)) {
    t.equal(target.sampler.minFilter, 'linear', 'bloom intermediates use linear minification');
    t.equal(target.sampler.magFilter, 'linear', 'bloom intermediates use linear magnification');
  }
  const blurPass = bloomShaderPassPipeline.steps.find(
    step => step.shaderPass.name === 'bloomBlur'
  )?.shaderPass;
  t.ok(blurPass, 'multiscale bloom includes a separable blur');
  t.match(blurPass?.source || '', /return color \/ totalWeight/, 'blur preserves smooth falloff');
  t.notOk(
    /unpremultipliedRgb/.test(blurPass?.source || ''),
    'blur does not amplify tiny alpha into square halos'
  );

  const compositePass = bloomShaderPassPipeline.steps.find(
    step => step.shaderPass.name === 'bloomComposite'
  )?.shaderPass;
  t.ok(compositePass, 'multiscale bloom includes a glow composite');
  t.match(
    compositePass?.source || '',
    /textureSample\(glowHalf, glowHalfSampler, texCoord\)/,
    'WGSL composites glow in the same orientation as the scene'
  );
  t.match(
    compositePass?.fs || '',
    /texture\(glowHalf, texCoord\)/,
    'GLSL composites glow in the same orientation as the scene'
  );
  t.notOk(
    /shaderPassRenderer_getRenderTargetUV/.test(compositePass?.fs || ''),
    'GLSL does not vertically mirror named bloom targets'
  );
  t.end();
});
