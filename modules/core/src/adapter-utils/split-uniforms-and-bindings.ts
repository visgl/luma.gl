// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {UniformValue} from '../adapter/types/types';
import type {Binding} from '../adapter/types/shader-layout';
import {isUniformValue} from './is-uniform-value';

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
      result.uniforms[name] = uniform as UniformValue;
    } else {
      result.bindings[name] = uniform as Binding;
    }
  });

  return result;
}
