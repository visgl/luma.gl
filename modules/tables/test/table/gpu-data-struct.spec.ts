// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {NullDevice} from '@luma.gl/test-utils';
import {
  GPUData,
  getBufferLayoutFromGPUDataStructFormat,
  isGPUDataStructFormat,
  type GPUDataView
} from '@luma.gl/tables';

test('GPUData applies WebGPU vertex alignment to packed struct fields', t => {
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

  t.ok(isGPUDataStructFormat(format), 'recognizes struct metadata');
  t.equal(format.fields.tag.byteOffset, 0, 'one-byte fields can start at any byte');
  t.equal(format.fields.pair.byteOffset, 2, 'two-byte formats use two-byte alignment');
  t.equal(format.fields.color.byteOffset, 4, 'four-byte formats use four-byte alignment');
  t.equal(format.fields.position.byteOffset, 8, 'larger formats use four-byte alignment');
  t.equal(format.components, 10, 'counts scalar components across fields');
  t.equal(format.rowByteLength, 20, 'tracks the final field payload');
  t.equal(format.byteStride, 20, 'rounds the row stride to four bytes');

  const singleByteFormat = new GPUData({
    buffer,
    length: 1,
    format: {tag: 'uint8'},
    layout: 'packed'
  }).format!;
  t.equal(singleByteFormat.rowByteLength, 1, 'does not count trailing padding as payload');
  t.equal(singleByteFormat.byteStride, 4, 'pads a one-byte row to a valid vertex stride');

  t.deepEqual(
    getBufferLayoutFromGPUDataStructFormat('vertices', format, {stepMode: 'instance'}),
    {
      name: 'vertices',
      byteStride: 20,
      stepMode: 'instance',
      attributes: [
        {attribute: 'tag', format: 'uint8', byteOffset: 0},
        {attribute: 'pair', format: 'uint8x2', byteOffset: 2},
        {attribute: 'color', format: 'unorm8x4', byteOffset: 4},
        {attribute: 'position', format: 'float32x3', byteOffset: 8}
      ]
    },
    'lowers struct fields to an interleaved BufferLayout'
  );

  t.throws(
    () => new GPUData({buffer, length: 1, format: {}, layout: 'packed'}),
    /at least one field/,
    'rejects empty structs'
  );
  t.throws(
    () =>
      new GPUData({
        buffer,
        length: 1,
        format: {legacy: 'uint8x3-webgl'},
        layout: 'packed'
      }),
    /WebGL-only format/,
    'rejects formats that are not valid WebGPU vertex attributes'
  );
  buffer.destroy();
  t.end();
});

test('GPUData applies WGSL storage carrier alignment to struct fields', t => {
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

  t.equal(format.layout, 'wgsl-storage', 'defaults to WGSL storage layout');
  t.equal(format.fields.tag.byteOffset, 0, 'places the first u32 carrier at zero');
  t.equal(format.fields.position.byteOffset, 16, 'aligns vec3 storage fields to 16 bytes');
  t.equal(format.fields.color.byteOffset, 28, 'uses the vec3 tail for the packed color carrier');
  t.equal(format.rowByteLength, 32, 'tracks physical field payloads');
  t.equal(format.byteStride, 32, 'aligns the complete storage struct');
  buffer.destroy();
  t.end();
});

test('GPUData exposes zero-copy typed struct children', t => {
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

  t.equal(data.stride, 2, 'defaults logical stride to the total scalar components');
  t.equal(data.rowByteLength, 8, 'derives row payload bytes from the struct format');
  t.equal(data.byteStride, 8, 'derives row stride from the struct format');
  t.equal(a?.buffer, buffer, 'child views borrow the parent buffer');
  t.equal(a?.byteOffset, 4, 'combines the parent and field offsets');
  t.equal(a?.byteStride, 8, 'preserves the parent row stride');
  t.equal(b?.byteOffset, 8, 'selects the second field');
  t.equal(data.getChildAt(0)?.format, 'sint32', 'selects children by declaration order');
  t.equal(data.getChildAt(1)?.format, 'float32', 'selects the next child by index');
  t.equal(data.getChildAt(2), null, 'returns null for an out-of-range child index');
  t.equal(missing, null, 'returns null for an unknown child name');

  const scalarData = new GPUData({buffer, format: 'float32', length: 1});
  t.equal(scalarData.getChild('value'), null, 'returns null for non-struct data');
  t.throws(
    () =>
      new GPUData({
        buffer,
        format: {a: 'sint32', b: 'float32'},
        layout: 'packed',
        length: 1,
        byteStride: 4
      }),
    /smaller than its struct row layout/,
    'rejects a row stride smaller than the struct layout'
  );

  buffer.destroy();
  t.end();
});
