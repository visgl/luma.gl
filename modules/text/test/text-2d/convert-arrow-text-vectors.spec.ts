// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  buildArrowTextGlyphTable,
  createArrowTextStorageState,
  createTextStorageStateFromGPUVectors,
  convertArrowTextToAttribute,
  convertArrowTextToAttributeModelProps,
  convertArrowTextToDictionaryModelProps,
  convertArrowTextToStorageModelProps,
  convertArrowTextToStorageState,
  makeArrowFixedSizeListVector,
  makeGPURecordBatchFromArrowRecordBatch,
  makeGPUTableFromArrowTable,
  makeGPUVectorFromArrow,
  packTextStorageClipRects,
  type ArrowUtf8Dictionary,
  type ArrowUtf8TextType,
  type ArrowUtf8TextVector
} from '@luma.gl/arrow';
import {GPUVector} from '@luma.gl/tables';
import type {Device, ShaderLayout} from '@luma.gl/core';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {
  TextAttributeModel,
  TextDictionaryModel,
  TextRowIndexedStorageModel,
  TextStorageModel,
  type CharacterMapping,
  type FontAtlas
} from '../../src/index';

const CHARACTER_MAPPING: CharacterMapping = {
  A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
  B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7},
  '🙂': {x: 8, y: 0, width: 8, height: 8, anchorX: 4, anchorY: 4, advance: 9}
};
const FONT_ATLAS: FontAtlas = {
  baselineOffset: 1,
  lineHeight: 10,
  xOffset: 0,
  yOffsetMin: 0,
  yOffsetMax: 10,
  mapping: CHARACTER_MAPPING,
  renderSettings: {mode: 'bitmap', threshold: 0, smoothing: 0},
  pages: [new ImageData(16, 16)],
  width: 16,
  height: 16
};
const SDF_FONT_ATLAS: FontAtlas = {
  ...FONT_ATLAS,
  renderSettings: {mode: 'sdf', threshold: 0.75, smoothing: 0.07}
};

const STREAMING_TEXT_INPUT_SHADER_LAYOUT = {
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
    fontAtlas: FONT_ATLAS
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
    fontAtlas: FONT_ATLAS
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
    fontAtlas: FONT_ATLAS
  });

  t.deepEqual(
    Array.from(result.table.getChild('glyphClipRects')!.data[0]!.children[0]!.values as Int16Array),
    [0, 1, 12, -1, 0, 1, 12, -1, 3, 4, -1, 9],
    'packed i16x4 clip rectangles repeat for each generated glyph'
  );
  t.end();
});

test('buildArrowTextGlyphTable expands nullable row colors with constant color fallback', t => {
  const colorType = new arrow.FixedSizeList(4, new arrow.Field('values', new arrow.Uint8(), false));
  const colorData = new arrow.Data(
    colorType,
    0,
    2,
    1,
    {
      [arrow.BufferType.VALIDITY]: new Uint8Array([0b00000001])
    },
    [
      new arrow.Data(new arrow.Uint8(), 0, 8, 0, {
        [arrow.BufferType.DATA]: new Uint8Array([255, 0, 0, 255, 0, 0, 0, 0])
      })
    ]
  );
  const labelTable = new arrow.Table({
    positions: makeArrowPositions(2),
    colors: new arrow.Vector([colorData]) as arrow.Vector<arrow.FixedSizeList<arrow.Uint8>>
  });
  const result = buildArrowTextGlyphTable({
    labelTable,
    texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
    fontAtlas: FONT_ATLAS,
    color: [10, 20, 30, 255]
  });

  t.deepEqual(
    Array.from(result.table.getChild('colors')!.data[0]!.children[0]!.values as Uint8Array),
    [255, 0, 0, 255, 255, 0, 0, 255, 10, 20, 30, 255],
    'null row colors expand to the constant color fallback'
  );
  t.end();
});

test('convertArrowTextToAttribute uploads packed colors as normalized vectors', t => {
  const device = new NullDevice({});
  const positions = makeArrowPositions(2);
  const texts = makeArrowTexts(['AB', 'A']);
  const rowColors = makeArrowFixedSizeListVector(
    new arrow.Uint8(),
    4,
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
  );
  const rowColorText = convertArrowTextToAttribute(device, {
    sourceVectors: {positions, texts, colors: rowColors}
  });
  const characterColorText = convertArrowTextToAttribute(device, {
    sourceVectors: {
      positions,
      texts,
      colors: makeTextColorListVector(
        new Int32Array([0, 2, 3]),
        new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255])
      )
    }
  });

  t.equal(rowColorText.colors?.format, 'unorm8x4', 'row colors use normalized RGBA8');
  t.equal(
    characterColorText.colors?.format,
    'vertex-list<unorm8x4>',
    'character colors keep normalized variable-length RGBA8'
  );

  rowColorText.destroy();
  characterColorText.destroy();
  t.end();
});

test('packTextStorageClipRects preserves signed Int16 clip lanes', t => {
  const packedClipRects = packTextStorageClipRects(
    makeArrowFixedSizeListVector(new arrow.Int16(), 4, new Int16Array([0, 1, 12, -1, -4, 8, -1, 9]))
  );

  t.deepEqual(
    Array.from(packedClipRects).flatMap(unpackSignedInt16Pair),
    [0, 1, 12, -1, -4, 8, -1, 9],
    'packed storage rows decode to original signed clip lanes'
  );
  t.end();
});

test('TextAttributeModel derives from GPUTableModel and rebuilds glyph instance counts', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const modelProps = convertArrowTextToAttributeModelProps(device, {
    id: 'arrow-text-model-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  t.equal(
    Object.prototype.hasOwnProperty.call(modelProps, 'sourceVectors'),
    false,
    'model-ready attribute props do not expose Arrow source vectors'
  );
  t.equal(
    Object.prototype.hasOwnProperty.call(modelProps, 'attributeState'),
    false,
    'model-ready attribute props are flat'
  );
  const model = new TextAttributeModel(device, modelProps);

  t.equal(model.instanceCount, 3, 'instance count uses generated glyph rows');
  t.deepEqual(model.glyphLayout.startIndices, [0, 2, 3], 'model exposes glyph start indices');
  t.equal(modelProps.glyphTable.table.numRows, 3, 'conversion state retains generated glyph table');

  const updatedTextSource = makeArrowTexts(['A', 'A']);
  const updatedTexts = makeGpuTexts(device, updatedTextSource);
  const updatedModel = createTextAttributeModel(device, {
    id: 'arrow-text-model-updated-test',
    positions: textProps.positions,
    texts: updatedTexts,
    sourceVectors: {...textProps.sourceVectors, texts: updatedTextSource},
    fontAtlas: FONT_ATLAS
  });
  t.equal(updatedModel.instanceCount, 2, 'rebuilt model uses updated text glyph count');
  t.deepEqual(updatedModel.glyphLayout.startIndices, [0, 1, 2], 'rebuilt model updates starts');

  model.destroy();
  updatedModel.destroy();
  destroyGpuTextProps(textProps);
  updatedTexts.destroy();
  t.end();
});

test('TextAttributeModel accepts dictionary UTF-8 source vectors', async t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextDictionaryProps(device, ['AB', 'A', 'AB', null]);
  const model = createTextAttributeModel(device, {
    id: 'arrow-text-model-dictionary-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  const expandedGlyphBytes = await model.expandedGlyphVertexData.readAsync();
  const expandedGlyphWords = new Uint32Array(
    expandedGlyphBytes.buffer,
    expandedGlyphBytes.byteOffset,
    25
  );

  t.equal(model.instanceCount, 5, 'dictionary labels expand into repeated glyph instances');
  t.deepEqual(model.glyphLayout.startIndices, [0, 2, 3, 5, 5], 'null rows render empty');
  t.deepEqual(
    Array.from(expandedGlyphWords),
    [
      packSignedInt16Pair(2, 6),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      0,
      0,
      packSignedInt16Pair(7, 6),
      packUint16Pair(4, 0),
      packUint16Pair(4, 6),
      0,
      0,
      packSignedInt16Pair(2, 6),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      0,
      1,
      packSignedInt16Pair(2, 6),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      0,
      2,
      packSignedInt16Pair(7, 6),
      packUint16Pair(4, 0),
      packUint16Pair(4, 6),
      0,
      2
    ],
    'direct model repeats row indices for each expanded dictionary glyph'
  );

  model.destroy();
  destroyGpuTextProps(textProps);
  t.end();
});

test('TextAttributeModel requires explicit CPU source vectors', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const {sourceVectors, ...propsWithoutSourceVectors} = textProps;

  t.throws(
    () =>
      createTextAttributeModel(device, {
        id: 'arrow-text-model-missing-sources-test',
        ...(propsWithoutSourceVectors as Omit<typeof textProps, 'sourceVectors'>),
        fontAtlas: FONT_ATLAS
      } as never),
    /requires explicit sourceVectors/,
    'CPU source ownership is visible at the text model boundary'
  );

  destroyGpuTextProps(textProps);
  t.end();
});

test('TextAttributeModel rejects source batch alignment mismatches', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const firstChunk = makeArrowTexts(['AB']);
  const secondChunk = makeArrowTexts(['A']);

  t.throws(
    () =>
      createTextAttributeModel(device, {
        id: 'arrow-text-model-source-batch-alignment-test',
        ...textProps,
        sourceVectors: {
          ...textProps.sourceVectors,
          texts: new arrow.Vector<arrow.Utf8>([...firstChunk.data, ...secondChunk.data])
        },
        fontAtlas: FONT_ATLAS
      }),
    /batch count must match GPU batches/,
    'source vector batches stay explicitly aligned with GPU vector batches'
  );

  destroyGpuTextProps(textProps);
  t.end();
});

test('TextAttributeModel interleaves expanded glyph vertex records', async t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = createTextAttributeModel(device, {
    id: 'arrow-text-model-expanded-glyph-vertices-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  const expandedGlyphBytes = await model.expandedGlyphVertexData.readAsync();
  const expandedGlyphWords = new Uint32Array(
    expandedGlyphBytes.buffer,
    expandedGlyphBytes.byteOffset,
    15
  );
  const expandedGlyphLayout = model.bufferLayout.find(
    layout => layout.name === 'expandedGlyphVertexData'
  );

  t.equal(expandedGlyphLayout?.byteStride, 20, 'expanded glyph records use a 20-byte stride');
  t.deepEqual(
    expandedGlyphLayout?.attributes,
    [
      {attribute: 'glyphOffsets', format: 'sint16x2', byteOffset: 0},
      {attribute: 'glyphFrames', format: 'uint16x4', byteOffset: 4},
      {attribute: 'glyphPages', format: 'uint16', byteOffset: 12}
    ],
    'default render attributes read from the expanded glyph vertex data'
  );
  t.deepEqual(
    Array.from(expandedGlyphWords),
    [
      packSignedInt16Pair(2, 6),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      0,
      0,
      packSignedInt16Pair(7, 6),
      packUint16Pair(4, 0),
      packUint16Pair(4, 6),
      0,
      0,
      packSignedInt16Pair(2, 6),
      packUint16Pair(0, 0),
      packUint16Pair(4, 6),
      0,
      1
    ],
    'expanded glyph records store generated offsets, inline frames, and source row ids'
  );

  model.destroy();
  destroyGpuTextProps(textProps);
  t.end();
});

test('TextAttributeModel splits expanded glyph vertex buffers by device limits', t => {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'maxBufferSize', {value: 48});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = createTextAttributeModel(device, {
    id: 'arrow-text-model-buffer-batching-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
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

test('TextAttributeModel built-in fragment shader decodes SDF atlas alpha', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = createTextAttributeModel(device, {
    id: 'arrow-text-model-sdf-shader-test',
    ...textProps,
    fontAtlas: SDF_FONT_ATLAS
  });

  t.ok(
    model.fs.includes('uniform float textFontRenderMode;'),
    'default shader exposes an SDF mode uniform'
  );
  t.ok(model.fs.includes('smoothstep('), 'default shader smooths sampled SDF alpha');

  model.destroy();
  destroyGpuTextProps(textProps);
  t.end();
});

test('TextAttributeModel expands chunked UTF-8 GPUVector data', t => {
  const device = new NullDevice({});
  const firstChunk = arrow.vectorFromArray(['AB'], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(['A'], new arrow.Utf8());
  const textProps = makeGpuTextProps(device, ['A', 'A']);
  textProps.texts.destroy();
  const sourceTexts = new arrow.Vector<arrow.Utf8>([...firstChunk.data, ...secondChunk.data]);
  textProps.texts = makeGPUVectorFromArrow(device, sourceTexts, {name: 'texts'});
  textProps.sourceVectors = {...textProps.sourceVectors, texts: sourceTexts};

  const model = createTextAttributeModel(device, {
    id: 'chunked-arrow-text-model-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });

  t.equal(textProps.texts.data.length, 2, 'GPUVector preserves both UTF-8 GPUData chunks');
  t.equal(model.instanceCount, 3, 'glyph expansion spans every retained UTF-8 chunk');
  t.deepEqual(model.glyphLayout.startIndices, [0, 2, 3], 'row starts cross chunk boundaries');

  model.destroy();
  destroyGpuTextProps(textProps);
  t.end();
});

test('TextAttributeModel rebuilds from streamed GPUTable-backed text batches', t => {
  const device = new NullDevice({});
  const firstBatch = makeStreamingTextRecordBatch(['AB'], new Float32Array([0, 0]));
  const secondBatch = makeStreamingTextRecordBatch(['A'], new Float32Array([1, 1]));
  const gpuTable = makeGPUTableFromArrowTable(device, new arrow.Table([firstBatch]), {
    shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
  });
  const firstSourceVectors = makeArrowTextSourceVectorsFromBatches([firstBatch]);

  const model = createTextAttributeModel(device, {
    id: 'arrow-text-model-streaming-gpu-table-test',
    positions: gpuTable.gpuVectors.positions,
    texts: gpuTable.gpuVectors.texts,
    sourceVectors: firstSourceVectors,
    fontAtlas: FONT_ATLAS
  });
  t.equal(model.glyphLayout.glyphCount, 2, 'starts from the first streamed text batch');

  gpuTable.addBatch(
    makeGPURecordBatchFromArrowRecordBatch(device, secondBatch, {
      shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
    })
  );
  const rebuiltModel = createTextAttributeModel(device, {
    id: 'arrow-text-model-streaming-gpu-table-test-rebuilt',
    positions: gpuTable.gpuVectors.positions,
    texts: gpuTable.gpuVectors.texts,
    sourceVectors: makeArrowTextSourceVectorsFromBatches([firstBatch, secondBatch]),
    fontAtlas: FONT_ATLAS
  });
  t.equal(rebuiltModel.glyphLayout.glyphCount, 3, 'rebuilt model includes every text batch');

  model.destroy();
  rebuiltModel.destroy();
  gpuTable.destroy();
  t.end();
});

test('TextStorageModel packs SDF alpha settings into the style config uniform', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const modelProps = convertArrowTextToStorageModelProps(device, {
    id: 'arrow-text-storage-sdf-style-config-test',
    ...textProps,
    fontAtlas: SDF_FONT_ATLAS
  });
  t.equal(
    Object.prototype.hasOwnProperty.call(modelProps, 'sourceVectors'),
    false,
    'model-ready storage props do not expose Arrow source vectors'
  );
  t.equal(
    Object.prototype.hasOwnProperty.call(modelProps, 'storageState'),
    false,
    'model-ready storage props are flat'
  );
  const model = new TextStorageModel(device, modelProps);
  const styleConfigBytes = await model.styleConfigBuffer.readAsync();
  const styleConfigFloats = new Float32Array(
    styleConfigBytes.buffer,
    styleConfigBytes.byteOffset,
    styleConfigBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
  const styleConfigWords = new Uint32Array(
    styleConfigBytes.buffer,
    styleConfigBytes.byteOffset,
    styleConfigBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );

  t.ok(
    Math.abs(styleConfigFloats[16] - 0.75) < 1e-6,
    'style config stores TinySDF alpha edge threshold'
  );
  t.ok(
    Math.abs(styleConfigFloats[17] - 0.07) < 1e-6,
    'style config stores fragment smoothing width'
  );
  t.equal(styleConfigWords[18], 1, 'style config stores SDF font render mode');

  model.destroy();
  destroyTextStorageGpuProps(textProps);
  t.end();
});

test('TextStorageModel interleaves compact glyph vertex records', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const model = createTextStorageModel(device, {
    id: 'arrow-text-storage-generated-glyph-vertices-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
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
    [packSignedInt16Pair(2, 6), 1, packSignedInt16Pair(7, 6), 2, packSignedInt16Pair(2, 6), 1],
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
  destroyTextStorageGpuProps(textProps);
  t.end();
});

test('createTextStorageStateFromGPUVectors prepares storage text without sourceVectors', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const storageState = createTextStorageStateFromGPUVectors(device, {
    id: 'gpu-vector-text-storage-state-test',
    positions: textProps.positions,
    texts: textProps.texts,
    fontAtlas: FONT_ATLAS
  });
  const glyphVertexBytes = await storageState.compactGlyphVertexData.readAsync();
  const generatedGlyphVertexWords = new Uint32Array(
    glyphVertexBytes.buffer,
    glyphVertexBytes.byteOffset,
    storageState.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );

  t.equal(storageState.glyphCount, 3, 'GPUVector state reserves one glyph slot per UTF-8 byte');
  t.equal(
    storageState.glyphStream,
    undefined,
    'GPUVector state does not retain a CPU glyph stream'
  );
  t.deepEqual(
    Array.from(generatedGlyphVertexWords),
    [packSignedInt16Pair(2, 6), 1, packSignedInt16Pair(7, 6), 2, packSignedInt16Pair(2, 6), 1],
    'GPUVector state generates the same compact glyph records'
  );

  storageState.destroy();
  destroyTextStorageGpuProps(textProps);
  t.end();
});

test('convertArrowTextToStorageState uses GPUVector path for fixed UTF-8 text', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', '🙂']);
  const storageState = convertArrowTextToStorageState(device, {
    id: 'arrow-text-storage-gpu-vector-adapter-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });

  t.equal(
    storageState.glyphStream,
    undefined,
    'fixed plain UTF-8 input uses GPUVector preparation'
  );
  t.equal(storageState.glyphCount, 6, 'multi-byte labels match the GPU UTF-8 byte-slot path');

  storageState.destroy();
  destroyTextStorageGpuProps(textProps);
  t.end();
});

test('convertArrowTextToStorageState keeps the CPU fallback for dictionary text', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textDictionaryProps = makeTextDictionaryStorageGpuProps(device, ['AB', 'A', 'AB']);
  const dictionaryStorageState = convertArrowTextToStorageState(device, {
    id: 'arrow-text-storage-dictionary-fallback-test',
    ...textDictionaryProps,
    fontAtlas: FONT_ATLAS
  });
  t.ok(dictionaryStorageState.glyphStream, 'dictionary text keeps CPU glyph expansion');

  dictionaryStorageState.destroy();
  destroyTextStorageGpuProps(textDictionaryProps);
  t.end();
});

test('convertArrowTextToStorageState falls back when direct UTF-8 compute exceeds limits', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const originalMaxStorageBuffersPerShaderStage = device.limits.maxStorageBuffersPerShaderStage;
  Object.defineProperty(device.limits, 'maxStorageBuffersPerShaderStage', {
    configurable: true,
    value: 9
  });
  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  try {
    const storageState = convertArrowTextToStorageState(device, {
      id: 'arrow-text-storage-compute-limit-fallback-test',
      ...textProps,
      fontAtlas: FONT_ATLAS
    });
    t.ok(storageState.glyphStream, 'limited UTF-8 compute keeps CPU glyph expansion');
    storageState.destroy();
  } finally {
    destroyTextStorageGpuProps(textProps);
    Object.defineProperty(device.limits, 'maxStorageBuffersPerShaderStage', {
      configurable: true,
      value: originalMaxStorageBuffersPerShaderStage
    });
  }
  t.end();
});

test('TextRowIndexedStorageModel stores row indices in compact glyph records', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const modelProps = convertArrowTextToStorageModelProps(device, {
    id: 'arrow-text-row-indexed-storage-generated-glyph-vertices-test',
    ...textProps,
    rowIndexColumn: true,
    fontAtlas: FONT_ATLAS
  });
  t.equal(
    Object.prototype.hasOwnProperty.call(modelProps, 'sourceVectors'),
    false,
    'model-ready row-indexed storage props do not expose Arrow source vectors'
  );
  const model = new TextRowIndexedStorageModel(device, modelProps);
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
      packSignedInt16Pair(2, 6),
      1,
      0,
      packSignedInt16Pair(7, 6),
      2,
      0,
      packSignedInt16Pair(2, 6),
      1,
      1
    ],
    'generated records store source row indices next to glyph data'
  );

  model.destroy();
  destroyTextStorageGpuProps(textProps);
  t.end();
});

test('TextStorageModel accepts dictionary UTF-8 text through CPU glyph expansion', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeTextDictionaryStorageGpuProps(device, ['AB', 'A', 'AB']);
  const model = createTextStorageModel(device, {
    id: 'arrow-text-storage-dictionary-expanded-glyph-vertices-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
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
      packSignedInt16Pair(2, 6),
      1,
      packSignedInt16Pair(7, 6),
      2,
      packSignedInt16Pair(2, 6),
      1,
      packSignedInt16Pair(2, 6),
      1,
      packSignedInt16Pair(7, 6),
      2
    ],
    'dictionary rows are copied into the regular compact glyph stream without row indices'
  );

  model.destroy();
  destroyTextStorageGpuProps(textProps);
  t.end();
});

test('TextDictionaryModel shares dictionary glyph records per batch', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeTextDictionaryStorageGpuProps(device, ['AB', 'A', 'AB']);
  const modelProps = convertArrowTextToDictionaryModelProps(device, {
    id: 'arrow-text-dictionary-storage-compressed-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  t.equal(
    Object.prototype.hasOwnProperty.call(modelProps, 'sourceVectors'),
    false,
    'model-ready dictionary props do not expose Arrow source vectors'
  );
  const model = new TextDictionaryModel(device, modelProps);
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
    [packSignedInt16Pair(2, 6), 1, packSignedInt16Pair(7, 6), 2, packSignedInt16Pair(2, 6), 1],
    'glyph offsets and ids are not duplicated for repeated dictionary values'
  );

  model.destroy();
  destroyTextStorageGpuProps(textProps);
  t.end();
});

test('TextDictionaryModel draws every dictionary source batch', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeChunkedTextDictionaryStorageGpuProps(device, [['AB'], ['A'], ['AB', 'A']]);
  const model = createTextDictionaryModel(device, {
    id: 'arrow-text-dictionary-chunked-draw-test',
    ...textProps,
    source: DICTIONARY_DRAW_TEST_WGSL_SHADER,
    shaderLayout: DICTIONARY_DRAW_TEST_SHADER_LAYOUT,
    fontAtlas: FONT_ATLAS
  });
  await model.atlasTexture?.ready;
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
        {batchRowIndexBase: 1, rowStorageIndexBase: 0},
        {batchRowIndexBase: 2, rowStorageIndexBase: 0}
      ],
      'style configs preserve global picking row base and per-buffer row storage offset'
    );
  } finally {
    privateModel._syncAttachmentFormats = syncAttachmentFormats;
    privateModel._updatePipeline = updatePipeline;
    model.destroy();
    destroyTextStorageGpuProps(textProps);
  }
  t.end();
});

test('TextStorageModel rebuilds from streamed GPUTable-backed text batches', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const firstBatch = makeStreamingTextRecordBatch(['AB'], new Float32Array([0, 0]));
  const secondBatch = makeStreamingTextRecordBatch(['A'], new Float32Array([1, 1]));
  const gpuTable = makeGPUTableFromArrowTable(device, new arrow.Table([firstBatch]), {
    shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
  });
  const firstSourceVectors = makeArrowTextStorageSourceVectorsFromBatches([firstBatch]);

  const model = createTextStorageModel(device, {
    id: 'arrow-text-storage-streaming-gpu-table-test',
    positions: gpuTable.gpuVectors.positions,
    texts: gpuTable.gpuVectors.texts,
    sourceVectors: firstSourceVectors,
    fontAtlas: FONT_ATLAS
  });

  gpuTable.addBatch(
    makeGPURecordBatchFromArrowRecordBatch(device, secondBatch, {
      shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
    })
  );
  const rebuiltModel = createTextStorageModel(device, {
    id: 'arrow-text-storage-streaming-gpu-table-test-rebuilt',
    positions: gpuTable.gpuVectors.positions,
    texts: gpuTable.gpuVectors.texts,
    sourceVectors: makeArrowTextStorageSourceVectorsFromBatches([firstBatch, secondBatch]),
    fontAtlas: FONT_ATLAS
  });

  t.equal(rebuiltModel.glyphCount, 3, 'rebuilt storage text reads every UTF-8 batch');
  t.equal(rebuiltModel.batches.length, 2, 'rebuilt storage row bindings preserve chunk boundaries');

  model.destroy();
  rebuiltModel.destroy();
  gpuTable.destroy();
  t.end();
});

test('TextStorageModel rebuilds dictionary GPUTable-backed text batches', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  const firstBatch = makeStreamingTextRecordBatch(['AB'], new Float32Array([0, 0]), dictionaryType);
  const secondBatch = makeStreamingTextRecordBatch(
    ['A', 'AB'],
    new Float32Array([1, 1, 2, 2]),
    dictionaryType
  );
  const gpuTable = makeGPUTableFromArrowTable(device, new arrow.Table([firstBatch]), {
    shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
  });
  const firstSourceVectors = makeArrowTextStorageSourceVectorsFromBatches([firstBatch]);

  const model = createTextStorageModel(device, {
    id: 'arrow-text-storage-dictionary-streaming-gpu-table-test',
    positions: gpuTable.gpuVectors.positions,
    texts: gpuTable.gpuVectors.texts,
    sourceVectors: firstSourceVectors,
    fontAtlas: FONT_ATLAS
  });

  gpuTable.addBatch(
    makeGPURecordBatchFromArrowRecordBatch(device, secondBatch, {
      shaderLayout: STREAMING_TEXT_INPUT_SHADER_LAYOUT
    })
  );
  const rebuiltModel = createTextStorageModel(device, {
    id: 'arrow-text-storage-dictionary-streaming-gpu-table-test-rebuilt',
    positions: gpuTable.gpuVectors.positions,
    texts: gpuTable.gpuVectors.texts,
    sourceVectors: makeArrowTextStorageSourceVectorsFromBatches([firstBatch, secondBatch]),
    fontAtlas: FONT_ATLAS
  });

  t.equal(rebuiltModel.glyphCount, 5, 'rebuilt storage expands dictionary text from all batches');
  t.equal(
    rebuiltModel.batches.length,
    2,
    'rebuilt dictionary row bindings retain chunk boundaries'
  );

  model.destroy();
  rebuiltModel.destroy();
  gpuTable.destroy();
  t.end();
});

test('TextStorageModel splits compact glyph buffers by device limits', async t => {
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
    const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
    const model = createTextStorageModel(device, {
      id: 'arrow-text-storage-buffer-batching-test',
      ...textProps,
      fontAtlas: FONT_ATLAS
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
    destroyTextStorageGpuProps(textProps);
  } finally {
    Object.defineProperty(device.limits, 'maxStorageBufferBindingSize', {
      value: originalMaxStorageBufferBindingSize,
      configurable: true
    });
  }
  t.end();
});

test('TextStorageModel rejects non-WebGPU devices', t => {
  const device = new NullDevice({});

  t.throws(
    () => new TextStorageModel(device, {} as ConstructorParameters<typeof TextStorageModel>[1]),
    /WebGPU-only/,
    'storage model reports its backend contract'
  );
  t.end();
});

test('createArrowTextStorageState rejects non-WebGPU devices', t => {
  const device = new NullDevice({});
  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);

  t.throws(
    () =>
      createArrowTextStorageState(device, {
        id: 'arrow-text-storage-state-test',
        ...textProps,
        fontAtlas: FONT_ATLAS
      }),
    /WebGPU device/,
    'storage-state builder reports its backend contract'
  );
  destroyTextStorageGpuProps(textProps);
  t.end();
});

test('TextStorageModel rebuilds from updated Arrow conversion props', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const model = createTextStorageModel(device, {
    id: 'arrow-text-storage-row-binding-refresh-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  const storageState = model.storageState;
  const compactGlyphVertexData = model.compactGlyphVertexData;
  const styleConfigBuffer = model.styleConfigBuffer;

  const colorModel = createTextStorageModel(device, {
    id: 'arrow-text-storage-row-binding-rebuild-color-test',
    ...textProps,
    color: [255, 0, 0, 255],
    fontAtlas: FONT_ATLAS
  });

  t.notEqual(colorModel.storageState, storageState, 'color updates build a new storage state');
  t.equal(colorModel.glyphCount, model.glyphCount, 'color updates preserve glyph count');
  t.notEqual(
    colorModel.styleConfigBuffer,
    styleConfigBuffer,
    'color updates rebuild style config buffers'
  );

  const updatedTextSource = makeArrowTexts(['A', 'A']);
  const updatedTexts = makeGpuTexts(device, updatedTextSource);
  const textModel = createTextStorageModel(device, {
    id: 'arrow-text-storage-row-binding-rebuild-text-test',
    ...textProps,
    texts: updatedTexts,
    sourceVectors: {...textProps.sourceVectors, texts: updatedTextSource},
    fontAtlas: FONT_ATLAS
  });

  t.notEqual(textModel.storageState, storageState, 'text updates build a new storage state');
  t.notEqual(
    textModel.compactGlyphVertexData,
    compactGlyphVertexData,
    'text updates rebuild compact glyph vertex data'
  );
  t.equal(textModel.glyphCount, 2, 'text updates reflect the replacement text source');

  model.destroy();
  colorModel.destroy();
  textModel.destroy();
  destroyTextStorageGpuProps(textProps);
  updatedTexts.destroy();
  t.end();
});

function makeLabelTable(): arrow.Table {
  return new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 0, 1, 1]))
  });
}

function makeStreamingTextRecordBatch(
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

function makeArrowTextStorageSourceVectorsFromBatches(recordBatches: arrow.RecordBatch[]) {
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
    positions: makeGPUVectorFromArrow(device, positions, {name: 'positions'}),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {positions, texts}
  };
}

function makeGpuTextDictionaryProps(device: NullDevice, labels: readonly (string | null)[]) {
  const positions = makeArrowPositions(labels.length);
  const texts = makeArrowTextDictionaries(labels);
  return {
    positions: makeGPUVectorFromArrow(device, positions, {name: 'positions'}),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {positions, texts}
  };
}

function makeArrowTexts(labels: readonly (string | null)[]): arrow.Vector<arrow.Utf8> {
  return arrow.vectorFromArray(labels, new arrow.Utf8()) as arrow.Vector<arrow.Utf8>;
}

function makeArrowTextDictionaries(
  labels: readonly (string | null)[],
  dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32())
): arrow.Vector<ArrowUtf8Dictionary> {
  return arrow.vectorFromArray(labels, dictionaryType) as arrow.Vector<ArrowUtf8Dictionary>;
}

function makeGpuTexts<TextTypeT extends ArrowUtf8TextType>(
  device: NullDevice,
  vector: arrow.Vector<TextTypeT>
): GPUVector {
  return makeGPUVectorFromArrow(device, vector, {name: 'texts'});
}

function destroyGpuTextProps(props: ReturnType<typeof makeGpuTextProps>): void {
  props.positions.destroy();
  props.texts.destroy();
}

function makeTextStorageGpuProps(device: NullDevice, labels: string[]) {
  const positions = makeArrowPositions(labels.length);
  const texts = makeArrowTexts(labels);
  return {
    positions: makeGPUVectorFromArrow(device, positions, {name: 'positions'}),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {texts}
  };
}

function makeTextDictionaryStorageGpuProps(device: NullDevice, labels: readonly (string | null)[]) {
  const positions = makeArrowPositions(labels.length);
  const texts = makeArrowTextDictionaries(labels);
  return {
    positions: makeGPUVectorFromArrow(device, positions, {name: 'positions'}),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {texts}
  };
}

function makeChunkedTextDictionaryStorageGpuProps(
  device: NullDevice,
  labelChunks: readonly (readonly (string | null)[])[]
) {
  const positionDataChunks: arrow.Data<arrow.FixedSizeList<arrow.Float32>>[] = [];
  const textDataChunks: arrow.Data<ArrowUtf8Dictionary>[] = [];
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
  for (const labelChunk of labelChunks) {
    const positions = makeArrowPositions(labelChunk.length);
    const texts = makeArrowTextDictionaries(labelChunk, dictionaryType);
    positionDataChunks.push(...positions.data);
    textDataChunks.push(...texts.data);
  }
  const positions = new arrow.Vector<arrow.FixedSizeList<arrow.Float32>>(positionDataChunks);
  const texts = new arrow.Vector<ArrowUtf8Dictionary>(textDataChunks);
  return {
    positions: makeGPUVectorFromArrow(device, positions, {
      name: 'positions',
      preserveDataChunks: true
    }),
    texts: makeGpuTexts(device, texts),
    sourceVectors: {texts}
  };
}

function destroyTextStorageGpuProps(props: {positions: GPUVector; texts: GPUVector}): void {
  props.positions.destroy();
  props.texts.destroy();
}

function createTextAttributeModel(
  device: Device,
  props: Parameters<typeof convertArrowTextToAttributeModelProps>[1]
): TextAttributeModel {
  return new TextAttributeModel(device, convertArrowTextToAttributeModelProps(device, props));
}

function createTextStorageModel(
  device: Device,
  props: Parameters<typeof convertArrowTextToStorageModelProps>[1]
): TextStorageModel {
  return new TextStorageModel(device, convertArrowTextToStorageModelProps(device, props));
}

function createTextDictionaryModel(
  device: Device,
  props: Parameters<typeof convertArrowTextToDictionaryModelProps>[1]
): TextDictionaryModel {
  return new TextDictionaryModel(device, convertArrowTextToDictionaryModelProps(device, props));
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
