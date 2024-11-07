// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {DeviceFeature} from '@luma.gl/core';

// TODO - we are not actually testing any features
const WEBGL2_ALWAYS_FEATURES: DeviceFeature[] = [];
const WEBGL2_NEVER_FEATURES: DeviceFeature[] = [];

test('Device#features (unknown features)', async t => {
  const webglDevice = await getWebGLTestDevice();

  // @ts-expect-error
  t.notOk(webglDevice.features.has('unknown'), 'features.has should return false');
  // @ts-expect-error
  t.notOk(webglDevice.features.has(''), 'features.has should return false');
  t.end();
});

test('Device#hasFeatures (WebGL)', async t => {
  const webglDevice = await getWebGLTestDevice();

  for (const feature of WEBGL2_ALWAYS_FEATURES) {
    t.equal(webglDevice.features.has(feature), true, `${feature} is always supported under WebGL`);
  }

  for (const feature of WEBGL2_NEVER_FEATURES) {
    t.equal(webglDevice.features.has(feature), false, `${feature} is never supported under WebGL`);
  }
  t.end();
});
