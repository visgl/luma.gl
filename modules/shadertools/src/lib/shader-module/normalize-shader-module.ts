import { ShaderModuleInstance } from './shader-module-instance';

export function normalizeShaderModule(module: any): any {
  if (!module.normalized) {
    module.normalized = true;
    if (module.uniforms && !module.getUniforms) {
      const shaderModule = new ShaderModuleInstance(module);
      module.getUniforms = shaderModule.getUniforms.bind(shaderModule);
    }
  }
  return module;
}
