// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveDataType} from '../shadertypes/data-types/data-types';
import type {
  CompositeShaderType,
  VariableShaderType,
  StructShaderType,
  ArrayShaderType
} from '../shadertypes/data-types/shader-types';
import {alignTo} from '../shadertypes/data-types/decode-data-types';
import {getVariableShaderTypeInfo} from '../shadertypes/data-types/decode-shader-types';

import type {UniformValue} from '../adapter/types/uniforms';
import {getScratchArrayBuffer} from '../utils/array-utils-flat';
import {isNumberArray} from '../utils/is-array';
import {log} from '../utils/log';

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

  /** Original uniform type definitions */
  private readonly uniformTypes: Record<string, CompositeShaderType>;

  /** Create a new UniformBufferLayout given a map of attributes. */
  constructor(
    uniformTypes: Record<string, CompositeShaderType>,
    uniformSizes: Record<string, number> = {}
  ) {
    this.uniformTypes = uniformTypes;

    /** number of 4 byte slots taken */
    let size: number = 0;

    const processType = (name: string, uniformType: CompositeShaderType) => {
      if (typeof uniformType === 'string') {
        const {type, components} = getVariableShaderTypeInfo(
          uniformType as VariableShaderType
        );
        const count = components * (uniformSizes?.[name] ?? 1);
        size = alignTo(size, count);
        const offset = size;
        size += count;
        this.layout[name] = {type, size: count, offset};
      } else if ((uniformType as StructShaderType).members) {
        const struct = uniformType as StructShaderType;
        for (const [memberName, memberType] of Object.entries(struct.members)) {
          processType(`${name}.${memberName}`, memberType);
        }
        size = alignTo(size, 4);
      } else if ((uniformType as ArrayShaderType).type) {
        const arrayType = uniformType as ArrayShaderType;
        for (let i = 0; i < arrayType.length; i++) {
          processType(`${name}[${i}]`, arrayType.type);
          size = alignTo(size, 4);
        }
      }
    };

    for (const [key, uniformType] of Object.entries(uniformTypes)) {
      processType(key, uniformType);
    }

    size += (4 - (size % 4)) % 4;

    const actualByteLength = size * 4;
    this.byteLength = Math.max(actualByteLength, minBufferSize);
  }

  /** Get the data for the complete buffer */
  getData(uniformValues: Record<string, UniformValue>): Uint8Array {
    const arrayBuffer = getScratchArrayBuffer(this.byteLength);
    const typedArrays = {
      i32: new Int32Array(arrayBuffer),
      u32: new Uint32Array(arrayBuffer),
      f32: new Float32Array(arrayBuffer),
      // TODO not implemented
      f16: new Uint16Array(arrayBuffer)
    };

    const write = (name: string, value: any, type: CompositeShaderType) => {
      if (typeof type === 'string') {
        const uniformLayout = this.layout[name];
        if (!uniformLayout) {
          log.warn(`Supplied uniform value ${name} not present in uniform block layout`)();
          return;
        }
        const {type: primitiveType, size, offset} = uniformLayout;
        const typedArray = typedArrays[primitiveType];
        if (size === 1) {
          if (typeof value !== 'number' && typeof value !== 'boolean') {
            log.warn(
              `Supplied value for single component uniform ${name} is not a number: ${value}`
            )();
            return;
          }
          typedArray[offset] = Number(value);
        } else {
          if (!isNumberArray(value)) {
            log.warn(
              `Supplied value for multi component / array uniform ${name} is not a numeric array: ${value}`
            )();
            return;
          }
          typedArray.set(value, offset);
        }
      } else if ((type as StructShaderType).members) {
        const struct = type as StructShaderType;
        for (const [memberName, memberType] of Object.entries(struct.members)) {
          write(`${name}.${memberName}`, value?.[memberName], memberType);
        }
      } else if ((type as ArrayShaderType).type) {
        const arrayType = type as ArrayShaderType;
        for (let i = 0; i < arrayType.length; i++) {
          write(`${name}[${i}]`, value?.[i], arrayType.type);
        }
      }
    };

    for (const [name, type] of Object.entries(this.uniformTypes)) {
      const value = (uniformValues as any)[name];
      if (value === undefined) {
        continue;
      }
      write(name, value, type);
    }

    return new Uint8Array(arrayBuffer, 0, this.byteLength);
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
}
