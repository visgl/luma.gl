// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getNullTestDevice, _refreshLostCachedTestDevice} from '../../src/create-test-device';

test('NullAdapter imports from the ESM package entry without circular init errors', async () => {
  // Import the local entry file directly to avoid workspace alias resolution mixing src/dist modules.
  // This regression is about entry-module initialization, not package alias behavior.
  const testUtilsModule = await import('../../src/index');

  expect(testUtilsModule.nullAdapter.type).toBe('null');
  expect(testUtilsModule.NullDevice.name).toBe('NullDevice');
}, 15000);

test('refreshLostCachedTestDevice recreates a lost cached device', async () => {
  let cachedDevicePromise: Promise<{isLost: boolean; id: string}> | null = Promise.resolve({
    isLost: true,
    id: 'lost-device'
  });
  let createCount = 0;

  const refreshedDevice = await _refreshLostCachedTestDevice(
    async () => {
      if (cachedDevicePromise) {
        return cachedDevicePromise;
      }

      createCount++;
      cachedDevicePromise = Promise.resolve({
        isLost: false,
        id: `fresh-device-${createCount}`
      });
      return cachedDevicePromise;
    },
    () => {
      cachedDevicePromise = null;
    }
  );

  expect(refreshedDevice.isLost).toBe(false);
  expect(refreshedDevice.id).toBe('fresh-device-1');
  expect(createCount).toBe(1);
});

test('cached test devices reject terminal lifecycle operations', async () => {
  const device = await getNullTestDevice();

  expect(Object.getOwnPropertyDescriptor(device, 'destroy')?.writable).toBe(false);
  expect(Object.getOwnPropertyDescriptor(device, 'detach')?.writable).toBe(false);
  expect(() => device.destroy()).toThrow(/Cached test devices.*cannot be destroyed/);
  expect(() => device.detach()).toThrow(/Cached test devices.*cannot be detached/);
});
