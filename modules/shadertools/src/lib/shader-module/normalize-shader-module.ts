// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from './shader-module';
import {instantiateShaderModules} from './instantiate-shader-modules';

export function normalizeShaderModule(module: ShaderModule): ShaderModule {
  if (!module.normalized) {
    module.normalized = true;
    if (module.uniformPropTypes && !module.getUniforms) {
      instantiateShaderModules([module]);
      // @ts-expect-error
      module.instance.getUniforms = module.instance.getUniforms.bind(module);
    }
  }
  return module;
}
