// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderFunction, SlangType} from './ast';

export function getSlangTypeSignature(type: SlangType): string {
  return type.name === 'array'
    ? `${getSlangTypeSignature(type.element!)}[${type.length}]`
    : type.element
      ? `${type.name}<${getSlangTypeSignature(type.element)}>`
      : type.name;
}
export function getSlangParameterDirection(parameter: ShaderFunction['parameters'][number]) {
  return parameter.modifiers.includes('inout')
    ? 'inout'
    : parameter.modifiers.includes('out')
      ? 'out'
      : 'in';
}
