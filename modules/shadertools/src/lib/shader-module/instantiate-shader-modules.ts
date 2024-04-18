// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule, ShaderModuleDeprecation} from './shader-module';
import {makePropValidators, getValidatedProperties, PropValidator} from '../filters/prop-types';
import {ShaderInjection, normalizeInjections} from '../shader-assembly/shader-injections';

export function instantiateShaderModules(modules: ShaderModule[]): ShaderModule[] {
  return modules.map((module: ShaderModule) => {
    if (module.instantiated) {
      return;
    }

    const {
      uniformPropTypes = {},
      getUniforms,
      deprecations = [],
      defines = {},
      inject = {}
    } = module;

    // module.getModuleUniforms = getUniforms!;
    // module.deprecations = _parseDeprecationDefinitions(deprecations);
    module.defines = defines;
    module.injections = normalizeInjections(inject);

    if (uniformPropTypes) {
      // module.uniforms = makePropValidators(uniformPropTypes);
    }

    module.instantiated = true;
    module.dependencies = instantiateShaderModules(module.dependencies || []);
    return module;
  });
}

/** An initialized ShaderModule, ready to use with `assembleShaders()` *
export class ShaderModuleInstance {
  name: string;
  vs?: string;
  fs?: string;
  
  getUniforms(userProps: Record<string, any>, uniforms: Record<string, any>): Record<string, any> {
    if (this.getModuleUniforms) {
      return this.getModuleUniforms(userProps, uniforms);
    }
    // Build uniforms from the uniforms array
    return getValidatedProperties(userProps, this.uniforms, this.name);
  }

  getDefines(): Record<string, string | number> {
    return this.defines;
  }

  // Warn about deprecated uniforms or functions
  checkDeprecations(shaderSource: string, log: any): void {
    this.deprecations.forEach(def => {
      if (def.regex?.test(shaderSource)) {
        if (def.deprecated) {
          log.deprecated(def.old, def.new)();
        } else {
          log.removed(def.old, def.new)();
        }
      }
    });
  }

  _parseDeprecationDefinitions(deprecations: ShaderModuleDeprecation[]) {
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
