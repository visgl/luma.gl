import transpileShader from './transpile-shader';
import assert from '../utils/assert';

const VERTEX_SHADER = 'vs';
const FRAGMENT_SHADER = 'fs';

export default class ShaderModule {
  constructor({
    name,
    vs,
    fs,
    dependencies = [],
    getUniforms = () => ({}),
    deprecations = [],
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
  }

  // Extracts the source code chunk for the specified shader type from the named shader module
  getModuleSource(type, targetGLSLVersion) {
    let moduleSource;
    switch (type) {
      case VERTEX_SHADER:
        moduleSource = transpileShader(this.vs || '', targetGLSLVersion, true);
        break;
      case FRAGMENT_SHADER:
        moduleSource = transpileShader(this.fs || '', targetGLSLVersion, false);
        break;
      default:
        assert(false);
    }

    if (typeof moduleSource !== 'string') {
      return '';
    }

    return `\
#define MODULE_${this.name.toUpperCase()}
${moduleSource}\
// END MODULE_${this.name}

`;
  }

  getUniforms(opts, uniforms) {
    return this.getModuleUniforms(opts, uniforms);
  }

  // Warn about deprecated uniforms or functions
  checkDeprecations(shaderSource, log) {
    this.deprecations.forEach(def => {
      if (def.regex.test(shaderSource)) {
        if (def.deprecated && log) {
          log.deprecated(def.old, def.new)();
        } else if (log) {
          log.removed(def.old, def.new)();
        }
      }
    });
  }

  _parseDeprecationDefinitions(deprecations = []) {
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
}
