// WebGL2 VertexArray Objects Helper
import {isWebGL2Context} from './context';
import Resource from './resource';
import assert from 'assert';

/* eslint-disable camelcase */
const OES_vertex_array_object = 'OES_vertex_array_object';

const ERR_NOT_SUPPORTED = 'VertexArrayObject: WebGL2 or OES_vertex_array_object required';

export default class VertexArrayObject extends Resource {

  static isSupported(gl) {
    return isWebGL2Context(gl) || gl.getExtension(OES_vertex_array_object);
  }

  static isHandle(gl, vertexArray) {
    if (isWebGL2Context(gl)) {
      return gl.isVertexArray(vertexArray);
    }
    const ext = gl.getExtension(OES_vertex_array_object);
    if (ext) {
      return ext.isVertexArrayOES(vertexArray);
    }
    return false;
  }

  // Create a VertexArrayObject
  constructor(gl, opts = {}) {
    assert(VertexArrayObject.isSupported(gl), ERR_NOT_SUPPORTED);
    super(gl, opts);
    Object.seal(this);
  }

  bind() {
    this._bindVertexArray(this.gl, this.handle);
    return this;
  }

  unbind() {
    this._bindVertexArray(this.gl, null);
    return this;
  }

  // RESOURCE IMPLEMENTATION

  _createHandle() {
    if (isWebGL2Context(this.gl)) {
      return this.gl.createVertexArray();
    }
    const ext = this.gl.getExtension(OES_vertex_array_object);
    if (ext) {
      return ext.createVertexArrayOES();
    }
    return null;
  }

  _deleteHandle(handle) {
    if (isWebGL2Context(this.gl)) {
      this.gl.deleteVertexArray(handle);
      return;
    }
    const ext = this.gl.getExtension(OES_vertex_array_object);
    if (ext) {
      ext.deleteVertexArrayOES(handle);
    }
  }

  // WebGL2 does not have any methods for querying vertex array objects

  // PRIVATE METHODS

  _bindVertexArray(gl, vertexArray) {
    if (isWebGL2Context(gl)) {
      gl.bindVertexArray(vertexArray);
      return;
    }
    const ext = gl.getExtension(OES_vertex_array_object);
    if (ext) {
      ext.bindVertexArrayOES(vertexArray);
    }
  }
}
