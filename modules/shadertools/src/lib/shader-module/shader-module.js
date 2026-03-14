// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { makePropValidators, getValidatedProperties } from '../filters/prop-types';
import { normalizeInjections } from '../shader-assembly/shader-injections';
// SHNDER MODULE API
export function initializeShaderModules(modules) {
    modules.map((module) => initializeShaderModule(module));
}
export function initializeShaderModule(module) {
    if (module.instance) {
        return;
    }
    initializeShaderModules(module.dependencies || []);
    const { propTypes = {}, deprecations = [], 
    // defines = {},
    inject = {} } = module;
    const instance = {
        normalizedInjections: normalizeInjections(inject),
        parsedDeprecations: parseDeprecationDefinitions(deprecations)
    };
    if (propTypes) {
        instance.propValidators = makePropValidators(propTypes);
    }
    module.instance = instance;
    // TODO(ib) - we need to apply the original prop types to the default uniforms
    let defaultProps = {};
    if (propTypes) {
        defaultProps = Object.entries(propTypes).reduce((obj, [key, propType]) => {
            // @ts-expect-error
            const value = propType?.value;
            if (value) {
                // @ts-expect-error
                obj[key] = value;
            }
            return obj;
        }, {});
    }
    module.defaultUniforms = { ...module.defaultUniforms, ...defaultProps };
}
/** Convert module props to uniforms */
export function getShaderModuleUniforms(module, props, oldUniforms) {
    initializeShaderModule(module);
    const uniforms = oldUniforms || { ...module.defaultUniforms };
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
export function checkShaderModuleDeprecations(shaderModule, shaderSource, log) {
    shaderModule.deprecations?.forEach(def => {
        if (def.regex?.test(shaderSource)) {
            if (def.deprecated) {
                log.deprecated(def.old, def.new)();
            }
            else {
                log.removed(def.old, def.new)();
            }
        }
    });
}
// HELPERS
function parseDeprecationDefinitions(deprecations) {
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
