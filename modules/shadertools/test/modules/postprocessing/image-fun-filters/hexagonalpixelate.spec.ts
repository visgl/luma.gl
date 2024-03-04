// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {hexagonalPixelate, ShaderModuleInstance} from '@luma.gl/shadertools';
import test from 'tape-promise/tape';

test('hexagonalPixelate#build/uniform', t => {
  const hexagonalPixelateModule = new ShaderModuleInstance(hexagonalPixelate);
  const uniforms = hexagonalPixelateModule.getUniforms({}, {});

  t.ok(uniforms, 'hexagonalPixelate module build is ok');
  t.deepEqual(uniforms.center, [0.5, 0.5], 'hexagonalPixelate center uniform is ok');
  t.equal(uniforms.scale, 10, 'hexagonalPixelate strength uniform is ok');
  t.end();
});
