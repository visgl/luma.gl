// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from deck.gl TextLayer utilities under the MIT License.

export type Character = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Atlas array layer. Omitted by one-page generated atlases. */
  atlasPage?: number;
  anchorX: number;
  anchorY: number;
  /** Glyph quad origin relative to the current pen. Defaults to `anchorX`. */
  layoutOffsetX?: number;
  /** Glyph quad top offset relative to the line baseline. Defaults to zero. */
  layoutOffsetY?: number;
  advance: number;
};

/** Unicode character to glyph frame and advance mapping. */
export type CharacterMapping = Record<string, Character>;

/** One pair-kerning adjustment expressed as Unicode code points and font units. */
export type TextKerningPair = Readonly<{
  first: number;
  second: number;
  amount: number;
}>;

/** Pair-kerning data in both serializable and constant-time lookup forms. */
export type TextKerning = Readonly<{
  pairs: readonly TextKerningPair[];
  lookup: ReadonlyMap<number, number>;
}>;

const TEXT_KERNING_CODE_POINT_BASE = 0x110000;

/** Returns the pair-kerning adjustment between two Unicode code points. */
export function getTextKerningOffset(
  kerning: TextKerning | undefined,
  firstCodePoint: number | undefined,
  secondCodePoint: number
): number {
  return firstCodePoint === undefined
    ? 0
    : (kerning?.lookup.get(firstCodePoint * TEXT_KERNING_CODE_POINT_BASE + secondCodePoint) ?? 0);
}

/** Creates an immutable kerning descriptor and lookup table, or `undefined` for no pairs. */
export function createTextKerning(pairs: readonly TextKerningPair[]): TextKerning | undefined {
  if (pairs.length === 0) {
    return undefined;
  }
  const lookup = new Map<number, number>();
  for (const pair of pairs) {
    lookup.set(pair.first * TEXT_KERNING_CODE_POINT_BASE + pair.second, pair.amount);
  }
  return {pairs, lookup};
}

/** Returns a glyph's atlas array layer, defaulting legacy mappings to page zero. */
export function getCharacterAtlasPage(character: Character): number {
  return character.atlasPage ?? 0;
}

/** Returns the glyph quad offset used by baseline-aware layout. */
export function getCharacterLayoutOffset(character: Character): [number, number] {
  return [character.layoutOffsetX ?? character.anchorX, character.layoutOffsetY ?? 0];
}

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
      atlasPage: 0,
      advance,
      anchorX: width / 2,
      anchorY: ascent,
      layoutOffsetX: 0,
      layoutOffsetY: -ascent
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
