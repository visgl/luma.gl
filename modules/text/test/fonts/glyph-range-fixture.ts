// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

function encodeVarint(value: number): number[] {
  const bytes: number[] = [];
  while (value >= 128) {
    bytes.push((value % 128) + 128);
    value = Math.floor(value / 128);
  }
  return [...bytes, value];
}

function encodeField(tag: number, bytes: number[]): number[] {
  return [...encodeVarint(tag * 8 + 2), ...encodeVarint(bytes.length), ...bytes];
}

/** Synthetic glyph range with visible bitmaps and negative bearings; no third-party font data. */
export function makeGlyphRange(codePoints: number[]): Uint8Array {
  const glyphs = codePoints.flatMap(codePoint =>
    encodeField(3, [
      8,
      ...encodeVarint(codePoint),
      ...encodeField(2, Array(49).fill(255)),
      24,
      1,
      32,
      1,
      40,
      3,
      48,
      4,
      56,
      5
    ])
  );
  return new Uint8Array(encodeField(1, glyphs));
}

export function makeGlyphResponse(codePoints: number[]): Response {
  return new Response(makeGlyphRange(codePoints));
}
