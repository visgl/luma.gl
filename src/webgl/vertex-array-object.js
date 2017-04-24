// WebGL2 VertexArray Objects Helper
import {assertWebGLContext, isWebGL2Context} from './context';
import Resource from './resource';
import assert from 'assert';

/* eslint-disable camelcase */
const OES_vertex_array_object = 'OES_vertex_array_object';

export default class VertexArrayObject extends Resource {

  // Returns true if VertexArrayObject is supported by implementation
  static isSupported(gl) {
    assertWebGLContext(gl);
    return isWebGL2Context(gl) || gl.getExtension('OES_vertex_array_object');
  }

  // Create a VertexArrayObject
  constructor(gl, opts = {}) {
    assertWebGLContext(gl);
    assert(VertexArrayObject.isSupported(gl),
      'VertexArrayObject: WebGL2 or OES_vertex_array_object required');
    super(gl, opts);
    Object.seal(this);
  }

  bind() {
    bindVertexArray(this.gl, this.handle);
    return this;
  }

  unbind() {
    bindVertexArray(this.gl, null);
    return this;
  }

  // PRIVATE METHODS

  _createHandle() {
    return createVertexArray(this.gl);
  }

  _deleteHandle(handle) {
    deleteVertexArray(this.gl, handle);
  }

  static checkHandle(handle) {
    isVertexArray(this.gl, handle);
  }
}

function createVertexArray(gl) {
  if (isWebGL2Context(gl)) {
    return gl.createVertexArray();
  }
  const ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    return ext.createVertexArrayOES();
  }
  return null;
}

function deleteVertexArray(gl, vertexArray) {
  if (isWebGL2Context(gl)) {
    gl.deleteVertexArray(vertexArray);
  }
  const ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    ext.deleteVertexArrayOES(vertexArray);
  }
}

export function isVertexArray(gl, vertexArray) {
  if (isWebGL2Context(gl)) {
    return gl.isVertexArray(vertexArray);
  }
  const ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    return ext.isVertexArrayOES(vertexArray);
  }
  return false;
}

function bindVertexArray(gl, vertexArray) {
  if (isWebGL2Context(gl)) {
    gl.bindVertexArray(vertexArray);
  }
  const ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    ext.bindVertexArrayOES(vertexArray);
  }
}
