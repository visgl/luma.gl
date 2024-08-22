// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {UniformFormat} from '../../types';
import {
  PropType,
  PropValidator,
  makePropValidators,
  getValidatedProperties
} from '../filters/prop-types';
import type {UniformTypes, UniformValue} from '../utils/uniform-types';
import {ShaderInjection, normalizeInjections} from '../shader-assembly/shader-injections';

// To avoid dependency on core module, do not import `Binding` type.
// The ShaderModule is not concerned with the type of `Binding`,
// it is the repsonsibility of `splitUniformsAndBindings` in
// ShaderInputs to type the result of `getUniforms()`
type Binding = unknown; // import type {Binding} from '@luma.gl/core';

export type UniformInfo = {
  format?: UniformFormat;
} & PropType;

// Helper types
type BindingKeys<T> = {[K in keyof T]: T[K] extends UniformValue ? never : K}[keyof T];
type UniformKeys<T> = {[K in keyof T]: T[K] extends UniformValue ? K : never}[keyof T];
export type PickBindings<T> = {[K in BindingKeys<Required<T>>]: T[K]};
export type PickUniforms<T> = {[K in UniformKeys<Required<T>>]: T[K]};

/**
 * A shader module definition object
 *
 * @note Needs to be initialized with `initializeShaderModules`
 * @note `UniformsT` & `BindingsT` are deduced from `PropsT` by default. If
 * a custom type for `UniformsT` is used, `BindingsT` should be also be provided.
 */
export type ShaderModule<
  PropsT extends Record<string, any> = Record<string, any>,
  UniformsT extends Record<string, UniformValue> = PickUniforms<PropsT>,
  BindingsT extends Record<string, Binding> = PickBindings<PropsT>
> = {
  /** Used for type inference not for values */
  props?: PropsT;
  /** Used for type inference, not currently used for values */
  uniforms?: UniformsT;
  /** Used for type inference, not currently used for values */
  bindings?: BindingsT;

  name: string;

  /** WGSL code */
  source?: string;
  /** GLSL fragment shader code */
  fs?: string;
  /** GLSL vertex shader code */
  vs?: string;

  /** Uniform shader types @note: Both order and types MUST match uniform block declarations in shader */
  uniformTypes?: Required<UniformTypes<UniformsT>>; // Record<keyof UniformsT, UniformFormat>;
  /** Uniform JS prop types  */
  propTypes?: Record<keyof UniformsT, UniformInfo>;
  /** Default uniform values */
  defaultUniforms?: Required<UniformsT>; // Record<keyof UniformsT, UniformValue>;

  /** Function that maps props to uniforms & bindings */
  getUniforms?: (
    props: Partial<PropsT>,
    prevUniforms?: UniformsT
  ) => Partial<UniformsT & BindingsT>;

  defines?: Record<string, string | number>;
  /** Injections */
  inject?: Record<string, string | {injection: string; order: number}>;
  dependencies?: ShaderModule<any, any>[];
  /** Information on deprecated properties */
  deprecations?: ShaderModuleDeprecation[];

  /** The instance field contains information that is generated at run-time */
  instance?: {
    propValidators?: Record<string, PropValidator>;
    parsedDeprecations: ShaderModuleDeprecation[];

    normalizedInjections: {
      vertex: Record<string, ShaderInjection>;
      fragment: Record<string, ShaderInjection>;
    };
  };
};

/** Use to generate deprecations when shader module is used */
export type ShaderModuleDeprecation = {
  type: string;
  regex?: RegExp;
  new: string;
  old: string;
  deprecated?: boolean;
};

// SHNDER MODULE API

export function initializeShaderModules(modules: ShaderModule[]): void {
  modules.map((module: ShaderModule) => initializeShaderModule(module));
}

export function initializeShaderModule(module: ShaderModule): void {
  if (module.instance) {
    return;
  }

  initializeShaderModules(module.dependencies || []);

  const {
    propTypes = {},
    deprecations = [],
    // defines = {},
    inject = {}
  } = module;

  const instance: Required<ShaderModule>['instance'] = {
    normalizedInjections: normalizeInjections(inject),
    parsedDeprecations: parseDeprecationDefinitions(deprecations)
  };

  if (propTypes) {
    instance.propValidators = makePropValidators(propTypes);
  }

  module.instance = instance;

  // TODO(ib) - we need to apply the original prop types to the default uniforms
  let defaultProps: ShaderModule['props'] = {};
  if (propTypes) {
    defaultProps = Object.entries(propTypes).reduce(
      (obj: ShaderModule['props'], [key, propType]) => {
        // @ts-expect-error
        const value = propType?.value;
        if (value) {
          // @ts-expect-error
          obj[key] = value;
        }
        return obj;
      },
      {} as ShaderModule['props']
    );
  }

  module.defaultUniforms = {...module.defaultUniforms, ...defaultProps} as any;
}

/** Convert module props to uniforms */
export function getShaderModuleUniforms<
  ShaderModuleT extends ShaderModule<Record<string, unknown>, Record<string, UniformValue>>
>(
  module: ShaderModuleT,
  props?: ShaderModuleT['props'],
  oldUniforms?: ShaderModuleT['uniforms']
): Record<string, Binding | UniformValue> {
  initializeShaderModule(module);

  const uniforms = oldUniforms || {...module.defaultUniforms};
  // If module has a getUniforms function, use it
  if (props && module.getUniforms) {
    return module.getUniforms(props, uniforms);
  }

  // Build uniforms from the uniforms array
  // @ts-expect-error
  return getValidatedProperties(props, module.instance?.propValidators, module.name);
}

/* TODO this looks like it was unused code
  _defaultGetUniforms(opts: Record<string, any> = {}): Record<string, any> {
    const uniforms: Record<string, any> = {};
    const propTypes = this.uniforms;

    for (const key in propTypes) {
      const propDef = propTypes[key];
      if (key in opts && !propDef.private) {
        if (propDef.validate) {
          assert(propDef.validate(opts[key], propDef), `${this.name}: invalid ${key}`);
        }
        uniforms[key] = opts[key];
      } else {
        uniforms[key] = propDef.value;
      }
    }

    return uniforms;
  }
}
*/
// Warn about deprecated uniforms or functions
export function checkShaderModuleDeprecations(
  shaderModule: ShaderModule,
  shaderSource: string,
  log: any
): void {
  shaderModule.deprecations?.forEach(def => {
    if (def.regex?.test(shaderSource)) {
      if (def.deprecated) {
        log.deprecated(def.old, def.new)();
      } else {
        log.removed(def.old, def.new)();
      }
    }
  });
}

// HELPERS

function parseDeprecationDefinitions(deprecations: ShaderModuleDeprecation[]) {
  deprecations.forEach(def => {
    switch (def.type) {
      case 'function':
        def.regex = new RegExp(`\\b${def.old}\\(`);
        break;
      default:
        def.regex = new RegExp(`${def.type} ${def.old};`);
    }
  });

  return deprecations;
}
