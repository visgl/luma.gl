import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {NullDevice} from '@luma.gl/test-utils';
import {
  GPUData,
  getBufferLayoutFromGPUDataStructFormat,
  isGPUDataStructFormat,
  type GPUDataView
} from '@luma.gl/gpgpu/gpu-data';

it('GPUData applies WebGPU vertex alignment to packed struct fields', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 64});
  const data = new GPUData({
    buffer,
    length: 1,
    format: {
      tag: 'uint8',
      pair: 'uint8x2',
      color: 'unorm8x4',
      position: 'float32x3'
    },
    layout: 'packed'
  });
  const format = data.format!;

  expect(Boolean(isGPUDataStructFormat(format)), 'recognizes struct metadata').toBe(true);
  expect(format.fields.tag.byteOffset, 'one-byte fields can start at any byte').toBe(0);
  expect(format.fields.pair.byteOffset, 'two-byte formats use two-byte alignment').toBe(2);
  expect(format.fields.color.byteOffset, 'four-byte formats use four-byte alignment').toBe(4);
  expect(format.fields.position.byteOffset, 'larger formats use four-byte alignment').toBe(8);
  expect(format.components, 'counts scalar components across fields').toBe(10);
  expect(format.rowByteLength, 'tracks the final field payload').toBe(20);
  expect(format.byteStride, 'rounds the row stride to four bytes').toBe(20);

  const singleByteFormat = new GPUData({
    buffer,
    length: 1,
    format: {tag: 'uint8'},
    layout: 'packed'
  }).format!;
  expect(singleByteFormat.rowByteLength, 'does not count trailing padding as payload').toBe(1);
  expect(singleByteFormat.byteStride, 'pads a one-byte row to a valid vertex stride').toBe(4);

  expect(
    getBufferLayoutFromGPUDataStructFormat('vertices', format, {stepMode: 'instance'}),
    'lowers struct fields to an interleaved BufferLayout'
  ).toEqual({
    name: 'vertices',
    byteStride: 20,
    stepMode: 'instance',
    attributes: [
      {attribute: 'tag', format: 'uint8', byteOffset: 0},
      {attribute: 'pair', format: 'uint8x2', byteOffset: 2},
      {attribute: 'color', format: 'unorm8x4', byteOffset: 4},
      {attribute: 'position', format: 'float32x3', byteOffset: 8}
    ]
  });

  expect(
    () => new GPUData({buffer, length: 1, format: {}, layout: 'packed'}),
    'rejects empty structs'
  ).toThrow(/at least one field/);
  expect(
    () =>
      new GPUData({
        buffer,
        length: 1,
        format: {legacy: 'uint8x3-webgl'},
        layout: 'packed'
      }),
    'rejects formats that are not valid WebGPU vertex attributes'
  ).toThrow(/WebGL-only format/);
  buffer.destroy();
});

it('GPUData applies WGSL storage carrier alignment to struct fields', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 32});
  const format = new GPUData({
    buffer,
    length: 1,
    format: {
      tag: 'uint8',
      position: 'float32x3',
      color: 'unorm8x4'
    }
  }).format!;

  expect(format.layout, 'defaults to WGSL storage layout').toBe('wgsl-storage');
  expect(format.fields.tag.byteOffset, 'places the first u32 carrier at zero').toBe(0);
  expect(format.fields.position.byteOffset, 'aligns vec3 storage fields to 16 bytes').toBe(16);
  expect(format.fields.color.byteOffset, 'uses the vec3 tail for the packed color carrier').toBe(
    28
  );
  expect(format.rowByteLength, 'tracks physical field payloads').toBe(32);
  expect(format.byteStride, 'aligns the complete storage struct').toBe(32);
  buffer.destroy();
});

it('GPUData exposes zero-copy typed struct children', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 24});
  const data: GPUData<{a: 'sint32'; b: 'float32'}, 'packed'> = new GPUData({
    buffer,
    format: {a: 'sint32', b: 'float32'},
    layout: 'packed',
    length: 2,
    byteOffset: 4
  });

  const a: GPUDataView<'sint32'> | null = data.getChild('a');
  const b: GPUDataView<'float32'> | null = data.getChild('b');
  const missing: null = data.getChild('missing');

  expect(data.stride, 'defaults logical stride to the total scalar components').toBe(2);
  expect(data.rowByteLength, 'derives row payload bytes from the struct format').toBe(8);
  expect(data.byteStride, 'derives row stride from the struct format').toBe(8);
  expect(a?.buffer, 'child views borrow the parent buffer').toBe(buffer);
  expect(a?.byteOffset, 'combines the parent and field offsets').toBe(4);
  expect(a?.byteStride, 'preserves the parent row stride').toBe(8);
  expect(b?.byteOffset, 'selects the second field').toBe(8);
  expect(data.getChildAt(0)?.format, 'selects children by declaration order').toBe('sint32');
  expect(data.getChildAt(1)?.format, 'selects the next child by index').toBe('float32');
  expect(data.getChildAt(2), 'returns null for an out-of-range child index').toBe(null);
  expect(missing, 'returns null for an unknown child name').toBe(null);

  const scalarData = new GPUData({buffer, format: 'float32', length: 1});
  expect(scalarData.getChild('value'), 'returns null for non-struct data').toBe(null);
  expect(
    () =>
      new GPUData({
        buffer,
        format: {a: 'sint32', b: 'float32'},
        layout: 'packed',
        length: 1,
        byteStride: 4
      }),
    'rejects a row stride smaller than the struct layout'
  ).toThrow(/smaller than its struct row layout/);

  buffer.destroy();
});
