// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {FontAtlas} from './font-atlas';
import {getCharacterLayoutOffset, getTextKerningOffset} from './text-utils';

const DEFAULT_MISSING_CHARACTER_WIDTH = 32;

/** Horizontal and ink bounds measured in font-atlas layout units. */
export type FontAtlasTextMetrics = {
  /** Pen advance after the final code point. */
  advance: number;
  /** Finite glyph-ink bounds after anchor and baseline alignment. */
  bounds: {min: [number, number]; max: [number, number]};
};

/** Options for measuring one line of normalized atlas-backed text. */
export type FontAtlasTextMetricsOptions = {
  /** Effective line height. Defaults to the atlas line height. */
  lineHeight?: number;
  /** Horizontal alignment relative to the line origin. */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Vertical alignment relative to the line origin. */
  alignmentBaseline?: 'center' | 'top' | 'bottom';
  /** Advance assigned to characters missing from the atlas. */
  missingCharacterWidth?: number;
};

/** Measures one line using the same metrics, kerning, and alignment as atlas text layout. */
export function measureFontAtlasText(
  text: string,
  fontAtlas: FontAtlas,
  options: FontAtlasTextMetricsOptions = {}
): FontAtlasTextMetrics {
  const lineHeight = options.lineHeight ?? fontAtlas.lineHeight;
  const missingCharacterWidth = options.missingCharacterWidth ?? DEFAULT_MISSING_CHARACTER_WIDTH;
  const glyphBounds: Array<{minX: number; minY: number; maxX: number; maxY: number}> = [];
  let advance = 0;
  let previousCodePoint: number | undefined;

  for (const character of Array.from(text)) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) {
      continue;
    }
    const frame = fontAtlas.mapping[character];
    advance += getTextKerningOffset(fontAtlas.kerning, previousCodePoint, codePoint);
    if (frame) {
      const [layoutOffsetX, layoutOffsetY] = getCharacterLayoutOffset(frame);
      const glyphX = advance + layoutOffsetX;
      const glyphY = fontAtlas.baselineOffset + lineHeight / 2 + layoutOffsetY;
      glyphBounds.push({
        minX: glyphX,
        minY: glyphY,
        maxX: glyphX + frame.width,
        maxY: glyphY + frame.height
      });
    }
    advance += frame?.advance ?? missingCharacterWidth;
    previousCodePoint = codePoint;
  }

  const anchorOffset = getTextAnchorOffset(advance, options.textAnchor);
  const baselineOffset = getAlignmentBaselineOffset(lineHeight, options.alignmentBaseline);
  if (glyphBounds.length === 0) {
    return {advance, bounds: {min: [0, 0], max: [0, 0]}};
  }

  return {
    advance,
    bounds: {
      min: [
        Math.min(...glyphBounds.map(bounds => bounds.minX)) + anchorOffset,
        Math.min(...glyphBounds.map(bounds => bounds.minY)) + baselineOffset
      ],
      max: [
        Math.max(...glyphBounds.map(bounds => bounds.maxX)) + anchorOffset,
        Math.max(...glyphBounds.map(bounds => bounds.maxY)) + baselineOffset
      ]
    }
  };
}

export function getTextAnchorOffset(
  advance: number,
  textAnchor: FontAtlasTextMetricsOptions['textAnchor']
): number {
  return textAnchor === 'middle' ? -advance / 2 : textAnchor === 'end' ? -advance : 0;
}

export function getAlignmentBaselineOffset(
  lineHeight: number,
  alignmentBaseline: FontAtlasTextMetricsOptions['alignmentBaseline']
): number {
  return alignmentBaseline === 'top'
    ? lineHeight / 2
    : alignmentBaseline === 'bottom'
      ? -lineHeight / 2
      : 0;
}
