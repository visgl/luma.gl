import {Binding} from '../..';
import type {UniformValue} from '../../adapter/types/types';
import {isNumberArray} from './is-array';

export function isUniformValue(value: unknown): boolean {
  return isNumberArray(value) !== null || (typeof value === 'number') || (typeof value === 'boolean');
}

type UniformsAndBindings = {
  bindings: Record<string, Binding>,
  uniforms: Record<string, UniformValue>
};
export function splitUniformsAndBindings(uniforms: Record<string, Binding | UniformValue>): UniformsAndBindings {
  const result: UniformsAndBindings = { bindings: {}, uniforms: {} } 
  Object.keys(uniforms).forEach(name => {
    const uniform = uniforms[name];
    if(isUniformValue(uniform)) {
      result.uniforms[name] = uniform as UniformValue;
    } else {
      result.bindings[name] = uniform as Binding;
    }
  });

  return result;
}
