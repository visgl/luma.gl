// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderUniformType} from '../gpu-type-utils/shader-types';
import type {UniformValue} from '../adapter/types/uniforms';
import {
  ShaderLayout,
  UniformInfo,
  UniformBufferBindingLayout
} from '../adapter/types/shader-layout';
import {arrayEqual, arrayCopy} from '../utils/array-equal';

/**
 * A uniform block holds values of the of uniform values for one uniform block / buffer.
 * It also does some book keeping on what has changed, to minimize unnecessary writes to uniform buffers.
 */
export class UniformBlock<
  TUniforms extends Record<string, UniformValue> = Record<string, UniformValue>
> {
  name: string;

  uniforms: Record<keyof TUniforms, UniformValue> = {} as Record<keyof TUniforms, UniformValue>;
  modifiedUniforms: Record<keyof TUniforms, boolean> = {} as Record<keyof TUniforms, boolean>;
  modified: boolean = true;

  readonly bindingLayout: Record<string, UniformInfo> = {};
  needsRedraw: string | false = 'initialized';

  constructor(props?: {
    name?: string;
    shaderLayout?: ShaderLayout;
    uniformTypes?: Record<keyof TUniforms, Record<string, ShaderUniformType>>;
  }) {
    this.name = props?.name || 'unnamed';

    // TODO - Extract uniform layout from the shaderLayout object
    if (props?.name && props?.shaderLayout) {
      const binding = props?.shaderLayout.bindings?.find(
        binding_ => binding_.type === 'uniform' && binding_.name === props?.name
      );
      if (!binding) {
        throw new Error(props?.name);
      }

      const uniformBlock = binding as UniformBufferBindingLayout;
      for (const uniform of uniformBlock.uniforms || []) {
        this.bindingLayout[uniform.name] = uniform;
      }
    }
  }

  /** Set a map of uniforms */
  setUniforms(uniforms: Partial<TUniforms>): void {
    for (const [key, value] of Object.entries(uniforms)) {
      this._setUniform(key, value);
      if (!this.needsRedraw) {
        this.setNeedsRedraw(`${this.name}.${key}=${value}`);
      }
    }
  }

  setNeedsRedraw(reason: string): void {
    this.needsRedraw = this.needsRedraw || reason;
  }

  /** Returns all uniforms */
  getAllUniforms(): Record<string, UniformValue> {
    // @ts-expect-error
    this.modifiedUniforms = {};
    this.needsRedraw = false;
    return (this.uniforms || {}) as Record<string, UniformValue>;
  }

  /** Set a single uniform */
  private _setUniform(key: keyof TUniforms, value: UniformValue) {
    if (arrayEqual(this.uniforms[key], value)) {
      return;
    }
    this.uniforms[key] = arrayCopy(value);
    this.modifiedUniforms[key] = true;
    this.modified = true;
  }
}
