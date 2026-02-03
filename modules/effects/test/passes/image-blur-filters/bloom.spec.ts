// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {bloom} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('bloom#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(bloom, {}, {});
  t.ok(uniforms, 'bloom module build is ok');
  t.equal(uniforms.radius, 4, 'bloom radius uniform is ok');
  t.equal(uniforms.threshold, 0.8, 'bloom threshold uniform is ok');
  t.equal(uniforms.intensity, 1, 'bloom intensity uniform is ok');
  t.end();
});

