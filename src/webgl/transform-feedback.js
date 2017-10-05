import GL from './gl-constants';
import Resource from './resource';
import {isWebGL2, assertWebGL2Context} from './context';
import assert from 'assert';

const GL_TRANSFORM_FEEDBACK_BUFFER = 0x8C8E;
const GL_TRANSFORM_FEEDBACK = 0x8E22;

export default class TranformFeedback extends Resource {

  static isSupported(gl) {
    return isWebGL2(gl);
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
    this.buffers = {};
    Object.seal(this);

    this.initialize(opts);
  }

  initialize({buffers = {}}) {
    this.bindBuffers(buffers, {clear: true});
  }

  bindBuffers(buffers = {}, {clear, varyingMap = {}}) {
    if (clear) {
      this._unbindBuffers();
      this.buffers = {};
    }
    let bufferIndex = 0;
    for (const bufferName in buffers) {
      const buffer = buffers[bufferName];
      const index = bufferIndex++;
      assert(Number.isFinite(index));
      this.buffers[index] = buffer;
    }
  }

  // TODO: Activation is tightly coupled to the current program. Since we try to encapsulate
  // program.use, should we move these methods (begin/pause/resume/end) to the Program?
  begin(primitiveMode) {
    this._bindBuffers();
    this.gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, this.handle);
    this.gl.beginTransformFeedback(primitiveMode);
    return this;
  }

  pause() {
    this.gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, this.handle);
    this.gl.pauseTransformFeedback();
    this.gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, null);
    this._unbindBuffers();
    return this;
  }

  resume() {
    this._bindBuffers();
    this.gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, this.handle);
    this.gl.resumeTransformFeedback();
    return this;
  }

  end() {
    this.gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, this.handle);
    this.gl.endTransformFeedback();
    this.gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, null);
    this._unbindBuffers();
    return this;
  }

  bindBuffer({index, buffer, offset = 0, size}) {
    this.gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, this.handle);
    if (size === undefined) {
      this.gl.bindBufferBase(GL_TRANSFORM_FEEDBACK_BUFFER, index, buffer.handle);
    } else {
      this.gl.bindBufferRange(GL_TRANSFORM_FEEDBACK_BUFFER, index, buffer.handle, offset, size);
    }
    return this;
  }

  unbindBuffer({index}) {
    this.gl.bindTransformFeedback(GL_TRANSFORM_FEEDBACK, this.handle);
    this.gl.bindBufferBase(GL_TRANSFORM_FEEDBACK_BUFFER, index, null);
    return this;
  }

  // PRIVATE METHODS

  // See https://github.com/KhronosGroup/WebGL/issues/2346
  // If it was true that having a buffer on an unused TF was a problem
  // it would make the entire concept of transform feedback objects pointless.
  // The whole point of them is like VertexArrayObjects.
  // You set them up with all in outputs at init time and
  // then in one call you can setup all the outputs just before drawing.
  // Since the point of transform feedback is to generate data that will
  // then be used as inputs to attributes it makes zero sense you'd
  // have to unbind them from every unused transform feedback object
  // before you could use them in an attribute. If that was the case
  // there would be no reason to setup transform feedback objects ever.
  // You'd always use the default because you'd always have to bind and
  // unbind all the buffers.
  _bindBuffers() {
    for (const bufferIndex in this.buffers) {
      this.bindBuffer({buffer: this.buffers[bufferIndex], index: Number(bufferIndex)});
    }
  }

  _unbindBuffers() {
    for (const bufferIndex in this.buffers) {
      this.unbindBuffer({buffer: this.buffers[bufferIndex], index: Number(bufferIndex)});
    }
  }

  // RESOURCE METHODS

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
