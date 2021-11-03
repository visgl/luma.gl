// luma.gl, MIT license
import GL from '@luma.gl/constants';
import {assertWebGLContext, log} from '@luma.gl/gltools';
import {getShaderInfo, CompilerMessage, formatCompilerLog} from '@luma.gl/shadertools';
import WebGLResource, {ResourceProps} from './webgl-resource';
import {parseShaderCompilerLog} from '../webgl-utils/parse-shader-compiler-log';
import {uid, assert} from '../utils';

export type ShaderProps = ResourceProps & {
  source: string;
  stage?: 'vertex' | 'fragment';
  /** @deprecated use props.stage */
  shaderType?: GL.VERTEX_SHADER | GL.FRAGMENT_SHADER;
};

const ERR_SOURCE = 'Shader: GLSL source code must be a JavaScript string';

export class ImmutableShader extends WebGLResource<ShaderProps> {
  readonly stage: 'vertex' | 'fragment';

  constructor(gl: WebGLRenderingContext, props: ShaderProps) {
    super(gl, {id: getShaderIdFromProps(props), ...props});
    this.stage = props.stage;
    this._compile(props.source);
  }

  async compilationInfo(): Promise<readonly CompilerMessage[]> {
    const log = this.gl.getShaderInfoLog(this.handle);
    return parseShaderCompilerLog(log);
  }

  // PRIVATE METHODS
  _compile(source) {
    if (!source.startsWith('#version ')) {
      source = `#version 100\n${source}`;
    }
    this.gl.shaderSource(this.handle, source);
    this.gl.compileShader(this.handle);

    // TODO - For performance reasons, avoid checking shader compilation errors on production?
    // TODO - Load log even when no error reported, to catch warnings?
    // https://gamedev.stackexchange.com/questions/30429/how-to-detect-glsl-warnings
    const compileStatus = this.getParameter(GL.COMPILE_STATUS);
    if (!compileStatus) {
      const shaderLog = this.gl.getShaderInfoLog(this.handle);
      const messages = parseShaderCompilerLog(shaderLog).filter(message => message.type === 'error');
      const formattedLog = formatCompilerLog(messages, source);
      const shaderName: string = getShaderInfo(source).name;
      const shaderDescription = `${this.stage} shader ${shaderName}`;
      log.error(`GLSL compilation errors in ${shaderName}\n${formattedLog}`)();
      throw new Error(`GLSL compilation errors in ${shaderName}`);
    }
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createShader(this.stage === 'vertex' ? GL.VERTEX_SHADER : GL.FRAGMENT_SHADER);
  }

  _deleteHandle(): void {
    this.gl.deleteShader(this.handle);
  }  
}
 
/**
 * Encapsulates the compiled or linked Shaders that execute portions of the WebGL Pipeline
 * For now this is an internal class
 */
export class Shader extends ImmutableShader {
  shaderType: GL.FRAGMENT_SHADER | GL.VERTEX_SHADER;
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
    assert(typeof props.source === 'string', ERR_SOURCE);

    super(gl, {...props, id: getShaderIdFromProps(props), stage: props.shaderType === GL.VERTEX_SHADER ? 'vertex' : 'fragment'});

    this.shaderType = props.shaderType;
    this.source = props.source;

    const shaderName = getShaderInfo(props.source).name;
    if (shaderName) {
      this.id = uid(shaderName);
    }
  }

  initialize(props: ShaderProps): this {
    this._compile(props.source);
    const shaderName = getShaderInfo(props.source).name;
    if (shaderName) {
      this.id = uid(shaderName);
    }
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
    return getShaderInfo(this.source).name || 'unnamed-shader';
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
  constructor(gl: WebGLRenderingContext, props: ShaderProps | string) {
    super(gl, getShaderProps(props, GL.VERTEX_SHADER));
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
  constructor(gl: WebGLRenderingContext, props: ShaderProps | string) {
    super(gl, getShaderProps(props, GL.FRAGMENT_SHADER));
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createShader(GL.FRAGMENT_SHADER);
  }
}

// HELPERS

function getShaderProps(props: ShaderProps | string, shaderType: GL.VERTEX_SHADER | GL.FRAGMENT_SHADER): ShaderProps {
  if (typeof props === 'string') {
    return {source: props, shaderType};
  }
  return {...props, shaderType};
}

/** Deduce an id, from shader source, or supplied id, or shader type */
function getShaderIdFromProps(props: ShaderProps): string {
  return getShaderInfo(props.source).name ||
    props.id ||
    uid(`unnamed ${props.stage || Shader.getTypeName(props.shaderType)}`);
}
