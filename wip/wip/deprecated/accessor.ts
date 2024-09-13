// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, log} from '@luma.gl/core';
import {GL, GLDataType, GLPixelType} from '@luma.gl/constants';
import {TypedArrayConstructor} from '@math.gl/types';

/**
 * Attribute descriptor object
 * @deprecated Use ShaderLayout
 */
export interface AccessorObject {
  buffer?: Buffer;
  // format: VertexFormat;
  offset?: number;
  // can now be described with single WebGPU-style `format` string

  //
  stride?: number;

  /** @deprecated - Use accessor.stepMode */
  divisor?: number;

  /** @deprecated - Infer from format */
  type?: number;
  /** @deprecated - Infer from format */
  size?: number;
  /** @deprecated - Infer from format */
  normalized?: boolean;
  /** @deprecated - Infer from format */
  integer?: boolean;

  /** @deprecated */
  index?: number;
}

const DEFAULT_ACCESSOR_VALUES = {
  offset: 0,
  stride: 0,
  type: GL.FLOAT,
  size: 1,
  divisor: 0,
  normalized: false,
  integer: false
};

export class Accessor implements AccessorObject {
  offset?: number;
  stride?: number;
  type?: number;
  size?: number;
  divisor?: number;
  normalized?: boolean;
  integer?: boolean;

  buffer?: Buffer;
  index?: number;

  static getBytesPerElement(accessor: Accessor | AccessorObject): number {
    // TODO: using `FLOAT` when type is not specified,
    // ensure this assumption is valid or force API to specify type.
    const ArrayType = getTypedArrayFromGLType(accessor.type || GL.FLOAT);
    return ArrayType.BYTES_PER_ELEMENT;
  }

  static getBytesPerVertex(accessor: AccessorObject): number {
    // assert(accessor.size);
    // TODO: using `FLOAT` when type is not specified,
    // ensure this assumption is valid or force API to specify type.
    const ArrayType = getTypedArrayFromGLType(accessor.type || GL.FLOAT);
    return ArrayType.BYTES_PER_ELEMENT * accessor.size;
  }

  // Combines (merges) a list of accessors. On top of default values
  // Usually [programAccessor, bufferAccessor, appAccessor]
  // All props will be set in the returned object.
  // TODO check for conflicts between values in the supplied accessors
  static resolve(...accessors: AccessorObject[]): Accessor {
    return new Accessor(...[DEFAULT_ACCESSOR_VALUES, ...accessors]); // Default values
  }

  constructor(...accessors: AccessorObject[]) {
    log.warn('Accessor will be removed in next minor release');
    accessors.forEach(accessor => this._assign(accessor)); // Merge in sequence
    Object.freeze(this);
  }

  toString(): string {
    return JSON.stringify(this);
  }

  // ACCESSORS

  // TODO - remove>
  get BYTES_PER_ELEMENT(): number {
    return Accessor.getBytesPerElement(this);
  }

  get BYTES_PER_VERTEX(): number {
    return Accessor.getBytesPerVertex(this);
  }

  // PRIVATE

  // eslint-disable-next-line complexity, max-statements
  _assign(props: AccessorObject = {}): this {
    if (props.type !== undefined) {
      this.type = props.type;

      // Auto-deduce integer type?
      if ((props.type as GL) === GL.INT || (props.type as GL) === GL.UNSIGNED_INT) {
        this.integer = true;
      }
    }
    if (props.size !== undefined) {
      this.size = props.size;
    }
    if (props.offset !== undefined) {
      this.offset = props.offset;
    }
    if (props.stride !== undefined) {
      this.stride = props.stride;
    }
    // @ts-expect-error
    if (props.normalize !== undefined) {
      // @ts-expect-error
      this.normalized = props.normalize;
    }
    if (props.normalized !== undefined) {
      this.normalized = props.normalized;
    }
    if (props.integer !== undefined) {
      this.integer = props.integer;
    }

    // INSTANCE DIVISOR
    if (props.divisor !== undefined) {
      this.divisor = props.divisor;
    }

    // Buffer is optional
    if (props.buffer !== undefined) {
      this.buffer = props.buffer;
    }

    // The binding index (for binding e.g. Transform feedbacks and Uniform buffers)
    // TODO - should this be part of accessor?
    if (props.index !== undefined) {
      if (typeof props.index === 'boolean') {
        this.index = props.index ? 1 : 0;
      } else {
        this.index = props.index;
      }
    }

    // DEPRECATED
    // @ts-expect-error
    if (props.instanced !== undefined) {
      // @ts-expect-error
      this.divisor = props.instanced ? 1 : 0;
    }
    // @ts-expect-error
    if (props.isInstanced !== undefined) {
      // @ts-expect-error
      this.divisor = props.isInstanced ? 1 : 0;
    }

    if (this.offset === undefined) delete this.offset;
    if (this.stride === undefined) delete this.stride;
    if (this.type === undefined) delete this.type;
    if (this.size === undefined) delete this.size;
    if (this.divisor === undefined) delete this.divisor;
    if (this.normalized === undefined) delete this.normalized;
    if (this.integer === undefined) delete this.integer;

    if (this.buffer === undefined) delete this.buffer;
    if (this.index === undefined) delete this.index;

    return this;
  }
}

/**
 * Converts GL constant to corresponding TYPED ARRAY
 * Used to auto deduce gl parameter types
 * @deprecated Use getTypedArrayFromDataType
 * @param glType
 * @param param1
 * @returns
 */
// eslint-disable-next-line complexity
function getTypedArrayFromGLType(
  glType: GLDataType | GLPixelType,
  options?: {
    clamped?: boolean;
  }
): TypedArrayConstructor {
  const {clamped = true} = options || {};
  // Sorted in some order of likelihood to reduce amount of comparisons
  switch (glType) {
    case GL.FLOAT:
      return Float32Array;
    case GL.UNSIGNED_SHORT:
    case GL.UNSIGNED_SHORT_5_6_5:
    case GL.UNSIGNED_SHORT_4_4_4_4:
    case GL.UNSIGNED_SHORT_5_5_5_1:
      return Uint16Array;
    case GL.UNSIGNED_INT:
      return Uint32Array;
    case GL.UNSIGNED_BYTE:
      return clamped ? Uint8ClampedArray : Uint8Array;
    case GL.BYTE:
      return Int8Array;
    case GL.SHORT:
      return Int16Array;
    case GL.INT:
      return Int32Array;
    default:
      throw new Error('Failed to deduce typed array type from GL constant');
  }
}

// TEST EXPORTS
export {DEFAULT_ACCESSOR_VALUES};
