// WebGL2 Polyfills for iVertexArray Objects
// using OES_vertex_array_object extension

/* global WebGLRenderingContext, WebGL2RenderingContext */
import assert from 'assert';

function createVertexArray(gl) {
  const ext = gl.getExtension('OES_vertex_array_object');
  assert(gl, 'OES_vertex_array_object');
  return ext.createVertexArrayOES();
}

function deleteVertexArray(gl, vertexArray) {
  const ext = gl.getExtension('OES_vertex_array_object');
  assert(gl, 'OES_vertex_array_object');
  ext.deleteVertexArrayOES(vertexArray);
}

function isVertexArray(gl, vertexArray) {
  const ext = gl.getExtension('OES_vertex_array_object');
  assert(gl, 'OES_vertex_array_object');
  return ext.isVertexArrayOES(vertexArray);
}

function bindVertexArray(gl, vertexArray) {
  const ext = gl.getExtension('OES_vertex_array_object');
  assert(gl, 'OES_vertex_array_object');
  return ext.bindVertexArrayOES(vertexArray);
}

// Only add if WebGL2RenderingContext is not available
if (!WebGL2RenderingContext) {

  const prototype = WebGLRenderingContext.prototype;

  prototype.createVertexArray = prototype.createVertexArray ||
    createVertexArray;

  prototype.deleteVertexArray = prototype.deleteVertexArray ||
    deleteVertexArray;

  prototype.isVertexArray = prototype.isVertexArray || isVertexArray;

  prototype.bindVertexArray = prototype.bindVertexArray || bindVertexArray;

}

