// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {denoise, ShaderModuleInstance} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('denoise#build/uniform', t => {
  const denoiseModule = new ShaderModuleInstance(denoise);
  const uniforms = denoiseModule.getUniforms({}, {});

  t.ok(uniforms, 'denoise module build is ok');
  t.equal(uniforms.strength, 0.5, 'denoise strength uniform is ok');
  t.end();
});
