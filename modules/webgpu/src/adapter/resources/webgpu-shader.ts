// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderProps, CompilerMessage} from '@luma.gl/core';
import {Shader, log} from '@luma.gl/core';
import type {WebGPUDevice} from '../webgpu-device';

/**
 * Immutable shader
 */
export class WebGPUShader extends Shader {
  readonly device: WebGPUDevice;
  readonly handle: GPUShaderModule;

  constructor(device: WebGPUDevice, props: ShaderProps) {
    super(device, props);
    this.device = device;

    this.device.handle.pushErrorScope('validation');

    this.handle = this.props.handle || this.createHandle();
    this.handle.label = this.props.id;

    this._checkCompilationError(this.device.handle.popErrorScope());
  }

  async _checkCompilationError(errorScope: Promise<GPUError | null>): Promise<void> {
    const error = (await errorScope) as GPUValidationError;
    if (error) {
      // The `Shader` base class will determine if debug window should be opened based on props
      this.debugShader();

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
    // @ts-expect-error readonly
    this.handle = null;
  }

  /** Returns compilation info for this shader */
  async getCompilationInfo(): Promise<readonly CompilerMessage[]> {
    const compilationInfo = await this.handle.getCompilationInfo();
    return compilationInfo.messages;
  }

  // PRIVATE METHODS

  protected createHandle(): GPUShaderModule {
    const {source} = this.props;

    const isGLSL = source.includes('#version');
    if (this.props.language === 'glsl' || isGLSL) {
      throw new Error('GLSL shaders are not supported in WebGPU');
    }

    return this.device.handle.createShaderModule({code: source});
  }
}
