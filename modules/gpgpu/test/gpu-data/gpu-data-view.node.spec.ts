import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {BufferLayout} from '@luma.gl/core';
import {GPUDataView, makeGPUDataViewFromAttribute} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';

it('GPUDataView validates and derives packed and strided ranges', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 64});
  const packed = new GPUDataView({buffer, format: 'float32x2', length: 3});
  const strided = new GPUDataView({
    buffer,
    format: 'float32x3',
    length: 2,
    byteOffset: 4,
    byteStride: 16
  });
  const empty = new GPUDataView({
    buffer,
    format: 'uint32',
    length: 0,
    byteOffset: buffer.byteLength
  });

  expect(packed.byteStride, 'defaults stride to the format byte length').toBe(8);
  expect(packed.elementByteLength, 'derives the element byte length').toBe(8);
  expect(packed.byteLength, 'derives the packed occupied byte length').toBe(24);
  expect(strided.elementByteLength, 'derives a strided element payload').toBe(12);
  expect(strided.byteLength, 'includes inter-row padding in the occupied byte length').toBe(28);
  expect(empty.byteLength, 'accepts an empty view at the end of the buffer').toBe(0);

  expect(
    () => new GPUDataView({buffer, format: 'uint32', length: -1}),
    'rejects negative lengths'
  ).toThrow(/length must be a non-negative safe integer/);
  expect(
    () => new GPUDataView({buffer, format: 'uint32', length: 1, byteOffset: -1}),
    'rejects negative offsets'
  ).toThrow(/byteOffset must be a non-negative safe integer/);
  expect(
    () => new GPUDataView({buffer, format: 'float32x2', length: 2, byteStride: 4}),
    'rejects overlapping values'
  ).toThrow(/smaller than float32x2 byte length/);
  expect(
    () =>
      new GPUDataView({
        buffer,
        format: 'uint32',
        length: Number.MAX_SAFE_INTEGER,
        byteStride: Number.MAX_SAFE_INTEGER
      }),
    'rejects unsafe computed ranges'
  ).toThrow(/byte range must use safe integers/);
  expect(
    () =>
      new GPUDataView({
        buffer,
        format: 'float32x4',
        length: 2,
        byteOffset: 48,
        byteStride: 16
      }),
    'rejects ranges beyond the backing buffer'
  ).toThrow(/exceeds its backing buffer/);

  buffer.destroy();
});

it('makeGPUDataViewFromAttribute exposes borrowed interleaved attributes', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 40});
  const bufferLayout: BufferLayout = {
    name: 'vertices',
    byteStride: 16,
    attributes: [
      {attribute: 'positions', format: 'float32x3', byteOffset: 0},
      {attribute: 'featureIds', format: 'uint32', byteOffset: 12}
    ]
  };
  const positions = makeGPUDataViewFromAttribute({
    buffer,
    bufferLayout,
    attributeName: 'positions',
    length: 2,
    byteOffset: 4
  });
  const featureIds = makeGPUDataViewFromAttribute({
    buffer,
    bufferLayout,
    attributeName: 'featureIds',
    length: 2,
    byteOffset: 4
  });

  expect(positions.buffer, 'positions borrow the source buffer').toBe(buffer);
  expect(featureIds.buffer, 'feature ids borrow the same source buffer').toBe(buffer);
  expect(positions.format, 'preserves the attribute format').toBe('float32x3');
  expect(positions.byteOffset, 'applies the base and attribute offsets').toBe(4);
  expect(featureIds.byteOffset, 'applies the second attribute offset').toBe(16);
  expect(featureIds.byteStride, 'applies the interleaved row stride').toBe(16);

  expect(
    () =>
      makeGPUDataViewFromAttribute({
        buffer,
        bufferLayout,
        attributeName: 'missing',
        length: 1
      }),
    'rejects missing attributes'
  ).toThrow(/does not contain attribute "missing"/);
  expect(
    () =>
      makeGPUDataViewFromAttribute({
        buffer,
        bufferLayout: {...bufferLayout, byteStride: undefined},
        attributeName: 'positions',
        length: 1
      }),
    'requires an explicit interleaved stride'
  ).toThrow(/requires byteStride/);
  expect(
    () =>
      makeGPUDataViewFromAttribute({
        buffer,
        bufferLayout: {
          ...bufferLayout,
          attributes: [{attribute: 'positions', byteOffset: 0} as never]
        },
        attributeName: 'positions',
        length: 1
      }),
    'rejects attributes without runtime format metadata'
  ).toThrow(/requires a format/);

  buffer.destroy();
});
