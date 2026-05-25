// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  makeArrowFixedSizeListVector,
  makeArrowGPURecordBatch,
  makeArrowGPUTable,
  makeArrowGPUVector
} from '@luma.gl/arrow';
import {GPUVector} from '@luma.gl/tables';
import type {ShaderLayout} from '@luma.gl/core';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {ArrowAttributeTextModel} from '../../src/text-2d/deprecated/arrow-attribute-text-model';
import {ArrowDictionaryTextModel} from '../../src/text-2d/deprecated/arrow-dictionary-text-model';
import {
  ArrowRowIndexedStorageTextModel,
  ArrowStorageTextModel
} from '../../src/text-2d/deprecated/arrow-storage-text-model';
import {
  buildArrowTextGlyphTable,
  createArrowStorageTextState,
  packStorageTextClipRects,
  type ArrowUtf8Dictionary,
  type ArrowUtf8TextType,
  type ArrowUtf8TextVector,
  type CharacterMapping
} from '../../src/index';

const CHARACTER_MAPPING: CharacterMapping = {
  A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
  B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7}
};

const APPENDABLE_TEXT_INPUT_SHADER_LAYOUT = {
  attributes: [{name: 'positions', location: 0, type: 'vec2<f32>', stepMode: 'instance'}],
  bindings: [{name: 'texts', type: 'read-only-storage', group: 0, location: 0}]
} satisfies ShaderLayout;

const DICTIONARY_DRAW_TEST_SHADER_LAYOUT = {
  attributes: [],
  bindings: []
} satisfies ShaderLayout;

const DICTIONARY_DRAW_TEST_WGSL_SHADER = /* wgsl */ `\
struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

@vertex
fn vertexMain(inputs : VertexInputs) -> @builtin(position) vec4<f32> {
  let x = f32(inputs.instanceIndex & 1u) * 0.01;
  let y = f32(inputs.vertexIndex % 2u) * 0.01;
  return vec4<f32>(x + y, y, 0.0, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}
`;

test('buildArrowTextGlyphTable repeats Arrow label attributes for each glyph', t => {
  const labelTable = makeLabelTable();
  const texts = arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8());
  const result = buildArrowTextGlyphTable({
    labelTable,
    texts,
    mapping: CHARACTER_MAPPING,
    baselineOffset: 1,
    lineHeight: 10
  });

  t.equal(result.table.numRows, 3, 'glyph table has one row per glyph');
  t.deepEqual(result.glyphLayout.startIndices, [0, 2, 3], 'label start indices are retained');
  t.deepEqual(
    Array.from(result.table.getChild('glyphOffsets')!.data[0]!.children[0]!.values as Float32Array),
    [2, 6, 7, 6, 2, 6],
    'glyph offsets are generated from the mapping'
  );
  t.equal(result.table.getChild('positions')!.length, 3, 'label positions repeat across glyphs');
  t.deepEqual(
    Array.from(result.table.getChild('rowIndices')!.data[0]!.values as Uint32Array),
    [0, 0, 1],
    'source label row indices repeat across generated glyphs'
  );
  t.end();
});

test('buildArrowTextGlyphTable expands character color lists per glyph', t => {
  const labelTable = new arrow.Table({
    positions: makeArrowPositions(2),
    colors: makeTextColorListVector(
      new Int32Array([0, 2, 3]),
      new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255])
    )
  });
  const result = buildArrowTextGlyphTable({
    labelTable,
    texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
    mapping: CHARACTER_MAPPING,
    baselineOffset: 1,
    lineHeight: 10
  });

  t.deepEqual(
    Array.from(result.table.getChild('colors')!.data[0]!.children[0]!.values as Uint8Array),
    [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255],
    'per-character color lists flatten to one FixedSizeList color per generated glyph'
  );
  t.end();
});

test('buildArrowTextGlyphTable expands packed clip rectangles per glyph', t => {
  const clipRects = makeArrowFixedSizeListVector(
    new arrow.Int16(),
    4,
    new Int16Array([0, 1, 12, -1, 3, 4, -1, 9])
  );
  const result = buildArrowTextGlyphTable({
    labelTable: makeLabelTable(),
    texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
    clipRects,
    mapping: CHARACTER_MAPPING,
    baselineOffset: 1,
    lineHeight: 10
  });

  t.deepEqual(
    Array.from(result.table.getChild('glyphClipRects')!.data[0]!.children[0]!.values as Int16Array),
    [0, 1, 12, -1, 0, 1, 12, -1, 3, 4, -1, 9],
    'packed i16x4 clip rectangles repeat for each generated glyph'
  );
  t.end();
});

test('packStorageTextClipRects preserves signed Int16 clip lanes', t => {
  const packedClipRects = packStorageTextClipRects(
    makeArrowFixedSizeListVector(new arrow.Int16(), 4, new Int16Array([0, 1, 12, -1, -4, 8, -1, 9]))
  );

  t.deepEqual(
    Array.from(packedClipRects).flatMap(unpackSignedInt16Pair),
    [0, 1, 12, -1, -4, 8, -1, 9],
    'packed storage rows decode to original signed clip lanes'
  );
  t.end();
});

test('ArrowAttributeTextModel derives from GPUTableModel and updates glyph instance counts', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowAttributeTextModel(device, {
    id: 'arrow-text-model-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });

  t.equal(model.instanceCount, 3, 'instance count uses generated glyph rows');
  t.deepEqual(model.glyphLayout.startIndices, [0, 2, 3], 'model exposes glyph start indices');
  t.equal(model.glyphTable.numRows, 3, 'model retains generated glyph table');

  const updatedTextSource = makeArrowTexts(['A', 'A']);
  const updatedTexts = makeGpuTexts(device, updatedTextSource);
  model.setProps({
    texts: updatedTexts,
    sourceVectors: {...textProps.sourceVectors, texts: updatedTextSource}
  });
  t.equal(model.instanceCount, 2, 'updates instance count when text changes');
  t.deepEqual(model.glyphLayout.startIndices, [0, 1, 2], 'updates start indices');

  model.destroy();
  destroyGpuTextProps(textProps);
  updatedTexts.destroy();
  t.end();
});

test('ArrowAttributeTextModel accepts dictionary UTF-8 source vectors', async t => {
  const device = new NullDevice({});
  const textProps = makeGpuDictionaryTextProps(device, ['AB', 'A', 'AB', null]);
  const model = new ArrowAttributeTextModel(device, {
    id: 'arrow-text-model-dictionary-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  const expandedGlyphBytes = await model.expandedGlyphVertexData.readAsync();
  const expandedGlyphWords = new Uint32Array(
    expandedGlyphBytes.buffer,
    expandedGlyphBytes.byteOffset,
    20
  );

  t.equal(model.instanceCount, 5, 'dictionary labels expand into repeated glyph instances');
  t.deepEqual(model.glyphLayout.startIndices, [0, 2, 3, 5, 5], 'null rows render empty');
  t.deepEqual(
    Array.from(expandedGlyphWords),
    [
      packSignedInt16Pair(2, 5),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      0,
      packSignedInt16Pair(7, 5),
      packUint16Pair(4, 0),
      packUint16Pair(4, 6),
      0,
      packSignedInt16Pair(2, 5),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      1,
      packSignedInt16Pair(2, 5),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      2,
      packSignedInt16Pair(7, 5),
      packUint16Pair(4, 0),
      packUint16Pair(4, 6),
      2
    ],
    'direct model repeats row indices for each expanded dictionary glyph'
  );

  model.destroy();
  destroyGpuTextProps(textProps);
  t.end();
});

test('ArrowAttributeTextModel requires explicit CPU source vectors', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const {sourceVectors, ...propsWithoutSourceVectors} = textProps;

  t.throws(
    () =>
      new ArrowAttributeTextModel(device, {
        id: 'arrow-text-model-missing-sources-test',
        ...(propsWithoutSourceVectors as Omit<typeof textProps, 'sourceVectors'>),
        characterMapping: CHARACTER_MAPPING,
        fontSettings: {fontSize: 10}
      } as never),
    /requires explicit sourceVectors/,
    'CPU source ownership is visible at the text model boundary'
  );

  destroyGpuTextProps(textProps);
  t.end();
});

test('ArrowAttributeTextModel rejects source batch alignment mismatches', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const firstChunk = makeArrowTexts(['AB']);
  const secondChunk = makeArrowTexts(['A']);

  t.throws(
    () =>
      new ArrowAttributeTextModel(device, {
        id: 'arrow-text-model-source-batch-alignment-test',
        ...textProps,
        sourceVectors: {
          ...textProps.sourceVectors,
          texts: new arrow.Vector<arrow.Utf8>([...firstChunk.data, ...secondChunk.data])
        },
        characterMapping: CHARACTER_MAPPING,
        fontSettings: {fontSize: 10}
      }),
    /batch count must match GPU batches/,
    'source vector batches stay explicitly aligned with GPU vector batches'
  );

  destroyGpuTextProps(textProps);
  t.end();
});

test('ArrowAttributeTextModel interleaves expanded glyph vertex records', async t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowAttributeTextModel(device, {
    id: 'arrow-text-model-expanded-glyph-vertices-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  const expandedGlyphBytes = await model.expandedGlyphVertexData.readAsync();
  const expandedGlyphWords = new Uint32Array(
    expandedGlyphBytes.buffer,
    expandedGlyphBytes.byteOffset,
    12
  );
  const expandedGlyphLayout = model.bufferLayout.find(
    layout => layout.name === 'expandedGlyphVertexData'
  );

  t.equal(expandedGlyphLayout?.byteStride, 16, 'expanded glyph records use a 16-byte stride');
  t.deepEqual(
    expandedGlyphLayout?.attributes,
    [
      {attribute: 'glyphOffsets', format: 'sint16x2', byteOffset: 0},
      {attribute: 'glyphFrames', format: 'uint16x4', byteOffset: 4}
    ],
    'default render attributes read from the expanded glyph vertex data'
  );
  t.deepEqual(
    Array.from(expandedGlyphWords),
    [
      packSignedInt16Pair(2, 5),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      0,
      packSignedInt16Pair(7, 5),
      packUint16Pair(4, 0),
      packUint16Pair(4, 6),
      0,
      packSignedInt16Pair(2, 5),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      1
    ],
    'expanded glyph records store generated offsets, inline frames, and source row ids'
  );

  model.destroy();
  destroyGpuTextProps(textProps);
  t.end();
});

test('ArrowAttributeTextModel splits expanded glyph vertex buffers by device limits', t => {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'maxBufferSize', {value: 48});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowAttributeTextModel(device, {
    id: 'arrow-text-model-buffer-batching-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });

  t.equal(model.renderBatches.length, 2, 'generated glyph output splits into two render batches');
  t.deepEqual(
    model.renderBatches.map(batch => batch.glyphCount),
    [2, 1],
    'batching preserves whole source-label rows'
  );
  t.equal(model.table?.batches.length, 2, 'Arrow render rows split to matching GPU batches');
  t.equal(model.instanceCount, 3, 'aggregate glyph count remains unchanged');

  model.destroy();
  destroyGpuTextProps(textProps);
  t.end();
});

test('ArrowAttributeTextModel built-in fragment shader decodes SDF atlas alpha', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowAttributeTextModel(device, {
    id: 'arrow-text-model-sdf-shader-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10, sdf: true, cutoff: 0.25, smoothing: 0.07}
  });

  t.ok(
    model.fs.includes('uniform float textUsesSdf;'),
    'default shader exposes an SDF mode uniform'
  );
  t.ok(model.fs.includes('smoothstep('), 'default shader smooths sampled SDF alpha');

  model.destroy();
  destroyGpuTextProps(textProps);
  t.end();
});

test('ArrowAttributeTextModel expands chunked UTF-8 GPUVector data', t => {
  const device = new NullDevice({});
  const firstChunk = arrow.vectorFromArray(['AB'], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(['A'], new arrow.Utf8());
  const textProps = makeGpuTextProps(device, ['A', 'A']);
  textProps.texts.destroy();
  const sourceTexts = new arrow.Vector<arrow.Utf8>([...firstChunk.data, ...secondChunk.data]);
  textProps.texts = makeArrowGPUVector(device, sourceTexts, {name: 'texts'});
  textProps.sourceVectors = {...textProps.sourceVectors, texts: sourceTexts};

  const model = new ArrowAttributeTextModel(device, {
    id: 'chunked-arrow-text-model-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });

  t.equal(textProps.texts.data.length, 2, 'GPUVector preserves both UTF-8 GPUData chunks');
  t.equal(model.instanceCount, 3, 'glyph expansion spans every retained UTF-8 chunk');
  t.deepEqual(model.glyphLayout.startIndices, [0, 2, 3], 'row starts cross chunk boundaries');

  model.destroy();
  destroyGpuTextProps(textProps);
  t.end();
});

test('ArrowAttributeTextModel appends GPUTable-backed text batches without rebuilding prior glyph buffers', t => {
  const device = new NullDevice({});
  const firstBatch = makeAppendableTextRecordBatch(['AB'], new Float32Array([0, 0]));
  const secondBatch = makeAppendableTextRecordBatch(['A'], new Float32Array([1, 1]));
  const gpuTable = makeArrowGPUTable(device, new arrow.Table([firstBatch]), {
    shaderLayout: APPENDABLE_TEXT_INPUT_SHADER_LAYOUT
  });
  const firstSourceVectors = makeArrowTextSourceVectorsFromBatches([firstBatch]);

  const model = new ArrowAttributeTextModel(device, {
    id: 'arrow-text-model-appendable-gpu-table-test',
    positions: gpuTable.gpuVectors.positions as GPUVector<arrow.FixedSizeList<arrow.Float32>>,
    texts: gpuTable.gpuVectors.texts as GPUVector<arrow.Utf8>,
    sourceVectors: firstSourceVectors,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  t.equal(model.glyphLayout.glyphCount, 2, 'starts from the first appended text batch');
  const firstExpandedGlyphVertexData = model.renderBatches[0].expandedGlyphVertexData;

  gpuTable.addBatch(
    makeArrowGPURecordBatch(device, secondBatch, {
      shaderLayout: APPENDABLE_TEXT_INPUT_SHADER_LAYOUT
    })
  );
  model.appendTextBatches({
    positions: gpuTable.gpuVectors.positions as GPUVector<arrow.FixedSizeList<arrow.Float32>>,
    texts: gpuTable.gpuVectors.texts as GPUVector<arrow.Utf8>,
    sourceVectors: makeArrowTextSourceVectorsFromBatches([firstBatch, secondBatch])
  });
  t.equal(model.glyphLayout.glyphCount, 3, 'adds glyphs from the later GPU record batch');
  t.equal(
    model.renderBatches[0].expandedGlyphVertexData,
    firstExpandedGlyphVertexData,
    'retains the first generated glyph vertex buffer'
  );

  model.destroy();
  gpuTable.destroy();
  t.end();
});

test('ArrowStorageTextModel packs SDF alpha settings into the style config uniform', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeStorageGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowStorageTextModel(device, {
    id: 'arrow-storage-text-sdf-style-config-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10, sdf: true, cutoff: 0.25, smoothing: 0.07}
  });
  const styleConfigBytes = await model.styleConfigBuffer.readAsync();
  const styleConfigFloats = new Float32Array(
    styleConfigBytes.buffer,
    styleConfigBytes.byteOffset,
    styleConfigBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
  );

  t.ok(
    Math.abs(styleConfigFloats[16] - 0.75) < 1e-6,
    'style config stores TinySDF alpha edge threshold'
  );
  t.ok(
    Math.abs(styleConfigFloats[17] - 0.07) < 1e-6,
    'style config stores fragment smoothing width'
  );

  model.destroy();
  destroyStorageGpuTextProps(textProps);
  t.end();
});

test('ArrowStorageTextModel interleaves compact glyph vertex records', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeStorageGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowStorageTextModel(device, {
    id: 'arrow-storage-text-generated-glyph-vertices-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  const glyphVertexBytes = await model.compactGlyphVertexData.readAsync();
  const generatedGlyphVertexWords = new Uint32Array(
    glyphVertexBytes.buffer,
    glyphVertexBytes.byteOffset,
    model.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  const generatedGlyphVertexLayout = model.bufferLayout.find(
    layout => layout.name === 'compactGlyphVertexData'
  );

  t.equal(model.generatedRenderBufferByteLength, 24, 'three glyphs keep the 8-byte record budget');
  t.equal(generatedGlyphVertexLayout?.byteStride, 8, 'generated records use an 8-byte stride');
  t.deepEqual(
    generatedGlyphVertexLayout?.attributes,
    [
      {attribute: 'glyphOffsets', format: 'sint16x2', byteOffset: 0},
      {attribute: 'glyphIndices', format: 'uint16x2', byteOffset: 4}
    ],
    'one interleaved buffer exposes glyph offset and id attributes'
  );
  t.deepEqual(
    Array.from(generatedGlyphVertexWords),
    [packSignedInt16Pair(2, 5), 1, packSignedInt16Pair(7, 5), 2, packSignedInt16Pair(2, 5), 1],
    'generated records store packed offsets and glyph ids in order'
  );
  const rowGlyphStartsBytes = await model.rowGlyphStartsBuffer.readAsync();
  const rowGlyphStarts = new Uint32Array(
    rowGlyphStartsBytes.buffer,
    rowGlyphStartsBytes.byteOffset,
    3
  );
  const renderConfigBytes = await model.storageRenderConfigBuffer.readAsync();
  const renderConfig = new Uint32Array(renderConfigBytes.buffer, renderConfigBytes.byteOffset, 4);
  t.deepEqual(Array.from(rowGlyphStarts), [0, 2, 3], 'row glyph starts map glyphs back to rows');
  t.deepEqual(Array.from(renderConfig), [0, 0, 2, 0], 'render config scopes row lookup');

  model.destroy();
  destroyStorageGpuTextProps(textProps);
  t.end();
});

test('ArrowRowIndexedStorageTextModel stores row indices in compact glyph records', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeStorageGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowRowIndexedStorageTextModel(device, {
    id: 'arrow-row-indexed-storage-text-generated-glyph-vertices-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  const glyphVertexBytes = await model.compactGlyphVertexData.readAsync();
  const generatedGlyphVertexWords = new Uint32Array(
    glyphVertexBytes.buffer,
    glyphVertexBytes.byteOffset,
    model.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  const generatedGlyphVertexLayout = model.bufferLayout.find(
    layout => layout.name === 'compactGlyphVertexData'
  );

  t.equal(model.generatedRenderBufferByteLength, 36, 'three glyphs keep a 12-byte record budget');
  t.equal(generatedGlyphVertexLayout?.byteStride, 12, 'generated records use a 12-byte stride');
  t.deepEqual(
    generatedGlyphVertexLayout?.attributes,
    [
      {attribute: 'glyphOffsets', format: 'sint16x2', byteOffset: 0},
      {attribute: 'glyphIndices', format: 'uint16x2', byteOffset: 4},
      {attribute: 'glyphRowIndices', format: 'uint32', byteOffset: 8}
    ],
    'row-indexed records expose glyph offset, id, and source row attributes'
  );
  t.deepEqual(
    Array.from(generatedGlyphVertexWords),
    [
      packSignedInt16Pair(2, 5),
      1,
      0,
      packSignedInt16Pair(7, 5),
      2,
      0,
      packSignedInt16Pair(2, 5),
      1,
      1
    ],
    'generated records store source row indices next to glyph data'
  );

  model.destroy();
  destroyStorageGpuTextProps(textProps);
  t.end();
});

test('ArrowStorageTextModel accepts dictionary UTF-8 text through CPU glyph expansion', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeStorageGpuDictionaryTextProps(device, ['AB', 'A', 'AB']);
  const model = new ArrowStorageTextModel(device, {
    id: 'arrow-storage-text-dictionary-expanded-glyph-vertices-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  const glyphVertexBytes = await model.compactGlyphVertexData.readAsync();
  const generatedGlyphVertexWords = new Uint32Array(
    glyphVertexBytes.buffer,
    glyphVertexBytes.byteOffset,
    model.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );

  t.equal(model.glyphCount, 5, 'storage model expands repeated dictionary labels per row');
  t.equal(
    model.generatedRenderBufferByteLength,
    40,
    'naive dictionary storage keeps one compact glyph record per visible glyph'
  );
  t.deepEqual(
    Array.from(generatedGlyphVertexWords),
    [
      packSignedInt16Pair(2, 5),
      1,
      packSignedInt16Pair(7, 5),
      2,
      packSignedInt16Pair(2, 5),
      1,
      packSignedInt16Pair(2, 5),
      1,
      packSignedInt16Pair(7, 5),
      2
    ],
    'dictionary rows are copied into the regular compact glyph stream without row indices'
  );

  model.destroy();
  destroyStorageGpuTextProps(textProps);
  t.end();
});

test('ArrowDictionaryTextModel shares dictionary glyph records per batch', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeStorageGpuDictionaryTextProps(device, ['AB', 'A', 'AB']);
  const model = new ArrowDictionaryTextModel(device, {
    id: 'arrow-dictionary-storage-text-compressed-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  const dictionaryGlyphRecordBytes = await model.dictionaryGlyphRecordsBuffer.readAsync();
  const dictionaryGlyphRecordWords = new Uint32Array(
    dictionaryGlyphRecordBytes.buffer,
    dictionaryGlyphRecordBytes.byteOffset,
    model.dictionaryGlyphCount * 2
  );
  const rowDictionaryRecordBytes = await model.rowDictionaryRecordsBuffer.readAsync();
  const rowDictionaryRecords = new Uint32Array(
    rowDictionaryRecordBytes.buffer,
    rowDictionaryRecordBytes.byteOffset,
    8
  );

  t.equal(model.glyphCount, 5, 'visible glyph count still expands per row occurrence');
  t.equal(model.dictionaryValueCount, 2, 'dictionary batch keeps two unique string values');
  t.equal(model.dictionaryGlyphCount, 3, 'shared dictionary glyph records store AB and A once');
  t.equal(
    model.generatedRenderBufferByteLength,
    0,
    'dictionary model has no generated per-visible-glyph vertex buffer'
  );
  t.deepEqual(
    Array.from(rowDictionaryRecords),
    [0, 0, 1, 2, 0, 3, 0xffffffff, 5],
    'row dictionary records pack dictionary keys and glyph starts'
  );
  t.deepEqual(
    Array.from(dictionaryGlyphRecordWords),
    [packSignedInt16Pair(2, 5), 1, packSignedInt16Pair(7, 5), 2, packSignedInt16Pair(2, 5), 1],
    'glyph offsets and ids are not duplicated for repeated dictionary values'
  );

  model.destroy();
  destroyStorageGpuTextProps(textProps);
  t.end();
});

test('ArrowDictionaryTextModel draws every dictionary source batch', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeChunkedStorageGpuDictionaryTextProps(device, [['AB'], ['A'], ['AB', 'A']]);
  const model = new ArrowDictionaryTextModel(device, {
    id: 'arrow-dictionary-text-chunked-draw-test',
    ...textProps,
    source: DICTIONARY_DRAW_TEST_WGSL_SHADER,
    shaderLayout: DICTIONARY_DRAW_TEST_SHADER_LAYOUT,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  model.predraw(device.commandEncoder);
  const drawCalls: {
    instanceCount?: number;
    dictionaryRenderConfigBuffer?: unknown;
    styleConfigBuffer?: unknown;
    rowPositionsBuffer?: unknown;
  }[] = [];
  const privateModel = model as unknown as {
    _syncAttachmentFormats(renderPass: unknown): void;
    _updatePipeline(): typeof model.pipeline;
  };
  const syncAttachmentFormats = privateModel._syncAttachmentFormats.bind(model);
  const updatePipeline = privateModel._updatePipeline.bind(model);
  const patchedPipelines = new WeakSet<object>();
  const patchPipelineDraw = (): void => {
    const pipeline = model.pipeline;
    if (patchedPipelines.has(pipeline)) {
      return;
    }
    patchedPipelines.add(pipeline);
    pipeline.draw = options => {
      drawCalls.push({
        instanceCount: options.instanceCount,
        dictionaryRenderConfigBuffer: options.bindings.textDictionaryRenderConfig,
        styleConfigBuffer: options.bindings.textStorageStyleConfig,
        rowPositionsBuffer: options.bindings.textRowPositions
      });
      return true;
    };
  };

  patchPipelineDraw();
  privateModel._syncAttachmentFormats = () => {};
  privateModel._updatePipeline = () => {
    const pipeline = updatePipeline();
    patchPipelineDraw();
    return pipeline;
  };

  try {
    t.ok(model.draw({} as never), 'draws chunked dictionary text');
    t.deepEqual(
      drawCalls.map(drawCall => drawCall.instanceCount),
      [2, 1, 3],
      'uses each source batch glyph occurrence count'
    );
    t.deepEqual(
      drawCalls.map(drawCall => drawCall.dictionaryRenderConfigBuffer),
      model.renderBatches.map(renderBatch => renderBatch.dictionaryRenderConfigBuffer.buffer),
      'binds each batch dictionary render config buffer'
    );
    t.deepEqual(
      drawCalls.map(drawCall => drawCall.styleConfigBuffer),
      model.batches.map(batch => batch.styleConfigBuffer.buffer),
      'binds each batch style config buffer'
    );
    t.deepEqual(
      drawCalls.map(drawCall => drawCall.rowPositionsBuffer),
      model.batches.map(batch => resolveTestStorageBuffer(batch.rowPositionsBuffer)),
      'binds each row storage batch'
    );
    const styleConfigRows = await Promise.all(
      model.batches.map(async batch => {
        const styleConfigBytes = await batch.styleConfigBuffer.readAsync();
        const styleConfigWords = new Uint32Array(
          styleConfigBytes.buffer,
          styleConfigBytes.byteOffset,
          styleConfigBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
        );
        return {
          batchRowIndexBase: styleConfigWords[13],
          rowStorageIndexBase: styleConfigWords[14]
        };
      })
    );
    t.deepEqual(
      styleConfigRows,
      [
        {batchRowIndexBase: 0, rowStorageIndexBase: 0},
        {batchRowIndexBase: 1, rowStorageIndexBase: 1},
        {batchRowIndexBase: 2, rowStorageIndexBase: 2}
      ],
      'style configs preserve global picking row base and row storage buffer offset per batch'
    );
  } finally {
    privateModel._syncAttachmentFormats = syncAttachmentFormats;
    privateModel._updatePipeline = updatePipeline;
    model.destroy();
    destroyStorageGpuTextProps(textProps);
  }
  t.end();
});

test('ArrowStorageTextModel appends GPUTable-backed text batches without rebuilding prior glyph buffers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const firstBatch = makeAppendableTextRecordBatch(['AB'], new Float32Array([0, 0]));
  const secondBatch = makeAppendableTextRecordBatch(['A'], new Float32Array([1, 1]));
  const gpuTable = makeArrowGPUTable(device, new arrow.Table([firstBatch]), {
    shaderLayout: APPENDABLE_TEXT_INPUT_SHADER_LAYOUT
  });
  const firstSourceVectors = makeArrowStorageTextSourceVectorsFromBatches([firstBatch]);

  const model = new ArrowStorageTextModel(device, {
    id: 'arrow-storage-text-appendable-gpu-table-test',
    positions: gpuTable.gpuVectors.positions as GPUVector<arrow.FixedSizeList<arrow.Float32>>,
    texts: gpuTable.gpuVectors.texts as GPUVector<arrow.Utf8>,
    sourceVectors: firstSourceVectors,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  const firstCompactGlyphVertexData = model.renderBatches[0].compactGlyphVertexData;

  gpuTable.addBatch(
    makeArrowGPURecordBatch(device, secondBatch, {
      shaderLayout: APPENDABLE_TEXT_INPUT_SHADER_LAYOUT
    })
  );
  model.appendTextBatches({
    positions: gpuTable.gpuVectors.positions as GPUVector<arrow.FixedSizeList<arrow.Float32>>,
    texts: gpuTable.gpuVectors.texts as GPUVector<arrow.Utf8>,
    sourceVectors: makeArrowStorageTextSourceVectorsFromBatches([firstBatch, secondBatch])
  });

  t.equal(model.glyphCount, 3, 'storage text expansion reads the appended UTF-8 batch');
  t.equal(model.batches.length, 2, 'storage row bindings preserve appended chunk boundaries');
  t.equal(
    model.renderBatches[0].compactGlyphVertexData,
    firstCompactGlyphVertexData,
    'retains the first generated compact glyph vertex buffer'
  );

  model.destroy();
  gpuTable.destroy();
  t.end();
});

test('ArrowStorageTextModel appends dictionary GPUTable-backed text batches', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  const firstBatch = makeAppendableTextRecordBatch(
    ['AB'],
    new Float32Array([0, 0]),
    dictionaryType
  );
  const secondBatch = makeAppendableTextRecordBatch(
    ['A', 'AB'],
    new Float32Array([1, 1, 2, 2]),
    dictionaryType
  );
  const gpuTable = makeArrowGPUTable(device, new arrow.Table([firstBatch]), {
    shaderLayout: APPENDABLE_TEXT_INPUT_SHADER_LAYOUT
  });
  const firstSourceVectors = makeArrowStorageTextSourceVectorsFromBatches([firstBatch]);

  const model = new ArrowStorageTextModel(device, {
    id: 'arrow-storage-text-dictionary-appendable-gpu-table-test',
    positions: gpuTable.gpuVectors.positions as GPUVector<arrow.FixedSizeList<arrow.Float32>>,
    texts: gpuTable.gpuVectors.texts as GPUVector<ArrowUtf8TextType>,
    sourceVectors: firstSourceVectors,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  const firstCompactGlyphVertexData = model.renderBatches[0].compactGlyphVertexData;

  gpuTable.addBatch(
    makeArrowGPURecordBatch(device, secondBatch, {
      shaderLayout: APPENDABLE_TEXT_INPUT_SHADER_LAYOUT
    })
  );
  model.appendTextBatches({
    positions: gpuTable.gpuVectors.positions as GPUVector<arrow.FixedSizeList<arrow.Float32>>,
    texts: gpuTable.gpuVectors.texts as GPUVector<ArrowUtf8TextType>,
    sourceVectors: makeArrowStorageTextSourceVectorsFromBatches([firstBatch, secondBatch])
  });

  t.equal(model.glyphCount, 5, 'storage append expands dictionary text from new batches');
  t.equal(model.batches.length, 2, 'dictionary row bindings retain appended chunk boundaries');
  t.equal(
    model.renderBatches[0].compactGlyphVertexData,
    firstCompactGlyphVertexData,
    'dictionary append keeps existing generated glyph buffers resident'
  );

  model.destroy();
  gpuTable.destroy();
  t.end();
});

test('ArrowStorageTextModel splits compact glyph buffers by device limits', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const originalMaxStorageBufferBindingSize = device.limits.maxStorageBufferBindingSize;
  Object.defineProperty(device.limits, 'maxStorageBufferBindingSize', {
    value: 25,
    configurable: true
  });

  try {
    const textProps = makeStorageGpuTextProps(device, ['AB', 'A']);
    const model = new ArrowStorageTextModel(device, {
      id: 'arrow-storage-text-buffer-batching-test',
      ...textProps,
      characterMapping: CHARACTER_MAPPING,
      fontSettings: {fontSize: 10}
    });

    t.equal(
      model.storageState.batches.length,
      1,
      'row bindings remain in their original input batch'
    );
    t.equal(model.renderBatches.length, 2, 'generated glyph output splits into render batches');
    t.deepEqual(
      model.renderBatches.map(batch => batch.glyphCount),
      [2, 1],
      'storage batching preserves whole source-label rows'
    );
    t.equal(
      model.generatedRenderBufferByteLength,
      24,
      'aggregate generated byte accounting stays exact'
    );

    model.destroy();
    destroyStorageGpuTextProps(textProps);
  } finally {
    Object.defineProperty(device.limits, 'maxStorageBufferBindingSize', {
      value: originalMaxStorageBufferBindingSize,
      configurable: true
    });
  }
  t.end();
});

test('ArrowStorageTextModel rejects non-WebGPU devices', t => {
  const device = new NullDevice({});
  const textProps = makeStorageGpuTextProps(device, ['AB', 'A']);

  t.throws(
    () =>
      new ArrowStorageTextModel(device, {
        id: 'arrow-storage-text-model-test',
        ...textProps,
        characterMapping: CHARACTER_MAPPING,
        fontSettings: {fontSize: 10}
      }),
    /WebGPU-only/,
    'storage model reports its backend contract'
  );
  destroyStorageGpuTextProps(textProps);
  t.end();
});

test('createArrowStorageTextState rejects non-WebGPU devices', t => {
  const device = new NullDevice({});
  const textProps = makeStorageGpuTextProps(device, ['AB', 'A']);

  t.throws(
    () =>
      createArrowStorageTextState(device, {
        id: 'arrow-storage-text-state-test',
        ...textProps,
        characterMapping: CHARACTER_MAPPING,
        fontSettings: {fontSize: 10}
      }),
    /WebGPU device/,
    'storage-state builder reports its backend contract'
  );
  destroyStorageGpuTextProps(textProps);
  t.end();
});

test('ArrowStorageTextModel refreshes row bindings without rebuilding glyph buffers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeStorageGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowStorageTextModel(device, {
    id: 'arrow-storage-text-row-binding-refresh-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });
  const storageState = model.storageState;
  const compactGlyphVertexData = model.compactGlyphVertexData;
  const renderBatches = model.renderBatches;
  const styleConfigBuffer = model.styleConfigBuffer;

  model.setProps({color: [255, 0, 0, 255]});

  t.equal(model.storageState, storageState, 'row-binding updates preserve storage state');
  t.equal(
    model.compactGlyphVertexData,
    compactGlyphVertexData,
    'row-binding updates preserve compact glyph vertex data'
  );
  t.equal(
    model.renderBatches,
    renderBatches,
    'row-binding updates preserve generated render batches'
  );
  t.notEqual(
    model.styleConfigBuffer,
    styleConfigBuffer,
    'row-binding updates refresh owned style config buffers'
  );

  const updatedTextSource = makeArrowTexts(['A', 'A']);
  const updatedTexts = makeGpuTexts(device, updatedTextSource);
  model.setProps({
    texts: updatedTexts,
    sourceVectors: {...textProps.sourceVectors, texts: updatedTextSource}
  });

  t.notEqual(model.storageState, storageState, 'text updates replace storage state');
  t.notEqual(
    model.compactGlyphVertexData,
    compactGlyphVertexData,
    'text updates rebuild compact glyph vertex data'
  );

  model.destroy();
  destroyStorageGpuTextProps(textProps);
  updatedTexts.destroy();
  t.end();
});

function makeLabelTable(): arrow.Table {
  return new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 0, 1, 1]))
  });
}

function makeAppendableTextRecordBatch(
  labels: readonly (string | null)[],
  positions: Float32Array,
  textType: arrow.Utf8 | ArrowUtf8Dictionary = new arrow.Utf8()
): arrow.RecordBatch {
  const table = new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    texts: arrow.vectorFromArray(labels, textType)
  });
  const recordBatch = table.batches[0];
  if (!recordBatch) {
    throw new Error('Text test requires a populated Arrow record batch');
  }
  return recordBatch;
}

function makeArrowTextSourceVectorsFromBatches(recordBatches: arrow.RecordBatch[]) {
  const table = new arrow.Table(recordBatches);
  const positions = table.getChild('positions');
  const texts = table.getChild('texts');
  if (!positions || !texts) {
    throw new Error('Text source vectors require positions and texts columns');
  }
  return {
    positions: positions as arrow.Vector<arrow.FixedSizeList<arrow.Float32>>,
    texts: texts as ArrowUtf8TextVector
  };
}

function makeArrowStorageTextSourceVectorsFromBatches(recordBatches: arrow.RecordBatch[]) {
  const table = new arrow.Table(recordBatches);
  const texts = table.getChild('texts');
  if (!texts) {
    throw new Error('Storage text source vectors require a texts column');
  }
  return {texts: texts as ArrowUtf8TextVector};
}

function makeGpuTextProps(device: NullDevice, labels: string[]) {
  const positions = makeArrowPositions(labels.length);
  const texts = makeArrowTexts(labels);
  return {
    positions: makeArrowGPUVector(device, positions, {name: 'positions'}),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {positions, texts}
  };
}

function makeGpuDictionaryTextProps(device: NullDevice, labels: readonly (string | null)[]) {
  const positions = makeArrowPositions(labels.length);
  const texts = makeArrowDictionaryTexts(labels);
  return {
    positions: makeArrowGPUVector(device, positions, {name: 'positions'}),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {positions, texts}
  };
}

function makeArrowTexts(labels: readonly (string | null)[]): arrow.Vector<arrow.Utf8> {
  return arrow.vectorFromArray(labels, new arrow.Utf8()) as arrow.Vector<arrow.Utf8>;
}

function makeArrowDictionaryTexts(
  labels: readonly (string | null)[],
  dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32())
): arrow.Vector<ArrowUtf8Dictionary> {
  return arrow.vectorFromArray(labels, dictionaryType) as arrow.Vector<ArrowUtf8Dictionary>;
}

function makeGpuTexts<TextTypeT extends ArrowUtf8TextType>(
  device: NullDevice,
  vector: arrow.Vector<TextTypeT>
): GPUVector<TextTypeT> {
  return makeArrowGPUVector(device, vector, {name: 'texts'});
}

function destroyGpuTextProps(props: ReturnType<typeof makeGpuTextProps>): void {
  props.positions.destroy();
  props.texts.destroy();
}

function makeStorageGpuTextProps(device: NullDevice, labels: string[]) {
  const positions = makeArrowPositions(labels.length);
  const texts = makeArrowTexts(labels);
  return {
    positions: makeArrowGPUVector(device, positions, {name: 'positions'}),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {texts}
  };
}

function makeStorageGpuDictionaryTextProps(device: NullDevice, labels: readonly (string | null)[]) {
  const positions = makeArrowPositions(labels.length);
  const texts = makeArrowDictionaryTexts(labels);
  return {
    positions: makeArrowGPUVector(device, positions, {name: 'positions'}),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {texts}
  };
}

function makeChunkedStorageGpuDictionaryTextProps(
  device: NullDevice,
  labelChunks: readonly (readonly (string | null)[])[]
) {
  const positionDataChunks: arrow.Data<arrow.FixedSizeList<arrow.Float32>>[] = [];
  const textDataChunks: arrow.Data<ArrowUtf8Dictionary>[] = [];
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  for (const labelChunk of labelChunks) {
    const positions = makeArrowPositions(labelChunk.length);
    const texts = makeArrowDictionaryTexts(labelChunk, dictionaryType);
    positionDataChunks.push(...positions.data);
    textDataChunks.push(...texts.data);
  }
  const positions = new arrow.Vector<arrow.FixedSizeList<arrow.Float32>>(positionDataChunks);
  const texts = new arrow.Vector<ArrowUtf8Dictionary>(textDataChunks);
  return {
    positions: makeArrowGPUVector(device, positions, {name: 'positions'}),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {texts}
  };
}

function destroyStorageGpuTextProps(props: ReturnType<typeof makeStorageGpuTextProps>): void {
  props.positions.destroy();
  props.texts.destroy();
}

function makeArrowPositions(rowCount: number): arrow.Vector<arrow.FixedSizeList<arrow.Float32>> {
  const values = new Float32Array(rowCount * 2);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    values[rowIndex * 2] = rowIndex;
    values[rowIndex * 2 + 1] = rowIndex;
  }
  return makeArrowFixedSizeListVector(new arrow.Float32(), 2, values);
}

function makeTextColorListVector(
  valueOffsets: Int32Array,
  colors: Uint8Array
): arrow.Vector<arrow.List<arrow.FixedSizeList<arrow.Uint8>>> {
  const colorType = new arrow.FixedSizeList(4, new arrow.Field('values', new arrow.Uint8(), false));
  const textColorType = new arrow.List(new arrow.Field('colors', colorType, false));
  const colorValueData = new arrow.Data(new arrow.Uint8(), 0, colors.length, 0, {
    [arrow.BufferType.DATA]: colors
  });
  const colorData = new arrow.Data(colorType, 0, colors.length / 4, 0, {}, [colorValueData]);
  const textColorData = new arrow.Data(
    textColorType,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [colorData]
  );
  return new arrow.Vector([textColorData]) as arrow.Vector<
    arrow.List<arrow.FixedSizeList<arrow.Uint8>>
  >;
}

function unpackSignedInt16Pair(word: number): [number, number] {
  return [toSignedInt16(word & 0xffff), toSignedInt16((word >>> 16) & 0xffff)];
}

function packSignedInt16Pair(lowerValue: number, upperValue: number): number {
  return ((lowerValue & 0xffff) | ((upperValue & 0xffff) << 16)) >>> 0;
}

function resolveTestStorageBuffer(buffer: unknown): unknown {
  return buffer && typeof buffer === 'object' && 'buffer' in buffer
    ? (buffer as {buffer: unknown}).buffer
    : buffer;
}

function packUint16Pair(lowerValue: number, upperValue: number): number {
  return ((lowerValue & 0xffff) | ((upperValue & 0xffff) << 16)) >>> 0;
}

function toSignedInt16(value: number): number {
  return value & 0x8000 ? value - 0x10000 : value;
}
