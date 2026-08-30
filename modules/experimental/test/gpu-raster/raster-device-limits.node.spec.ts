// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import type {Device} from '@luma.gl/core';
import {
  getRasterDeviceLimits,
  planRasterDispatchStripes
} from '../../src/gpu-raster/raster-device-limits';

type TestDeviceOptions = {
  type?: Device['type'];
  maxTextureDimension2D?: number;
  maxComputeInvocationsPerWorkgroup?: number;
  maxComputeWorkgroupSizeX?: number;
  maxComputeWorkgroupsPerDimension?: number;
  maxStorageBufferBindingSize?: number;
  maxBufferSize?: number;
  minStorageBufferOffsetAlignment?: number;
};

test('getRasterDeviceLimits reports the independent dispatch and storage ceilings', testCase => {
  const limits = getRasterDeviceLimits(createTestDevice());

  testCase.equal(limits.workgroupSize, 256, 'shared primitives default to 256 invocations');
  testCase.equal(limits.bytesPerElement, 4, 'packed scalar raster elements default to four bytes');
  testCase.equal(
    limits.maxComputeWorkgroupsPerDimension,
    65535,
    'retains the adapter dispatch cap'
  );
  testCase.equal(limits.maxDispatchElementCount, 16776960, 'one dispatch covers 65535 × 256 rows');
  testCase.equal(
    limits.maxStorageBufferBindingElementCount,
    33554432,
    'a 128 MiB binding covers 33554432 four-byte elements'
  );
  testCase.equal(limits.maxBufferElementCount, 67108864, 'a 256 MiB physical buffer is tracked');
  testCase.equal(limits.maxStripeElementCount, 16776960, 'the smallest independent limit wins');
  testCase.equal(limits.storageBufferOffsetAlignment, 256, 'retains storage binding alignment');
  testCase.end();
});

test('planRasterDispatchStripes splits a 4096-square raster before the dispatch overflow', testCase => {
  const stripes = planRasterDispatchStripes(createTestDevice(), {width: 4096, height: 4096});

  testCase.equal(stripes.length, 2, '4096² elements require more than 65535 workgroups');
  testCase.deepEqual(
    stripes.map(({rowOffset, rowCount, elementCount, workgroupCount}) => ({
      rowOffset,
      rowCount,
      elementCount,
      workgroupCount
    })),
    [
      {rowOffset: 0, rowCount: 4095, elementCount: 16773120, workgroupCount: 65520},
      {rowOffset: 4095, rowCount: 1, elementCount: 4096, workgroupCount: 16}
    ],
    'whole scanlines cover the complete raster without exceeding the X workgroup limit'
  );
  testCase.ok(
    stripes.every(stripe => stripe.workgroupCount <= 65535),
    'every generated workgroup count satisfies the adapter limit'
  );

  const exactBoundary = planRasterDispatchStripes(createTestDevice(), {
    width: 256,
    height: 65535
  });
  testCase.equal(exactBoundary.length, 1, 'exact dispatch capacity still fits one dispatch');
  testCase.equal(
    exactBoundary[0].workgroupCount,
    65535,
    'the maximum workgroup count is inclusive'
  );
  testCase.end();
});

test('planRasterDispatchStripes budgets storage alignment prefixes and buffer allocation size', testCase => {
  const bindingLimited = createTestDevice({
    maxStorageBufferBindingSize: 3088,
    maxBufferSize: 16384
  });
  const alignedStripes = planRasterDispatchStripes(bindingLimited, {width: 257, height: 6});

  testCase.deepEqual(
    alignedStripes.map(({rowCount, bindingByteOffset, bindingByteLength}) => ({
      rowCount,
      bindingByteOffset,
      bindingByteLength
    })),
    [
      {rowCount: 3, bindingByteOffset: 0, bindingByteLength: 3084},
      {rowCount: 2, bindingByteOffset: 3072, bindingByteLength: 2068},
      {rowCount: 1, bindingByteOffset: 5120, bindingByteLength: 1048}
    ],
    'unaligned logical scanline offsets include their required binding prefix'
  );
  testCase.ok(
    alignedStripes.every(stripe => stripe.bindingByteLength <= 3088),
    'no aligned storage binding exceeds the byte-length limit'
  );

  const allocationLimited = createTestDevice({
    maxStorageBufferBindingSize: 65536,
    maxBufferSize: 32768
  });
  const allocationStripes = planRasterDispatchStripes(allocationLimited, {
    width: 1024,
    height: 10
  });
  testCase.deepEqual(
    allocationStripes.map(stripe => stripe.rowCount),
    [8, 2],
    'the physical buffer allocation ceiling can be tighter than the binding ceiling'
  );
  testCase.end();
});

test('planRasterDispatchStripes preserves graph alignment on adapters with smaller offset minima', testCase => {
  const smallerAlignmentDevice = createTestDevice({
    minStorageBufferOffsetAlignment: 64,
    maxStorageBufferBindingSize: 340,
    maxBufferSize: 4096
  });
  const limits = getRasterDeviceLimits(smallerAlignmentDevice);
  const stripes = planRasterDispatchStripes(smallerAlignmentDevice, {width: 17, height: 9});

  testCase.equal(
    limits.storageBufferOffsetAlignment,
    256,
    'graph storage bindings retain their fixed 256-byte alignment'
  );
  testCase.deepEqual(
    stripes.map(({rowCount, bindingByteOffset, bindingByteLength}) => ({
      rowCount,
      bindingByteOffset,
      bindingByteLength
    })),
    [
      {rowCount: 5, bindingByteOffset: 0, bindingByteLength: 340},
      {rowCount: 3, bindingByteOffset: 256, bindingByteLength: 288},
      {rowCount: 1, bindingByteOffset: 512, bindingByteLength: 100}
    ],
    'graph-aligned binding prefixes cannot be underestimated using the smaller adapter minimum'
  );
  testCase.ok(
    stripes.every(stripe => stripe.bindingByteOffset % 256 === 0),
    'every planned stripe can be bound through the graph storage-view helper'
  );
  testCase.equal(
    getRasterDeviceLimits(createTestDevice({minStorageBufferOffsetAlignment: 512}))
      .storageBufferOffsetAlignment,
    512,
    'stricter adapter alignment remains authoritative'
  );
  testCase.end();
});

test('raster device limits explicitly gate unsupported workgroups and impossible scanlines', testCase => {
  const limitedDevice = createTestDevice({
    maxComputeInvocationsPerWorkgroup: 128,
    maxComputeWorkgroupSizeX: 128
  });

  testCase.throws(
    () => getRasterDeviceLimits(limitedDevice),
    /workgroup size 256 exceeds device compute limits/,
    '256-invocation shared primitives are rejected on 128-invocation adapters'
  );
  testCase.equal(
    getRasterDeviceLimits(limitedDevice, {workgroupSize: 128}).maxDispatchElementCount,
    8388480,
    'specialized raster kernels can explicitly use an adapter-supported workgroup size'
  );
  testCase.throws(
    () => getRasterDeviceLimits(createTestDevice({type: 'webgl'})),
    /requires a WebGPU device/,
    'unsupported graphics backends are rejected'
  );
  testCase.throws(
    () => getRasterDeviceLimits(createTestDevice(), {workgroupSize: 0}),
    /positive safe integer/,
    'empty workgroups are invalid'
  );
  testCase.throws(
    () => getRasterDeviceLimits(createTestDevice(), {bytesPerElement: 0}),
    /positive safe integer/,
    'empty element layouts are invalid'
  );
  testCase.throws(
    () =>
      planRasterDispatchStripes(createTestDevice({maxStorageBufferBindingSize: 1024}), {
        width: 257,
        height: 1
      }),
    /one complete scanline/,
    'a scanline larger than the storage binding must be tiled horizontally'
  );
  testCase.throws(
    () => planRasterDispatchStripes(createTestDevice(), {width: 0, height: 10}),
    /width must be a positive safe integer/,
    'empty raster scanlines are rejected'
  );
  testCase.end();
});

function createTestDevice(options: TestDeviceOptions = {}): Device {
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
