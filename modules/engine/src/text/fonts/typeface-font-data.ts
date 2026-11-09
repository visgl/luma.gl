// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright (c) three.js authors

/** Typeface glyph outline definition parsed from JSON. */
export type TypefaceGlyph = {
  /** Horizontal advance after rendering the glyph. */
  ha: number;
  /** Optional minimum x coordinate included by typeface.js font data. */
  x_min?: number;
  /** Optional maximum x coordinate included by typeface.js font data. */
  x_max?: number;
  /** Outline command sequence describing the glyph. */
  o?: string;
  /** Cached outline tokens for repeated parsing. */
  _cachedOutline?: string[];
};

/** Typeface JSON font definition accepted by the 3D text font parser. */
export type TypefaceFontData = {
  /** Additional typeface.js metadata retained by source font JSON. */
  [key: string]: unknown;
  /** Name of the font family. */
  familyName: string;
  /** Glyph table keyed by character. */
  glyphs: Record<string, TypefaceGlyph | undefined>;
  /** Font resolution from the source generator. */
  resolution: number;
  /** Font bounding box extents. */
  boundingBox: {
    /** Optional minimum x coordinate included by typeface.js font data. */
    xMin?: number;
    /** Minimum y coordinate for glyph outlines. */
    yMin: number;
    /** Optional maximum x coordinate included by typeface.js font data. */
    xMax?: number;
    /** Maximum y coordinate for glyph outlines. */
    yMax: number;
  };
  /** Underline thickness for the font. */
  underlineThickness: number;
};
