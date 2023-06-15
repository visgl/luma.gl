import type {NumberArray} from '@luma.gl/api';
import {assert, getScratchArray, fillArray, ResourceProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {getBrowser} from '@probe.gl/env';
import {WebGLDevice} from '@luma.gl/webgl';
import {assertWebGL2Context, isWebGL2} from '@luma.gl/webgl';
import Program from './program';
import {WEBGLVertexArrayObject} from '@luma.gl/webgl';
import Buffer from './buffer';

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

/** @deprecated Use RenderPipeline (public) and WEBGLVertexArrayObject (internal) */
export default class VertexArrayObject extends WEBGLVertexArrayObject {
  override get [Symbol.toStringTag](): string {
    return 'VertexArrayObject';
  }

  private static MAX_ATTRIBUTES: number;

  static isSupported(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    options?: VertexArrayObjectProps
  ): boolean {
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
    const webglDevice = WebGLDevice.attach(gl);
    // @ts-expect-error
    webglDevice.defaultVertexArray =
    // @ts-expect-error
    webglDevice.defaultVertexArray ||
      new VertexArrayObject(gl, {handle: null, isDefaultArray: true});
    // @ts-expect-error
    return webglDevice.defaultVertexArray;
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
  // private isDefaultArray: boolean;

  // Create a VertexArray
  constructor(gl: WebGLRenderingContext, props?: VertexArrayObjectProps) {
    // Use program's id if program but no id is supplied
    super(WebGLDevice.attach(gl), {...props, id: props?.id || props?.program?.id});

    // this.isDefaultArray = props?.isDefaultArray || false;

    Object.seal(this);
  }

  override destroy(): this {
    super.destroy();
    if (this.buffer) {
      this.buffer.destroy();
    }
    return this;
  }

  get MAX_ATTRIBUTES(): number {
    return VertexArrayObject.getMaxAttributes(this.gl);
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
  override initialize(props?: VertexArrayObjectProps): this {
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
  _normalizeConstantArrayValue(arrayValue: NumberArray) {
    if (Array.isArray(arrayValue)) {
      return new Float32Array(arrayValue);
    }
    return arrayValue;
  }

  _compareConstantArrayValues(v1: NumberArray, v2: NumberArray): boolean {
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

  static _setConstantFloatArray(gl: WebGLRenderingContext, location: number, array: NumberArray): void {
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

  static _setConstantIntArray(gl: WebGL2RenderingContext, location: number, array: NumberArray): void {
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

  static _setConstantUintArray(gl: WebGL2RenderingContext, location: number, array: NumberArray) {
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

  // Generic getter for information about a vertex attribute at a given position
  override _getParameter(pname: number, options: {location: number}): any {
    assert(Number.isFinite(options.location));
    return this.bind(() => {
      switch (pname) {
        case GL.VERTEX_ATTRIB_ARRAY_POINTER:
          return this.gl.getVertexAttribOffset(options.location, pname);
        default:
          return this.gl.getVertexAttrib(options.location, pname);
      }
    });
  }
}
