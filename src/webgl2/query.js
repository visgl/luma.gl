// WebGL2 Query Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery
import {isWebGL2Context, assertWebGL2Context, glCheckError}
  from './webgl-checks';
import queryManager from './helpers/query-manager';

/* eslint-disable max-len */
// gl.ANY_SAMPLES_PASSED // Specifies an occlusion query: these queries detect whether an object is visible (whether the scoped drawing commands pass the depth test and if so, how many samples pass).
// gl.ANY_SAMPLES_PASSED_CONSERVATIVE // Same as above above, but less accurate and faster version.
// gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN // Number of primitives that are written to transform feedback buffers.

// gl.QUERY_RESULT: Returns a GLuint containing the query result.
// gl.QUERY_RESULT_AVAILABLE: Returns a GLboolean indicating whether or not a query result is available.

export default class Query {

  static isSupported(gl) {
    return isWebGL2Context(gl);
  }

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl) {
    assertWebGL2Context(gl);
    const handle = gl.createQuery();
    glCheckError(gl);

    this.gl = gl;
    this.handle = handle;
    this.target = null;
    this.userData = {};

    // query manager needs a promise field
    this.promise = null;

    Object.seal(this);
  }

  /*
   * @return {Query} returns self to enable chaining
   */
  delete() {
    queryManager.deleteQuery(this);
    if (this.handle) {
      this.gl.deleteQuery(this.handle);
      this.handle = null;
      glCheckError(this.gl);
    }
    return this;
  }

  /*
   * @return {Query} returns self to enable chaining
   */
  begin(target) {
    queryManager.beginQuery(this);
    this.target = target;
    this.gl.beginQuery(target, this.handle);
    glCheckError(this.gl);
    return this;
  }

  /*
   * @return {Query} returns self to enable chaining
   */
  end() {
    if (this.target) {
      this.target = null;
      this.gl.endQuery(this.target);
      glCheckError(this.gl);
    }
    return this;
  }

  cancel() {
    this.end();
    queryManager.cancelQuery(this);
    return this;
  }

  isResultAvailable() {
    return this.gl.getQueryParameter(this.handle,
      this.gl.QUERY_RESULT_AVAILBLE);
  }

  getResult() {
    return this.gl.getQueryParameter(this.handle, this.gl.QUERY_RESULT);
  }

  static poll(gl) {
    queryManager.poll(gl);
  }
}
