// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Dictionary, Int32, Utf8, Vector, makeData, vectorFromArray} from 'apache-arrow';
import {
  buildArrowGlyphLayout,
  buildArrowUtf8Chunks,
  buildGpuDictionaryCompressedTextStream,
  buildGpuDictionaryUtf8TextInput,
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  createArrowUtf8TextIndexAccessor,
  decodeArrowUtf8CodePoints,
  populateUtf8TextIndices,
  type ArrowUtf8Dictionary,
  type CharacterMapping
} from '../../src/index';

type TextDatum = {
  rowIndex: number;
};

test('createArrowUtf8TextIndexAccessor mutates the caller target', t => {
  const texts = vectorFromArray(['ASCII', 'e', '🙂', ''], new Utf8());
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
  const firstChunk = vectorFromArray(['a', 'bb'], new Utf8());
  const secondChunk = vectorFromArray(['ccc', 'dddd'], new Utf8());
  const chunked = new Vector<Utf8>([firstChunk.data[0]!, secondChunk.data[0]!]);
  const chunks = buildArrowUtf8Chunks(chunked);
  const target = {startIndex: 0, endIndex: 0};

  populateUtf8TextIndices(chunks, 2, target);
  t.deepEqual([target.startIndex, target.endIndex], [3, 6], 'chunked row bytes are normalized');

  const source = vectorFromArray(['skip', null, 'kept'], new Utf8());
  const sliced = source.slice(1) as Vector<Utf8>;
  const slicedChunks = buildArrowUtf8Chunks(sliced);
  populateUtf8TextIndices(slicedChunks, 0, target);
  t.deepEqual([target.startIndex, target.endIndex], [0, 0], 'null rows are empty');
  populateUtf8TextIndices(slicedChunks, 1, target);
  t.deepEqual([target.startIndex, target.endIndex], [0, 4], 'sliced rows keep local offsets');
  t.end();
});

test('decodeArrowUtf8CodePoints and buildArrowGlyphLayout preserve Unicode glyph counts', t => {
  const texts = vectorFromArray(['AB', '🙂'], new Utf8());
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

test('dictionary Arrow UTF-8 helpers expand repeated, chunked, sliced, and null labels', t => {
  const dictionaryType = new Dictionary(new Utf8(), new Int32());
  const firstChunk = makeArrowDictionaryTexts(['AB', 'A', null], dictionaryType);
  const secondChunk = makeArrowDictionaryTexts(['AB'], dictionaryType);
  const chunked = new Vector<ArrowUtf8Dictionary>([firstChunk.data[0]!, secondChunk.data[0]!]);
  const mapping: CharacterMapping = {
    A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
    B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7}
  };
  const layout = buildArrowGlyphLayout({
    texts: chunked,
    mapping,
    baselineOffset: 1,
    lineHeight: 10,
    characterSet: new Set<string>()
  });

  t.deepEqual(layout.startIndices, [0, 2, 3, 3, 5], 'row starts follow dictionary labels');
  t.equal(layout.glyphCount, 5, 'repeated dictionary values still emit repeated glyphs');
  t.deepEqual(
    Array.from(layout.glyphOffsets),
    [2, 6, 7, 6, 2, 6, 2, 6, 7, 6],
    'glyph offsets are expanded per row occurrence'
  );

  const sliced = makeExplicitArrowDictionaryTexts(
    ['skip', 'AB', 'A'],
    new Int32Array([0, 1, 2])
  ).slice(1) as Vector<ArrowUtf8Dictionary>;
  const slicedTextInput = buildGpuDictionaryUtf8TextInput(sliced);
  t.deepEqual(slicedTextInput.startIndices, [0, 2, 3], 'sliced dictionary rows stay normalized');
  t.deepEqual(
    Array.from(slicedTextInput.rowDictionaryIndices),
    [1, 2],
    'sliced dictionary rows read dictionary keys from the logical row offset'
  );
  t.equal(slicedTextInput.byteLength, 3, 'sliced dictionary output reserves glyphs per row');
  const slicedStream = buildGpuDictionaryCompressedTextStream({
    texts: sliced,
    mapping,
    baselineOffset: 1,
    lineHeight: 10
  });
  t.deepEqual(
    slicedStream.startIndices,
    [0, 2, 3],
    'compressed sliced dictionary rows use the same logical key range'
  );
  t.deepEqual(
    Array.from(slicedStream.rowDictionaryIndices),
    [1, 2],
    'compressed sliced dictionary rows preserve shifted dictionary keys'
  );
  const offsetDictionaryTexts = makeExplicitArrowDictionaryTexts(
    ['skip', 'AB', 'A'],
    new Int32Array([0, 1, 2]),
    null,
    0,
    1,
    2
  );
  const offsetTextInput = buildGpuDictionaryUtf8TextInput(offsetDictionaryTexts);
  t.deepEqual(
    offsetTextInput.startIndices,
    [0, 2, 3],
    'offset dictionary data rows stay normalized'
  );
  t.deepEqual(
    Array.from(offsetTextInput.rowDictionaryIndices),
    [1, 2],
    'offset dictionary data rows read dictionary keys from data.offset'
  );

  const nullableDictionaryValues = makeExplicitArrowDictionaryTexts(
    ['AB', null, 'A'],
    new Int32Array([0, 1, 2])
  );
  const nullableLayout = buildArrowGlyphLayout({
    texts: nullableDictionaryValues,
    mapping,
    baselineOffset: 1,
    lineHeight: 10
  });
  t.deepEqual(
    nullableLayout.startIndices,
    [0, 2, 2, 3],
    'nullable dictionary values render as empty labels'
  );
  t.end();
});

test('buildGpuExpandedTextStream packs glyph ids and shared definitions deterministically', t => {
  const mapping: CharacterMapping = {
    A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
    B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7},
    '🙂': {x: 8, y: 0, width: 8, height: 8, anchorX: 4, anchorY: 4, advance: 9}
  };
  const stream = buildGpuExpandedTextStream({
    texts: vectorFromArray(['AB', '🙂A'], new Utf8()),
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

test('buildGpuDictionaryUtf8TextInput uploads dictionary bytes once per chunk', t => {
  const texts = makeExplicitArrowDictionaryTexts(['AB', 'A'], new Int32Array([0, 1, 0]));
  const textInput = buildGpuDictionaryUtf8TextInput(texts);
  const packedBytes = new Uint8Array(textInput.packedDictionaryUtf8Bytes.buffer).subarray(
    0,
    textInput.dictionaryByteLength
  );

  t.deepEqual(textInput.startIndices, [0, 2, 3, 5], 'row starts reserve glyph slots per row');
  t.deepEqual(
    Array.from(textInput.rowDictionaryIndices),
    [0, 1, 0],
    'rows point at shared dictionary values'
  );
  t.deepEqual(
    Array.from(textInput.rowOutputGlyphRanges),
    [0, 2, 2, 3, 3, 5],
    'row output ranges allocate repeated labels independently'
  );
  t.deepEqual(
    Array.from(textInput.dictionaryValueByteRanges),
    [0, 2, 2, 3],
    'dictionary value byte ranges are unique per dictionary entry'
  );
  t.deepEqual(Array.from(packedBytes), [65, 66, 65], 'source UTF-8 bytes are packed once');
  t.equal(textInput.dictionaryByteLength, 3, 'dictionary source bytes are shared');
  t.equal(textInput.byteLength, 5, 'output glyph slots are per visible label occurrence');
  t.end();
});

test('buildGpuDictionaryCompressedTextStream shares dictionary glyph records per chunk', t => {
  const mapping: CharacterMapping = {
    A: {x: 0, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 5},
    B: {x: 4, y: 0, width: 4, height: 6, anchorX: 2, anchorY: 3, advance: 7}
  };
  const texts = makeExplicitArrowDictionaryTexts(['AB', 'A'], new Int32Array([0, 1, 0, 1]));
  const stream = buildGpuDictionaryCompressedTextStream({
    texts,
    mapping,
    baselineOffset: 1,
    lineHeight: 10,
    characterSet: new Set<string>()
  });

  t.deepEqual(stream.startIndices, [0, 2, 3, 5, 6], 'row starts remain per label occurrence');
  t.deepEqual(
    Array.from(stream.rowDictionaryIndices),
    [0, 1, 0, 1],
    'rows reference shared dictionary values'
  );
  t.deepEqual(
    Array.from(stream.dictionaryGlyphRanges),
    [0, 2, 2, 3],
    'dictionary values own one shared glyph run each'
  );
  t.deepEqual(
    Array.from(stream.dictionaryGlyphRecords),
    [packSignedInt16Pair(2, 6), 1, packSignedInt16Pair(7, 6), 2, packSignedInt16Pair(2, 6), 1],
    'dictionary glyph ids and offsets are stored once per dictionary value'
  );
  t.deepEqual(
    Array.from(stream.rowGlyphRanges),
    [0, 2, 2, 3, 3, 5, 5, 6],
    'row glyph ranges map instance indices back to source rows'
  );
  t.equal(stream.dictionaryGlyphCount, 3, 'shared dictionary glyph records scale with values');
  t.equal(stream.glyphCount, 6, 'visible glyph count still scales with row occurrences');
  t.end();
});

test('buildGpuUtf8TextInput preserves Arrow UTF-8 bytes without glyph decoding', t => {
  const textInput = buildGpuUtf8TextInput(vectorFromArray(['AB', '🙂'], new Utf8()));
  const packedBytes = new Uint8Array(textInput.packedUtf8Bytes.buffer).subarray(
    0,
    textInput.byteLength
  );

  t.deepEqual(textInput.startIndices, [0, 2, 6], 'row byte prefixes support limit batching');
  t.deepEqual(Array.from(textInput.rowByteRanges), [0, 2, 2, 6], 'row byte spans stay aligned');
  t.deepEqual(
    Array.from(packedBytes),
    [65, 66, 240, 159, 153, 130],
    'packed upload retains the normalized UTF-8 byte stream'
  );
  t.equal(textInput.byteLength, 6, 'one render slot can be reserved per source byte');
  t.end();
});

function makeArrowDictionaryTexts(
  labels: readonly (string | null)[],
  dictionaryType = new Dictionary(new Utf8(), new Int32())
): Vector<ArrowUtf8Dictionary> {
  return vectorFromArray(labels, dictionaryType) as Vector<ArrowUtf8Dictionary>;
}

function makeExplicitArrowDictionaryTexts(
  dictionaryValues: readonly (string | null)[],
  indices: Int32Array,
  nullBitmap: Uint8Array | null = null,
  nullCount = 0,
  offset = 0,
  length = indices.length - offset
): Vector<ArrowUtf8Dictionary> {
  const dictionaryType = new Dictionary(new Utf8(), new Int32());
  const dictionary = vectorFromArray(dictionaryValues, new Utf8()) as Vector<Utf8>;
  const data = makeData({
    type: dictionaryType,
    length,
    offset,
    nullCount,
    nullBitmap,
    data: indices,
    dictionary
  });
  return new Vector([data]) as Vector<ArrowUtf8Dictionary>;
}

function packSignedInt16Pair(lowerValue: number, upperValue: number): number {
  return ((lowerValue & 0xffff) | ((upperValue & 0xffff) << 16)) >>> 0;
}
