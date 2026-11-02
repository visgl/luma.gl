// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Device} from '@luma.gl/core';
import {getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {WEBGLFence} from '@luma.gl/core/webgl';

const GLSL_VERTEX_SOURCE = `#version 300 es
void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

function getActiveResourceCount(device: Device): number {
  return device.statsManager.getStats('Resource Counts').get('Resources Active').count;
}

it('WEBGLShader destruction keeps a borrowed native shader', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const nativeShader = gl.createShader(gl.VERTEX_SHADER)!;
  try {
    const countBeforeCreate = getActiveResourceCount(device);
    const shader = device.createShader({
      stage: 'vertex',
      source: GLSL_VERTEX_SOURCE,
      handle: nativeShader
    });
    await shader.asyncCompilationStatus;
    expect(shader.handle, 'wrapper uses the borrowed handle').toBe(nativeShader);

    shader.destroy();
    shader.destroy();
    expect(shader.destroyed, 'wrapper is marked destroyed').toBe(true);
    expect(getActiveResourceCount(device), 'active resource count is restored').toBe(
      countBeforeCreate
    );
    expect(gl.isShader(nativeShader), 'borrowed native shader is not deleted').toBe(true);
  } finally {
    gl.deleteShader(nativeShader);
  }
});

it('WEBGLFence destruction keeps a borrowed native sync', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const nativeSync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)!;
  try {
    const countBeforeCreate = getActiveResourceCount(device);
    // Device.createFence() takes no props, so wrap the borrowed sync directly
    const fence = new WEBGLFence(device, {handle: nativeSync});
    await fence.signaled;
    expect(fence.handle, 'wrapper uses the borrowed handle').toBe(nativeSync);

    fence.destroy();
    fence.destroy();
    expect(fence.destroyed, 'wrapper is marked destroyed').toBe(true);
    expect(getActiveResourceCount(device), 'active resource count is restored').toBe(
      countBeforeCreate
    );
    expect(gl.isSync(nativeSync), 'borrowed native sync is not deleted').toBe(true);
  } finally {
    gl.deleteSync(nativeSync);
  }
});
