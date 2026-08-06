// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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
  isFixedSizeListGPUVectorFormat,
  isGPUVectorFormatCompatibleWithShaderType,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat
} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';

test('GPUVector format helpers parse fixed and variable-length formats', t => {
  const fixedInfo = getGPUVectorFormatInfo('float32x3');
  const vertexListInfo = getGPUVectorFormatInfo('vertex-list<unorm8x4>');
  const valueListInfo = getGPUVectorFormatInfo('value-list<uint8>');
  const fixedSizeListInfo = getGPUVectorFormatInfo('fixed-size-list<float32,768>');
  const fixedSizeVectorListInfo = getGPUVectorFormatInfo('fixed-size-list<float32x3,2>');

  t.equal(fixedInfo.elementFormat, 'float32x3', 'fixed vector element format is unchanged');
  t.equal(fixedInfo.vertexList, false, 'fixed vector is not a vertex list');
  t.equal(fixedInfo.valueList, false, 'fixed vector is not a value list');
  t.equal(fixedInfo.fixedSizeList, false, 'fixed vector is not a fixed-size list');
  t.equal(fixedInfo.elementByteLength, 12, 'fixed vector element byte length is decoded');
  t.equal(fixedInfo.byteLength, 12, 'fixed vector byte length is decoded');
  t.equal(vertexListInfo.elementFormat, 'unorm8x4', 'vertex-list exposes its element format');
  t.equal(vertexListInfo.vertexList, true, 'vertex-list marker is decoded');
  t.equal(vertexListInfo.valueList, false, 'vertex-list is not a value-list');
  t.equal(vertexListInfo.primitiveType, 'f32', 'normalized list elements expose f32 values');
  t.equal(valueListInfo.elementFormat, 'uint8', 'value-list exposes its element format');
  t.equal(valueListInfo.vertexList, false, 'value-list is not a vertex-list');
  t.equal(valueListInfo.valueList, true, 'value-list marker is decoded');
  t.equal(fixedSizeListInfo.elementFormat, 'float32', 'fixed-size list exposes its element format');
  t.equal(fixedSizeListInfo.fixedSizeList, true, 'fixed-size-list marker is decoded');
  t.equal(fixedSizeListInfo.vertexList, false, 'fixed-size list is not a vertex list');
  t.equal(
    fixedSizeListInfo.valueList,
    false,
    'fixed-size list is not a variable-length value list'
  );
  t.equal(fixedSizeListInfo.listSize, 768, 'fixed-size list exposes its logical row cardinality');
  t.equal(fixedSizeListInfo.components, 1, 'fixed-size list preserves scalar element components');
  t.equal(fixedSizeListInfo.elementByteLength, 4, 'fixed-size list exposes element byte length');
  t.equal(fixedSizeListInfo.byteLength, 3072, 'fixed-size list byte length describes one full row');
  t.equal(fixedSizeVectorListInfo.components, 3, 'vector-valued fixed lists retain element shape');
  t.equal(fixedSizeVectorListInfo.elementByteLength, 12, 'vector-valued lists expose element size');
  t.equal(fixedSizeVectorListInfo.byteLength, 24, 'vector-valued lists expose complete row size');
  t.equal(getGPUVectorElementFormat('vertex-list<unorm8x4>'), 'unorm8x4');
  t.equal(getGPUVectorElementFormat('value-list<uint8>'), 'uint8');
  t.equal(getGPUVectorElementFormat('fixed-size-list<float32,768>'), 'float32');
  t.ok(isVertexListGPUVectorFormat('vertex-list<unorm8x4>'), 'recognizes vertex-list syntax');
  t.ok(isValueListGPUVectorFormat('value-list<uint8>'), 'recognizes value-list syntax');
  t.ok(
    isFixedSizeListGPUVectorFormat('fixed-size-list<float32,768>'),
    'recognizes canonical fixed-size-list syntax'
  );
  t.notOk(isVertexListGPUVectorFormat('list<unorm8x4>'), 'generic list syntax is not accepted');
  t.throws(
    () => getGPUVectorFormatInfo('list<unorm8x4>' as never),
    /Unsupported GPUVector format/,
    'generic list syntax is reserved'
  );

  t.end();
});

test('GPUVector fixed-size-list formats require canonical positive safe cardinalities', t => {
  const invalidFormats = [
    'fixed-size-list<float32,0>',
    'fixed-size-list<float32,-1>',
    'fixed-size-list<float32,+1>',
    'fixed-size-list<float32,01>',
    'fixed-size-list<float32,1.0>',
    'fixed-size-list<float32, 1>',
    'fixed-size-list<float32,1 >',
    'fixed-size-list<float32,9007199254740992>',
    'fixed-size-list<float32,9007199254740991>',
    'fixed-size-list<bogus,3>',
    'fixed-size-list<float32>',
    'fixed-list<float32,1>'
  ];

  for (const invalidFormat of invalidFormats) {
    t.notOk(
      isFixedSizeListGPUVectorFormat(invalidFormat),
      `rejects noncanonical fixed-size-list syntax ${invalidFormat}`
    );
    t.throws(
      () => getGPUVectorFormatInfo(invalidFormat as never),
      /Unsupported GPUVector format/,
      `cannot decode invalid fixed-size-list format ${invalidFormat}`
    );
  }
  t.throws(
    () => getGPUVectorFormatInfo('fixed-size-list<float32,9007199254740991>'),
    /Unsupported GPUVector format/,
    'rejects fixed-size-list rows whose physical byte length exceeds a safe integer'
  );
  t.throws(
    () => getGPUVectorFormatInfo('fixed-size-list<float64,3>' as never),
    /Unsupported GPUVector format/,
    'rejects an unsupported fixed-size-list element format'
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
  t.notOk(
    isGPUVectorFormatCompatibleWithShaderType('fixed-size-list<float32,1>', 'f32'),
    'fixed-size-list storage columns never masquerade as vertex shader attributes'
  );

  t.end();
});

test('GPUData derives complete fixed-size-list row and flattened-value metadata', t => {
  const device = new NullDevice({});
  const packedData = new GPUData({
    buffer: device.createBuffer({byteLength: 2 * 768 * Float32Array.BYTES_PER_ELEMENT}),
    format: 'fixed-size-list<float32,768>',
    length: 2,
    ownsBuffer: true
  });
  const paddedData = new GPUData({
    buffer: device.createBuffer({byteLength: 6176}),
    format: 'fixed-size-list<float32,768>',
    length: 2,
    byteStride: 3104,
    ownsBuffer: true
  });
  const vectorElementData = new GPUData({
    buffer: device.createBuffer({byteLength: 24}),
    format: 'fixed-size-list<float32x3,2>',
    length: 1,
    ownsBuffer: true
  });
  const emptyData = new GPUData({
    buffer: device.createBuffer({byteLength: 0}),
    format: 'fixed-size-list<float32,384>',
    length: 0,
    ownsBuffer: true
  });

  t.equal(packedData.length, 2, 'length remains the logical row count');
  t.equal(packedData.valueLength, 1536, 'valueLength counts flattened fixed-list elements');
  t.equal(packedData.stride, 768, 'stride counts scalar components in one logical row');
  t.equal(packedData.rowByteLength, 3072, 'row payload spans all fixed-list elements');
  t.equal(packedData.byteStride, 3072, 'packed row stride defaults to the complete row payload');
  t.equal(paddedData.rowByteLength, 3072, 'padding does not change the logical row payload');
  t.equal(paddedData.byteStride, 3104, 'explicit padded row stride is preserved');
  t.equal(vectorElementData.valueLength, 2, 'vector-valued lists count flattened vector elements');
  t.equal(vectorElementData.stride, 6, 'vector-valued rows count every scalar component');
  t.equal(vectorElementData.rowByteLength, 24, 'vector-valued rows span their complete payload');
  t.equal(emptyData.valueLength, 0, 'empty fixed-size lists expose no flattened values');
  t.equal(emptyData.rowByteLength, 1536, 'empty fixed-size lists retain their complete row format');

  packedData.destroy();
  paddedData.destroy();
  vectorElementData.destroy();
  emptyData.destroy();
  t.end();
});

test('GPUData rejects malformed fixed-size-list row layouts and out-of-range views', t => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 28});
  const format = 'fixed-size-list<float32,3>' as const;

  t.throws(
    () => new GPUData({buffer, format, length: 2, valueLength: 5}),
    /valueLength must equal its flattened row elements/,
    'rejects flattened counts that do not match fixed row cardinality'
  );
  t.throws(
    () => new GPUData({buffer, format, length: 1, stride: 2}),
    /stride cannot truncate its row components/,
    'rejects scalar strides smaller than the fixed row cardinality'
  );
  t.throws(
    () => new GPUData({buffer, format, length: 1, rowByteLength: 8}),
    /rowByteLength cannot truncate its row payload/,
    'rejects row payloads that omit fixed-list elements'
  );
  t.throws(
    () => new GPUData({buffer, format, length: 2, byteStride: 8}),
    /byteStride cannot overlap its row payload/,
    'rejects row strides that overlap adjacent fixed-list rows'
  );
  t.throws(
    () => new GPUData({buffer, format, length: 2, byteOffset: 5}),
    /exceeds its backing buffer byte length/,
    'rejects fixed-list ranges that run beyond the physical allocation'
  );
  t.throws(
    () => new GPUData({buffer, format, length: 1, byteOffset: -1}),
    /safe non-negative integers/,
    'rejects negative row byte offsets'
  );
  t.throws(
    () => new GPUData({buffer, format, length: 2, byteStride: Number.MAX_SAFE_INTEGER}),
    /byte range must use safe integers/,
    'rejects final-row spans that overflow safe integer arithmetic'
  );
  t.throws(
    () => new GPUData({buffer, format, length: Number.MAX_SAFE_INTEGER}),
    /safe non-negative integers/,
    'rejects flattened element counts that overflow safe integer arithmetic'
  );

  const paddedData = new GPUData({buffer, format, length: 2, byteStride: 16});
  t.equal(paddedData.rowByteLength, 12, 'accepts padded rows without requiring final-row padding');

  paddedData.destroy();
  buffer.destroy();
  t.end();
});

test('GPUVector preserves fixed-size-list rows, padded layouts, and source chunks', t => {
  const device = new NullDevice({});
  const packedVector = new GPUVector({
    type: 'buffer',
    name: 'embeddings',
    buffer: device.createBuffer({byteLength: 3 * 384 * Float32Array.BYTES_PER_ELEMENT}),
    format: 'fixed-size-list<float32,384>',
    length: 3,
    ownsBuffer: true
  });
  const paddedVector = new GPUVector({
    type: 'buffer',
    name: 'paddedEmbeddings',
    buffer: device.createBuffer({byteLength: 3104 + 3072}),
    format: 'fixed-size-list<float32,768>',
    length: 2,
    byteStride: 3104,
    ownsBuffer: true
  });
  const firstChunk = new GPUData({
    buffer: device.createBuffer({byteLength: 1536}),
    format: 'fixed-size-list<float32,384>',
    length: 1,
    ownsBuffer: true
  });
  const secondChunk = new GPUData({
    buffer: device.createBuffer({byteLength: 3072}),
    format: 'fixed-size-list<float32,384>',
    length: 2,
    ownsBuffer: true
  });
  const chunkedVector = new GPUVector({
    type: 'data',
    name: 'chunkedEmbeddings',
    data: [firstChunk, secondChunk],
    ownsData: false
  });

  t.equal(packedVector.length, 3, 'buffer-backed vectors retain logical rows');
  t.equal(packedVector.valueLength, 1152, 'buffer-backed vectors count flattened elements');
  t.equal(packedVector.stride, 384, 'buffer-backed vectors derive scalar row stride');
  t.equal(packedVector.byteStride, 1536, 'buffer-backed vectors derive complete row bytes');
  t.equal(paddedVector.rowByteLength, 3072, 'padded vectors retain the actual row payload');
  t.equal(paddedVector.byteStride, 3104, 'padded vectors retain explicit physical row stride');
  t.equal(chunkedVector.length, 3, 'chunk-backed vectors aggregate logical rows');
  t.equal(chunkedVector.valueLength, 1152, 'chunk-backed vectors aggregate flattened elements');
  t.equal(chunkedVector.data.length, 2, 'chunk-backed vectors preserve source chunk boundaries');
  t.equal(
    chunkedVector.data[0],
    firstChunk,
    'chunk-backed vectors borrow the original first chunk'
  );
  t.equal(
    chunkedVector.data[1],
    secondChunk,
    'chunk-backed vectors borrow the original second chunk'
  );

  chunkedVector.destroy();
  t.notOk(firstChunk.buffer.destroyed, 'borrowed chunk ownership remains with the original owner');
  packedVector.destroy();
  paddedVector.destroy();
  firstChunk.destroy();
  secondChunk.destroy();
  t.end();
});

test('Appendable GPUVector preserves fixed-size-list rows without implicit packing', t => {
  const device = new NullDevice({});
  const embeddings = new GPUVector({
    type: 'appendable',
    name: 'embeddings',
    device,
    format: 'fixed-size-list<float32,384>'
  });
  const firstChunk = new GPUData({
    buffer: device.createBuffer({byteLength: 1536}),
    format: 'fixed-size-list<float32,384>',
    length: 1,
    ownsBuffer: true
  });
  const secondChunk = new GPUData({
    buffer: device.createBuffer({byteLength: 3072}),
    format: 'fixed-size-list<float32,384>',
    length: 2,
    ownsBuffer: true
  });

  embeddings.appendDataChunk(firstChunk);
  embeddings.appendDataChunk(secondChunk);

  t.equal(embeddings.length, 3, 'appendable fixed-size lists count logical rows');
  t.equal(embeddings.valueLength, 1152, 'appendable fixed-size lists count flattened elements');
  t.equal(embeddings.byteStride, 1536, 'appendable fixed-size lists retain full-row byte stride');
  t.equal(embeddings.data.length, 2, 'appending preserves separately owned source chunks');

  embeddings.destroy();
  t.ok(firstChunk.buffer.destroyed, 'appendable vector destroys the first owned chunk');
  t.ok(secondChunk.buffer.destroyed, 'appendable vector destroys the second owned chunk');
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

test('GPU tables preserve explicit fixed-size-list attribute expansion', t => {
  const device = new NullDevice({});
  const embeddings = new GPUVector({
    type: 'interleaved',
    name: 'embeddings',
    buffer: device.createBuffer({byteLength: 32}),
    format: 'fixed-size-list<float32,4>',
    length: 2,
    byteStride: 16,
    attributes: [
      {attribute: 'embeddingPart0', format: 'float32x2', byteOffset: 0},
      {attribute: 'embeddingPart1', format: 'float32x2', byteOffset: 8}
    ],
    ownsBuffer: true
  });
  const table = new GPUTable({vectors: {embeddings}});

  t.equal(embeddings.valueLength, 8, 'explicitly expanded columns retain flattened element counts');
  t.equal(embeddings.stride, 4, 'explicitly expanded columns retain scalar row cardinality');
  t.equal(table.bufferLayout.length, 1, 'retains the caller-owned explicit attribute layout');
  t.deepEqual(
    table.bufferLayout[0].attributes?.map(attribute => attribute.attribute),
    ['embeddingPart0', 'embeddingPart1'],
    'does not replace an adapter-provided attribute expansion'
  );

  table.destroy();
  t.end();
});

test('GPU tables retain fixed-size-list storage columns without synthetic vertex attributes', t => {
  const device = new NullDevice({});
  const embeddings = new GPUVector({
    type: 'buffer',
    name: 'embeddings',
    buffer: device.createBuffer({byteLength: 2 * 1536 * Float32Array.BYTES_PER_ELEMENT}),
    format: 'fixed-size-list<float32,1536>',
    length: 2,
    ownsBuffer: true
  });
  const identifiers = new GPUVector({
    type: 'buffer',
    name: 'identifiers',
    buffer: device.createBuffer({byteLength: 2 * Uint32Array.BYTES_PER_ELEMENT}),
    format: 'uint32',
    length: 2,
    ownsBuffer: true
  });
  const table = new GPUTable({vectors: {embeddings, identifiers}});

  t.equal(table.numRows, 2, 'fixed-size-list vector lengths remain table row counts');
  t.equal(table.gpuVectors.embeddings.valueLength, 3072, 'table retains flattened element counts');
  t.equal(
    table.schema.fields.find(field => field.name === 'embeddings')?.format,
    'fixed-size-list<float32,1536>',
    'schema retains the complete fixed-size-list memory format'
  );
  t.deepEqual(
    table.bufferLayout.map(layout => layout.name),
    ['identifiers'],
    'only vertex-compatible columns receive synthesized buffer layouts'
  );
  t.equal(
    table.batches[0].gpuData.embeddings.format,
    'fixed-size-list<float32,1536>',
    'record batches retain row-aligned storage columns'
  );

  table.destroy();
  t.end();
});

test('GPU tables preserve fixed-size-list batches until explicitly packed', t => {
  const device = new NullDevice({});
  const firstBatch = new GPURecordBatch({
    gpuData: {
      embeddings: new GPUData({
        buffer: device.createBuffer({byteLength: 1536}),
        format: 'fixed-size-list<float32,384>',
        length: 1,
        ownsBuffer: true
      })
    }
  });
  const secondBatch = new GPURecordBatch({
    gpuData: {
      embeddings: new GPUData({
        buffer: device.createBuffer({byteLength: 3072}),
        format: 'fixed-size-list<float32,384>',
        length: 2,
        ownsBuffer: true
      })
    }
  });
  const table = new GPUTable({batches: [firstBatch, secondBatch]});

  t.equal(table.batches.length, 2, 'table construction preserves source batch boundaries');
  t.equal(table.numRows, 3, 'preserved batches contribute logical rows');
  t.equal(
    table.gpuVectors.embeddings.valueLength,
    1152,
    'aggregate vector tracks flattened values'
  );
  t.equal(table.gpuVectors.embeddings.data.length, 2, 'aggregate vector borrows both batch chunks');

  table.packBatches();

  t.equal(
    table.batches.length,
    1,
    'only explicit packing combines adjacent fixed-size-list batches'
  );
  t.equal(table.numRows, 3, 'explicit packing preserves logical rows');
  t.equal(
    table.gpuVectors.embeddings.valueLength,
    1152,
    'explicit packing preserves list elements'
  );
  t.equal(table.gpuVectors.embeddings.data.length, 1, 'explicit packing creates one owned chunk');
  t.equal(
    table.batches[0].gpuData.embeddings.byteStride,
    1536,
    'explicit packing preserves complete fixed-size-list row stride'
  );

  table.destroy();
  t.end();
});

test('GPU tables preserve variable-length packing errors before validating adapter metadata', t => {
  const device = new NullDevice({});
  const batches = [0, 1].map(
    () =>
      new GPURecordBatch({
        gpuData: {
          texts: new GPUData({
            buffer: device.createBuffer({byteLength: 5}),
            format: 'value-list<uint8>',
            length: 1,
            valueLength: 5,
            byteStride: 1,
            rowByteLength: 1,
            readbackMetadata: {adapter: 'utf8'},
            ownsBuffer: true
          })
        },
        bufferLayout: []
      })
  );
  const table = new GPUTable({batches});

  t.throws(
    () => table.packBatches(),
    /does not support variable-length GPUData "texts"/,
    'retains the existing variable-length rejection before inspecting adapter metadata'
  );
  t.equal(table.batches.length, 2, 'failed packing leaves both source batches unchanged');

  table.destroy();
  t.end();
});

test('GPU tables reject packing nullable fixed-size-list rows and scalar source identifiers', t => {
  const device = new NullDevice({});
  const firstEmbeddings = new GPUData({
    buffer: device.createBuffer({byteLength: 12}),
    format: 'fixed-size-list<float32,3>',
    length: 1,
    nullBitmap: new Uint8Array([0]),
    ownsBuffer: true
  });
  const secondEmbeddings = new GPUData({
    buffer: device.createBuffer({byteLength: 12}),
    format: 'fixed-size-list<float32,3>',
    length: 1,
    ownsBuffer: true
  });
  const nullableEmbeddings = new GPUTable({
    batches: [
      new GPURecordBatch({gpuData: {embeddings: firstEmbeddings}}),
      new GPURecordBatch({gpuData: {embeddings: secondEmbeddings}})
    ]
  });

  t.throws(
    () => nullableEmbeddings.packBatches(),
    /cannot preserve null or readback metadata.*embeddings/,
    'does not silently erase nullable fixed-size-list row eligibility'
  );
  t.equal(nullableEmbeddings.batches.length, 2, 'failed packing preserves every source batch');
  t.deepEqual(
    Array.from(nullableEmbeddings.batches[0].gpuData.embeddings.nullBitmap ?? []),
    [0],
    'failed packing retains normalized fixed-size-list validity metadata'
  );

  const firstSourceIdentifiers = new GPUData({
    buffer: device.createBuffer({byteLength: 4}),
    format: 'uint32',
    length: 1,
    nullBitmap: new Uint8Array([0]),
    readbackMetadata: {adapter: 'numeric-validity'},
    ownsBuffer: true
  });
  const secondSourceIdentifiers = new GPUData({
    buffer: device.createBuffer({byteLength: 4}),
    format: 'uint32',
    length: 1,
    ownsBuffer: true
  });
  const nullableIdentifiers = new GPUTable({
    batches: [
      new GPURecordBatch({gpuData: {sourceIdentifiers: firstSourceIdentifiers}}),
      new GPURecordBatch({gpuData: {sourceIdentifiers: secondSourceIdentifiers}})
    ]
  });

  t.throws(
    () => nullableIdentifiers.packBatches(),
    /cannot preserve null or readback metadata.*sourceIdentifiers/,
    'does not turn null stable source identifiers into valid physical zero values'
  );
  t.equal(
    nullableIdentifiers.batches.length,
    2,
    'failed identifier packing preserves both batches'
  );
  t.equal(
    nullableIdentifiers.batches[0].gpuData.sourceIdentifiers.readbackMetadata?.adapter,
    'numeric-validity',
    'failed packing retains adapter-owned numeric readback metadata'
  );

  nullableEmbeddings.destroy();
  nullableIdentifiers.destroy();
  t.end();
});

test('GPU tables reject packing adapter readback metadata even without a row bitmap', t => {
  const device = new NullDevice({});
  const firstData = new GPUData({
    buffer: device.createBuffer({byteLength: 4}),
    format: 'uint32',
    length: 1,
    readbackMetadata: {adapter: 'custom-source-metadata'},
    ownsBuffer: true
  });
  const secondData = new GPUData({
    buffer: device.createBuffer({byteLength: 4}),
    format: 'uint32',
    length: 1,
    ownsBuffer: true
  });
  const table = new GPUTable({
    batches: [
      new GPURecordBatch({gpuData: {values: firstData}}),
      new GPURecordBatch({gpuData: {values: secondData}})
    ]
  });

  t.throws(
    () => table.packBatches(),
    /cannot preserve null or readback metadata.*values/,
    'generic tables never silently discard adapter-owned reconstruction metadata'
  );
  t.equal(table.batches.length, 2, 'metadata rejection occurs before any batch is replaced');

  table.destroy();
  t.end();
});

test('GPURecordBatch synthesizes fixed-size-list schemas without vertex layouts', t => {
  const device = new NullDevice({});
  const embeddings = new GPUData({
    buffer: device.createBuffer({byteLength: 2 * 768 * Float32Array.BYTES_PER_ELEMENT}),
    format: 'fixed-size-list<float32,768>',
    length: 2,
    ownsBuffer: true
  });
  const batch = new GPURecordBatch({gpuData: {embeddings}});
  const table = new GPUTable({batches: [batch]});

  t.equal(batch.numRows, 2, 'record batches infer logical fixed-size-list rows');
  t.equal(batch.gpuData.embeddings.valueLength, 1536, 'record batches retain flattened values');
  t.equal(batch.schema.fields[0].format, 'fixed-size-list<float32,768>', 'schema keeps row shape');
  t.deepEqual(batch.bufferLayout, [], 'storage-only batches have no synthetic vertex layouts');
  t.deepEqual(table.bufferLayout, [], 'storage-only tables have no synthetic vertex layouts');
  t.equal(table.gpuVectors.embeddings.length, 2, 'aggregate vectors retain logical rows');

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
  const batch = new GPURecordBatch({gpuData: {positions: positions.data[0]}});
  const table = new GPUTable({
    batches: [batch]
  });

  t.equal(
    getRequiredGPUVector(table, 'positions'),
    table.gpuVectors.positions,
    'finds the table aggregate vector by name'
  );
  t.equal(batch.gpuData.positions, firstData, 'record batch retains one GPUData per column');
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

test('GPURecordBatch owns one row-aligned GPUData chunk per column', t => {
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

  t.equal(batch.numRows, 2, 'derives rows from GPUData length');
  t.deepEqual(
    batch.schema.fields.map(field => field.name),
    ['positions', 'colors'],
    'synthesizes fields from keyed GPUData'
  );
  t.equal(batch.gpuData.positions, positions, 'retains the keyed data chunk');
  t.throws(
    () =>
      new GPURecordBatch({
        gpuData: {
          positions,
          colors: mismatchedColors
        }
      }),
    /matching GPUData row counts/,
    'rejects mismatched column lengths'
  );

  batch.destroy();
  mismatchedColors.destroy();
  t.ok(positionsBuffer.destroyed, 'destroys owned position data');
  t.ok(colorsBuffer.destroyed, 'destroys owned color data');
  t.end();
});

test('GPURecordBatch accepts explicit layouts for format-less interleaved GPUData', t => {
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

  t.equal(batch.numRows, 2, 'derives interleaved row count from GPUData');
  t.equal(batch.schema.fields[0].format, undefined, 'keeps format-less interleaved field');
  t.equal(emptyBatch.numRows, 0, 'accepts explicit empty batches');

  batch.destroy();
  emptyBatch.destroy();
  t.end();
});

test('GPUTable keeps storage in GPU vectors instead of cached bindings', t => {
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

  t.notOk('bindings' in table, 'does not cache bindings on the table');
  t.notOk('bindings' in table.batches[0], 'does not cache bindings on the batch');
  t.equal(table.gpuVectors.weights.data[0].buffer, weightsBuffer, 'keeps storage on GPUData');

  table.destroy();
  t.end();
});
