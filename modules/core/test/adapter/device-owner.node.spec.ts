// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {luma, type Device} from '@luma.gl/core';
import {nullAdapter} from '@luma.gl/core/test-utils';
import {acquireDevice, DeviceOwner} from '../../src/api/adapter/device-owner';

function mockDevice(): Device {
  return {destroy: vi.fn()} as unknown as Device;
}

it('shares initialization and defers disposal until every lease ends', async () => {
  const device = mockDevice();
  const create = vi.fn(async () => device);
  const owner = new DeviceOwner(create);
  const first = owner.acquire();
  const second = owner.acquire();
  expect(first.device).toBe(second.device);
  first.release();
  first.release();
  const borrower = acquireDevice(await second.device);
  second.release();
  owner.dispose();
  expect(() => owner.acquire()).toThrow();
  expect(() => acquireDevice(device)).toThrow();
  expect(device.destroy).not.toHaveBeenCalled();
  borrower.release();
  owner.dispose();
  expect(device.destroy).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledTimes(1);
});

it('allows reacquisition after zero leases and releases during initialization', async () => {
  const device = mockDevice();
  const owner = new DeviceOwner(async () => device);
  const first = owner.acquire();
  first.release();
  const second = owner.acquire();
  expect(second.device).toBe(first.device);
  second.release();
  owner.dispose();
  await first.device;
  expect(device.destroy).toHaveBeenCalledTimes(1);
});

it('retries failed initialization and isolates releases from the failed generation', async () => {
  const device = mockDevice();
  const create = vi.fn(async () => device).mockRejectedValueOnce(new Error('failed'));
  const owner = new DeviceOwner(create);
  const failed = owner.acquire();
  await expect(failed.device).rejects.toThrow('failed');
  const retry = owner.acquire();
  await retry.device;
  failed.release();
  owner.dispose();
  expect(device.destroy).not.toHaveBeenCalled();
  retry.release();
  expect(device.destroy).toHaveBeenCalledTimes(1);
});

it('borrows an unmanaged raw device without destroying it', async () => {
  const device = mockDevice();
  const lease = acquireDevice(device);
  expect(await lease.device).toBe(device);
  lease.release();
  expect(device.destroy).not.toHaveBeenCalled();
});

it('enforces managed ownership on the null test backend', async () => {
  const owner = luma.createDeviceOwner({
    type: 'null',
    adapters: [nullAdapter],
    waitForPageLoad: false
  });
  const lease = owner.acquire();
  const device = await lease.device;
  expect(() => device.destroy()).toThrow(/lease/);
  lease.release();
  owner.dispose();
  expect(device.isLost).toBe(true);
});
