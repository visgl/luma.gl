// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Forked from THREE.js under MIT license
// Fast Half Float Conversions, http://www.fox-toolkit.org/ftp/fasthalffloatconversion.pdf

import {clamp} from '@math.gl/core';

/** Pre-calculated tables for float16 conversion */
type Float16Tables = {
  // float32 to float16 helpers
  baseTable: Uint32Array;
  shiftTable: Uint32Array;
  // float16 to float32 helpers
  mantissaTable: Uint32Array;
  exponentTable: Uint32Array;
  offsetTable: Uint32Array;
};

/**  */
let float16Tables: Float16Tables | null = null;

/** Storage that can be viewed both as float and integer */
const buffer = new ArrayBuffer(4);
const floatView = new Float32Array(buffer);
const uint32View = new Uint32Array(buffer);

/**
 * float32 to float16
 * @param val
 * @returns
 */
export function toHalfFloat(val: number): number {
  float16Tables ||= generateFloat16Tables();

  // if ( Math.abs( val ) > 65504 ) console.warn( 'toHalfFloat(): Value out of range.' );

  val = clamp(val, -65504, 65504);

  floatView[0] = val;
  const f = uint32View[0];
  const e = (f >> 23) & 0x1ff;
  return float16Tables.baseTable[e] + ((f & 0x007fffff) >> float16Tables.shiftTable[e]);
}

/**
 * float16 to float32
 * @param val
 * @returns
 */
export function fromHalfFloat(val: number): number {
  float16Tables ||= generateFloat16Tables();

  const m = val >> 10;
  uint32View[0] =
    float16Tables.mantissaTable[float16Tables.offsetTable[m] + (val & 0x3ff)] +
    float16Tables.exponentTable[m];
  return floatView[0];
}

function generateFloat16Tables(): Float16Tables {
  // float32 to float16 helpers

  const baseTable = new Uint32Array(512);
  const shiftTable = new Uint32Array(512);

  for (let i = 0; i < 256; ++i) {
    const e = i - 127;

    // very small number (0, -0)

    if (e < -27) {
      baseTable[i] = 0x0000;
      baseTable[i | 0x100] = 0x8000;
      shiftTable[i] = 24;
      shiftTable[i | 0x100] = 24;

      // small number (denorm)
    } else if (e < -14) {
      baseTable[i] = 0x0400 >> (-e - 14);
      baseTable[i | 0x100] = (0x0400 >> (-e - 14)) | 0x8000;
      shiftTable[i] = -e - 1;
      shiftTable[i | 0x100] = -e - 1;

      // normal number
    } else if (e <= 15) {
      baseTable[i] = (e + 15) << 10;
      baseTable[i | 0x100] = ((e + 15) << 10) | 0x8000;
      shiftTable[i] = 13;
      shiftTable[i | 0x100] = 13;

      // large number (Infinity, -Infinity)
    } else if (e < 128) {
      baseTable[i] = 0x7c00;
      baseTable[i | 0x100] = 0xfc00;
      shiftTable[i] = 24;
      shiftTable[i | 0x100] = 24;

      // stay (NaN, Infinity, -Infinity)
    } else {
      baseTable[i] = 0x7c00;
      baseTable[i | 0x100] = 0xfc00;
      shiftTable[i] = 13;
      shiftTable[i | 0x100] = 13;
    }
  }

  // float16 to float32 helpers

  const mantissaTable = new Uint32Array(2048);
  const exponentTable = new Uint32Array(64);
  const offsetTable = new Uint32Array(64);

  for (let i = 1; i < 1024; ++i) {
    let m = i << 13; // zero pad mantissa bits
    let e = 0; // zero exponent

    // normalized
    while ((m & 0x00800000) === 0) {
      m <<= 1;
      e -= 0x00800000; // decrement exponent
    }

    m &= ~0x00800000; // clear leading 1 bit
    e += 0x38800000; // adjust bias

    mantissaTable[i] = m | e;
  }

  for (let i = 1024; i < 2048; ++i) {
    mantissaTable[i] = 0x38000000 + ((i - 1024) << 13);
  }

  for (let i = 1; i < 31; ++i) {
    exponentTable[i] = i << 23;
  }

  exponentTable[31] = 0x47800000;
  exponentTable[32] = 0x80000000;

  for (let i = 33; i < 63; ++i) {
    exponentTable[i] = 0x80000000 + ((i - 32) << 23);
  }

  exponentTable[63] = 0xc7800000;

  for (let i = 1; i < 64; ++i) {
    if (i !== 32) {
      offsetTable[i] = 1024;
    }
  }

  return {baseTable, shiftTable, mantissaTable, exponentTable, offsetTable};
}
