// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {FontAtlas} from './font-atlas';
import {walkTextGlyphs} from './text-glyph-walker';

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
  const codePoints = Array.from(text, character => character.codePointAt(0)!);
  const metrics = walkTextGlyphs(visit => codePoints.forEach(visit), {
    fontAtlas,
    ...options
  });
  return {advance: metrics.advance, bounds: metrics.bounds};
}
