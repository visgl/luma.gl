// luma.gl, MIT license
import {assert, uid, ShaderProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {getShaderInfo} from '@luma.gl/shadertools';
import {WebGLDevice, WEBGLShader} from '@luma.gl/webgl';
import {assertWebGLContext} from '@luma.gl/webgl';

const ERR_SOURCE = 'Shader: GLSL source code must be a JavaScript string';

export type {ShaderProps};

/**
 * Encapsulates the compiled or linked Shaders that execute portions of the WebGL Pipeline
 * This is an internal class, use FragmentShader or VertexShader
 * 
 * @deprecated Use device.createShader
 */
export class Shader extends WEBGLShader {
  shaderType: GL.FRAGMENT_SHADER | GL.VERTEX_SHADER;

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

  constructor(gl: WebGLRenderingContext, props: Omit<ShaderProps, 'stage'>) {
    assertWebGLContext(gl);
    assert(typeof props.source === 'string', ERR_SOURCE);
    super(WebGLDevice.attach(gl), {...props, stage: props.shaderType === GL.VERTEX_SHADER ? 'vertex' : 'fragment'});

    // @ts-ignore read only
    this.shaderType = props.shaderType;
    // @ts-ignore read only
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
    return this.device.gl.getShaderParameter(this.handle, pname);
  }

  override toString(): string {
    return `${Shader.getTypeName(this.shaderType)}:${this.id}`;
  }

  getName(): string {
    return getShaderInfo(this.source).name || 'unnamed-shader';
  }

  getSource(): string {
    return this.device.gl.getShaderSource(this.handle);
  }

  /** Debug method - Returns translated source if available */
  getTranslatedSource(): string {
    const extension = this.device.gl.getExtension('WEBGL_debug_shaders');
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
 * @deprecated Use `device.createShader({stage: 'vertex', ...})`
 */
export class VertexShader extends Shader {
  constructor(gl: WebGLRenderingContext, props: Omit<ShaderProps, 'stage'> | string) {
    super(gl, getShaderProps(props, GL.VERTEX_SHADER));
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.device.gl.createShader(GL.VERTEX_SHADER);
  }
}

/**
 * Encapsulates the compiled or linked Shaders that execute portions of the WebGL Pipeline
 * @deprecated Use `device.createShader({stage: 'fragment', ...})`
 */
export class FragmentShader extends Shader {
  constructor(gl: WebGLRenderingContext, props: Omit<ShaderProps, 'stage'> | string) {
    super(gl, getShaderProps(props, GL.FRAGMENT_SHADER));
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.device.gl.createShader(GL.FRAGMENT_SHADER);
  }
}

// HELPERS

function getShaderProps(props: Omit<ShaderProps, 'stage'> | string, shaderType: GL.VERTEX_SHADER | GL.FRAGMENT_SHADER): Omit<ShaderProps, 'stage'> {
  if (typeof props === 'string') {
    return {source: props, shaderType};
  }
  return {...props, shaderType};
}
