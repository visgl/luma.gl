// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ink, getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('ink#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(ink, {}, {});

  t.ok(uniforms, 'ink module build is ok');
  t.equal(uniforms.strength, 0.25, 'ink strength uniform is ok');
  t.end();
});
