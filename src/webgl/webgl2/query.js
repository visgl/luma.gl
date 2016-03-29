// WebGL2 Query Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

import {WebGL2RenderingContext} from './types';
import {glCheckError} from '../context';
import assert from 'assert';

/* eslint-disable max-len */
// gl.ANY_SAMPLES_PASSED // Specifies an occlusion query: these queries detect whether an object is visible (whether the scoped drawing commands pass the depth test and if so, how many samples pass).
// gl.ANY_SAMPLES_PASSED_CONSERVATIVE // Same as above above, but less accurate and faster version.
// gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN // Number of primitives that are written to transform feedback buffers.

// gl.QUERY_RESULT: Returns a GLuint containing the query result.
// gl.QUERY_RESULT_AVAILABLE: Returns a GLboolean indicating whether or not a query result is available.

export default class Query {

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl) {
    assert(gl instanceof WebGL2RenderingContext);
    this.gl = gl;
    this.handle = gl.createQuery();
    glCheckError(gl);
    this.userData = {};
    Object.seal(this);
  }

  /*
   * @return {Query} returns self to enable chaining
   */
  delete() {
    const {gl} = this;
    gl.deleteQuery(this.handle);
    this.handle = null;
    glCheckError(gl);
    return this;
  }

  /*
   * @return {Query} returns self to enable chaining
   */
  begin(target) {
    const {gl} = this;
    gl.beginQuery(target, this.handle);
    glCheckError(gl);
    return this;
  }

  /*
   * @return {Query} returns self to enable chaining
   */
  end(target) {
    const {gl} = this;
    gl.endQuery(target);
    glCheckError(gl);
    return this;
  }

  // @param {GLenum} pname
  getParameters(pname) {
    const {gl} = this;
    const result = gl.getQueryParameters(this.handle, pname);
    glCheckError(gl);
    return result;
  }

  isResultAvailable() {
    const {gl} = this;
    return this.getParameters(gl.QUERY_RESULT_AVAILBLE);
  }

  getResult() {
    const {gl} = this;
    return this.getParameters(gl.QUERY_RESULT);
  }

}
