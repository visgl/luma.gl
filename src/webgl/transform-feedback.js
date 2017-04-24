import Resource from './resource';
import {assertWebGL2Context} from './context';

export default class TranformFeedback extends Resource {
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

  /**
   * @param {GLenum} primitiveMode
   * @return {TransformFeedback} returns self to enable chaining
   */
  begin(primitiveMode) {
    this.gl.beginTransformFeedback(primitiveMode);
    return this;
  }

  /**
   * @return {TransformFeedback} returns self to enable chaining
   */
  pause() {
    this.gl.pauseTransformFeedback();
    return this;
  }

  /**
   * @return {TransformFeedback} returns self to enable chaining
   */
  resume() {
    this.gl.resumeTransformFeedback();
    return this;
  }

  /**
   * @return {TransformFeedback} returns self to enable chaining
   */
  end() {
    this.gl.endTransformFeedback();
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
    return result;
  }

  /**
   * @param {WebGLProgram} program
   * @param {GLuint} index
   * @return {WebGLActiveInfo} - object with {name, size, type}
   */
  getVarying(program, index) {
    const result = this.gl.getTransformFeedbackVarying(program, index);
    return result;
  }

  /**
   * @param {GLenum} target
   * @return {TransformFeedback} returns self to enable chaining
   */
  bind(target) {
    this.gl.bindTransformFeedback(target, this.handle);
    return this;
  }

  unbind(target) {
    this.gl.bindTransformFeedback(target, null);
    return this;
  }

  // PRIVATE METHODS

  _createHandle() {
    return this.gl.createTransformFeedback();
  }

  _deleteHandle() {
    this.gl.deleteTransformFeedback(this.handle);
  }

  static checkHandle(handle) {
    return this.gl.isTransformFeedback(this.handle);
  }
}
