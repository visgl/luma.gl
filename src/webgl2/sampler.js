// WebGL2 Sampler Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

import {WebGL2RenderingContext} from './types';
import {glCheckError} from '../context';
import assert from 'assert';

// WebGLSampler? createSampler();
// void deleteSampler(WebGLSampler? sampler);
// [WebGLHandlesContextLoss] GLboolean isSampler(WebGLSampler? sampler);
// void bindSampler(GLuint unit, WebGLSampler? sampler);
// void samplerParameteri(WebGLSampler? sampler, GLenum pname, GLint param);
// void samplerParameterf(WebGLSampler? sampler, GLenum pname, GLfloat param);
// any getSamplerParameter(WebGLSampler? sampler, GLenum pname);

export default class Sampler {

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl) {
    assert(gl instanceof WebGL2RenderingContext);
    this.gl = gl;
    this.handle = gl.createSampler();
    glCheckError(gl);
    this.userData = {};
    Object.seal(this);
  }

  /**
   * @return {Sampler} returns self to enable chaining
   */
  delete() {
    const {gl} = this;
    gl.deleteSampler(this.handle);
    this.handle = null;
    glCheckError(gl);
    return this;
  }

  /**
   * @param {GLuint} unit
   * @return {Sampler} returns self to enable chaining
   */
  bind(unit) {
    const {gl} = this;
    gl.bindSampler(unit, this.handle);
    glCheckError(gl);
    return this;
  }

  /**
   * @param {GLuint} unit
   * @return {Sampler} returns self to enable chaining
   */
  unbind(unit) {
    const {gl} = this;
    gl.bindSampler(unit, null);
    glCheckError(gl);
    return this;
  }

  /**
   * @param {GLenum} pname
   * @param {GLint} param
   * @return {Sampler} returns self to enable chaining
   */
  parameteri(pname, param) {
    const {gl} = this;
    gl.samplerParameteri(this.handle, pname, param);
    glCheckError(gl);
    return this;
  }

  /**
   * @param {GLenum} pname
   * @param {GLfloat} param
   * @return {Sampler} returns self to enable chaining
   */
  parameterf(pname, param) {
    const {gl} = this;
    gl.samplerParameterf(this.handle, pname, param);
    glCheckError(gl);
    return this;
  }

  // @param {GLenum} pname
  // @return {*} result
  getParameter(pname) {
    const {gl} = this;
    const result = gl.getSamplerParameter(this.handle, pname);
    glCheckError(gl);
    return result;
  }

}
