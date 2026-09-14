// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {type FontAtlas} from '../fonts/atlas/font-atlas';
export {
  type GPUTextData,
  type GPUTextStats,
  type GPUTextStrategy
} from './gpu-text-data';
export {GPUTextResources, type GPUTextResourcesProps} from './gpu-text-resources';
export {TextRenderer, type TextRendererProps} from './text-renderer';
export {
  measureFontAtlasText,
  type FontAtlasTextMetrics,
  type FontAtlasTextMetricsOptions
} from '../fonts/atlas/text-metrics';
export {
  buildBitmapFontAtlas,
  type BitmapFontAtlasSettings
} from '../fonts/build-bitmap-font-atlas';
export {buildSdfFontAtlas, type SdfFontAtlasSettings} from '../fonts/build-sdf-font-atlas';
export {
  buildMsdfFontAtlas,
  loadMsdfFontAtlas,
  type BmFontMsdfCharacter,
  type BmFontMsdfData,
  type BmFontMsdfKerning
} from '../fonts/build-msdf-font-atlas';
export {
  buildMapping,
  getCharacterAtlasPage,
  getCharacterLayoutOffset,
  getTextKerningOffset,
  nextPowOfTwo,
  type Character,
  type CharacterMapping,
  type TextKerning
} from '../fonts/atlas/text-utils';
export {type TextGlyphLayout} from './model-utils/gpu-text-types';
export {
  buildTextGlyphLayout,
  type TextCodePointSource,
  type TextLayoutOptions
} from './model-utils/text-layout';
