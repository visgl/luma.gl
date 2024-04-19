// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ink, instantiateShaderModule} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('ink#build/uniform', t => {
  const inkModule = instantiateShaderModule(ink);
  const uniforms = inkModule.getUniforms({}, {});

  t.ok(uniforms, 'ink module build is ok');
  t.equal(uniforms.strength, 0.25, 'ink strength uniform is ok');
  t.end();
});
