// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Adapted from THREE.js FontLoader (https://github.com/mrdoob/three.js/) under the MIT License.

import {ShapePath} from './paths/shape-path.ts'
import {Shape} from './paths/path.ts'

/** Command tokens found in the typeface outline. */
type GlyphCommand = 'm' | 'l' | 'q' | 'b'

/** Typeface glyph outline definition parsed from JSON. */
type TypefaceGlyph = {
  /** Horizontal advance after rendering the glyph. */
  ha: number
  /** Outline command sequence describing the glyph. */
  o?: string
  /** Cached outline tokens for repeated parsing. */
  _cachedOutline?: string[]
}

/** Typeface JSON font definition accepted by the loader. */
export type TypefaceFontData = {
  /** Name of the font family. */
  familyName: string
  /** Glyph table keyed by character. */
  glyphs: Record<string, TypefaceGlyph | undefined>
  /** Font resolution from the source generator. */
  resolution: number
  /** Font bounding box extents. */
  boundingBox: {
    /** Minimum y coordinate for glyph outlines. */
    yMin: number
    /** Maximum y coordinate for glyph outlines. */
    yMax: number
  }
  /** Underline thickness for the font. */
  underlineThickness: number
}

/** Font wrapper that can generate shapes for strings. */
export class Font {
  /** Discriminator flag matching THREE.js fonts. */
  readonly isFont = true
  /** Type label for runtime inspection. */
  readonly type = 'Font'
  /** Typeface definition used to generate glyphs. */
  readonly data: TypefaceFontData

  /** Creates a new font instance from parsed data. */
  constructor(data: TypefaceFontData) {
    this.data = data
  }

  /** Converts the provided text into a collection of shapes. */
  generateShapes(text: string, size = 100, divisions = 12): Shape[] {
    const shapes: Shape[] = []
    const paths = createPaths(text, size, this.data, divisions)
    for (const path of paths) {
      shapes.push(...path.toShapes())
    }
    return shapes
  }
}

/** Parses typeface JSON data into a Font instance. */
export function parseFont(data: TypefaceFontData): Font {
  return new Font(data)
}

/** Builds ShapePath instances for the supplied text string. */
function createPaths(text: string, size: number, data: TypefaceFontData, divisions: number): ShapePath[] {
  const characters = Array.from(text)
  const scale = size / data.resolution
  const lineHeight = (data.boundingBox.yMax - data.boundingBox.yMin + data.underlineThickness) * scale

  const paths: ShapePath[] = []
  let offsetX = 0
  let offsetY = 0

  for (const character of characters) {
    if (character === '\n') {
      offsetX = 0
      offsetY -= lineHeight
    } else {
      const result = createPath(character, scale, offsetX, offsetY, data, divisions)
      offsetX += result.offsetX
      paths.push(result.path)
    }
  }

  return paths
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
  const glyph = data.glyphs[character] ?? data.glyphs['?']
  if (!glyph) {
    throw new Error(`Font: character "${character}" is not available in ${data.familyName}`)
  }

  const path = new ShapePath()
  let x = 0
  let y = 0
  let controlPointX = 0
  let controlPointY = 0
  let controlPoint1X = 0
  let controlPoint1Y = 0
  let controlPoint2X = 0
  let controlPoint2Y = 0

  if (glyph.o) {
    const outline = glyph._cachedOutline ?? (glyph._cachedOutline = glyph.o.split(' '))
    for (let i = 0; i < outline.length; ) {
      const action = outline[i++] as GlyphCommand
      switch (action) {
        case 'm':
          x = Number(outline[i++]) * scale + offsetX
          y = Number(outline[i++]) * scale + offsetY
          path.moveTo(x, y)
          break
        case 'l':
          x = Number(outline[i++]) * scale + offsetX
          y = Number(outline[i++]) * scale + offsetY
          path.lineTo(x, y)
          break
        case 'q':
          controlPointX = Number(outline[i++]) * scale + offsetX
          controlPointY = Number(outline[i++]) * scale + offsetY
          controlPoint1X = Number(outline[i++]) * scale + offsetX
          controlPoint1Y = Number(outline[i++]) * scale + offsetY
          path.quadraticCurveTo(controlPoint1X, controlPoint1Y, controlPointX, controlPointY)
          break
        case 'b':
          controlPointX = Number(outline[i++]) * scale + offsetX
          controlPointY = Number(outline[i++]) * scale + offsetY
          controlPoint1X = Number(outline[i++]) * scale + offsetX
          controlPoint1Y = Number(outline[i++]) * scale + offsetY
          controlPoint2X = Number(outline[i++]) * scale + offsetX
          controlPoint2Y = Number(outline[i++]) * scale + offsetY
          path.bezierCurveTo(controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y, controlPointX, controlPointY)
          break
        default:
          break
      }
    }
  }

  if (divisions > 0) {
    // normalize points along curves for smoother output when curveSegments is provided
    const normalizedPath = new ShapePath()
    for (const subPath of path.subPaths) {
      const normalizedPoints = subPath.getPoints(divisions)
      normalizedPath.moveTo(normalizedPoints[0].x, normalizedPoints[0].y)
      for (let i = 1; i < normalizedPoints.length; i++) {
        normalizedPath.lineTo(normalizedPoints[i].x, normalizedPoints[i].y)
      }
    }
    return {offsetX: glyph.ha * scale, path: normalizedPath}
  }

  return {offsetX: glyph.ha * scale, path}
}
