// luma.gl, MIT license
import {log, uid, Shader, ShaderProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {getShaderInfo, CompilerMessage, formatCompilerLog} from '@luma.gl/shadertools';
import {parseShaderCompilerLog} from '../webgl-utils/parse-shader-compiler-log';
import WebGLDevice from '../adapter/webgl-device';

/**
 * An immutable compiled shader program that execute portions of the GPU Pipeline
 */
 export class WEBGLShader extends Shader {
  readonly device: WebGLDevice;
  readonly gl: WebGLRenderingContext;
  readonly handle: WebGLShader;

  readonly stage: 'vertex' | 'fragment';
  readonly source: string;

  constructor(device: WebGLDevice, props: ShaderProps) {
    super(device, {id: getShaderIdFromProps(props), ...props});
    this.device = device;
    this.gl = device.gl;
    switch (this.props.stage) {
      case 'vertex':
        this.handle = this.props.handle || this.gl.createShader(GL.VERTEX_SHADER);
        break;
      case 'fragment':
        this.handle = this.props.handle || this.gl.createShader(GL.FRAGMENT_SHADER);
        break;
      default:
        throw new Error(this.props.stage);
    }
    this.stage = this.props.stage;
    this.source = this.props.source;
    this._compile(this.source);
  }

  destroy(): void {
    if (this.handle) {
      this.removeStats();
      this.gl.deleteShader(this.handle);
      // @ts-expect-error
      this.handle = null;
    }
  }

  async compilationInfo(): Promise<readonly CompilerMessage[]> {
    const log = this.gl.getShaderInfoLog(this.handle);
    return parseShaderCompilerLog(log);
  }

  // PRIVATE METHODS

  _compile(source) {
    const addGLSLVersion = source => source.startsWith('#version ') ? source : `#version 100\n${source}`;
    source = addGLSLVersion(source);

    this.gl.shaderSource(this.handle, source);
    this.gl.compileShader(this.handle);

    // TODO - For performance reasons, avoid checking shader compilation errors on production?
    // TODO - Load log even when no error reported, to catch warnings?
    // https://gamedev.stackexchange.com/questions/30429/how-to-detect-glsl-warnings
    const compileStatus = this.gl.getShaderParameter(this.handle, GL.COMPILE_STATUS);
    if (!compileStatus) {
      const shaderLog = this.gl.getShaderInfoLog(this.handle);
      const messages = parseShaderCompilerLog(shaderLog).filter(message => message.type === 'error');
      const formattedLog = formatCompilerLog(messages, source);
      const shaderName: string = getShaderInfo(source).name;
      const shaderDescription = `${this.stage} shader ${shaderName}`;
      log.error(`GLSL compilation errors in ${shaderDescription}\n${formattedLog}`)();
      throw new Error(`GLSL compilation errors in ${shaderName}`);
    }
  }
}

// HELPERS

/** Deduce an id, from shader source, or supplied id, or shader type */
function getShaderIdFromProps(props: ShaderProps): string {
  return getShaderInfo(props.source).name ||
    props.id ||
    uid(`unnamed ${props.stage}-shader`);
}
