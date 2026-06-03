// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ModelProps} from '@luma.gl/engine';
import type {GPUVector} from '@luma.gl/tables';
import type {FontAtlas, FontSettings} from '../atlas/font-atlas-manager';
import type {CharacterMapping} from '../atlas/text-utils';

/** GPUVector inputs for attribute-backed 2D text preparation. */
export interface AttributeTextInputProps extends ModelProps {
  /** GPU-resident label origins aligned one-for-one with `texts`; each row is `[x, y]`. */
  positions: GPUVector;
  /** GPU UTF-8 or dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector;
  /**
   * Optional GPU packed RGBA8 text colors aligned with label rows or label characters.
   *
   * Arrow's TypeScript type does not encode fixed-list length; conversion validates
   * `FixedSizeList<Uint8>` rows have `listSize === 4`.
   */
  colors?: GPUVector;
  /** Optional GPU per-row angles in degrees. */
  angles?: GPUVector;
  /** Optional GPU per-row deck-style text sizes. */
  sizes?: GPUVector;
  /** Optional GPU per-row pixel offsets; each row is `[x, y]`. */
  pixelOffsets?: GPUVector;
  /**
   * Optional GPU packed per-label clip rectangles `[x, y, width, height]`.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: GPUVector;
  /** Character set for atlas generation. Pass `'auto'` when the adapter should derive it. */
  characterSet?: FontSettings['characterSet'] | 'auto';
  /** Font atlas generation settings. */
  fontSettings?: FontSettings;
  /** Multiplier applied to the atlas font size for one-line baseline layout. */
  lineHeight?: number;
  /** Optional deterministic mapping, mainly useful when atlas generation is managed externally. */
  characterMapping?: CharacterMapping;
  /** Optional prebuilt atlas for texture binding when `characterMapping` is injected. */
  fontAtlas?: FontAtlas;
}

/** GPUVector inputs for storage-backed 2D text preparation. */
export interface StorageTextInputProps extends ModelProps {
  /** GPU-resident label origins aligned one-for-one with `texts`; each row is `[x, y]`. */
  positions: GPUVector;
  /** GPU UTF-8 or dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector;
  /**
   * Optional GPU packed RGBA8 text colors aligned with label rows.
   *
   * Arrow's TypeScript type does not encode fixed-list length; conversion validates
   * `FixedSizeList<Uint8>` rows have `listSize === 4`.
   */
  colors?: GPUVector;
  /** Optional GPU per-row angles in degrees. */
  angles?: GPUVector;
  /** Optional GPU per-row deck-style text sizes. */
  sizes?: GPUVector;
  /** Optional GPU per-row pixel offsets; each row is `[x, y]`. */
  pixelOffsets?: GPUVector;
  /** Optional GPU per-row text anchor enum: 0=start, 1=middle, 2=end. */
  textAnchors?: GPUVector;
  /** Optional GPU per-row alignment baseline enum: 0=center, 1=top, 2=bottom. */
  alignmentBaselines?: GPUVector;
  /**
   * Optional GPU packed per-label clip rectangles `[x, y, width, height]`.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: GPUVector;
  /** Constant fallback color used when `colors` is absent. */
  color?: [number, number, number, number];
  /** Constant fallback angle in degrees used when `angles` is absent. */
  angle?: number;
  /** Constant fallback deck-style text size used when `sizes` is absent. */
  size?: number;
  /** Constant fallback pixel offset used when `pixelOffsets` is absent. */
  pixelOffset?: [number, number];
  /** Constant fallback text anchor used when `textAnchors` is absent. */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Constant fallback alignment baseline used when `alignmentBaselines` is absent. */
  alignmentBaseline?: 'center' | 'top' | 'bottom';
  /** Character set for atlas generation. Pass `'auto'` when the adapter should derive it. */
  characterSet?: FontSettings['characterSet'] | 'auto';
  /** Font atlas generation settings. */
  fontSettings?: FontSettings;
  /** Multiplier applied to the atlas font size for one-line baseline layout. */
  lineHeight?: number;
  /** Optional deterministic mapping, mainly useful when atlas generation is managed externally. */
  characterMapping?: CharacterMapping;
  /** Optional prebuilt atlas for texture binding when `characterMapping` is injected. */
  fontAtlas?: FontAtlas;
}

/** GPUVector inputs for compressed dictionary storage-backed 2D text preparation. */
export interface DictionaryTextInputProps extends ModelProps {
  /** GPU-resident label origins aligned one-for-one with `texts`; each row is `[x, y]`. */
  positions: GPUVector;
  /** GPU dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector;
  /**
   * Optional GPU packed RGBA8 text colors aligned with label rows.
   *
   * Arrow's TypeScript type does not encode fixed-list length; conversion validates
   * `FixedSizeList<Uint8>` rows have `listSize === 4`.
   */
  colors?: GPUVector;
  /** Optional GPU per-row angles in degrees. */
  angles?: GPUVector;
  /** Optional GPU per-row deck-style text sizes. */
  sizes?: GPUVector;
  /** Optional GPU per-row pixel offsets; each row is `[x, y]`. */
  pixelOffsets?: GPUVector;
  /** Optional GPU per-row text anchor enum: 0=start, 1=middle, 2=end. */
  textAnchors?: GPUVector;
  /** Optional GPU per-row alignment baseline enum: 0=center, 1=top, 2=bottom. */
  alignmentBaselines?: GPUVector;
  /**
   * Optional GPU packed per-label clip rectangles `[x, y, width, height]`.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: GPUVector;
  /** Constant fallback color used when `colors` is absent. */
  color?: [number, number, number, number];
  /** Constant fallback angle in degrees used when `angles` is absent. */
  angle?: number;
  /** Constant fallback deck-style text size used when `sizes` is absent. */
  size?: number;
  /** Constant fallback pixel offset used when `pixelOffsets` is absent. */
  pixelOffset?: [number, number];
  /** Constant fallback text anchor used when `textAnchors` is absent. */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Constant fallback alignment baseline used when `alignmentBaselines` is absent. */
  alignmentBaseline?: 'center' | 'top' | 'bottom';
  /** Character set for atlas generation. Pass `'auto'` when the adapter should derive it. */
  characterSet?: FontSettings['characterSet'] | 'auto';
  /** Font atlas generation settings. */
  fontSettings?: FontSettings;
  /** Multiplier applied to the atlas font size for one-line baseline layout. */
  lineHeight?: number;
  /** Optional deterministic mapping, mainly useful when atlas generation is managed externally. */
  characterMapping?: CharacterMapping;
  /** Optional prebuilt atlas for texture binding when `characterMapping` is injected. */
  fontAtlas?: FontAtlas;
}
