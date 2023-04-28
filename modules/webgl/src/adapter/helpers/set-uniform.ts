/* eslint-disable */

// Uniforms
import GL from '@luma.gl/constants';

/** Set a raw uniform (without type conversion and caching) */
/* eslint-disable max-len */
export function setUniform(
  gl: WebGLRenderingContext,
  location: WebGLUniformLocation,
  type: GL,
  value: number | Float32Array | Int32Array | Uint32Array
): void {
  const gl2 = gl as WebGL2RenderingContext;

  if (typeof value === 'number') {
    // prettier-ignore
    switch (type) {
      // WebGL1 samplers
      case GL.SAMPLER_2D:
      case GL.SAMPLER_CUBE:
      // WebGL2 samplers
      case GL.SAMPLER_3D:
      case GL.SAMPLER_2D_SHADOW:
      case GL.SAMPLER_2D_ARRAY:
      case GL.SAMPLER_2D_ARRAY_SHADOW:
      case GL.SAMPLER_CUBE_SHADOW:
      case GL.INT_SAMPLER_2D:
      case GL.INT_SAMPLER_3D:
      case GL.INT_SAMPLER_CUBE:
      case GL.INT_SAMPLER_2D_ARRAY:
      case GL.UNSIGNED_INT_SAMPLER_2D:
      case GL.UNSIGNED_INT_SAMPLER_3D:
      case GL.UNSIGNED_INT_SAMPLER_CUBE:
      case GL.UNSIGNED_INT_SAMPLER_2D_ARRAY:
        return gl.uniform1i(location, value);
    }
  }

  // @ts-expect-error
  if (value === true) {
    value = 1;
  }
  // @ts-expect-error
  if (value === false) {
    value = 1;
  }
  const arrayValue = (typeof value === 'number') ? [value] : value;

  // prettier-ignore
  switch (type) {
    case GL.FLOAT: return gl.uniform1fv(location, arrayValue);
    case GL.FLOAT_VEC2: return gl.uniform2fv(location, arrayValue);
    case GL.FLOAT_VEC3: return gl.uniform3fv(location, arrayValue);
    case GL.FLOAT_VEC4: return gl.uniform4fv(location, arrayValue);

    case GL.INT: return gl.uniform1iv(location, arrayValue);
    case GL.INT_VEC2: return gl.uniform2iv(location, arrayValue);
    case GL.INT_VEC3: return gl.uniform3iv(location, arrayValue);
    case GL.INT_VEC4: return gl.uniform4iv(location, arrayValue);

    case GL.BOOL: return gl.uniform1iv(location, arrayValue);
    case GL.BOOL_VEC2: return gl.uniform2iv(location, arrayValue);
    case GL.BOOL_VEC3: return gl.uniform3iv(location, arrayValue);
    case GL.BOOL_VEC4: return gl.uniform4iv(location, arrayValue);

    // WEBGL2 - unsigned integers
    case GL.UNSIGNED_INT: return gl2.uniform1uiv(location, arrayValue, 1);
    case GL.UNSIGNED_INT_VEC2: return gl2.uniform2uiv(location, arrayValue, 2);
    case GL.UNSIGNED_INT_VEC3: return gl2.uniform3uiv(location, arrayValue, 3);
    case GL.UNSIGNED_INT_VEC4: return gl2.uniform4uiv(location, arrayValue, 4);

    // WebGL2 - quadratic matrices
    // false: don't transpose the matrix
    case GL.FLOAT_MAT2: return gl.uniformMatrix2fv(location, false, arrayValue);
    case GL.FLOAT_MAT3: return gl.uniformMatrix3fv(location, false, arrayValue);
    case GL.FLOAT_MAT4: return gl.uniformMatrix4fv(location, false, arrayValue);

    // WebGL2 - rectangular matrices
    case GL.FLOAT_MAT2x3: return gl2.uniformMatrix2x3fv(location, false, arrayValue);
    case GL.FLOAT_MAT2x4: return gl2.uniformMatrix2x4fv(location, false, arrayValue);
    case GL.FLOAT_MAT3x2: return gl2.uniformMatrix3x2fv(location, false, arrayValue);
    case GL.FLOAT_MAT3x4: return gl2.uniformMatrix3x4fv(location, false, arrayValue);
    case GL.FLOAT_MAT4x2: return gl2.uniformMatrix4x2fv(location, false, arrayValue);
    case GL.FLOAT_MAT4x3: return gl2.uniformMatrix4x3fv(location, false, arrayValue);
  }

  throw new Error('Illegal uniform');
}
