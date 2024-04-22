// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {hueSaturation, getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('hueSaturation#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(hueSaturation, {}, {});

  t.ok(uniforms, 'hueSaturation module build is ok');
  t.equal(uniforms.hue, 0, 'hueSaturation hue uniform is ok');
  t.equal(uniforms.saturation, 0, 'hueSaturation saturation uniform is ok');
  t.end();
});
