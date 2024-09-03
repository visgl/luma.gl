// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {triangleBlur} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('triangleBlur#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(triangleBlur, {}, {});

  t.ok(uniforms, 'triangleBlur module build is ok');
  t.equal(uniforms.radius, 20, 'triangleBlur radius uniform is ok');
  t.deepEqual(uniforms.delta, [1, 0], 'triangleBlur delta uniform is ok');
  t.end();
});
