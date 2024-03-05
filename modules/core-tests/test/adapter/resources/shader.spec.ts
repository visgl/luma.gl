// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getTestDevices} from '@luma.gl/test-utils';

const BAD_SHADER_SOURCE = `\
#define BAD_SHADERS
#define WILL_FAIL
vec4 goggledygook = 100;
#define AND_NEVER_GET_HERE
#define AND_NEVER_EVER_GET_HERE
`;

// TODO - sync shader compilation checks and throws are now a debug-only feature
test.skip('Shader', async t => {
  // Only test WebGL, WebGPU is not able to detect shader failures synchronously, but require polling.
  for (const device of await getTestDevices()) {
    t.throws(
      () => device.createShader({stage: 'vertex', source: BAD_SHADER_SOURCE}),
      `${device.type} device.createShader throws on bad shader source`
    );
  }
});
