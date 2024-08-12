// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {UniformValue, Binding} from '@luma.gl/core';
import {isNumericArray} from '@math.gl/types';

export function isUniformValue(value: unknown): value is UniformValue {
  return isNumericArray(value) || typeof value === 'number' || typeof value === 'boolean';
}

type UniformsAndBindings = {
  bindings: Record<string, Binding>;
  uniforms: Record<string, UniformValue>;
};

export function splitUniformsAndBindings(
  uniforms: Record<string, Binding | UniformValue>
): UniformsAndBindings {
  const result: UniformsAndBindings = {bindings: {}, uniforms: {}};
  Object.keys(uniforms).forEach(name => {
    const uniform = uniforms[name];
    if (isUniformValue(uniform)) {
      result.uniforms[name] = uniform;
    } else {
      result.bindings[name] = uniform;
    }
  });

  return result;
}
