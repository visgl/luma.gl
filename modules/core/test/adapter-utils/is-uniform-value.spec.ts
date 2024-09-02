// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isUniformValue} from '@luma.gl/core/adapter-utils/is-uniform-value';
import {WEBGLSampler, WEBGLTexture} from '@luma.gl/webgl';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import test from 'tape-promise/tape';

test('isUniformValue', async t => {
  const device = await getWebGLTestDevice();

  t.ok(isUniformValue(3), 'Number is uniform value');
  t.ok(isUniformValue(3.412), 'Number is uniform value');
  t.ok(isUniformValue(0), 'Number is uniform value');
  t.ok(isUniformValue(false), 'Boolean is uniform value');
  t.ok(isUniformValue(true), 'Boolean is uniform value');
  t.ok(isUniformValue([1, 2, 3, 4]), 'Number array is uniform value');
  t.ok(isUniformValue(new Float32Array([1, 2, 3, 4])), 'Number array is uniform value');

  t.notOk(isUniformValue(new WEBGLTexture(device, {})), 'WEBGLTexture is not a uniform value');
  t.notOk(isUniformValue(new WEBGLSampler(device, {})), 'WEBGLSampler is not a uniform value');
  t.end();
});
