// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderUniformType, ShaderDataType} from '../gpu-type-utils/shader-types';
import {decodeShaderUniformType, alignTo} from '../gpu-type-utils/decode-shader-types';

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
  readonly layout: Record<string, {offset: number; size: number; type: ShaderDataType}> = {};

  /** number of bytes needed for buffer allocation */
  readonly byteLength: number;

  /** Create a new UniformBufferLayout given a map of attributes. */
  constructor(uniformTypes: Record<string, ShaderUniformType>) {
    /** number of 4 byte slots taken */
    let size: number = 0;

    // Add layout (type, size and offset) definitions for each uniform in the layout
    for (const [key, uniformType] of Object.entries(uniformTypes)) {
      const typeAndComponents = decodeShaderUniformType(uniformType);
      const {type, components: count} = typeAndComponents;
      // First, align (bump) current offset to an even multiple of current object (1, 2, 4)
      size = alignTo(size, count);
      // Use the aligned size as the offset of the current uniform.
      const offset = size;
      // Then, add our object's padded size ((1, 2, multiple of 4) to the current offset
      size += count;
      this.layout[key] = {type, size: count, offset};
    }
    size += (4 - (size % 4)) % 4;

    const actualByteLength = size * 4;
    this.byteLength = Math.max(actualByteLength, minBufferSize);
  }

  /** Get the data for the complete buffer */
  getData(uniformValues: Record<string, UniformValue>): Uint8Array {
    const bufferSize = Math.max(this.byteLength, minBufferSize);

    // Allocate three typed arrays pointing at same memory
    const arrayBuffer = getScratchArrayBuffer(bufferSize);
    const typedArrays = {
      i32: new Int32Array(arrayBuffer),
      u32: new Uint32Array(arrayBuffer),
      f32: new Float32Array(arrayBuffer),
      // TODO not implemented
      f16: new Uint16Array(arrayBuffer)
    };
    // TODO is this needed?
    // typedArrays.i32.fill(0);

    for (const [name, value] of Object.entries(uniformValues)) {
      const uniformLayout = this.layout[name];
      if (!uniformLayout) {
        log.warn(`Supplied uniform value ${name} not present in uniform block layout`)();
        // eslint-disable-next-line no-continue
        continue;
      }

      const {type, size, offset} = uniformLayout;
      const typedArray = typedArrays[type];
      if (size === 1) {
        if (typeof value !== 'number' && typeof value !== 'boolean') {
          log.warn(
            `Supplied value for single component uniform ${name} is not a number: ${value}`
          )();
          // eslint-disable-next-line no-continue
          continue;
        }
        // single value -> just set it
        typedArray[offset] = Number(value);
      } else {
        if (!isNumberArray(value)) {
          log.warn(
            `Supplied value for multi component / array uniform ${name} is not a numeric array: ${value}`
          )();
          // eslint-disable-next-line no-continue
          continue;
        }
        // vector/matrix -> copy the supplied (typed) array, starting from offset
        // TODO: we should limit or check size in case the supplied data overflows
        typedArray.set(value, offset);
      }
    }

    return new Uint8Array(arrayBuffer);
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
