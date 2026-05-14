// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Character, CharacterMapping} from './text-utils';

const MISSING_CHAR_WIDTH = 32;
const MAX_UINT16 = 65535;
const GLYPH_FRAME_TEXTURE_ROW_WIDTH = 1024;

export type Utf8TextIndexTarget = {
  startIndex: number;
  endIndex: number;
};

export type ArrowUtf8TextAccessorContext<DataT> = {
  index: number;
  target: Utf8TextIndexTarget;
  data?: readonly DataT[];
};

export type ArrowUtf8TextIndexAccessor<DataT> = (
  datum: DataT,
  info: ArrowUtf8TextAccessorContext<DataT>
) => Utf8TextIndexTarget;

export type ArrowUtf8Chunk = {
  readonly rowStart: number;
  readonly rowEnd: number;
  readonly byteStart: number;
  readonly byteEnd: number;
  readonly byteBase: number;
  readonly rowOffset: number;
  readonly values: Uint8Array;
  readonly valueOffsets: Int32Array;
  readonly nullBitmap: Uint8Array | null;
};

export type ArrowGlyphLayout = {
  startIndices: number[];
  glyphCount: number;
  glyphOffsets: Int16Array;
  glyphFrames: Uint16Array;
  characterSet?: Set<string>;
};

export type IndirectArrowGlyphLayout = {
  startIndices: number[];
  glyphCount: number;
  glyphOffsets: Int16Array;
  glyphIndices: Uint16Array;
  glyphFrameTextureData: Float32Array;
  glyphFrameTextureWidth: number;
  glyphFrameTextureHeight: number;
  characterSet?: Set<string>;
};

/** Returns whether a runtime Arrow vector stores UTF-8 labels. */
export function isArrowUtf8Vector(value: unknown): value is arrow.Vector<arrow.Utf8> {
  return (
    value != null &&
    typeof value === 'object' &&
    'type' in value &&
    value.type instanceof arrow.Utf8 &&
    'data' in value &&
    Array.isArray(value.data)
  );
}

/** Normalize Arrow UTF-8 chunks into one virtual byte space. */
export function buildArrowUtf8Chunks(texts: arrow.Vector<arrow.Utf8>): readonly ArrowUtf8Chunk[] {
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

/** Create a mutable range accessor for row-aligned Arrow UTF-8 vectors. */
export function createArrowUtf8TextIndexAccessor<DataT>(
  texts: arrow.Vector<arrow.Utf8>,
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

/** Build one-line glyph offsets and atlas frames without materializing row strings. */
export function buildArrowGlyphLayout({
  texts,
  mapping,
  baselineOffset,
  lineHeight,
  characterSet
}: {
  texts: arrow.Vector<arrow.Utf8>;
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
}): ArrowGlyphLayout {
  const chunks = buildArrowUtf8Chunks(texts);
  const target: Utf8TextIndexTarget = {startIndex: 0, endIndex: 0};
  const startIndices = new Array<number>(texts.length + 1);
  startIndices[0] = 0;
  let glyphCount = 0;

  for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
    populateUtf8TextIndices(chunks, rowIndex, target);
    glyphCount += countArrowUtf8CodePoints(chunks, target.startIndex, target.endIndex);
    startIndices[rowIndex + 1] = glyphCount;
  }

  const glyphOffsets = new Int16Array(glyphCount * 2);
  const glyphFrames = new Uint16Array(glyphCount * 4);
  const glyphFramesByCodePoint = new Map<number, Character | undefined>();
  const charactersByCodePoint = characterSet ? new Map<number, string>() : null;
  let glyphOffsetIndex = 0;
  let glyphFrameIndex = 0;

  for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
    populateUtf8TextIndices(chunks, rowIndex, target);
    let width = 0;
    decodeArrowUtf8CodePoints(chunks, target.startIndex, target.endIndex, codePoint => {
      let frame: Character | undefined;
      if (glyphFramesByCodePoint.has(codePoint)) {
        frame = glyphFramesByCodePoint.get(codePoint);
      } else {
        const character = String.fromCodePoint(codePoint);
        frame = mapping[character];
        glyphFramesByCodePoint.set(codePoint, frame);
        if (charactersByCodePoint) {
          charactersByCodePoint.set(codePoint, character);
          characterSet?.add(character);
        }
      }
      glyphOffsets[glyphOffsetIndex++] = toInt16(frame ? width + frame.anchorX : width);
      glyphOffsets[glyphOffsetIndex++] = toInt16(baselineOffset + lineHeight / 2);
      glyphFrames[glyphFrameIndex++] = toUint16(frame?.x ?? 0);
      glyphFrames[glyphFrameIndex++] = toUint16(frame?.y ?? 0);
      glyphFrames[glyphFrameIndex++] = toUint16(frame?.width ?? 0);
      glyphFrames[glyphFrameIndex++] = toUint16(frame?.height ?? 0);
      width += frame?.advance ?? MISSING_CHAR_WIDTH;
    });
  }

  return {
    startIndices,
    glyphCount,
    glyphOffsets,
    glyphFrames,
    characterSet
  };
}

/** Build one-line glyph offsets plus uint16 glyph-frame texture references. */
export function buildIndirectArrowGlyphLayout({
  texts,
  mapping,
  baselineOffset,
  lineHeight,
  characterSet
}: {
  texts: arrow.Vector<arrow.Utf8>;
  mapping: CharacterMapping;
  baselineOffset: number;
  lineHeight: number;
  characterSet?: Set<string>;
}): IndirectArrowGlyphLayout {
  const chunks = buildArrowUtf8Chunks(texts);
  const target: Utf8TextIndexTarget = {startIndex: 0, endIndex: 0};
  const startIndices = new Array<number>(texts.length + 1);
  startIndices[0] = 0;
  let glyphCount = 0;

  for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
    populateUtf8TextIndices(chunks, rowIndex, target);
    glyphCount += countArrowUtf8CodePoints(chunks, target.startIndex, target.endIndex);
    startIndices[rowIndex + 1] = glyphCount;
  }

  const glyphOffsets = new Int16Array(glyphCount * 2);
  // WebGPU vertex strides must be 4-byte aligned, so keep the glyph id as uint16
  // and reserve one uint16 lane per row for alignment.
  const glyphIndices = new Uint16Array(glyphCount * 2);
  const glyphDefinitionsByCodePoint = new Map<
    number,
    {frame: Character | undefined; glyphIndex: number}
  >();
  const charactersByCodePoint = characterSet ? new Map<number, string>() : null;
  // Index zero is the missing-glyph frame.
  const glyphFrameTextureValues = [0, 0, 0, 0];
  let glyphOffsetIndex = 0;
  let glyphIndex = 0;

  for (let rowIndex = 0; rowIndex < texts.length; rowIndex++) {
    populateUtf8TextIndices(chunks, rowIndex, target);
    let width = 0;
    decodeArrowUtf8CodePoints(chunks, target.startIndex, target.endIndex, codePoint => {
      let definition = glyphDefinitionsByCodePoint.get(codePoint);
      if (!definition) {
        const character = String.fromCodePoint(codePoint);
        const frame = mapping[character];
        let frameGlyphIndex = 0;
        if (frame) {
          frameGlyphIndex = glyphFrameTextureValues.length / 4;
          if (frameGlyphIndex > MAX_UINT16) {
            throw new Error(
              'Indirect text glyph frame texture exceeds the uint16 glyph index range'
            );
          }
          glyphFrameTextureValues.push(frame.x, frame.y, frame.width, frame.height);
        }
        definition = {frame, glyphIndex: frameGlyphIndex};
        glyphDefinitionsByCodePoint.set(codePoint, definition);
        if (charactersByCodePoint) {
          charactersByCodePoint.set(codePoint, character);
          characterSet?.add(character);
        }
      }

      const {frame} = definition;
      glyphOffsets[glyphOffsetIndex++] = toInt16(frame ? width + frame.anchorX : width);
      glyphOffsets[glyphOffsetIndex++] = toInt16(baselineOffset + lineHeight / 2);
      glyphIndices[glyphIndex * 2] = definition.glyphIndex;
      glyphIndex++;
      width += frame?.advance ?? MISSING_CHAR_WIDTH;
    });
  }

  const glyphFrameCount = glyphFrameTextureValues.length / 4;
  const glyphFrameTextureWidth = Math.min(GLYPH_FRAME_TEXTURE_ROW_WIDTH, glyphFrameCount);
  const glyphFrameTextureHeight = Math.ceil(glyphFrameCount / glyphFrameTextureWidth);
  const glyphFrameTextureData = new Float32Array(
    glyphFrameTextureWidth * glyphFrameTextureHeight * 4
  );
  glyphFrameTextureData.set(glyphFrameTextureValues);

  return {
    startIndices,
    glyphCount,
    glyphOffsets,
    glyphIndices,
    glyphFrameTextureData,
    glyphFrameTextureWidth,
    glyphFrameTextureHeight,
    characterSet
  };
}

function toInt16(value: number): number {
  const integerValue = Math.round(value);
  if (integerValue < -32768 || integerValue > 32767) {
    throw new Error(`Arrow text glyph offset ${value} is outside the signed 16-bit range`);
  }
  return integerValue;
}

function toUint16(value: number): number {
  const integerValue = Math.round(value);
  if (integerValue < 0 || integerValue > 65535) {
    throw new Error(`Arrow text glyph frame value ${value} is outside the unsigned 16-bit range`);
  }
  return integerValue;
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

function isArrowUtf8RowValid(chunk: ArrowUtf8Chunk, localRowIndex: number): boolean {
  if (!chunk.nullBitmap) {
    return true;
  }
  const bitmapIndex = chunk.rowOffset + localRowIndex;
  const bitmapByte = chunk.nullBitmap[bitmapIndex >> 3] ?? 0;
  return (bitmapByte & (1 << (bitmapIndex & 7))) !== 0;
}
