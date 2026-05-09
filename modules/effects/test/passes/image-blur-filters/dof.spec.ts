// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {dof, dofShaderPassPipeline} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('dof#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(dof, {}, {});

  t.ok(uniforms, 'dof module build is ok');
  t.deepEqual(uniforms.depthRange, [0.1, 100], 'depth range uniform is ok');
  t.equal(uniforms.focusDistance, 1, 'focus distance uniform is ok');
  t.equal(uniforms.blurCoefficient, 1, 'blur coefficient uniform is ok');
  t.equal(uniforms.pixelsPerMillimeter, 1, 'pixels per millimeter uniform is ok');
  t.end();
});

test('dofShaderPassPipeline#shape', t => {
  t.equal(dofShaderPassPipeline.steps.length, 2, 'pipeline has two passes');
  t.equal(dofShaderPassPipeline.steps[0].shaderPass, dof, 'first step uses dof');
  t.equal(dofShaderPassPipeline.steps[1].shaderPass, dof, 'second step uses dof');
  t.deepEqual(
    dofShaderPassPipeline.steps[0].uniforms,
    {texelOffset: [1, 0]},
    'first step runs horizontal blur'
  );
  t.deepEqual(
    dofShaderPassPipeline.steps[1].uniforms,
    {texelOffset: [0, 1]},
    'second step runs vertical blur'
  );
  t.end();
});
