// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import * as arrow from 'apache-arrow';
import {
  buildArrowGlyphLayout,
  buildArrowUtf8Chunks,
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  createArrowUtf8TextIndexAccessor,
  decodeArrowUtf8CodePoints,
  populateUtf8TextIndices,
  type CharacterMapping
} from '../../src/index';

type TextDatum = {
  rowIndex: number;
};

test('createArrowUtf8TextIndexAccessor mutates the caller target', t => {
  const texts = arrow.vectorFromArray(['ASCII', 'e', '🙂', ''], new arrow.Utf8());
  const accessor = createArrowUtf8TextIndexAccessor<TextDatum>(texts, datum => datum.rowIndex);
  const target = {startIndex: -1, endIndex: -1};

  const firstResult = accessor({rowIndex: 0}, {index: 0, target});
  t.equal(firstResult, target, 'returns the caller target');
  t.deepEqual([target.startIndex, target.endIndex], [0, 5], 'ASCII row range matches bytes');

  accessor({rowIndex: 2}, {index: 1, target});
  t.deepEqual([target.startIndex, target.endIndex], [6, 10], 'emoji row range matches bytes');

  accessor({rowIndex: 3}, {index: 2, target});
  t.deepEqual([target.startIndex, target.endIndex], [10, 10], 'empty row range is empty');
  t.end();
});

test('Arrow UTF-8 chunks handle chunked, sliced, and null rows', t => {
  const firstChunk = arrow.vectorFromArray(['a', 'bb'], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(['ccc', 'dddd'], new arrow.Utf8());
  const chunked = new arrow.Vector<arrow.Utf8>([firstChunk.data[0]!, secondChunk.data[0]!]);
  const chunks = buildArrowUtf8Chunks(chunked);
  const target = {startIndex: 0, endIndex: 0};

  populateUtf8TextIndices(chunks, 2, target);
  t.deepEqual([target.startIndex, target.endIndex], [3, 6], 'chunked row bytes are normalized');

  const source = arrow.vectorFromArray(['skip', null, 'kept'], new arrow.Utf8());
  const sliced = source.slice(1) as arrow.Vector<arrow.Utf8>;
  const slicedChunks = buildArrowUtf8Chunks(sliced);
  populateUtf8TextIndices(slicedChunks, 0, target);
  t.deepEqual([target.startIndex, target.endIndex], [0, 0], 'null rows are empty');
  populateUtf8TextIndices(slicedChunks, 1, target);
  t.deepEqual([target.startIndex, target.endIndex], [0, 4], 'sliced rows keep local offsets');
  t.end();
});

test('decodeArrowUtf8CodePoints and buildArrowGlyphLayout preserve Unicode glyph counts', t => {
  const texts = arrow.vectorFromArray(['AB', '🙂'], new arrow.Utf8());
  const chunks = buildArrowUtf8Chunks(texts);
  const target = {startIndex: 0, endIndex: 0};
  const decoded: string[] = [];
  populateUtf8TextIndices(chunks, 1, target);
  const decodedCount = decodeArrowUtf8CodePoints(
    chunks,
    target.startIndex,
    target.endIndex,
    codePoint => decoded.push(String.fromCodePoint(codePoint))
  );
  t.equal(decodedCount, 1, 'emoji decodes as one code point');
  t.deepEqual(decoded, ['🙂'], 'emoji code point round-trips');

  const mapping: CharacterMapping = {
    A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
    B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7},
    '🙂': {x: 8, y: 0, width: 8, height: 8, anchorX: 4, anchorY: 4, advance: 9}
  };
  const characterSet = new Set<string>();
  const layout = buildArrowGlyphLayout({
    texts,
    mapping,
    baselineOffset: 1,
    lineHeight: 10,
    characterSet
  });

  t.deepEqual(layout.startIndices, [0, 2, 3], 'start indices count code points');
  t.equal(layout.glyphCount, 3, 'glyph count includes the emoji once');
  t.deepEqual(Array.from(layout.glyphOffsets), [2, 6, 7, 6, 4, 6], 'offsets use advances');
  t.ok(characterSet.has('🙂'), 'auto character collection sees Unicode');
  t.end();
});

test('buildGpuExpandedTextStream packs glyph ids and shared definitions deterministically', t => {
  const mapping: CharacterMapping = {
    A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
    B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7},
    '🙂': {x: 8, y: 0, width: 8, height: 8, anchorX: 4, anchorY: 4, advance: 9}
  };
  const stream = buildGpuExpandedTextStream({
    texts: arrow.vectorFromArray(['AB', '🙂A'], new arrow.Utf8()),
    mapping,
    baselineOffset: 1,
    lineHeight: 10,
    characterSet: new Set<string>()
  });

  t.deepEqual(stream.startIndices, [0, 2, 4], 'glyph row starts match code point counts');
  t.deepEqual(Array.from(stream.labelGlyphRanges), [0, 2, 2, 4], 'label glyph spans are packed');
  t.deepEqual(
    Array.from(stream.packedGlyphIds),
    [1 | (2 << 16), 3 | (1 << 16)],
    'two uint16 glyph ids share each uint32 input word'
  );
  t.deepEqual(
    Array.from(stream.glyphFrames),
    [0, 0, 0, 0, 0, 0, 4, 6, 4, 0, 4, 6, 8, 0, 8, 8],
    'frame definitions are deduplicated with a missing-glyph row at zero'
  );
  t.deepEqual(
    Array.from(stream.glyphMetrics),
    [0, 32, 2, 5, 2, 7, 4, 9],
    'glyph metrics carry anchor and advance for compute expansion'
  );
  t.equal(stream.baselineOffsetY, 6, 'baseline output offset is prevalidated and stored once');
  t.equal(stream.glyphCount, 4, 'glyph count stays CPU-known');
  t.end();
});

test('buildGpuUtf8TextInput preserves Arrow UTF-8 bytes without glyph decoding', t => {
  const textInput = buildGpuUtf8TextInput(arrow.vectorFromArray(['AB', '🙂'], new arrow.Utf8()));
  const packedBytes = new Uint8Array(textInput.packedUtf8Bytes.buffer).subarray(
    0,
    textInput.byteLength
  );

  t.deepEqual(Array.from(textInput.rowByteRanges), [0, 2, 2, 6], 'row byte spans stay aligned');
  t.deepEqual(
    Array.from(packedBytes),
    [65, 66, 240, 159, 153, 130],
    'packed upload retains the normalized UTF-8 byte stream'
  );
  t.equal(textInput.byteLength, 6, 'one render slot can be reserved per source byte');
  t.end();
});
