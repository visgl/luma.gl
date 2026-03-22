import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { DeviceFeature } from '@luma.gl/core';

// TODO - we are not actually testing any features
const WEBGL2_ALWAYS_FEATURES: DeviceFeature[] = [];
const WEBGL2_NEVER_FEATURES: DeviceFeature[] = [];
test('Device#features (unknown features)', async () => {
  const webglDevice = await getWebGLTestDevice();

  // @ts-expect-error
  expect(webglDevice.features.has('unknown'), 'features.has should return false').toBeFalsy();
  // @ts-expect-error
  expect(webglDevice.features.has(''), 'features.has should return false').toBeFalsy();
});
test('Device#hasFeatures (WebGL)', async () => {
  const webglDevice = await getWebGLTestDevice();
  for (const feature of WEBGL2_ALWAYS_FEATURES) {
    expect(webglDevice.features.has(feature), `${feature} is always supported under WebGL`).toBe(true);
  }
  for (const feature of WEBGL2_NEVER_FEATURES) {
    expect(webglDevice.features.has(feature), `${feature} is never supported under WebGL`).toBe(false);
  }
});
