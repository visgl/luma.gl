// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {gaussianBlur} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('gaussianBlur#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(gaussianBlur, {}, {});

  t.ok(uniforms, 'gaussianBlur module build is ok');
  t.equal(uniforms.radius, 12, 'gaussianBlur radius uniform is ok');
  t.deepEqual(uniforms.delta, [1, 0], 'gaussianBlur delta uniform is ok');
  t.end();
});
