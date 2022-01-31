import {assert} from '../utils/assert';
import {parsePropTypes} from '../filters/prop-types';
import {ShaderModule, ShaderModuleDeprecation} from '../../types';

export type Injection = {
  injection: string;
  order: number;
}

export class ShaderModuleInstance {
  name: string;
  vs: string;
  fs: string;
  getModuleUniforms;
  dependencies: ShaderModule[];
  deprecations: ShaderModuleDeprecation[];
  defines: Record<string, string | number>;
  injections: {
    vs: Record<string, Injection>;
    fs: Record<string, Injection>;
  };
  uniforms: Record<string, any>;

  constructor(props: ShaderModule) {
    const {
      name,
      vs,
      fs,
      dependencies = [],
      uniforms,
      getUniforms,
      deprecations = [],
      defines = {},
      // @ts-expect-error
      inject = {},
      /** @deprecated */
      // @ts-expect-error
      vertexShader,
      /** @deprecated */
      // @ts-expect-error
      fragmentShader
    } = props;

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
  getModuleSource(type: 'vs' | 'fs'): string {
    let moduleSource;
    switch (type) {
      case 'vs':
        moduleSource = this.vs || '';
        break;
      case 'fs':
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

  getUniforms(opts: Record<string, any>, uniforms: Record<string, any>): Record<string, any> {
    if (this.getModuleUniforms) {
      return this.getModuleUniforms(opts, uniforms);
    }
    // Build uniforms from the uniforms array
    if (this.uniforms) {
      return this._defaultGetUniforms(opts);
    }
    return {};
  }

  getDefines(): Record<string, string | number> {
    return this.defines;
  }

  // Warn about deprecated uniforms or functions
  checkDeprecations(shaderSource: string, log: any): void {
    this.deprecations.forEach((def) => {
      if (def.regex.test(shaderSource)) {
        if (def.deprecated) {
          log.deprecated(def.old, def.new)();
        } else {
          log.removed(def.old, def.new)();
        }
      }
    });
  }

  _parseDeprecationDefinitions(deprecations: ShaderModuleDeprecation[]) {
    deprecations.forEach((def) => {
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


function normalizeInjections(injections: Record<string, string | Injection>): {
  vs: Record<string, Injection>, 
  fs: Record<string, Injection>
} {
  const result: {
    vs: Record<string, Injection>, 
    fs: Record<string, Injection>
  } = {
    vs: {},
    fs: {}
  };

  for (const hook in injections) {
    let injection = injections[hook];
    const stage = hook.slice(0, 2);
    if (stage !== 'vs' && stage !== 'fs') {
      throw new Error(stage);
    }

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
