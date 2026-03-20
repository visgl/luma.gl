// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {checkType} from '@luma.gl/test-utils';
import {dirlight, ShaderModule} from '@luma.gl/shadertools';
import type {TapeTestFunction} from 'test/utils/vitest-tape';

checkType<ShaderModule>(dirlight);

export function registerDirlightTests(test: TapeTestFunction): void {
  test('shadertools#dirlight', t => {
    t.deepEqual(
      dirlight.getUniforms(),
      {lightDirection: [1, 1, 2]},
      'default dirlight uniforms use the exported default direction'
    );
    t.deepEqual(dirlight.getUniforms({}), {}, 'explicit empty dirlight props stay empty');
    t.deepEqual(
      dirlight.getUniforms({lightDirection: [2, 3, 4]}),
      {lightDirection: [2, 3, 4]},
      'custom lightDirection is preserved'
    );
    t.deepEqual(
      dirlight.defaultUniforms.lightDirection,
      [1, 1, 2],
      'default uniforms remain exported'
    );
    t.ok(dirlight.fs.includes('dirlight_filterColor'), 'fragment shader source is exported');
    t.ok(dirlight.vs.includes('dirlight_setNormal'), 'vertex shader source is exported');
    t.end();
  });
}
