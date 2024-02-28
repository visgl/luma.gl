// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {UniformValue, Texture, Sampler} from '@luma.gl/core';
import {log} from '@luma.gl/core';
// import type {ShaderUniformType, UniformValue, UniformFormat, UniformInfoDevice, Texture, Sampler} from '@luma.gl/core';
import {_resolveModules, ShaderModuleInstance} from '@luma.gl/shadertools';

/** Minimal ShaderModule subset, we don't need shader code etc */
export type ShaderModuleInputs<
  PropsT extends Record<string, unknown> = Record<string, unknown>,
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>,
  BindingsT extends Record<string, Texture | Sampler> = Record<string, Texture | Sampler>
> = {
  defaultUniforms?: UniformsT;
  getUniforms?: (settings: Partial<PropsT>, prevUniforms?: UniformsT) => UniformsT;

  /** Not used. Used to access props type */
  props?: PropsT;

  bindings?: Record<
    keyof BindingsT,
    {
      location: number;
      type: 'texture' | 'sampler' | 'uniforms';
    }
  >;

  uniformTypes?: any;
};

/**
 * ShaderInputs holds uniform and binding values for one or more shader modules,
 * - It can generate binary data for any uniform buffer
 * - It can manage a uniform buffer for each block
 * - It can update managed uniform buffers with a single call
 * - It performs some book keeping on what has changed to minimize unnecessary writes to uniform buffers.
 */
export class ShaderInputs<
  ShaderPropsT extends Partial<Record<string, Record<string, unknown>>> = Partial<
    Record<string, Record<string, unknown>>
  >
> {
  /**
   * The map of modules
   * @todo should should this include the resolved dependencies?
   */
  modules: Readonly<{[P in keyof ShaderPropsT]: ShaderModuleInputs<ShaderPropsT[P]>}>;

  /** Stores the uniform values for each module */
  moduleUniforms: Record<keyof ShaderPropsT, Record<string, UniformValue>>;
  /** Stores the uniform bindings for each module  */
  moduleBindings: Record<keyof ShaderPropsT, Record<string, Texture | Sampler>>;
  /** Tracks if uniforms have changed */
  moduleUniformsChanged: Record<keyof ShaderPropsT, false | string>;

  /**
   * Create a new UniformStore instance
   * @param modules
   */
  constructor(modules: {[P in keyof ShaderPropsT]: ShaderModuleInputs<ShaderPropsT[P]>}) {
    // TODO - get all dependencies from modules
    const allModules = _resolveModules(Object.values(modules));
    log.log(
      1,
      'Creating ShaderInputs with modules',
      allModules.map(m => m.name)
    )();

    // Store the module definitions and create storage for uniform values and binding values, per module
    this.modules = modules;
    this.moduleUniforms = {} as Record<keyof ShaderPropsT, Record<string, UniformValue>>;
    this.moduleBindings = {} as Record<keyof ShaderPropsT, Record<string, Texture | Sampler>>;

    // Initialize the modules
    for (const [name, module] of Object.entries(modules)) {
      const moduleName = name as keyof ShaderPropsT;

      // Get default uniforms from module
      this.moduleUniforms[moduleName] = module.defaultUniforms || {};
      this.moduleBindings[moduleName] = {};
    }
  }

  /** Destroy */
  destroy(): void {}

  /**
   * Set module props
   */
  setProps(props: Partial<{[P in keyof ShaderPropsT]?: Partial<ShaderPropsT[P]>}>): void {
    for (const name of Object.keys(props)) {
      const moduleName = name as keyof ShaderPropsT;
      const moduleProps = props[moduleName];
      const module = this.modules[moduleName];
      if (!module) {
        // Ignore props for unregistered modules
        log.warn(`Module ${name} not found`)();
        continue; // eslint-disable-line no-continue
      }

      const oldUniforms = this.moduleUniforms[moduleName];
      const uniforms =
        module.getUniforms?.(moduleProps, this.moduleUniforms[moduleName]) || (moduleProps as any);
      // console.error(uniforms)
      this.moduleUniforms[moduleName] = {...oldUniforms, ...uniforms};
      // this.moduleUniformsChanged ||= moduleName;

      // console.log(`setProps(${String(moduleName)}`, moduleName, this.moduleUniforms[moduleName])

      // TODO - Get Module bindings
      // const bindings = module.getBindings?.(moduleProps);
      // this.moduleUniforms[moduleName] = bindings;
    }
  }

  /** Merges all bindings for the shader (from the various modules) */
  // getUniformBlocks(): Record<string, Texture | Sampler> {
  //   return this.moduleUniforms;
  // }

  /**
   * Return the map of modules
   * @todo should should this include the resolved dependencies?
   */
  getModules(): ShaderModuleInstance[] {
    return Object.values(this.modules);
  }

  /** Get all uniform values for all modules */
  getUniformValues(): Record<keyof ShaderPropsT, Record<string, UniformValue>> {
    return this.moduleUniforms;
  }

  /** Merges all bindings for the shader (from the various modules) */
  getBindings(): Record<string, Texture | Sampler> {
    const bindings = {} as Record<string, Texture | Sampler>;
    for (const moduleBindings of Object.values(this.moduleBindings)) {
      Object.assign(bindings, moduleBindings);
    }
    return bindings;
  }

  getDebugTable(): Record<string, Record<string, unknown>> {
    const table: Record<string, Record<string, unknown>> = {};
    for (const [moduleName, module] of Object.entries(this.moduleUniforms)) {
      for (const [key, value] of Object.entries(module)) {
        table[`${moduleName}.${key}`] = {
          type: this.modules[moduleName].uniformTypes?.[key],
          value: String(value)
        };
      }
    }
    return table;
  }
}
