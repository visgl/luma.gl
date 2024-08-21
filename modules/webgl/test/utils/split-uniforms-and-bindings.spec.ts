// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {WEBGLSampler, WEBGLTexture} from '@luma.gl/webgl';
import {splitUniformsAndBindings} from '@luma.gl/webgl/utils/split-uniforms-and-bindings';
import {webglDevice as device} from '@luma.gl/test-utils';
import test from 'tape-promise/tape';

test('splitUniformsAndBindings', t => {
  const mixed: Parameters<typeof splitUniformsAndBindings>[0] = {
    array: [1, 2, 3, 4],
    boolean: true,
    number: 123,
    sampler: new WEBGLSampler(device, {}),
    texture: new WEBGLTexture(device, {})
  };
  const {bindings, uniforms} = splitUniformsAndBindings(mixed);
  t.deepEquals(Object.keys(bindings), ['sampler', 'texture'], 'bindings correctly extracted');
  t.deepEquals(
    Object.keys(uniforms),
    ['array', 'boolean', 'number'],
    'bindings correctly extracted'
  );
  t.end();
});
