// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGLTestDevice} from '../src/create-test-device';

test('getWebGLTestDevice refreshes the shared device after context loss', async () => {
  const webglDevice = await getWebGLTestDevice();
  const lostDevicePromise = webglDevice.lost;

  webglDevice.loseDevice();

  await lostDevicePromise;

  const refreshedWebglDevice = await getWebGLTestDevice();

  expect(refreshedWebglDevice).not.toBe(webglDevice);
  expect(refreshedWebglDevice.isLost).toBe(false);
});
