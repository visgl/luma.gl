// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {
  ArrowTextModel,
  GpuExpandedTextModel,
  IndirectTextModel,
  StorageIndexedTextModel,
  StorageTextModel,
  buildArrowTextGlyphTable,
  buildIndirectTextGlyphTable,
  buildStorageIndexedTextGlyphTable,
  buildStorageTextGlyphTable,
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

test('buildStorageTextGlyphTable keeps row state out of glyph rows', t => {
  const result = buildStorageTextGlyphTable({
    labelTable: makeLabelTable(),
    texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
    mapping: CHARACTER_MAPPING,
    baselineOffset: 1,
    lineHeight: 10
  });

  t.equal(result.table.numRows, 3, 'storage glyph table has one row per glyph');
  t.notOk(result.table.getChild('positions'), 'label positions are not repeated into glyph rows');
  t.notOk(result.table.getChild('glyphClipRects'), 'clip rectangles are not glyph attributes');
  t.deepEqual(
    Array.from(result.table.getChild('rowIndices')!.data[0]!.values as Uint32Array),
    [0, 0, 1],
    'storage glyph rows retain deterministic source row indices'
  );
  t.deepEqual(result.glyphLayout.startIndices, [0, 2, 3], 'glyph starts match direct layout');
  t.end();
});

test('buildStorageIndexedTextGlyphTable keeps compact frame references in glyph rows', t => {
  const result = buildStorageIndexedTextGlyphTable({
    labelTable: makeLabelTable(),
    texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
    mapping: CHARACTER_MAPPING,
    baselineOffset: 1,
    lineHeight: 10
  });

  t.equal(result.table.numRows, 3, 'storage indexed glyph table has one row per glyph');
  t.notOk(result.table.getChild('positions'), 'positions are still stored outside glyph rows');
  t.notOk(result.table.getChild('glyphFrames'), 'full frame quads are not glyph attributes');
  t.deepEqual(
    Array.from(result.table.getChild('glyphIndices')!.data[0]!.children[0]!.values as Uint16Array),
    [1, 0, 2, 0, 1, 0],
    'glyph rows carry aligned uint16 frame indexes'
  );
  t.deepEqual(
    Array.from(result.table.getChild('rowIndices')!.data[0]!.values as Uint32Array),
    [0, 0, 1],
    'glyph rows retain source row indexes'
  );
  t.deepEqual(
    Array.from(result.glyphLayout.glyphFrameTextureData),
    [0, 0, 0, 0, 0, 0, 4, 6, 4, 0, 4, 6],
    'shared storage frame rows reuse the indirect frame definition table'
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
  const model = new ArrowTextModel(device, {
    id: 'arrow-text-model-test',
    labelTable: makeLabelTable(),
    texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });

  t.equal(model.instanceCount, 3, 'instance count uses generated glyph rows');
  t.deepEqual(model.glyphLayout.startIndices, [0, 2, 3], 'model exposes glyph start indices');
  t.equal(model.glyphTable.numRows, 3, 'model retains generated glyph table');

  model.setProps({texts: arrow.vectorFromArray(['A', 'A'], new arrow.Utf8())});
  t.equal(model.instanceCount, 2, 'updates instance count when text changes');
  t.deepEqual(model.glyphLayout.startIndices, [0, 1, 2], 'updates start indices');

  model.destroy();
  t.end();
});

test('buildIndirectTextGlyphTable stores glyph frame references as uint16 indices', t => {
  const clipRects = makeArrowFixedSizeListVector(
    new arrow.Int16(),
    4,
    new Int16Array([0, 1, 12, -1, 3, 4, -1, 9])
  );
  const result = buildIndirectTextGlyphTable({
    labelTable: makeLabelTable(),
    texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
    clipRects,
    mapping: CHARACTER_MAPPING,
    baselineOffset: 1,
    lineHeight: 10
  });

  t.equal(result.table.numRows, 3, 'indirect glyph table has one row per glyph');
  t.deepEqual(
    Array.from(result.table.getChild('glyphIndices')!.data[0]!.children[0]!.values as Uint16Array),
    [1, 0, 2, 0, 1, 0],
    'glyph rows point at shared frame texture entries with uint16 alignment padding'
  );
  t.deepEqual(
    Array.from(result.table.getChild('rowIndices')!.data[0]!.values as Uint32Array),
    [0, 0, 1],
    'indirect glyph rows retain source label row indices'
  );
  t.deepEqual(
    Array.from(result.table.getChild('glyphClipRects')!.data[0]!.children[0]!.values as Int16Array),
    [0, 1, 12, -1, 0, 1, 12, -1, 3, 4, -1, 9],
    'indirect glyph rows retain packed clip rectangles'
  );
  t.deepEqual(
    Array.from(result.glyphLayout.glyphFrameTextureData),
    [0, 0, 0, 0, 0, 0, 4, 6, 4, 0, 4, 6],
    'frame texture stores one missing-glyph slot and unique atlas frames'
  );
  t.end();
});

test('IndirectTextModel derives from ArrowModel and updates glyph frame references', t => {
  const device = new NullDevice({});
  const model = new IndirectTextModel(device, {
    id: 'indirect-text-model-test',
    labelTable: makeLabelTable(),
    texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
    characterMapping: CHARACTER_MAPPING,
    fontSettings: {fontSize: 10}
  });

  t.equal(model.instanceCount, 3, 'instance count uses indirect glyph rows');
  t.equal(model.glyphLayout.glyphFrameTextureWidth, 3, 'texture stores missing, A, and B slots');
  t.deepEqual(
    Array.from(
      model.glyphTable.getChild('glyphIndices')!.data[0]!.children[0]!.values as Uint16Array
    ),
    [1, 0, 2, 0, 1, 0],
    'model retains padded uint16 glyph frame indices'
  );

  model.setProps({texts: arrow.vectorFromArray(['A', 'A'], new arrow.Utf8())});
  t.equal(model.instanceCount, 2, 'updates instance count when indirect text changes');
  t.deepEqual(
    Array.from(
      model.glyphTable.getChild('glyphIndices')!.data[0]!.children[0]!.values as Uint16Array
    ),
    [1, 0, 1, 0],
    'updates shared frame references after text changes'
  );

  model.destroy();
  t.end();
});

test('StorageTextModel rejects non-WebGPU devices', t => {
  const device = new NullDevice({});

  t.throws(
    () =>
      new StorageTextModel(device, {
        id: 'storage-text-model-test',
        labelTable: makeLabelTable(),
        texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
        characterMapping: CHARACTER_MAPPING,
        fontSettings: {fontSize: 10}
      }),
    /WebGPU-only/,
    'storage row model reports its backend contract'
  );
  t.end();
});

test('StorageIndexedTextModel rejects non-WebGPU devices', t => {
  const device = new NullDevice({});

  t.throws(
    () =>
      new StorageIndexedTextModel(device, {
        id: 'storage-indexed-text-model-test',
        labelTable: makeLabelTable(),
        texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
        characterMapping: CHARACTER_MAPPING,
        fontSettings: {fontSize: 10}
      }),
    /WebGPU-only/,
    'storage indexed frame model reports its backend contract'
  );
  t.end();
});

test('GpuExpandedTextModel rejects non-WebGPU devices', t => {
  const device = new NullDevice({});

  t.throws(
    () =>
      new GpuExpandedTextModel(device, {
        id: 'gpu-expanded-text-model-test',
        labelTable: makeLabelTable(),
        texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
        characterMapping: CHARACTER_MAPPING,
        fontSettings: {fontSize: 10}
      }),
    /WebGPU-only/,
    'compute-expanded text model reports its backend contract'
  );
  t.end();
});

function makeLabelTable(): arrow.Table {
  return new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 0, 1, 1]))
  });
}

function unpackSignedInt16Pair(word: number): [number, number] {
  return [toSignedInt16(word & 0xffff), toSignedInt16((word >>> 16) & 0xffff)];
}

function toSignedInt16(value: number): number {
  return value & 0x8000 ? value - 0x10000 : value;
}
