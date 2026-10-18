// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Adapted from deck.gl-community glyph range utilities under the MIT License.

/**
 * The pixels of distance field around each glyph of a glyph range, on every side, beyond its
 * `width` and `height`: a bitmap is `width + 6` by `height + 6`.
 */
export const GLYPH_BORDER = 3;

/** The size, in pixels, at which glyph ranges are drawn: one em. */
export const GLYPH_EM = 24;

/** Code points per glyph range: a range file holds `256 * n` to `256 * n + 255`. */
export const GLYPH_RANGE_SIZE = 256;

/**
 * A glyph of a glyph range, as MapLibre GL JS reads it: a signed distance field and its metrics,
 * in pixels at {@link GLYPH_EM}.
 */
export type Glyph = {
  /** Unicode code point. */
  id: number;
  /**
   * One byte per pixel, `width + 2 * GLYPH_BORDER` by `height + 2 * GLYPH_BORDER`; empty for a
   * glyph without ink, such as a space.
   */
  bitmap: Uint8Array | Uint8ClampedArray;
  /** Width of the ink. */
  width: number;
  /** Height of the ink. */
  height: number;
  /** From the pen position to the left of the ink. */
  left: number;
  /** Vertical bearing of the top of the ink, as MapLibre GL JS reads it. */
  top: number;
  /** From the pen position to the next. */
  advance: number;
};

/** A reader of the protocol buffer encoding: just what glyph ranges use. */
class Reader {
  position = 0;
  constructor(readonly bytes: Uint8Array) {}

  readVarint(): number {
    let value = 0;
    let shift = 0;
    for (;;) {
      if (this.position >= this.bytes.length) {
        throw new Error('Truncated glyph range');
      }
      const byte = this.bytes[this.position++];
      // Glyph fields fit in 32 bits; multiplying keeps larger values exact, up to 2^53.
      value += (byte & 0x7f) * 2 ** shift;
      if (byte < 0x80) {
        return value;
      }
      shift += 7;
      if (shift > 49) {
        throw new Error('Invalid varint in glyph range');
      }
    }
  }

  readSVarint(): number {
    const value = this.readVarint();
    return value % 2 === 1 ? -(value + 1) / 2 : value / 2;
  }

  /** The bytes of a length-delimited field, which the reader then skips. */
  readBytes(): Uint8Array {
    const length = this.readVarint();
    const end = this.position + length;
    if (end > this.bytes.length) {
      throw new Error('Truncated glyph range');
    }
    const bytes = this.bytes.subarray(this.position, end);
    this.position = end;
    return bytes;
  }

  private skipBytes(length: number): void {
    this.position += length;
    if (this.position > this.bytes.length) throw new Error('Truncated glyph range');
  }

  skip(wireType: number): void {
    if (wireType === 0) {
      this.readVarint();
    } else if (wireType === 1) {
      this.skipBytes(8);
    } else if (wireType === 2) {
      this.readBytes();
    } else if (wireType === 5) {
      this.skipBytes(4);
    } else {
      throw new Error(`Unsupported wire type ${wireType} in glyph range`);
    }
  }

  /** Calls `read` with the tag and wire type of each field, which `read` must consume or skip. */
  readFields(read: (tag: number, wireType: number) => void): void {
    while (this.position < this.bytes.length) {
      const key = this.readVarint();
      read(Math.floor(key / 8), key % 8);
    }
  }
}

function readGlyph(bytes: Uint8Array): Glyph | null {
  const reader = new Reader(bytes);
  const glyph: Partial<Glyph> = {};
  reader.readFields((tag, wireType) => {
    if (tag === 1 && wireType === 0) glyph.id = reader.readVarint();
    else if (tag === 2 && wireType === 2) glyph.bitmap = reader.readBytes();
    else if (tag === 3 && wireType === 0) glyph.width = reader.readVarint();
    else if (tag === 4 && wireType === 0) glyph.height = reader.readVarint();
    else if (tag === 5 && wireType === 0) glyph.left = reader.readSVarint();
    else if (tag === 6 && wireType === 0) glyph.top = reader.readSVarint();
    else if (tag === 7 && wireType === 0) glyph.advance = reader.readVarint();
    else reader.skip(wireType);
  });
  const {id, width = 0, height = 0, left = 0, top = 0, advance = 0} = glyph;
  if (id === undefined) {
    return null;
  }
  const bitmap = glyph.bitmap || new Uint8Array(0);
  // A bitmap of any other size cannot be read as a distance field, as in MapLibre's `AlphaImage`.
  const size = width && height ? (width + 2 * GLYPH_BORDER) * (height + 2 * GLYPH_BORDER) : 0;
  if (bitmap.length !== size) {
    return null;
  }
  return {id, bitmap, width, height, left, top, advance};
}

/**
 * Reads a glyph range, the `{fontstack}/{range}.pbf` file a style's `glyphs` URL points to: the
 * glyphs of every font stack it holds. Glyphs whose bitmap does not match their size are skipped.
 */
export function parseGlyphRange(data: ArrayBuffer | Uint8Array): Glyph[] {
  const glyphs: Glyph[] = [];
  const reader = new Reader(data instanceof Uint8Array ? data : new Uint8Array(data));
  reader.readFields((tag, wireType) => {
    if (tag !== 1 || wireType !== 2) {
      reader.skip(wireType);
      return;
    }
    const fontstack = new Reader(reader.readBytes());
    fontstack.readFields((fontstackTag, fontstackWireType) => {
      if (fontstackTag === 3 && fontstackWireType === 2) {
        const glyph = readGlyph(fontstack.readBytes());
        if (glyph) {
          glyphs.push(glyph);
        }
      } else {
        fontstack.skip(fontstackWireType);
      }
    });
  });
  return glyphs;
}
