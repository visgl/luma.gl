import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { isUniformValue } from '@luma.gl/core/adapter-utils/is-uniform-value';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
test('isUniformValue', async () => {
  const device = await getWebGLTestDevice();
  expect(isUniformValue(3), 'Number is uniform value').toBeTruthy();
  expect(isUniformValue(3.412), 'Number is uniform value').toBeTruthy();
  expect(isUniformValue(0), 'Number is uniform value').toBeTruthy();
  expect(isUniformValue(false), 'Boolean is uniform value').toBeTruthy();
  expect(isUniformValue(true), 'Boolean is uniform value').toBeTruthy();
  expect(isUniformValue([1, 2, 3, 4]), 'Number array is uniform value').toBeTruthy();
  expect(isUniformValue(new Float32Array([1, 2, 3, 4])), 'Number array is uniform value').toBeTruthy();
  expect(isUniformValue(device.createTexture({
    width: 1,
    height: 1
  })), 'WEBGLTexture is not a uniform value').toBeFalsy();
  expect(isUniformValue(device.createSampler({})), 'WEBGLSampler is not a uniform value').toBeFalsy();
});
