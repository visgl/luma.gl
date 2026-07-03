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
  t.end();
});
