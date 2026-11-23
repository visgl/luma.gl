// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Device} from '@luma.gl/core';
import {
  getRasterDeviceLimits,
  planRasterDispatchStripes
} from '../../src/gpu-raster/raster-device-limits';

it('getRasterDeviceLimits reports the independent dispatch and storage ceilings', () => {
  const limits = getRasterDeviceLimits(createTestDevice());

  expect(limits.workgroupSize, 'shared primitives default to 256 invocations').toBe(256);
  expect(limits.bytesPerElement, 'packed scalar raster elements default to four bytes').toBe(4);
  expect(limits.maxComputeWorkgroupsPerDimension, 'retains the adapter dispatch cap').toBe(65535);
  expect(limits.maxDispatchElementCount, 'one dispatch covers 65535 × 256 rows').toBe(16776960);
  expect(
    limits.maxStorageBufferBindingElementCount,
    'a 128 MiB binding covers 33554432 four-byte elements'
  ).toBe(33554432);
  expect(limits.maxBufferElementCount, 'a 256 MiB physical buffer is tracked').toBe(67108864);
  expect(limits.maxStripeElementCount, 'the smallest independent limit wins').toBe(16776960);
  expect(limits.storageBufferOffsetAlignment, 'retains storage binding alignment').toBe(256);
  void 0;
});

it('planRasterDispatchStripes splits a 4096-square raster before the dispatch overflow', () => {
  const stripes = planRasterDispatchStripes(createTestDevice(), {width: 4096, height: 4096});

  expect(stripes.length, '4096² elements require more than 65535 workgroups').toBe(2);
  expect(
    stripes.map(({rowOffset, rowCount, elementCount, workgroupCount}) => ({
      rowOffset,
      rowCount,
      elementCount,
      workgroupCount
    })),
    'whole scanlines cover the complete raster without exceeding the X workgroup limit'
  ).toEqual([
    {rowOffset: 0, rowCount: 4095, elementCount: 16773120, workgroupCount: 65520},
    {rowOffset: 4095, rowCount: 1, elementCount: 4096, workgroupCount: 16}
  ]);
  expect(
    Boolean(stripes.every(stripe => stripe.workgroupCount <= 65535)),
    'every generated workgroup count satisfies the adapter limit'
  ).toBe(true);

  const exactBoundary = planRasterDispatchStripes(createTestDevice(), {
    width: 256,
    height: 65535
  });
  expect(exactBoundary.length, 'exact dispatch capacity still fits one dispatch').toBe(1);
  expect(exactBoundary[0].workgroupCount, 'the maximum workgroup count is inclusive').toBe(65535);
  void 0;
});

it('planRasterDispatchStripes budgets storage alignment prefixes and buffer allocation size', () => {
  const bindingLimited = createTestDevice({
    maxStorageBufferBindingSize: 3088,
    maxBufferSize: 16384
  });
  const alignedStripes = planRasterDispatchStripes(bindingLimited, {width: 257, height: 6});

  expect(
    alignedStripes.map(({rowCount, bindingByteOffset, bindingByteLength}) => ({
      rowCount,
      bindingByteOffset,
      bindingByteLength
    })),
    'unaligned logical scanline offsets include their required binding prefix'
  ).toEqual([
    {rowCount: 3, bindingByteOffset: 0, bindingByteLength: 3084},
    {rowCount: 2, bindingByteOffset: 3072, bindingByteLength: 2068},
    {rowCount: 1, bindingByteOffset: 5120, bindingByteLength: 1048}
  ]);
  expect(
    Boolean(alignedStripes.every(stripe => stripe.bindingByteLength <= 3088)),
    'no aligned storage binding exceeds the byte-length limit'
  ).toBe(true);

  const allocationLimited = createTestDevice({
    maxStorageBufferBindingSize: 65536,
    maxBufferSize: 32768
  });
  const allocationStripes = planRasterDispatchStripes(allocationLimited, {
    width: 1024,
    height: 10
  });
  expect(
    allocationStripes.map(stripe => stripe.rowCount),
    'the physical buffer allocation ceiling can be tighter than the binding ceiling'
  ).toEqual([8, 2]);
  void 0;
});

it('planRasterDispatchStripes preserves graph alignment on adapters with smaller offset minima', () => {
  const smallerAlignmentDevice = createTestDevice({
    minStorageBufferOffsetAlignment: 64,
    maxStorageBufferBindingSize: 340,
    maxBufferSize: 4096
  });
  const limits = getRasterDeviceLimits(smallerAlignmentDevice);
  const stripes = planRasterDispatchStripes(smallerAlignmentDevice, {width: 17, height: 9});

  expect(
    limits.storageBufferOffsetAlignment,
    'graph storage bindings retain their fixed 256-byte alignment'
  ).toBe(256);
  expect(
    stripes.map(({rowCount, bindingByteOffset, bindingByteLength}) => ({
      rowCount,
      bindingByteOffset,
      bindingByteLength
    })),
    'graph-aligned binding prefixes cannot be underestimated using the smaller adapter minimum'
  ).toEqual([
    {rowCount: 5, bindingByteOffset: 0, bindingByteLength: 340},
    {rowCount: 3, bindingByteOffset: 256, bindingByteLength: 288},
    {rowCount: 1, bindingByteOffset: 512, bindingByteLength: 100}
  ]);
  expect(
    Boolean(stripes.every(stripe => stripe.bindingByteOffset % 256 === 0)),
    'every planned stripe can be bound through the graph storage-view helper'
  ).toBe(true);
  expect(
    getRasterDeviceLimits(createTestDevice({minStorageBufferOffsetAlignment: 512}))
      .storageBufferOffsetAlignment,
    'stricter adapter alignment remains authoritative'
  ).toBe(512);
  void 0;
});

it('raster device limits explicitly gate unsupported workgroups and impossible scanlines', () => {
  const limitedDevice = createTestDevice({
    maxComputeInvocationsPerWorkgroup: 128,
    maxComputeWorkgroupSizeX: 128
  });

  expect(
    () => getRasterDeviceLimits(limitedDevice),
    '256-invocation shared primitives are rejected on 128-invocation adapters'
  ).toThrow(/workgroup size 256 exceeds device compute limits/);
  expect(
    getRasterDeviceLimits(limitedDevice, {workgroupSize: 128}).maxDispatchElementCount,
    'specialized raster kernels can explicitly use an adapter-supported workgroup size'
  ).toBe(8388480);
  expect(
    () => getRasterDeviceLimits(createTestDevice({type: 'webgl'})),
    'unsupported graphics backends are rejected'
  ).toThrow(/requires a WebGPU device/);
  expect(
    () => getRasterDeviceLimits(createTestDevice(), {workgroupSize: 0}),
    'empty workgroups are invalid'
  ).toThrow(/positive safe integer/);
  expect(
    () => getRasterDeviceLimits(createTestDevice(), {bytesPerElement: 0}),
    'empty element layouts are invalid'
  ).toThrow(/positive safe integer/);
  expect(
    () =>
      planRasterDispatchStripes(createTestDevice({maxStorageBufferBindingSize: 1024}), {
        width: 257,
        height: 1
      }),
    'a scanline larger than the storage binding must be tiled horizontally'
  ).toThrow(/one complete scanline/);
  expect(
    () => planRasterDispatchStripes(createTestDevice(), {width: 0, height: 10}),
    'empty raster scanlines are rejected'
  ).toThrow(/width must be a positive safe integer/);
  void 0;
});

function createTestDevice(
  options: {
    type?: Device['type'];
    maxTextureDimension2D?: number;
    maxComputeInvocationsPerWorkgroup?: number;
    maxComputeWorkgroupSizeX?: number;
    maxComputeWorkgroupsPerDimension?: number;
    maxStorageBufferBindingSize?: number;
    maxBufferSize?: number;
    minStorageBufferOffsetAlignment?: number;
  } = {}
): Device {
  return {
    type: options.type ?? 'webgpu',
    limits: {
      maxTextureDimension2D: options.maxTextureDimension2D ?? 8192,
      maxComputeInvocationsPerWorkgroup: options.maxComputeInvocationsPerWorkgroup ?? 256,
      maxComputeWorkgroupSizeX: options.maxComputeWorkgroupSizeX ?? 256,
      maxComputeWorkgroupsPerDimension: options.maxComputeWorkgroupsPerDimension ?? 65535,
      maxStorageBufferBindingSize: options.maxStorageBufferBindingSize ?? 134217728,
      maxBufferSize: options.maxBufferSize ?? 268435456,
      minStorageBufferOffsetAlignment: options.minStorageBufferOffsetAlignment ?? 256
    }
  } as Device;
}
