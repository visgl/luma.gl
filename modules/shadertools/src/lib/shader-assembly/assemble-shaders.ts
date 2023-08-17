// luma.gl, MIT license
import {glsl} from '../glsl-utils/highlight';
import {resolveModules} from './resolve-modules';
import {getPlatformShaderDefines, getVersionDefines, PlatformInfo} from './platform-defines';
import {injectShader, DECLARATION_INJECT_MARKER} from './inject-shader';
import {transpileShader} from '../transpiler/transpile-shader';
import {assert} from '../utils/assert';
import {ShaderModuleInstance} from '../shader-module/shader-module-instance';
import type { Injection } from '../shader-module/shader-module-instance';
import {ShaderModule} from '../shader-module/shader-module';


const INJECT_SHADER_DECLARATIONS = `\n\n${DECLARATION_INJECT_MARKER}\n\n`;

const SHADER_TYPE = {
  'fs': 'fragment',
  'vs': 'vertex'
};

/**
 * Precision prologue to inject before functions are injected in shader
 * TODO - extract any existing prologue in the fragment source and move it up...
 */
const FRAGMENT_SHADER_PROLOGUE = glsl`\
precision highp float;

`;

/** Define map */
type Defines = Record<string, string | number | boolean>;

export type HookFunction = { hook: string; header: string; footer: string; signature?: string};

export type AssembleShaderOptions = {
  /** Inject shader id #defines */
  id?: string;
  /** Vertex shader */
  vs: string;
  /** Fragment shader */
  fs: string;
  /** Shader type @deprecated do we still need this */
  // type?: any;
  /** Modules to be injected */
  modules?: (ShaderModule | ShaderModuleInstance)[];
  /** Defines to be injected */
  defines?: Defines;
  /** Hook functions */
  hookFunctions?: (HookFunction | string | { hook: string; header: string; footer: string; })[];
  /** Code injections */
  inject?: object;
  /** Whether to transpile code */
  transpileToGLSL100?: boolean;
  /** Whether to inject prologue */
  prologue?: boolean;
  /** logger object */
  log?: any;
};

/** 
 * getUniforms function returned from the shader module system 
 */
export type GetUniformsFunc = (opts: Record<string, any>) => Record<string, any>;

/**
 * Inject a list of shader modules into shader sources
 */
export function assembleShaders(
  platformInfo: PlatformInfo,
  options: AssembleShaderOptions
): {
  vs: string;
  fs: string;
  getUniforms: GetUniformsFunc;
} {
  const {vs, fs} = options;
  const modules = resolveModules(options.modules || []);
  return {
    vs: assembleShader(platformInfo, {...options, source: vs, type: 'vs', modules}),
    fs: assembleShader(platformInfo, {...options, source: fs, type: 'fs', modules}),
    getUniforms: assembleGetUniforms(modules)
  };
}

/**
 * Pulls together complete source code for either a vertex or a fragment shader
 * adding prologues, requested module chunks, and any final injections.
 * @param gl 
 * @param options 
 * @returns 
 */
function assembleShader(
  platformInfo: PlatformInfo,
  options: {
    id?: string;
    source: string;
    type: 'vs' | 'fs';
    modules: any[];
    defines?: Defines;
    hookFunctions?: any[];
    inject?: Record<string, any>;
    transpileToGLSL100?: boolean;
    prologue?: boolean;
    log?: any;
  }
) {
  const {
    id,
    source,
    type,
    modules,
    defines = {},
    hookFunctions = [],
    inject = {},
    transpileToGLSL100 = false,
    prologue = true,
    log
  } = options;

  assert(typeof source === 'string', 'shader source must be a string');

  const isVertex = type === 'vs';

  const sourceLines = source.split('\n');
  let glslVersion = 100;
  let versionLine = '';
  let coreSource = source;
  // Extract any version directive string from source.
  // TODO : keep all pre-processor statements at the beginning of the shader.
  if (sourceLines[0].indexOf('#version ') === 0) {
    glslVersion = 300; // TODO - regexp that matches actual version number
    versionLine = sourceLines[0];
    coreSource = sourceLines.slice(1).join('\n');
  } else {
    versionLine = `#version ${glslVersion}`;
  }

  // Combine Module and Application Defines
  const allDefines = {};
  modules.forEach((module) => {
    Object.assign(allDefines, module.getDefines());
  });
  Object.assign(allDefines, defines);

  // Add platform defines (use these to work around platform-specific bugs and limitations)
  // Add common defines (GLSL version compatibility, feature detection)
  // Add precision declaration for fragment shaders
  let assembledSource = prologue
    ? `\
${versionLine}
${getShaderNameDefine({id, source, type})}
${getShaderType(type)}
${getPlatformShaderDefines(platformInfo)}
${getVersionDefines(platformInfo)}
${getApplicationDefines(allDefines)}
${isVertex ? '' : FRAGMENT_SHADER_PROLOGUE}
`
    : `${versionLine}
`;

  const hookFunctionMap = normalizeHookFunctions(hookFunctions);

  // Add source of dependent modules in resolved order
  const hookInjections: Record<string, Injection[]> = {};
  const declInjections: Record<string, Injection[]> = {};
  const mainInjections: Record<string, Injection[]> = {};

  for (const key in inject) {
    const injection =
      typeof inject[key] === 'string' ? {injection: inject[key], order: 0} : inject[key];
    const match = /^(v|f)s:(#)?([\w-]+)$/.exec(key);
    if (match) {
      const hash = match[2];
      const name = match[3];
      if (hash) {
        if (name === 'decl') {
          declInjections[key] = [injection];
        } else {
          mainInjections[key] = [injection];
        }
      } else {
        hookInjections[key] = [injection];
      }
    } else {
      // Regex injection
      mainInjections[key] = [injection];
    }
  }

  for (const module of modules) {
    if (log) {
      module.checkDeprecations(coreSource, log);
    }
    const moduleSource = module.getModuleSource(type, glslVersion);
    // Add the module source, and a #define that declares it presence
    assembledSource += moduleSource;

    const injections = module.injections[type];
    for (const key in injections) {
      const match = /^(v|f)s:#([\w-]+)$/.exec(key);
      if (match) {
        const name = match[2];
        const injectionType = name === 'decl' ? declInjections : mainInjections;
        injectionType[key] = injectionType[key] || [];
        injectionType[key].push(injections[key]);
      } else {
        hookInjections[key] = hookInjections[key] || [];
        hookInjections[key].push(injections[key]);
      }
    }
  }

  // For injectShader
  assembledSource += INJECT_SHADER_DECLARATIONS;

  assembledSource = injectShader(assembledSource, type, declInjections);

  assembledSource += getHookFunctions(hookFunctionMap[type], hookInjections);

  // Add the version directive and actual source of this shader
  assembledSource += coreSource;

  // Apply any requested shader injections
  assembledSource = injectShader(assembledSource, type, mainInjections);

  assembledSource = transpileShader(
    assembledSource,
    transpileToGLSL100 ? 100 : glslVersion,
    isVertex
  );

  return assembledSource;
}

/**
 * Returns a combined `getUniforms` covering the options for all the modules,
 * the created function will pass on options to the inidividual `getUniforms`
 * function of each shader module and combine the results into one object that
 * can be passed to setUniforms.
 * @param modules 
 * @returns 
 */
function assembleGetUniforms(modules: ShaderModuleInstance[]) {
  return function getUniforms(opts: Record<string, any>): Record<string, any> {
    const uniforms = {};
    for (const module of modules) {
      // `modules` is already sorted by dependency level. This guarantees that
      // modules have access to the uniforms that are generated by their dependencies.
      const moduleUniforms = module.getUniforms(opts, uniforms);
      Object.assign(uniforms, moduleUniforms);
    }
    return uniforms;
  };
}

function getShaderType(type: 'fs' | 'vs') {
  return `
#define SHADER_TYPE_${SHADER_TYPE[type].toUpperCase()}
`;
}

/**
 * Generate "glslify-compatible" SHADER_NAME defines
 * These are understood by the GLSL error parsing function
 * If id is provided and no SHADER_NAME constant is present in source, create one
 */
function getShaderNameDefine(options: {id?: string, source: string, type: 'vs' | 'fs'}): string {
  const {id, source, type} = options;
  const injectShaderName = id && source.indexOf('SHADER_NAME') === -1;
  return injectShaderName
    ? `
#define SHADER_NAME ${id}_${SHADER_TYPE[type]}

`
    : '';
}

/** Generates application defines from an object of key value pairs */
function getApplicationDefines(defines: Defines = {}): string {
  let count = 0;
  let sourceText = '';
  for (const define in defines) {
    if (count === 0) {
      sourceText += '\n// APPLICATION DEFINES\n';
    }
    count++;

    const value = defines[define];
    if (value || Number.isFinite(value)) {
      sourceText += `#define ${define.toUpperCase()} ${defines[define]}\n`;
    }
  }
  if (count === 0) {
    sourceText += '\n';
  }
  return sourceText;
}

function getHookFunctions(
  hookFunctions: Record<string, HookFunction>, hookInjections: Record<string, Injection[]>): string {
  let result = '';
  for (const hookName in hookFunctions) {
    const hookFunction = hookFunctions[hookName];
    result += `void ${hookFunction.signature} {\n`;
    if (hookFunction.header) {
      result += `  ${hookFunction.header}`;
    }
    if (hookInjections[hookName]) {
      const injections = hookInjections[hookName];
      injections.sort((a: {order: number}, b: {order: number}): number => a.order - b.order);
      for (const injection of injections) {
        result += `  ${injection.injection}\n`;
      }
    }
    if (hookFunction.footer) {
      result += `  ${hookFunction.footer}`;
    }
    result += '}\n';
  }

  return result;
}

function normalizeHookFunctions(hookFunctions: (string | HookFunction)[]): {
  vs: Record<string, HookFunction>, 
  fs: Record<string, HookFunction>
} {
  const result: {vs: Record<string, any>, fs: Record<string, any>} = {
    vs: {},
    fs: {}
  };

  hookFunctions.forEach((hookFunction: string | HookFunction) => {
    let opts: HookFunction;
    let hook: string;
    if (typeof hookFunction !== 'string') {
      opts = hookFunction;
      hook = opts.hook;
    } else {
      opts = {} as HookFunction;
      hook = hookFunction;
    }
    hook = hook.trim();
    const [stage, signature] = hook.split(':');
    const name = hook.replace(/\(.+/, '');
    if (stage !== 'vs' && stage !== 'fs') {
      throw new Error(stage);
    }
    result[stage][name] = Object.assign(opts, {signature});
  });

  return result;
}
