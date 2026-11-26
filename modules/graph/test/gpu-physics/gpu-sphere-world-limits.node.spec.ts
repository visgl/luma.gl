// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core/gpu-command-graph';
import {GPUSphereWorld} from '../../src/gpu-physics';

test('GPUSphereWorld rejects oversized storage before adding graph resources', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device, 'limits', {
    value: {
      ...device.limits,
      maxComputeWorkgroupsPerDimension: 65535,
      maxStorageBufferBindingSize: 16
    }
  });
  const positions = device.createBuffer({byteLength: 32, usage: Buffer.STORAGE});
  const velocities = device.createBuffer({byteLength: 32, usage: Buffer.STORAGE});
  const graph = new GPUCommandGraph(device);
  const importBuffer = vi.spyOn(graph, 'importBuffer');
  try {
    for (const maximumContacts of [1, 32]) {
      const world = new GPUSphereWorld({count: 2, positions, velocities, maximumContacts});
      expect(() => world.addToGraph(graph)).toThrow(/maxStorageBufferBindingSize/);
      world.destroy();
    }
    expect(importBuffer).not.toHaveBeenCalled();
  } finally {
    importBuffer.mockRestore();
    positions.destroy();
    velocities.destroy();
    device.destroy();
  }
});
