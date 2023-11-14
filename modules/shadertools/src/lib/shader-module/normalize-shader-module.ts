// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {ShaderModuleInstance} from './shader-module-instance';

export function normalizeShaderModule(module: any): any {
  if (!module.normalized) {
    module.normalized = true;
    if (module.uniformPropTypes && !module.getUniforms) {
      const shaderModule = new ShaderModuleInstance(module);
      module.getUniforms = shaderModule.getUniforms.bind(shaderModule);
    }
  }
  return module;
}
