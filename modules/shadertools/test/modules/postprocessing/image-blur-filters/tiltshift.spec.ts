// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {tiltShift, getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('tiltShift#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(tiltShift, {}, {});

  t.ok(uniforms, 'tiltShift module build is ok');
  t.equal(uniforms.blurRadius, 15, 'tiltShift blurRadius uniform is ok');
  t.equal(uniforms.gradientRadius, 200, 'tiltShift gradientRadius uniform is ok');
  t.deepEqual(uniforms.start, [0, 0], 'tiltShift start uniform is ok');
  t.deepEqual(uniforms.end, [1, 1], 'tiltShift end uniform is ok');
  t.equal(uniforms.invert, false, 'tiltShift invert uniform is ok');
  t.end();
});
