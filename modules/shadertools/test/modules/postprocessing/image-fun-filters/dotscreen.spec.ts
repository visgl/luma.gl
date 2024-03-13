// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {dotScreen, ShaderModuleInstance} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('dotScreen#build/uniform', t => {
  const dotScreenModule = new ShaderModuleInstance(dotScreen);
  const uniforms = dotScreenModule.getUniforms({}, {});

  t.ok(uniforms, 'dotScreen module build is ok');
  t.deepEqual(uniforms.center, [0.5, 0.5], 'dotScreen center uniform is ok');
  t.equal(uniforms.angle, 1.1, 'dotScreen angle uniform is ok');
  t.equal(uniforms.size, 3, 'dotScreen size uniform is ok');
  t.end();
});
