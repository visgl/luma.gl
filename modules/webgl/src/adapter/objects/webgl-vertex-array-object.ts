import type {Device, Buffer, ResourceProps, TypedArray, NumericArray} from '@luma.gl/core';
import {Resource, assert, getScratchArray, fillArray} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {getBrowser} from '@probe.gl/env';

import {WebGLDevice} from '../webgl-device';
import {WebGLResource} from './webgl-resource';
import {WEBGLBuffer} from '../resources/webgl-buffer';

import {BufferWithAccessor} from '../../classic/buffer-with-accessor';
import {AccessorObject} from '../..';

const ERR_ELEMENTS = 'elements must be GL.ELEMENT_ARRAY_BUFFER';

/**
 * VertexArrayObject properties
 * @param constantAttributeZero Attribute 0 can not be disable on most desktop OpenGL based browsers
 * and on iOS Safari browser.
 */
export type VertexArrayObjectProps = ResourceProps & {
  constantAttributeZero?: boolean;
};

/** VertexArrayObject wrapper */
export class WEBGLVertexArrayObject extends WebGLResource<VertexArrayObjectProps> {
  override get [Symbol.toStringTag](): string {
    return 'BaseVertexArrayObject';
  }

  /** Buffer constant */
  private buffer: BufferWithAccessor | null = null;
  private bufferValue = null;

  static isConstantAttributeZeroSupported(device: Device): boolean {
    return device.info.type === 'webgl2' || getBrowser() === 'Chrome';
  }

  // Create a VertexArray
  constructor(device: Device, props?: VertexArrayObjectProps) {
    super(device, props, {...Resource.defaultProps, constantAttributeZero: false});
    Object.seal(this);
  }

  override destroy(): void {
    super.destroy();
    if (this.buffer) {
      this.buffer?.destroy();
    }  }

  override _createHandle() {
    return this.gl2.createVertexArray();
  }

  override _deleteHandle(): void {
    this.gl2.deleteVertexArray(this.handle);
    // @ts-expect-error
    return [this.elements];
    // return [this.elements, ...this.buffers];
  }

  override _bindHandle(handle: WEBGLVertexArrayObject): void {
    this.gl2.bindVertexArray(handle);
  }

  /**
   * Enabling an attribute location makes it reference the currently bound buffer
   *  Disabling an attribute location makes it reference the global constant value
   * TODO - handle single values for size 1 attributes?
   * TODO - convert classic arrays based on known type?
   */
  enable(location: number, enable = true): void {
    // Attribute 0 cannot be disabled in most desktop OpenGL based browsers...
    const canDisableAttributeZero = this.device.isWebGL2 || getBrowser() === 'Chrome';
    const canDisableAttribute = canDisableAttributeZero || location !== 0;

    if (enable || canDisableAttribute) {
      location = Number(location);
      this.bind(() =>
        enable
          ? this.gl.enableVertexAttribArray(location)
          : this.gl.disableVertexAttribArray(location)
      );
    }  }

  // Set (bind) an elements buffer, for indexed rendering.
  // Must be a Buffer bound to GL.ELEMENT_ARRAY_BUFFER. Constants not supported
  setElementBuffer(elementBuffer: WEBGLBuffer | null = null, opts = {}) {
    assert(!elementBuffer || elementBuffer.glTarget === GL.ELEMENT_ARRAY_BUFFER, ERR_ELEMENTS);

    // The GL.ELEMENT_ARRAY_BUFFER_BINDING is stored on the VertexArrayObject...
    this.bind(() => {
      this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, elementBuffer ? elementBuffer.handle : null);
    });
  }

  /** Set a location in vertex attributes array to a buffer, enables the location, sets divisor */
  setBuffer(location: number, buffer: WEBGLBuffer, accessor: AccessorObject): void {
    // Check target
    if (buffer.glTarget === GL.ELEMENT_ARRAY_BUFFER) {
      this.setElementBuffer(buffer, accessor);
      return;
    }

    const {size, type, stride, offset, normalized, integer, divisor} = accessor;

    const {gl, gl2} = this;
    location = Number(location);

    this.bind(() => {
      // A non-zero buffer object must be bound to the GL_ARRAY_BUFFER target
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.handle);

      // WebGL2 supports *integer* data formats, i.e. GPU will see integer values
      if (integer) {
        this.device.assertWebGL2();
        gl2.vertexAttribIPointer(location, size, type, stride, offset);
      } else {
        // Attaches ARRAY_BUFFER with specified buffer format to location
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
      }
      gl.enableVertexAttribArray(location);
      gl2.vertexAttribDivisor(location, divisor || 0);

      // NOTE We don't unbind buffer here, typically another buffer will be bound just after
    });
  }

  /**
   * Set an attribute to a constant value
   * @param device
   * @param location
   * @param array
   * 
   * @note Constants are stored globally on the WebGL context, not the VAO
   * so they need to be updated before every render
   * @todo - use known type (in configuration or passed in) to allow non-typed arrays?
   * @todo - remember/cache values to avoid setting them unnecessarily?
   */
  setConstant(location: any, array: TypedArray): void {
    switch (array.constructor) {
      case Float32Array:
        setConstantFloatArray(this.device, location, array as Float32Array);
        break;
      case Int32Array:
        setConstantIntArray(this.device, location, array as Int32Array);
        break;
      case Uint32Array:
        setConstantUintArray(this.device, location, array as Uint32Array);
        break;
      default:
        assert(false);
    }
  }

  /**
   * Provide a means to create a buffer that is equivalent to a constant.
   * NOTE: Desktop OpenGL cannot disable attribute 0.
   * https://stackoverflow.com/questions/20305231/webgl-warning-attribute-0-is-disabled-
   * this-has-significant-performance-penalty
   */
  getConstantBuffer(elementCount: number, value): Buffer {
    // Create buffer only when needed, and reuse it (avoids inflating buffer creation statistics)

    const constantValue = normalizeConstantArrayValue(value);

    const byteLength = constantValue.byteLength * elementCount;
    const length = constantValue.length * elementCount;

    let updateNeeded = !this.buffer;

    this.buffer = this.buffer || this.device.createBuffer({byteLength}) as BufferWithAccessor;
    updateNeeded = updateNeeded || this.buffer.reallocate(byteLength);

    // Reallocate and update contents if needed
    updateNeeded =
      updateNeeded || !compareConstantArrayValues(constantValue, this.bufferValue);

    if (updateNeeded) {
      // Create a typed array that is big enough, and fill it with the required data
      const typedArray = getScratchArray(value.constructor, length);
      fillArray({target: typedArray, source: constantValue, start: 0, count: length});
      this.buffer.subData(typedArray);
      this.bufferValue = value;
    }

    return this.buffer;
  }
}

function setConstantFloatArray(device: WebGLDevice, location: number, array: Float32Array): void {
  switch (array.length) {
    case 1:
      device.gl.vertexAttrib1fv(location, array);
      break;
    case 2:
      device.gl.vertexAttrib2fv(location, array);
      break;
    case 3:
      device.gl.vertexAttrib3fv(location, array);
      break;
    case 4:
      device.gl.vertexAttrib4fv(location, array);
      break;
    default:
      assert(false);
  }
}

function setConstantIntArray(device: WebGLDevice, location: number, array: Int32Array): void {
  device.assertWebGL2();
  device.gl2?.vertexAttribI4iv(location, array);
  // switch (array.length) {
  //   case 1:
  //     gl.vertexAttribI1iv(location, array);
  //     break;
  //   case 2:
  //     gl.vertexAttribI2iv(location, array);
  //     break;
  //   case 3:
  //     gl.vertexAttribI3iv(location, array);
  //     break;
  //   case 4:
  //     break;
  //   default:
  //     assert(false);
  // }
}

function setConstantUintArray(device: WebGLDevice, location: number, array: Uint32Array) {
  device.assertWebGL2();
  device.gl2?.vertexAttribI4uiv(location, array);
  // switch (array.length) {
  //   case 1:
  //     gl.vertexAttribI1uiv(location, array);
  //     break;
  //   case 2:
  //     gl.vertexAttribI2uiv(location, array);
  //     break;
  //   case 3:
  //     gl.vertexAttribI3uiv(location, array);
  //     break;
  //   case 4:
  //     gl.vertexAttribI4uiv(location, array);
  //     break;
  //   default:
  //     assert(false);
  // }
}

// HELPERS

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
