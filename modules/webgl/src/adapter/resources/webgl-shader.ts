// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {Shader, ShaderProps, CompilerMessage} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {parseShaderCompilerLog} from '../helpers/parse-shader-compiler-log';
import {WebGLDevice} from '../webgl-device';

/**
 * An immutable compiled shader program that execute portions of the GPU Pipeline
 */
export class WEBGLShader extends Shader {
  readonly device: WebGLDevice;
  readonly handle: WebGLShader;

  constructor(device: WebGLDevice, props: ShaderProps) {
    super(device, props);
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

  override async getCompilationInfo(): Promise<readonly CompilerMessage[]> {
    return this.getCompilationInfoSync();
  }

  override getCompilationInfoSync() {
    const log = this.device.gl.getShaderInfoLog(this.handle);
    return parseShaderCompilerLog(log);
  }

  // PRIVATE METHODS

  _compile(source: string): void {
    const addGLSLVersion = (source: string) =>
      source.startsWith('#version ') ? source : `#version 100\n${source}`;
    source = addGLSLVersion(source);

    const {gl} = this.device;
    gl.shaderSource(this.handle, source);
    gl.compileShader(this.handle);

    // TODO - For performance reasons, avoid checking shader compilation errors on production?
    // TODO - Load log even when no error reported, to catch warnings?
    // https://gamedev.stackexchange.com/questions/30429/how-to-detect-glsl-warnings
    this.compilationStatus = gl.getShaderParameter(this.handle, GL.COMPILE_STATUS) ? 'success' : 'error';

    // The `Shader` base class will determine if debug window should be opened based on props
    this.debugShader();

    if (this.compilationStatus === 'error') {
      throw new Error(`GLSL compilation errors in ${this.props.stage} shader ${this.props.id}`);
    }
  }
}

// TODO - Original code from luma.gl v8 - keep until new debug functionality has matured
// if (!compilationSuccess) {
//   const parsedLog = shaderLog ? parseShaderCompilerLog(shaderLog) : [];
//   const messages = parsedLog.filter(message => message.type === 'error');
//   const formattedLog = formatCompilerLog(messages, source, {showSourceCode: 'all', html: true});
//   const shaderDescription = `${this.stage} shader ${shaderName}`;
//   log.error(`GLSL compilation errors in ${shaderDescription}\n${formattedLog}`)();
//   displayShaderLog(parsedLog, source, shaderName);
// }

