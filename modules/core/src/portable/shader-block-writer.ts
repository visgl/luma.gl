// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CompositeUniformValue, UniformValue} from '../adapter/types/uniforms';
import {getScratchArrayBuffer} from '../utils/array-utils-flat';
import {isNumberArray} from '../utils/is-array';
import {log} from '../utils/log';
import type {
  CompositeShaderType,
  VariableShaderType
} from '../shadertypes/shader-types/shader-types';
import {
  getLeafLayoutInfo,
  isCompositeShaderTypeStruct,
  type ShaderBlockLayout
} from '../shadertypes/shader-types/shader-block-layout';

/**
 * Serializes nested JavaScript uniform values according to a {@link ShaderBlockLayout}.
 */
export class ShaderBlockWriter {
  /** Layout metadata used to flatten and serialize values. */
  readonly layout: ShaderBlockLayout;
  /** Names of array elements by parent name, so that flattening does not build them again. */
  private readonly _elementNames = new Map<string, string[]>();
  /** Names of struct fields by parent name, so that flattening does not build them again. */
  private readonly _fieldNames = new Map<string, Record<string, string>>();

  /**
   * Creates a writer for a precomputed shader-block layout.
   */
  constructor(layout: ShaderBlockLayout) {
    this.layout = layout;
  }

  /**
   * Returns `true` if the flattened layout contains the given field.
   */
  has(name: string): boolean {
    return Boolean(this.layout.fields[name]);
  }

  /**
   * Returns offset and size metadata for a flattened field.
   */
  get(name: string): {offset: number; size: number} | undefined {
    const entry = this.layout.fields[name];
    return entry ? {offset: entry.offset, size: entry.size} : undefined;
  }

  /**
   * Flattens nested composite values into leaf-path values understood by {@link UniformBlock}.
   *
   * Top-level values may be supplied either in nested object form matching the
   * declared composite shader types or as already-flattened leaf-path values.
   */
  getFlatUniformValues(
    uniformValues: Readonly<Record<string, CompositeUniformValue>>
  ): Record<string, UniformValue> {
    const flattenedUniformValues: Record<string, UniformValue> = {};

    for (const name in uniformValues) {
      const value = uniformValues[name];
      const uniformType = this.layout.uniformTypes[name];
      if (uniformType) {
        this._flattenCompositeValue(flattenedUniformValues, name, uniformType, value);
      } else if (this.layout.fields[name]) {
        flattenedUniformValues[name] = value as UniformValue;
      }
    }

    return flattenedUniformValues;
  }

  /**
   * Serializes the supplied values into buffer-backed binary data.
   *
   * The returned view length matches {@link ShaderBlockLayout.byteLength}, which
   * is the exact packed size of the block.
   */
  getData(uniformValues: Readonly<Record<string, CompositeUniformValue>>): Uint8Array {
    return this.getFlatData(this.getFlatUniformValues(uniformValues));
  }

  /**
   * Serializes values that are already flattened by {@link getFlatUniformValues}, such as the
   * values held by a {@link UniformBlock}.
   *
   * The returned view length matches {@link ShaderBlockLayout.byteLength}.
   */
  getFlatData(flattenedUniformValues: Readonly<Record<string, UniformValue>>): Uint8Array {
    const buffer = getScratchArrayBuffer(this.layout.byteLength);
    const typedArrays = getScratchTypedArrays(buffer);
    typedArrays.u8.fill(0, 0, this.layout.byteLength);

    for (const name in flattenedUniformValues) {
      this._writeLeafValue(typedArrays, name, flattenedUniformValues[name]);
    }

    return new Uint8Array(buffer, 0, this.layout.byteLength);
  }

  /**
   * Recursively flattens nested values using the declared composite shader type.
   */
  private _flattenCompositeValue(
    flattenedUniformValues: Record<string, UniformValue>,
    baseName: string,
    uniformType: CompositeShaderType,
    value: CompositeUniformValue | undefined
  ): void {
    if (value === undefined) {
      return;
    }

    if (typeof uniformType === 'string' || this.layout.fields[baseName]) {
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
          this._getElementName(baseName, index),
          elementType,
          elementValue
        );
      }
      return;
    }

    if (isCompositeShaderTypeStruct(uniformType) && isCompositeUniformObject(value)) {
      for (const key in value) {
        const subValue = value[key];
        if (subValue === undefined) {
          continue;
        }

        const nestedName = this._getFieldName(baseName, key);
        this._flattenCompositeValue(flattenedUniformValues, nestedName, uniformType[key], subValue);
      }
      return;
    }

    log.warn(`Unsupported uniform value for ${baseName}:`, value)();
  }

  /**
   * Expands tightly packed numeric arrays into per-element leaf fields.
   */
  private _flattenPackedArray(
    flattenedUniformValues: Record<string, UniformValue>,
    baseName: string,
    elementType: VariableShaderType,
    length: number,
    value: UniformValue
  ): void {
    const numericValue = value as Readonly<ArrayLike<number>>;
    const elementLayout = getLeafLayoutInfo(elementType, this.layout.layout);
    const packedElementLength = elementLayout.components;

    for (let index = 0; index < length; index++) {
      const start = index * packedElementLength;
      if (start >= numericValue.length) {
        break;
      }

      const elementName = this._getElementName(baseName, index);
      if (packedElementLength === 1) {
        flattenedUniformValues[elementName] = Number(numericValue[start]);
      } else {
        flattenedUniformValues[elementName] = sliceNumericArray(
          value,
          start,
          start + packedElementLength
        ) as UniformValue;
      }
    }
  }

  /** Returns `${baseName}[${index}]`, built once per name. */
  private _getElementName(baseName: string, index: number): string {
    let names = this._elementNames.get(baseName);
    if (!names) {
      names = [];
      this._elementNames.set(baseName, names);
    }
    let name = names[index];
    if (!name) {
      name = `${baseName}[${index}]`;
      names[index] = name;
    }
    return name;
  }

  /** Returns `${baseName}.${key}`, built once per name. */
  private _getFieldName(baseName: string, key: string): string {
    let names = this._fieldNames.get(baseName);
    if (!names) {
      names = {};
      this._fieldNames.set(baseName, names);
    }
    let name = names[key];
    if (!name) {
      name = `${baseName}.${key}`;
      names[key] = name;
    }
    return name;
  }

  /**
   * Writes one flattened leaf value into its typed-array view.
   */
  private _writeLeafValue(
    typedArrays: Record<string, any>,
    name: string,
    value: UniformValue
  ): void {
    const entry = this.layout.fields[name];
    if (!entry) {
      log.warn(`Uniform ${name} not found in layout`)();
      return;
    }

    const {type, components, columns, rows, offset, columnStride} = entry;
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
      const columnOffset = offset + columnIndex * columnStride;
      for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        array[columnOffset + rowIndex] = Number(sourceValue[sourceIndex++] ?? 0);
      }
    }
  }
}

type ScratchTypedArrays = {
  u8: Uint8Array;
  i32: Int32Array;
  u32: Uint32Array;
  f32: Float32Array;
  f16: Uint16Array;
};

let scratchTypedArrays: ScratchTypedArrays | null = null;

/** Returns typed-array views of the scratch buffer, created again only when the buffer changes. */
function getScratchTypedArrays(buffer: ArrayBuffer): ScratchTypedArrays {
  if (scratchTypedArrays?.u8.buffer !== buffer) {
    scratchTypedArrays = {
      u8: new Uint8Array(buffer),
      i32: new Int32Array(buffer),
      u32: new Uint32Array(buffer),
      f32: new Float32Array(buffer),
      f16: new Uint16Array(buffer)
    };
  }
  return scratchTypedArrays;
}

/**
 * Type guard for nested uniform objects.
 */
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

/**
 * Slices a numeric array-like value without changing its numeric representation.
 */
function sliceNumericArray(value: UniformValue, start: number, end: number): number[] {
  return Array.prototype.slice.call(value, start, end) as number[];
}
