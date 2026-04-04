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

type MaterialModuleProps = Partial<Record<string, Record<string, unknown>>>;
type MaterialBindings = Record<string, Binding | DynamicTexture>;
type MaterialPropsUpdate<TModuleProps extends MaterialModuleProps> = Partial<{
  [P in keyof TModuleProps]?: Partial<TModuleProps[P]>;
}>;

/** Construction props for one typed {@link Material}. */
export type MaterialProps<
  TModuleProps extends MaterialModuleProps = MaterialModuleProps,
  TBindings extends MaterialBindings = MaterialBindings
> = {
  /** Optional application-provided identifier. */
  id?: string;
  /** Factory that owns the material schema. */
  factory?: MaterialFactory<TModuleProps, TBindings>;
  /** Optional pre-created shader inputs for the material modules. */
  shaderInputs?: ShaderInputs<TModuleProps>;
  /** Shader modules used when a factory is not supplied. */
  modules?: ShaderModule[];
  /** Initial material-owned resource bindings. */
  bindings?: Partial<TBindings>;
};

/** Structural overrides applied when cloning a {@link Material}. */
export type MaterialCloneProps<
  TModuleProps extends MaterialModuleProps = MaterialModuleProps,
  TBindings extends MaterialBindings = MaterialBindings
> = {
  /** Optional identifier for the cloned material. */
  id?: string;
  /** Replacement material-owned resource bindings. */
  bindings?: Partial<TBindings>;
  /** Additional uniform/module props applied to the clone. */
  moduleProps?: MaterialPropsUpdate<TModuleProps>;
  /** Optional full replacement shader-input store. */
  shaderInputs?: ShaderInputs<TModuleProps>;
};

/**
 * Material owns bind group `3` resources and uniforms for one material instance.
 *
 * `setProps()` mutates uniform values in place. Structural resource changes are
 * expressed through `clone({...})`, which creates a new material identity.
 */
export class Material<
  TModuleProps extends MaterialModuleProps = MaterialModuleProps,
  TBindings extends MaterialBindings = MaterialBindings
> {
  /** Application-provided identifier. */
  readonly id: string;
  /** Device that owns the material resources. */
  readonly device: Device;
  /** Factory that defines the material schema. */
  readonly factory: MaterialFactory<TModuleProps, TBindings>;
  /** Shader inputs for the material-owned modules. */
  readonly shaderInputs: ShaderInputs<TModuleProps>;
  /** Internal binding store including uniform buffers and resource bindings. */
  readonly bindings: Record<string, Binding | DynamicTexture> = {};

  private _uniformStore: UniformStore;
  private _bindGroupCacheToken: object = {};

  constructor(device: Device, props: MaterialProps<TModuleProps, TBindings> = {}) {
    this.id = props.id || uid('material');
    this.device = device;

    this.factory =
      props.factory ||
      new MaterialFactory<TModuleProps, TBindings>(device, {
        modules: props.modules || props.shaderInputs?.getModules() || []
      });

    const moduleMap = Object.fromEntries(
      (props.shaderInputs?.getModules() || this.factory.modules).map(module => [
        module.name,
        module
      ])
    ) as {[P in keyof TModuleProps]?: ShaderModule[] extends never ? never : any};
    this.shaderInputs = props.shaderInputs || new ShaderInputs<TModuleProps>(moduleMap);
    this._uniformStore = new UniformStore(this.device, this.shaderInputs.modules);

    for (const [moduleName, module] of Object.entries(this.shaderInputs.modules)) {
      if (this.ownsModule(moduleName) && shaderModuleHasUniforms(module)) {
        const uniformBuffer = this._uniformStore.getManagedUniformBuffer(moduleName);
        this.bindings[`${moduleName}Uniforms`] = uniformBuffer;
      }
    }

    this.updateShaderInputs();
    if (props.bindings) {
      this._replaceOwnedBindings(props.bindings);
    }
  }

  /** Destroys managed uniform-buffer resources owned by this material. */
  destroy(): void {
    this._uniformStore.destroy();
  }

  /** Creates a new material variant with optional structural and uniform overrides. */
  clone(
    props: MaterialCloneProps<TModuleProps, TBindings> = {}
  ): Material<TModuleProps, TBindings> {
    const material = this.factory.createMaterial({
      id: props.id,
      shaderInputs: props.shaderInputs,
      bindings: {
        ...this.getResourceBindings(),
        ...props.bindings
      }
    });

    if (!props.shaderInputs) {
      material.setProps(this.shaderInputs.getUniformValues() as MaterialPropsUpdate<TModuleProps>);
    }
    if (props.moduleProps) {
      material.setProps(props.moduleProps);
    }
    return material;
  }

  /** Returns `true` if this material owns the supplied binding name. */
  ownsBinding(bindingName: string): boolean {
    return this.factory.ownsBinding(bindingName);
  }

  /** Returns `true` if this material owns the supplied shader module. */
  ownsModule(moduleName: string): boolean {
    return this.factory.ownsModule(moduleName);
  }

  /** Updates material uniform/module props in place without changing material identity. */
  setProps(props: MaterialPropsUpdate<TModuleProps>): void {
    this.shaderInputs.setProps(props);
    this.updateShaderInputs();
  }

  /** Updates managed uniform buffers and shader-input-owned bindings. */
  updateShaderInputs(): void {
    this._uniformStore.setUniforms(this.shaderInputs.getUniformValues());
    const didChange = this._setOwnedBindings(this.shaderInputs.getBindingValues());
    if (didChange) {
      this._bindGroupCacheToken = {};
    }
  }

  /** Returns the material-owned resource bindings without internal uniform buffers. */
  getResourceBindings(): Partial<TBindings> {
    const resourceBindings = {} as Partial<TBindings>;

    for (const [name, binding] of Object.entries(this.bindings)) {
      if (!getModuleNameFromUniformBinding(name)) {
        (resourceBindings as Record<string, Binding | DynamicTexture>)[name] = binding;
      }
    }

    return resourceBindings;
  }

  /** Returns the resolved bindings, including internal uniform buffers and ready textures. */
  getBindings(): Partial<{[K in keyof TBindings]: Binding}> & Record<string, Binding> {
    const validBindings = {} as Partial<{[K in keyof TBindings]: Binding}> &
      Record<string, Binding>;
    const validBindingsMap = validBindings as Record<string, Binding>;

    for (const [name, binding] of Object.entries(this.bindings)) {
      if (binding instanceof DynamicTexture) {
        if (binding.isReady) {
          validBindingsMap[name] = binding.texture;
        }
      } else {
        validBindingsMap[name] = binding;
      }
    }

    return validBindings;
  }

  /** Packages resolved material bindings into logical bind group `3`. */
  getBindingsByGroup(): BindingsByGroup {
    return this.factory.getBindingsByGroup(this.getBindings());
  }

  /** Returns the stable bind-group cache token for the requested bind group. */
  getBindGroupCacheKey(group: number): object | null {
    return group === MATERIAL_BIND_GROUP ? this._bindGroupCacheToken : null;
  }

  /** Returns the latest update timestamp across material-owned resources. */
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

  /** Replaces owned resource bindings and invalidates the material cache identity when needed. */
  private _replaceOwnedBindings(bindings: Partial<TBindings>): void {
    const didChange = this._setOwnedBindings(bindings);
    if (didChange) {
      this._bindGroupCacheToken = {};
    }
  }

  private _setOwnedBindings(
    bindings: Partial<TBindings> | Record<string, Binding | DynamicTexture>
  ): boolean {
    let didChange = false;

    for (const [name, binding] of Object.entries(bindings)) {
      if (binding === undefined) {
        continue;
      }
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
