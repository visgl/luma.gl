// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getTestDevices} from '@luma.gl/test-utils';

const BAD_SHADER_SOURCE = `\
#define BAD_SHADERS
#define WILL_FAIL
vec4 goggledygook = 100;
#define AND_NEVER_GET_HERE
#define AND_NEVER_EVER_GET_HERE
`;

// TODO - sync shader compilation checks and throws are now a debug-only feature
it('Shader', async () => {
  // Only test WebGL, WebGPU is not able to detect shader failures synchronously, but require polling.
  for (const device of await getTestDevices()) {
    if (device.type === 'webgl') {
      const createBadShader = () =>
        device.createShader({stage: 'vertex', source: BAD_SHADER_SOURCE});
      if (device.features.has('compilation-status-async-webgl')) {
        const badShader = createBadShader();
        const compilationStatus = await badShader.asyncCompilationStatus;
        expect(
          compilationStatus,
          `${device.type} device.createShader reports async compilation error`
        ).toBe('error');
      } else {
        expect(
          createBadShader,
          `${device.type} device.createShader throws on bad shader source`
        ).toThrow();
      }
    } else {
      void 0;
    }
  }
  void 0;
});
