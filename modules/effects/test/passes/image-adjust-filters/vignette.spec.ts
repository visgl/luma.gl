// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {vignette} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('vignette#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(vignette, {}, {});

  t.ok(uniforms, 'vignette module build is ok');
  t.equal(uniforms.radius, 0.5, 'vignette radius uniform is ok');
  t.equal(uniforms.amount, 0.5, 'vignette amount uniform is ok');
  t.end();
});
