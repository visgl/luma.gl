// WebGL2 Sync Object Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery
import {assertWebGL2Context, glCheckError} from '../webgl/webgl-checks';
import queryManager from './queryManager';

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
   */
  constructor(gl) {
    assertWebGL2Context(gl);

    const handle = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    glCheckError(gl);

    this.gl = gl;
    this.handle = handle;
    this.userData = {};

    // query manager needs a promise field
    this.promise = null;

    Object.seal(this);
  }

  /**
   * @return {Sync} returns self to enable chaining
   */
  delete() {
    queryManager.deleteQuery(this);
    if (this.handle) {
      this.gl.deleteSync(this.handle);
      this.handle = null;
      glCheckError(this.gl);
    }
    return this;
  }

  /**
   * @param {GLbitfield} flags
   * @param {GLint64} timeout
   * @return {Sync} returns self to enable chaining
   */
  wait(flags, timeout) {
    this.gl.waitSync(this.handle, flags, timeout);
    glCheckError(this.gl);
    return this;
  }

  /**
   * @param {GLbitfield} flags
   * @param {GLint64} timeout
   * @return {GLenum} result
   */
  clientWait(flags, timeout) {
    const result = this.gl.clientWaitSync(this.handle, flags, timeout);
    glCheckError(this.gl);
    return result;
  }

  cancel() {
    queryManager.cancelQuery(this);
  }

  isResultAvailable() {
    const status = this.gl.getSyncParameter(this.handle, this.gl.SYNC_STATUS);
    return status === this.gl.SIGNALED;
  }

  getResult() {
    return this.gl.SIGNALED;
  }
}

