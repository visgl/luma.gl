// WebGL2 VertexArray Objects Helper
import {glCheckError} from '../context';

/* eslint-disable max-len */
// WebGLVertexArrayObject? createVertexArray();
// void deleteVertexArray(WebGLVertexArrayObject? vertexArray);
// [WebGLHandlesContextLoss] GLboolean isVertexArray(WebGLVertexArrayObject? vertexArray);
// void bindVertexArray(WebGLVertexArrayObject? array);

export default class VertexArrayObject {
  constructor(gl) {
    this.handle = gl.createVertexArray();
    glCheckError(gl);
    this.userData = {};
    Object.seal(this);
  }

  delete() {
    const {gl} = this;
    gl.deleteVertexArray(this.handle);
    glCheckError(gl);
    return this;
  }

  bind() {
    const {gl} = this;
    gl.bindVertexArray(this.handle);
    glCheckError(gl);
    return this;
  }

  unbind() {
    const {gl} = this;
    gl.bindVertexArray(null);
    glCheckError(gl);
    return this;
  }
}

function createVertexArray(gl) {
  if (gl instanceof WebGL2RenderingContext) {
    return gl.createVertexArray();
  }
  const ext = gl.getExtension('OES_vertex_array_object');
  if (ext) {
    return ext.createVertexArrayOES();
  }
  return null;
}

function deleteVertexArray(gl, vertexArray) {
  if (gl instanceof WebGL2RenderingContext) {
    gl.deleteVertexArray(vertexArray);
    glCheckError(gl);
  }
  const ext = gl.getExtension('OES_vertex_array_object');
  if (ext) {
    ext.deleteVertexArrayOES(vertexArray);
    glCheckError(gl);
  }
}

function isVertexArray(gl, vertexArray) {
  if (gl instanceof WebGL2RenderingContext) {
    return gl.isVertexArray(vertexArray);
  }
  const ext = gl.getExtension('OES_vertex_array_object');
  if (ext) {
    ext.isVertexArrayOES(vertexArray);
  }
  return false;
}

function bindVertexArray(gl, vertexArray) {
  if (gl instanceof WebGL2RenderingContext) {
    gl.bindVertexArrayOES(vertexArray);
    glCheckError(gl);
  }
  const ext = gl.getExtension('OES_vertex_array_object');
  if (ext) {
    ext.bindVertexArrayOES(vertexArray);
    glCheckError(gl);
  }
}

export default class VertexArrays {
  constructor(gl) {
    this.handle = createVertexArray(gl);
    glCheckError(gl);
    this.userData = {};
    Object.seal(this);
  }

  delete() {
    const {gl} = this;
    deleteVertexArray(gl, this.handle);
    glCheckError(gl);
    return this;
  }

  bind() {
    const {gl} = this;
    bindVertexArray(gl, this.handle);
    return this;
  }

  unbind() {
    const {gl} = this;
    bindVertexArray(gl, null);
    glCheckError(gl);
    return this;
  }
}
