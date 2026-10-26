// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SlangType, SourceLocation, Structure} from './ast';
import {SlangTranspileError} from './diagnostics';
import type {SlangTypeLayout, SlangUniformValue} from './types';

const roundUp = (value: number, alignment: number): number =>
  Math.ceil(value / alignment) * alignment;

/** Describe the actual target buffer representation, including the row-as-column matrix layout. */
export function getSlangTypeLayout(
  type: SlangType,
  structures: Map<string, Structure>,
  addressSpace: 'uniform' | 'storage',
  location: SourceLocation,
  sourceName: string,
  ancestors = new Set<string>()
): SlangTypeLayout {
  const base = {type: type.name, offset: 0};
  if (/^(float|int|uint|bool)$/.test(type.name)) {
    if (addressSpace === 'storage' && type.name === 'bool') {
      throw new SlangTranspileError('Storage bools are not host-shareable', location, sourceName);
    }
    return {...base, size: 4, alignment: 4};
  }
  const vector = /^(float|int|uint|bool)([2-4])$/.exec(type.name);
  if (vector) {
    if (addressSpace === 'storage' && vector[1] === 'bool') {
      throw new SlangTranspileError('Storage bools are not host-shareable', location, sourceName);
    }
    const width = Number(vector[2]);
    return {...base, size: width * 4, alignment: width === 2 ? 8 : 16};
  }
  const matrix = /^float([2-4])x([2-4])$/.exec(type.name);
  if (matrix) {
    const rows = Number(matrix[1]);
    const columns = Number(matrix[2]);
    const alignment = addressSpace === 'uniform' || columns > 2 ? 16 : 8;
    const matrixStride = roundUp(columns * 4, alignment);
    return {...base, size: rows * matrixStride, alignment, matrixStride, rows, columns};
  }
  if (type.name === 'array' && type.element) {
    const element = getSlangTypeLayout(
      type.element,
      structures,
      addressSpace,
      location,
      sourceName,
      ancestors
    );
    const alignment =
      addressSpace === 'uniform' ? roundUp(element.alignment, 16) : element.alignment;
    const arrayStride = roundUp(element.size, alignment);
    return {
      ...base,
      size: arrayStride * type.length!,
      alignment,
      arrayStride,
      length: type.length,
      element
    };
  }
  const structure = structures.get(type.name);
  if (!structure || ancestors.has(type.name)) {
    throw new SlangTranspileError(`Cannot lay out ${type.name}`, location, sourceName);
  }
  const visited = new Set(ancestors).add(type.name);
  let offset = 0;
  let alignment = addressSpace === 'uniform' ? 16 : 1;
  const members = structure.fields.map(field => {
    const layout = getSlangTypeLayout(
      field.type,
      structures,
      addressSpace,
      field.location,
      sourceName,
      visited
    );
    alignment = Math.max(alignment, layout.alignment);
    offset = roundUp(offset, layout.alignment);
    const member = {...layout, name: field.name, offset};
    offset += layout.size;
    return member;
  });
  return {...base, size: roundUp(offset, alignment), alignment, members};
}

/** Pack values using reflected offsets. Matrices are supplied in Slang row order. */
export function packSlangUniforms(layout: SlangTypeLayout, values: SlangUniformValue): Uint8Array {
  const bytes = new Uint8Array(layout.size);
  const view = new DataView(bytes.buffer);
  function writeValue(current: SlangTypeLayout, value: SlangUniformValue, offset: number): void {
    if (current.members) {
      for (const member of current.members) {
        const field = (value as Record<string, SlangUniformValue>)[member.name!];
        if (field === undefined) throw new Error(`Missing uniform field ${member.name}`);
        writeValue(member, field, offset + member.offset);
      }
      return;
    }
    if (current.element) {
      const array = value as ArrayLike<SlangUniformValue>;
      if (array.length !== current.length)
        throw new Error('Uniform array length does not match reflection');
      for (let index = 0; index < current.length!; index++) {
        writeValue(current.element, array[index], offset + index * current.arrayStride!);
      }
      return;
    }
    if (current.matrixStride) {
      const matrix = value as ArrayLike<number>;
      if (matrix.length !== current.rows! * current.columns!)
        throw new Error('Uniform matrix requires row-ordered scalar values');
      for (let row = 0; row < current.rows!; row++) {
        for (let column = 0; column < current.columns!; column++) {
          view.setFloat32(
            offset + row * current.matrixStride + column * 4,
            matrix[row * current.columns! + column],
            true
          );
        }
      }
      return;
    }
    const vector = /^(float|int|uint|bool)([2-4])$/.exec(current.type);
    const scalar = vector?.[1] ?? current.type;
    const width = vector ? Number(vector[2]) : 1;
    if (vector && (value as ArrayLike<number>).length !== width)
      throw new Error('Uniform vector width does not match reflection');
    for (let component = 0; component < width; component++) {
      const element = vector ? (value as ArrayLike<number | boolean>)[component] : value;
      if (typeof element !== 'number' && typeof element !== 'boolean')
        throw new Error('Uniform scalars must be numbers or booleans');
      const number = Number(element);
      if (scalar === 'float') view.setFloat32(offset + component * 4, number, true);
      else if (scalar === 'int') view.setInt32(offset + component * 4, number, true);
      else
        view.setUint32(
          offset + component * 4,
          scalar === 'bool' ? Number(Boolean(element)) : number,
          true
        );
    }
  }
  writeValue(layout, values, 0);
  return bytes;
}
