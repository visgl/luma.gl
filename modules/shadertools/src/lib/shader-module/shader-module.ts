// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray} from '@math.gl/types';
import type {UniformFormat} from '../../types';
import {PropType, PropValidator} from '../filters/prop-types';
import {ShaderInjection} from '../shader-assembly/shader-injections';
import {makePropValidators, getValidatedProperties} from '../filters/prop-types';
import {normalizeInjections} from '../shader-assembly/shader-injections';

export type UniformValue = number | boolean | Readonly<NumberArray>; // Float32Array> | Readonly<Int32Array> | Readonly<Uint32Array> | Readonly<number[]>;

export type UniformInfo = {
  format?: UniformFormat;
} & PropType;

/**
 * A shader module definition object
 * @note Needs to be initialized with `initializeShaderModules`
 */
export type ShaderModule<
  PropsT extends Record<string, unknown> = Record<string, unknown>,
  UniformsT extends Record<string, UniformValue> = Record<string, UniformValue>,
  BindingsT extends Record<string, unknown> = {}
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
  uniformPropTypes?: Record<keyof UniformsT, UniformInfo>;
  /** Default uniform values */
  defaultUniforms?: Required<UniformsT>; // Record<keyof UniformsT, UniformValue>;

  /** Function that maps settings to uniforms */
  // getUniforms?: (settings?: Partial<SettingsT>, prevUniforms?: any /* UniformsT */) => UniformsT;
  getUniforms?: (settings?: any, prevUniforms?: any) => Record<string, UniformValue>;

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
    dependencies: ShaderModule[];
    propValidators?: Record<string, PropValidator>;
    getModuleUniforms: Function;
    deprecations: ShaderModuleDeprecation[];
    defines: Record<string, string | number>;
    injections: {
      vertex: Record<string, ShaderInjection>;
      fragment: Record<string, ShaderInjection>;
    };
    uniforms: Record<string, PropValidator>;
    uniformTypes: Record<string, PropValidator>;
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
    uniformPropTypes = {},
    getUniforms,
    deprecations = [],
    // defines = {},
    inject = {}
  } = module;

  const instance: Required<ShaderModule>['instance'] = {
    dependencies: module.dependencies || [],
    injections: normalizeInjections(inject),
    deprecations: parseDeprecationDefinitions(deprecations),
    // @ts-expect-error
    getModuleUniforms: getUniforms
  };

  if (uniformPropTypes) {
    instance.uniforms = makePropValidators(uniformPropTypes);
  }

  // @ts-expect-error
  instance.getUniforms = function getUniforms(
    userProps: Record<string, any>,
    uniforms: Record<string, any>
  ): Record<string, any> {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self: ShaderModule = this;
    if (self.instance?.getModuleUniforms) {
      // @ts-expect-error
      return self.getModuleUniforms(userProps, uniforms);
    }
    // Build uniforms from the uniforms array
    // @ts-expect-error
    return getValidatedProperties(userProps, this.uniforms, this.name);
  }.bind(module);

   module.instance = instance;
   module.getUniforms = module.instance.getModuleUniforms.bind(module);
}

/** Convert module props to uniforms */
export function getShaderModuleUniforms<
  ShaderModuleT extends ShaderModule<Record<string, unknown>, Record<string, UniformValue>>
>(
  module: ShaderModuleT,
  props: ShaderModuleT['props'],
  oldUniforms?: ShaderModuleT['uniforms']
): ShaderModuleT['uniforms'] {
  const uniforms = {...module.defaultUniforms};
  if (module.getUniforms) {
    // @ts-expect-error
    Object.assign(props, module.getUniforms(props));
  } else {
    Object.assign(uniforms, props);
  }
  return uniforms;
}

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

/**
  getUniforms(userProps: Record<string, any>, uniforms: Record<string, any>): Record<string, any> {
    if (this.getModuleUniforms) {
      return this.getModuleUniforms(userProps, uniforms);
    }
    // Build uniforms from the uniforms array
    return getValidatedProperties(userProps, this.uniforms, this.name);
  }
*/

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

/*
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
