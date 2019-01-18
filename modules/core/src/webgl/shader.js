import Resource from './resource';
import {parseGLSLCompilerError, getShaderName} from '../webgl-utils';
import {assertWebGLContext} from '../webgl-utils';
import {uid, log} from '../utils';
import assert from '../utils/assert';

const ERR_SOURCE = 'Shader: GLSL source code must be a JavaScript string';

const GL_FRAGMENT_SHADER = 0x8b30;
const GL_VERTEX_SHADER = 0x8b31;
const GL_COMPILE_STATUS = 0x8b81;
const GL_SHADER_TYPE = 0x8b4f;

// For now this is an internal class
export class Shader extends Resource {
  static getTypeName(shaderType) {
    switch (shaderType) {
      case GL_VERTEX_SHADER:
        return 'vertex-shader';
      case GL_FRAGMENT_SHADER:
        return 'fragment-shader';
      default:
        assert(false);
        return 'unknown';
    }
  }

  /* eslint-disable max-statements */
  constructor(gl, props) {
    assertWebGLContext(gl);

    // Validate arguments
    assert(typeof props.source === 'string', ERR_SOURCE);

    // Deduce an id, from shader source, or supplied id, or shader type
    const id =
      getShaderName(props.source, null) ||
      props.id ||
      uid(`unnamed ${Shader.getTypeName(props.shaderType)}`);

    super(gl, {id});

    this.shaderType = props.shaderType;
    this.source = props.source;

    this.initialize(props);
  }

  initialize({source}) {
    const shaderName = getShaderName(source, null);
    if (shaderName) {
      this.id = uid(shaderName);
    }
    this._compile(source);
  }

  // Accessors

  getParameter(pname) {
    return this.gl.getShaderParameter(this.handle, pname);
  }

  toString() {
    return `${this.getTypeName(this.shaderType)}:${this.id}`;
  }

  getName() {
    return getShaderName(this.source) || 'unnamed-shader';
  }

  getSource() {
    return this.gl.getShaderSource(this.handle);
  }

  // Debug method - Returns translated source if available
  getTranslatedSource() {
    const extension = this.gl.getExtension('WEBGL_debug_shaders');
    return extension
      ? extension.getTranslatedShaderSource(this.handle)
      : 'No translated source available. WEBGL_debug_shaders not implemented';
  }

  // PRIVATE METHODS
  _compile() {
    this.gl.shaderSource(this.handle, this.source);
    this.gl.compileShader(this.handle);

    // TODO - For performance reasons, avoid checking shader compilation errors on production?
    // TODO - Load log even when no error reported, to catch warnings?
    // https://gamedev.stackexchange.com/questions/30429/how-to-detect-glsl-warnings
    const compileStatus = this.getParameter(GL_COMPILE_STATUS);
    if (!compileStatus) {
      const infoLog = this.gl.getShaderInfoLog(this.handle);
      const {shaderName, errors, warnings} = parseGLSLCompilerError(
        infoLog,
        this.source,
        this.shaderType,
        this.id
      );
      log.error(`GLSL compilation errors in ${shaderName}\n${errors}`)();
      log.warn(`GLSL compilation warnings in ${shaderName}\n${warnings}`)();
      throw new Error(`GLSL compilation errors in ${shaderName}`);
    }
  }

  _deleteHandle() {
    this.gl.deleteShader(this.handle);
  }

  _getOptsFromHandle() {
    return {
      type: this.getParameter(GL_SHADER_TYPE),
      source: this.getSource()
    };
  }
}

export class VertexShader extends Shader {
  constructor(gl, props) {
    // DEPRECATED: Support old constructor signature: VertexShader(gl, source)
    if (typeof props === 'string') {
      log.deprecated('new FragmentShader(gl, source)', 'new FragmentShader(gl, {source})', '6.1');
      props = {source: props};
    }
    super(gl, Object.assign({}, props, {shaderType: GL_VERTEX_SHADER}));
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createShader(GL_VERTEX_SHADER);
  }
}

export class FragmentShader extends Shader {
  constructor(gl, props) {
    // DEPRECATED: Support old constructor signature: FragmentShader(gl, source)
    if (typeof props === 'string') {
      log.deprecated('new FragmentShader(gl, source)', 'new FragmentShader(gl, {source})', '6.1');
      props = {source: props};
    }

    super(gl, Object.assign({}, props, {shaderType: GL_FRAGMENT_SHADER}));
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createShader(GL_FRAGMENT_SHADER);
  }
}
