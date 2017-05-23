import GL, {formatGLSLCompilerError, getShaderName} from './api';
import {assertWebGLContext} from './context';
import Resource from './resource';
import {log, uid} from '../utils';
import assert from 'assert';

const ERR_SOURCE = 'Shader: GLSL source code must be a JavaScript string';

// For now this is an internal class
export class Shader extends Resource {

  static getTypeName(shaderType) {
    switch (shaderType) {
    case GL.VERTEX_SHADER: return 'vertex-shader';
    case GL.FRAGMENT_SHADER: return 'fragment-shader';
    default: return 'unknown-shader';
    }
  }

  /* eslint-disable max-statements */
  constructor(gl, source, shaderType) {
    assertWebGLContext(gl);
    assert(typeof source === 'string', ERR_SOURCE);

    super(gl, {id: getShaderName(source) || uid(Shader.getTypeName(shaderType))});

    this.shaderType = shaderType;
    this.source = source;

    this.opts.source = source;
    this.initialize(this.opts);
  }

  initialize({source}) {
    const shaderName = getShaderName(source);
    if (shaderName) {
      this.id = uid(shaderName);
    }
    this._compile(source);
    this.opts.source = source;
  }

  // Accessors

  getParameter(pname) {
    return this.gl.getShaderParameter(this.handle, pname);
  }

  toString() {
    return `${this.getTypeName(this.shaderType)}:${this.id}`;
  }

  getName() {
    return getShaderName(this.opts.source) || 'unnamed-shader';
  }

  getSource() {
    return this.gl.getShaderSource(this.handle);
  }

  // Debug method - Returns translated source if available
  getTranslatedSource() {
    const extension = this.gl.getExtension('WEBGL_debug_shaders');
    return extension ?
      extension.getTranslatedShaderSource(this.handle) :
      'No translated source available. WEBGL_debug_shaders not implemented';
  }

  // PRIVATE METHODS
  _compile() {
    this.gl.shaderSource(this.handle, this.source);
    this.gl.compileShader(this.handle);

    // Avoid checking shader compilation errors on production
    // if (this.gl.debug || log.priority > 0) {
    // }
    // Throw if compilation failed
    const compileStatus = this.getParameter(GL.COMPILE_STATUS);
    if (!compileStatus) {
      const infoLog = this.gl.getShaderInfoLog(this.handle);
      const error = formatGLSLCompilerError(infoLog, this.source, this.shaderType);
      throw new Error(error);
    }

    // Log translated source, if compilation succeeded
    if (log.priority >= 3) {
      log.log(3, this.getTranslatedSource());
    }
  }

  _deleteHandle() {
    this.gl.deleteShader(this.handle);
  }

  _getOptsFromHandle() {
    return {
      type: this.getParameter(GL.SHADER_TYPE),
      source: this.getSource()
    };
  }
}

export class VertexShader extends Shader {
  constructor(gl, source) {
    super(gl, source, GL.VERTEX_SHADER);
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createShader(GL.VERTEX_SHADER);
  }
}

export class FragmentShader extends Shader {
  constructor(gl, source) {
    super(gl, source, GL.FRAGMENT_SHADER);
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createShader(GL.FRAGMENT_SHADER);
  }
}
