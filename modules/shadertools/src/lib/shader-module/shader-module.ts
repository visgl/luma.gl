// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumericArray} from '@math.gl/types';
import {Sampler, Texture} from '@luma.gl/core';
import type {UniformFormat} from '../../types';
import {
  PropType,
  PropValidator,
  makePropValidators,
  getValidatedProperties
} from '../filters/prop-types';
import {ShaderInjection, normalizeInjections} from '../shader-assembly/shader-injections';

export type BindingValue = Buffer | Texture | Sampler;
export type UniformValue = number | boolean | Readonly<NumericArray>;
// Float32Array> | Readonly<Int32Array> | Readonly<Uint32Array> | Readonly<number[]>;

export type UniformInfo = {
  format?: UniformFormat;
} & PropType;

/**
 * A shader module definition object
 *
 * @note Needs to be initialized with `initializeShaderModules`
 */
export type ShaderModule<
  PropsT extends Record<string, unknown> = Record<string, unknown>,
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>,
  BindingsT extends Record<string, BindingValue> = Record<string, BindingValue>
> = {
  /** Used for type inference not for values */
  props?: PropsT;
  /** Used for type inference, not currently used for values */
  uniforms?: UniformsT;

  name: string;

  /** WGSL code */
  source?: string;
  /** GLSL fragment shader code */
  fs?: string;
  /** GLSL vertex shader code */
  vs?: string;

  /** Uniform shader types @note: Both order and types MUST match uniform block declarations in shader */
  uniformTypes?: Record<keyof UniformsT, UniformFormat>;
  /** Uniform JS prop types  */
  propTypes?: Record<keyof UniformsT, UniformInfo>;
  /** Default uniform values */
  defaultUniforms?: Required<UniformsT>; // Record<keyof UniformsT, UniformValue>;

  /** Function that maps props to uniforms & bindings */
  getUniforms?: (props?: any, oldProps?: any) => Record<string, BindingValue | UniformValue>;

  /** uniform buffers, textures, samplers, storage, ... */
  bindings?: Record<keyof BindingsT, {location: number; type: 'texture' | 'sampler' | 'uniforms'}>;

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

  if (propTypes) {
    const defaultProps = Object.entries(propTypes).reduce(
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
    const defaultUniforms = getShaderModuleUniforms(module, defaultProps);
    module.defaultUniforms = {...module.defaultUniforms, ...defaultUniforms} as any;
  }
}

/** Convert module props to uniforms */
export function getShaderModuleUniforms<
  ShaderModuleT extends ShaderModule<Record<string, unknown>, Record<string, UniformValue>>
>(
  module: ShaderModuleT,
  props?: ShaderModuleT['props'],
  oldUniforms?: ShaderModuleT['uniforms']
): Record<string, BindingValue | UniformValue> {
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
