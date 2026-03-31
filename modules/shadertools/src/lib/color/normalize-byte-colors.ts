// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray3, NumberArray4} from '@math.gl/types';

/**
 * Resolves whether semantic colors should be interpreted as byte-style `0..255` values.
 * @param useByteColors - Explicit color interpretation flag.
 * @param defaultUseByteColors - Fallback value when `useByteColors` is omitted.
 * @returns `true` when semantic colors should be normalized from bytes, otherwise `false`.
 */
export function resolveUseByteColors(
  useByteColors?: boolean,
  defaultUseByteColors: boolean = true
): boolean {
  return useByteColors ?? defaultUseByteColors;
}

/**
 * Normalizes an RGB semantic color to float space when byte-style colors are enabled.
 * @param color - Input RGB semantic color.
 * @param useByteColors - When `true`, divide components by `255`.
 * @returns The normalized RGB color.
 */
export function normalizeByteColor3(
  color: Readonly<NumberArray3> = [0, 0, 0],
  useByteColors: boolean = true
): NumberArray3 {
  if (!useByteColors) {
    return [...color] as NumberArray3;
  }

  return color.map(component => component / 255) as NumberArray3;
}

/**
 * Normalizes an RGBA semantic color to float space when byte-style colors are enabled.
 * @param color - Input RGB or RGBA semantic color.
 * @param useByteColors - When `true`, divide components by `255`.
 * @returns The normalized RGBA color, adding an opaque alpha channel when needed.
 */
export function normalizeByteColor4(
  color: Readonly<NumberArray4> | Readonly<NumberArray3>,
  useByteColors: boolean = true
): NumberArray4 {
  const normalizedColor = normalizeByteColor3(color.slice(0, 3) as NumberArray3, useByteColors);
  const alpha = Number.isFinite(color[3]) ? (color[3] as number) : 1;

  return [
    normalizedColor[0],
    normalizedColor[1],
    normalizedColor[2],
    useByteColors ? alpha / 255 : alpha
  ] as NumberArray4;
}
