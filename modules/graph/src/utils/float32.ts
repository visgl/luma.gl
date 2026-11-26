// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Storage shared by the float and bit views. */
const float = new Float32Array(1);
/** IEEE 754 encoding of the same scalar. */
const bits = new Uint32Array(float.buffer);

/** Step a finite binary32 value by one representable value in the requested direction. */
export function nextFloat32(value: number, increase: boolean): number {
  if (value === 0) return increase ? 2 ** -149 : -(2 ** -149);
  float[0] = value;
  bits[0] += value > 0 === increase ? 1 : -1;
  return float[0];
}
