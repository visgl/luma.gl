import {assert} from '../utils';
import {parsePropTypes} from './filters/prop-types';

const VERTEX_SHADER = 'vs';
const FRAGMENT_SHADER = 'fs';

export default class ShaderModule {
  constructor({
    name,
    vs,
    fs,
    dependencies = [],
    uniforms,
    getUniforms,
    deprecations = [],
    defines = {},
    inject = {},
    // DEPRECATED
    vertexShader,
    fragmentShader
  }) {
    assert(typeof name === 'string');
    this.name = name;
    this.vs = vs || vertexShader;
    this.fs = fs || fragmentShader;
    this.getModuleUniforms = getUniforms;
    this.dependencies = dependencies;
    this.deprecations = this._parseDeprecationDefinitions(deprecations);
    this.defines = defines;
    this.injections = normalizeInjections(inject);

    if (uniforms) {
      this.uniforms = parsePropTypes(uniforms);
    }
  }

  // Extracts the source code chunk for the specified shader type from the named shader module
  getModuleSource(type) {
    let moduleSource;
    switch (type) {
      case VERTEX_SHADER:
        moduleSource = this.vs || '';
        break;
      case FRAGMENT_SHADER:
        moduleSource = this.fs || '';
        break;
      default:
        assert(false);
    }

    return `\
#define MODULE_${this.name.toUpperCase().replace(/[^0-9a-z]/gi, '_')}
${moduleSource}\
// END MODULE_${this.name}

`;
  }

  getUniforms(opts, uniforms) {
    if (this.getModuleUniforms) {
      return this.getModuleUniforms(opts, uniforms);
    }
    // Build uniforms from the uniforms array
    if (this.uniforms) {
      return this._defaultGetUniforms(opts);
    }
    return {};
  }

  getDefines() {
    return this.defines;
  }

  // Warn about deprecated uniforms or functions
  checkDeprecations(shaderSource, log) {
    this.deprecations.forEach(def => {
      if (def.regex.test(shaderSource)) {
        if (def.deprecated) {
          log.deprecated(def.old, def.new)();
        } else {
          log.removed(def.old, def.new)();
        }
      }
    });
  }

  _parseDeprecationDefinitions(deprecations) {
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

  _defaultGetUniforms(opts = {}) {
    const uniforms = {};
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

// This utility mutates the original module
// Keeping for backward compatibility
// TODO - remove in v8
export function normalizeShaderModule(module) {
  if (!module.normalized) {
    module.normalized = true;
    if (module.uniforms && !module.getUniforms) {
      const shaderModule = new ShaderModule(module);
      module.getUniforms = shaderModule.getUniforms.bind(shaderModule);
    }
  }
  return module;
}

function normalizeInjections(injections) {
  const result = {
    vs: {},
    fs: {}
  };

  for (const hook in injections) {
    let injection = injections[hook];
    const stage = hook.slice(0, 2);

    if (typeof injection === 'string') {
      injection = {
        order: 0,
        injection
      };
    }

    result[stage][hook] = injection;
  }

  return result;
}
