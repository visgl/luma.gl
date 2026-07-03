// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getExternalImageSize, type ExternalImage} from '@luma.gl/core';
import {loadImageBitmap} from '@luma.gl/engine';
import type {FontAtlas, FontAtlasRenderSettings} from './atlas/font-atlas';
import {createTextKerning, type CharacterMapping, type TextKerningPair} from './atlas/text-utils';

/** Glyph metrics and atlas placement read from a BMFont JSON descriptor. */
export type BmFontMsdfCharacter = {
  /** Unicode code point represented by this glyph. */
  id: number;
  /** Optional atlas ordering metadata emitted by some BMFont JSON generators. */
  index?: number;
  /** Optional decoded glyph emitted by some BMFont JSON generators. */
  char?: string;
  /** Left edge of the glyph rectangle in atlas pixels. */
  x: number;
  /** Top edge of the glyph rectangle in atlas pixels. */
  y: number;
  /** Width of the glyph rectangle in atlas pixels. */
  width: number;
  /** Height of the glyph rectangle in atlas pixels. */
  height: number;
  /** Horizontal offset from the pen position to the glyph rectangle. */
  xoffset: number;
  /** Vertical offset from the line top to the glyph rectangle. */
  yoffset: number;
  /** Horizontal pen advance after rendering the glyph. */
  xadvance: number;
  /** Optional BMFont channel mask. */
  chnl?: number;
  /** Zero-based atlas page containing the glyph. Defaults to the first page. */
  page?: number;
};

/** Kerning adjustment between two Unicode code points in font pixels. */
export type BmFontMsdfKerning = {
  /** First Unicode code point in the pair. */
  first: number;
  /** Second Unicode code point in the pair. */
  second: number;
  /** Horizontal adjustment applied between the two glyphs. */
  amount: number;
};

/**
 * BMFont JSON fields required to construct an MSDF {@link FontAtlas}.
 *
 * Additional BMFont fields may be present in the source descriptor and are ignored.
 */
export type BmFontMsdfData = {
  /** Shared line metrics, page dimensions, and page count. */
  common: {
    /** Distance between consecutive baselines in font pixels. */
    lineHeight: number;
    /** Distance from the line top to the baseline in font pixels. */
    base: number;
    /** Width of every atlas page in pixels. */
    scaleW: number;
    /** Height of every atlas page in pixels. */
    scaleH: number;
    /** Number of image pages referenced by this descriptor. */
    pages: number;
  };
  /** Image filenames or URLs, ordered by page index. */
  pages: string[];
  /** Glyph metrics and atlas rectangles. */
  chars: BmFontMsdfCharacter[];
  /** Optional pair kerning adjustments. */
  kernings?: BmFontMsdfKerning[];
  /** MSDF encoding metadata used by the fragment shader. */
  distanceField: {
    /** Distance-field encoding. This builder requires `msdf`. */
    fieldType: string;
    /** Signed-distance range encoded around each glyph, in atlas pixels. */
    distanceRange: number;
  };
};

/**
 * Builds a {@link FontAtlas} from parsed BMFont MSDF metadata and decoded image pages.
 *
 * The builder validates the MSDF encoding, page count, page dimensions, and each glyph's page
 * reference before returning the renderer-independent atlas contract.
 */
export function buildMsdfFontAtlas(props: {
  data: BmFontMsdfData;
  pages: readonly ExternalImage[];
}): FontAtlas {
  const {data, pages} = props;
  assertMsdfDescriptor(data, pages);
  const renderSettings: FontAtlasRenderSettings = {
    mode: 'msdf',
    threshold: 0.5,
    smoothing: 0,
    distanceRange: data.distanceField.distanceRange
  };
  const mapping: CharacterMapping = {};
  for (const character of data.chars) {
    const key = String.fromCodePoint(character.id);
    mapping[key] = {
      x: character.x,
      y: character.y,
      width: character.width,
      height: character.height,
      atlasPage: character.page ?? 0,
      anchorX: character.xoffset,
      anchorY: character.yoffset,
      layoutOffsetX: character.xoffset,
      layoutOffsetY: character.yoffset,
      advance: character.xadvance
    };
  }
  const kerningPairs = (data.kernings ?? []).map(
    ({first, second, amount}): TextKerningPair => ({first, second, amount})
  );
  return {
    baselineOffset: -data.common.base,
    lineHeight: data.common.lineHeight,
    xOffset: 0,
    yOffsetMin: 0,
    yOffsetMax: data.common.lineHeight,
    mapping,
    kerning: createTextKerning(kerningPairs),
    renderSettings,
    pages,
    width: data.common.scaleW,
    height: data.common.scaleH
  };
}

/**
 * Loads a BMFont MSDF JSON descriptor and all image pages it references.
 *
 * Relative image paths are resolved against the descriptor URL. Pass `crossOrigin` when the
 * descriptor references atlas images hosted on another origin.
 */
export async function loadMsdfFontAtlas(
  url: string,
  options?: {crossOrigin?: string}
): Promise<FontAtlas> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load MSDF font "${url}": ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as BmFontMsdfData;
  const pageUrls = data.pages.map(page => _resolveMsdfFontPageUrl(page, url));
  const pages = await Promise.all(
    pageUrls.map(pageUrl => loadImageBitmap(pageUrl, {crossOrigin: options?.crossOrigin}))
  );
  return buildMsdfFontAtlas({data, pages});
}

function assertMsdfDescriptor(data: BmFontMsdfData, pages: readonly ExternalImage[]): void {
  if (data.distanceField?.fieldType !== 'msdf') {
    throw new Error('MSDF font descriptor must declare distanceField.fieldType as "msdf"');
  }
  if (!(data.distanceField.distanceRange > 0)) {
    throw new Error('MSDF font descriptor requires a positive distanceField.distanceRange');
  }
  if (!Number.isInteger(data.common.pages) || data.common.pages <= 0) {
    throw new Error('MSDF font descriptor requires common.pages to be a positive integer');
  }
  if (data.pages.length !== data.common.pages || pages.length !== data.common.pages) {
    throw new Error('MSDF font descriptor page metadata does not match loaded atlas pages');
  }
  for (const page of pages) {
    const {width, height} = getExternalImageSize(page);
    if (width !== data.common.scaleW || height !== data.common.scaleH) {
      throw new Error('MSDF font atlas pages must match common.scaleW/common.scaleH');
    }
  }
  for (const character of data.chars) {
    const page = character.page ?? 0;
    if (page < 0 || page >= data.common.pages) {
      throw new Error(`MSDF glyph ${character.id} references missing atlas page ${page}`);
    }
  }
}

/** @internal */
export function _resolveMsdfFontPageUrl(relativeUrl: string, baseUrl: string): string {
  if (/^[a-z][a-z\d+\-.]*:/i.test(relativeUrl)) {
    return relativeUrl;
  }
  const documentUrl = globalThis.location?.href ?? 'http://localhost/';
  return new URL(relativeUrl, new URL(baseUrl, documentUrl)).toString();
}
