// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding, BindingsByGroup, Device} from '@luma.gl/core';
import {Buffer, Sampler, Texture, TextureView, UniformStore} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {DynamicTexture} from '../dynamic-texture/dynamic-texture';
import {ShaderInputs} from '../shader-inputs';
import {shaderModuleHasUniforms} from '../utils/shader-module-utils';
import {uid} from '../utils/uid';
import {
  getModuleNameFromUniformBinding,
  MATERIAL_BIND_GROUP,
  MaterialFactory
} from './material-factory';

type MaterialModuleProps = Record<string, Record<string, unknown>>;

export type MaterialProps = {
  id?: string;
  factory?: MaterialFactory;
  shaderInputs?: ShaderInputs;
  modules?: ShaderModule[];
  bindings?: Record<string, Binding | DynamicTexture>;
};

export type MaterialCloneProps = {
  id?: string;
  bindings?: Record<string, Binding | DynamicTexture>;
  moduleProps?: MaterialModuleProps;
  shaderInputs?: ShaderInputs;
};

export class Material {
  readonly id: string;
  readonly device: Device;
  readonly factory: MaterialFactory;
  readonly shaderInputs: ShaderInputs;
  readonly bindings: Record<string, Binding | DynamicTexture> = {};

  private _uniformStore: UniformStore;
  private _bindGroupCacheToken: object = {};

  constructor(device: Device, props: MaterialProps = {}) {
    this.id = props.id || uid('material');
    this.device = device;

    this.factory =
      props.factory ||
      new MaterialFactory(device, {
        modules: props.modules || props.shaderInputs?.getModules() || []
      });

    const moduleMap = Object.fromEntries(
      (props.shaderInputs?.getModules() || this.factory.modules).map(module => [
        module.name,
        module
      ])
    );
    this.shaderInputs = props.shaderInputs || new ShaderInputs(moduleMap);
    this._uniformStore = new UniformStore(this.shaderInputs.modules);

    for (const [moduleName, module] of Object.entries(this.shaderInputs.modules)) {
      if (this.ownsModule(moduleName) && shaderModuleHasUniforms(module)) {
        const uniformBuffer = this._uniformStore.getManagedUniformBuffer(this.device, moduleName);
        this.bindings[`${moduleName}Uniforms`] = uniformBuffer;
      }
    }

    this.updateShaderInputs();
    if (props.bindings) {
      this.setResources(props.bindings);
    }
  }

  destroy(): void {
    this._uniformStore.destroy();
  }

  clone(props: MaterialCloneProps = {}): Material {
    const material = this.factory.createMaterial({id: props.id, shaderInputs: props.shaderInputs});
    material.setProps(this.shaderInputs.getUniformValues() as MaterialModuleProps);
    material.setResources(this.getResourceBindings());

    if (props.moduleProps) {
      material.setProps(props.moduleProps);
    }
    if (props.bindings) {
      material.setResources(props.bindings);
    }

    return material;
  }

  ownsBinding(bindingName: string): boolean {
    return this.factory.ownsBinding(bindingName);
  }

  ownsModule(moduleName: string): boolean {
    return this.factory.ownsModule(moduleName);
  }

  setProps(props: MaterialModuleProps): void {
    this.shaderInputs.setProps(props);
    this.updateShaderInputs();
  }

  setBindings(bindings: Record<string, Binding | DynamicTexture>): void {
    this.setResources(bindings);
  }

  setResources(bindings: Record<string, Binding | DynamicTexture>): void {
    const didChange = this._setOwnedBindings(bindings);
    if (didChange) {
      this._bindGroupCacheToken = {};
    }
  }

  updateShaderInputs(): void {
    this._uniformStore.setUniforms(this.shaderInputs.getUniformValues());
    const didChange = this._setOwnedBindings(this.shaderInputs.getBindingValues());
    if (didChange) {
      this._bindGroupCacheToken = {};
    }
  }

  getResourceBindings(): Record<string, Binding | DynamicTexture> {
    const resourceBindings: Record<string, Binding | DynamicTexture> = {};

    for (const [name, binding] of Object.entries(this.bindings)) {
      if (!getModuleNameFromUniformBinding(name)) {
        resourceBindings[name] = binding;
      }
    }

    return resourceBindings;
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

  getBindingsByGroup(): BindingsByGroup {
    return this.factory.getBindingsByGroup(this.getBindings());
  }

  getBindGroupCacheKey(group: number): object | null {
    return group === MATERIAL_BIND_GROUP ? this._bindGroupCacheToken : null;
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

  private _setOwnedBindings(bindings: Record<string, Binding | DynamicTexture>): boolean {
    let didChange = false;

    for (const [name, binding] of Object.entries(bindings)) {
      if (!this.ownsBinding(name)) {
        continue;
      }

      if (this.bindings[name] !== binding) {
        this.bindings[name] = binding;
        didChange = true;
      }
    }

    return didChange;
  }
}
