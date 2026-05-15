// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
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

test('ArrowStorageTextModel rejects non-WebGPU devices', t => {
  const device = new NullDevice({});

  t.throws(
    () =>
      new ArrowStorageTextModel(device, {
        id: 'arrow-storage-text-model-test',
        labelTable: makeLabelTable(),
        texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
        characterMapping: CHARACTER_MAPPING,
        fontSettings: {fontSize: 10}
      }),
    /WebGPU-only/,
    'storage model reports its backend contract'
  );
  t.end();
});

test('createArrowStorageTextState rejects non-WebGPU devices', t => {
  const device = new NullDevice({});

  t.throws(
    () =>
      createArrowStorageTextState(device, {
        id: 'arrow-storage-text-state-test',
        labelTable: makeLabelTable(),
        texts: arrow.vectorFromArray(['AB', 'A'], new arrow.Utf8()),
        characterMapping: CHARACTER_MAPPING,
        fontSettings: {fontSize: 10}
      }),
    /WebGPU device/,
    'storage-state builder reports its backend contract'
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
