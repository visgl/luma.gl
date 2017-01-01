// WebGL2 Polyfills for instanced rendering
// using ANGLE_instanced_arrays extension

/* eslint-disable max-params */
/* global WebGLRenderingContext, WebGL2RenderingContext */
import assert from 'assert';

export default function polyfillInstancedArrays(gl) {
  // Only add if WebGL2RenderingContext is not available
  if (!(gl instanceof WebGL2RenderingContext)) {
    const ext = gl.getExtension('ANGLE_instanced_arrays');
    assert(ext, 'WebGL extension not available: ANGLE_instanced_arrays');

    const {prototype} = WebGLRenderingContext;
    prototype.vertexAttribDivisor = ext.vertexAttribDivisorANGLE.bind(ext);
    prototype.drawArraysInstanced = ext.drawArraysInstancedANGLE.bind(ext);
    prototype.drawElementsInstanced = ext.drawElementsInstancedANGLE.bind(ext);
    prototype.VERTEX_ATTRIB_ARRAY_DIVISOR =
      ext.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE;
  }
}
