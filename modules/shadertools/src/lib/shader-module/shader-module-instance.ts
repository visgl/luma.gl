// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert} from '../utils/assert';
import {makePropValidators, getValidatedProperties, PropValidator} from '../filters/prop-types';
import {ShaderModule, ShaderModuleDeprecation} from './shader-module';
import {ShaderInjection, normalizeInjections} from '../shader-assembly/shader-injections';

let index = 1;

/** An initialized ShaderModule, ready to use with `assembleShaders()` */
export class ShaderModuleInstance {
  name: string;
  vs?: string;
  fs?: string;
  getModuleUniforms: Function;
  dependencies: ShaderModuleInstance[];
  deprecations: ShaderModuleDeprecation[];
  defines: Record<string, string | number>;
  injections: {
    vertex: Record<string, ShaderInjection>;
    fragment: Record<string, ShaderInjection>;
  };
  uniforms: Record<string, PropValidator> = {};
  uniformTypes: Record<string, PropValidator> = {};

  static instantiateModules(
    modules: (ShaderModule | ShaderModuleInstance)[]
  ): ShaderModuleInstance[] {
    return modules.map((module: ShaderModule | ShaderModuleInstance) => {
      if (module instanceof ShaderModuleInstance) {
        return module;
      }

      assert(
        typeof module !== 'string',
        `Shader module use by name is deprecated. Import shader module '${JSON.stringify(
          module
        )}' and use it directly.`
      );
      if (!module.name) {
        // eslint-disable-next-line no-console
        console.warn('shader module has no name');
        module.name = `shader-module-${index++}`;
      }

      const moduleObject = new ShaderModuleInstance(module);
      moduleObject.dependencies = ShaderModuleInstance.instantiateModules(
        module.dependencies || []
      );

      return moduleObject;
    });
  }

  constructor(props: ShaderModule) {
    const {
      name,
      vs,
      fs,
      dependencies = [],
      uniformPropTypes = {},
      getUniforms,
      deprecations = [],
      defines = {},
      inject = {}
    } = props;

    assert(typeof name === 'string');
    this.name = name;
    this.vs = vs;
    this.fs = fs;
    this.getModuleUniforms = getUniforms;
    this.dependencies = ShaderModuleInstance.instantiateModules(dependencies);
    this.deprecations = this._parseDeprecationDefinitions(deprecations);
    this.defines = defines;
    this.injections = normalizeInjections(inject);

    if (uniformPropTypes) {
      this.uniforms = makePropValidators(uniformPropTypes);
    }
  }

  // Extracts the source code chunk for the specified shader type from the named shader module
  getModuleSource(stage: 'vertex' | 'fragment'): string {
    let moduleSource;
    switch (stage) {
      case 'vertex':
        moduleSource = this.vs || '';
        break;
      case 'fragment':
        moduleSource = this.fs || '';
        break;
      default:
        assert(false);
    }

    const moduleName = this.name.toUpperCase().replace(/[^0-9a-z]/gi, '_');
    return `\
// ----- MODULE ${this.name} ---------------

#define MODULE_${moduleName}
${moduleSource}\


`;
  }

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
