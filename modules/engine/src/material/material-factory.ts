// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding, BindingsByGroup, Device} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {ShaderInputs} from '../shader-inputs';
import type {Material, MaterialProps} from './material';
import {Material as MaterialClass} from './material';

type MaterialModuleProps = Partial<Record<string, Record<string, unknown>>>;
type MaterialBindings = Record<
  string,
  | Binding
  | import('../dynamic-texture/dynamic-texture').DynamicTexture
  | import('../dynamic-buffer/dynamic-buffer').DynamicBuffer
  | import('../dynamic-buffer/dynamic-buffer').DynamicBufferRange
>;

/** Logical bind-group slot reserved for material-owned bindings. */
export const MATERIAL_BIND_GROUP = 3;

/** Construction props for {@link MaterialFactory}. */
export type MaterialFactoryProps = {
  /** Shader modules that define the material schema for bind group `3`. */
  modules?: ShaderModule[];
};

/**
 * Creates typed {@link Material} instances for a stable material binding schema.
 *
 * @example
 * ```ts
 * const pbrFactory = new MaterialFactory<
 *   {pbrMaterial: PBRMaterialUniforms},
 *   PBRMaterialBindings
 * >(device, {modules: [pbrMaterial]});
 * const pbr = pbrFactory.createMaterial();
 * pbr.setProps({pbrMaterial: {baseColorFactor: [1, 0, 0, 1]}});
 * const pbrVariant = pbr.clone({bindings: {pbr_baseColorSampler: texture}});
 * ```
 *
 * @example
 * ```ts
 * const phongFactory = new MaterialFactory<
 *   {phongMaterial: PhongMaterialProps},
 *   {}
 * >(device, {modules: [phongMaterial]});
 * const phong = phongFactory.createMaterial();
 * phong.setProps({phongMaterial: {ambient: 0.4, diffuse: 0.7}});
 * const phongVariant = phong.clone({moduleProps: {phongMaterial: {shininess: 64}}});
 * ```
 *
 * @example
 * ```ts
 * const gouraudFactory = new MaterialFactory<
 *   {gouraudMaterial: GouraudMaterialProps},
 *   {}
 * >(device, {modules: [gouraudMaterial]});
 * const gouraud = gouraudFactory.createMaterial();
 * gouraud.setProps({gouraudMaterial: {ambient: 0.25}});
 * const gouraudVariant = gouraud.clone({moduleProps: {gouraudMaterial: {diffuse: 0.8}}});
 * ```
 */
export class MaterialFactory<
  TModuleProps extends MaterialModuleProps = MaterialModuleProps,
  TBindings extends MaterialBindings = MaterialBindings
> {
  /** Device that creates materials for this schema. */
  readonly device: Device;
  /** Shader modules that define the material schema. */
  readonly modules: ShaderModule[];

  private _materialBindingNames: Set<string>;
  private _materialModuleNames: Set<string>;

  constructor(device: Device, props: MaterialFactoryProps = {}) {
    this.device = device;
    this.modules = props.modules || [];

    const shaderInputs = new ShaderInputs(
      Object.fromEntries(this.modules.map(module => [module.name, module]))
    );
    this._materialBindingNames = getMaterialBindingNames(shaderInputs);
    this._materialModuleNames = getMaterialModuleNames(shaderInputs);
  }

  /** Creates one typed material instance for this factory's schema. */
  createMaterial(
    props: Omit<MaterialProps<TModuleProps, TBindings>, 'factory' | 'modules'> = {}
  ): Material<TModuleProps, TBindings> {
    return new MaterialClass<TModuleProps, TBindings>(this.device, {
      ...props,
      factory: this
    });
  }

  /** Returns the logical material-owned resource binding names. */
  getBindingNames(): string[] {
    return Array.from(this._materialBindingNames);
  }

  /** Returns `true` when the supplied binding belongs to this material schema. */
  ownsBinding(bindingName: string): boolean {
    if (this._materialBindingNames.has(bindingName)) {
      return true;
    }

    const aliasedModuleName = getModuleNameFromUniformBinding(bindingName);
    return aliasedModuleName ? this._materialModuleNames.has(aliasedModuleName) : false;
  }

  /** Returns `true` when the supplied shader module is owned by this material schema. */
  ownsModule(moduleName: string): boolean {
    return this._materialModuleNames.has(moduleName);
  }

  /** Packages resolved material bindings into bind group `3`. */
  getBindingsByGroup(
    bindings: Partial<{[K in keyof TBindings]: Binding}> & Record<string, Binding>
  ): BindingsByGroup {
    return Object.keys(bindings).length > 0 ? {[MATERIAL_BIND_GROUP]: bindings} : {};
  }
}

/** Returns the module name corresponding to an auto-generated `*Uniforms` binding. */
export function getModuleNameFromUniformBinding(bindingName: string): string | null {
  return bindingName.endsWith('Uniforms') ? bindingName.slice(0, -'Uniforms'.length) : null;
}

function getMaterialBindingNames(shaderInputs: ShaderInputs): Set<string> {
  const bindingNames = new Set<string>();

  for (const module of Object.values(shaderInputs.modules)) {
    for (const binding of module.bindingLayout || []) {
      if (binding.group === MATERIAL_BIND_GROUP) {
        bindingNames.add(binding.name);
      }
    }
  }

  return bindingNames;
}

function getMaterialModuleNames(shaderInputs: ShaderInputs): Set<string> {
  const moduleNames = new Set<string>();

  for (const module of Object.values(shaderInputs.modules)) {
    if (
      module.name &&
      module.bindingLayout?.some(
        binding => binding.group === MATERIAL_BIND_GROUP && binding.name === module.name
      )
    ) {
      moduleNames.add(module.name);
    }
  }

  return moduleNames;
}
