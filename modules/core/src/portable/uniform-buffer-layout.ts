// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveDataType} from '../shadertypes/data-types/data-types';
import type {
  CompositeShaderType,
  VariableShaderType
} from '../shadertypes/shader-types/shader-types';
import {alignTo} from '../shadertypes/data-types/decode-data-types';
import {
  getVariableShaderTypeInfo,
  resolveVariableShaderTypeAlias
} from '../shadertypes/shader-types/shader-type-decoder';

import type {CompositeUniformValue, UniformValue} from '../adapter/types/uniforms';
import {getScratchArrayBuffer} from '../utils/array-utils-flat';
import {isNumberArray} from '../utils/is-array';
import {log} from '../utils/log';

type UniformLayoutEntry = {
  offset: number;
  size: number;
  components: number;
  columns: number;
  rows: number;
  shaderType: VariableShaderType;
  type: PrimitiveDataType;
};

export type UniformValues = Record<string, CompositeUniformValue>;

/**
 * Smallest buffer size that can be used for uniform buffers.
 * TODO - does this depend on device?
 */
const minBufferSize: number = 1024;

/**
 * Std140 layout for uniform buffers
 * Supports manual listing of uniforms
 */
export class UniformBufferLayout {
  readonly layout: Record<string, UniformLayoutEntry> = {};
  readonly uniformTypes: Record<string, CompositeShaderType>;

  /** number of bytes needed for buffer allocation */
  readonly byteLength: number;

  /** Create a new UniformBufferLayout given a map of attributes. */
  constructor(
    uniformTypes: Readonly<Record<string, CompositeShaderType>>,
    uniformSizes: Readonly<Record<string, number>> = {}
  ) {
    this.uniformTypes = normalizeUniformTypes(uniformTypes, uniformSizes);

    let size = 0;

    for (const [key, uniformType] of Object.entries(this.uniformTypes)) {
      size = this._addToLayout(key, uniformType, size);
    }

    size = alignTo(size, 4);
    this.byteLength = Math.max(size * 4, minBufferSize);
  }

  /** Does this layout have a field with specified name */
  has(name: string) {
    return Boolean(this.layout[name]);
  }

  /** Get offset and size for a field with specified name */
  get(name: string): {offset: number; size: number} | undefined {
    const layout = this.layout[name];
    return layout;
  }

  /** Flatten nested uniform values into leaf-path values understood by UniformBlock. */
  getFlatUniformValues(uniformValues: Readonly<UniformValues>): Record<string, UniformValue> {
    const flattenedUniformValues: Record<string, UniformValue> = {};

    for (const [name, value] of Object.entries(uniformValues)) {
      const uniformType = this.uniformTypes[name];
      if (uniformType) {
        this._flattenCompositeValue(flattenedUniformValues, name, uniformType, value);
      } else if (this.layout[name]) {
        flattenedUniformValues[name] = value as UniformValue;
      }
    }

    return flattenedUniformValues;
  }

  /** Get the data for the complete buffer */
  getData(uniformValues: Readonly<UniformValues>): Uint8Array {
    const buffer = getScratchArrayBuffer(this.byteLength);
    new Uint8Array(buffer, 0, this.byteLength).fill(0);
    const typedArrays = {
      i32: new Int32Array(buffer),
      u32: new Uint32Array(buffer),
      f32: new Float32Array(buffer),
      f16: new Uint16Array(buffer)
    };

    const flattenedUniformValues = this.getFlatUniformValues(uniformValues);
    for (const [name, value] of Object.entries(flattenedUniformValues)) {
      this._writeLeafValue(typedArrays, name, value);
    }

    return new Uint8Array(buffer, 0, this.byteLength);
  }

  // Recursively add a uniform to the layout
  private _addToLayout(name: string, type: CompositeShaderType, offset: number): number {
    if (typeof type === 'string') {
      const info = getLeafLayoutInfo(type);
      const alignedOffset = alignTo(offset, info.alignment);
      this.layout[name] = {
        offset: alignedOffset,
        ...info
      };
      return alignedOffset + info.size;
    }

    if (Array.isArray(type)) {
      if (Array.isArray(type[0])) {
        throw new Error(`Nested arrays are not supported for ${name}`);
      }

      const elementType = type[0] as CompositeShaderType;
      const length = type[1] as number;
      const stride = alignTo(getTypeSize(elementType), 4);
      const arrayOffset = alignTo(offset, 4);

      for (let i = 0; i < length; i++) {
        this._addToLayout(`${name}[${i}]`, elementType, arrayOffset + i * stride);
      }
      return arrayOffset + stride * length;
    }

    if (isCompositeShaderTypeStruct(type)) {
      let structOffset = alignTo(offset, 4);
      for (const [memberName, memberType] of Object.entries(type)) {
        structOffset = this._addToLayout(`${name}.${memberName}`, memberType, structOffset);
      }
      return alignTo(structOffset, 4);
    }

    throw new Error(`Unsupported CompositeShaderType for ${name}`);
  }

  private _flattenCompositeValue(
    flattenedUniformValues: Record<string, UniformValue>,
    baseName: string,
    uniformType: CompositeShaderType,
    value: CompositeUniformValue | undefined
  ): void {
    if (value === undefined) {
      return;
    }

    if (typeof uniformType === 'string' || this.layout[baseName]) {
      flattenedUniformValues[baseName] = value as UniformValue;
      return;
    }

    if (Array.isArray(uniformType)) {
      const elementType = uniformType[0] as CompositeShaderType;
      const length = uniformType[1] as number;

      if (Array.isArray(elementType)) {
        throw new Error(`Nested arrays are not supported for ${baseName}`);
      }

      if (typeof elementType === 'string' && isNumberArray(value)) {
        this._flattenPackedArray(flattenedUniformValues, baseName, elementType, length, value);
        return;
      }

      if (!Array.isArray(value)) {
        log.warn(`Unsupported uniform array value for ${baseName}:`, value)();
        return;
      }

      for (let index = 0; index < Math.min(value.length, length); index++) {
        const elementValue = value[index];
        if (elementValue === undefined) {
          continue;
        }

        this._flattenCompositeValue(
          flattenedUniformValues,
          `${baseName}[${index}]`,
          elementType,
          elementValue
        );
      }
      return;
    }

    if (isCompositeShaderTypeStruct(uniformType) && isCompositeUniformObject(value)) {
      for (const [key, subValue] of Object.entries(value)) {
        if (subValue === undefined) {
          continue;
        }

        const nestedName = `${baseName}.${key}`;
        this._flattenCompositeValue(flattenedUniformValues, nestedName, uniformType[key], subValue);
      }
      return;
    }

    log.warn(`Unsupported uniform value for ${baseName}:`, value)();
  }

  private _flattenPackedArray(
    flattenedUniformValues: Record<string, UniformValue>,
    baseName: string,
    elementType: VariableShaderType,
    length: number,
    value: UniformValue
  ): void {
    const numericValue = value as Readonly<ArrayLike<number>>;
    const elementLayout = getLeafLayoutInfo(elementType);
    const packedElementLength = elementLayout.components;

    for (let index = 0; index < length; index++) {
      const start = index * packedElementLength;
      if (start >= numericValue.length) {
        break;
      }

      if (packedElementLength === 1) {
        flattenedUniformValues[`${baseName}[${index}]`] = Number(numericValue[start]);
      } else {
        flattenedUniformValues[`${baseName}[${index}]`] = sliceNumericArray(
          value,
          start,
          start + packedElementLength
        ) as UniformValue;
      }
    }
  }

  private _writeLeafValue(
    typedArrays: Record<string, any>,
    name: string,
    value: UniformValue
  ): void {
    const layout = this.layout[name];
    if (!layout) {
      log.warn(`Uniform ${name} not found in layout`)();
      return;
    }

    const {type, components, columns, rows, offset} = layout;
    const array = typedArrays[type];

    if (components === 1) {
      array[offset] = Number(value);
      return;
    }

    const sourceValue = value as Readonly<ArrayLike<number>>;

    if (columns === 1) {
      for (let componentIndex = 0; componentIndex < components; componentIndex++) {
        array[offset + componentIndex] = Number(sourceValue[componentIndex] ?? 0);
      }
      return;
    }

    let sourceIndex = 0;
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      const columnOffset = offset + columnIndex * 4;
      for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        array[columnOffset + rowIndex] = Number(sourceValue[sourceIndex++] ?? 0);
      }
    }
  }
}

function normalizeUniformTypes(
  uniformTypes: Readonly<Record<string, CompositeShaderType>>,
  uniformSizes: Readonly<Record<string, number>>
): Record<string, CompositeShaderType> {
  const normalizedUniformTypes: Record<string, CompositeShaderType> = {};

  for (const [name, uniformType] of Object.entries(uniformTypes)) {
    const uniformSize = uniformSizes[name];

    if (uniformSize === undefined) {
      normalizedUniformTypes[name] = uniformType;
      continue;
    }

    if (Array.isArray(uniformType)) {
      if (uniformType[1] !== uniformSize) {
        throw new Error(
          `uniformSizes.${name} (${uniformSize}) does not match uniformTypes.${name} (${uniformType[1]})`
        );
      }
      normalizedUniformTypes[name] = uniformType;
      continue;
    }

    if (typeof uniformType === 'string') {
      normalizedUniformTypes[name] = [uniformType, uniformSize];
      continue;
    }

    throw new Error(`uniformSizes is only supported for top-level primitive arrays: ${name}`);
  }

  for (const name of Object.keys(uniformSizes)) {
    if (!(name in normalizedUniformTypes)) {
      throw new Error(`uniformSizes.${name} does not have a matching uniformTypes entry`);
    }
  }

  return normalizedUniformTypes;
}

function getTypeSize(type: CompositeShaderType): number {
  if (typeof type === 'string') {
    return getLeafLayoutInfo(type).size;
  }

  if (Array.isArray(type)) {
    const elementType = type[0] as CompositeShaderType;
    const length = type[1] as number;

    if (Array.isArray(elementType)) {
      throw new Error('Nested arrays are not supported');
    }

    return alignTo(getTypeSize(elementType), 4) * length;
  }

  let size = 0;
  for (const memberType of Object.values(type)) {
    const compositeMemberType = memberType as CompositeShaderType;
    size = alignTo(size, getTypeAlignment(compositeMemberType));
    size += getTypeSize(compositeMemberType);
  }

  return alignTo(size, 4);
}

function getTypeAlignment(type: CompositeShaderType): 1 | 2 | 4 {
  if (typeof type === 'string') {
    return getLeafLayoutInfo(type).alignment;
  }

  if (Array.isArray(type)) {
    return 4;
  }

  return 4;
}

function getLeafLayoutInfo(
  type: VariableShaderType
): Omit<UniformLayoutEntry, 'offset'> & {alignment: 1 | 2 | 4} {
  const resolvedType = resolveVariableShaderTypeAlias(type);
  const decodedType = getVariableShaderTypeInfo(resolvedType);
  const matrixMatch = /^mat(\d)x(\d)<.+>$/.exec(resolvedType);

  if (matrixMatch) {
    const columns = Number(matrixMatch[1]);
    const rows = Number(matrixMatch[2]);

    return {
      alignment: 4,
      size: columns * 4,
      components: columns * rows,
      columns,
      rows,
      shaderType: resolvedType,
      type: decodedType.type
    };
  }

  const vectorMatch = /^vec(\d)<.+>$/.exec(resolvedType);
  if (vectorMatch) {
    const components = Number(vectorMatch[1]) as 2 | 3 | 4;
    return {
      alignment: components === 2 ? 2 : 4,
      size: components === 3 ? 4 : components,
      components,
      columns: 1,
      rows: components,
      shaderType: resolvedType,
      type: decodedType.type
    };
  }

  return {
    alignment: 1,
    size: 1,
    components: 1,
    columns: 1,
    rows: 1,
    shaderType: resolvedType,
    type: decodedType.type
  };
}

function isCompositeShaderTypeStruct(
  value: CompositeShaderType
): value is Record<string, CompositeShaderType> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isCompositeUniformObject(
  value: CompositeUniformValue
): value is Record<string, CompositeUniformValue | undefined> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !ArrayBuffer.isView(value)
  );
}

function sliceNumericArray(value: UniformValue, start: number, end: number): number[] {
  return Array.prototype.slice.call(value, start, end) as number[];
}
