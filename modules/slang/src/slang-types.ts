// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SlangType} from './ast';
import type {ShaderType, ScalarKind} from './ir';

const SCALARS: Record<string, ScalarKind> = {float: 'f32', int: 'i32', uint: 'u32', bool: 'bool'};
/** Slang rows are represented as target columns by the existing compiler ABI. */
export function lowerSlangType(type: SlangType): ShaderType {
  if (type.name === 'void') return {kind: 'void'};
  if (type.name === 'array' && type.element)
    return {kind: 'array', element: lowerSlangType(type.element), length: type.length};
  const numeric = /^(float|int|uint|bool)([2-4])?(?:x([2-4]))?$/.exec(type.name);
  if (!numeric || (numeric[3] && (numeric[1] !== 'float' || !numeric[2])))
    return {kind: 'struct', name: type.name};
  const scalar = SCALARS[numeric[1]];
  if (numeric[3])
    return {kind: 'matrix', scalar: 'f32', columns: Number(numeric[2]), rows: Number(numeric[3])};
  if (numeric[2]) return {kind: 'vector', scalar, width: Number(numeric[2])};
  return {kind: 'scalar', scalar};
}
