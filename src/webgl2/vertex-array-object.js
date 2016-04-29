// WebGL2 VertexArray Objects Helper
import {glCheckError} from '../context';

/* eslint-disable max-len */
// WebGLVertexArrayObject? createVertexArray();
// void deleteVertexArray(WebGLVertexArrayObject? vertexArray);
// [WebGLHandlesContextLoss] GLboolean isVertexArray(WebGLVertexArrayObject? vertexArray);
// void bindVertexArray(WebGLVertexArrayObject? array);

export default class VertexArray {
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

