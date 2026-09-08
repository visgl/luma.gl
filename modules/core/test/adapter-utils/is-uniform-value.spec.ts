// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {isUniformValue} from '@luma.gl/core/adapter-utils/is-uniform-value';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

it('isUniformValue', async () => {
  const device = await getWebGLTestDevice();

  expect(isUniformValue(3), 'Number is uniform value').toBe(true);
  expect(isUniformValue(3.412), 'Number is uniform value').toBe(true);
  expect(isUniformValue(0), 'Number is uniform value').toBe(true);
  expect(isUniformValue(false), 'Boolean is uniform value').toBe(true);
  expect(isUniformValue(true), 'Boolean is uniform value').toBe(true);
  expect(isUniformValue([1, 2, 3, 4]), 'Number array is uniform value').toBe(true);
  expect(isUniformValue(new Float32Array([1, 2, 3, 4])), 'Number array is uniform value').toBe(
    true
  );

  expect(
    isUniformValue(device.createTexture({width: 1, height: 1})),
    'WEBGLTexture is not a uniform value'
  ).toBe(false);
  expect(isUniformValue(device.createSampler({})), 'WEBGLSampler is not a uniform value').toBe(
    false
  );
});
