// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Shader, ShaderProps, CompilerMessage} from '@luma.gl/core';
import {NullDevice} from '../null-device';

export class NullShader extends Shader {
  readonly device: NullDevice;

  constructor(device: NullDevice, props: ShaderProps) {
    super(device, props);
    this.device = device;
  }

  get asyncCompilationStatus(): Promise<any> {
    return this.getCompilationInfo().then(() => 'success');
  }

  async getCompilationInfo(): Promise<readonly CompilerMessage[]> {
    return [];
  }
}
