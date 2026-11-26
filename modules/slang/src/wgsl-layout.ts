// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SlangType, Structure, SourceLocation} from './ast';
import {getSlangTypeLayout} from './layout';
import {SlangTranspileError} from './diagnostics';

type Layout = {
  size: number;
  alignment: number;
  stride?: number;
  element?: Layout;
  members?: {offset: number; layout: Layout}[];
};
const roundUp = (value: number, alignment: number) => Math.ceil(value / alignment) * alignment;

/** Compare physical bytes; source uniform buffers are never implicitly repacked. */
export function checkWGSLUniformLayout(
  type: SlangType,
  structures: Map<string, Structure>,
  location: SourceLocation,
  sourceName: string
): void {
  function natural(type: SlangType): Layout {
    if (['float', 'int', 'uint'].includes(type.name)) return {size: 4, alignment: 4};
    const vector = /^(float|int|uint)([2-4])$/.exec(type.name);
    if (vector) return {size: Number(vector[2]) * 4, alignment: vector[2] === '2' ? 8 : 16};
    const matrix = /^float([2-4])x([2-4])$/.exec(type.name);
    if (matrix) {
      const column = natural({name: `float${matrix[2]}`});
      const stride = roundUp(column.size, column.alignment);
      return {size: Number(matrix[1]) * stride, alignment: column.alignment, stride};
    }
    if (type.name === 'array' && type.element) {
      const element = natural(type.element);
      const stride = roundUp(element.size, element.alignment);
      return {size: stride * type.length!, alignment: element.alignment, stride, element};
    }
    const structure = structures.get(type.name);
    if (!structure)
      throw new SlangTranspileError('Uniform values must be host-shareable', location, sourceName);
    let size = 0;
    let alignment = 1;
    const members = structure.fields.map(field => {
      const layout = natural(field.type);
      size = roundUp(size, layout.alignment);
      const offset = size;
      size += layout.size;
      alignment = Math.max(alignment, layout.alignment);
      return {offset, layout};
    });
    return {size: roundUp(size, alignment), alignment, members};
  }
  const source = natural(type);
  const target = getSlangTypeLayout(type, structures, 'uniform', location, sourceName);
  function compatible(source: Layout, target: ReturnType<typeof getSlangTypeLayout>): boolean {
    return (
      (!source.element || Boolean(target.element && compatible(source.element, target.element))) &&
      source.size === target.size &&
      (source.stride === undefined ||
        source.stride === (target.arrayStride ?? target.matrixStride)) &&
      (!source.members ||
        source.members.every(
          (member, index) =>
            member.offset === target.members![index].offset &&
            compatible(member.layout, target.members![index])
        ))
    );
  }
  if (!compatible(source, target))
    throw new SlangTranspileError(
      'WGSL uniform layout is incompatible with GLSL std140; use explicitly compatible fields',
      location,
      sourceName
    );
}
