// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {sepia, ShaderModuleInstance} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('sepia#build/uniform', t => {
  const sepiaModule = new ShaderModuleInstance(sepia);
  const uniforms = sepiaModule.getUniforms({}, {});

  t.ok(uniforms, 'sepia module build is ok');
  t.equal(uniforms.amount, 0.5, 'sepia amount uniform is ok');
  t.end();
});
