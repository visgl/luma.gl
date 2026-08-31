// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {dof, dofShaderPassPipeline} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('dof#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(dof, {}, {});

  expect(Boolean(uniforms), 'dof module build is ok').toBe(true);
  expect(uniforms.depthRange, 'depth range uniform is ok').toEqual([0.1, 100]);
  expect(uniforms.focusDistance, 'focus distance uniform is ok').toBe(1);
  expect(uniforms.blurCoefficient, 'blur coefficient uniform is ok').toBe(1);
  expect(uniforms.pixelsPerMillimeter, 'pixels per millimeter uniform is ok').toBe(1);
});

it('dofShaderPassPipeline#shape', () => {
  expect(dofShaderPassPipeline.steps.length, 'pipeline has two passes').toBe(2);
  expect(dofShaderPassPipeline.steps[0].shaderPass, 'first step uses dof').toBe(dof);
  expect(dofShaderPassPipeline.steps[1].shaderPass, 'second step uses dof').toBe(dof);
  expect(
    dofShaderPassPipeline.steps[0].inputs.sourceTexture,
    'pipeline consumes the preceding effect output'
  ).toBe('previous');
  expect(dofShaderPassPipeline.steps[0].uniforms, 'first step runs horizontal blur').toEqual({
    texelOffset: [1, 0]
  });
  expect(dofShaderPassPipeline.steps[1].uniforms, 'second step runs vertical blur').toEqual({
    texelOffset: [0, 1]
  });
});
