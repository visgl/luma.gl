// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveDataType} from '../shadertypes/data-types/data-types';
import type {CompositeShaderType} from '../shadertypes/data-types/shader-types';
import {alignTo} from '../shadertypes/data-types/decode-data-types';
import {getVariableShaderTypeInfo} from '../shadertypes/data-types/decode-shader-types';

import type {UniformValue} from '../adapter/types/uniforms';
import {getScratchArrayBuffer} from '../utils/array-utils-flat';
import {log} from '../utils/log';

export type UniformValues = Record<string, UniformValue | UniformValueStruct | UniformValueArray>;
type UniformValueStruct = Record<string, UniformValue | UniformValueStruct2 | UniformValueArray>;
type UniformValueStruct2 = Record<string, UniformValue | UniformValueStruct3 | UniformValueArray>;
type UniformValueStruct3 = Record<string, UniformValue | UniformValueArray>;
type UniformValueArray = (UniformValue | UniformValueStruct)[];

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
  readonly layout: Record<string, {offset: number; size: number; type: PrimitiveDataType}> = {};

  /** number of bytes needed for buffer allocation */
  readonly byteLength: number;

  /** Create a new UniformBufferLayout given a map of attributes. */
  constructor(
    uniformTypes: Readonly<Record<string, CompositeShaderType>>,
    uniformSizes: Readonly<Record<string, number>> = {}
  ) {
    let size = 0;

    for (const [key, uniformType] of Object.entries(uniformTypes)) {
      size = this._addToLayout(key, uniformType, size, uniformSizes?.[key]);
    }

    size += (4 - (size % 4)) % 4;
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

  /** Get the data for the complete buffer */
  getData(uniformValues: Readonly<UniformValues>): Uint8Array {
    const buffer = getScratchArrayBuffer(this.byteLength);
    const typedArrays = {
      i32: new Int32Array(buffer),
      u32: new Uint32Array(buffer),
      f32: new Float32Array(buffer),
      f16: new Uint16Array(buffer)
    };

    for (const [name, value] of Object.entries(uniformValues)) {
      this._writeCompositeValue(typedArrays, name, value);
    }

    return new Uint8Array(buffer, 0, this.byteLength);
  }

  // Recursively add a uniform to the layout
  private _addToLayout(
    name: string,
    type: CompositeShaderType,
    offset: number,
    count: number = 1
  ): number {
    if (typeof type === 'string') {
      // Primitive case
      const info = getVariableShaderTypeInfo(type);
      const sizeInSlots = info.components * count;
      const alignedOffset = alignTo(offset, info.components);
      this.layout[name] = {
        offset: alignedOffset,
        size: sizeInSlots,
        type: info.type
      };
      return alignedOffset + sizeInSlots;
    }

    if (Array.isArray(type)) {
      // Array of structs or primitives
      const elementType = type[0];
      // Use count if provided, otherwise default to 1
      const length = count > 1 ? count : type.length > 1 ? type[1] : 1;
      let arrayOffset = alignTo(offset, 4); // std140: arrays aligned to 16 bytes

      for (let i = 0; i < length; i++) {
        arrayOffset = this._addToLayout(`${name}[${i}]`, elementType, arrayOffset);
      }
      return arrayOffset;
    }

    if (typeof type === 'object') {
      // Struct case
      let structOffset = alignTo(offset, 4); // std140: structs aligned to 16 bytes
      for (const [memberName, memberType] of Object.entries(type)) {
        structOffset = this._addToLayout(`${name}.${memberName}`, memberType, structOffset);
      }
      return structOffset;
    }

    throw new Error(`Unsupported CompositeShaderType for ${name}`);
  }

  private _writeCompositeValue(
    typedArrays: Record<string, any>,
    baseName: string,
    value: any
  ): void {
    if (this.layout[baseName]) {
      // Primitive or flat vector/matrix
      this._writeToBuffer(typedArrays, baseName, value);
      return;
    }

    if (Array.isArray(value)) {
      // Array of values: write each index
      for (let i = 0; i < value.length; i++) {
        const element = value[i];
        const indexedName = `${baseName}[${i}]`;
        this._writeCompositeValue(typedArrays, indexedName, element);
      }
      return;
    }

    if (typeof value === 'object' && value !== null) {
      // Struct: write each member
      for (const [key, subValue] of Object.entries(value)) {
        const nestedName = `${baseName}.${key}`;
        this._writeCompositeValue(typedArrays, nestedName, subValue);
      }
      return;
    }

    log.warn(`Unsupported uniform value for ${baseName}:`, value)();
  }

  private _writeToBuffer(
    typedArrays: Record<string, any>,
    name: string,
    value: UniformValue
  ): void {
    const layout = this.layout[name];
    if (!layout) {
      log.warn(`Uniform ${name} not found in layout`)();
      return;
    }

    const {type, size, offset} = layout;
    const array = typedArrays[type];

    if (size === 1) {
      array[offset] = Number(value);
    } else {
      array.set(value as number[], offset);
    }
  }
}
