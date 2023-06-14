import test from 'tape-promise/tape';

import {ShaderModuleInstance} from '@luma.gl/shadertools/lib/shader-module/shader-module-instance';
import * as imports from '@luma.gl/shadertools';

const shaderModules = {};

// HACK - sniff out modules from * imports
for (const [name, value] of Object.entries(imports)) {
  // @ts-expect-error
  if (value?.fs || value?.vs) {
    shaderModules[name] = value;
  }
}

test('shadertools#module imports are defined', (t) => {
  for (const name in shaderModules) {
    verifyShaderModule(t, shaderModules[name]);
  }
  t.end();
});

function verifyShaderModule(t, module) {
  module = new ShaderModuleInstance(module);
  t.ok(module, `${module.name} imported`);

  const uniforms = module.getUniforms();
  let isUniformsVaid = true;
  for (const key in uniforms) {
    if (getUniformType(uniforms[key]) === 'unknown') {
      isUniformsVaid = false;
      // console.log(uniforms);
      break;
    }
  }
  t.ok(isUniformsVaid, `${module.name} getUniforms returns valid default values`);
}

function getUniformType(value) {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return 'bool';
  }
  if (Number.isFinite(value)) {
    return 'number';
  }
  if (ArrayBuffer.isView(value) || Array.isArray(value)) {
    return 'array';
  }
  return 'unknown';
}
