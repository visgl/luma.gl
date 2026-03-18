// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getTestDevices} from '@luma.gl/test-utils';
import {Fence} from '@luma.gl/core';

// Test basic fence functionality across supported devices

// WebGL, WebGPU and Null devices implement fences
const DEVICE_TYPES = ['null', 'webgl', 'webgpu'] as const;

test('Fence#signaled/destroy', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const fence = device.createFence();
    t.ok(fence instanceof Fence, `${device.type} Fence construction successful`);

    await fence.signaled;
    t.ok(fence.isSignaled(), `${device.type} Fence signals`);

    fence.destroy();
    t.pass(`${device.type} Fence destroy successful`);

    fence.destroy();
    t.pass(`${device.type} Fence repeated destroy successful`);
  }
  t.end();
});
