// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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
import {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import type {Device, ShaderLayout} from '@luma.gl/core';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {type CharacterMapping, type FontAtlas} from '../../src/index';
import {
  TextAttributeModel,
  TextDictionaryModel,
  TextRowIndexedStorageModel,
  TextStorageModel
} from '../../src/text-2d/experimental';

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

it('buildArrowTextGlyphTable repeats Arrow label attributes for each glyph', () => {
  const labelTable = makeLabelTable();
  const texts = arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8());
  const result = buildArrowTextGlyphTable({
    labelTable,
    texts,
    fontAtlas: FONT_ATLAS
  });

  expect(result.table.numRows, 'glyph table has one row per glyph').toBe(3);
  expect(result.glyphLayout.startIndices, 'label start indices are retained').toEqual([0, 2, 3]);
  expect(
    Array.from(result.table.getChild('glyphOffsets')!.data[0]!.children[0]!.values as Float32Array),
    'glyph offsets are generated from the mapping'
  ).toEqual([2, 6, 7, 6, 2, 6]);
  expect(result.table.getChild('positions')!.length, 'label positions repeat across glyphs').toBe(
    3
  );
  expect(
    Array.from(result.table.getChild('rowIndices')!.data[0]!.values as Uint32Array),
    'source label row indices repeat across generated glyphs'
  ).toEqual([0, 0, 1]);
  void 0;
});

it('buildArrowTextGlyphTable expands character color lists per glyph', () => {
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

  expect(
    Array.from(result.table.getChild('colors')!.data[0]!.children[0]!.values as Uint8Array),
    'per-character color lists flatten to one FixedSizeList color per generated glyph'
  ).toEqual([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
  void 0;
});

it('buildArrowTextGlyphTable expands packed clip rectangles per glyph', () => {
  const clipRects = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    4,
    new Float32Array([0, 1, 12, -1, 3, 4, -1, 9])
  );
  const result = buildArrowTextGlyphTable({
    labelTable: makeLabelTable(),
    texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
    clipRects,
    fontAtlas: FONT_ATLAS
  });

  expect(
    Array.from(
      result.table.getChild('glyphClipRects')!.data[0]!.children[0]!.values as Float32Array
    ),
    'packed i16x4 clip rectangles repeat for each generated glyph'
  ).toEqual([0, 1, 12, -1, 0, 1, 12, -1, 3, 4, -1, 9]);
  void 0;
});

it('buildArrowTextGlyphTable expands nullable row colors with constant color fallback', () => {
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

  expect(
    Array.from(result.table.getChild('colors')!.data[0]!.children[0]!.values as Uint8Array),
    'null row colors expand to the constant color fallback'
  ).toEqual([255, 0, 0, 255, 255, 0, 0, 255, 10, 20, 30, 255]);
  void 0;
});

it('convertArrowTextToAttribute uploads packed colors as normalized vectors', () => {
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

  expect(rowColorText.colors?.format, 'row colors use normalized RGBA8').toBe('unorm8x4');
  expect(
    characterColorText.colors?.format,
    'character colors keep normalized variable-length RGBA8'
  ).toBe('vertex-list<unorm8x4>');

  rowColorText.destroy();
  characterColorText.destroy();
  void 0;
});

it('packTextStorageClipRects preserves Float32 world-space clip lanes', () => {
  const packedClipRects = packTextStorageClipRects(
    makeArrowFixedSizeListVector(
      new arrow.Float32(),
      4,
      new Float32Array([0, 1, 12, -1, -4, 8, -1, 9])
    )
  );

  expect(
    Array.from(packedClipRects),
    'storage rows retain original world-space clip lanes'
  ).toEqual([0, 1, 12, -1, -4, 8, -1, 9]);
  void 0;
});

it('TextAttributeModel derives from GPUTableModel and rebuilds glyph instance counts', () => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const modelProps = convertArrowTextToAttributeModelProps(device, {
    id: 'arrow-text-model-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  expect(
    Object.prototype.hasOwnProperty.call(modelProps, 'sourceVectors'),
    'model-ready attribute props do not expose Arrow source vectors'
  ).toBe(false);
  expect(
    Object.prototype.hasOwnProperty.call(modelProps, 'attributeState'),
    'model-ready attribute props contain one prepared state object'
  ).toBe(true);
  const renderTableFieldNames =
    modelProps.attributeState.modelProps.table?.schema.fields.map(field => field.name) ?? [];
  expect(
    renderTableFieldNames.filter(fieldName =>
      ['glyphOffsets', 'glyphFrames', 'glyphPages', 'glyphClipRects', 'rowIndices'].includes(
        fieldName
      )
    ),
    'generated glyph attributes are supplied only by expandedGlyphVertexData'
  ).toEqual([]);
  const model = new TextAttributeModel(device, modelProps);

  expect(model.instanceCount, 'instance count uses generated glyph rows').toBe(3);
  expect(
    model.attributeState.glyphLayout.startIndices,
    'model exposes glyph start indices'
  ).toEqual([0, 2, 3]);
  expect(
    modelProps.attributeState.glyphTable.table.numRows,
    'conversion state retains generated glyph table'
  ).toBe(3);

  const updatedTextSource = makeArrowTexts(['A', 'A']);
  const updatedTexts = makeGpuTexts(device, updatedTextSource);
  const updatedModel = createTextAttributeModel(device, {
    id: 'arrow-text-model-updated-test',
    positions: textProps.positions,
    texts: updatedTexts,
    sourceVectors: {...textProps.sourceVectors, texts: updatedTextSource},
    fontAtlas: FONT_ATLAS
  });
  expect(updatedModel.instanceCount, 'rebuilt model uses updated text glyph count').toBe(2);
  expect(
    updatedModel.attributeState.glyphLayout.startIndices,
    'rebuilt model updates starts'
  ).toEqual([0, 1, 2]);

  model.destroy();
  updatedModel.destroy();
  destroyGpuTextProps(textProps);
  updatedTexts.destroy();
  void 0;
});

it('TextAttributeModel accepts dictionary UTF-8 source vectors', async () => {
  const device = new NullDevice({});
  const textProps = makeGpuTextDictionaryProps(device, ['AB', 'A', 'AB', null]);
  const model = createTextAttributeModel(device, {
    id: 'arrow-text-model-dictionary-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  const expandedGlyphBytes = await model.attributeState.expandedGlyphVertexData.readAsync();
  const expandedGlyphWords = new Uint32Array(
    expandedGlyphBytes.buffer,
    expandedGlyphBytes.byteOffset,
    25
  );

  expect(model.instanceCount, 'dictionary labels expand into repeated glyph instances').toBe(5);
  expect(model.attributeState.glyphLayout.startIndices, 'null rows render empty').toEqual([
    0, 2, 3, 5, 5
  ]);
  expect(
    Array.from(expandedGlyphWords),
    'direct model repeats row indices for each expanded dictionary glyph'
  ).toEqual([
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
  ]);

  model.destroy();
  destroyGpuTextProps(textProps);
  void 0;
});

it('TextAttributeModel requires explicit CPU source vectors', () => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const {sourceVectors, ...propsWithoutSourceVectors} = textProps;

  expect(
    () =>
      createTextAttributeModel(device, {
        id: 'arrow-text-model-missing-sources-test',
        ...(propsWithoutSourceVectors as Omit<typeof textProps, 'sourceVectors'>),
        fontAtlas: FONT_ATLAS
      } as never),
    'CPU source ownership is visible at the text model boundary'
  ).toThrow(/requires explicit sourceVectors/);

  destroyGpuTextProps(textProps);
  void 0;
});

it('TextAttributeModel rejects source batch alignment mismatches', () => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const firstChunk = makeArrowTexts(['AB']);
  const secondChunk = makeArrowTexts(['A']);

  expect(
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
    'source vector batches stay explicitly aligned with GPU vector batches'
  ).toThrow(/batch count must match GPU batches/);

  destroyGpuTextProps(textProps);
  void 0;
});

it('TextAttributeModel interleaves expanded glyph vertex records', async () => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = createTextAttributeModel(device, {
    id: 'arrow-text-model-expanded-glyph-vertices-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  const expandedGlyphBytes = await model.attributeState.expandedGlyphVertexData.readAsync();
  const expandedGlyphWords = new Uint32Array(
    expandedGlyphBytes.buffer,
    expandedGlyphBytes.byteOffset,
    15
  );
  const expandedGlyphLayout = model.bufferLayout.find(
    layout => layout.name === 'expandedGlyphVertexData'
  );

  expect(expandedGlyphLayout?.byteStride, 'expanded glyph records use a 20-byte stride').toBe(20);
  expect(
    expandedGlyphLayout?.attributes,
    'default render attributes read from the expanded glyph vertex data'
  ).toEqual([
    {attribute: 'glyphOffsets', format: 'sint16x2', byteOffset: 0},
    {attribute: 'glyphFrames', format: 'uint16x4', byteOffset: 4},
    {attribute: 'glyphPages', format: 'uint16', byteOffset: 12}
  ]);
  expect(
    Array.from(expandedGlyphWords),
    'expanded glyph records store generated offsets, inline frames, and source row ids'
  ).toEqual([
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
  ]);

  model.destroy();
  destroyGpuTextProps(textProps);
  void 0;
});

it('TextAttributeModel splits expanded glyph vertex buffers by device limits', () => {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'maxBufferSize', {value: 48});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = createTextAttributeModel(device, {
    id: 'arrow-text-model-buffer-batching-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });

  expect(
    model.attributeState.renderBatches.length,
    'generated glyph output splits into two render batches'
  ).toBe(2);
  expect(
    model.attributeState.renderBatches.map(batch => batch.glyphCount),
    'batching preserves whole source-label rows'
  ).toEqual([2, 1]);
  expect(model.table?.batches.length, 'Arrow render rows split to matching GPU batches').toBe(2);
  expect(model.instanceCount, 'aggregate glyph count remains unchanged').toBe(3);

  model.destroy();
  destroyGpuTextProps(textProps);
  void 0;
});

it('TextAttributeModel built-in fragment shader decodes SDF atlas alpha', () => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = createTextAttributeModel(device, {
    id: 'arrow-text-model-sdf-shader-test',
    ...textProps,
    fontAtlas: SDF_FONT_ATLAS
  });

  expect(
    Boolean(model.fs.includes('uniform float textFontRenderMode;')),
    'default shader exposes an SDF mode uniform'
  ).toBe(true);
  expect(
    Boolean(model.fs.includes('smoothstep(')),
    'default shader smooths sampled SDF alpha'
  ).toBe(true);

  model.destroy();
  destroyGpuTextProps(textProps);
  void 0;
});

it('TextAttributeModel expands chunked UTF-8 GPUVector data', () => {
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

  expect(textProps.texts.data.length, 'GPUVector preserves both UTF-8 GPUData chunks').toBe(2);
  expect(model.instanceCount, 'glyph expansion spans every retained UTF-8 chunk').toBe(3);
  expect(
    model.attributeState.glyphLayout.startIndices,
    'row starts cross chunk boundaries'
  ).toEqual([0, 2, 3]);

  model.destroy();
  destroyGpuTextProps(textProps);
  void 0;
});

it('TextAttributeModel rebuilds from streamed GPUTable-backed text batches', () => {
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
  expect(
    model.attributeState.glyphLayout.glyphCount,
    'starts from the first streamed text batch'
  ).toBe(2);

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
  expect(
    rebuiltModel.attributeState.glyphLayout.glyphCount,
    'rebuilt model includes every text batch'
  ).toBe(3);

  model.destroy();
  rebuiltModel.destroy();
  gpuTable.destroy();
  void 0;
});

it('TextStorageModel packs SDF alpha settings into the style config uniform', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const modelProps = convertArrowTextToStorageModelProps(device, {
    id: 'arrow-text-storage-sdf-style-config-test',
    ...textProps,
    fontAtlas: SDF_FONT_ATLAS
  });
  expect(
    Object.prototype.hasOwnProperty.call(modelProps, 'sourceVectors'),
    'model-ready storage props do not expose Arrow source vectors'
  ).toBe(false);
  expect(
    Object.prototype.hasOwnProperty.call(modelProps, 'storageState'),
    'model-ready storage props contain one owning state object'
  ).toBe(true);
  const model = new TextStorageModel(device, modelProps);
  const styleConfigBytes = await model.storageState.batches[0]!.styleConfigBuffer.readAsync();
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

  expect(
    Boolean(Math.abs(styleConfigFloats[16] - 0.75) < 1e-6),
    'style config stores TinySDF alpha edge threshold'
  ).toBe(true);
  expect(
    Boolean(Math.abs(styleConfigFloats[17] - 0.07) < 1e-6),
    'style config stores fragment smoothing width'
  ).toBe(true);
  expect(styleConfigWords[18], 'style config stores SDF font render mode').toBe(1);

  model.destroy();
  destroyTextStorageGpuProps(textProps);
  void 0;
});

it('TextStorageModel interleaves compact glyph vertex records', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const model = createTextStorageModel(device, {
    id: 'arrow-text-storage-generated-glyph-vertices-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  const glyphVertexBytes =
    await model.storageState.renderBatches[0]!.compactGlyphVertexData.readAsync();
  const generatedGlyphVertexWords = new Uint32Array(
    glyphVertexBytes.buffer,
    glyphVertexBytes.byteOffset,
    model.storageState.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  const generatedGlyphVertexLayout = model.bufferLayout.find(
    layout => layout.name === 'compactGlyphVertexData'
  );

  expect(
    model.storageState.generatedRenderBufferByteLength,
    'three glyphs keep the 8-byte record budget'
  ).toBe(24);
  expect(generatedGlyphVertexLayout?.byteStride, 'generated records use an 8-byte stride').toBe(8);
  expect(
    generatedGlyphVertexLayout?.attributes,
    'one interleaved buffer exposes glyph offset and id attributes'
  ).toEqual([
    {attribute: 'glyphOffsets', format: 'sint16x2', byteOffset: 0},
    {attribute: 'glyphIndices', format: 'uint16x2', byteOffset: 4}
  ]);
  expect(
    Array.from(generatedGlyphVertexWords),
    'generated records store packed offsets and glyph ids in order'
  ).toEqual([
    packSignedInt16Pair(2, 6),
    1,
    packSignedInt16Pair(7, 6),
    2,
    packSignedInt16Pair(2, 6),
    1
  ]);
  const rowGlyphStartsBytes =
    await model.storageState.batches[0]!.rowGlyphStartsBuffer!.readAsync();
  const rowGlyphStarts = new Uint32Array(
    rowGlyphStartsBytes.buffer,
    rowGlyphStartsBytes.byteOffset,
    3
  );
  const renderConfigBytes =
    await model.storageState.renderBatches[0]!.storageRenderConfigBuffer.readAsync();
  const renderConfig = new Uint32Array(renderConfigBytes.buffer, renderConfigBytes.byteOffset, 4);
  expect(Array.from(rowGlyphStarts), 'row glyph starts map glyphs back to rows').toEqual([0, 2, 3]);
  expect(Array.from(renderConfig), 'render config scopes row lookup').toEqual([0, 0, 2, 0]);

  model.destroy();
  destroyTextStorageGpuProps(textProps);
  void 0;
});

it('createTextStorageStateFromGPUVectors prepares storage text without sourceVectors', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const storageState = createTextStorageStateFromGPUVectors(device, {
    id: 'gpu-vector-text-storage-state-test',
    positions: textProps.positions,
    texts: textProps.texts,
    fontAtlas: FONT_ATLAS
  });
  const glyphVertexBytes = await storageState.renderBatches[0]!.compactGlyphVertexData.readAsync();
  const generatedGlyphVertexWords = new Uint32Array(
    glyphVertexBytes.buffer,
    glyphVertexBytes.byteOffset,
    storageState.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );

  expect(storageState.glyphCount, 'GPUVector state reserves one glyph slot per UTF-8 byte').toBe(3);
  expect(storageState.glyphStream, 'GPUVector state does not retain a CPU glyph stream').toBe(
    undefined
  );
  expect(
    Array.from(generatedGlyphVertexWords),
    'GPUVector state generates the same compact glyph records'
  ).toEqual([
    packSignedInt16Pair(2, 6),
    1,
    packSignedInt16Pair(7, 6),
    2,
    packSignedInt16Pair(2, 6),
    1
  ]);

  storageState.destroy();
  destroyTextStorageGpuProps(textProps);
  void 0;
});

it('convertArrowTextToStorageState uses GPUVector path for fixed UTF-8 text', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', '🙂']);
  const storageState = convertArrowTextToStorageState(device, {
    id: 'arrow-text-storage-gpu-vector-adapter-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });

  expect(storageState.glyphStream, 'fixed plain UTF-8 input uses GPUVector preparation').toBe(
    undefined
  );
  expect(storageState.glyphCount, 'multi-byte labels match the GPU UTF-8 byte-slot path').toBe(6);

  storageState.destroy();
  destroyTextStorageGpuProps(textProps);
  void 0;
});

it('convertArrowTextToStorageState keeps the CPU fallback for dictionary text', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const textDictionaryProps = makeTextDictionaryStorageGpuProps(device, ['AB', 'A', 'AB']);
  const dictionaryStorageState = convertArrowTextToStorageState(device, {
    id: 'arrow-text-storage-dictionary-fallback-test',
    ...textDictionaryProps,
    fontAtlas: FONT_ATLAS
  });
  expect(
    Boolean(dictionaryStorageState.glyphStream),
    'dictionary text keeps CPU glyph expansion'
  ).toBe(true);

  dictionaryStorageState.destroy();
  destroyTextStorageGpuProps(textDictionaryProps);
  void 0;
});

it('convertArrowTextToStorageState falls back when direct UTF-8 compute exceeds limits', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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
    expect(
      Boolean(storageState.glyphStream),
      'limited UTF-8 compute keeps CPU glyph expansion'
    ).toBe(true);
    storageState.destroy();
  } finally {
    destroyTextStorageGpuProps(textProps);
    Object.defineProperty(device.limits, 'maxStorageBuffersPerShaderStage', {
      configurable: true,
      value: originalMaxStorageBuffersPerShaderStage
    });
  }
  void 0;
});

it('TextRowIndexedStorageModel stores row indices in compact glyph records', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const modelProps = convertArrowTextToStorageModelProps(device, {
    id: 'arrow-text-row-indexed-storage-generated-glyph-vertices-test',
    ...textProps,
    rowIndexColumn: true,
    fontAtlas: FONT_ATLAS
  });
  expect(
    Object.prototype.hasOwnProperty.call(modelProps, 'sourceVectors'),
    'model-ready row-indexed storage props do not expose Arrow source vectors'
  ).toBe(false);
  const model = new TextRowIndexedStorageModel(device, modelProps);
  const glyphVertexBytes =
    await model.storageState.renderBatches[0]!.compactGlyphVertexData.readAsync();
  const generatedGlyphVertexWords = new Uint32Array(
    glyphVertexBytes.buffer,
    glyphVertexBytes.byteOffset,
    model.storageState.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );
  const generatedGlyphVertexLayout = model.bufferLayout.find(
    layout => layout.name === 'compactGlyphVertexData'
  );

  expect(
    model.storageState.generatedRenderBufferByteLength,
    'three glyphs keep a 12-byte record budget'
  ).toBe(36);
  expect(generatedGlyphVertexLayout?.byteStride, 'generated records use a 12-byte stride').toBe(12);
  expect(
    generatedGlyphVertexLayout?.attributes,
    'row-indexed records expose glyph offset, id, and source row attributes'
  ).toEqual([
    {attribute: 'glyphOffsets', format: 'sint16x2', byteOffset: 0},
    {attribute: 'glyphIndices', format: 'uint16x2', byteOffset: 4},
    {attribute: 'glyphRowIndices', format: 'uint32', byteOffset: 8}
  ]);
  expect(
    Array.from(generatedGlyphVertexWords),
    'generated records store source row indices next to glyph data'
  ).toEqual([
    packSignedInt16Pair(2, 6),
    1,
    0,
    packSignedInt16Pair(7, 6),
    2,
    0,
    packSignedInt16Pair(2, 6),
    1,
    1
  ]);

  model.destroy();
  destroyTextStorageGpuProps(textProps);
  void 0;
});

it('TextStorageModel accepts dictionary UTF-8 text through CPU glyph expansion', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const textProps = makeTextDictionaryStorageGpuProps(device, ['AB', 'A', 'AB']);
  const model = createTextStorageModel(device, {
    id: 'arrow-text-storage-dictionary-expanded-glyph-vertices-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  const glyphVertexBytes =
    await model.storageState.renderBatches[0]!.compactGlyphVertexData.readAsync();
  const generatedGlyphVertexWords = new Uint32Array(
    glyphVertexBytes.buffer,
    glyphVertexBytes.byteOffset,
    model.storageState.generatedRenderBufferByteLength / Uint32Array.BYTES_PER_ELEMENT
  );

  expect(
    model.storageState.glyphCount,
    'storage model expands repeated dictionary labels per row'
  ).toBe(5);
  expect(
    model.storageState.generatedRenderBufferByteLength,
    'naive dictionary storage keeps one compact glyph record per visible glyph'
  ).toBe(40);
  expect(
    Array.from(generatedGlyphVertexWords),
    'dictionary rows are copied into the regular compact glyph stream without row indices'
  ).toEqual([
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
  ]);

  model.destroy();
  destroyTextStorageGpuProps(textProps);
  void 0;
});

it('TextDictionaryModel shares dictionary glyph records per batch', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const textProps = makeTextDictionaryStorageGpuProps(device, ['AB', 'A', 'AB']);
  const modelProps = convertArrowTextToDictionaryModelProps(device, {
    id: 'arrow-text-dictionary-storage-compressed-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  expect(
    Object.prototype.hasOwnProperty.call(modelProps, 'sourceVectors'),
    'model-ready dictionary props do not expose Arrow source vectors'
  ).toBe(false);
  const model = new TextDictionaryModel(device, modelProps);
  const firstBatch = model.storageState.batches[0]!;
  const dictionaryGlyphRecordBytes = await firstBatch.dictionaryGlyphRecordsBuffer.readAsync();
  const dictionaryGlyphRecordWords = new Uint32Array(
    dictionaryGlyphRecordBytes.buffer,
    dictionaryGlyphRecordBytes.byteOffset,
    model.storageState.dictionaryGlyphCount * 2
  );
  const rowDictionaryRecordBytes = await firstBatch.rowDictionaryRecordsBuffer.readAsync();
  const rowDictionaryRecords = new Uint32Array(
    rowDictionaryRecordBytes.buffer,
    rowDictionaryRecordBytes.byteOffset,
    8
  );

  expect(
    model.storageState.glyphCount,
    'visible glyph count still expands per row occurrence'
  ).toBe(5);
  expect(
    model.storageState.dictionaryValueCount,
    'dictionary batch keeps two unique string values'
  ).toBe(2);
  expect(
    model.storageState.dictionaryGlyphCount,
    'shared dictionary glyph records store AB and A once'
  ).toBe(3);
  expect(
    model.storageState.generatedRenderBufferByteLength,
    'dictionary model has no generated per-visible-glyph vertex buffer'
  ).toBe(0);
  expect(
    Array.from(rowDictionaryRecords),
    'row dictionary records pack dictionary keys and glyph starts'
  ).toEqual([0, 0, 1, 2, 0, 3, 0xffffffff, 5]);
  expect(
    Array.from(dictionaryGlyphRecordWords),
    'glyph offsets and ids are not duplicated for repeated dictionary values'
  ).toEqual([
    packSignedInt16Pair(2, 6),
    1,
    packSignedInt16Pair(7, 6),
    2,
    packSignedInt16Pair(2, 6),
    1
  ]);

  model.destroy();
  destroyTextStorageGpuProps(textProps);
  void 0;
});

it('TextDictionaryModel draws every dictionary source batch', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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
  await model.storageState.atlasTexture?.ready;
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
    expect(Boolean(model.draw({} as never)), 'draws chunked dictionary text').toBe(true);
    expect(
      drawCalls.map(drawCall => drawCall.instanceCount),
      'uses each source batch glyph occurrence count'
    ).toEqual([2, 1, 3]);
    expect(
      drawCalls.map(drawCall => drawCall.dictionaryRenderConfigBuffer),
      'binds each batch dictionary render config buffer'
    ).toEqual(
      model.storageState.renderBatches.map(
        renderBatch => renderBatch.dictionaryRenderConfigBuffer.buffer
      )
    );
    expect(
      drawCalls.map(drawCall => drawCall.styleConfigBuffer),
      'binds each batch style config buffer'
    ).toEqual(model.storageState.batches.map(batch => batch.styleConfigBuffer.buffer));
    expect(
      drawCalls.map(drawCall => drawCall.rowPositionsBuffer),
      'binds each row storage batch'
    ).toEqual(
      model.storageState.batches.map(batch => resolveTestStorageBuffer(batch.rowPositionsBuffer))
    );
    const styleConfigRows = await Promise.all(
      model.storageState.batches.map(async batch => {
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
    expect(
      styleConfigRows,
      'style configs preserve global picking row base and per-buffer row storage offset'
    ).toEqual([
      {batchRowIndexBase: 0, rowStorageIndexBase: 0},
      {batchRowIndexBase: 1, rowStorageIndexBase: 0},
      {batchRowIndexBase: 2, rowStorageIndexBase: 0}
    ]);
  } finally {
    privateModel._syncAttachmentFormats = syncAttachmentFormats;
    privateModel._updatePipeline = updatePipeline;
    model.destroy();
    destroyTextStorageGpuProps(textProps);
  }
  void 0;
});

it('TextStorageModel rebuilds from streamed GPUTable-backed text batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

  expect(rebuiltModel.storageState.glyphCount, 'rebuilt storage text reads every UTF-8 batch').toBe(
    3
  );
  expect(
    rebuiltModel.storageState.batches.length,
    'rebuilt storage row bindings preserve chunk boundaries'
  ).toBe(2);

  model.destroy();
  rebuiltModel.destroy();
  gpuTable.destroy();
  void 0;
});

it('TextStorageModel rebuilds dictionary GPUTable-backed text batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

  expect(
    rebuiltModel.storageState.glyphCount,
    'rebuilt storage expands dictionary text from all batches'
  ).toBe(5);
  expect(
    rebuiltModel.storageState.batches.length,
    'rebuilt dictionary row bindings retain chunk boundaries'
  ).toBe(2);

  model.destroy();
  rebuiltModel.destroy();
  gpuTable.destroy();
  void 0;
});

it('TextStorageModel splits compact glyph buffers by device limits', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

    expect(
      model.storageState.batches.length,
      'row bindings remain in their original input batch'
    ).toBe(1);
    expect(
      model.storageState.renderBatches.length,
      'generated glyph output splits into render batches'
    ).toBe(2);
    expect(
      model.storageState.renderBatches.map(batch => batch.glyphCount),
      'storage batching preserves whole source-label rows'
    ).toEqual([2, 1]);
    expect(
      model.storageState.generatedRenderBufferByteLength,
      'aggregate generated byte accounting stays exact'
    ).toBe(24);

    model.destroy();
    destroyTextStorageGpuProps(textProps);
  } finally {
    Object.defineProperty(device.limits, 'maxStorageBufferBindingSize', {
      value: originalMaxStorageBufferBindingSize,
      configurable: true
    });
  }
  void 0;
});

it('TextStorageModel rejects non-WebGPU devices', () => {
  const device = new NullDevice({});

  expect(
    () => new TextStorageModel(device, {} as ConstructorParameters<typeof TextStorageModel>[1]),
    'storage model reports its backend contract'
  ).toThrow(/WebGPU-only/);
  void 0;
});

it('createArrowTextStorageState rejects non-WebGPU devices', () => {
  const device = new NullDevice({});
  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);

  expect(
    () =>
      createArrowTextStorageState(device, {
        id: 'arrow-text-storage-state-test',
        ...textProps,
        fontAtlas: FONT_ATLAS
      }),
    'storage-state builder reports its backend contract'
  ).toThrow(/WebGPU device/);
  destroyTextStorageGpuProps(textProps);
  void 0;
});

it('TextStorageModel rebuilds from updated Arrow conversion props', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const textProps = makeTextStorageGpuProps(device, ['AB', 'A']);
  const model = createTextStorageModel(device, {
    id: 'arrow-text-storage-row-binding-refresh-test',
    ...textProps,
    fontAtlas: FONT_ATLAS
  });
  const storageState = model.storageState;
  const compactGlyphVertexData = model.storageState.renderBatches[0]!.compactGlyphVertexData;
  const styleConfigBuffer = model.storageState.batches[0]!.styleConfigBuffer;

  const colorModel = createTextStorageModel(device, {
    id: 'arrow-text-storage-row-binding-rebuild-color-test',
    ...textProps,
    color: [255, 0, 0, 255],
    fontAtlas: FONT_ATLAS
  });

  expect(colorModel.storageState, 'color updates build a new storage state').not.toBe(storageState);
  expect(colorModel.storageState.glyphCount, 'color updates preserve glyph count').toBe(
    model.storageState.glyphCount
  );
  expect(
    colorModel.storageState.batches[0]!.styleConfigBuffer,
    'color updates rebuild style config buffers'
  ).not.toBe(styleConfigBuffer);

  const updatedTextSource = makeArrowTexts(['A', 'A']);
  const updatedTexts = makeGpuTexts(device, updatedTextSource);
  const textModel = createTextStorageModel(device, {
    id: 'arrow-text-storage-row-binding-rebuild-text-test',
    ...textProps,
    texts: updatedTexts,
    sourceVectors: {...textProps.sourceVectors, texts: updatedTextSource},
    fontAtlas: FONT_ATLAS
  });

  expect(textModel.storageState, 'text updates build a new storage state').not.toBe(storageState);
  expect(
    textModel.storageState.renderBatches[0]!.compactGlyphVertexData,
    'text updates rebuild compact glyph vertex data'
  ).not.toBe(compactGlyphVertexData);
  expect(
    textModel.storageState.glyphCount,
    'text updates reflect the replacement text source'
  ).toBe(2);

  model.destroy();
  colorModel.destroy();
  textModel.destroy();
  destroyTextStorageGpuProps(textProps);
  updatedTexts.destroy();
  void 0;
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
