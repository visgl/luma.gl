import GL from '@luma.gl/constants';
import {assertWebGL2Context, isWebGL2} from '@luma.gl/gltools';
import {getBrowser} from '@probe.gl/env';
import Program from './program';
import WebGLResource, {ResourceProps} from './webgl-resource';
import Buffer from './webgl-buffer';
import {getScratchArray, fillArray} from '../utils/array-utils-flat';
import {assert} from '../utils/assert';
import {getLumaContextData} from '../device/luma-context-data';

const ERR_ELEMENTS = 'elements must be GL.ELEMENT_ARRAY_BUFFER';

/**
 * VertexArrayObject properties
 * @param constantAttributeZero Attribute 0 can not be disable on most desktop OpenGL based browsers
 * and on iOS Safari browser.
 */
export type VertexArrayObjectProps = ResourceProps & {
  constantAttributeZero?: boolean;
  program?: Program;
  isDefaultArray?: boolean;
};

export default class VertexArrayObject extends WebGLResource<VertexArrayObjectProps> {
  private static MAX_ATTRIBUTES: number;

  static isSupported(gl: WebGLRenderingContext | WebGL2RenderingContext, options?: VertexArrayObjectProps): boolean {
    if (options?.constantAttributeZero) {
      return isWebGL2(gl) || getBrowser() === 'Chrome';
    }

    // Whether additional objects can be created
    return true;
  }

  /**
   * Returns the global (null) vertex array object. Exists even when no extension available.
   * @todo (Tarek): VAOs are now polyfilled. Deprecate this in 9.0
   */
  static getDefaultArray(gl: WebGLRenderingContext): VertexArrayObject {
    const lumaContextData = getLumaContextData(gl);
    lumaContextData.defaultVertexArray = lumaContextData.defaultVertexArray || 
      new VertexArrayObject(gl, {handle: null, isDefaultArray: true});
    return lumaContextData.defaultVertexArray;
  }

  /** Get maximum number of attributes in a vertex array */
  static getMaxAttributes(gl: WebGLRenderingContext): number {
    // TODO - should be cached per context
    VertexArrayObject.MAX_ATTRIBUTES =
      VertexArrayObject.MAX_ATTRIBUTES || gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    return VertexArrayObject.MAX_ATTRIBUTES;
  }

  /**
   * Set an attribute to a constant value
   * @param gl 
   * @param location 
   * @param array 
   * 
   * @note Constants are stored globally on the WebGL context, not the VAO
   * so they need to be updated before every render
   * @todo - use known type (in configuration or passed in) to allow non-typed arrays?
   * @todo - remember/cache values to avoid setting them unnecessarily?
   */
  static setConstant(gl: WebGLRenderingContext, location: any, array: any): void {
    switch (array.constructor) {
      case Float32Array:
        VertexArrayObject._setConstantFloatArray(gl, location, array);
        break;
      case Int32Array:
        VertexArrayObject._setConstantIntArray(assertWebGL2Context(gl), location, array);
        break;
      case Uint32Array:
        VertexArrayObject._setConstantUintArray(assertWebGL2Context(gl), location, array);
        break;
      default:
        assert(false);
    }
  }

  private buffer: Buffer | null = null;
  private bufferValue = null;
  private isDefaultArray: boolean = false;

  // Create a VertexArray
  constructor(gl: WebGLRenderingContext, opts?: VertexArrayObjectProps) {
    // Use program's id if program but no id is supplied
    super(gl, {...opts, id: opts?.id || (opts?.program && opts?.program.id)}, {} as any);

    this.buffer = null;
    this.bufferValue = null;
    this.isDefaultArray = opts?.isDefaultArray || false;

    Object.seal(this);
  }

  delete(): this {
    super.delete();
    if (this.buffer) {
      this.buffer.delete();
    }
    return this;
  }

  get MAX_ATTRIBUTES(): number {
    return VertexArrayObject.getMaxAttributes(this.gl);
  }

  // Set (bind) an elements buffer, for indexed rendering.
  // Must be a Buffer bound to GL.ELEMENT_ARRAY_BUFFER. Constants not supported
  setElementBuffer(elementBuffer = null, opts = {}) {
    assert(!elementBuffer || elementBuffer.target === GL.ELEMENT_ARRAY_BUFFER, ERR_ELEMENTS);

    // The GL.ELEMENT_ARRAY_BUFFER_BINDING is stored on the VertexArrayObject...
    this.bind(() => {
      this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, elementBuffer ? elementBuffer.handle : null);
    });

    return this;
  }

  /** Set a location in vertex attributes array to a buffer, enables the location, sets divisor */
  setBuffer(location, buffer, accessor): this {
    // Check target
    if (buffer.target === GL.ELEMENT_ARRAY_BUFFER) {
      return this.setElementBuffer(buffer, accessor);
    }

    const {size, type, stride, offset, normalized, integer, divisor} = accessor;

    const {gl, gl2} = this;
    location = Number(location);

    this.bind(() => {
      // A non-zero buffer object must be bound to the GL_ARRAY_BUFFER target
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.handle);

      // WebGL2 supports *integer* data formats, i.e. GPU will see integer values
      if (integer) {
        assert(isWebGL2(gl));
        gl2.vertexAttribIPointer(location, size, type, stride, offset);
      } else {
        // Attaches ARRAY_BUFFER with specified buffer format to location
        gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
      }
      gl.enableVertexAttribArray(location);
      gl2.vertexAttribDivisor(location, divisor || 0);

      // NOTE We don't unbind buffer here, typically another buffer will be bound just after
    });

    return this;
  }

  /**
   * Enabling an attribute location makes it reference the currently bound buffer
   *  Disabling an attribute location makes it reference the global constant value
   * TODO - handle single values for size 1 attributes?
   * TODO - convert classic arrays based on known type?
   */ 
  enable(location, enable = true): this {
    // Attribute 0 cannot be disabled in most desktop OpenGL based browsers
    const disablingAttributeZero =
      !enable &&
      location === 0 &&
      !VertexArrayObject.isSupported(this.gl, {constantAttributeZero: true});

    if (!disablingAttributeZero) {
      location = Number(location);
      this.bind(() =>
        enable
          ? this.gl.enableVertexAttribArray(location)
          : this.gl.disableVertexAttribArray(location)
      );
    }
    return this;
  }

  /**
   * Provide a means to create a buffer that is equivalent to a constant.
   * NOTE: Desktop OpenGL cannot disable attribute 0.
   * https://stackoverflow.com/questions/20305231/webgl-warning-attribute-0-is-disabled-
   * this-has-significant-performance-penalty
   */ 
  getConstantBuffer(elementCount: number, value): Buffer {
    // Create buffer only when needed, and reuse it (avoids inflating buffer creation statistics)

    const constantValue = this._normalizeConstantArrayValue(value);

    const byteLength = constantValue.byteLength * elementCount;
    const length = constantValue.length * elementCount;

    let updateNeeded = !this.buffer;

    this.buffer = this.buffer || new Buffer(this.gl, byteLength);
    updateNeeded = updateNeeded || this.buffer.reallocate(byteLength);

    // Reallocate and update contents if needed
    updateNeeded =
      updateNeeded || !this._compareConstantArrayValues(constantValue, this.bufferValue);

    if (updateNeeded) {
      // Create a typed array that is big enough, and fill it with the required data
      const typedArray = getScratchArray(value.constructor, length);
      fillArray({target: typedArray, source: constantValue, start: 0, count: length});
      this.buffer.subData(typedArray);
      this.bufferValue = value;
    }

    return this.buffer;
  }

  // DEPRECATED

  /** @deprecated this function has no effect */
  initialize(props?: VertexArrayObjectProps): this {
    return this.setProps(props);
  }

  /** @deprecated this function is not implemented */
  setProps(props: VertexArrayObjectProps): this {
    // TODO: decide which props should be supported
    return this;
  }  

  // PRIVATE

  // TODO - convert Arrays based on known type? (read type from accessor, don't assume Float32Array)
  // TODO - handle single values for size 1 attributes?
  _normalizeConstantArrayValue(arrayValue) {
    if (Array.isArray(arrayValue)) {
      return new Float32Array(arrayValue);
    }
    return arrayValue;
  }

  _compareConstantArrayValues(v1, v2): boolean {
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

  static _setConstantFloatArray(gl: WebGLRenderingContext, location, array): void {
    switch (array.length) {
      case 1:
        gl.vertexAttrib1fv(location, array);
        break;
      case 2:
        gl.vertexAttrib2fv(location, array);
        break;
      case 3:
        gl.vertexAttrib3fv(location, array);
        break;
      case 4:
        gl.vertexAttrib4fv(location, array);
        break;
      default:
        assert(false);
    }
  }

  static _setConstantIntArray(gl: WebGL2RenderingContext, location, array) {
    assert(isWebGL2(gl));
    gl.vertexAttribI4iv(location, array);
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

  static _setConstantUintArray(gl: WebGL2RenderingContext, location, array) {
    assert(isWebGL2(gl));
    gl.vertexAttribI4uiv(location, array);
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

  // RESOURCE IMPLEMENTATION

  _createHandle() {
    return this.gl2.createVertexArray();
  }

  _deleteHandle(): void {
    this.gl2.deleteVertexArray(this.handle);
    // @ts-expect-error
    return [this.elements];
    // return [this.elements, ...this.buffers];
  }

  _bindHandle(handle): void {
    this.gl2.bindVertexArray(handle);
  }

  // Generic getter for information about a vertex attribute at a given position
  _getParameter(pname: number, {location}) {
    assert(Number.isFinite(location));
    return this.bind(() => {
      switch (pname) {
        case GL.VERTEX_ATTRIB_ARRAY_POINTER:
          return this.gl.getVertexAttribOffset(location, pname);
        default:
          return this.gl.getVertexAttrib(location, pname);
      }
    });
  }
}
