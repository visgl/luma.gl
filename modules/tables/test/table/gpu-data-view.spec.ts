// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {BufferLayout} from '@luma.gl/core';
import {GPUDataView, makeGPUDataViewFromAttribute} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';

test('GPUDataView validates and derives packed and strided ranges', t => {
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

  t.equal(packed.byteStride, 8, 'defaults stride to the format byte length');
  t.equal(packed.elementByteLength, 8, 'derives the element byte length');
  t.equal(packed.byteLength, 24, 'derives the packed occupied byte length');
  t.equal(strided.elementByteLength, 12, 'derives a strided element payload');
  t.equal(strided.byteLength, 28, 'includes inter-row padding in the occupied byte length');
  t.equal(empty.byteLength, 0, 'accepts an empty view at the end of the buffer');

  t.throws(
    () => new GPUDataView({buffer, format: 'uint32', length: -1}),
    /length must be a non-negative safe integer/,
    'rejects negative lengths'
  );
  t.throws(
    () => new GPUDataView({buffer, format: 'uint32', length: 1, byteOffset: -1}),
    /byteOffset must be a non-negative safe integer/,
    'rejects negative offsets'
  );
  t.throws(
    () => new GPUDataView({buffer, format: 'float32x2', length: 2, byteStride: 4}),
    /smaller than float32x2 byte length/,
    'rejects overlapping values'
  );
  t.throws(
    () =>
      new GPUDataView({
        buffer,
        format: 'uint32',
        length: Number.MAX_SAFE_INTEGER,
        byteStride: Number.MAX_SAFE_INTEGER
      }),
    /byte range must use safe integers/,
    'rejects unsafe computed ranges'
  );
  t.throws(
    () =>
      new GPUDataView({
        buffer,
        format: 'float32x4',
        length: 2,
        byteOffset: 48,
        byteStride: 16
      }),
    /exceeds its backing buffer/,
    'rejects ranges beyond the backing buffer'
  );

  buffer.destroy();
  t.end();
});

test('makeGPUDataViewFromAttribute exposes borrowed interleaved attributes', t => {
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

  t.equal(positions.buffer, buffer, 'positions borrow the source buffer');
  t.equal(featureIds.buffer, buffer, 'feature ids borrow the same source buffer');
  t.equal(positions.format, 'float32x3', 'preserves the attribute format');
  t.equal(positions.byteOffset, 4, 'applies the base and attribute offsets');
  t.equal(featureIds.byteOffset, 16, 'applies the second attribute offset');
  t.equal(featureIds.byteStride, 16, 'applies the interleaved row stride');

  t.throws(
    () =>
      makeGPUDataViewFromAttribute({
        buffer,
        bufferLayout,
        attributeName: 'missing',
        length: 1
      }),
    /does not contain attribute "missing"/,
    'rejects missing attributes'
  );
  t.throws(
    () =>
      makeGPUDataViewFromAttribute({
        buffer,
        bufferLayout: {...bufferLayout, byteStride: undefined},
        attributeName: 'positions',
        length: 1
      }),
    /requires byteStride/,
    'requires an explicit interleaved stride'
  );
  t.throws(
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
    /requires a format/,
    'rejects attributes without runtime format metadata'
  );

  buffer.destroy();
  t.end();
});
