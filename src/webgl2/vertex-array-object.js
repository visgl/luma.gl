// WebGL2 VertexArray Objects Helper
import {WebGL2RenderingContext} from '../webgl/webgl-types';
import {assertWebGLRenderingContext} from '../webgl/webgl-checks';
import {glCheckError} from '../webgl/context';
import assert from 'assert';

/* eslint-disable camelcase */
const OES_vertex_array_object = 'OES_vertex_array_object';

export default class VertexArrayObject {

  // Returns true if VertexArrayObject is supported by implementation
  static isSupported(gl) {
    assertWebGLRenderingContext(gl);
    return (
      gl instanceof WebGL2RenderingContext ||
      gl.getExtension('OES_vertex_array_object')
    );
  }

  // Wraps a WebGLVertexArrayObject in a VertexArrayObject
  static wrap(gl, object) {
    return object instanceof VertexArrayObject ?
      object :
      new VertexArrayObject(gl, {handle: object.handle || object});
  }

  // Create a VertexArrayObject
  constructor(gl, {handle} = {}) {
    assertWebGLRenderingContext(gl);
    assert(VertexArrayObject.isSupported(gl),
      'VertexArrayObject: WebGL2 or OES_vertex_array_object required');

    handle = handle || createVertexArray(gl);
    // TODO isVertexArray fails when using extension for some reason
    // if (!isVertexArray(gl, handle)) {
    if (!handle) {
      throw new Error('Could not create VertexArrayObject');
    }

    this.gl = gl;
    this.handle = handle;
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
    return this;
  }
}

function createVertexArray(gl) {
  if (gl instanceof WebGL2RenderingContext) {
    return gl.createVertexArray();
  }
  const ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    return ext.createVertexArrayOES();
  }
  return null;
}

function deleteVertexArray(gl, vertexArray) {
  if (gl instanceof WebGL2RenderingContext) {
    gl.deleteVertexArray(vertexArray);
  }
  const ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    ext.deleteVertexArrayOES(vertexArray);
  }
  glCheckError(gl);
}

export function isVertexArray(gl, vertexArray) {
  if (gl instanceof WebGL2RenderingContext) {
    return gl.isVertexArray(vertexArray);
  }
  const ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    return ext.isVertexArrayOES(vertexArray);
  }
  return false;
}

function bindVertexArray(gl, vertexArray) {
  if (gl instanceof WebGL2RenderingContext) {
    gl.bindVertexArray(vertexArray);
  }
  const ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    ext.bindVertexArrayOES(vertexArray);
  }
  glCheckError(gl);
}
