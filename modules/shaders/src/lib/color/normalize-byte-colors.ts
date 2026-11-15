// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray3, NumberArray4} from '@math.gl/core';

type FloatColor = Float16Array | Float32Array | Float64Array;
type ByteColor = Uint8Array | Uint8ClampedArray;
type ColorInput = Readonly<NumberArray3> | Readonly<NumberArray4> | ByteColor | FloatColor;

/**
 * Resolves the numeric range of untyped JavaScript color arrays.
 * Typed color arrays carry their own encoding and ignore this flag in the normalization helpers.
 * @param useByteColors - Explicit convention for JavaScript arrays.
 * @param defaultUseByteColors - Convention to use when the flag is omitted; defaults to bytes.
 * @returns Whether JavaScript array components should be divided by 255.
 */
export function resolveUseByteColors(
  useByteColors?: boolean,
  defaultUseByteColors: boolean = true
): boolean {
  return useByteColors ?? defaultUseByteColors;
}

/**
 * Converts an RGB color to normalized numeric components without modifying the input.
 *
 * JavaScript arrays use the legacy 0–255 convention unless `useByteColors` is false.
 * `Uint8Array` and `Uint8ClampedArray` always contain bytes. Native `Float16Array`,
 * `Float32Array`, and `Float64Array` always contain normalized values, regardless of the flag.
 * This function changes numeric range only: it does not clamp values, convert color spaces,
 * premultiply alpha, or decode half-float bit patterns stored in a `Uint16Array`.
 *
 * A floating-point typed array of exactly three components is returned by reference, without
 * allocation. Treat that result as borrowed: mutations are visible through the original array.
 * Other inputs produce a new three-component JavaScript array; extra components are ignored.
 * Float16 pass-through describes CPU values, not compatibility with every GPU upload API.
 *
 * @param color - At least three components; omitted input defaults to black.
 * @param useByteColors - Range of JavaScript arrays only; defaults to byte colors.
 * @returns Normalized RGB components, borrowing an exactly sized floating-point input.
 */
export function normalizeByteColor3(
  color?: Readonly<NumberArray3> | ByteColor,
  useByteColors?: boolean
): NumberArray3;
export function normalizeByteColor3<T extends FloatColor>(
  color: T,
  useByteColors?: boolean
): T | NumberArray3;
export function normalizeByteColor3(
  color: ColorInput,
  useByteColors?: boolean
): NumberArray3 | FloatColor;
export function normalizeByteColor3(
  color: ColorInput = [0, 0, 0],
  useByteColors: boolean = true
): NumberArray3 | FloatColor {
  if (isFloatColor(color) && color.length === 3) {
    return color;
  }
  const divisor = usesByteColors(color, useByteColors) ? 255 : 1;
  return [color[0] / divisor, color[1] / divisor, color[2] / divisor];
}

/**
 * Converts an RGB or RGBA color to normalized RGBA components without modifying the input.
 *
 * JavaScript arrays use `useByteColors` (bytes by default). Byte typed arrays always use
 * 0–255 components; native Float16/Float32/Float64 arrays always use normalized components.
 * Missing or non-finite alpha means opaque: 255 in byte space or 1 in normalized space,
 * resulting in an output alpha of 1. Explicit zero alpha remains transparent.
 * Components are not clamped, gamma-corrected, or premultiplied.
 *
 * A floating-point typed array of exactly four components with finite alpha is returned
 * unchanged, without allocation. The result aliases the caller's storage; do not mutate it
 * unless that is intended. RGB inputs, byte inputs, untyped inputs, extra-long inputs, and
 * inputs needing alpha repair produce a new four-component JavaScript array. No intermediate
 * slices or mapped arrays are allocated. Native Float16 values are supported, but raw half-float
 * bits in Uint16Array are not; GPU upload compatibility is the caller's responsibility.
 *
 * @param color - At least RGB components, optionally followed by alpha.
 * @param useByteColors - Range of JavaScript arrays only; ignored for typed inputs.
 * @returns Normalized RGBA with opaque fallback alpha, borrowing eligible float inputs.
 */
export function normalizeByteColor4(
  color: Readonly<NumberArray3> | Readonly<NumberArray4> | ByteColor,
  useByteColors?: boolean
): NumberArray4;
export function normalizeByteColor4<T extends FloatColor>(
  color: T,
  useByteColors?: boolean
): T | NumberArray4;
export function normalizeByteColor4(
  color: ColorInput,
  useByteColors?: boolean
): NumberArray4 | FloatColor;
export function normalizeByteColor4(
  color: ColorInput,
  useByteColors: boolean = true
): NumberArray4 | FloatColor {
  const hasAlpha = Number.isFinite(color[3]);
  if (isFloatColor(color) && color.length === 4 && hasAlpha) {
    return color;
  }
  const divisor = usesByteColors(color, useByteColors) ? 255 : 1;
  return [
    color[0] / divisor,
    color[1] / divisor,
    color[2] / divisor,
    hasAlpha ? color[3]! / divisor : 1
  ];
}

function usesByteColors(color: ColorInput, useByteColors: boolean): boolean {
  // BYTES_PER_ELEMENT is realm-independent; all supported one-byte inputs are byte colors.
  return Array.isArray(color)
    ? useByteColors
    : 'BYTES_PER_ELEMENT' in color && color.BYTES_PER_ELEMENT === 1;
}

function isFloatColor(color: ColorInput): color is FloatColor {
  const tag = Object.prototype.toString.call(color);
  return (
    ArrayBuffer.isView(color) &&
    (tag === '[object Float16Array]' ||
      tag === '[object Float32Array]' ||
      tag === '[object Float64Array]')
  );
}
