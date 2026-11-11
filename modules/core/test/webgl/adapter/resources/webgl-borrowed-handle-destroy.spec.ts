// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Resource, type Device} from '@luma.gl/core';
import {getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {WEBGLFence} from '@luma.gl/core/webgl';

class ResourceScope extends Resource {}

const GLSL_VERTEX_SOURCE = `#version 300 es
void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

function getActiveResourceCount(device: Device): number {
  return device.statsManager.getStats('Resource Counts').get('Resources Active').count;
}

it.each([
  'direct',
  'owner cascade'
] as const)('WEBGLShader %s destruction keeps a borrowed native shader', async destruction => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const owner = new ResourceScope();
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

    if (destruction === 'owner cascade') {
      shader.transferOwnershipTo(owner);
      owner.destroy();
      expect(shader.destroyed, 'owner destroys its child').toBe(true);
      expect(shader.owner, 'child detaches from its owner').toBe(null);
      owner.destroy();
      expect(owner.ownedResources, 'destroyed owner releases its children').toEqual([]);
    } else {
      shader.destroy();
    }
    shader.destroy();
    expect(shader.destroyed, 'wrapper is marked destroyed').toBe(true);
    expect(getActiveResourceCount(device), 'active resource count is restored').toBe(
      countBeforeCreate
    );
    expect(gl.isShader(nativeShader), 'borrowed native shader is not deleted').toBe(true);
  } finally {
    owner.destroy();
    gl.deleteShader(nativeShader);
  }
});

it.each([
  'direct',
  'owner cascade'
] as const)('WEBGLFence %s destruction keeps a borrowed native sync', async destruction => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const owner = new ResourceScope();
  const nativeSync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)!;
  try {
    const countBeforeCreate = getActiveResourceCount(device);
    // Device.createFence() takes no props, so wrap the borrowed sync directly
    const fence = new WEBGLFence(device, {handle: nativeSync});
    await fence.signaled;
    expect(fence.handle, 'wrapper uses the borrowed handle').toBe(nativeSync);

    if (destruction === 'owner cascade') {
      fence.transferOwnershipTo(owner);
      owner.destroy();
      expect(fence.destroyed, 'owner destroys its child').toBe(true);
      expect(fence.owner, 'child detaches from its owner').toBe(null);
      owner.destroy();
      expect(owner.ownedResources, 'destroyed owner releases its children').toEqual([]);
    } else {
      fence.destroy();
    }
    fence.destroy();
    expect(fence.destroyed, 'wrapper is marked destroyed').toBe(true);
    expect(getActiveResourceCount(device), 'active resource count is restored').toBe(
      countBeforeCreate
    );
    expect(gl.isSync(nativeSync), 'borrowed native sync is not deleted').toBe(true);
  } finally {
    owner.destroy();
    gl.deleteSync(nativeSync);
  }
});
