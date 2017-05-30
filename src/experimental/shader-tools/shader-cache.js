import {VertexShader, FragmentShader} from '../../webgl/shader';
import assert from 'assert';

const ERR_SOURCE = 'ShaderCache expects source strings';
const ERR_CONTEXT = 'ShaderCache does not support caching across multiple contexts';

export default class ShaderCache {

  /**
   * A cache of compiled shaders, keyed by shader source strings.
   * Compilation of long shaders can be time consuming.
   * By using this class, the application can ensure that each shader
   * is only compiled once.
   */
  constructor({gl} = {}) {
    this.gl = gl;
    this.vertexShaders = {};
    this.fragmentShaders = {};
  }

  /**
   * Deletes shader references
   * @return {ShaderCache} - returns this for chaining
   */
  delete() {
    // TODO - requires reference counting to avoid deleting shaders in use
    return this;
  }

  /**
   * Returns a compiled `VertexShader` object corresponding to the supplied
   * GLSL source code string, if possible from cache.
   *
   * @param {WebGLRenderingContext} gl - gl context
   * @param {String} source - Source code for shader
   * @return {VertexShader} - a compiled vertex shader
   */
  getVertexShader(gl, source) {
    assert(typeof source === 'string', ERR_SOURCE);

    let shader = this.vertexShaders[source];
    assert(!shader || shader.gl === gl, ERR_CONTEXT);

    if (!shader) {
      shader = new VertexShader(gl, source);
      this.vertexShaders[source] = shader;
    }
    return shader;
  }

  /**
   * Returns a compiled `VertexShader` object corresponding to the supplied
   * GLSL source code string, if possible from cache.
   *
   * @param {WebGLRenderingContext} gl - gl context
   * @param {String} source - Source code for shader
   * @return {FragmentShader} - a compiled fragment shader, possibly from chache
   */
  getFragmentShader(gl, source) {
    assert(typeof source === 'string', ERR_SOURCE);

    let shader = this.fragmentShaders[source];
    assert(!shader || shader.gl === gl, ERR_CONTEXT);

    if (!shader) {
      shader = new FragmentShader(gl, source);
      this.fragmentShaders[source] = shader;
    }
    return shader;
  }
}
