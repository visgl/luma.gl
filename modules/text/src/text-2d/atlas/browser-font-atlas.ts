// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from deck.gl text atlas utilities under the MIT License.

/* global document, ImageData, OffscreenCanvas */
import {log} from '@luma.gl/core';
import {buildMapping} from './text-utils';
import type {FontAtlas, FontAtlasRenderSettings} from './font-atlas';
import {LRUCache} from './lru-cache';

/** Character collection accepted by browser-backed font atlas builders. */
export type FontAtlasCharacterSet = Set<string> | string[] | string;

/** Shared browser font and packing options used by bitmap and SDF builders. */
export type BrowserFontAtlasSettings = {
  /** CSS font-family expression used by canvas text measurement. */
  fontFamily?: string;
  /** CSS font weight used by canvas text measurement and rasterization. */
  fontWeight?: string | number;
  /** Characters that must be available in the resulting atlas. */
  characterSet?: FontAtlasCharacterSet;
  /** Rasterization size in pixels. */
  fontSize?: number;
  /** Empty pixels reserved around every packed glyph. */
  buffer?: number;
};

/** Browser font settings after defaults have been applied. */
export type ResolvedBrowserFontAtlasSettings = Required<BrowserFontAtlasSettings>;

/** Glyph measurement and rasterization callbacks used by the shared packing implementation. */
export type BrowserFontRenderer = {
  /** Measures either one glyph or the font-wide ascent and descent when no glyph is supplied. */
  measure(character?: string): {
    advance: number;
    width: number;
    ascent: number;
    descent: number;
  };
  /** Rasterizes one glyph and reports how its image is offset from the measured frame. */
  draw(character: string): {
    data: ImageData;
    left?: number;
    top?: number;
  };
};

type BrowserFontAtlasBuildOptions = {
  settings: ResolvedBrowserFontAtlasSettings;
  cacheKey: string;
  renderSettings: FontAtlasRenderSettings;
  createRenderer?: (defaultMeasure: BrowserFontRenderer['measure']) => BrowserFontRenderer;
};

const DEFAULT_BROWSER_FONT_ATLAS_SETTINGS: ResolvedBrowserFontAtlasSettings = {
  fontFamily: 'Monaco, monospace',
  fontWeight: 'normal',
  characterSet: getDefaultCharacterSet(),
  fontSize: 64,
  buffer: 4
};
const MAX_CANVAS_WIDTH = 1024;
const DEFAULT_ASCENT = 0.9;
const DEFAULT_DESCENT = 0.3;
const CACHE_LIMIT = 3;

let cache = new LRUCache<FontAtlas>(CACHE_LIMIT);

/** Increases the process-wide generated atlas LRU capacity. */
export function setFontAtlasCacheLimit(limit: number): void {
  log.assert(Number.isFinite(limit) && limit >= CACHE_LIMIT, 'Invalid cache limit');
  cache = new LRUCache(limit);
}

/** Applies stable browser-font defaults without constructing an atlas. */
export function resolveBrowserFontAtlasSettings(
  props: BrowserFontAtlasSettings
): ResolvedBrowserFontAtlasSettings {
  return {...DEFAULT_BROWSER_FONT_ATLAS_SETTINGS, ...props};
}

/** Packs and rasterizes a browser font using a source-specific glyph renderer. */
export function buildBrowserFontAtlas(options: BrowserFontAtlasBuildOptions): FontAtlas {
  const {settings, cacheKey, renderSettings} = options;
  const characterSet = getNewCharacters(cacheKey, settings.characterSet);
  const cachedFontAtlas = cache.get(cacheKey);
  if (cachedFontAtlas && characterSet.size === 0) {
    return {...cachedFontAtlas, renderSettings};
  }

  const fontAtlas = buildGeneratedFontAtlas(options, characterSet, cachedFontAtlas);
  cache.set(cacheKey, fontAtlas);
  return fontAtlas;
}

function buildGeneratedFontAtlas(
  options: BrowserFontAtlasBuildOptions,
  characterSet: Set<string>,
  cachedFontAtlas?: FontAtlas
): FontAtlas {
  const {settings, renderSettings, createRenderer} = options;
  const {fontFamily, fontWeight, fontSize, buffer} = settings;
  let canvas = cachedFontAtlas?.pages[0] as HTMLCanvasElement | OffscreenCanvas | undefined;
  if (!canvas) {
    canvas = createAtlasCanvas(MAX_CANVAS_WIDTH);
    canvas.width = MAX_CANVAS_WIDTH;
  }
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) {
    throw new Error('Font atlas builders require a 2D canvas context');
  }
  setTextStyle(context, fontFamily, fontSize, fontWeight);
  const defaultMeasure = (character?: string) => measureText(context, fontSize, character);
  const renderer = createRenderer?.(defaultMeasure);

  const {mapping, canvasHeight, xOffset, yOffsetMin, yOffsetMax} = buildMapping({
    measureText: character => (renderer ? renderer.measure(character) : defaultMeasure(character)),
    buffer,
    characterSet,
    maxCanvasWidth: MAX_CANVAS_WIDTH,
    ...(cachedFontAtlas && {
      mapping: cachedFontAtlas.mapping,
      xOffset: cachedFontAtlas.xOffset,
      yOffsetMin: cachedFontAtlas.yOffsetMin,
      yOffsetMax: cachedFontAtlas.yOffsetMax
    })
  });

  if (canvas.height !== canvasHeight) {
    const imageData =
      canvas.height > 0 ? context.getImageData(0, 0, canvas.width, canvas.height) : null;
    canvas.height = canvasHeight;
    if (imageData) {
      context.putImageData(imageData, 0, 0);
    }
  }
  setTextStyle(context, fontFamily, fontSize, fontWeight);
  drawCharacters(context, characterSet, mapping, renderer);

  const fontMetrics = renderer ? renderer.measure() : defaultMeasure();
  return {
    baselineOffset: (fontMetrics.ascent - fontMetrics.descent) / 2,
    lineHeight: fontSize,
    xOffset,
    yOffsetMin,
    yOffsetMax,
    mapping,
    renderSettings,
    pages: [canvas],
    width: canvas.width,
    height: canvas.height
  };
}

function drawCharacters(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  characterSet: Set<string>,
  mapping: FontAtlas['mapping'],
  renderer: BrowserFontRenderer | undefined
): void {
  if (!renderer) {
    for (const character of characterSet) {
      const frame = mapping[character];
      context.fillText(character, frame.x, frame.y + frame.anchorY);
    }
    return;
  }

  for (const character of characterSet) {
    const frame = mapping[character];
    const {data, left = 0, top = 0} = renderer.draw(character);
    const x = frame.x - left;
    const y = frame.y - top;
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const width = Math.min(data.width, context.canvas.width - x0);
    const height = Math.min(data.height, context.canvas.height - y0);
    context.putImageData(data, x0, y0, 0, 0, width, height);
    frame.x += x0 - x;
    frame.y += y0 - y;
  }
}

function getNewCharacters(cacheKey: string, characterSet: FontAtlasCharacterSet): Set<string> {
  const newCharacterSet =
    typeof characterSet === 'string' ? new Set(Array.from(characterSet)) : new Set(characterSet);
  const cachedFontAtlas = cache.get(cacheKey);
  if (!cachedFontAtlas) {
    return newCharacterSet;
  }
  for (const character in cachedFontAtlas.mapping) {
    newCharacterSet.delete(character);
  }
  return newCharacterSet;
}

function setTextStyle(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  fontFamily: string,
  fontSize: number,
  fontWeight: string | number
): void {
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.fillStyle = '#000';
  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';
}

function measureText(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  fontSize: number,
  character: string | undefined
): ReturnType<BrowserFontRenderer['measure']> {
  if (character === undefined) {
    const fontMetrics = context.measureText('A');
    if (fontMetrics.fontBoundingBoxAscent) {
      return {
        advance: 0,
        width: 0,
        ascent: Math.ceil(fontMetrics.fontBoundingBoxAscent),
        descent: Math.ceil(fontMetrics.fontBoundingBoxDescent)
      };
    }
    return {
      advance: 0,
      width: 0,
      ascent: fontSize * DEFAULT_ASCENT,
      descent: fontSize * DEFAULT_DESCENT
    };
  }

  const metrics = context.measureText(character);
  if (!metrics.actualBoundingBoxAscent) {
    return {
      advance: metrics.width,
      width: metrics.width,
      ascent: fontSize * DEFAULT_ASCENT,
      descent: fontSize * DEFAULT_DESCENT
    };
  }
  return {
    advance: metrics.width,
    width: Math.ceil(metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft),
    ascent: Math.ceil(metrics.actualBoundingBoxAscent),
    descent: Math.ceil(metrics.actualBoundingBoxDescent)
  };
}

function createAtlasCanvas(width: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, 0);
  }
  if (typeof document === 'undefined') {
    throw new Error('Font atlas builders require OffscreenCanvas or a browser-like document');
  }
  return document.createElement('canvas');
}

function getDefaultCharacterSet(): string[] {
  const characterSet: string[] = [];
  for (let code = 32; code < 128; code++) {
    characterSet.push(String.fromCharCode(code));
  }
  return characterSet;
}
