/* eslint-disable dot-notation*/
import {glGet} from './api';
import {assertWebGLContext, assertWebGL2Context, isWebGL2} from './context';
import {log} from '../utils';
import assert from 'assert';

/**
 * Methods for manipulating the vertex attributes array, which is where
 * vertex data is staged for shader execution.
 *
 * Vertex attributes are stored in "arrays" with indices from 0 and up.
 * During shader execution, these indices (or 'locations') are matched to
 * the indices assigned to shader attributes during WebGLProgram linking.
 *
 * Note: The global state contains an implicit vertex attribute array which
 * the methods in this class manipulate by default. It is also possible to
 * create and bind a VertexArray to manage multiple arrays.
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
 */

function glGetLumaInfo(gl) {
  gl.luma = gl.luma || {};
  gl.luma.extensions = gl.luma.extensions || {};
  gl.luma.extensions['ANGLE_instanced_arrays'] =
    gl.luma.extensions['ANGLE_instanced_arrays'] || gl.getExtension('ANGLE_instanced_arrays');
  return gl.luma;
}

// ACCESSORS

/**
 * The max number of attributes in the vertex attribute array is an
 * implementation defined limit, but never smaller than 8
 * @param {WebGLRenderingContext} gl - webgl context
 * @returns {GLuint} - (max) number of attributes in the vertex attribute array
 */
export function getMaxAttributes(gl) {
  assertWebGLContext(gl);
  return gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
}

/**
 * Is instance divisor availble (checks for WebGL2 or ANGLE extension)
 * @param {WebGLRenderingContext} gl - webgl context
 * @returns {Boolean} - is divisor available?
 */
export function hasDivisor(gl) {
  assertWebGLContext(gl);
  return Boolean(
    isWebGL2(gl) ||
    gl.getExtension(gl, 'ANGLE_instanced_arrays')
  );
}

/**
 * Returns true if the vertex attribute is enabled at this index.
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 * @returns {Boolean} - enabled status
 */
export function isEnabled(gl, location) {
  return Boolean(get(gl, location, gl.VERTEX_ATTRIB_ARRAY_ENABLED));
}

/**
 * Returns the currently bound buffer
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 * @returns {WebGLBuffer} Returns the currently bound buffer
 */
export function getBuffer(gl, location) {
  return get(gl, location, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
}

/**
 * Get values for generic vertex attributes
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 * @returns {Float32Array} (with 4 elements) representing the current value
 * of the vertex attribute at the given index.
 */
export function getGeneric(gl, location) {
  return get(gl, gl.CURRENT_VERTEX_ATTRIB);
}

/**
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 */
// @returns {GLint} the size of an element of the vertex array.
export function getSize(gl, location) {
  return get(location, gl.VERTEX_ATTRIB_ARRAY_SIZE);
}

/**
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 */
// @returns {GLenum} representing the array type.
export function getType(gl, location) {
  return get(location, gl.VERTEX_ATTRIB_ARRAY_TYPE);
}

/**
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 */
// @returns {GLboolean} true if fixed-point data types are normalized
// for the vertex attribute array at the given index.
export function isNormalized(gl, location) {
  return get(location, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
}

/**
 * check if an integer data type in the vertex attribute at index
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - index of the vertex attribute.
 * @returns {GLboolean} - true if an integer data type is in the
 * vertex attribute array at the given index.
 */
export function isInteger(gl, location) {
  assertWebGL2Context(gl);
  return get(location, gl.VERTEX_ATTRIB_ARRAY_INTEGER);
}

/**
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 * @returns {GLint} number of bytes between successive elements in the array.
 * 0 means that the elements are sequential.
 */
export function getStride(gl, location) {
  return get(location, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
}

/**
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 * @param {GLuint} pname - enum specifying which offset to return
 * @returns {GLuint} the address of a specified vertex attribute.
 */
export function getOffset(
  gl, location, pname = gl.VERTEX_ATTRIB_ARRAY_POINTER
) {
  return gl.getVertexAttribOffset(location, pname);
}

/**
 * @private
 * Generic getter for information about a vertex attribute at a given position
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - index of the vertex attribute.
 * @param {GLenum} pname - specifies the information to query.
 * @returns {*} - requested vertex attribute information (specified by pname)
 */
function get(gl, location, pname) {
  assertWebGLContext(gl);
  return gl.getVertexAttrib(location, pname);
}

// MODIFIERS

/**
 * Enable the attribute
 * Note: By default all attributes are disabled. Only attributes
 * used by a program's shaders should be enabled.
 *
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 */
export function enable(gl, location) {
  gl.enableVertexAttribArray(location);
}

/**
 * Disable the attribute
 * Note: Only attributes used by a program's shaders should be enabled.
 *
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 */
export function disable(gl, location) {
  // Don't disable location 0
  if (location > 0) {
    gl.disableVertexAttribArray(location);
  }
}

/**
 * Set the frequency divisor used for instanced rendering.
 * Note: Usually simply set to 1 or 0 to enable/disable instanced rendering
 * for a specific attribute.
 *
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 * @param {GLuint} divisor - instances that pass between updates of attribute
 */
export function setDivisor(gl, location, divisor) {
  if (isWebGL2(gl)) {
    gl.vertexAttribDivisor(location, divisor);
    return;
  }
  const ext = glGetLumaInfo(gl).extensions['ANGLE_instanced_arrays'];
  if (ext) {
    ext.vertexAttribDivisorANGLE(location, divisor);
    return;
  }
  // Accept divisor 0 even if instancing is not supported (0 = no instancing)
  if (divisor !== 0) {
    throw new Error('WebGL instanced rendering not supported');
  }
}

/**
 * Returns the frequency divisor used for instanced rendering.
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 * @returns {GLuint} divisor
 */
export function getDivisor(gl, location) {
  assert(location > 0);
  if (isWebGL2(gl)) {
    const divisor = get(location, gl.VERTEX_ATTRIB_ARRAY_DIVISOR);
    return divisor;
  }
  const ext = glGetLumaInfo(gl).extensions['ANGLE_instanced_arrays'];
  if (ext) {
    const divisor = get(location, ext.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE);
    return divisor;
  }
  // if instancing is not available, return 0 meaning divisor has not been set
  return 0;
}

/**
 * Set a location in vertex attributes array to a buffer, specifying
 * its data layout and integer to float conversion and normalization flags
 *
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 * @param {WebGLBuffer|Buffer} buffer - WebGL buffer to set as value
 * @param {GLuint} target=gl.ARRAY_BUFFER - which target to bind to
 * @param {Object} layout= Optional data layout, defaults to buffer's layout
 * @param {GLuint} layout.size - number of values per element (1-4)
 * @param {GLuint} layout.type - type of values (e.g. gl.FLOAT)
 * @param {GLbool} layout.normalized=false - normalize integers to [-1,1], [0,1]
 * @param {GLuint} layout.integer=false - WebGL2 only, disable int-to-float conv
 * @param {GLuint} layout.stride=0 - supports strided arrays
 * @param {GLuint} layout.offset=0 - supports strided arrays
 */
export function setBuffer({
  gl,
  location,
  buffer,
  target,
  layout
} = {}) {
  assertWebGLContext(gl);

  // Copy main data characteristics from buffer
  target = glGet(target !== undefined ? target : buffer.target);
  layout = layout !== undefined ? layout : buffer.layout;
  assert(target, 'setBuffer needs target');
  assert(layout, 'setBuffer called on uninitialized buffer');

  // a non-zero named buffer object must be bound to the GL_ARRAY_BUFFER target
  buffer.bind({target: gl.ARRAY_BUFFER});

  // Attach bound ARRAY_BUFFER with specified buffer format to location
  if (!layout.integer) {
    gl.vertexAttribPointer(
      location,
      layout.size,
      glGet(layout.type),
      layout.normalized,
      layout.stride,
      layout.offset
    );
  } else {
    // specifies *integer* data formats and locations of vertex attributes
    // For glVertexAttribIPointer, Values are always left as integer values.
    // Only accepts the integer types gl.BYTE, gl.UNSIGNED_BYTE,
    // gl.SHORT, gl.UNSIGNED_SHORT, gl.INT, gl.UNSIGNED_INT
    assertWebGL2Context(gl);
    gl.vertexAttribIPointer(
      location,
      layout.size,
      glGet(layout.type),
      layout.stride,
      layout.offset
    );
  }

  buffer.unbind({target: gl.ARRAY_BUFFER});
}

/*
 * Specify values for generic vertex attributes
 * Generic vertex attributes are constant for all vertices
 * Up to 4 values depending on attribute size
 *
 * @param {WebGLRenderingContext} gl - webgl context
 * @param {GLuint} location - ordinal number of the attribute
 * @param {GLuint} divisor - instances that pass between updates of attribute
 */
export function setGeneric({gl, location, array}) {
  log.warn(0, 'VertexAttributes.setGeneric is not well tested');
  // throw new Error('vertex attribute size must be between 1 and 4');

  if (array instanceof Float32Array) {
    gl.vertexAttrib4fv(location, array);
  } else if (array instanceof Int32Array) {
    assertWebGL2Context(gl);
    gl.vertexAttribI4iv(location, array);
  } else if (array instanceof Uint32Array) {
    assertWebGL2Context(gl);
    gl.vertexAttribI4uiv(location, array);
  }
}

/*
 * Specify values for generic vertex attributes
 * Generic vertex attributes are constant for all vertices
 * Up to 4 values depending on attribute size
 *
 * @param {GLuint} location - ordinal number of the attribute
 * @param {GLuint} divisor - instances that pass between updates of attribute
 */
/* eslint-disable max-params */
export function setGenericValues(gl, location, v0, v1, v2, v3) {
  log.warn(0, 'VertexAttributes.setGenericValues is not well tested');
  switch (arguments.length - 1) {
  case 1: gl.vertexAttrib1f(location, v0); break;
  case 2: gl.vertexAttrib2f(location, v0, v1); break;
  case 3: gl.vertexAttrib3f(location, v0, v1, v2); break;
  case 4: gl.vertexAttrib4f(location, v0, v1, v2, v3); break;
  default:
    throw new Error('vertex attribute size must be between 1 and 4');
  }

  // assert(gl instanceof WebGL2RenderingContext, 'WebGL2 required');
  // Looks like these will check how many arguments were supplied?
  // gl.vertexAttribI4i(location, v0, v1, v2, v3);
  // gl.vertexAttribI4ui(location, v0, v1, v2, v3);
}
