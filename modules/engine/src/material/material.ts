// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Buffer, Sampler, Texture, TextureView, UniformStore} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {DynamicTexture} from '../dynamic-texture/dynamic-texture';
import {ShaderInputs} from '../shader-inputs';
import {shaderModuleHasUniforms} from '../utils/shader-module-utils';

export type MaterialProps = {
  shaderInputs?: ShaderInputs;
  modules?: ShaderModule[];
  bindings?: Record<string, Binding | DynamicTexture>;
};

export class Material {
  readonly device: Device;
  readonly shaderInputs: ShaderInputs;
  readonly bindings: Record<string, Binding | DynamicTexture> = {};

  private _uniformStore: UniformStore;

  constructor(device: Device, props: MaterialProps = {}) {
    this.device = device;

    const moduleMap = Object.fromEntries(props.modules?.map(module => [module.name, module]) || []);
    this.shaderInputs = props.shaderInputs || new ShaderInputs(moduleMap);
    this._uniformStore = new UniformStore(this.shaderInputs.modules);

    for (const [moduleName, module] of Object.entries(this.shaderInputs.modules)) {
      if (shaderModuleHasUniforms(module)) {
        const uniformBuffer = this._uniformStore.getManagedUniformBuffer(this.device, moduleName);
        this.bindings[`${moduleName}Uniforms`] = uniformBuffer;
      }
    }

    if (props.bindings) {
      this.setBindings(props.bindings);
    }
  }

  destroy(): void {
    this._uniformStore.destroy();
  }

  setProps(props: Record<string, Record<string, unknown>>): void {
    this.shaderInputs.setProps(props);
    this.updateShaderInputs();
  }

  setBindings(bindings: Record<string, Binding | DynamicTexture>): void {
    Object.assign(this.bindings, bindings);
  }

  updateShaderInputs(): void {
    this._uniformStore.setUniforms(this.shaderInputs.getUniformValues());
    this.setBindings(this.shaderInputs.getBindingValues());
  }

  getBindings(): Record<string, Binding> {
    const validBindings: Record<string, Binding> = {};

    for (const [name, binding] of Object.entries(this.bindings)) {
      if (binding instanceof DynamicTexture) {
        if (binding.isReady) {
          validBindings[name] = binding.texture;
        }
      } else {
        validBindings[name] = binding;
      }
    }

    return validBindings;
  }

  getBindingsUpdateTimestamp(): number {
    let timestamp = 0;
    for (const binding of Object.values(this.bindings)) {
      if (binding instanceof TextureView) {
        timestamp = Math.max(timestamp, binding.texture.updateTimestamp);
      } else if (binding instanceof Buffer || binding instanceof Texture) {
        timestamp = Math.max(timestamp, binding.updateTimestamp);
      } else if (binding instanceof DynamicTexture) {
        timestamp = binding.texture
          ? Math.max(timestamp, binding.texture.updateTimestamp)
          : Infinity;
      } else if (!(binding instanceof Sampler)) {
        timestamp = Math.max(timestamp, binding.buffer.updateTimestamp);
      }
    }
    return timestamp;
  }
}
