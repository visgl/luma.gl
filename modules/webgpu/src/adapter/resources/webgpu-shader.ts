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

    const isGLSL = props.source.includes('#version');
    if (this.props.language === 'glsl' || isGLSL) {
      throw new Error('GLSL shaders are not supported in WebGPU');
    }

    this.device.handle.pushErrorScope('validation');
    this.handle = this.props.handle || this.device.handle.createShaderModule({code: props.source});
    this.device.handle.popErrorScope().then((error: GPUError | null) => {
      if (error) {
        log.error(`${this} creation failed:\n"${error.message}"`, this, this.props.source)();
      }
    });

    this.handle.label = this.props.id;
    this._checkCompilationError();
  }

  get asyncCompilationStatus(): Promise<any> {
    return this.getCompilationInfo().then(() => this.compilationStatus);
  }

  async _checkCompilationError(): Promise<void> {
    const shaderLog = await this.getCompilationInfo();
    const hasErrors = Boolean(shaderLog.find((msg) => msg.type === 'error'));
    this.compilationStatus = hasErrors ? 'error' : 'success';
    this.debugShader();

    if (this.compilationStatus === 'error') {
      log.error(`Shader compilation error`, shaderLog)();
      // Note: Even though this error is asynchronous and thrown after the constructor completes,
      // it will result in a useful stack trace leading back to the constructor
      // throw new Error(`Shader compilation error`);
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
}
