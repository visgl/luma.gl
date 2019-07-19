import './fp64/fp64-arithmetic-transform.spec';
import './lights/lights.spec';
import './picking/picking.spec';
import './phong-lighting/phong-lighting.spec';

import {registerShaderModules, setDefaultShaderModules} from '@luma.gl/shadertools';
import shaderModules from '@luma.gl/shadertools/modules';
import ShaderModule from '@luma.gl/shadertools/lib/shader-module';

import test from 'tape-catch';

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

function verifyShaderModule(t, module) {
  module = new ShaderModule(module);
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

test('shadertools#module imports are defined', t => {
  t.ok(registerShaderModules, 'registerShaderModules is defined');
  t.ok(setDefaultShaderModules, 'setDefaultShaderModules is defined');

  for (const name in shaderModules) {
    verifyShaderModule(t, shaderModules[name]);
  }

  t.end();
});
