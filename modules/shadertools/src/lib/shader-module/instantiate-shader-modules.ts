// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule, ShaderModuleDeprecation} from './shader-module';
import {makePropValidators, getValidatedProperties} from '../filters/prop-types';
import {normalizeInjections} from '../shader-assembly/shader-injections';

export function instantiateShaderModules(modules: ShaderModule[]): ShaderModule[] {
  return modules.map((module: ShaderModule) => {
    if (module.instance) {
      return module;
    }

    const {
      uniformPropTypes = {},
      getUniforms,
      deprecations = [],
      // defines = {},
      inject = {}
    } = module;

    const instance: Required<ShaderModule>['instance'] = {
      dependencies: instantiateShaderModules(module.dependencies || []),
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

    return module;
  });
}

// Warn about deprecated uniforms or functions
export function checkModuleDeprecations(
  shaderSource: string,
  shaderModule: ShaderModule,
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
