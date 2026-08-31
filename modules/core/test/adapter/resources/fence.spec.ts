// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getTestDevices} from '@luma.gl/test-utils';
import {Fence} from '@luma.gl/core';

// Test basic fence functionality across supported devices

// WebGL, WebGPU and Null devices implement fences
const DEVICE_TYPES = ['null', 'webgl', 'webgpu'] as const;

it('Fence#signaled/destroy', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const fence = device.createFence();
    expect(Boolean(fence instanceof Fence), `${device.type} Fence construction successful`).toBe(
      true
    );

    await fence.signaled;
    expect(Boolean(fence.isSignaled()), `${device.type} Fence signals`).toBe(true);

    fence.destroy();
    expect(Boolean(`${device.type} Fence destroy successful`), '').toBe(true);

    fence.destroy();
    expect(Boolean(`${device.type} Fence repeated destroy successful`), '').toBe(true);
  }
  void 0;
});
