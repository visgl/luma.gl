// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {FontAtlas} from './font-atlas';
import {
  getCharacterAtlasPage,
  getCharacterLayoutOffset,
  getTextKerningOffset,
  type Character
} from './text-utils';

const DEFAULT_MISSING_CHARACTER_WIDTH = 32;

export type TextGlyphWalkOptions = {
  fontAtlas: FontAtlas;
  lineHeight?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  alignmentBaseline?: 'center' | 'top' | 'bottom';
  missingCharacterWidth?: number;
  characterSet?: Set<string>;
};

export type TextGlyphVisit = {
  character: string;
  codePoint: number;
  frame: Character | undefined;
  atlasPage: number;
  offsetX: number;
  offsetY: number;
};

export type TextRowMetrics = {
  advance: number;
  glyphCount: number;
  anchorOffsetX: number;
  baselineOffsetY: number;
  bounds: {min: [number, number]; max: [number, number]};
};

/**
 * Walks one line of text using the canonical atlas layout semantics.
 *
 * Glyph callbacks receive unaligned offsets. Apply the returned anchor and baseline offsets when
 * writing final glyph positions. Keeping alignment as a row result lets compact encoders avoid a
 * second Unicode traversal.
 */
export function walkTextGlyphs(
  visitCodePoints: (visitCodePoint: (codePoint: number) => void) => void,
  options: TextGlyphWalkOptions,
  visitGlyph?: (glyph: TextGlyphVisit) => void
): TextRowMetrics {
  const {fontAtlas} = options;
  const lineHeight = options.lineHeight ?? fontAtlas.lineHeight;
  const missingCharacterWidth = options.missingCharacterWidth ?? DEFAULT_MISSING_CHARACTER_WIDTH;
  let advance = 0;
  let glyphCount = 0;
  let previousCodePoint: number | undefined;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  visitCodePoints(codePoint => {
    const character = String.fromCodePoint(codePoint);
    const frame = fontAtlas.mapping[character];
    options.characterSet?.add(character);
    advance += getTextKerningOffset(fontAtlas.kerning, previousCodePoint, codePoint);
    const [layoutOffsetX, layoutOffsetY] = frame ? getCharacterLayoutOffset(frame) : [0, 0];
    const offsetX = advance + layoutOffsetX;
    const offsetY = fontAtlas.baselineOffset + lineHeight / 2 + layoutOffsetY;
    if (frame) {
      minX = Math.min(minX, offsetX);
      minY = Math.min(minY, offsetY);
      maxX = Math.max(maxX, offsetX + frame.width);
      maxY = Math.max(maxY, offsetY + frame.height);
    }
    visitGlyph?.({
      character,
      codePoint,
      frame,
      atlasPage: frame ? getCharacterAtlasPage(frame) : 0,
      offsetX,
      offsetY
    });
    advance += frame?.advance ?? missingCharacterWidth;
    previousCodePoint = codePoint;
    glyphCount++;
  });

  const anchorOffsetX = getTextAnchorOffset(advance, options.textAnchor);
  const baselineOffsetY = getAlignmentBaselineOffset(lineHeight, options.alignmentBaseline);
  const hasBounds = Number.isFinite(minX);
  return {
    advance,
    glyphCount,
    anchorOffsetX,
    baselineOffsetY,
    bounds: hasBounds
      ? {
          min: [minX + anchorOffsetX, minY + baselineOffsetY],
          max: [maxX + anchorOffsetX, maxY + baselineOffsetY]
        }
      : {min: [0, 0], max: [0, 0]}
  };
}

export function getTextAnchorOffset(
  advance: number,
  textAnchor: TextGlyphWalkOptions['textAnchor']
): number {
  return textAnchor === 'middle' ? -advance / 2 : textAnchor === 'end' ? -advance : 0;
}

export function getAlignmentBaselineOffset(
  lineHeight: number,
  alignmentBaseline: TextGlyphWalkOptions['alignmentBaseline']
): number {
  return alignmentBaseline === 'top'
    ? lineHeight / 2
    : alignmentBaseline === 'bottom'
      ? -lineHeight / 2
      : 0;
}
