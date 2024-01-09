// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {ShaderProps, CompilerMessage} from '@luma.gl/core';
import {Shader, log} from '@luma.gl/core';
import type {WebGPUDevice} from '../webgpu-device';

export type WebGPUShaderProps = ShaderProps & {
  handle?: GPUShaderModule;
};

/**
 * Immutable shader
 */
export class WebGPUShader extends Shader {
  readonly device: WebGPUDevice;
  readonly handle: GPUShaderModule;

  constructor(device: WebGPUDevice, props: WebGPUShaderProps) {
    super(device, props);
    this.device = device;

    this.device.handle.pushErrorScope('validation');

    this.handle = this.props.handle || this.createHandle();
    this.handle.label = this.props.id;

    this._checkCompilationError(this.device.handle.popErrorScope());
  }

  async _checkCompilationError(errorScope: Promise<GPUError | null>): Promise<void> {
    const error = await errorScope as GPUValidationError;
    if (error) {
      const shaderLog = await this.getCompilationInfo();
      log.error(`Shader compilation error: ${error.message}`, shaderLog)();
      // Note: Even though this error is asynchronous and thrown after the constructor completes,
      // it will result in a useful stack trace leading back to the constructor
      throw new Error(`Shader compilation error: ${error.message}`);
    }
  }

  override destroy(): void {
    // Note: WebGPU does not offer a method to destroy shaders
    // this.handle.destroy();
  }

  /** Returns compilation info for this shader */
  async getCompilationInfo(): Promise<readonly CompilerMessage[]> {
    const compilationInfo = await this.handle.getCompilationInfo();
    return compilationInfo.messages;
  }

  // PRIVATE METHODS

  protected createHandle(): GPUShaderModule {
    const {source, stage} = this.props;

    let language = this.props.language;
    // Compile from src
    if (language === 'auto') {
      // wgsl uses C++ "auto" style arrow notation
      language = source.includes('->') ? 'wgsl' : 'glsl';
    }

    switch(language) {
      case 'wgsl':
        return this.device.handle.createShaderModule({code: source});
      case 'glsl':
        return this.device.handle.createShaderModule({
          code: source,
          // @ts-expect-error
          transform: (glsl) => this.device.glslang.compileGLSL(glsl, stage)
        });
      default:
        throw new Error(language);
    }
  }
}
