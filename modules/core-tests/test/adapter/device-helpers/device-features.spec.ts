// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';
import {DeviceFeature} from '@luma.gl/core';

// true: always supported in WebGL2, false: never supported in WebGL1
const WEBGL2_ALWAYS_FEATURES: DeviceFeature[] = [
  'webgl',
  'glsl',
  // api support
  'transform-feedback-webgl'
  // features
];

const WEBGL2_NEVER_FEATURES: DeviceFeature[] = ['webgpu', 'wgsl'];

test('WebGLDevice#features (unknown features)', t => {
  // @ts-expect-error
  t.notOk(webglDevice.features.has('unknown'), 'features.has should return false');
  // @ts-expect-error
  t.notOk(webglDevice.features.has(''), 'features.has should return false');
  t.end();
});

test('WebGLDevice#hasFeatures (WebGL)', t => {
  t.notOk(webglDevice.features.has('webgpu'), 'features.has should return false');
  t.notOk(webglDevice.features.has('wgsl'), 'features.has should return false');
  // t.notOk(webglDevice.features.has('float32-renderable-webgl'), 'features.has should return false');


  for (const feature of WEBGL2_ALWAYS_FEATURES) {
    t.equal(webglDevice.features.has(feature), true, `${feature} is always supported under WebGL2`);
  }

  for (const feature of WEBGL2_NEVER_FEATURES) {
    t.equal(webglDevice.features.has(feature), false, `${feature} is never supported under WebGL1`);
  }
  t.end();
});
