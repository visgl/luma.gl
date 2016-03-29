// WebGL2 Sync Object Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

import {WebGL2RenderingContext} from './types';
import {glCheckError} from '../context';
import assert from 'assert';

// WebGLSync? fenceSync(GLenum condition, GLbitfield flags);
// [WebGLHandlesContextLoss] GLboolean isSync(WebGLSync? sync);
// void deleteSync(WebGLSync? sync);
// GLenum clientWaitSync(WebGLSync? sync, GLbitfield flags, GLint64 timeout);
// void waitSync(WebGLSync? sync, GLbitfield flags, GLint64 timeout);
// any getSyncParameter(WebGLSync? sync, GLenum pname);

export default class Sync {

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   * @param {GLenum} condition
   * @param {GLbitfield} flags
   */
  constructor(gl, {condition, flags}) {
    assert(gl instanceof WebGL2RenderingContext);
    this.gl = gl;
    condition = condition || gl.SYNC_GPU_COMMANDS_COMPLETE;
    this.handle = gl.fenceSync(condition, flags);
    glCheckError(gl);
    this.userData = {};
    Object.seal(this);
  }

  /**
   * @return {Sync} returns self to enable chaining
   */
  delete() {
    const {gl} = this;
    gl.deleteSync(this.handle);
    this.handle = null;
    glCheckError(gl);
    return this;
  }

  /**
   * @param {GLbitfield} flags
   * @param {GLint64} timeout
   * @return {Sync} returns self to enable chaining
   */
  wait(flags, timeout) {
    const {gl} = this;
    gl.waitSync(this.handle, flags, timeout);
    glCheckError(gl);
    return this;
  }

  /**
   * @param {GLbitfield} flags
   * @param {GLint64} timeout
   * @return {GLenum} result
   */
  clientWait(flags, timeout) {
    const {gl} = this;
    const result = gl.clientWaitSync(this.handle, flags, timeout);
    glCheckError(gl);
    return result;
  }

  // @param {GLenum} pname
  getParameter(pname) {
    const {gl} = this;
    const result = gl.getSyncParameter(this.handle, pname);
    glCheckError(gl);
    return result;
  }

}

