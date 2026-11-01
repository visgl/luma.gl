// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Align offset to 1, 2 or 4 elements (4, 8 or 16 bytes) */
export function alignTo(size: number, count: number): number {
  // biome-ignore format: preserve layout
  switch (count) {
    case 1: return size; // Pad upwards to even multiple of 2
    case 2: return size + (size % 2); // Pad upwards to even multiple of 2
    default: return size + ((4 - (size % 4)) % 4); // Pad upwards to even multiple of 4
  }
}
