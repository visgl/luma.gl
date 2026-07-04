// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  DataType,
  Dictionary,
  Int16,
  Int32,
  Int8,
  Uint16,
  Uint32,
  Uint8,
  Utf8,
  Vector
} from 'apache-arrow';
import type {
  FontAtlas,
  GpuTextDictionaryCompressedStream,
  GpuTextDictionaryUtf8Input,
  GpuExpandedTextStream,
  GpuUtf8TextInput,
  TextCodePointSource,
  TextDictionaryCodePointSource,
  TextGlyphLayout
} from '@luma.gl/text';
import {
  buildTextGlyphLayout,
  buildTextGpuDictionaryCompressedStream,
  buildTextGpuExpandedStream
} from '@luma.gl/text';

const INVALID_DICTIONARY_INDEX = 0xffffffff;

/** Integer Arrow dictionary key types accepted by UTF-8 text helpers. */
export type ArrowUtf8DictionaryIndexType = Int8 | Int16 | Int32 | Uint8 | Uint16 | Uint32;
/** Dictionary-encoded UTF-8 Arrow text leaf accepted by text helpers. */
export type ArrowUtf8Dictionary = Dictionary<Utf8, ArrowUtf8DictionaryIndexType>;
/** Plain or dictionary-encoded UTF-8 Arrow text leaf accepted by text helpers. */
export type ArrowUtf8TextType = Utf8 | ArrowUtf8Dictionary;
/** Plain or dictionary-encoded UTF-8 Arrow text vector accepted by text helpers. */
export type ArrowUtf8TextVector = Vector<ArrowUtf8TextType>;

/** Mutable virtual UTF-8 byte range for one Arrow text row. */
export type Utf8TextIndexTarget = {
  /** Inclusive virtual byte start. */
  startIndex: number;
  /** Exclusive virtual byte end. */
  endIndex: number;
};

/** Row accessor context reused while visiting Arrow UTF-8 text rows. */
export type ArrowUtf8TextAccessorContext<DataT> = {
  /** Current source row index. */
  index: number;
  /** Mutable virtual byte range target for the current source row. */
  target: Utf8TextIndexTarget;
  /** Optional caller-owned row data. */
  data?: readonly DataT[];
};

/** Callback that resolves one datum to a virtual Arrow UTF-8 byte range. */
export type ArrowUtf8TextIndexAccessor<DataT> = (
  datum: DataT,
  info: ArrowUtf8TextAccessorContext<DataT>
) => Utf8TextIndexTarget;

/** One normalized Arrow UTF-8 data chunk in a virtual concatenated byte space. */
export type ArrowUtf8Chunk = {
  /** Inclusive source row start for this Arrow data chunk. */
  readonly rowStart: number;
  /** Exclusive source row end for this Arrow data chunk. */
  readonly rowEnd: number;
  /** Inclusive virtual byte start for this Arrow data chunk. */
  readonly byteStart: number;
  /** Exclusive virtual byte end for this Arrow data chunk. */
  readonly byteEnd: number;
  /** Offset added to Arrow-local value offsets to reach virtual byte offsets. */
  readonly byteBase: number;
  /** Arrow data row offset retained for null bitmap lookup. */
  readonly rowOffset: number;
  /** Arrow UTF-8 value bytes retained by this chunk. */
  readonly values: Uint8Array;
  /** Arrow UTF-8 value offsets retained by this chunk. */
  readonly valueOffsets: Int32Array;
  /** Optional Arrow validity bitmap retained by this chunk. */
  readonly nullBitmap: Uint8Array | null;
};

type ArrowUtf8DictionaryChunk = {
  readonly rowStart: number;
  readonly rowEnd: number;
  readonly rowOffset: number;
  readonly dictionaryValueBase: number;
  readonly dictionaryLength: number;
  readonly indices: ArrayLike<number> | null;
  readonly nullBitmap: Uint8Array | null;
  readonly dictionaryChunks: readonly ArrowUtf8Chunk[];
  readonly dictionaryCodePointsByIndex: Map<number, readonly number[]>;
};

/** Returns whether a runtime Arrow vector stores UTF-8 labels. */
export function isArrowUtf8Vector(value: unknown): value is Vector<Utf8> {
  return (
    value != null &&
    typeof value === 'object' &&
    'type' in value &&
    value.type instanceof Utf8 &&
    'data' in value &&
    Array.isArray(value.data)
  );
}

/** Returns whether an Arrow type stores dictionary-encoded UTF-8 labels. */
export function isArrowUtf8DictionaryType(type: DataType): type is ArrowUtf8Dictionary {
  return (
    DataType.isDictionary(type) &&
    type.dictionary instanceof Utf8 &&
    isArrowUtf8DictionaryIndexType(type.indices)
  );
}

/** Returns whether a runtime Arrow vector stores dictionary-encoded UTF-8 labels. */
export function isArrowUtf8DictionaryVector(value: unknown): value is Vector<ArrowUtf8Dictionary> {
  return (
    value != null &&
    typeof value === 'object' &&
    'type' in value &&
    isArrowUtf8DictionaryType(value.type as DataType) &&
    'data' in value &&
    Array.isArray(value.data)
  );
}

/** Returns whether a runtime Arrow vector stores plain or dictionary-encoded UTF-8 labels. */
export function isArrowUtf8TextVector(value: unknown): value is ArrowUtf8TextVector {
  return isArrowUtf8Vector(value) || isArrowUtf8DictionaryVector(value);
}

/** Normalize Arrow UTF-8 chunks into one virtual byte space. */
export function buildArrowUtf8Chunks(texts: Vector<Utf8>): readonly ArrowUtf8Chunk[] {
  const chunks: ArrowUtf8Chunk[] = [];
  let rowStart = 0;
  let byteStart = 0;

  for (const data of texts.data) {
    const valueOffsets = data.valueOffsets as Int32Array | undefined;
    const values = data.values as Uint8Array | undefined;
    if (!valueOffsets || !values) {
      continue;
    }
    const rowEnd = rowStart + data.length;
    const firstValueOffset = valueOffsets[0] ?? 0;
    const lastValueOffset = valueOffsets[data.length] ?? firstValueOffset;
    const byteLength = Math.max(0, lastValueOffset - firstValueOffset);
    const byteEnd = byteStart + byteLength;
    chunks.push({
      rowStart,
      rowEnd,
      byteStart,
      byteEnd,
      byteBase: byteStart - firstValueOffset,
      rowOffset: data.offset ?? 0,
      values,
      valueOffsets,
      nullBitmap: data.nullCount > 0 && data.nullBitmap ? (data.nullBitmap as Uint8Array) : null
    });
    rowStart = rowEnd;
    byteStart = byteEnd;
  }

  return chunks;
}

/**
 * Normalize Arrow UTF-8 buffers for direct WebGPU decode without examining individual bytes.
 * One packed `uint32` stores four UTF-8 bytes in little-endian byte order.
 */
export function buildGpuUtf8TextInput(texts: Vector<Utf8>): GpuUtf8TextInput {
  const textInputBuildStartTime = getNow();
  const chunks = buildArrowUtf8Chunks(texts);
  const byteLength = chunks[chunks.length - 1]?.byteEnd ?? 0;
  const rowByteRanges = new Uint32Array(texts.length * 2);
  const packedUtf8Bytes = new Uint32Array(Math.ceil(byteLength / Uint32Array.BYTES_PER_ELEMENT));
  const packedByteView = new Uint8Array(packedUtf8Bytes.buffer);
  const target: Utf8TextIndexTarget = {startIndex: 0, endIndex: 0};
  const startIndices = new Array<number>(texts.length + 1);
  startIndices[0] = 0;

  for (const chunk of chunks) {
    const firstValueOffset = chunk.valueOffsets[0] ?? 0;
    const lastValueOffset = chunk.valueOffsets[chunk.rowEnd - chunk.rowStart] ?? firstValueOffset;
    packedByteView.set(chunk.values.subarray(firstValueOffset, lastValueOffset), chunk.byteStart);
  }

  for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
    populateUtf8TextIndices(chunks, rowIndex, target);
    rowByteRanges[rowIndex * 2] = target.startIndex;
    rowByteRanges[rowIndex * 2 + 1] = target.endIndex;
    startIndices[rowIndex + 1] = Math.max(startIndices[rowIndex] ?? 0, target.endIndex);
  }

  return {
    startIndices,
    rowByteRanges,
    packedUtf8Bytes,
    byteLength,
    inputByteLength: rowByteRanges.byteLength + packedUtf8Bytes.byteLength,
    textInputBuildTimeMs: getNow() - textInputBuildStartTime
  };
}

/**
 * Normalize dictionary-encoded Arrow UTF-8 text for WebGPU expansion.
 * Dictionary value bytes are stored once per input chunk; rows reference values by normalized key.
 */
export function buildGpuTextDictionaryUtf8Input(
  texts: Vector<ArrowUtf8Dictionary>
): GpuTextDictionaryUtf8Input {
  const textInputBuildStartTime = getNow();
  const chunks = buildArrowUtf8DictionaryChunks(texts);
  const dictionaryValueByteRangeValues: number[] = [];
  const dictionaryValueCopyRanges: Array<{
    chunks: readonly ArrowUtf8Chunk[];
    startIndex: number;
    endIndex: number;
    targetStartIndex: number;
  }> = [];
  const dictionaryGlyphCounts: number[] = [];
  let dictionaryByteLength = 0;

  for (const chunk of chunks) {
    for (let dictionaryIndex = 0; dictionaryIndex < chunk.dictionaryLength; dictionaryIndex++) {
      const target: Utf8TextIndexTarget = {startIndex: 0, endIndex: 0};
      populateUtf8TextIndices(chunk.dictionaryChunks, dictionaryIndex, target);
      const byteLength = Math.max(0, target.endIndex - target.startIndex);
      dictionaryValueByteRangeValues.push(dictionaryByteLength, dictionaryByteLength + byteLength);
      dictionaryValueCopyRanges.push({
        chunks: chunk.dictionaryChunks,
        startIndex: target.startIndex,
        endIndex: target.endIndex,
        targetStartIndex: dictionaryByteLength
      });
      dictionaryGlyphCounts.push(
        countArrowUtf8CodePoints(chunk.dictionaryChunks, target.startIndex, target.endIndex)
      );
      dictionaryByteLength += byteLength;
    }
  }

  const rowDictionaryIndices = new Uint32Array(texts.length);
  const rowOutputGlyphRanges = new Uint32Array(texts.length * 2);
  const startIndices = new Array<number>(texts.length + 1);
  startIndices[0] = 0;
  rowDictionaryIndices.fill(INVALID_DICTIONARY_INDEX);
  let glyphCount = 0;

  for (const chunk of chunks) {
    for (let localRowIndex = 0; localRowIndex < chunk.rowEnd - chunk.rowStart; localRowIndex++) {
      const rowIndex = chunk.rowStart + localRowIndex;
      const dictionaryIndex = getArrowUtf8DictionaryIndex(chunk, localRowIndex);
      const normalizedDictionaryIndex =
        dictionaryIndex >= 0
          ? chunk.dictionaryValueBase + dictionaryIndex
          : INVALID_DICTIONARY_INDEX;
      rowDictionaryIndices[rowIndex] = normalizedDictionaryIndex;
      rowOutputGlyphRanges[rowIndex * 2] = glyphCount;
      if (normalizedDictionaryIndex !== INVALID_DICTIONARY_INDEX) {
        glyphCount += dictionaryGlyphCounts[normalizedDictionaryIndex] ?? 0;
      }
      rowOutputGlyphRanges[rowIndex * 2 + 1] = glyphCount;
      startIndices[rowIndex + 1] = glyphCount;
    }
  }

  for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
    startIndices[rowIndex + 1] ??= startIndices[rowIndex] ?? 0;
  }

  const packedDictionaryUtf8Bytes = new Uint32Array(
    Math.ceil(dictionaryByteLength / Uint32Array.BYTES_PER_ELEMENT)
  );
  const packedByteView = new Uint8Array(packedDictionaryUtf8Bytes.buffer);
  for (const copyRange of dictionaryValueCopyRanges) {
    copyArrowUtf8ByteRange(
      copyRange.chunks,
      copyRange.startIndex,
      copyRange.endIndex,
      packedByteView,
      copyRange.targetStartIndex
    );
  }

  const dictionaryValueByteRanges = new Uint32Array(dictionaryValueByteRangeValues);

  return {
    startIndices,
    rowDictionaryIndices,
    rowOutputGlyphRanges,
    dictionaryValueByteRanges,
    packedDictionaryUtf8Bytes,
    byteLength: glyphCount,
    dictionaryByteLength,
    inputByteLength:
      rowDictionaryIndices.byteLength +
      rowOutputGlyphRanges.byteLength +
      dictionaryValueByteRanges.byteLength +
      packedDictionaryUtf8Bytes.byteLength,
    textInputBuildTimeMs: getNow() - textInputBuildStartTime
  };
}

/** Create a mutable range accessor for row-aligned Arrow UTF-8 vectors. */
export function createArrowUtf8TextIndexAccessor<DataT>(
  texts: Vector<Utf8>,
  getRowIndex: (datum: DataT) => number
): ArrowUtf8TextIndexAccessor<DataT> {
  const chunks = buildArrowUtf8Chunks(texts);
  return (datum, {target}) => populateUtf8TextIndices(chunks, getRowIndex(datum), target);
}

/** Populate a byte range target for one Arrow UTF-8 row. */
export function populateUtf8TextIndices(
  chunks: readonly ArrowUtf8Chunk[],
  rowIndex: number,
  target: Utf8TextIndexTarget
): Utf8TextIndexTarget {
  target.startIndex = 0;
  target.endIndex = 0;
  const chunk = findChunkByRowIndex(chunks, rowIndex);
  if (!chunk) {
    return target;
  }
  const localRowIndex = rowIndex - chunk.rowStart;
  if (!isArrowUtf8RowValid(chunk, localRowIndex)) {
    return target;
  }
  const localStart = chunk.valueOffsets[localRowIndex] ?? 0;
  const localEnd = chunk.valueOffsets[localRowIndex + 1] ?? localStart;
  target.startIndex = chunk.byteBase + localStart;
  target.endIndex = chunk.byteBase + localEnd;
  return target;
}

/** Decode code points from one virtual Arrow UTF-8 byte span. */
export function decodeArrowUtf8CodePoints(
  chunks: readonly ArrowUtf8Chunk[],
  startIndex: number,
  endIndex: number,
  visitCodePoint: (codePoint: number) => void
): number {
  let codePointCount = 0;
  let byteIndex = Math.max(0, startIndex);
  const byteEnd = Math.max(byteIndex, endIndex);

  while (byteIndex < byteEnd) {
    const chunk = findChunkByByteIndex(chunks, byteIndex);
    if (!chunk) {
      break;
    }
    const localByteIndex = byteIndex - chunk.byteBase;
    const first = chunk.values[localByteIndex] ?? 0;
    let codePoint = first;
    let codePointByteLength = 1;

    if ((first & 0x80) === 0) {
      codePoint = first;
    } else if ((first & 0xe0) === 0xc0) {
      codePoint = ((first & 0x1f) << 6) | ((chunk.values[localByteIndex + 1] ?? 0) & 0x3f);
      codePointByteLength = 2;
    } else if ((first & 0xf0) === 0xe0) {
      codePoint =
        ((first & 0x0f) << 12) |
        (((chunk.values[localByteIndex + 1] ?? 0) & 0x3f) << 6) |
        ((chunk.values[localByteIndex + 2] ?? 0) & 0x3f);
      codePointByteLength = 3;
    } else if ((first & 0xf8) === 0xf0) {
      codePoint =
        ((first & 0x07) << 18) |
        (((chunk.values[localByteIndex + 1] ?? 0) & 0x3f) << 12) |
        (((chunk.values[localByteIndex + 2] ?? 0) & 0x3f) << 6) |
        ((chunk.values[localByteIndex + 3] ?? 0) & 0x3f);
      codePointByteLength = 4;
    } else {
      codePoint = 0xfffd;
    }

    if (byteIndex + codePointByteLength > byteEnd) {
      codePoint = 0xfffd;
      codePointByteLength = 1;
    }

    visitCodePoint(codePoint);
    codePointCount++;
    byteIndex += codePointByteLength;
  }

  return codePointCount;
}

/** Count UTF-8 code points from one virtual Arrow byte span without fully decoding them. */
function countArrowUtf8CodePoints(
  chunks: readonly ArrowUtf8Chunk[],
  startIndex: number,
  endIndex: number
): number {
  let codePointCount = 0;
  let byteIndex = Math.max(0, startIndex);
  const byteEnd = Math.max(byteIndex, endIndex);

  while (byteIndex < byteEnd) {
    const chunk = findChunkByByteIndex(chunks, byteIndex);
    if (!chunk) {
      break;
    }
    const chunkByteEnd = Math.min(byteEnd, chunk.byteEnd);
    let localByteIndex = byteIndex - chunk.byteBase;
    const localByteEnd = chunkByteEnd - chunk.byteBase;

    // Arrow Utf8 values are valid UTF-8, so each non-continuation byte starts one code point.
    while (localByteIndex < localByteEnd) {
      const byte = chunk.values[localByteIndex] ?? 0;
      if ((byte & 0xc0) !== 0x80) {
        codePointCount++;
      }
      localByteIndex++;
    }

    byteIndex = chunkByteEnd;
  }

  return codePointCount;
}

/** Adapts Arrow UTF-8 rows to the renderer-independent text layout builder. */
export function buildArrowGlyphLayout({
  texts,
  fontAtlas,
  lineHeight,
  characterSet
}: {
  texts: ArrowUtf8TextVector;
  fontAtlas: FontAtlas;
  lineHeight?: number;
  characterSet?: Set<string>;
}): TextGlyphLayout {
  return buildTextGlyphLayout(createArrowTextRowDecoder(texts), {
    fontAtlas,
    lineHeight,
    characterSet
  });
}

/** Adapts Arrow UTF-8 rows to compact GPU text expansion. */
export function buildGpuExpandedTextStream({
  texts,
  fontAtlas,
  lineHeight,
  characterSet
}: {
  texts: ArrowUtf8TextVector;
  fontAtlas: FontAtlas;
  lineHeight?: number;
  characterSet?: Set<string>;
}): GpuExpandedTextStream {
  return buildTextGpuExpandedStream(createArrowTextRowDecoder(texts), {
    fontAtlas,
    lineHeight,
    characterSet
  });
}

/** Adapts Arrow dictionary rows to compressed dictionary text layout. */
export function buildGpuTextDictionaryCompressedStream({
  texts,
  fontAtlas,
  lineHeight,
  characterSet
}: {
  texts: Vector<ArrowUtf8Dictionary>;
  fontAtlas: FontAtlas;
  lineHeight?: number;
  characterSet?: Set<string>;
}): GpuTextDictionaryCompressedStream {
  return buildTextGpuDictionaryCompressedStream(createArrowTextDictionaryCodePointSource(texts), {
    fontAtlas,
    lineHeight,
    characterSet
  });
}

function isArrowUtf8DictionaryIndexType(type: DataType): type is ArrowUtf8DictionaryIndexType {
  return DataType.isInt(type) && type.bitWidth <= 32;
}

function createArrowTextRowDecoder(texts: ArrowUtf8TextVector): TextCodePointSource {
  if (texts.type instanceof Utf8) {
    const chunks = buildArrowUtf8Chunks(texts as Vector<Utf8>);
    const target: Utf8TextIndexTarget = {startIndex: 0, endIndex: 0};
    return {
      rowCount: texts.length,
      countCodePoints: rowIndex => {
        populateUtf8TextIndices(chunks, rowIndex, target);
        return countArrowUtf8CodePoints(chunks, target.startIndex, target.endIndex);
      },
      visitCodePoints: (rowIndex, visitCodePoint) => {
        populateUtf8TextIndices(chunks, rowIndex, target);
        return decodeArrowUtf8CodePoints(
          chunks,
          target.startIndex,
          target.endIndex,
          visitCodePoint
        );
      }
    };
  }

  if (!isArrowUtf8DictionaryType(texts.type)) {
    throw new Error(`Arrow text vector must be Utf8 or Dictionary<Utf8>, got ${texts.type}`);
  }

  const chunks = buildArrowUtf8DictionaryChunks(texts as Vector<ArrowUtf8Dictionary>);
  return {
    rowCount: texts.length,
    countCodePoints: rowIndex => getArrowUtf8DictionaryCodePoints(chunks, rowIndex).length,
    visitCodePoints: (rowIndex, visitCodePoint) => {
      const codePoints = getArrowUtf8DictionaryCodePoints(chunks, rowIndex);
      for (const codePoint of codePoints) {
        visitCodePoint(codePoint);
      }
      return codePoints.length;
    }
  };
}

function createArrowTextDictionaryCodePointSource(
  texts: Vector<ArrowUtf8Dictionary>
): TextDictionaryCodePointSource {
  const chunks = buildArrowUtf8DictionaryChunks(texts);
  const dictionaryValueCount = chunks.reduce((count, chunk) => count + chunk.dictionaryLength, 0);
  const target: Utf8TextIndexTarget = {startIndex: 0, endIndex: 0};
  return {
    rowCount: texts.length,
    dictionaryValueCount,
    getRowDictionaryIndex: rowIndex => {
      const chunk = findDictionaryChunkByRowIndex(chunks, rowIndex);
      if (!chunk) {
        return -1;
      }
      const dictionaryIndex = getArrowUtf8DictionaryIndex(chunk, rowIndex - chunk.rowStart);
      return dictionaryIndex < 0 ? -1 : chunk.dictionaryValueBase + dictionaryIndex;
    },
    visitDictionaryCodePoints: (dictionaryIndex, visitCodePoint) => {
      const chunk = findDictionaryChunkByValueIndex(chunks, dictionaryIndex);
      if (!chunk) {
        return;
      }
      const localDictionaryIndex = dictionaryIndex - chunk.dictionaryValueBase;
      populateUtf8TextIndices(chunk.dictionaryChunks, localDictionaryIndex, target);
      decodeArrowUtf8CodePoints(
        chunk.dictionaryChunks,
        target.startIndex,
        target.endIndex,
        visitCodePoint
      );
    }
  };
}

function buildArrowUtf8DictionaryChunks(
  texts: Vector<ArrowUtf8Dictionary>
): ArrowUtf8DictionaryChunk[] {
  const chunks: ArrowUtf8DictionaryChunk[] = [];
  let rowStart = 0;
  let dictionaryValueBase = 0;

  for (const data of texts.data) {
    const dictionary = data.dictionary as Vector<Utf8> | undefined;
    const dictionaryLength = dictionary?.length ?? 0;
    const rowEnd = rowStart + data.length;
    chunks.push({
      rowStart,
      rowEnd,
      rowOffset: data.offset ?? 0,
      dictionaryValueBase,
      dictionaryLength,
      indices: (data.values as ArrayLike<number> | undefined) ?? null,
      nullBitmap: data.nullCount > 0 && data.nullBitmap ? (data.nullBitmap as Uint8Array) : null,
      dictionaryChunks: dictionary ? buildArrowUtf8Chunks(dictionary) : [],
      dictionaryCodePointsByIndex: new Map<number, readonly number[]>()
    });
    rowStart = rowEnd;
    dictionaryValueBase += dictionaryLength;
  }

  return chunks;
}

function getArrowUtf8DictionaryCodePoints(
  chunks: readonly ArrowUtf8DictionaryChunk[],
  rowIndex: number
): readonly number[] {
  const chunk = findDictionaryChunkByRowIndex(chunks, rowIndex);
  if (!chunk) {
    return [];
  }
  const localRowIndex = rowIndex - chunk.rowStart;
  const dictionaryIndex = getArrowUtf8DictionaryIndex(chunk, localRowIndex);
  if (dictionaryIndex < 0) {
    return [];
  }
  const cachedCodePoints = chunk.dictionaryCodePointsByIndex.get(dictionaryIndex);
  if (cachedCodePoints) {
    return cachedCodePoints;
  }

  const target: Utf8TextIndexTarget = {startIndex: 0, endIndex: 0};
  const codePoints: number[] = [];
  populateUtf8TextIndices(chunk.dictionaryChunks, dictionaryIndex, target);
  decodeArrowUtf8CodePoints(chunk.dictionaryChunks, target.startIndex, target.endIndex, codePoint =>
    codePoints.push(codePoint)
  );
  chunk.dictionaryCodePointsByIndex.set(dictionaryIndex, codePoints);
  return codePoints;
}

function getArrowUtf8DictionaryIndex(
  chunk: ArrowUtf8DictionaryChunk,
  localRowIndex: number
): number {
  if (!chunk.indices || !isArrowRowValid(chunk.nullBitmap, chunk.rowOffset, localRowIndex)) {
    return -1;
  }
  const rowCount = chunk.rowEnd - chunk.rowStart;
  const physicalRowIndex =
    chunk.indices.length === rowCount ? localRowIndex : chunk.rowOffset + localRowIndex;
  const dictionaryIndex = Number(chunk.indices[physicalRowIndex] ?? -1);
  if (
    !Number.isInteger(dictionaryIndex) ||
    dictionaryIndex < 0 ||
    dictionaryIndex >= chunk.dictionaryLength
  ) {
    return -1;
  }
  return dictionaryIndex;
}

function copyArrowUtf8ByteRange(
  chunks: readonly ArrowUtf8Chunk[],
  startIndex: number,
  endIndex: number,
  target: Uint8Array,
  targetStartIndex: number
): void {
  let byteIndex = Math.max(0, startIndex);
  const byteEnd = Math.max(byteIndex, endIndex);
  let writeIndex = targetStartIndex;

  while (byteIndex < byteEnd) {
    const chunk = findChunkByByteIndex(chunks, byteIndex);
    if (!chunk) {
      break;
    }
    const chunkByteEnd = Math.min(byteEnd, chunk.byteEnd);
    const localByteIndex = byteIndex - chunk.byteBase;
    const localByteEnd = chunkByteEnd - chunk.byteBase;
    const values = chunk.values.subarray(localByteIndex, localByteEnd);
    target.set(values, writeIndex);
    writeIndex += values.byteLength;
    byteIndex = chunkByteEnd;
  }
}

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function findChunkByRowIndex(
  chunks: readonly ArrowUtf8Chunk[],
  rowIndex: number
): ArrowUtf8Chunk | null {
  for (const chunk of chunks) {
    if (rowIndex >= chunk.rowStart && rowIndex < chunk.rowEnd) {
      return chunk;
    }
  }
  return null;
}

function findChunkByByteIndex(
  chunks: readonly ArrowUtf8Chunk[],
  byteIndex: number
): ArrowUtf8Chunk | null {
  for (const chunk of chunks) {
    if (byteIndex >= chunk.byteStart && byteIndex < chunk.byteEnd) {
      return chunk;
    }
  }
  return null;
}

function findDictionaryChunkByRowIndex(
  chunks: readonly ArrowUtf8DictionaryChunk[],
  rowIndex: number
): ArrowUtf8DictionaryChunk | null {
  for (const chunk of chunks) {
    if (rowIndex >= chunk.rowStart && rowIndex < chunk.rowEnd) {
      return chunk;
    }
  }
  return null;
}

function findDictionaryChunkByValueIndex(
  chunks: readonly ArrowUtf8DictionaryChunk[],
  dictionaryIndex: number
): ArrowUtf8DictionaryChunk | null {
  for (const chunk of chunks) {
    if (
      dictionaryIndex >= chunk.dictionaryValueBase &&
      dictionaryIndex < chunk.dictionaryValueBase + chunk.dictionaryLength
    ) {
      return chunk;
    }
  }
  return null;
}

function isArrowUtf8RowValid(chunk: ArrowUtf8Chunk, localRowIndex: number): boolean {
  return isArrowRowValid(chunk.nullBitmap, chunk.rowOffset, localRowIndex);
}

function isArrowRowValid(
  nullBitmap: Uint8Array | null,
  rowOffset: number,
  localRowIndex: number
): boolean {
  if (!nullBitmap) {
    return true;
  }
  const bitmapIndex = rowOffset + localRowIndex;
  const bitmapByte = nullBitmap[bitmapIndex >> 3] ?? 0;
  return (bitmapByte & (1 << (bitmapIndex & 7))) !== 0;
}
