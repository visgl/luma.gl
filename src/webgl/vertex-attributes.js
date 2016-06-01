import {WebGLRenderingContext} from './types';
import {getExtension} from './context';
import assert from 'assert';

export class VertexAttributesArray {

  /**
   * @classdesc
   * Methods for manipulating the vertex attributes array, which is where
   * vertex data is staged for shader execution.
   *
   * Vertex attributes are stored in "arrays" with indices from 0 and up.
   * During shader execution, these indices (or 'locations') are matched to
   * the indices assigned to shader attributes during WebGLProgram linking.
   *
   * Note: The global state contains an implicit vertex attribute array which
   * the methods in this class manipulate by default. It is also possible to
   * create and bind a VertexArrayObject to manage multiple arrays.
   *
   * Each vertex attribute has these properties:
   * - Can be enabled or disabled (Only enable attrs actually used by a program)
   * - Has an instance `divisor` (usually 1 or 0 to enable/disable instancing)
   * - Have a size (1-4 values per vertex)
   * - Has a value or values that is accessible in shaders
   *
   * Attribute values are either
   * - Generic: a constant value for all vertices/instances, or
   * - Bound to a WebGLBuffer with unique values for each vertex/instance
   *
   * When binding to a WebGLBuffer it is necessary to specify the layout of
   * data in the buffer:
   * - size (1-4 values per vertex)
   * - data type (e.g. gl.FLOAT)
   * - stride, offset, and integer normalization policy can also be specified
   *
   * Note: All methods in this class take a `location` index to specify which
   * vertex attribute in the array they are operating on.
   *
   * Note: Attribute 0 can sometimes be treated specially by the driver,
   * to be safe we avoid disabling it.
   *
   * Note: WebGL2
   * - Improves support for integer attributes, both generic and buffered.
   * - Setting instance "divisors" no longer require using a WebGL extension.
   *
   * @class
   * @param {WebGLRenderingContext} gl - webgl context
   */
  constructor(gl) {
    assert(gl instanceof WebGLRenderingContext,
      'VertexAttributesArray needs WebGLRenderingContext');
    this.gl = gl;
  }

  /**
   * Enable the attribute
   * Note: By default all attributes are disabled. Only attributes
   * used by a program's shaders should be enabled.
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @returns {VertexAttributeArray} Returns itself for chaining.
   */
  enable(location) {
    const {gl} = this;
    gl.enableVertexAttribArray(location);
    return this;
  }

  /**
   * Disable the attribute
   * Note: Only attributes used by a program's shaders should be enabled.
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @returns {VertexAttributeArray} Returns itself for chaining.
   */
  disable(location) {
    const {gl} = this;
    // Don't disable location 0
    if (location > 0) {
      gl.disableVertexAttribArray(location);
    }
    return this;
  }

  /**
   * Returns true if the vertex attribute is enabled at this index.
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @returns {Boolean} - enabled status
   */
  isEnabled(location) {
    return Boolean(this.get(location, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED));
  }

  /**
   * Set the frequency divisor used for instanced rendering.
   * Note: Usually simply set to 1 or 0 to enable/disable instanced rendering
   * for a specific attribute.
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @param {GLuint} divisor - instances that pass between updates of attribute
   * @returns {VertexAttributeArray} Returns itself for chaining.
   */
  setDivisor(location, divisor) {
    const {gl} = this;
    const ext = getExtension(gl, 'ANGLE_instanced_arrays');
    ext.vertexAttribDivisorANGLE(location, divisor);
    return this;
  }

  /**
   * Returns the frequency divisor used for instanced rendering.
   * @param {GLuint} location - ordinal number of the attribute
   * @returns {GLuint} divisor
   */
  getDivisor(location) {
    const {gl} = this;
    const ext = getExtension(gl, 'ANGLE_instanced_arrays');
    return this.get(location, ext.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE);
  }

  /*
   * Specify values for generic vertex attributes
   * Generic vertex attributes are constant for all vertices
   * Up to 4 values depending on attribute size
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @param {GLuint} divisor - instances that pass between updates of attribute
   * @returns {VertexAttributeArray} Returns itself for chaining.
   */
  setConstantFloats(location, v0, v1, v2, v3) {
    const {gl} = this;
    switch (arguments.length - 1) {
    case 1: gl.vertexAttrib1f(location, v0); break;
    case 2: gl.vertexAttrib2f(location, v0, v1); break;
    case 3: gl.vertexAttrib3f(location, v0, v1, v2); break;
    case 4: gl.vertexAttrib4f(location, v0, v1, v2, v3); break;
    default:
      throw new Error('vertex attribute size must be between 1 and 4');
    }
    return this;
  }

  /**
   * Specify values for generic vertex attributes
   * Note: Generic vertex attributes are constant for all vertices
   * Up to 4 values depending on attribute size
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @param {GLuint} size -
   * @param {Float32Array} array -
   * @returns {VertexAttributeArray} Returns itself for chaining.
   */
  setConstant(location, size, array) {
    const {gl} = this;
    switch (size) {
    case 1: gl.vertexAttrib1fv(location, array); break;
    case 2: gl.vertexAttrib2fv(location, array); break;
    case 3: gl.vertexAttrib3fv(location, array); break;
    case 4: gl.vertexAttrib4fv(location, array); break;
    default:
      throw new Error('vertex attribute size must be between 1 and 4');
    }
    return this;
  }

  /**
   * Specify values for generic vertex attributes
   * Generic vertex attributes are constant for all vertices
   * Up to 4 values depending on attribute size
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @returns {Float32Array} (with 4 elements) representing the current value
   * of the vertex attribute at the given index.
   */
  getConstant(location) {
    return this.get(this.gl.CURRENT_VERTEX_ATTRIB);
  }

  // Note: will set currently bound buffer
  setBuffer({
    location,
    buffer,
    size,
    dataType = this.gl.FLOAT,
    normalized = this.gl.FALSE,
    stride = 0,
    offset = 0,
    autobind = true
  } = {}) {
    const {gl} = this;
    buffer.bind({autobind});
    // Attaches bound ARRAY_BUFFER with specified buffer format
    gl.vertexAttribPointer(
      location,
      size,
      dataType,
      normalized,
      stride,
      offset
    );
    buffer.unbind({autobind});
    return this;
  }

  // @returns {WebGLBuffer} Returns the currently bound buffer
  getBuffer(location) {
    return this.get(location, this.gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
  }

  // @returns {GLint} the size of an element of the vertex array.
  getSize(location) {
    return this.get(location, this.gl.VERTEX_ATTRIB_ARRAY_SIZE);
  }

  // @returns {GLenum} representing the array type.
  getType(location) {
    return this.get(location, this.gl.VERTEX_ATTRIB_ARRAY_TYPE);
  }

  // @returns {GLboolean} true if fixed-point data types are normalized
  // for the vertex attribute array at the given index.
  isNormalized(location) {
    return this.get(location, this.gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
  }

  // @returns {GLint} number of bytes between successive elements in the array.
  // 0 means that the elements are sequential.
  getStride(location) {
    return this.get(location, this.gl.VERTEX_ATTRIB_ARRAY_STRIDE);
  }

  // returns the address of a specified vertex attribute.
  getOffset(location, pname = this.gl.VERTEX_ATTRIB_ARRAY_POINTER) {
    return this.gl.getVertexAttribOffset(location, pname);
  }

  // Generic getter
  // Returns information about a vertex attribute at a given position.
  get(location, pname) {
    return this.gl.getVertexAttrib(location, pname);
  }

  // WEBGL2 INTERFACE

  // specifies *integer* data formats and locations of vertex attributes
  setIntegerBuffer({
    location,
    buffer,
    size,
    dataType = this.gl.FLOAT,
    stride = 0,
    offset = 0,
    autobind = true
  } = {}) {
    const {gl} = this;
    // Attaches bound ARRAY_BUFFER with specified buffer format
    buffer.bind({autobind});
    gl.vertexAttribIPointer(
      location,
      size,
      dataType,
      stride,
      offset
    );
    buffer.unbind({autobind});
    return this;
  }

  // @returns {Boolean} is integer data type in the vertex attribute at index
  isIntegerBuffer(location) {
    return this.get(location, this.gl.VERTEX_ATTRIB_ARRAY_INTEGER);
  }
}
