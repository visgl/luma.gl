// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, test, vi} from 'vitest';

test.each([
  false,
  true
])('GPUData retains ownership through transfer and either destruction order: %s', ownerFirst => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({data: new Uint32Array(4)});
  const destroy = vi.spyOn(buffer, 'destroy');
  const owner = new GPUData({buffer, format: 'uint32', length: 4, ownsBuffer: true});
  const retained = new GPUData({buffer, format: 'uint32', length: 1});
  const transferred = new GPUData({buffer, format: 'uint32', length: 1});
  owner.retainBufferOwnership(retained);
  retained.transferBufferOwnership(transferred);
  retained.destroy();
  expect(destroy).not.toHaveBeenCalled();
  const first = ownerFirst ? owner : transferred;
  const last = ownerFirst ? transferred : owner;
  first.destroy();
  first.destroy();
  expect(destroy).not.toHaveBeenCalled();
  expect(last.ownsBuffer).toBe(true);
  last.destroy();
  last.destroy();
  expect(destroy).toHaveBeenCalledTimes(1);
});

test('GPUData borrowers cannot fabricate or overwrite ownership references', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({data: new Uint32Array(1)});
  const owner = new GPUData({buffer, format: 'uint32', length: 1, ownsBuffer: true});
  const borrower = new GPUData({buffer, format: 'uint32', length: 1});
  expect(() => borrower.retainBufferOwnership(owner)).toThrow();
  expect(() => owner.retainBufferOwnership(owner)).toThrow();
  borrower.destroy();
  expect(buffer.destroyed).toBe(false);
  owner.destroy();
  expect(buffer.destroyed).toBe(true);
});
