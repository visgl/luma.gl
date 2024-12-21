// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {pbrMaterial, getShaderModuleUniforms} from '@luma.gl/shadertools';

test('shadertools#pbrMaterial', t => {
  // @ts-expect-error Fix typing
  const uniforms = getShaderModuleUniforms(pbrMaterial, {}, {});
  t.ok(uniforms, 'Default pbr lighting uniforms ok');
  t.end();
});
