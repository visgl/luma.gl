import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUData,
  GPUVector,
  getGPUVectorBuffer,
  getGPUVectorElementFormat,
  getGPUVectorFormatInfo,
  getGPUVectorData,
  getRequiredGPUVector,
  isFixedSizeListGPUVectorFormat,
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
  const fixedSizeListInfo = getGPUVectorFormatInfo('fixed-size-list<float32,768>');
  const fixedSizeVectorListInfo = getGPUVectorFormatInfo('fixed-size-list<float32x3,2>');

  expect(fixedInfo.elementFormat, 'fixed vector element format is unchanged').toBe('float32x3');
  expect(fixedInfo.vertexList, 'fixed vector is not a vertex list').toBe(false);
  expect(fixedInfo.valueList, 'fixed vector is not a value list').toBe(false);
  expect(fixedInfo.fixedSizeList, 'fixed vector is not a fixed-size list').toBe(false);
  expect(fixedInfo.elementByteLength, 'fixed vector element byte length is decoded').toBe(12);
  expect(fixedInfo.byteLength, 'fixed vector byte length is decoded').toBe(12);
  expect(vertexListInfo.elementFormat, 'vertex-list exposes its element format').toBe('unorm8x4');
  expect(vertexListInfo.vertexList, 'vertex-list marker is decoded').toBe(true);
  expect(vertexListInfo.valueList, 'vertex-list is not a value-list').toBe(false);
  expect(vertexListInfo.primitiveType, 'normalized list elements expose f32 values').toBe('f32');
  expect(valueListInfo.elementFormat, 'value-list exposes its element format').toBe('uint8');
  expect(valueListInfo.vertexList, 'value-list is not a vertex-list').toBe(false);
  expect(valueListInfo.valueList, 'value-list marker is decoded').toBe(true);
  expect(fixedSizeListInfo.elementFormat, 'fixed-size list exposes its element format').toBe(
    'float32'
  );
  expect(fixedSizeListInfo.fixedSizeList, 'fixed-size-list marker is decoded').toBe(true);
  expect(fixedSizeListInfo.vertexList, 'fixed-size list is not a vertex list').toBe(false);
  expect(fixedSizeListInfo.valueList, 'fixed-size list is not a variable-length value list').toBe(
    false
  );
  expect(fixedSizeListInfo.listSize, 'fixed-size list exposes its logical row cardinality').toBe(
    768
  );
  expect(fixedSizeListInfo.components, 'fixed-size list preserves scalar element components').toBe(
    1
  );
  expect(fixedSizeListInfo.elementByteLength, 'fixed-size list exposes element byte length').toBe(
    4
  );
  expect(fixedSizeListInfo.byteLength, 'fixed-size list byte length describes one full row').toBe(
    3072
  );
  expect(fixedSizeVectorListInfo.components, 'vector-valued fixed lists retain element shape').toBe(
    3
  );
  expect(fixedSizeVectorListInfo.elementByteLength, 'vector-valued lists expose element size').toBe(
    12
  );
  expect(fixedSizeVectorListInfo.byteLength, 'vector-valued lists expose complete row size').toBe(
    24
  );
  expect(getGPUVectorElementFormat('vertex-list<unorm8x4>')).toBe('unorm8x4');
  expect(getGPUVectorElementFormat('value-list<uint8>')).toBe('uint8');
  expect(getGPUVectorElementFormat('fixed-size-list<float32,768>')).toBe('float32');
  expect(
    Boolean(isVertexListGPUVectorFormat('vertex-list<unorm8x4>')),
    'recognizes vertex-list syntax'
  ).toBe(true);
  expect(
    Boolean(isValueListGPUVectorFormat('value-list<uint8>')),
    'recognizes value-list syntax'
  ).toBe(true);
  expect(
    Boolean(isFixedSizeListGPUVectorFormat('fixed-size-list<float32,768>')),
    'recognizes canonical fixed-size-list syntax'
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

it('GPUVector fixed-size-list formats require canonical positive safe cardinalities', () => {
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
    expect(
      Boolean(isFixedSizeListGPUVectorFormat(invalidFormat)),
      `rejects noncanonical fixed-size-list syntax ${invalidFormat}`
    ).toBe(false);
    expect(
      () => getGPUVectorFormatInfo(invalidFormat as never),
      `cannot decode invalid fixed-size-list format ${invalidFormat}`
    ).toThrow(/Unsupported GPUVector format/);
  }
  expect(
    () => getGPUVectorFormatInfo('fixed-size-list<float32,9007199254740991>'),
    'rejects fixed-size-list rows whose physical byte length exceeds a safe integer'
  ).toThrow(/Unsupported GPUVector format/);
  expect(
    () => getGPUVectorFormatInfo('fixed-size-list<float64,3>' as never),
    'rejects an unsupported fixed-size-list element format'
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
  expect(
    Boolean(isGPUVectorFormatCompatibleWithShaderType('fixed-size-list<float32,1>', 'f32')),
    'fixed-size-list storage columns never masquerade as vertex shader attributes'
  ).toBe(false);
});

it('GPUData derives complete fixed-size-list row and flattened-value metadata', () => {
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

  expect(packedData.length, 'length remains the logical row count').toBe(2);
  expect(packedData.valueLength, 'valueLength counts flattened fixed-list elements').toBe(1536);
  expect(packedData.stride, 'stride counts scalar components in one logical row').toBe(768);
  expect(packedData.rowByteLength, 'row payload spans all fixed-list elements').toBe(3072);
  expect(packedData.byteStride, 'packed row stride defaults to the complete row payload').toBe(
    3072
  );
  expect(paddedData.rowByteLength, 'padding does not change the logical row payload').toBe(3072);
  expect(paddedData.byteStride, 'explicit padded row stride is preserved').toBe(3104);
  expect(vectorElementData.valueLength, 'vector-valued lists count flattened vector elements').toBe(
    2
  );
  expect(vectorElementData.stride, 'vector-valued rows count every scalar component').toBe(6);
  expect(vectorElementData.rowByteLength, 'vector-valued rows span their complete payload').toBe(
    24
  );
  expect(emptyData.valueLength, 'empty fixed-size lists expose no flattened values').toBe(0);
  expect(emptyData.rowByteLength, 'empty fixed-size lists retain their complete row format').toBe(
    1536
  );

  packedData.destroy();
  paddedData.destroy();
  vectorElementData.destroy();
  emptyData.destroy();
});

it('GPUData rejects malformed fixed-size-list row layouts and out-of-range views', () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({byteLength: 28});
  const format = 'fixed-size-list<float32,3>' as const;

  expect(
    () => new GPUData({buffer, format, length: 2, valueLength: 5}),
    'rejects flattened counts that do not match fixed row cardinality'
  ).toThrow(/valueLength must equal its flattened row elements/);
  expect(
    () => new GPUData({buffer, format, length: 1, stride: 2}),
    'rejects scalar strides smaller than the fixed row cardinality'
  ).toThrow(/stride cannot truncate its row components/);
  expect(
    () => new GPUData({buffer, format, length: 1, rowByteLength: 8}),
    'rejects row payloads that omit fixed-list elements'
  ).toThrow(/rowByteLength cannot truncate its row payload/);
  expect(
    () => new GPUData({buffer, format, length: 2, byteStride: 8}),
    'rejects row strides that overlap adjacent fixed-list rows'
  ).toThrow(/byteStride cannot overlap its row payload/);
  expect(
    () => new GPUData({buffer, format, length: 2, byteOffset: 5}),
    'rejects fixed-list ranges that run beyond the physical allocation'
  ).toThrow(/exceeds its backing buffer byte length/);
  expect(
    () => new GPUData({buffer, format, length: 1, byteOffset: -1}),
    'rejects negative row byte offsets'
  ).toThrow(/safe non-negative integers/);
  expect(
    () => new GPUData({buffer, format, length: 2, byteStride: Number.MAX_SAFE_INTEGER}),
    'rejects final-row spans that overflow safe integer arithmetic'
  ).toThrow(/byte range must use safe integers/);
  expect(
    () => new GPUData({buffer, format, length: Number.MAX_SAFE_INTEGER}),
    'rejects flattened element counts that overflow safe integer arithmetic'
  ).toThrow(/safe non-negative integers/);

  const paddedData = new GPUData({buffer, format, length: 2, byteStride: 16});
  expect(paddedData.rowByteLength, 'accepts padded rows without requiring final-row padding').toBe(
    12
  );

  paddedData.destroy();
  buffer.destroy();
});

it('GPUVector preserves fixed-size-list rows, padded layouts, and source chunks', () => {
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

  expect(packedVector.length, 'buffer-backed vectors retain logical rows').toBe(3);
  expect(packedVector.valueLength, 'buffer-backed vectors count flattened elements').toBe(1152);
  expect(packedVector.stride, 'buffer-backed vectors derive scalar row stride').toBe(384);
  expect(packedVector.byteStride, 'buffer-backed vectors derive complete row bytes').toBe(1536);
  expect(paddedVector.rowByteLength, 'padded vectors retain the actual row payload').toBe(3072);
  expect(paddedVector.byteStride, 'padded vectors retain explicit physical row stride').toBe(3104);
  expect(chunkedVector.length, 'chunk-backed vectors aggregate logical rows').toBe(3);
  expect(chunkedVector.valueLength, 'chunk-backed vectors aggregate flattened elements').toBe(1152);
  expect(chunkedVector.data.length, 'chunk-backed vectors preserve source chunk boundaries').toBe(
    2
  );
  expect(chunkedVector.data[0], 'chunk-backed vectors borrow the original first chunk').toBe(
    firstChunk
  );
  expect(chunkedVector.data[1], 'chunk-backed vectors borrow the original second chunk').toBe(
    secondChunk
  );

  chunkedVector.destroy();
  expect(
    Boolean(firstChunk.buffer.destroyed),
    'borrowed chunk ownership remains with the original owner'
  ).toBe(false);
  packedVector.destroy();
  paddedVector.destroy();
  firstChunk.destroy();
  secondChunk.destroy();
});

it('Appendable GPUVector preserves fixed-size-list rows without implicit packing', () => {
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

  expect(embeddings.length, 'appendable fixed-size lists count logical rows').toBe(3);
  expect(embeddings.valueLength, 'appendable fixed-size lists count flattened elements').toBe(1152);
  expect(embeddings.byteStride, 'appendable fixed-size lists retain full-row byte stride').toBe(
    1536
  );
  expect(embeddings.data.length, 'appending preserves separately owned source chunks').toBe(2);

  embeddings.destroy();
  expect(
    Boolean(firstChunk.buffer.destroyed),
    'appendable vector destroys the first owned chunk'
  ).toBe(true);
  expect(
    Boolean(secondChunk.buffer.destroyed),
    'appendable vector destroys the second owned chunk'
  ).toBe(true);
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

it('GPU tables preserve explicit fixed-size-list attribute expansion', () => {
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

  expect(
    embeddings.valueLength,
    'explicitly expanded columns retain flattened element counts'
  ).toBe(8);
  expect(embeddings.stride, 'explicitly expanded columns retain scalar row cardinality').toBe(4);
  expect(table.bufferLayout.length, 'retains the caller-owned explicit attribute layout').toBe(1);
  expect(
    table.bufferLayout[0].attributes?.map(attribute => attribute.attribute),
    'does not replace an adapter-provided attribute expansion'
  ).toEqual(['embeddingPart0', 'embeddingPart1']);

  table.destroy();
});

it('GPU tables retain fixed-size-list storage columns without synthetic vertex attributes', () => {
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

  expect(table.numRows, 'fixed-size-list vector lengths remain table row counts').toBe(2);
  expect(table.gpuVectors.embeddings.valueLength, 'table retains flattened element counts').toBe(
    3072
  );
  expect(
    table.schema.fields.find(field => field.name === 'embeddings')?.format,
    'schema retains the complete fixed-size-list memory format'
  ).toBe('fixed-size-list<float32,1536>');
  expect(
    table.bufferLayout.map(layout => layout.name),
    'only vertex-compatible columns receive synthesized buffer layouts'
  ).toEqual(['identifiers']);
  expect(
    table.batches[0].gpuData.embeddings.format,
    'record batches retain row-aligned storage columns'
  ).toBe('fixed-size-list<float32,1536>');

  table.destroy();
});

it('GPU tables preserve fixed-size-list batches until explicitly packed', () => {
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

  expect(table.batches.length, 'table construction preserves source batch boundaries').toBe(2);
  expect(table.numRows, 'preserved batches contribute logical rows').toBe(3);
  expect(table.gpuVectors.embeddings.valueLength, 'aggregate vector tracks flattened values').toBe(
    1152
  );
  expect(
    table.gpuVectors.embeddings.data.length,
    'aggregate vector borrows both batch chunks'
  ).toBe(2);

  table.packBatches();

  expect(
    table.batches.length,
    'only explicit packing combines adjacent fixed-size-list batches'
  ).toBe(1);
  expect(table.numRows, 'explicit packing preserves logical rows').toBe(3);
  expect(table.gpuVectors.embeddings.valueLength, 'explicit packing preserves list elements').toBe(
    1152
  );
  expect(table.gpuVectors.embeddings.data.length, 'explicit packing creates one owned chunk').toBe(
    1
  );
  expect(
    table.batches[0].gpuData.embeddings.byteStride,
    'explicit packing preserves complete fixed-size-list row stride'
  ).toBe(1536);

  table.destroy();
});

it('GPU tables reject packing incompatible fixed-size-list physical row layouts', () => {
  const device = new NullDevice({});
  const incompatibleLayouts = [
    [
      {byteStride: 16, rowByteLength: 12},
      {byteStride: 20, rowByteLength: 12}
    ],
    [
      {byteStride: 20, rowByteLength: 12},
      {byteStride: 20, rowByteLength: 16}
    ]
  ];

  for (const layouts of incompatibleLayouts) {
    const batches = layouts.map(
      ({byteStride, rowByteLength}) =>
        new GPURecordBatch({
          gpuData: {
            embeddings: new GPUData({
              buffer: device.createBuffer({byteLength: byteStride + rowByteLength}),
              format: 'fixed-size-list<float32,3>',
              length: 2,
              byteStride,
              rowByteLength,
              ownsBuffer: true
            })
          }
        })
    );
    const table = new GPUTable({batches});

    expect(table.bufferLayout, 'storage-only list layouts remain intentionally empty').toEqual([]);
    expect(
      () => table.packBatches(),
      'rejects incompatible physical row layouts before copying source buffers'
    ).toThrow(/matching fixed-size-list row layouts.*embeddings/);
    expect(table.batches.length, 'rejected packing preserves every original batch').toBe(2);
    expect(
      Boolean(batches.some(batch => batch.gpuData.embeddings.buffer.destroyed)),
      'failed packing leaves caller-owned source buffers intact'
    ).toBe(false);

    table.destroy();
  }
});

it('GPU tables preserve variable-length packing errors before validating adapter metadata', () => {
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

  expect(
    () => table.packBatches(),
    'retains the existing variable-length rejection before inspecting adapter metadata'
  ).toThrow(/does not support variable-length GPUData "texts"/);
  expect(table.batches.length, 'failed packing leaves both source batches unchanged').toBe(2);

  table.destroy();
});

it('GPU tables reject packing nullable fixed-size-list rows and scalar source identifiers', () => {
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

  expect(
    () => nullableEmbeddings.packBatches(),
    'does not silently erase nullable fixed-size-list row eligibility'
  ).toThrow(/cannot preserve null or readback metadata.*embeddings/);
  expect(nullableEmbeddings.batches.length, 'failed packing preserves every source batch').toBe(2);
  expect(
    Array.from(nullableEmbeddings.batches[0].gpuData.embeddings.nullBitmap ?? []),
    'failed packing retains normalized fixed-size-list validity metadata'
  ).toEqual([0]);

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

  expect(
    () => nullableIdentifiers.packBatches(),
    'does not turn null stable source identifiers into valid physical zero values'
  ).toThrow(/cannot preserve null or readback metadata.*sourceIdentifiers/);
  expect(
    nullableIdentifiers.batches.length,
    'failed identifier packing preserves both batches'
  ).toBe(2);
  expect(
    nullableIdentifiers.batches[0].gpuData.sourceIdentifiers.readbackMetadata?.adapter,
    'failed packing retains adapter-owned numeric readback metadata'
  ).toBe('numeric-validity');

  nullableEmbeddings.destroy();
  nullableIdentifiers.destroy();
});

it('GPU tables reject packing adapter readback metadata even without a row bitmap', () => {
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

  expect(
    () => table.packBatches(),
    'generic tables never silently discard adapter-owned reconstruction metadata'
  ).toThrow(/cannot preserve null or readback metadata.*values/);
  expect(table.batches.length, 'metadata rejection occurs before any batch is replaced').toBe(2);

  table.destroy();
});

it('GPURecordBatch synthesizes fixed-size-list schemas without vertex layouts', () => {
  const device = new NullDevice({});
  const embeddings = new GPUData({
    buffer: device.createBuffer({byteLength: 2 * 768 * Float32Array.BYTES_PER_ELEMENT}),
    format: 'fixed-size-list<float32,768>',
    length: 2,
    ownsBuffer: true
  });
  const batch = new GPURecordBatch({gpuData: {embeddings}});
  const table = new GPUTable({batches: [batch]});

  expect(batch.numRows, 'record batches infer logical fixed-size-list rows').toBe(2);
  expect(batch.gpuData.embeddings.valueLength, 'record batches retain flattened values').toBe(1536);
  expect(batch.schema.fields[0].format, 'schema keeps row shape').toBe(
    'fixed-size-list<float32,768>'
  );
  expect(batch.bufferLayout, 'storage-only batches have no synthetic vertex layouts').toEqual([]);
  expect(table.bufferLayout, 'storage-only tables have no synthetic vertex layouts').toEqual([]);
  expect(table.gpuVectors.embeddings.length, 'aggregate vectors retain logical rows').toBe(2);

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
