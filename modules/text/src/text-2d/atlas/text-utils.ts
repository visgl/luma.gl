// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from deck.gl TextLayer utilities under the MIT License.

import {log} from '@luma.gl/core';
import type {NumericArray} from '@math.gl/core';

const MISSING_CHAR_WIDTH = 32;
const SINGLE_LINE: number[] = [];

export type Character = {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  advance: number;
};

export type CharacterMapping = Record<string, Character>;

export function nextPowOfTwo(number: number): number {
  return number === 0 ? 0 : Math.pow(2, Math.ceil(Math.log2(number)));
}

/** Generate or extend a character mapping table for a font atlas. */
export function buildMapping({
  characterSet,
  measureText,
  buffer,
  maxCanvasWidth,
  mapping = {},
  xOffset = 0,
  yOffsetMin = 0,
  yOffsetMax = 0
}: {
  characterSet: Set<string>;
  measureText: (character: string) => {
    advance: number;
    width: number;
    ascent: number;
    descent: number;
  };
  buffer: number;
  maxCanvasWidth: number;
  mapping?: CharacterMapping;
  xOffset?: number;
  yOffsetMin?: number;
  yOffsetMax?: number;
}): {
  mapping: CharacterMapping;
  xOffset: number;
  yOffsetMin: number;
  yOffsetMax: number;
  canvasHeight: number;
} {
  let x = xOffset;
  let yMin = yOffsetMin;
  let yMax = yOffsetMax;

  for (const character of characterSet) {
    if (mapping[character]) {
      continue;
    }
    const {advance, width, ascent, descent} = measureText(character);
    const height = ascent + descent;

    if (x + width + buffer * 2 > maxCanvasWidth) {
      x = 0;
      yMin = yMax;
    }
    mapping[character] = {
      x: x + buffer,
      y: yMin + buffer,
      width,
      height,
      advance,
      anchorX: width / 2,
      anchorY: ascent
    };
    x += width + buffer * 2;
    yMax = Math.max(yMax, yMin + height + buffer * 2);
  }

  return {
    mapping,
    xOffset: x,
    yOffsetMin: yMin,
    yOffsetMax: yMax,
    canvasHeight: nextPowOfTwo(yMax)
  };
}

function getTextWidth(
  text: string[],
  startIndex: number,
  endIndex: number,
  mapping: CharacterMapping
): number {
  let width = 0;
  for (let index = startIndex; index < endIndex; index++) {
    width += mapping[text[index]]?.advance || 0;
  }
  return width;
}

function breakAll(
  text: string[],
  startIndex: number,
  endIndex: number,
  maxWidth: number,
  mapping: CharacterMapping,
  target: number[]
): number {
  let rowStartCharacterIndex = startIndex;
  let rowOffsetLeft = 0;

  for (let index = startIndex; index < endIndex; index++) {
    const width = getTextWidth(text, index, index + 1, mapping);
    if (rowOffsetLeft + width > maxWidth) {
      if (rowStartCharacterIndex < index) {
        target.push(index);
      }
      rowStartCharacterIndex = index;
      rowOffsetLeft = 0;
    }
    rowOffsetLeft += width;
  }

  return rowOffsetLeft;
}

function breakWord(
  text: string[],
  startIndex: number,
  endIndex: number,
  maxWidth: number,
  mapping: CharacterMapping,
  target: number[]
): number {
  let rowStartCharacterIndex = startIndex;
  let groupStartCharacterIndex = startIndex;
  let groupEndCharacterIndex = startIndex;
  let rowOffsetLeft = 0;

  for (let index = startIndex; index < endIndex; index++) {
    if (text[index] === ' ') {
      groupEndCharacterIndex = index + 1;
    } else if (text[index + 1] === ' ' || index + 1 === endIndex) {
      groupEndCharacterIndex = index + 1;
    }

    if (groupEndCharacterIndex > groupStartCharacterIndex) {
      let groupWidth = getTextWidth(
        text,
        groupStartCharacterIndex,
        groupEndCharacterIndex,
        mapping
      );
      if (rowOffsetLeft + groupWidth > maxWidth) {
        if (rowStartCharacterIndex < groupStartCharacterIndex) {
          target.push(groupStartCharacterIndex);
          rowStartCharacterIndex = groupStartCharacterIndex;
          rowOffsetLeft = 0;
        }
        if (groupWidth > maxWidth) {
          groupWidth = breakAll(
            text,
            groupStartCharacterIndex,
            groupEndCharacterIndex,
            maxWidth,
            mapping,
            target
          );
          rowStartCharacterIndex = target[target.length - 1] ?? rowStartCharacterIndex;
        }
      }
      groupStartCharacterIndex = groupEndCharacterIndex;
      rowOffsetLeft += groupWidth;
    }
  }

  return rowOffsetLeft;
}

/** Return indices where automatic line breaks should be inserted. */
export function autoWrapping(
  text: string[],
  wordBreak: 'break-word' | 'break-all',
  maxWidth: number,
  mapping: CharacterMapping,
  startIndex = 0,
  endIndex: number = text.length
): number[] {
  const result: number[] = [];
  if (wordBreak === 'break-all') {
    breakAll(text, startIndex, endIndex, maxWidth, mapping, result);
  } else {
    breakWord(text, startIndex, endIndex, maxWidth, mapping, result);
  }
  return result;
}

function transformRow(
  line: string[],
  startIndex: number,
  endIndex: number,
  mapping: CharacterMapping,
  leftOffsets: number[],
  rowSize: [number, number]
): void {
  let x = 0;
  let rowHeight = 0;

  for (let index = startIndex; index < endIndex; index++) {
    const frame = mapping[line[index]];
    if (frame) {
      rowHeight = Math.max(rowHeight, frame.height);
    }
  }

  for (let index = startIndex; index < endIndex; index++) {
    const character = line[index];
    const frame = mapping[character];
    if (frame) {
      leftOffsets[index] = x + frame.anchorX;
      x += frame.advance;
    } else {
      log.warn(`Missing character: ${character} (${character.codePointAt(0)})`)();
      leftOffsets[index] = x;
      x += MISSING_CHAR_WIDTH;
    }
  }

  rowSize[0] = x;
  rowSize[1] = rowHeight;
}

/** Transform a paragraph into per-character x/y offsets and measured block size. */
export function transformParagraph(
  paragraph: string,
  baselineOffset: number,
  lineHeight: number,
  wordBreak: 'break-word' | 'break-all' | null,
  maxWidth: number | null,
  mapping: CharacterMapping
): {
  x: number[];
  y: number[];
  rowWidth: number[];
  size: [number, number];
} {
  const characters = Array.from(paragraph);
  const numberOfCharacters = characters.length;
  const x = new Array(numberOfCharacters) as number[];
  const y = new Array(numberOfCharacters) as number[];
  const rowWidth = new Array(numberOfCharacters) as number[];
  const autoWrappingEnabled =
    (wordBreak === 'break-word' || wordBreak === 'break-all') &&
    Number.isFinite(maxWidth) &&
    Number(maxWidth) > 0;

  const size: [number, number] = [0, 0];
  const rowSize: [number, number] = [0, 0];
  let rowCount = 0;
  let rowOffsetTop = baselineOffset + lineHeight / 2;
  let lineStartIndex = 0;
  let lineEndIndex = 0;

  for (let index = 0; index <= numberOfCharacters; index++) {
    const character = characters[index];
    if (character === '\n' || index === numberOfCharacters) {
      lineEndIndex = index;
    }

    if (lineEndIndex > lineStartIndex) {
      const rows = autoWrappingEnabled
        ? autoWrapping(
            characters,
            wordBreak!,
            Number(maxWidth),
            mapping,
            lineStartIndex,
            lineEndIndex
          )
        : SINGLE_LINE;

      for (let rowIndex = 0; rowIndex <= rows.length; rowIndex++) {
        const rowStart = rowIndex === 0 ? lineStartIndex : rows[rowIndex - 1];
        const rowEnd = rowIndex < rows.length ? rows[rowIndex] : lineEndIndex;
        transformRow(characters, rowStart, rowEnd, mapping, x, rowSize);
        for (let characterIndex = rowStart; characterIndex < rowEnd; characterIndex++) {
          y[characterIndex] = rowOffsetTop;
          rowWidth[characterIndex] = rowSize[0];
        }
        rowCount++;
        rowOffsetTop += lineHeight;
        size[0] = Math.max(size[0], rowSize[0]);
      }
      lineStartIndex = lineEndIndex;
    }

    if (character === '\n') {
      x[lineStartIndex] = 0;
      y[lineStartIndex] = 0;
      rowWidth[lineStartIndex] = 0;
      lineStartIndex++;
    }
  }

  size[1] = rowCount * lineHeight;
  return {x, y, rowWidth, size};
}

/** Convert code point buffers into strings using deck.gl's binary text contract. */
export function getTextFromBuffer({
  value,
  length,
  stride,
  offset,
  startIndices,
  characterSet
}: {
  value: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array;
  length: number;
  stride?: number;
  offset?: number;
  startIndices: NumericArray;
  characterSet?: Set<string>;
}): {
  texts: string[];
  characterCount: number;
} {
  const bytesPerElement = value.BYTES_PER_ELEMENT;
  const elementStride = stride ? stride / bytesPerElement : 1;
  const elementOffset = offset ? offset / bytesPerElement : 0;
  const characterCount =
    startIndices[length] || Math.ceil((value.length - elementOffset) / elementStride);
  const autoCharacterSet = characterSet && new Set<number>();
  const texts = new Array(length);

  let codes = value;
  if (elementStride > 1 || elementOffset > 0) {
    const ArrayType = value.constructor as
      | Uint8ArrayConstructor
      | Uint8ClampedArrayConstructor
      | Uint16ArrayConstructor
      | Uint32ArrayConstructor;
    codes = new ArrayType(characterCount);
    for (let index = 0; index < characterCount; index++) {
      codes[index] = value[index * elementStride + elementOffset];
    }
  }

  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    const startIndex = startIndices[rowIndex];
    const endIndex = startIndices[rowIndex + 1] || characterCount;
    const codesAtIndex = codes.subarray(startIndex, endIndex);
    // @ts-expect-error Typed arrays are accepted by String.fromCodePoint at runtime.
    texts[rowIndex] = String.fromCodePoint.apply(null, codesAtIndex);
    if (autoCharacterSet) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      codesAtIndex.forEach(autoCharacterSet.add, autoCharacterSet);
    }
  }

  if (autoCharacterSet) {
    for (const characterCode of autoCharacterSet) {
      characterSet.add(String.fromCodePoint(characterCode));
    }
  }

  return {texts, characterCount};
}
