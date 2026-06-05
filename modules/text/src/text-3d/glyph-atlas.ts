// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {extrudeShapes, type ExtrudeOptions, type ExtrudedAttributes} from './extrude';
import {Font, type TextLayoutOptions} from './font';

/** Packed 3D coordinate used by 3D glyph layout helpers. */
export type Text3DVector3 = [number, number, number];

/** Axis-aligned bounds for one glyph atlas or glyph layout. */
export type Text3DBounds = {
  /** Minimum xyz coordinates. */
  min: Text3DVector3;
  /** Maximum xyz coordinates. */
  max: Text3DVector3;
};

/** Options used to build one shared extruded glyph geometry atlas. */
export type Text3DGlyphAtlasOptions = ExtrudeOptions & {
  /** Typeface used to generate glyph outlines. */
  font: Font;
  /** Desired font size for generated glyphs. */
  size?: number;
  /** Optional identifier forwarded to the shared geometry. */
  id?: string;
};

/** One renderable glyph range inside a shared 3D geometry atlas. */
export type Text3DGlyphRange = {
  /** Stable glyph order inside the atlas. */
  glyphIndex: number;
  /** Font glyph character stored in the shared geometry. */
  glyphCharacter: string;
  /** Unicode code point for {@link glyphCharacter}. */
  glyphCodePoint: number;
  /** First shared-geometry vertex used by this glyph. */
  firstVertex: number;
  /** Number of shared-geometry vertices used by this glyph. */
  vertexCount: number;
  /** Horizontal font advance for this glyph. */
  advance: number;
  /** Local glyph geometry bounds before instance translation. */
  bounds: Text3DBounds;
};

/** Shared renderable glyph geometry plus range metadata. */
export type Text3DGlyphAtlas = {
  /** Typeface used to build this atlas. */
  font: Font;
  /** Font size used to build glyph geometry and layout advances. */
  size: number;
  /** Shared deindexed geometry containing every renderable used glyph once. */
  geometry: Geometry;
  /** Renderable glyph ranges in stable first-use order. */
  glyphs: Text3DGlyphRange[];
  /** Renderable glyph ranges keyed by resolved font glyph character. */
  glyphsByCharacter: ReadonlyMap<string, Text3DGlyphRange>;
  /** Shared geometry bounds before instance translation. */
  bounds: Text3DBounds;
  /** Font row advance at {@link size}. */
  lineHeight: number;
};

/** One visible glyph occurrence positioned by text layout. */
export type Text3DGlyphInstance = {
  /** Atlas glyph order consumed by grouped draws. */
  glyphIndex: number;
  /** Font glyph character stored in the shared geometry. */
  glyphCharacter: string;
  /** Unicode code point for {@link glyphCharacter}. */
  glyphCodePoint: number;
  /** Original source character before missing-glyph fallback. */
  sourceCharacter: string;
  /** Unicode code point for {@link sourceCharacter}. */
  sourceCodePoint: number;
  /** Source text row containing this glyph occurrence. */
  sourceRowIndex: number;
  /** Source glyph position within its row. */
  sourceGlyphIndex: number;
  /** Glyph translation applied before the crawl model transform. */
  offset: Text3DVector3;
};

/** Options used to lay out rows against one shared glyph atlas. */
export type Text3DGlyphLayoutOptions = TextLayoutOptions & {
  /** Optional z translation applied to every glyph instance. */
  z?: number;
};

/** Positioned visible glyph occurrences for one row-oriented text source. */
export type Text3DGlyphLayout = {
  /** Visible glyph occurrences in source row order. */
  instances: Text3DGlyphInstance[];
  /** Bounds after applying every glyph instance translation. */
  bounds: Text3DBounds;
  /** Font row advance used by this layout. */
  lineHeight: number;
  /** Horizontal advance width for each source row. */
  lineWidths: number[];
  /** Number of source rows represented by this layout. */
  rowCount: number;
};

/** Builds one shared extruded glyph geometry from the renderable glyphs used by text rows. */
export function buildText3DGlyphAtlas(
  text: string | readonly string[],
  options: Text3DGlyphAtlasOptions
): Text3DGlyphAtlas {
  const {font, size = 100, id, ...extrudeOptions} = options;
  const curveSegments = extrudeOptions.curveSegments ?? 12;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const glyphs: Text3DGlyphRange[] = [];
  const glyphsByCharacter = new Map<string, Text3DGlyphRange>();

  for (const glyphCharacter of getUsedGlyphCharacters(text, font)) {
    const glyphAttributes = extrudeShapes(
      font.generateShapes(glyphCharacter, size, curveSegments),
      {
        depth: 50,
        bevelEnabled: false,
        ...extrudeOptions,
        curveSegments
      }
    );
    const vertexCount = glyphAttributes.positions.length / 3;
    if (vertexCount === 0) {
      continue;
    }

    const glyphRange: Text3DGlyphRange = {
      glyphIndex: glyphs.length,
      glyphCharacter,
      glyphCodePoint: getRequiredCodePoint(glyphCharacter),
      firstVertex: positions.length / 3,
      vertexCount,
      advance: font.getGlyphAdvance(glyphCharacter, size),
      bounds: getText3DBounds(glyphAttributes.positions)
    };
    glyphs.push(glyphRange);
    glyphsByCharacter.set(glyphCharacter, glyphRange);
    appendExtrudedAttributes({positions, normals, uvs}, glyphAttributes);
  }

  const geometry = new Geometry({
    id,
    topology: 'triangle-list',
    vertexCount: positions.length / 3,
    attributes: {
      positions: {value: new Float32Array(positions), size: 3},
      normals: {value: new Float32Array(normals), size: 3},
      texCoords: {value: new Float32Array(uvs), size: 2}
    }
  });

  return {
    font,
    size,
    geometry,
    glyphs,
    glyphsByCharacter,
    bounds: getText3DBounds(new Float32Array(positions)),
    lineHeight: font.getLineHeight(size)
  };
}

/** Lays out visible glyph occurrences from text rows against one shared glyph atlas. */
export function layoutText3DGlyphRows(
  textRows: readonly string[],
  glyphAtlas: Text3DGlyphAtlas,
  options: Text3DGlyphLayoutOptions = {}
): Text3DGlyphLayout {
  const {font, size} = glyphAtlas;
  const align = options.align ?? 'left';
  const z = options.z ?? 0;
  const lineWidths = textRows.map(textRow => font.measureLineWidth(textRow, size));
  const instances: Text3DGlyphInstance[] = [];
  const boundsAccumulator = createText3DBoundsAccumulator();

  for (const [sourceRowIndex, textRow] of textRows.entries()) {
    let offsetX = align === 'center' ? -lineWidths[sourceRowIndex] / 2 : 0;
    const offsetY = -sourceRowIndex * glyphAtlas.lineHeight;

    for (const [sourceGlyphIndex, sourceCharacter] of Array.from(textRow).entries()) {
      const glyphCharacter = font.resolveCharacter(sourceCharacter);
      const glyphRange = glyphAtlas.glyphsByCharacter.get(glyphCharacter);
      if (glyphRange) {
        const offset: Text3DVector3 = [offsetX, offsetY, z];
        instances.push({
          glyphIndex: glyphRange.glyphIndex,
          glyphCharacter,
          glyphCodePoint: glyphRange.glyphCodePoint,
          sourceCharacter,
          sourceCodePoint: getRequiredCodePoint(sourceCharacter),
          sourceRowIndex,
          sourceGlyphIndex,
          offset
        });
        extendText3DBounds(boundsAccumulator, glyphRange.bounds, offset);
      }
      offsetX += font.getGlyphAdvance(sourceCharacter, size);
    }
  }

  return {
    instances,
    bounds: finishText3DBounds(boundsAccumulator),
    lineHeight: glyphAtlas.lineHeight,
    lineWidths,
    rowCount: textRows.length
  };
}

/** Returns renderable resolved font glyph characters in stable first-use order. */
function getUsedGlyphCharacters(text: string | readonly string[], font: Font): string[] {
  const glyphCharacters: string[] = [];
  const glyphCharacterSet = new Set<string>();

  for (const textRow of getTextRows(text)) {
    for (const sourceCharacter of Array.from(textRow)) {
      const glyphCharacter = font.resolveCharacter(sourceCharacter);
      if (!glyphCharacterSet.has(glyphCharacter)) {
        glyphCharacterSet.add(glyphCharacter);
        glyphCharacters.push(glyphCharacter);
      }
    }
  }

  return glyphCharacters;
}

/** Normalizes newline-delimited strings and explicit rows into row-oriented text. */
function getTextRows(text: string | readonly string[]): readonly string[] {
  return typeof text === 'string' ? text.split('\n') : text;
}

/** Appends one glyph's packed attributes into shared atlas arrays. */
function appendExtrudedAttributes(
  target: {positions: number[]; normals: number[]; uvs: number[]},
  glyphAttributes: ExtrudedAttributes
): void {
  target.positions.push(...glyphAttributes.positions);
  target.normals.push(...glyphAttributes.normals);
  target.uvs.push(...glyphAttributes.uvs);
}

/** Returns a required Unicode code point for one code-point string. */
function getRequiredCodePoint(character: string): number {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) {
    throw new Error('Text3D glyph characters must contain one Unicode code point');
  }
  return codePoint;
}

/** Returns finite bounds for one packed xyz position array. */
function getText3DBounds(positions: Float32Array): Text3DBounds {
  const boundsAccumulator = createText3DBoundsAccumulator();
  for (let positionIndex = 0; positionIndex < positions.length; positionIndex += 3) {
    extendText3DBoundsPoint(boundsAccumulator, [
      positions[positionIndex],
      positions[positionIndex + 1],
      positions[positionIndex + 2]
    ]);
  }
  return finishText3DBounds(boundsAccumulator);
}

/** Mutable bounds used while visiting glyph positions. */
type Text3DBoundsAccumulator = {
  min: Text3DVector3;
  max: Text3DVector3;
};

/** Creates an empty mutable bounds accumulator. */
function createText3DBoundsAccumulator(): Text3DBoundsAccumulator {
  return {
    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
  };
}

/** Extends mutable bounds with translated glyph-local bounds. */
function extendText3DBounds(
  boundsAccumulator: Text3DBoundsAccumulator,
  bounds: Text3DBounds,
  offset: Text3DVector3
): void {
  extendText3DBoundsPoint(boundsAccumulator, [
    bounds.min[0] + offset[0],
    bounds.min[1] + offset[1],
    bounds.min[2] + offset[2]
  ]);
  extendText3DBoundsPoint(boundsAccumulator, [
    bounds.max[0] + offset[0],
    bounds.max[1] + offset[1],
    bounds.max[2] + offset[2]
  ]);
}

/** Extends mutable bounds with one xyz point. */
function extendText3DBoundsPoint(
  boundsAccumulator: Text3DBoundsAccumulator,
  point: Text3DVector3
): void {
  for (let coordinateIndex = 0; coordinateIndex < 3; coordinateIndex++) {
    boundsAccumulator.min[coordinateIndex] = Math.min(
      boundsAccumulator.min[coordinateIndex],
      point[coordinateIndex]
    );
    boundsAccumulator.max[coordinateIndex] = Math.max(
      boundsAccumulator.max[coordinateIndex],
      point[coordinateIndex]
    );
  }
}

/** Converts mutable bounds into finite public bounds. */
function finishText3DBounds(boundsAccumulator: Text3DBoundsAccumulator): Text3DBounds {
  if (
    !boundsAccumulator.min.every(Number.isFinite) ||
    !boundsAccumulator.max.every(Number.isFinite)
  ) {
    return {min: [0, 0, 0], max: [0, 0, 0]};
  }
  return boundsAccumulator;
}
