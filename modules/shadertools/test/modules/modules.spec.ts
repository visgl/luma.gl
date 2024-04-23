// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {initializeShaderModule, getShaderModuleUniforms} from '@luma.gl/shadertools';
import * as imports from '@luma.gl/shadertools';

const shaderModules = {};

// HACK - sniff out modules from * imports
for (const [name, value] of Object.entries(imports)) {
  // @ts-ignore
  if (value?.fs || value?.vs) {
    shaderModules[name] = value;
  }
}

test('shadertools#module imports are defined', t => {
  for (const name in shaderModules) {
    verifyShaderModule(t, shaderModules[name]);
  }
  t.end();
});

function verifyShaderModule(t, module) {
  initializeShaderModule(module);
  t.ok(module, `${module.name} imported`);

  const uniforms = getShaderModuleUniforms(module, {}, {});
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
