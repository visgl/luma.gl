// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {_warp as warp, bulgePinch, swirl} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import test from '@luma.gl/devtools-extensions/tape-test-utils';

test('warp#build', t => {
  t.ok(warp.fs, 'warp module fragment shader is available');
  t.end();
});

test('bulgePinch#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(bulgePinch, {}, {});
  t.deepEqual(uniforms.center, [0.5, 0.5], 'bulge/pinch center defaults correctly');
  t.equal(uniforms.radius, 200, 'bulge/pinch radius defaults to 200');
  t.equal(uniforms.strength, 0.5, 'bulge/pinch strength defaults to 0.5');
  t.end();
});

test('swirl#build/uniform', t => {
  const uniforms = getShaderModuleUniforms(swirl, {}, {});
  t.deepEqual(uniforms.center, [0.5, 0.5], 'swirl center defaults correctly');
  t.equal(uniforms.radius, 200, 'swirl radius defaults to 200');
  t.equal(uniforms.angle, 3, 'swirl angle defaults to 3');
  t.end();
});
