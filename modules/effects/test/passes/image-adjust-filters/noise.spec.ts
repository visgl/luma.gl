// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {noise} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('noise#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(noise, {}, {});

  t.ok(uniforms, 'noise module build is ok');
  t.equal(uniforms.amount, 0.5, 'noise amount uniform is ok');
  t.end();
});
