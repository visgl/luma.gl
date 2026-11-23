// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Adapted from deck.gl-community glyph range utilities under the MIT License.

import {buildBrowserFontAtlas, resolveBrowserFontAtlasSettings} from './atlas/browser-font-atlas';
import type {BrowserFontRenderer} from './atlas/browser-font-atlas';
import type {FontAtlas} from './atlas/font-atlas';
import {GLYPH_BORDER, GLYPH_EM, type Glyph} from './glyph-pbf';
import type {GlyphRangeLoader} from './glyph-range-loader';

/** Converts precomputed glyph bitmaps and bearings to the common atlas packing interface. */
export function createGlyphFontRenderer(glyphs: ReadonlyMap<number, Glyph>): BrowserFontRenderer {
  return {
    measure(character?: string) {
      if (character === undefined) {
        // Glyph-range text uses a baseline 17 atlas pixels below the line top at 24 px/em.
        return {advance: 0, width: 0, ascent: 0, descent: 34};
      }
      const glyph = glyphs.get(character.codePointAt(0)!);
      return glyph
        ? {
            advance: glyph.advance,
            width: glyph.width,
            ascent: glyph.top,
            descent: glyph.height - glyph.top
          }
        : {advance: 0, width: 0, ascent: 0, descent: 0};
    },
    draw(character: string) {
      const glyph = glyphs.get(character.codePointAt(0)!);
      if (!glyph?.bitmap.length) return {data: new ImageData(1, 1), left: 0, top: 0};
      const data = new ImageData(glyph.width + 2 * GLYPH_BORDER, glyph.height + 2 * GLYPH_BORDER);
      for (let index = 0; index < glyph.bitmap.length; index++) {
        data.data[4 * index + 3] = glyph.bitmap[index];
      }
      // Pack the bitmap within its own cell; a bearing changes layout, never atlas placement.
      return {
        data,
        left: GLYPH_BORDER,
        top: GLYPH_BORDER,
        layoutOffsetX: glyph.left - GLYPH_BORDER
      };
    }
  };
}

/**
 * Loads a font stack's glyphs and packs a caller-owned SDF FontAtlas using a browser 2D canvas.
 * Shares network/decode work through `loader`, but creates a fresh page so independent builds do
 * not mutate each other's atlas. Missing glyphs have zero advance; no local-font substitution is
 * imposed. Sampling uses the glyph endpoint's 24 px/em, 8 px distance range and 0.75 boundary.
 */
export async function buildGlyphFontAtlas(
  loader: GlyphRangeLoader,
  fontStack: string,
  characterSet: string | Iterable<string>
): Promise<FontAtlas> {
  const characters = new Set<string>();
  for (const text of characterSet) {
    for (const character of text) characters.add(character);
  }
  const glyphs = await loader.loadGlyphs(fontStack, characters);
  return buildBrowserFontAtlas({
    settings: resolveBrowserFontAtlasSettings({
      fontFamily: fontStack,
      fontSize: GLYPH_EM,
      buffer: GLYPH_BORDER,
      characterSet: characters
    }),
    renderSettings: {mode: 'sdf', threshold: 0.75, smoothing: 0.1},
    createRenderer: () => createGlyphFontRenderer(glyphs)
  });
}
