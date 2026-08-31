// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  GPUData,
  GPUVector,
  getGPUVectorBuffer,
  getGPUVectorElementFormat,
  getGPUVectorFormatInfo,
  getGPUVectorData,
  getRequiredGPUVector,
  isGPUVectorFormatCompatibleWithShaderType,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat
} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {NullDevice} from '@luma.gl/test-utils';

it('GPUVector format helpers parse fixed and variable-length formats', () => {
  const fixedInfo = getGPUVectorFormatInfo('float32x3');
  const vertexListInfo = getGPUVectorFormatInfo('vertex-list<unorm8x4>');
  const valueListInfo = getGPUVectorFormatInfo('value-list<uint8>');

  expect(fixedInfo.elementFormat, 'fixed vector element format is unchanged').toBe('float32x3');
  expect(fixedInfo.vertexList, 'fixed vector is not a vertex list').toBe(false);
  expect(fixedInfo.valueList, 'fixed vector is not a value list').toBe(false);
  expect(fixedInfo.byteLength, 'fixed vector byte length is decoded').toBe(12);
  expect(vertexListInfo.elementFormat, 'vertex-list exposes its element format').toBe('unorm8x4');
  expect(vertexListInfo.vertexList, 'vertex-list marker is decoded').toBe(true);
  expect(vertexListInfo.valueList, 'vertex-list is not a value-list').toBe(false);
  expect(vertexListInfo.primitiveType, 'normalized list elements expose f32 values').toBe('f32');
  expect(valueListInfo.elementFormat, 'value-list exposes its element format').toBe('uint8');
  expect(valueListInfo.vertexList, 'value-list is not a vertex-list').toBe(false);
  expect(valueListInfo.valueList, 'value-list marker is decoded').toBe(true);
  expect(getGPUVectorElementFormat('vertex-list<unorm8x4>')).toBe('unorm8x4');
  expect(getGPUVectorElementFormat('value-list<uint8>')).toBe('uint8');
  expect(
    Boolean(isVertexListGPUVectorFormat('vertex-list<unorm8x4>')),
    'recognizes vertex-list syntax'
  ).toBe(true);
  expect(
    Boolean(isValueListGPUVectorFormat('value-list<uint8>')),
    'recognizes value-list syntax'
  ).toBe(true);
  expect(
    Boolean(isVertexListGPUVectorFormat('list<unorm8x4>')),
    'generic list syntax is not accepted'
  ).toBe(false);
  expect(
    () => getGPUVectorFormatInfo('list<unorm8x4>' as never),
    'generic list syntax is reserved'
  ).toThrow(/Unsupported GPUVector format/);
});

it('GPUVector format helpers validate shader compatibility', () => {
  expect(
    Boolean(isGPUVectorFormatCompatibleWithShaderType('unorm8x4', 'vec4<f32>')),
    'normalized RGBA8 can feed vec4<f32>'
  ).toBe(true);
  expect(
    Boolean(isGPUVectorFormatCompatibleWithShaderType('float32x3', 'vec3<f32>')),
    'float32x3 can feed vec3<f32>'
  ).toBe(true);
  expect(
    Boolean(isGPUVectorFormatCompatibleWithShaderType('uint32x2', 'vec2<i32>')),
    'unsigned integer memory cannot feed signed integer shader values'
  ).toBe(false);
  expect(
    Boolean(isGPUVectorFormatCompatibleWithShaderType('float32x3', 'vec4<f32>')),
    'component mismatch is rejected'
  ).toBe(false);
});

it('GPUVector accepts format as canonical metadata and synthesizes table layouts', () => {
  const device = new NullDevice({});
  const colors = new GPUVector({
    type: 'buffer',
    name: 'colors',
    buffer: device.createBuffer({byteLength: 4}),
    format: 'unorm8x4',
    length: 1,
    stride: 4,
    byteStride: 4,
    ownsBuffer: true
  });
  const table = new GPUTable({vectors: {colors}});

  expect(colors.format, 'stores the canonical GPUVector format').toBe('unorm8x4');
  expect(Boolean('type' in colors), 'drops the deprecated type alias').toBe(false);
  expect(table.bufferLayout[0].format, 'table layout uses GPUVector.format').toBe('unorm8x4');

  table.destroy();
});

it('GPUTable rejects vertex-list vectors without adapter-specific layout handling', () => {
  const device = new NullDevice({});
  const colors = new GPUVector({
    type: 'buffer',
    name: 'colors',
    buffer: device.createBuffer({byteLength: 4}),
    format: 'vertex-list<unorm8x4>',
    length: 1,
    stride: 4,
    byteStride: 4,
    ownsBuffer: true
  });

  expect(
    () => new GPUTable({vectors: {colors}}),
    'generic table layout synthesis rejects vertex lists'
  ).toThrow(/cannot synthesize a generic buffer layout for vertex-list vector/);

  colors.destroy();
});

it('GPUVector rejects explicitly mismatched chunk formats', () => {
  const device = new NullDevice({});
  const firstBuffer = device.createBuffer({byteLength: 4});
  const secondBuffer = device.createBuffer({byteLength: 4});
  const firstData = new GPUData({
    buffer: firstBuffer,
    format: 'unorm8x4',
    length: 1,
    byteStride: 4
  });
  const secondData = new GPUData({
    buffer: secondBuffer,
    format: 'uint8x4',
    length: 1,
    byteStride: 4
  });
  const colors = new GPUVector({
    type: 'data',
    name: 'colors',
    data: [firstData],
    ownsData: false
  });

  expect(firstData.buffer, 'GPUData accepts the same Buffer input as GPUVector').toBe(firstBuffer);
  expect(
    () =>
      new GPUVector({
        type: 'data',
        name: 'mixedColors',
        data: [firstData, secondData],
        ownsData: false
      }),
    'constructor rejects mixed explicit formats'
  ).toThrow(/data chunks must share the declared format/);
  expect(() => colors.addData(secondData), 'addData rejects mixed explicit formats').toThrow(
    /requires matching formats/
  );

  firstBuffer.destroy();
  secondBuffer.destroy();
});

it('GPUVector honors borrowed GPUData chunk ownership', () => {
  const device = new NullDevice({});
  const borrowedBuffer = device.createBuffer({byteLength: 4});
  const borrowedData = new GPUData({
    buffer: borrowedBuffer,
    format: 'unorm8x4',
    length: 1,
    byteStride: 4,
    ownsBuffer: true
  });
  const borrowedVector = new GPUVector({
    type: 'data',
    name: 'borrowedColors',
    data: [borrowedData],
    ownsData: false
  });

  borrowedVector.destroy();

  expect(
    Boolean(borrowedVector.ownsBuffer),
    'borrowed data vectors do not report retained GPU ownership'
  ).toBe(false);
  expect(
    Boolean(borrowedBuffer.destroyed),
    'borrowed data vector destroy leaves the buffer alive'
  ).toBe(false);

  borrowedData.destroy();
  expect(
    Boolean(borrowedBuffer.destroyed),
    'original GPUData owner can still destroy the buffer'
  ).toBe(true);

  const ownedBuffer = device.createBuffer({byteLength: 4});
  const ownedData = new GPUData({
    buffer: ownedBuffer,
    format: 'unorm8x4',
    length: 1,
    byteStride: 4,
    ownsBuffer: true
  });
  const ownedVector = new GPUVector({
    type: 'data',
    name: 'ownedColors',
    data: [ownedData],
    ownsData: true
  });

  ownedVector.destroy();

  expect(Boolean(ownedBuffer.destroyed), 'owned data vector destroy releases the buffer').toBe(
    true
  );
});

it('GPUVector table helpers expose single-chunk vectors and required columns', () => {
  const device = new NullDevice({});
  const firstData = new GPUData({
    buffer: device.createBuffer({byteLength: 8}),
    format: 'float32x2',
    length: 1,
    byteStride: 8,
    ownsBuffer: true
  });
  const secondData = new GPUData({
    buffer: device.createBuffer({byteLength: 8}),
    format: 'float32x2',
    length: 1,
    byteStride: 8,
    ownsBuffer: true
  });
  const positions = new GPUVector({
    type: 'data',
    name: 'positions',
    data: [firstData],
    ownsData: false
  });
  const chunkedPositions = new GPUVector({
    type: 'data',
    name: 'chunkedPositions',
    data: [firstData, secondData],
    ownsData: false
  });
  const batch = new GPURecordBatch({gpuData: {positions: positions.data[0]}});
  const table = new GPUTable({
    batches: [batch]
  });

  expect(getRequiredGPUVector(table, 'positions'), 'finds the table aggregate vector by name').toBe(
    table.gpuVectors.positions
  );
  expect(batch.gpuData.positions, 'record batch retains one GPUData per column').toBe(firstData);
  expect(getGPUVectorData(positions), 'returns the single retained GPUData chunk').toBe(firstData);
  expect(getGPUVectorBuffer(positions), 'returns the single retained buffer').toBe(
    firstData.buffer
  );
  expect(
    () => getRequiredGPUVector(table, 'missing', 'test table'),
    'reports missing required columns with owner context'
  ).toThrow(/test table is missing GPU vector "missing"/);
  expect(
    () => getGPUVectorData(chunkedPositions),
    'single-chunk helpers reject aggregate vectors'
  ).toThrow(/GPUVector "chunkedPositions" requires exactly one GPUData chunk/);

  table.destroy();
  chunkedPositions.destroy();
  firstData.destroy();
  secondData.destroy();
});

it('GPURecordBatch owns one row-aligned GPUData chunk per column', () => {
  const device = new NullDevice({});
  const positionsBuffer = device.createBuffer({byteLength: 16});
  const colorsBuffer = device.createBuffer({byteLength: 8});
  const positions = new GPUData({
    buffer: positionsBuffer,
    format: 'float32x2',
    length: 2,
    byteStride: 8,
    ownsBuffer: true
  });
  const colors = new GPUData({
    buffer: colorsBuffer,
    format: 'unorm8x4',
    length: 2,
    byteStride: 4,
    ownsBuffer: true
  });
  const mismatchedColorsBuffer = device.createBuffer({byteLength: 4});
  const mismatchedColors = new GPUData({
    buffer: mismatchedColorsBuffer,
    format: 'unorm8x4',
    length: 1,
    byteStride: 4,
    ownsBuffer: true
  });
  const batch = new GPURecordBatch({gpuData: {positions, colors}});

  expect(batch.numRows, 'derives rows from GPUData length').toBe(2);
  expect(
    batch.schema.fields.map(field => field.name),
    'synthesizes fields from keyed GPUData'
  ).toEqual(['positions', 'colors']);
  expect(batch.gpuData.positions, 'retains the keyed data chunk').toBe(positions);
  expect(
    () =>
      new GPURecordBatch({
        gpuData: {
          positions,
          colors: mismatchedColors
        }
      }),
    'rejects mismatched column lengths'
  ).toThrow(/matching GPUData row counts/);

  batch.destroy();
  mismatchedColors.destroy();
  expect(Boolean(positionsBuffer.destroyed), 'destroys owned position data').toBe(true);
  expect(Boolean(colorsBuffer.destroyed), 'destroys owned color data').toBe(true);
});

it('GPURecordBatch accepts explicit layouts for format-less interleaved GPUData', () => {
  const device = new NullDevice({});
  const data = new GPUData({
    buffer: device.createBuffer({byteLength: 32}),
    length: 2,
    stride: 16,
    byteStride: 16,
    rowByteLength: 16,
    ownsBuffer: true
  });
  const batch = new GPURecordBatch({
    gpuData: {interleaved: data},
    bufferLayout: [
      {
        name: 'interleaved',
        byteStride: 16,
        attributes: [
          {attribute: 'positions', format: 'float32x2', byteOffset: 0},
          {attribute: 'colors', format: 'unorm8x4', byteOffset: 8}
        ]
      }
    ]
  });
  const emptyBatch = new GPURecordBatch({gpuData: {}, numRows: 0});

  expect(batch.numRows, 'derives interleaved row count from GPUData').toBe(2);
  expect(batch.schema.fields[0].format, 'keeps format-less interleaved field').toBe(undefined);
  expect(emptyBatch.numRows, 'accepts explicit empty batches').toBe(0);

  batch.destroy();
  emptyBatch.destroy();
});

it('GPUTable keeps storage in GPU vectors instead of cached bindings', () => {
  const device = new NullDevice({});
  const positions = new GPUVector({
    type: 'buffer',
    name: 'positions',
    buffer: device.createBuffer({byteLength: 8}),
    format: 'float32x2',
    length: 1,
    byteStride: 8,
    ownsBuffer: true
  });
  const weightsBuffer = device.createBuffer({byteLength: 4});
  const weights = new GPUVector({
    type: 'buffer',
    name: 'weights',
    buffer: weightsBuffer,
    format: 'float32',
    length: 1,
    byteStride: 4,
    ownsBuffer: true
  });
  const table = new GPUTable({vectors: {positions, weights}});

  expect(Boolean('bindings' in table), 'does not cache bindings on the table').toBe(false);
  expect(Boolean('bindings' in table.batches[0]), 'does not cache bindings on the batch').toBe(
    false
  );
  expect(table.gpuVectors.weights.data[0].buffer, 'keeps storage on GPUData').toBe(weightsBuffer);

  table.destroy();
});
