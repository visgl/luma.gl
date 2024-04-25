// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {denoise, getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('denoise#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(denoise, {}, {});

  t.ok(uniforms, 'denoise module build is ok');
  t.equal(uniforms.strength, 0.5, 'denoise strength uniform is ok');
  t.end();
});
