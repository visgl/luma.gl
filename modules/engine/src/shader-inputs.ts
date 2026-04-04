// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding, CompositeShaderType} from '@luma.gl/core';
import {log} from '@luma.gl/core';
// import type {VariableShaderType, UniformValue, UniformFormat, UniformInfoDevice, Texture, Sampler} from '@luma.gl/core';
import {
  getShaderModuleDependencies,
  ShaderModule,
  ShaderModuleUniformValue
} from '@luma.gl/shadertools';
import {splitUniformsAndBindings} from './model/split-uniforms-and-bindings';

export type ShaderInputsOptions = {
  disableWarnings?: boolean;
};

type ShaderInputsModule = Pick<
  ShaderModule<any, any, any>,
  'bindingLayout' | 'defaultUniforms' | 'dependencies' | 'getUniforms' | 'name' | 'uniformTypes'
>;

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
  options: Required<ShaderInputsOptions> = {
    disableWarnings: false
  };

  /**
   * The map of modules
   * @todo should should this include the resolved dependencies?
   */
  // @ts-ignore Fix typings
  modules: Readonly<{[P in keyof ShaderPropsT]: ShaderInputsModule}>;

  /** Stores the uniform values for each module */
  moduleUniforms: Record<keyof ShaderPropsT, Record<string, ShaderModuleUniformValue>>;
  /** Stores the uniform bindings for each module  */
  moduleBindings: Record<keyof ShaderPropsT, Record<string, Binding>>;
  /** Tracks if uniforms have changed */
  // moduleUniformsChanged: Record<keyof ShaderPropsT, false | string>;

  /**
   * Create a new UniformStore instance
   * @param modules
   */
  constructor(
    // @ts-ignore Fix typings
    modules: {[P in keyof ShaderPropsT]?: ShaderInputsModule},
    options?: ShaderInputsOptions
  ) {
    Object.assign(this.options, options);

    // Extract modules with dependencies
    const resolvedModules = getShaderModuleDependencies(
      Object.values(modules).filter(isShaderInputsModuleWithDependencies)
    );
    for (const resolvedModule of resolvedModules) {
      // @ts-ignore
      modules[resolvedModule.name] = resolvedModule;
    }

    log.log(1, 'Creating ShaderInputs with modules', Object.keys(modules))();

    // Store the module definitions and create storage for uniform values and binding values, per module
    // @ts-ignore Fix typings
    this.modules = modules as {[P in keyof ShaderPropsT]: ShaderInputsModule};
    this.moduleUniforms = {} as Record<
      keyof ShaderPropsT,
      Record<string, ShaderModuleUniformValue>
    >;
    this.moduleBindings = {} as Record<keyof ShaderPropsT, Record<string, Binding>>;

    // Initialize the modules
    for (const [name, module] of Object.entries(modules)) {
      if (module) {
        this._addModule(module);
        if (module.name && name !== module.name && !this.options.disableWarnings) {
          log.warn(`Module name: ${name} vs ${module.name}`)();
        }
      }
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
      const moduleProps = props[moduleName] || {};
      const module = this.modules[moduleName];
      if (!module) {
        // Ignore props for unregistered modules
        if (!this.options.disableWarnings) {
          log.warn(`Module ${name} not found`)();
        }
      } else {
        const oldUniforms = this.moduleUniforms[moduleName];
        const oldBindings = this.moduleBindings[moduleName];
        const uniformsAndBindings =
          module.getUniforms?.(moduleProps, oldUniforms) || (moduleProps as any);

        const {uniforms, bindings} = splitUniformsAndBindings(
          uniformsAndBindings,
          module.uniformTypes as Readonly<Record<string, CompositeShaderType>>
        );
        this.moduleUniforms[moduleName] = mergeModuleUniforms(
          oldUniforms as Record<string, ShaderModuleUniformValue>,
          uniforms,
          module.uniformTypes as Readonly<Record<string, CompositeShaderType>>
        );
        this.moduleBindings[moduleName] = {...oldBindings, ...bindings};
        // this.moduleUniformsChanged ||= moduleName;
      }

      // console.log(`setProps(${String(moduleName)}`, moduleName, this.moduleUniforms[moduleName])
    }
  }

  /**
   * Return the map of modules
   * @todo should should this include the resolved dependencies?
   */
  getModules(): ShaderModule[] {
    return Object.values(this.modules) as ShaderModule[];
  }

  /** Get all uniform values for all modules */
  getUniformValues(): Partial<
    Record<keyof ShaderPropsT, Record<string, ShaderModuleUniformValue>>
  > {
    return this.moduleUniforms;
  }

  /** Merges all bindings for the shader (from the various modules) */
  getBindingValues(): Record<string, Binding> {
    const bindings = {} as Record<string, Binding>;
    for (const moduleBindings of Object.values(this.moduleBindings)) {
      Object.assign(bindings, moduleBindings);
    }
    return bindings;
  }

  /**
   * Gets binding values for a single shader module without flattening them into the full shader map.
   *
   * This is used by systems such as {@link ShaderPassRenderer} that execute one shader module at a
   * time and need the defaults for just that module.
   */
  getModuleBindingValues(moduleName: keyof ShaderPropsT | string): Record<string, Binding> {
    const moduleBindings = this.moduleBindings[moduleName as keyof ShaderPropsT];
    return moduleBindings ? {...moduleBindings} : {};
  }

  // INTERNAL

  /** Return a debug table that can be used for console.table() or log.table() */
  getDebugTable(): Record<string, Record<string, unknown>> {
    const table: Record<string, Record<string, unknown>> = {};
    for (const [moduleName, module] of Object.entries(this.moduleUniforms)) {
      for (const [key, value] of Object.entries(module)) {
        table[`${moduleName}.${key}`] = {
          type: this.modules[moduleName].uniformTypes?.[key as keyof ShaderPropsT],
          value: String(value)
        };
      }
    }
    return table;
  }

  _addModule(module: ShaderInputsModule): void {
    const moduleName = module.name as keyof ShaderPropsT;
    // Get default uniforms from module
    this.moduleUniforms[moduleName] = mergeModuleUniforms(
      {},
      (module.defaultUniforms || {}) as Record<string, ShaderModuleUniformValue>,
      module.uniformTypes as Readonly<Record<string, CompositeShaderType>>
    );
    this.moduleBindings[moduleName] = {};
  }
}

function mergeModuleUniforms(
  currentUniforms: Record<string, ShaderModuleUniformValue> = {},
  nextUniforms: Record<string, ShaderModuleUniformValue> = {},
  uniformTypes: Readonly<Record<string, CompositeShaderType>> = {}
): Record<string, ShaderModuleUniformValue> {
  const mergedUniforms = {...currentUniforms};
  for (const [key, value] of Object.entries(nextUniforms)) {
    if (value !== undefined) {
      mergedUniforms[key] = mergeModuleUniformValue(currentUniforms[key], value, uniformTypes[key]);
    }
  }
  return mergedUniforms;
}

function mergeModuleUniformValue(
  currentValue: ShaderModuleUniformValue | undefined,
  nextValue: ShaderModuleUniformValue,
  uniformType: CompositeShaderType | undefined
): ShaderModuleUniformValue {
  if (!uniformType || typeof uniformType === 'string') {
    return cloneModuleUniformValue(nextValue);
  }

  if (Array.isArray(uniformType)) {
    if (isPackedUniformArrayValue(nextValue) || !Array.isArray(nextValue)) {
      return cloneModuleUniformValue(nextValue);
    }

    const currentArray: Array<ShaderModuleUniformValue | undefined> =
      Array.isArray(currentValue) && !isPackedUniformArrayValue(currentValue)
        ? [...currentValue]
        : [];
    const mergedArray = currentArray.slice();
    for (let index = 0; index < nextValue.length; index++) {
      const elementValue = nextValue[index];
      if (elementValue !== undefined) {
        mergedArray[index] = mergeModuleUniformValue(
          currentArray[index],
          elementValue,
          uniformType[0] as CompositeShaderType
        );
      }
    }
    return mergedArray;
  }

  if (!isPlainUniformObject(nextValue)) {
    return cloneModuleUniformValue(nextValue);
  }

  const uniformStruct = uniformType as Record<string, CompositeShaderType>;
  const currentObject = isPlainUniformObject(currentValue) ? currentValue : {};
  const mergedObject: Record<string, ShaderModuleUniformValue | undefined> = {...currentObject};
  for (const [key, value] of Object.entries(nextValue)) {
    if (value !== undefined) {
      mergedObject[key] = mergeModuleUniformValue(currentObject[key], value, uniformStruct[key]);
    }
  }
  return mergedObject as ShaderModuleUniformValue;
}

function cloneModuleUniformValue(value: ShaderModuleUniformValue): ShaderModuleUniformValue {
  if (ArrayBuffer.isView(value)) {
    return Array.prototype.slice.call(value) as ShaderModuleUniformValue;
  }

  if (Array.isArray(value)) {
    if (isPackedUniformArrayValue(value)) {
      return value.slice() as ShaderModuleUniformValue;
    }

    const compositeArray = value as ReadonlyArray<ShaderModuleUniformValue | undefined>;
    return compositeArray.map(element =>
      element === undefined ? undefined : cloneModuleUniformValue(element)
    ) as ShaderModuleUniformValue;
  }

  if (isPlainUniformObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        nestedValue === undefined ? undefined : cloneModuleUniformValue(nestedValue)
      ])
    ) as ShaderModuleUniformValue;
  }

  return value;
}

function isPackedUniformArrayValue(
  value: unknown
): value is ReadonlyArray<number> | ArrayBufferView {
  return (
    ArrayBuffer.isView(value) ||
    (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'number'))
  );
}

function isPlainUniformObject(
  value: unknown
): value is Record<string, ShaderModuleUniformValue | undefined> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !ArrayBuffer.isView(value)
  );
}

function isShaderInputsModuleWithDependencies(
  module: ShaderInputsModule | undefined
): module is ShaderInputsModule & {dependencies: NonNullable<ShaderInputsModule['dependencies']>} {
  return Boolean(module?.dependencies);
}
