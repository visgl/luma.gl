// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';

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

it('shadertools#module imports are defined', () => {
  for (const name in shaderModules) {
    verifyShaderModule(shaderModules[name]);
  }
  void 0;
});

function verifyShaderModule(module) {
  initializeShaderModule(module);
  expect(Boolean(module), `${module.name} imported`).toBe(true);

  const uniforms = getShaderModuleUniforms(module, {}, {});
  let isUniformsVaid = true;
  for (const key in uniforms) {
    if (getUniformType(uniforms[key]) === 'unknown') {
      isUniformsVaid = false;
      // console.log(uniforms);
      break;
    }
  }
  expect(Boolean(isUniformsVaid), `${module.name} getUniforms returns valid default values`).toBe(
    true
  );
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
