// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js FontLoader (https://github.com/mrdoob/three.js/) under the MIT License.

import {Vector2} from '@math.gl/core';
import {ShapePath} from './paths/shape-path';
import {Shape} from './paths/path';

/** Command tokens found in the typeface outline. */
type GlyphCommand = 'm' | 'l' | 'q' | 'b';

/** Typeface glyph outline definition parsed from JSON. */
type TypefaceGlyph = {
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

/** Typeface JSON font definition accepted by the loader. */
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

/** Layout options applied while generating glyph shapes. */
export type TextLayoutOptions = {
  /** Horizontal alignment applied independently to each line. */
  align?: 'left' | 'center';
};

/** Font wrapper that can generate shapes for strings. */
export class Font {
  /** Discriminator flag matching THREE.js fonts. */
  readonly isFont = true;
  /** Type label for runtime inspection. */
  readonly type = 'Font';
  /** Typeface definition used to generate glyphs. */
  readonly data: TypefaceFontData;

  /** Creates a new font instance from parsed data. */
  constructor(data: TypefaceFontData) {
    this.data = data;
  }

  /** Converts the provided text into a collection of shapes. */
  generateShapes(
    text: string,
    size = 100,
    divisions = 12,
    options: TextLayoutOptions = {}
  ): Shape[] {
    const shapes: Shape[] = [];
    const paths = createPaths(text, size, this.data, divisions, options);
    for (const path of paths) {
      shapes.push(...path.toShapes());
    }
    return shapes;
  }

  /** Resolves one source character to a glyph present in this font. */
  resolveCharacter(character: string): string {
    return resolveGlyphCharacter(character, this.data);
  }

  /** Returns one glyph's horizontal advance at the requested font size. */
  getGlyphAdvance(character: string, size = 100): number {
    const scale = getFontScale(size, this.data);
    return getGlyph(character, this.data).ha * scale;
  }

  /** Returns the font line height at the requested font size. */
  getLineHeight(size = 100): number {
    return getLineHeight(this.data, getFontScale(size, this.data));
  }

  /** Returns one line's horizontal advance width at the requested font size. */
  measureLineWidth(line: string, size = 100): number {
    return measureLineWidth(line, this.data, getFontScale(size, this.data));
  }
}

/** Parses typeface JSON data into a Font instance. */
export function parseFont(data: TypefaceFontData): Font {
  return new Font(data);
}

/** Builds ShapePath instances for the supplied text string. */
function createPaths(
  text: string,
  size: number,
  data: TypefaceFontData,
  divisions: number,
  options: TextLayoutOptions
): ShapePath[] {
  const lines = text.split('\n');
  const scale = getFontScale(size, data);
  const lineHeight = getLineHeight(data, scale);
  const align = options.align ?? 'left';

  const paths: ShapePath[] = [];
  let offsetY = 0;

  for (const line of lines) {
    let offsetX = 0;
    if (align === 'center') {
      offsetX = -measureLineWidth(line, data, scale) / 2;
    }

    for (const character of Array.from(line)) {
      const result = createPath(character, scale, offsetX, offsetY, data, divisions);
      offsetX += result.offsetX;
      paths.push(result.path);
    }

    offsetY -= lineHeight;
  }

  return paths;
}

/** Computes the total advance width for a line of text. */
function measureLineWidth(line: string, data: TypefaceFontData, scale: number): number {
  let width = 0;

  for (const character of Array.from(line)) {
    const glyph = getGlyph(character, data);
    width += glyph.ha * scale;
  }

  return width;
}

/** Converts a single character into a ShapePath. */
// eslint-disable-next-line max-params
function createPath(
  character: string,
  scale: number,
  offsetX: number,
  offsetY: number,
  data: TypefaceFontData,
  divisions: number
): {offsetX: number; path: ShapePath} {
  const glyph = getGlyph(character, data);

  const path = new ShapePath();
  let x = 0;
  let y = 0;
  let controlPointX = 0;
  let controlPointY = 0;
  let controlPoint1X = 0;
  let controlPoint1Y = 0;
  let controlPoint2X = 0;
  let controlPoint2Y = 0;

  if (glyph.o) {
    const outline = glyph._cachedOutline ?? glyph.o.split(' ');
    glyph._cachedOutline ??= outline;
    for (let i = 0; i < outline.length; ) {
      const action = outline[i++] as GlyphCommand;
      switch (action) {
        case 'm':
          x = Number(outline[i++]) * scale + offsetX;
          y = Number(outline[i++]) * scale + offsetY;
          path.moveTo(x, y);
          break;
        case 'l':
          x = Number(outline[i++]) * scale + offsetX;
          y = Number(outline[i++]) * scale + offsetY;
          path.lineTo(x, y);
          break;
        case 'q':
          controlPointX = Number(outline[i++]) * scale + offsetX;
          controlPointY = Number(outline[i++]) * scale + offsetY;
          controlPoint1X = Number(outline[i++]) * scale + offsetX;
          controlPoint1Y = Number(outline[i++]) * scale + offsetY;
          path.quadraticCurveTo(controlPoint1X, controlPoint1Y, controlPointX, controlPointY);
          break;
        case 'b':
          controlPointX = Number(outline[i++]) * scale + offsetX;
          controlPointY = Number(outline[i++]) * scale + offsetY;
          controlPoint1X = Number(outline[i++]) * scale + offsetX;
          controlPoint1Y = Number(outline[i++]) * scale + offsetY;
          controlPoint2X = Number(outline[i++]) * scale + offsetX;
          controlPoint2Y = Number(outline[i++]) * scale + offsetY;
          path.bezierCurveTo(
            controlPoint1X,
            controlPoint1Y,
            controlPoint2X,
            controlPoint2Y,
            controlPointX,
            controlPointY
          );
          break;
        default:
          break;
      }
    }
  }

  if (divisions > 0) {
    // normalize points along curves for smoother output when curveSegments is provided
    const normalizedPath = new ShapePath();
    for (const subPath of path.subPaths) {
      const normalizedPoints = subPath.getPoints(divisions);
      normalizedPath.moveTo(normalizedPoints[0].x, normalizedPoints[0].y);
      for (let i = 1; i < normalizedPoints.length; i++) {
        normalizedPath.lineTo(normalizedPoints[i].x, normalizedPoints[i].y);
      }
      closeSubPath(
        normalizedPath,
        normalizedPoints[0],
        normalizedPoints[normalizedPoints.length - 1]
      );
    }
    return {offsetX: glyph.ha * scale, path: normalizedPath};
  }

  return {offsetX: glyph.ha * scale, path};
}

/** Ensures the rebuilt sub-path is explicitly closed for triangulation. */
function closeSubPath(path: ShapePath, start: Vector2, end: Vector2): void {
  if (!start.equals(end)) {
    path.lineTo(start.x, start.y);
  }
}

/** Returns the normalized font scale for one requested text size. */
function getFontScale(size: number, data: TypefaceFontData): number {
  return size / data.resolution;
}

/** Returns the advance between adjacent font rows. */
function getLineHeight(data: TypefaceFontData, scale: number): number {
  return (data.boundingBox.yMax - data.boundingBox.yMin + data.underlineThickness) * scale;
}

/** Resolves a source character to a glyph stored by the font. */
function resolveGlyphCharacter(character: string, data: TypefaceFontData): string {
  if (data.glyphs[character]) {
    return character;
  }
  if (data.glyphs['?']) {
    return '?';
  }
  throw new Error(`Font: character "${character}" is not available in ${data.familyName}`);
}

/** Returns the font glyph used to render one source character. */
function getGlyph(character: string, data: TypefaceFontData): TypefaceGlyph {
  return data.glyphs[resolveGlyphCharacter(character, data)]!;
}
