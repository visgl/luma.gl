// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {GPUVector, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {NullDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {
  ArrowStorageTextModel,
  ArrowTextModel,
  buildArrowTextGlyphTable,
  createArrowStorageTextState,
  packStorageTextClipRects,
  type CharacterMapping
} from '../../src/index';

const CHARACTER_MAPPING: CharacterMapping = {
  A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
  B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7}
};

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

test('ArrowTextModel derives from ArrowModel and updates glyph instance counts', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowTextModel(device, {
    id: 'arrow-text-model-test',
    ...textProps,
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });

  t.equal(model.instanceCount, 3, 'instance count uses generated glyph rows');
  t.deepEqual(model.glyphLayout.startIndices, [0, 2, 3], 'model exposes glyph start indices');
  t.equal(model.glyphTable.numRows, 3, 'model retains generated glyph table');

  const updatedTexts = makeGpuTexts(device, ['A', 'A']);
  model.setProps({texts: updatedTexts});
  t.equal(model.instanceCount, 2, 'updates instance count when text changes');
  t.deepEqual(model.glyphLayout.startIndices, [0, 1, 2], 'updates start indices');

  model.destroy();
  destroyGpuTextProps(textProps);
  updatedTexts.destroy();
  t.end();
});

test('ArrowTextModel interleaves expanded glyph vertex records', async t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowTextModel(device, {
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

test('ArrowTextModel built-in fragment shader decodes SDF atlas alpha', t => {
  const device = new NullDevice({});
  const textProps = makeGpuTextProps(device, ['AB', 'A']);
  const model = new ArrowTextModel(device, {
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

test('ArrowTextModel expands chunked UTF-8 GPUVector data', t => {
  const device = new NullDevice({});
  const firstChunk = arrow.vectorFromArray(['AB'], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(['A'], new arrow.Utf8());
  const textProps = makeGpuTextProps(device, []);
  textProps.texts.destroy();
  textProps.texts = new GPUVector({
    type: 'arrow',
    name: 'texts',
    device,
    vector: new arrow.Vector([...firstChunk.data, ...secondChunk.data])
  });

  const model = new ArrowTextModel(device, {
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
    Math.abs(styleConfigFloats[14] - 0.75) < 1e-6,
    'style config stores TinySDF alpha edge threshold'
  );
  t.ok(
    Math.abs(styleConfigFloats[15] - 0.07) < 1e-6,
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

  t.equal(model.generatedRenderBufferByteLength, 36, 'three glyphs keep the 12-byte record budget');
  t.equal(generatedGlyphVertexLayout?.byteStride, 12, 'generated records use a 12-byte stride');
  t.deepEqual(
    generatedGlyphVertexLayout?.attributes,
    [
      {attribute: 'glyphOffsets', format: 'sint16x2', byteOffset: 0},
      {attribute: 'glyphIndices', format: 'uint16x2', byteOffset: 4},
      {attribute: 'rowIndices', format: 'uint32', byteOffset: 8}
    ],
    'one interleaved buffer exposes the three logical render attributes'
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
    'generated records store packed offsets, glyph ids, and source row indices in order'
  );

  model.destroy();
  destroyStorageGpuTextProps(textProps);
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
  const styleConfigBuffer = model.styleConfigBuffer;

  model.setProps({color: [255, 0, 0, 255]});

  t.equal(model.storageState, storageState, 'row-binding updates preserve storage state');
  t.equal(
    model.compactGlyphVertexData,
    compactGlyphVertexData,
    'row-binding updates preserve compact glyph vertex data'
  );
  t.notEqual(
    model.styleConfigBuffer,
    styleConfigBuffer,
    'row-binding updates refresh owned style config buffers'
  );

  const updatedTexts = makeGpuTexts(device, ['A', 'A']);
  model.setProps({texts: updatedTexts});

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

function makeGpuTextProps(device: NullDevice, labels: string[]) {
  return {
    positions: new GPUVector({
      type: 'arrow',
      name: 'positions',
      device,
      vector: makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 0, 1, 1]))
    }),
    texts: makeGpuTexts(device, labels)
  };
}

function makeGpuTexts(device: NullDevice, labels: string[]): GPUVector<arrow.Utf8> {
  return new GPUVector({
    type: 'arrow',
    name: 'texts',
    device,
    vector: arrow.vectorFromArray(labels, new arrow.Utf8())
  });
}

function destroyGpuTextProps(props: ReturnType<typeof makeGpuTextProps>): void {
  props.positions.destroy();
  props.texts.destroy();
}

function makeStorageGpuTextProps(device: NullDevice, labels: string[]) {
  return {
    positions: new GPUVector({
      type: 'arrow',
      name: 'positions',
      device,
      vector: makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 0, 1, 1]))
    }),
    texts: makeGpuTexts(device, labels)
  };
}

function destroyStorageGpuTextProps(props: ReturnType<typeof makeStorageGpuTextProps>): void {
  props.positions.destroy();
  props.texts.destroy();
}

function unpackSignedInt16Pair(word: number): [number, number] {
  return [toSignedInt16(word & 0xffff), toSignedInt16((word >>> 16) & 0xffff)];
}

function packSignedInt16Pair(lowerValue: number, upperValue: number): number {
  return ((lowerValue & 0xffff) | ((upperValue & 0xffff) << 16)) >>> 0;
}

function packUint16Pair(lowerValue: number, upperValue: number): number {
  return ((lowerValue & 0xffff) | ((upperValue & 0xffff) << 16)) >>> 0;
}

function toSignedInt16(value: number): number {
  return value & 0x8000 ? value - 0x10000 : value;
}
