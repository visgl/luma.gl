// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ModelProps} from '@luma.gl/engine';
import type {GPUVector} from '@luma.gl/tables';
import type {FixedSizeList, Float32, Int16, List, Uint8} from 'apache-arrow';
import type {FontAtlas, FontSettings} from '../atlas/font-atlas-manager';
import type {CharacterMapping} from '../atlas/text-utils';
import type {Utf8Dictionary, Utf8TextType} from './gpu-text-types';

/** GPU packed RGBA8 text color for one label row. */
export type TextRowColorType = FixedSizeList<Uint8>;
/** GPU packed RGBA8 text colors for each character in one label row. */
export type TextCharacterColorType = List<FixedSizeList<Uint8>>;
/** GPU text color input accepted by the attribute-backed model. */
export type TextColorType = TextRowColorType | TextCharacterColorType;

export type TextStyleModelProps = Omit<ModelProps, 'instanceCount'> & {
  /** GPU-resident label origins aligned one-for-one with `texts`; each row is `[x, y]`. */
  positions: GPUVector<FixedSizeList<Float32>>;
  /** Optional GPU per-row angles in degrees. */
  angles?: GPUVector<Float32>;
  /** Optional GPU per-row deck-style text sizes. */
  sizes?: GPUVector<Float32>;
  /** Optional GPU per-row pixel offsets; each row is `[x, y]`. */
  pixelOffsets?: GPUVector<FixedSizeList<Float32>>;
  /**
   * Optional GPU packed per-label clip rectangles `[x, y, width, height]`.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: GPUVector<FixedSizeList<Int16>>;
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
};

/** GPUVector inputs for attribute-backed 2D text. */
export type AttributeTextModelProps = TextStyleModelProps & {
  /** GPU UTF-8 or dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector<Utf8TextType>;
  /** Optional GPU packed RGBA8 text colors aligned with label rows or label characters. */
  colors?: GPUVector<TextColorType>;
};

export type StorageTextAlignmentProps = {
  /** Optional GPU packed RGBA8 text colors aligned with label rows. */
  colors?: GPUVector<TextRowColorType>;
  /** Optional GPU per-row text anchor enum: 0=start, 1=middle, 2=end. */
  textAnchors?: GPUVector<Uint8>;
  /** Optional GPU per-row alignment baseline enum: 0=center, 1=top, 2=bottom. */
  alignmentBaselines?: GPUVector<Uint8>;
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
};

/** GPUVector inputs for storage-backed 2D text. */
export type StorageTextModelProps = Omit<AttributeTextModelProps, 'colors' | 'texts'> &
  StorageTextAlignmentProps & {
    /** GPU UTF-8 or dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
    texts: GPUVector<Utf8TextType>;
  };

/** GPUVector inputs for compressed dictionary storage-backed 2D text. */
export type DictionaryTextModelProps = Omit<StorageTextModelProps, 'texts'> & {
  /** GPU dictionary-encoded UTF-8 labels aligned row-for-row with `positions`. */
  texts: GPUVector<Utf8Dictionary>;
};
