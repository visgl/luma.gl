// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {edgeWork, getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('edgeWork#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(edgeWork, {}, {});

  t.ok(uniforms, 'edgeWork module build is ok');
  t.equal(uniforms.radius, 2, 'edgeWork radius uniform is ok');
  t.deepEqual(uniforms.delta, [1, 0], 'edgeWork delta uniform is ok');
  t.end();
});
