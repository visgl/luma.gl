// WebGL2 Sampler Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

import {assertWebGL2Context, glCheckError} from '../webgl-checks';

export default class Sampler {

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl) {
    assertWebGL2Context(gl);
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
   * Batch update sampler settings
   *
   * @param {GLenum} compare_func - texture comparison function.
   * @param {GLenum} compare_mode - texture comparison mode.
   * @param {GLenum} mag_filter - texture magnification filter.
   * @param {GLenum} MIN_FILTER - texture minification filter
   * @param {GLfloat} MAX_LOD: maximum level-of-detail value.
   * @param {GLfloat} MIN_LOD: minimum level-of-detail value.
   * @param {GLenum} WRAP_R: texture wrapping function for texture coordinate r.
   * @param {GLenum} WRAP_S: texture wrapping function for texture coordinate s.
   * @param {GLenum} WRAP_T: texture wrapping function for texture coordinate t.
   */
  /* eslint-disable max-statements */
  setParameters({
    compareFunc,
    compareMode,
    magFilter,
    minFilter,
    minLOD,
    maxLOD,
    wrapR,
    wrapS,
    wrapT
  }) {
    const {gl} = this;
    if (compareFunc) {
      gl.samplerParameteri(this.handle, gl.TEXTURE_COMPARE_FUNC, compareFunc);
    }
    if (compareMode) {
      gl.samplerParameteri(this.handle, gl.TEXTURE_COMPARE_MODE, compareMode);
    }
    if (magFilter) {
      gl.samplerParameteri(this.handle, gl.TEXTURE_MAG_FILTER, magFilter);
    }
    if (minFilter) {
      gl.samplerParameteri(this.handle, gl.TEXTURE_MIN_FILTER, minFilter);
    }
    if (minLOD) {
      gl.samplerParameterf(this.handle, gl.TEXTURE_MIN_LOD, minLOD);
    }
    if (maxLOD) {
      gl.samplerParameterf(this.handle, gl.TEXTURE_MAX_LOD, maxLOD);
    }
    if (wrapR) {
      gl.samplerParameteri(this.handle, gl.TEXTURE_WRAP_R, wrapR);
    }
    if (wrapS) {
      gl.samplerParameteri(this.handle, gl.TEXTURE_WRAP_S, wrapS);
    }
    if (wrapT) {
      gl.samplerParameteri(this.handle, gl.TEXTURE_WRAP_T, wrapT);
    }
  }
  /* eslint-enable max-statements */

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
