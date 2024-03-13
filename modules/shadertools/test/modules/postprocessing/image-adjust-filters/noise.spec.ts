// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {noise, ShaderModuleInstance} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('noise#build/uniform', t => {
  const noiseModule = new ShaderModuleInstance(noise);
  const uniforms = noiseModule.getUniforms({}, {});

  t.ok(uniforms, 'noise module build is ok');
  t.equal(uniforms.amount, 0.5, 'noise amount uniform is ok');
  t.end();
});
