// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderType} from './ir';

/** Emit a resolved numeric value type, independent of the source language. */
export function emitNumericType(type: ShaderType, target: 'wgsl' | 'glsl'): string | undefined {
  if (type.kind === 'scalar')
    return target === 'wgsl'
      ? type.scalar
      : {f32: 'float', i32: 'int', u32: 'uint', bool: 'bool'}[type.scalar];
  if (type.kind === 'vector')
    return target === 'wgsl'
      ? `vec${type.width}<${type.scalar}>`
      : `${{f32: '', i32: 'i', u32: 'u', bool: 'b'}[type.scalar]}vec${type.width}`;
  if (type.kind === 'matrix')
    return `mat${type.columns}x${type.rows}${target === 'wgsl' ? '<f32>' : ''}`;
  return undefined;
}
