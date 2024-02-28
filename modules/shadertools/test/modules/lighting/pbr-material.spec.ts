// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {pbrMaterial} from '@luma.gl/shadertools';

test('shadertools#pbrMaterial', t => {
  const uniforms = pbrMaterial.getUniforms({});
  t.ok(uniforms, 'Default pbr lighting uniforms ok');
  t.end();
});
