// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUExpressionFormat, GPUExpressionOperation} from './gpu-expression-operation';

/** @internal */
export const GPU_EXPRESSION_SHADER_TYPES = {float32: 'f32', sint32: 'i32', uint32: 'u32'} as const;

/** Saturation is explicit so casts agree across GLSL and WGSL. @internal */
export function getGPUExpressionCastWGSL(
  value: string,
  source: GPUExpressionFormat,
  target: GPUExpressionFormat,
  integerRounding: GPUExpressionOperation['integerRounding']
): string {
  if (source === target) return value;
  const types = GPU_EXPRESSION_SHADER_TYPES;
  if (target === 'float32') return `${types.float32}(${value})`;
  if (source === 'float32') {
    const rounded = integerRounding === 'nearest' ? `expression_round_nearest(${value})` : value;
    return `expression_to_${target}(${rounded})`;
  }
  const clamped = target === 'uint32' ? `max(${value}, 0)` : `min(${value}, 2147483647u)`;
  return `${types[target]}(${clamped})`;
}

/** Only finite float inputs have a portable numeric conversion contract. @internal */
export const GPU_EXPRESSION_CAST_WGSL = `
fn expression_round_nearest(value: f32) -> f32 {
  let magnitude = abs(value);
  let integral = floor(magnitude);
  let rounded = integral + select(0.0, 1.0, magnitude - integral >= 0.5);
  return sign(value) * rounded;
}
fn expression_to_sint32(value: f32) -> i32 {
  if (value >= 2147483648.0) { return 2147483647i; }
  if (value <= -2147483648.0) { return -2147483647i - 1i; }
  return i32(value);
}
fn expression_to_uint32(value: f32) -> u32 {
  if (value >= 4294967296.0) { return 4294967295u; }
  if (value <= 0.0) { return 0u; }
  return u32(value);
}`;
