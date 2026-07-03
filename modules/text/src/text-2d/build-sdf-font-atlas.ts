// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global ImageData */
import TinySDF from '@mapbox/tiny-sdf';
import {
  buildBrowserFontAtlas,
  resolveBrowserFontAtlasSettings,
  type BrowserFontAtlasSettings,
  type BrowserFontRenderer
} from './atlas/browser-font-atlas';
import type {FontAtlas} from './atlas/font-atlas';

/** Browser font, packing, and distance-field options accepted by {@link buildSdfFontAtlas}. */
export type SdfFontAtlasSettings = BrowserFontAtlasSettings & {
  /** TinySDF cutoff used while generating glyph distance values. */
  cutoff?: number;
  /** TinySDF search radius in pixels. */
  radius?: number;
  /** Fragment-stage transition width stored with the resulting atlas. */
  smoothing?: number;
};

const DEFAULT_SDF_FONT_ATLAS_SETTINGS: Required<
  Pick<SdfFontAtlasSettings, 'cutoff' | 'radius' | 'smoothing'>
> = {
  cutoff: 0.25,
  radius: 12,
  smoothing: 0.1
};

/**
 * Builds a browser-font signed-distance-field atlas in the common {@link FontAtlas} format.
 *
 * Font measurement and packing are shared with the bitmap builder; only glyph rasterization and
 * the attached fragment sampling settings differ.
 */
export function buildSdfFontAtlas(props: SdfFontAtlasSettings = {}): FontAtlas {
  const {cutoff, radius, smoothing} = {...DEFAULT_SDF_FONT_ATLAS_SETTINGS, ...props};
  const settings = resolveBrowserFontAtlasSettings(props);
  const {fontFamily, fontWeight, fontSize, buffer} = settings;
  return buildBrowserFontAtlas({
    settings,
    cacheKey: `sdf ${fontFamily} ${fontWeight} ${fontSize} ${buffer} ${radius} ${cutoff}`,
    renderSettings: {
      mode: 'sdf',
      threshold: 1 - cutoff,
      smoothing: Math.max(0, smoothing)
    },
    createRenderer: defaultMeasure => ({
      measure: defaultMeasure,
      draw: createSdfGlyphRenderer({
        fontFamily,
        fontWeight,
        fontSize,
        buffer,
        radius,
        cutoff
      })
    })
  });
}

function createSdfGlyphRenderer({
  fontSize,
  buffer,
  radius,
  cutoff,
  fontFamily,
  fontWeight
}: Required<
  Pick<
    SdfFontAtlasSettings,
    'fontSize' | 'buffer' | 'radius' | 'cutoff' | 'fontFamily' | 'fontWeight'
  >
>): BrowserFontRenderer['draw'] {
  const tinySdf = new TinySDF({
    fontSize,
    buffer,
    radius,
    cutoff,
    fontFamily,
    fontWeight: `${fontWeight}`
  });

  return (character: string) => {
    const {data, width, height} = tinySdf.draw(character);
    const imageData = new ImageData(width, height);
    for (let index = 0; index < data.length; index++) {
      imageData.data[4 * index + 3] = data[index];
    }
    return {data: imageData, left: buffer, top: buffer};
  };
}
