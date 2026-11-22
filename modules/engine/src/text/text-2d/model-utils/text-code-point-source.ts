// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TextCodePointSource} from './text-layout';

/**
 * Creates a code-point source from one-line text rows. An optional caller-supplied
 * processor converts each row to display order once, before glyph layout.
 * Without it, the input rows must already be in display order.
 */
export function createTextCodePointSource(
  rows: readonly string[],
  toDisplayOrder?: (text: string, rowIndex: number) => string
): TextCodePointSource {
  const codePointRows = rows.map((row, rowIndex) =>
    Uint32Array.from(
      toDisplayOrder ? toDisplayOrder(row, rowIndex) : row,
      character =>
        // String iteration yields a nonempty string for each code point.
        character.codePointAt(0)!
    )
  );

  return {
    rowCount: codePointRows.length,
    countCodePoints: rowIndex => codePointRows[rowIndex].length,
    visitCodePoints: (rowIndex, visitCodePoint) => {
      for (const codePoint of codePointRows[rowIndex]) {
        visitCodePoint(codePoint);
      }
    }
  };
}
