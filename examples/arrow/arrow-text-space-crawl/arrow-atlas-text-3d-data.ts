// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {
  getCharacterLayoutOffset,
  getTextKerningOffset,
  type CharacterMapping,
  type FontAtlas,
  type TextGlyphLayout,
  type TextKerning
} from '@luma.gl/text';
import type {Text3DBounds} from '@luma.gl/text/text-3d';
import * as arrow from 'apache-arrow';

/** Arrow columns retained for one atlas-backed crawl source table. */
export type ArrowAtlasText3DTextColumns = {
  positions: arrow.FixedSizeList<arrow.Float32>;
  texts: arrow.Utf8;
  clipRects: arrow.FixedSizeList<arrow.Int16>;
  colors: arrow.FixedSizeList<arrow.Uint8>;
};

/** Arrow UTF-8 rows plus label attributes used by one atlas-backed crawl. */
export type ArrowAtlasText3DTextTable = arrow.Table<ArrowAtlasText3DTextColumns>;

const DISABLED_CLIP_RECT = [0, 0, -1, -1] as const;
const OPAQUE_WHITE = [255, 255, 255, 255] as const;

/** Wraps crawl rows in Arrow UTF-8 plus style columns required by the shared text shader layout. */
export function makeArrowAtlasText3DTextTable(
  textRows: readonly string[],
  fontAtlas: FontAtlas
): ArrowAtlasText3DTextTable {
  const rowCount = textRows.length;
  const positions = new Float32Array(rowCount * 2);
  const clipRects = new Int16Array(rowCount * DISABLED_CLIP_RECT.length);
  const colors = new Uint8Array(rowCount * OPAQUE_WHITE.length);

  for (const [rowIndex, textRow] of textRows.entries()) {
    const rowMetrics = getTextRowMetrics(textRow, fontAtlas.mapping, fontAtlas.kerning);
    positions[rowIndex * 2] = rowMetrics.centerOffsetX;
    positions[rowIndex * 2 + 1] = rowIndex * fontAtlas.lineHeight;
    clipRects.set(DISABLED_CLIP_RECT, rowIndex * DISABLED_CLIP_RECT.length);
    colors.set(OPAQUE_WHITE, rowIndex * OPAQUE_WHITE.length);
  }

  return new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    texts: arrow.vectorFromArray([...textRows], new arrow.Utf8()) as arrow.Vector<arrow.Utf8>,
    clipRects: makeArrowFixedSizeListVector(new arrow.Int16(), 4, clipRects),
    colors: makeArrowFixedSizeListVector(new arrow.Uint8(), 4, colors)
  });
}

/** Computes crawl-space bounds from the prepared per-glyph layout. */
export function getArrowAtlasText3DBounds(
  textTable: ArrowAtlasText3DTextTable,
  glyphLayout: TextGlyphLayout,
  glyphWorldScale: number
): Text3DBounds {
  const positions = getRequiredArrowTextColumn(textTable, 'positions');
  const bounds = {
    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 0],
    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, 0]
  } satisfies Text3DBounds;

  for (let rowIndex = 0; rowIndex < textTable.numRows; rowIndex++) {
    const position = positions.get(rowIndex);
    if (!position) {
      continue;
    }
    const positionX = position.get(0) ?? 0;
    const positionY = position.get(1) ?? 0;
    const glyphStart = glyphLayout.startIndices[rowIndex] ?? 0;
    const glyphEnd = glyphLayout.startIndices[rowIndex + 1] ?? glyphStart;

    for (let glyphIndex = glyphStart; glyphIndex < glyphEnd; glyphIndex++) {
      const glyphOffsetIndex = glyphIndex * 2;
      const glyphFrameIndex = glyphIndex * 4;
      const glyphOffsetX = glyphLayout.glyphOffsets[glyphOffsetIndex] ?? 0;
      const glyphOffsetY = glyphLayout.glyphOffsets[glyphOffsetIndex + 1] ?? 0;
      const glyphWidth = glyphLayout.glyphFrames[glyphFrameIndex + 2] ?? 0;
      const glyphHeight = glyphLayout.glyphFrames[glyphFrameIndex + 3] ?? 0;
      extendText3DBounds(bounds, [
        (positionX + glyphOffsetX) * glyphWorldScale,
        -(positionY + glyphOffsetY + glyphHeight) * glyphWorldScale,
        0
      ]);
      extendText3DBounds(bounds, [
        (positionX + glyphOffsetX + glyphWidth) * glyphWorldScale,
        -(positionY + glyphOffsetY) * glyphWorldScale,
        0
      ]);
    }
  }

  return bounds.min.every(Number.isFinite) && bounds.max.every(Number.isFinite)
    ? bounds
    : {min: [0, 0, 0], max: [0, 0, 0]};
}

/** Returns a required typed column from the crawl's Arrow table. */
export function getRequiredArrowTextColumn<KeyT extends keyof ArrowAtlasText3DTextColumns>(
  textTable: ArrowAtlasText3DTextTable,
  columnName: KeyT
): arrow.Vector<ArrowAtlasText3DTextColumns[KeyT]> {
  const column = textTable.getChild(columnName);
  if (!column) {
    throw new Error(`Atlas text crawl requires "${columnName}"`);
  }
  return column as arrow.Vector<ArrowAtlasText3DTextColumns[KeyT]>;
}

function getTextRowMetrics(
  textRow: string,
  mapping: CharacterMapping,
  kerning: TextKerning | undefined
): {centerOffsetX: number} {
  let penX = 0;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let previousCodePoint: number | undefined;

  for (const character of Array.from(textRow)) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) {
      continue;
    }
    const frame = mapping[character];
    penX += getTextKerningOffset(kerning, previousCodePoint, codePoint);
    if (frame) {
      const [layoutOffsetX] = getCharacterLayoutOffset(frame);
      minX = Math.min(minX, penX + layoutOffsetX);
      maxX = Math.max(maxX, penX + layoutOffsetX + frame.width);
      penX += frame.advance;
    }
    previousCodePoint = codePoint;
  }

  return {
    centerOffsetX: Number.isFinite(minX) && Number.isFinite(maxX) ? -(minX + maxX) / 2 : 0
  };
}

function extendText3DBounds(bounds: Text3DBounds, point: [number, number, number]): void {
  for (let coordinateIndex = 0; coordinateIndex < point.length; coordinateIndex++) {
    bounds.min[coordinateIndex] = Math.min(bounds.min[coordinateIndex], point[coordinateIndex]);
    bounds.max[coordinateIndex] = Math.max(bounds.max[coordinateIndex], point[coordinateIndex]);
  }
}
