// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from deck.gl FontAtlasManager under the MIT License.

/* global document, ImageData, OffscreenCanvas */
import TinySDF from '@mapbox/tiny-sdf';
import {log} from '@luma.gl/core';
import {buildMapping, type CharacterMapping} from './text-utils';
import LRUCache from './lru-cache';

function getDefaultCharacterSet(): string[] {
  const characterSet: string[] = [];
  for (let code = 32; code < 128; code++) {
    characterSet.push(String.fromCharCode(code));
  }
  return characterSet;
}

export interface FontRenderer {
  measure(character?: string): {
    advance: number;
    width: number;
    ascent: number;
    descent: number;
  };
  draw(character: string): {
    data: ImageData;
    left?: number;
    top?: number;
  };
}

export type FontSettings = {
  fontFamily?: string;
  fontWeight?: string | number;
  characterSet?: Set<string> | string[] | string;
  fontSize?: number;
  buffer?: number;
  sdf?: boolean;
  cutoff?: number;
  radius?: number;
  smoothing?: number;
};

export const DEFAULT_FONT_SETTINGS: Required<FontSettings> = {
  fontFamily: 'Monaco, monospace',
  fontWeight: 'normal',
  characterSet: getDefaultCharacterSet(),
  fontSize: 64,
  buffer: 4,
  sdf: false,
  cutoff: 0.25,
  radius: 12,
  smoothing: 0.1
};

const MAX_CANVAS_WIDTH = 1024;
const DEFAULT_ASCENT = 0.9;
const DEFAULT_DESCENT = 0.3;
const CACHE_LIMIT = 3;

export type FontAtlas = {
  baselineOffset: number;
  xOffset: number;
  yOffsetMin: number;
  yOffsetMax: number;
  mapping: CharacterMapping;
  data: HTMLCanvasElement | OffscreenCanvas;
  width: number;
  height: number;
};

export type FontAtlasBuildMetrics = Readonly<{
  cacheStatus: 'hit' | 'rebuild' | 'incremental';
  totalBuildTimeMs: number;
  mappingBuildTimeMs: number;
  canvasPreparationTimeMs: number;
  bitmapDrawTimeMs: number;
  sdfGenerationTimeMs: number;
  glyphCount: number;
  atlasWidth: number;
  atlasHeight: number;
  usedOffscreenCanvas: boolean;
}>;

let cache = new LRUCache<FontAtlas>(CACHE_LIMIT);
let buildMetricsCache = new LRUCache<FontAtlasBuildMetrics>(CACHE_LIMIT);

function getNewCharacters(
  cacheKey: string,
  characterSet: Set<string> | string[] | string
): Set<string> {
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

function populateAlphaChannel(
  alphaChannel: Uint8ClampedArray | Uint8Array,
  imageData: ImageData
): void {
  for (let index = 0; index < alphaChannel.length; index++) {
    imageData.data[4 * index + 3] = alphaChannel[index];
  }
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
): {advance: number; width: number; ascent: number; descent: number} {
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

/** Increase the process-wide font atlas LRU capacity. */
export function setFontAtlasCacheLimit(limit: number): void {
  log.assert(Number.isFinite(limit) && limit >= CACHE_LIMIT, 'Invalid cache limit');
  cache = new LRUCache(limit);
  buildMetricsCache = new LRUCache(limit);
}

/** Shared font atlas builder used by bitmap and SDF 2D text rendering. */
export default class FontAtlasManager {
  props: Required<FontSettings> = {...DEFAULT_FONT_SETTINGS};
  private key?: string;
  private currentAtlas?: FontAtlas;
  private currentMetrics?: FontAtlasBuildMetrics;
  private latestBuildMetrics?: FontAtlasBuildMetrics;
  private getFontRenderer?: (settings: Required<FontSettings>) => FontRenderer;

  get atlas(): Readonly<FontAtlas> | undefined {
    return this.currentAtlas;
  }

  get mapping(): CharacterMapping | undefined {
    return this.currentAtlas?.mapping;
  }

  get metrics(): FontAtlasBuildMetrics | undefined {
    return this.currentMetrics;
  }

  get buildMetrics(): FontAtlasBuildMetrics | undefined {
    return this.latestBuildMetrics;
  }

  setProps(
    props: FontSettings & {
      getFontRenderer?: (settings: Required<FontSettings>) => FontRenderer;
    } = {}
  ): void {
    Object.assign(this.props, props);
    if (props.getFontRenderer) {
      this.getFontRenderer = props.getFontRenderer;
    }
    this.key = this.getKey();
    const characterSet = getNewCharacters(this.key, this.props.characterSet);
    const cachedFontAtlas = cache.get(this.key);

    if (cachedFontAtlas && characterSet.size === 0) {
      this.currentAtlas = cachedFontAtlas;
      this.latestBuildMetrics = buildMetricsCache.get(this.key);
      this.currentMetrics = {
        cacheStatus: 'hit',
        totalBuildTimeMs: 0,
        mappingBuildTimeMs: 0,
        canvasPreparationTimeMs: 0,
        bitmapDrawTimeMs: 0,
        sdfGenerationTimeMs: 0,
        glyphCount: 0,
        atlasWidth: cachedFontAtlas.width,
        atlasHeight: cachedFontAtlas.height,
        usedOffscreenCanvas: isOffscreenCanvas(cachedFontAtlas.data)
      };
      return;
    }

    const {atlas: fontAtlas, metrics} = this.generateFontAtlas(characterSet, cachedFontAtlas);
    this.currentAtlas = fontAtlas;
    this.currentMetrics = metrics;
    this.latestBuildMetrics = metrics;
    cache.set(this.key, fontAtlas);
    buildMetricsCache.set(this.key, metrics);
  }

  private generateFontAtlas(
    characterSet: Set<string>,
    cachedFontAtlas?: FontAtlas
  ): {atlas: FontAtlas; metrics: FontAtlasBuildMetrics} {
    const totalBuildStartTime = getNow();
    const {fontFamily, fontWeight, fontSize, buffer, sdf} = this.props;
    let canvas = cachedFontAtlas?.data;
    let canvasPreparationTimeMs = 0;
    if (!canvas) {
      const canvasPreparationStartTime = getNow();
      canvas = createAtlasCanvas(MAX_CANVAS_WIDTH);
      canvas.width = MAX_CANVAS_WIDTH;
      canvasPreparationTimeMs += getNow() - canvasPreparationStartTime;
    }
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (!context) {
      throw new Error('FontAtlasManager requires a 2D canvas context');
    }
    setTextStyle(context, fontFamily, fontSize, fontWeight);
    const defaultMeasure = (character?: string) => measureText(context, fontSize, character);

    let renderer: FontRenderer | undefined;
    if (this.getFontRenderer) {
      renderer = this.getFontRenderer(this.props);
    } else if (sdf) {
      renderer = {
        measure: defaultMeasure,
        draw: getSdfFontRenderer(this.props)
      };
    }

    const mappingBuildStartTime = getNow();
    const {mapping, canvasHeight, xOffset, yOffsetMin, yOffsetMax} = buildMapping({
      measureText: character =>
        renderer ? renderer.measure(character) : defaultMeasure(character),
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
    const mappingBuildTimeMs = getNow() - mappingBuildStartTime;

    if (canvas.height !== canvasHeight) {
      const canvasPreparationStartTime = getNow();
      const imageData =
        canvas.height > 0 ? context.getImageData(0, 0, canvas.width, canvas.height) : null;
      canvas.height = canvasHeight;
      if (imageData) {
        context.putImageData(imageData, 0, 0);
      }
      canvasPreparationTimeMs += getNow() - canvasPreparationStartTime;
    }
    setTextStyle(context, fontFamily, fontSize, fontWeight);

    let bitmapDrawTimeMs = 0;
    let sdfGenerationTimeMs = 0;
    if (renderer) {
      for (const character of characterSet) {
        const frame = mapping[character];
        const drawStartTime = getNow();
        const {data, left = 0, top = 0} = renderer.draw(character);
        sdfGenerationTimeMs += sdf ? getNow() - drawStartTime : 0;
        const x = frame.x - left;
        const y = frame.y - top;
        const x0 = Math.max(0, Math.round(x));
        const y0 = Math.max(0, Math.round(y));
        const width = Math.min(data.width, canvas.width - x0);
        const height = Math.min(data.height, canvas.height - y0);
        context.putImageData(data, x0, y0, 0, 0, width, height);
        bitmapDrawTimeMs += getNow() - drawStartTime;
        frame.x += x0 - x;
        frame.y += y0 - y;
      }
    } else {
      for (const character of characterSet) {
        const frame = mapping[character];
        const drawStartTime = getNow();
        context.fillText(character, frame.x, frame.y + frame.anchorY);
        bitmapDrawTimeMs += getNow() - drawStartTime;
      }
    }

    const fontMetrics = renderer ? renderer.measure() : defaultMeasure();
    const atlas = {
      baselineOffset: (fontMetrics.ascent - fontMetrics.descent) / 2,
      xOffset,
      yOffsetMin,
      yOffsetMax,
      mapping,
      data: canvas,
      width: canvas.width,
      height: canvas.height
    };
    return {
      atlas,
      metrics: {
        cacheStatus: cachedFontAtlas ? 'incremental' : 'rebuild',
        totalBuildTimeMs: getNow() - totalBuildStartTime,
        mappingBuildTimeMs,
        canvasPreparationTimeMs,
        bitmapDrawTimeMs,
        sdfGenerationTimeMs,
        glyphCount: characterSet.size,
        atlasWidth: atlas.width,
        atlasHeight: atlas.height,
        usedOffscreenCanvas: isOffscreenCanvas(atlas.data)
      }
    };
  }

  private getKey(): string {
    const {fontFamily, fontWeight, fontSize, buffer, sdf, radius, cutoff} = this.props;
    return sdf
      ? `${fontFamily} ${fontWeight} ${fontSize} ${buffer} ${radius} ${cutoff}`
      : `${fontFamily} ${fontWeight} ${fontSize} ${buffer}`;
  }
}

function createAtlasCanvas(width: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, 0);
  }
  if (typeof document === 'undefined') {
    throw new Error('FontAtlasManager requires OffscreenCanvas or a browser-like document');
  }
  return document.createElement('canvas');
}

function isOffscreenCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): canvas is OffscreenCanvas {
  return typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas;
}

function getNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function getSdfFontRenderer({
  fontSize,
  buffer,
  radius,
  cutoff,
  fontFamily,
  fontWeight
}: Required<FontSettings>): FontRenderer['draw'] {
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
    populateAlphaChannel(data, imageData);
    return {data: imageData, left: buffer, top: buffer};
  };
}
