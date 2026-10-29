// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, CompositeShaderType, UniformValue} from '@luma.gl/core';
import type {ShaderModuleUniformValue} from '@luma.gl/shadertools';
import type {TextureBindingSource} from '@luma.gl/core/dynamic';

/** Shader input value routed through the binding map. */
type ShaderInputBinding = Binding | TextureBindingSource;

export function isUniformValue(value: unknown): value is UniformValue {
  // math.gl beta.1 exposes its numeric-array guards as types only.
  const isNumericArray = Array.isArray(value)
    ? value.length === 0 || typeof value[0] === 'number'
    : ArrayBuffer.isView(value) && !(value instanceof DataView);
  return isNumericArray || typeof value === 'number' || typeof value === 'boolean';
}

type UniformsAndBindings = {
  bindings: Record<string, ShaderInputBinding>;
  uniforms: Record<string, ShaderModuleUniformValue>;
};

export function splitUniformsAndBindings(
  uniforms: Record<string, ShaderInputBinding | ShaderModuleUniformValue>,
  uniformTypes: Readonly<Record<string, CompositeShaderType>> = {}
): UniformsAndBindings {
  const result: UniformsAndBindings = {bindings: {}, uniforms: {}};
  Object.keys(uniforms).forEach(name => {
    const uniform = uniforms[name];
    if (Object.prototype.hasOwnProperty.call(uniformTypes, name) || isUniformValue(uniform)) {
      result.uniforms[name] = uniform as ShaderModuleUniformValue;
    } else {
      result.bindings[name] = uniform as ShaderInputBinding;
    }
  });

  return result;
}
