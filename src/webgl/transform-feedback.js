import GL from './gl-constants';
import Resource from './resource';
import {isWebGL2Context, assertWebGL2Context} from './context';
import assert from 'assert';

// const GL.TRANSFORM_FEEDBACK_BUFFER = 0;
// const GL.TRANSFORM_FEEDBACK = 0;

export default class TranformFeedback extends Resource {

  static isSupported(gl) {
    return isWebGL2Context(gl) || gl.getExtension('OES_vertex_array_object');
  }

  static isHandle(handle) {
    return this.gl.isTransformFeedback(this.handle);
  }

  /**
   * @class
   * @param {WebGL2RenderingContext} gl - context
   * @param {Object} opts - options
   */
  constructor(gl, opts) {
    assertWebGL2Context(gl);
    super(gl, opts);
    Object.seal(this);
  }

  // bindBuffers(varyingMap = {}, buffers = {}, bufferOffsets = {}) {
  //   for (const bufferName in buffers) {
  //     const buffer = buffers[bufferName];
  //     const varying = varyingMap[bufferName];
  //     const bufferOffset = bufferOffsets[];
  //     assert(varying);
  //     this.bindBuffer(Object.assign({buffer}, varying));
  //   }
  // }

  bindBuffer({index, buffer, offset = 0, size}) {
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    if (size === undefined) {
      this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, index, buffer.handle);
    } else {
      this.gl.bindBufferRange(GL.TRANSFORM_FEEDBACK_BUFFER, index, buffer.handle, offset, size);
    }
    return this;
  }

  unbindBuffer({index}) {
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    this.gl.bindBufferBase(GL.TRANSFORM_FEEDBACK_BUFFER, index, null);
    return this;
  }

  begin(primitiveMode) {
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    this.gl.beginTransformFeedback(primitiveMode);
    return this;
  }

  pause() {
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    this.gl.pauseTransformFeedback();
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
    return this;
  }

  resume() {
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    this.gl.resumeTransformFeedback();
    return this;
  }

  end() {
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, this.handle);
    this.gl.endTransformFeedback();
    this.gl.bindTransformFeedback(GL.TRANSFORM_FEEDBACK, null);
    return this;
  }

  // PRIVATE METHODS

  _createHandle() {
    return this.gl.createTransformFeedback();
  }

  _deleteHandle() {
    this.gl.deleteTransformFeedback(this.handle);
  }
}

// Counts the number of complete "primitives" given a number of vertices and a drawMode
export function getPrimitiveCount({drawMode, vertexCount, countVertices}) {
  switch (drawMode) {
  case GL.POINTS: return vertexCount;
  case GL.LINES: return vertexCount / 2;
  case GL.LINE_STRIP: return vertexCount - 1;
  case GL.LINE_LOOP: return vertexCount;
  case GL.TRIANGLES: return vertexCount / 3;
  case GL.TRIANGLE_STRIP: return vertexCount - 2;
  case GL.TRIANGLE_FAN: return vertexCount - 2;
  default: assert(false); return 0;
  }
}

// Counts the number of vertices after splitting the vertex stream into separate "primitives"
export function getVertexCount({drawMode, vertexCount}) {
  const primitiveCount = getPrimitiveCount({drawMode, vertexCount});
  switch (drawMode) {
  case GL.POINTS:
    return primitiveCount;
  case GL.LINES:
  case GL.LINE_STRIP:
  case GL.LINE_LOOP:
    return vertexCount * 2;
  case GL.TRIANGLES:
  case GL.TRIANGLE_STRIP:
  case GL.TRIANGLE_FAN:
    return vertexCount * 3;
  default: assert(false); return 0;
  }
}

// Counts the number of complete primitives given a number of vertices and a drawMode
export function getTransformFeedbackMode({drawMode}) {
  switch (drawMode) {
  case GL.POINTS: return GL.POINTS;
  case GL.LINES: return GL.LINES;
  case GL.LINE_STRIP: return GL.LINES;
  case GL.LINE_LOOP: return GL.LINES;
  case GL.TRIANGLES: return GL.TRIANGLES;
  case GL.TRIANGLE_STRIP: return GL.TRIANGLES;
  case GL.TRIANGLE_FAN: return GL.TRIANGLES;
  default: assert(false); return 0;
  }
}
