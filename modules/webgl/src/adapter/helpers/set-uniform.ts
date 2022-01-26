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

  if (typeof value !== 'number') {
    // prettier-ignore
    switch (type) {
      case GL.FLOAT: return gl.uniform1fv(location, value);
      case GL.FLOAT_VEC2: return gl.uniform2fv(location, value);
      case GL.FLOAT_VEC3: return gl.uniform3fv(location, value);
      case GL.FLOAT_VEC4: return gl.uniform4fv(location, value);

      case GL.INT: return gl.uniform1iv(location, value);
      case GL.INT_VEC2: return gl.uniform2iv(location, value);
      case GL.INT_VEC3: return gl.uniform3iv(location, value);
      case GL.INT_VEC4: return gl.uniform4iv(location, value);

      case GL.BOOL: return gl.uniform1iv(location, value);
      case GL.BOOL_VEC2: return gl.uniform2iv(location, value);
      case GL.BOOL_VEC3: return gl.uniform3iv(location, value);
      case GL.BOOL_VEC4: gl.uniform4iv(location, value);

      // WEBGL2 - unsigned integers
      case GL.UNSIGNED_INT: return gl2.uniform1uiv(location, value, 1);
      case GL.UNSIGNED_INT_VEC2: return gl2.uniform2uiv(location, value, 2);
      case GL.UNSIGNED_INT_VEC3: return gl2.uniform3uiv(location, value, 3);
      case GL.UNSIGNED_INT_VEC4: return gl2.uniform4uiv(location, value, 4);

      // WebGL2 - quadratic matrices
      // false: don't transpose the matrix
      case GL.FLOAT_MAT2: return gl.uniformMatrix2fv(location, false, value);
      case GL.FLOAT_MAT3: return gl.uniformMatrix3fv(location, false, value);
      case GL.FLOAT_MAT4: return gl.uniformMatrix4fv(location, false, value);

      // WebGL2 - rectangular matrices
      case GL.FLOAT_MAT2x3: return gl2.uniformMatrix2x3fv(location, false, value);
      case GL.FLOAT_MAT2x4: return gl2.uniformMatrix2x4fv(location, false, value);
      case GL.FLOAT_MAT3x2: return gl2.uniformMatrix3x2fv(location, false, value);
      case GL.FLOAT_MAT3x4: return gl2.uniformMatrix3x4fv(location, false, value);
      case GL.FLOAT_MAT4x2: return gl2.uniformMatrix4x2fv(location, false, value);
      case GL.FLOAT_MAT4x3: return gl2.uniformMatrix4x3fv(location, false, value);
    }
  }

  throw new Error('Illegal uniform');
}
