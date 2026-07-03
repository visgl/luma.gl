// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ExternalImage} from '@luma.gl/core';
import type {CharacterMapping, TextKerning} from './text-utils';

/** Sampling algorithm used to recover glyph coverage from an atlas page. */
export type FontAtlasRenderMode = 'bitmap' | 'sdf';

/** Fragment-stage parameters associated with one font atlas. */
export type FontAtlasRenderSettings = {
  /** Atlas encoding interpreted by the text fragment shader. */
  mode: FontAtlasRenderMode;
  /** Coverage boundary used by distance-field sampling. Ignored for bitmap atlases. */
  threshold: number;
  /** Width of the distance-field transition. Ignored for bitmap atlases. */
  smoothing: number;
};

/**
 * Renderer-independent description of an atlas-backed font.
 *
 * Builders normalize browser bitmap fonts, browser SDF fonts, and externally generated font
 * descriptors into this shape. Layout and rendering code can therefore consume glyph metrics and
 * image pages without knowing how the atlas was produced.
 */
export type FontAtlas = {
  /** Vertical offset from the line origin to the font baseline, in atlas pixels. */
  baselineOffset: number;
  /** Recommended distance between adjacent text baselines, in atlas pixels. */
  lineHeight: number;
  /** Horizontal packing cursor retained when a generated atlas is extended. */
  xOffset: number;
  /** Smallest packed glyph y offset retained when a generated atlas is extended. */
  yOffsetMin: number;
  /** Largest packed glyph y offset retained when a generated atlas is extended. */
  yOffsetMax: number;
  /** Unicode character to glyph frame and advance mapping. */
  mapping: CharacterMapping;
  /** Optional pair-kerning table for layout engines that support kerning. */
  kerning?: TextKerning;
  /** Sampling parameters that travel with the atlas instead of renderer-specific props. */
  renderSettings: FontAtlasRenderSettings;
  /** One or more equally sized image pages. Glyph mappings select pages by array layer. */
  pages: readonly ExternalImage[];
  /** Width of every atlas page in pixels. */
  width: number;
  /** Height of every atlas page in pixels. */
  height: number;
};
