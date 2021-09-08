import GL from '@luma.gl/constants';
import {assertWebGLContext, log} from '@luma.gl/gltools';
import {parseGLSLCompilerError, getShaderName} from '../glsl-utils';
import {uid, assert} from '../utils';
import Resource, {ResourceProps} from './resource';

export type ShaderProps = ResourceProps & {
  source: string;
  shaderType?: string;
};

const ERR_SOURCE = 'Shader: GLSL source code must be a JavaScript string';

/**
 * Encapsulates the compiled or linked Shaders that execute portions of the WebGL Pipeline
 * For now this is an internal class
 */
 export class Shader extends Resource {
  shaderType: string;
  source: string;

  static getTypeName(shaderType: any): 'vertex-shader' | 'fragment-shader' | 'unknown' {
    switch (shaderType) {
      case GL.VERTEX_SHADER:
        return 'vertex-shader';
      case GL.FRAGMENT_SHADER:
        return 'fragment-shader';
      default:
        assert(false);
        return 'unknown';
    }
  }

  constructor(gl: WebGLRenderingContext, props: ShaderProps) {
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

  initialize(options: ShaderProps): this {
    const {source} = options;
    const shaderName = getShaderName(source, null);
    if (shaderName) {
      this.id = uid(shaderName);
    }
    this._compile(source);
    return this;
  }

  // Accessors

  getParameter(pname: number): any {
    return this.gl.getShaderParameter(this.handle, pname);
  }

  toString(): string {
    return `${Shader.getTypeName(this.shaderType)}:${this.id}`;
  }

  getName(): string {
    return getShaderName(this.source) || 'unnamed-shader';
  }

  getSource(): string {
    return this.gl.getShaderSource(this.handle);
  }

  /** Debug method - Returns translated source if available */
  getTranslatedSource(): string {
    const extension = this.gl.getExtension('WEBGL_debug_shaders');
    return extension
      ? extension.getTranslatedShaderSource(this.handle)
      : 'No translated source available. WEBGL_debug_shaders not implemented';
  }

  // PRIVATE METHODS
  _compile(source = this.source) {
    if (!source.startsWith('#version ')) {
      source = `#version 100\n${source}`;
    }
    this.source = source;
    this.gl.shaderSource(this.handle, this.source);
    this.gl.compileShader(this.handle);

    // TODO - For performance reasons, avoid checking shader compilation errors on production?
    // TODO - Load log even when no error reported, to catch warnings?
    // https://gamedev.stackexchange.com/questions/30429/how-to-detect-glsl-warnings
    const compileStatus = this.getParameter(GL.COMPILE_STATUS);
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
      type: this.getParameter(GL.SHADER_TYPE),
      source: this.getSource()
    };
  }
}

/**
 * Encapsulates the compiled or linked Shaders that execute portions of the WebGL Pipeline
 */
 export class VertexShader extends Shader {
  constructor(gl: WebGLRenderingContext, props: ShaderProps) {
    // Signature: new VertexShader(gl, source)
    if (typeof props === 'string') {
      props = {source: props};
    }
    super(gl, Object.assign({}, props, {shaderType: GL.VERTEX_SHADER}));
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createShader(GL.VERTEX_SHADER);
  }
}

/**
 * Encapsulates the compiled or linked Shaders that execute portions of the WebGL Pipeline
 */
 export class FragmentShader extends Shader {
  constructor(gl: WebGLRenderingContext, props: ShaderProps) {
    // Signature: new FragmentShader(gl, source)
    if (typeof props === 'string') {
      props = {source: props};
    }

    super(gl, Object.assign({}, props, {shaderType: GL.FRAGMENT_SHADER}));
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createShader(GL.FRAGMENT_SHADER);
  }
}
