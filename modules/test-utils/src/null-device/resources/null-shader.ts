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

  async getCompilationInfo(): Promise<readonly CompilerMessage[]> {
    return [];
  }
}
