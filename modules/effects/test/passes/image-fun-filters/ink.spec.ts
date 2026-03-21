// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ink} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('ink#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(ink, {}, {});

  t.ok(uniforms, 'ink module build is ok');
  t.equal(uniforms.strength, 0.25, 'ink strength uniform is ok');
  t.end();
});
