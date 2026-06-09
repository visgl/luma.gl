// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  GPUData,
  GPURecordBatch,
  GPUVector,
  GPUTable,
  getGPUVectorBuffer,
  getGPUVectorElementFormat,
  getGPUVectorFormatInfo,
  getGPUVectorData,
  getRequiredGPUVector,
  isGPUVectorFormatCompatibleWithShaderType,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat
} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';

test('GPUVector format helpers parse fixed and variable-length formats', t => {
  const fixedInfo = getGPUVectorFormatInfo('float32x3');
  const vertexListInfo = getGPUVectorFormatInfo('vertex-list<unorm8x4>');
  const valueListInfo = getGPUVectorFormatInfo('value-list<uint8>');

  t.equal(fixedInfo.elementFormat, 'float32x3', 'fixed vector element format is unchanged');
  t.equal(fixedInfo.vertexList, false, 'fixed vector is not a vertex list');
  t.equal(fixedInfo.valueList, false, 'fixed vector is not a value list');
  t.equal(fixedInfo.byteLength, 12, 'fixed vector byte length is decoded');
  t.equal(vertexListInfo.elementFormat, 'unorm8x4', 'vertex-list exposes its element format');
  t.equal(vertexListInfo.vertexList, true, 'vertex-list marker is decoded');
  t.equal(vertexListInfo.valueList, false, 'vertex-list is not a value-list');
  t.equal(vertexListInfo.primitiveType, 'f32', 'normalized list elements expose f32 values');
  t.equal(valueListInfo.elementFormat, 'uint8', 'value-list exposes its element format');
  t.equal(valueListInfo.vertexList, false, 'value-list is not a vertex-list');
  t.equal(valueListInfo.valueList, true, 'value-list marker is decoded');
  t.equal(getGPUVectorElementFormat('vertex-list<unorm8x4>'), 'unorm8x4');
  t.equal(getGPUVectorElementFormat('value-list<uint8>'), 'uint8');
  t.ok(isVertexListGPUVectorFormat('vertex-list<unorm8x4>'), 'recognizes vertex-list syntax');
  t.ok(isValueListGPUVectorFormat('value-list<uint8>'), 'recognizes value-list syntax');
  t.notOk(isVertexListGPUVectorFormat('list<unorm8x4>'), 'generic list syntax is not accepted');
  t.throws(
    () => getGPUVectorFormatInfo('list<unorm8x4>' as never),
    /Unsupported GPUVector format/,
    'generic list syntax is reserved'
  );

  t.end();
});

test('GPUVector format helpers validate shader compatibility', t => {
  t.ok(
    isGPUVectorFormatCompatibleWithShaderType('unorm8x4', 'vec4<f32>'),
    'normalized RGBA8 can feed vec4<f32>'
  );
  t.ok(
    isGPUVectorFormatCompatibleWithShaderType('float32x3', 'vec3<f32>'),
    'float32x3 can feed vec3<f32>'
  );
  t.notOk(
    isGPUVectorFormatCompatibleWithShaderType('uint32x2', 'vec2<i32>'),
    'unsigned integer memory cannot feed signed integer shader values'
  );
  t.notOk(
    isGPUVectorFormatCompatibleWithShaderType('float32x3', 'vec4<f32>'),
    'component mismatch is rejected'
  );

  t.end();
});

test('GPUVector accepts format as canonical metadata and synthesizes table layouts', t => {
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

  t.equal(colors.format, 'unorm8x4', 'stores the canonical GPUVector format');
  t.notOk('type' in colors, 'drops the deprecated type alias');
  t.equal(table.bufferLayout[0].format, 'unorm8x4', 'table layout uses GPUVector.format');

  table.destroy();
  t.end();
});

test('GPUTable rejects vertex-list vectors without adapter-specific layout handling', t => {
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

  t.throws(
    () => new GPUTable({vectors: {colors}}),
    /cannot synthesize a generic buffer layout for vertex-list vector/,
    'generic table layout synthesis rejects vertex lists'
  );

  colors.destroy();
  t.end();
});

test('GPUVector rejects explicitly mismatched chunk formats', t => {
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

  t.equal(firstData.buffer, firstBuffer, 'GPUData accepts the same Buffer input as GPUVector');
  t.throws(
    () =>
      new GPUVector({
        type: 'data',
        name: 'mixedColors',
        data: [firstData, secondData],
        ownsData: false
      }),
    /data chunks must share the declared format/,
    'constructor rejects mixed explicit formats'
  );
  t.throws(
    () => colors.addData(secondData),
    /requires matching formats/,
    'addData rejects mixed explicit formats'
  );

  firstBuffer.destroy();
  secondBuffer.destroy();
  t.end();
});

test('GPUVector honors borrowed GPUData chunk ownership', t => {
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

  t.notOk(borrowedVector.ownsBuffer, 'borrowed data vectors do not report retained GPU ownership');
  t.notOk(borrowedBuffer.destroyed, 'borrowed data vector destroy leaves the buffer alive');

  borrowedData.destroy();
  t.ok(borrowedBuffer.destroyed, 'original GPUData owner can still destroy the buffer');

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

  t.ok(ownedBuffer.destroyed, 'owned data vector destroy releases the buffer');
  t.end();
});

test('GPUVector table helpers expose single-chunk vectors and required columns', t => {
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
  const batch = new GPURecordBatch({vectors: {positions}});
  const table = new GPUTable({
    batches: [batch],
    schema: batch.schema,
    bufferLayout: batch.bufferLayout
  });

  t.equal(getRequiredGPUVector(table, 'positions'), positions, 'finds a table vector by name');
  t.equal(getRequiredGPUVector(batch, 'positions'), positions, 'finds a batch vector by name');
  t.equal(getGPUVectorData(positions), firstData, 'returns the single retained GPUData chunk');
  t.equal(getGPUVectorBuffer(positions), firstData.buffer, 'returns the single retained buffer');
  t.throws(
    () => getRequiredGPUVector(table, 'missing', 'test table'),
    /test table is missing GPU vector "missing"/,
    'reports missing required columns with owner context'
  );
  t.throws(
    () => getGPUVectorData(chunkedPositions),
    /GPUVector "chunkedPositions" requires exactly one GPUData chunk/,
    'single-chunk helpers reject aggregate vectors'
  );

  table.destroy();
  chunkedPositions.destroy();
  firstData.destroy();
  secondData.destroy();
  t.end();
});

test('GPUTable forwards vector-construction bindings to its generated record batch', t => {
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
  const table = new GPUTable({
    vectors: {positions, weights},
    bindings: {weights: weightsBuffer}
  });

  t.equal(table.bindings.weights, weightsBuffer, 'exposes the forwarded binding on the table');
  t.equal(
    table.batches[0].bindings.weights,
    weightsBuffer,
    'forwards bindings to the generated record batch'
  );

  table.destroy();
  t.end();
});
