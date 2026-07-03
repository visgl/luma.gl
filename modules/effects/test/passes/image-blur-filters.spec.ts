// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  bloom,
  bloomShaderPassPipeline,
  gaussianBlur,
  tiltShift,
  triangleBlur,
  zoomBlur
} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('bloom#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(bloom, {}, {});
  t.equal(uniforms.radius, 4, 'bloom radius defaults to 4');
  t.equal(uniforms.threshold, 0.8, 'bloom threshold defaults to 0.8');
  t.equal(uniforms.intensity, 1, 'bloom intensity defaults to 1');
  t.end();
});

test('gaussianBlur#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(gaussianBlur, {}, {});
  t.equal(uniforms.radius, 12, 'gaussian blur radius defaults to 12');
  t.deepEqual(uniforms.delta, [1, 0], 'gaussian blur delta defaults correctly');
  t.end();
});

test('tiltShift#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(tiltShift, {}, {});
  t.equal(uniforms.blurRadius, 15, 'tilt shift blur radius defaults to 15');
  t.equal(uniforms.gradientRadius, 200, 'tilt shift gradient radius defaults to 200');
  t.deepEqual(uniforms.start, [0, 0], 'tilt shift start defaults correctly');
  t.deepEqual(uniforms.end, [1, 1], 'tilt shift end defaults correctly');
  t.equal(uniforms.invert, 0, 'tilt shift invert defaults to zero');
  t.end();
});

test('triangleBlur#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(triangleBlur, {}, {});
  t.equal(uniforms.radius, 20, 'triangle blur radius defaults to 20');
  t.deepEqual(uniforms.delta, [1, 0], 'triangle blur delta defaults correctly');
  t.end();
});

test('zoomBlur#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(zoomBlur, {}, {});
  t.deepEqual(uniforms.center, [0.5, 0.5], 'zoom blur center defaults correctly');
  t.equal(uniforms.strength, 0.3, 'zoom blur strength defaults to 0.3');
  t.end();
});

test('bloom shader pass pipeline routing', t => {
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
