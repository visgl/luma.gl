// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  GPUData,
  GPUVector,
  GPUTable,
  getGPUVectorElementFormat,
  getGPUVectorFormatInfo,
  isGPUVectorFormatCompatibleWithShaderType,
  isVertexListGPUVectorFormat
} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';

test('GPUVector format helpers parse fixed and vertex-list formats', t => {
  const fixedInfo = getGPUVectorFormatInfo('float32x3');
  const vertexListInfo = getGPUVectorFormatInfo('vertex-list<unorm8x4>');

  t.equal(fixedInfo.elementFormat, 'float32x3', 'fixed vector element format is unchanged');
  t.equal(fixedInfo.vertexList, false, 'fixed vector is not a vertex list');
  t.equal(fixedInfo.byteLength, 12, 'fixed vector byte length is decoded');
  t.equal(vertexListInfo.elementFormat, 'unorm8x4', 'vertex-list exposes its element format');
  t.equal(vertexListInfo.vertexList, true, 'vertex-list marker is decoded');
  t.equal(vertexListInfo.primitiveType, 'f32', 'normalized list elements expose f32 values');
  t.equal(getGPUVectorElementFormat('vertex-list<unorm8x4>'), 'unorm8x4');
  t.ok(isVertexListGPUVectorFormat('vertex-list<unorm8x4>'), 'recognizes vertex-list syntax');
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
  t.equal(colors.type, 'unorm8x4', 'retains the deprecated type alias as format metadata');
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
