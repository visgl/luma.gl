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
export function makeGlyphRange(
  codePoints: number[],
  {
    width = 1,
    height = 1,
    bitmap = Array((width + 6) * (height + 6)).fill(255)
  }: {
    width?: number;
    height?: number;
    bitmap?: number[];
  } = {}
): Uint8Array {
  const glyphs = codePoints.flatMap(codePoint =>
    encodeField(3, [
      8,
      ...encodeVarint(codePoint),
      ...encodeField(2, bitmap),
      24,
      width,
      32,
      height,
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
