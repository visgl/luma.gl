/* eslint-disable no-inline-comments */
import GL from './api';
import {assertWebGL2Context} from './context';
import Resource from './resource';

const PARAMETERS = [
  GL.TEXTURE_MAG_FILTER, // texture magnification filter
  GL.TEXTURE_MIN_FILTER, // texture minification filter
  GL.TEXTURE_WRAP_S, // texture wrapping function for texture coordinate s
  GL.TEXTURE_WRAP_T, // texture wrapping function for texture coordinate t
  // EXT_texture_filter_anisotropic
  GL.TEXTURE_MAX_ANISOTROPY_EXT,
  // WEBGL2
  GL.TEXTURE_WRAP_R, // texture wrapping function for texture coordinate r
  GL.TEXTURE_BASE_LEVEL, // Texture mipmap level
  GL.TEXTURE_MAX_LEVEL, // Maximum texture mipmap array level
  GL.TEXTURE_COMPARE_FUNC, // texture comparison function
  GL.TEXTURE_COMPARE_MODE, // texture comparison mode
  GL.TEXTURE_MIN_LOD, // minimum level-of-detail value
  GL.TEXTURE_MAX_LOD // maximum level-of-detail value
];

export default class Sampler extends Resource {
  /*
   * @class
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl, opts) {
    assertWebGL2Context(gl);
    super(gl, opts);
    Object.seal(this);
  }

  /*
   * Batch update sampler settings
   */
  setParameters(parameters) {
    this.gl.bindSampler(this.target, this.handle);
    for (const pname in parameters) {
      this.gl.texParameteri(this.target, pname, parameters[pname]);
    }
    this.gl.bindSampler(this.target, null);
    return this;
  }

  getParameter(pname) {
    this.gl.bindSampler(this.target, this.handle);
    const value = this.gl.getSamplerParameter(this.target, pname);
    this.gl.bindSampler(this.target, null);
    return value;
  }

  /**
   * @param {GLenum} pname
   * @param {GLint|GLfloat|GLenum} param
   * @return {Sampler} returns self to enable chaining
   */
  setParameter(pname, param) {
    this.gl.bindSampler(this.target, this.handle);
    // Apparently there are some conversion integer/float rules that made
    // the WebGL committe expose two parameter setting functions in JavaScript.
    // For now, pick the float version for parameters specified as GLfloat.
    switch (pname) {
    case GL.TEXTURE_MIN_LOD:
    case GL.TEXTURE_MAX_LOD:
      this.gl.samplerParameterf(this.handle, pname, param);
      break;
    default:
      this.gl.samplerParameteri(this.handle, pname, param);
      break;
    }
    this.gl.bindSampler(this.target, null);
    return this;
  }

  /**
   * @param {GLuint} unit
   * @return {Sampler} returns self to enable chaining
   */
  bind(unit) {
    this.gl.bindSampler(unit, this.handle);
    return this;
  }

  /**
   * @param {GLuint} unit
   * @return {Sampler} returns self to enable chaining
   */
  unbind(unit) {
    this.gl.bindSampler(unit, null);
    return this;
  }

  // PRIVATE METHODS

  _createHandle() {
    return this.gl.createSampler();
  }

  _deleteHandle() {
    this.gl.deleteSampler(this.handle);
  }
}

Sampler.PARAMETERS = PARAMETERS;
