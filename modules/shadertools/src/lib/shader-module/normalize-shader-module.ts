// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from './shader-module';
import {ShaderModuleInstance} from './shader-module-instance';

export function normalizeShaderModule(module: ShaderModule): ShaderModule {
  if (!module.normalized) {
    module.normalized = true;
    if (module.uniformPropTypes && !module.getUniforms) {
      const shaderModule = new ShaderModuleInstance(module);
      module.getUniforms = shaderModule.getUniforms.bind(shaderModule);
    }
  }
  return module;
}
