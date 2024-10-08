// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {zoomBlur} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('zoomBlur#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(zoomBlur, {}, {});

  t.ok(uniforms, 'zoomBlur module build is ok');
  t.deepEqual(uniforms.center, [0.5, 0.5], 'zoomBlur center uniform is ok');
  t.equal(uniforms.strength, 0.3, 'zoomBlur strength uniform is ok');
  t.end();
});
