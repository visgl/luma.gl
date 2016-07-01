// WebGL2 Transform Feedback Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

import {WebGL2RenderingContext} from './webgl-types';
import {glCheckError} from '../context';
import assert from 'assert';

/* eslint-disable max-len */
// void bindTransformFeedback (GLenum target, WebGLTransformFeedback? id);
// void beginTransformFeedback(GLenum primitiveMode);
// void endTransformFeedback();
// void transformFeedbackVaryings(WebGLProgram? program, sequence<DOMString> varyings, GLenum bufferMode);
// WebGLActiveInfo? getTransformFeedbackVarying(WebGLProgram? program, GLuint index);
// void pauseTransformFeedback();
// void resumeTransformFeedback();

export default class TranformFeedback {

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl) {
    assert(gl instanceof WebGL2RenderingContext);
    this.gl = gl;
    this.handle = gl.createTransformFeedback();
    this.userData = {};
    Object.seal(this);
  }

  /**
   * @param {GLenum} target
   * @return {TransformFeedback} returns self to enable chaining
   */
  delete() {
    const {gl} = this;
    gl.deleteTransformFeedback(this.handle);
    this.handle = null;
    glCheckError(gl);
    return this;
  }

  /**
   * @param {GLenum} target
   * @return {TransformFeedback} returns self to enable chaining
   */
  bind(target) {
    const {gl} = this;
    gl.bindTransformFeedback(target, this.handle);
    glCheckError(gl);
    return this;
  }

  unbind(target) {
    const {gl} = this;
    gl.bindTransformFeedback(target, null);
    glCheckError(gl);
    return this;
  }

  /**
   * @param {GLenum} primitiveMode
   * @return {TransformFeedback} returns self to enable chaining
   */
  begin(primitiveMode) {
    const {gl} = this;
    gl.beginTransformFeedback(primitiveMode);
    glCheckError(gl);
    return this;
  }

  /**
   * @return {TransformFeedback} returns self to enable chaining
   */
  pause() {
    const {gl} = this;
    gl.pauseTransformFeedback();
    glCheckError(gl);
    return this;
  }

  /**
   * @return {TransformFeedback} returns self to enable chaining
   */
  resume() {
    const {gl} = this;
    gl.resumeTransformFeedback();
    glCheckError(gl);
    return this;
  }

  /**
   * @return {TransformFeedback} returns self to enable chaining
   */
  end() {
    const {gl} = this;
    gl.endTransformFeedback();
    glCheckError(gl);
    return this;
  }

  /**
   * @param {WebGLProgram?} program
   * @param {sequence<DOMString>} varyings
   * @param {GLenum} bufferMode
   * @return {TransformFeedback} returns self to enable chaining
   */
  varyings(program, varyings, bufferMode) {
    const {gl} = this;
    const result = gl.transformFeedbackVaryings(program, varyings, bufferMode);
    glCheckError(gl);
    return result;
  }

  /**
   * @param {WebGLProgram} program
   * @param {GLuint} index
   * @return {WebGLActiveInfo} - object with {name, size, type}
   */
  getVarying(program, index) {
    const {gl} = this;
    const result = gl.getTransformFeedbackVarying(program, index);
    glCheckError(gl);
    return result;
  }

}
