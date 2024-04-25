// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, NumericArray} from '@math.gl/types';
import type {Device, Buffer, VertexArrayProps} from '@luma.gl/core';
import {VertexArray, getScratchArray} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {getBrowser} from '@probe.gl/env';

import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from '../resources/webgl-buffer';

import {getGLFromVertexType} from '../converters/vertex-formats';
import {fillArray} from '../../utils/fill-array';

/** VertexArrayObject wrapper */
export class WEBGLVertexArray extends VertexArray {
  override get [Symbol.toStringTag](): string {
    return 'VertexArray';
  }

  readonly device: WebGLDevice;
  readonly handle: WebGLVertexArrayObject;

  /** Attribute 0 buffer constant */
  private buffer: WEBGLBuffer | null = null;
  private bufferValue = null;

  /** * Attribute 0 can not be disable on most desktop OpenGL based browsers */
  static isConstantAttributeZeroSupported(device: Device): boolean {
    return getBrowser() === 'Chrome';
  }

  // Create a VertexArray
  constructor(device: WebGLDevice, props: VertexArrayProps) {
    super(device, props);
    this.device = device;
    this.handle = this.device.gl.createVertexArray()!;
  }

  override destroy(): void {
    super.destroy();
    if (this.buffer) {
      this.buffer?.destroy();
    }
    if (this.handle) {
      this.device.gl.deleteVertexArray(this.handle);
      // @ts-expect-error read-only/undefined
      this.handle = undefined!;
    }

    // Auto-delete elements?
    // return [this.elements];
  }

  /**
  // Set (bind/unbind) an elements buffer, for indexed rendering.
  // Must be a Buffer bound to GL.ELEMENT_ARRAY_BUFFER or null. Constants not supported
   *
   * @param elementBuffer
   */
  setIndexBuffer(indexBuffer: Buffer | null): void {
    const buffer = indexBuffer as WEBGLBuffer;
    // Explicitly allow `null` to support clearing the index buffer
    if (buffer && buffer.glTarget !== GL.ELEMENT_ARRAY_BUFFER) {
      throw new Error('Use .setBuffer()');
    }
    // In WebGL The GL.ELEMENT_ARRAY_BUFFER_BINDING is stored on the VertexArrayObject
    this.device.gl.bindVertexArray(this.handle);
    this.device.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, buffer ? buffer.handle : null);

    this.indexBuffer = buffer;

    // Unbind to prevent unintended changes to the VAO.
    this.device.gl.bindVertexArray(null);
  }

  /** Set a location in vertex attributes array to a buffer, enables the location, sets divisor */
  setBuffer(location: number, attributeBuffer: Buffer): void {
    const buffer = attributeBuffer as WEBGLBuffer;
    // Sanity check target
    if (buffer.glTarget === GL.ELEMENT_ARRAY_BUFFER) {
      throw new Error('Use .setIndexBuffer()');
    }

    const {size, type, stride, offset, normalized, integer, divisor} = this._getAccessor(location);

    this.device.gl.bindVertexArray(this.handle);
    // A non-zero buffer object must be bound to the GL_ARRAY_BUFFER target
    this.device.gl.bindBuffer(GL.ARRAY_BUFFER, buffer.handle);

    // WebGL2 supports *integer* data formats, i.e. GPU will see integer values
    if (integer) {
      this.device.gl.vertexAttribIPointer(location, size, type, stride, offset);
    } else {
      // Attaches ARRAY_BUFFER with specified buffer format to location
      this.device.gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    }
    // Clear binding - keeping it may cause [.WebGL-0x12804417100]
    // GL_INVALID_OPERATION: A transform feedback buffer that would be written to is also bound to a non-transform-feedback target
    this.device.gl.bindBuffer(GL.ARRAY_BUFFER, null);

    // Mark as non-constant
    this.device.gl.enableVertexAttribArray(location);
    // Set the step mode 0=vertex, 1=instance
    this.device.gl.vertexAttribDivisor(location, divisor || 0);

    this.attributes[location] = buffer;

    // Unbind to prevent unintended changes to the VAO.
    this.device.gl.bindVertexArray(null);
  }

  /** Set a location in vertex attributes array to a constant value, disables the location */
  override setConstantWebGL(location: number, value: TypedArray): void {
    this._enable(location, false);
    this.attributes[location] = value;
  }

  override bindBeforeRender(): void {
    this.device.gl.bindVertexArray(this.handle);
    this._applyConstantAttributes();
  }

  override unbindAfterRender(): void {
    // Unbind to prevent unintended changes to the VAO.
    this.device.gl.bindVertexArray(null);
  }

  // Internal methods

  /**
   * Constant attributes need to be reset before every draw call
   * Any attribute that is disabled in the current vertex array object
   * is read from the context's global constant value for that attribute location.
   * @note Constant attributes are only supported in WebGL, not in WebGPU
   */
  protected _applyConstantAttributes(): void {
    for (let location = 0; location < this.maxVertexAttributes; ++location) {
      const constant = this.attributes[location];
      // A typed array means this is a constant
      if (ArrayBuffer.isView(constant)) {
        this.device.setConstantAttributeWebGL(location, constant);
      }
    }
  }

  /**
   * Set a location in vertex attributes array to a buffer, enables the location, sets divisor
   * @note requires vertex array to be bound
   */
  // protected _setAttributeLayout(location: number): void {
  //   const {size, type, stride, offset, normalized, integer, divisor} = this._getAccessor(location);

  //   // WebGL2 supports *integer* data formats, i.e. GPU will see integer values
  //   if (integer) {
  //     this.device.gl.vertexAttribIPointer(location, size, type, stride, offset);
  //   } else {
  //     // Attaches ARRAY_BUFFER with specified buffer format to location
  //     this.device.gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
  //   }
  //   this.device.gl.vertexAttribDivisor(location, divisor || 0);
  // }

  /** Get an accessor from the  */
  protected _getAccessor(location: number) {
    const attributeInfo = this.attributeInfos[location];
    if (!attributeInfo) {
      throw new Error(`Unknown attribute location ${location}`);
    }
    const glType = getGLFromVertexType(attributeInfo.bufferDataType);
    return {
      size: attributeInfo.bufferComponents,
      type: glType,
      stride: attributeInfo.byteStride,
      offset: attributeInfo.byteOffset,
      normalized: attributeInfo.normalized,
      // it is the shader attribute declaration, not the vertex memory format,
      // that determines if the data in the buffer will be treated as integers.
      //
      // Also note that WebGL supports assigning non-normalized integer data to floating point attributes,
      // but as far as we can tell, WebGPU does not.
      integer: attributeInfo.integer,
      divisor: attributeInfo.stepMode === 'instance' ? 1 : 0
    };
  }

  /**
   * Enabling an attribute location makes it reference the currently bound buffer
   * Disabling an attribute location makes it reference the global constant value
   * TODO - handle single values for size 1 attributes?
   * TODO - convert classic arrays based on known type?
   */
  protected _enable(location: number, enable = true): void {
    // Attribute 0 cannot be disabled in most desktop OpenGL based browsers...
    const canDisableAttributeZero = WEBGLVertexArray.isConstantAttributeZeroSupported(this.device);
    const canDisableAttribute = canDisableAttributeZero || location !== 0;

    if (enable || canDisableAttribute) {
      location = Number(location);
      this.device.gl.bindVertexArray(this.handle);
      if (enable) {
        this.device.gl.enableVertexAttribArray(location);
      } else {
        this.device.gl.disableVertexAttribArray(location);
      }
      this.device.gl.bindVertexArray(null);
    }
  }

  /**
   * Provide a means to create a buffer that is equivalent to a constant.
   * NOTE: Desktop OpenGL cannot disable attribute 0.
   * https://stackoverflow.com/questions/20305231/webgl-warning-attribute-0-is-disabled-
   * this-has-significant-performance-penalty
   */
  getConstantBuffer(elementCount: number, value: TypedArray): Buffer {
    // Create buffer only when needed, and reuse it (avoids inflating buffer creation statistics)

    const constantValue = normalizeConstantArrayValue(value);

    const byteLength = constantValue.byteLength * elementCount;
    const length = constantValue.length * elementCount;

    if (this.buffer && byteLength !== this.buffer.byteLength) {
      throw new Error(
        `Buffer size is immutable, byte length ${byteLength} !== ${this.buffer.byteLength}.`
      );
    }
    let updateNeeded = !this.buffer;

    this.buffer = this.buffer || this.device.createBuffer({byteLength});

    // Reallocate and update contents if needed
    updateNeeded = updateNeeded || !compareConstantArrayValues(constantValue, this.bufferValue);

    if (updateNeeded) {
      // Create a typed array that is big enough, and fill it with the required data
      const typedArray = getScratchArray(value.constructor, length);
      fillArray({target: typedArray, source: constantValue, start: 0, count: length});
      this.buffer.write(typedArray);
      this.bufferValue = value;
    }

    return this.buffer;
  }
}

// HELPER FUNCTIONS

/**
 * TODO - convert Arrays based on known type? (read type from accessor, don't assume Float32Array)
 * TODO - handle single values for size 1 attributes?
 */
function normalizeConstantArrayValue(arrayValue: NumericArray) {
  if (Array.isArray(arrayValue)) {
    return new Float32Array(arrayValue);
  }
  return arrayValue;
}

/**
 *
 */
function compareConstantArrayValues(v1: NumericArray, v2: NumericArray): boolean {
  if (!v1 || !v2 || v1.length !== v2.length || v1.constructor !== v2.constructor) {
    return false;
  }
  for (let i = 0; i < v1.length; ++i) {
    if (v1[i] !== v2[i]) {
      return false;
    }
  }
  return true;
}
