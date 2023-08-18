// luma.gl, MIT license
import {log, uid, Shader, ShaderProps, CompilerMessage, formatCompilerLog} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {getShaderInfo} from '../helpers/get-shader-info';
import {parseShaderCompilerLog} from '../helpers/parse-shader-compiler-log';
import {WebGLDevice} from '../webgl-device';

/**
 * An immutable compiled shader program that execute portions of the GPU Pipeline
 */
export class WEBGLShader extends Shader {
  readonly device: WebGLDevice;
  readonly handle: WebGLShader;

  constructor(device: WebGLDevice, props: ShaderProps) {
    super(device, {id: getShaderIdFromProps(props), ...props});
    this.device = device;
    switch (this.props.stage) {
      case 'vertex':
        this.handle = this.props.handle || this.device.gl.createShader(GL.VERTEX_SHADER);
        break;
      case 'fragment':
        this.handle = this.props.handle || this.device.gl.createShader(GL.FRAGMENT_SHADER);
        break;
      default:
        throw new Error(this.props.stage);
    }
    this._compile(this.source);
  }

  override destroy(): void {
    if (this.handle) {
      this.removeStats();
      this.device.gl.deleteShader(this.handle);
      // this.handle = null;
      this.destroyed = true;
    }
  }

  async compilationInfo(): Promise<readonly CompilerMessage[]> {
    const log = this.device.gl.getShaderInfoLog(this.handle);
    return log ? parseShaderCompilerLog(log) : [];
  }

  // PRIVATE METHODS

  _compile(source: string): void {
    const addGLSLVersion = (source: string) => source.startsWith('#version ') ? source : `#version 100\n${source}`;
    source = addGLSLVersion(source);

    const {gl} = this.device;
    gl.shaderSource(this.handle, source);
    gl.compileShader(this.handle);

    // TODO - For performance reasons, avoid checking shader compilation errors on production?
    // TODO - Load log even when no error reported, to catch warnings?
    // https://gamedev.stackexchange.com/questions/30429/how-to-detect-glsl-warnings
    const compileStatus = gl.getShaderParameter(this.handle, GL.COMPILE_STATUS);
    if (!compileStatus) {
      const shaderLog = gl.getShaderInfoLog(this.handle);
      const parsedLog = shaderLog ? parseShaderCompilerLog(shaderLog) : [];
      const messages = parsedLog.filter(message => message.type === 'error');
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
