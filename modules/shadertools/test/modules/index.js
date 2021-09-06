import './fp64/fp64-arithmetic-transform.spec';
import './fp64/fp64-utils.spec';
import './lights/lights.spec';
import './picking/picking.spec';
import './phong-lighting/phong-lighting.spec';

import './utils';
import './image-blur-filters';
import './image-adjust-filters';
import './image-fun-filters';
import './image-warp-filters';

import * as shaderModules from '@luma.gl/shadertools/modules';
import ShaderModule from '@luma.gl/shadertools/lib/shader-module';

import test from 'tape-promise/tape';

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

test('shadertools#module imports are defined', (t) => {
  for (const name in shaderModules) {
    verifyShaderModule(t, shaderModules[name]);
  }

  t.end();
});
