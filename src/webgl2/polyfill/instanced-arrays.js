// WebGL2 Polyfills for instanced rendering
// using ANGLE_instanced_arrays extension

/* eslint-disable max-params */
/* global WebGLRenderingContext, WebGL2RenderingContext */
import assert from 'assert';

function vertexAttribDivisor(gl, index, divisor) {
  const ext = gl.getExtension('ANGLE_instanced_arrays');
  assert(gl, 'ANGLE_instanced_arrays');
  return ext.vertexAttribDivisorANGLE(index, divisor);
}

// GLenum mode, GLint first, GLsizei count, GLsizei instanceCount
function drawArraysInstanced(gl, mode, first, count, instanceCount) {
  const ext = gl.getExtension('ANGLE_instanced_arrays');
  assert(gl, 'ANGLE_instanced_arrays');
  return ext.drawArraysInstancedANGLE(mode, first, count, instanceCount);
}

// GLenum mode, GLsizei count, GLenum type,
// GLintptr offset, GLsizei instanceCount
function drawElementsInstanced(gl, mode, count, type, offset, instanceCount) {
  const ext = gl.getExtension('ANGLE_instanced_arrays');
  assert(gl, 'ANGLE_instanced_arrays');
  return ext.drawElementsInstancedANGLE(
    mode, count, type, offset, instanceCount
  );
}

// Only add if WebGL2RenderingContext is not available
if (!WebGL2RenderingContext) {

  const prototype = WebGLRenderingContext.prototype;

  prototype.vertexAttribDivisor = prototype.vertexAttribDivisor ||
    vertexAttribDivisor;

  prototype.drawArraysInstanced = prototype.drawArraysInstanced ||
    drawArraysInstanced;

  prototype.drawElementsInstanced = prototype.drawElementsInstanced ||
    drawElementsInstanced;

}
