// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getShaderModuleDependencies} from '../shader-module/shader-module-dependencies';
import {PlatformInfo} from './platform-info';
import {getPlatformShaderDefines} from './platform-defines';
import {injectShader, DECLARATION_INJECT_MARKER} from './shader-injections';
import {transpileGLSLShader} from '../shader-transpiler/transpile-glsl-shader';
import {checkShaderModuleDeprecations} from '../shader-module/shader-module';
import type {ShaderInjection} from './shader-injections';
import type {ShaderModule} from '../shader-module/shader-module';
import {ShaderHook, normalizeShaderHooks, getShaderHooks} from './shader-hooks';
import {assert} from '../utils/assert';
import {getShaderInfo} from '../glsl-utils/get-shader-info';

/** Define map */
export type ShaderDefine = string | number | boolean;

const INJECT_SHADER_DECLARATIONS = `\n\n${DECLARATION_INJECT_MARKER}\n`;

/**
 * Precision prologue to inject before functions are injected in shader
 * TODO - extract any existing prologue in the fragment source and move it up...
 */
const FRAGMENT_SHADER_PROLOGUE = /* glsl */ `\
precision highp float;
`;

/**
 * Options for `ShaderAssembler.assembleShaders()`
 */
export type AssembleShaderProps = AssembleShaderOptions & {
  platformInfo: PlatformInfo;
  /** WGSL: single shader source. */
  source?: string | null;
  /** GLSL vertex shader source. */
  vs?: string | null;
  /** GLSL fragment shader source. */
  fs?: string | null;
};

export type AssembleShaderOptions = {
  /** information about the platform (which shader language & version, extensions etc.) */
  platformInfo: PlatformInfo;
  /** Inject shader id #defines */
  id?: string;
  /** Modules to be injected */
  modules?: ShaderModule[];
  /** Defines to be injected */
  defines?: Record<string, ShaderDefine>;
  /** Hook functions */
  hookFunctions?: (ShaderHook | string)[];
  /** Code injections */
  inject?: Record<string, string | ShaderInjection>;
  /** Whether to inject prologue */
  prologue?: boolean;
  /** logger object */
  log?: any;
};

type AssembleStageOptions = {
  /** Inject shader id #defines */
  id?: string;
  /** Vertex shader */
  source: string;
  stage: 'vertex' | 'fragment';
  /** Modules to be injected */
  modules: any[];
  /** Defines to be injected */
  defines?: Record<string, ShaderDefine>;
  /** Hook functions */
  hookFunctions?: (ShaderHook | string)[];
  /** Code injections */
  inject?: Record<string, string | ShaderInjection>;
  /** Whether to inject prologue */
  prologue?: boolean;
  /** logger object */
  log?: any;
};

export type HookFunction = {hook: string; header: string; footer: string; signature?: string};

/**
 * getUniforms function returned from the shader module system
 */
export type GetUniformsFunc = (opts: Record<string, any>) => Record<string, any>;

/**
 * Inject a list of shader modules into a single shader source for WGSL
 */
export function assembleWGSLShader(
  options: AssembleShaderOptions & {
    /** Single WGSL shader */
    source: string;
  }
): {
  source: string;
  getUniforms: GetUniformsFunc;
} {
  const modules = getShaderModuleDependencies(options.modules || []);

  return {
    source: assembleShaderWGSL(options.platformInfo, {
      ...options,
      source: options.source,
      stage: 'vertex',
      modules
    }),
    getUniforms: assembleGetUniforms(modules)
  };
}

/**
 * Injects dependent shader module sources into pair of main vertex/fragment shader sources for GLSL
 */
export function assembleGLSLShaderPair(
  options: AssembleShaderOptions & {
    /** Vertex shader */
    vs: string;
    /** Fragment shader */
    fs?: string;
  }
): {
  vs: string;
  fs: string;
  getUniforms: GetUniformsFunc;
} {
  const {vs, fs} = options;
  const modules = getShaderModuleDependencies(options.modules || []);

  return {
    vs: assembleShaderGLSL(options.platformInfo, {
      ...options,
      source: vs,
      stage: 'vertex',
      modules
    }),
    fs: assembleShaderGLSL(options.platformInfo, {
      ...options,
      // @ts-expect-error
      source: fs,
      stage: 'fragment',
      modules
    }),
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
export function assembleShaderWGSL(platformInfo: PlatformInfo, options: AssembleStageOptions) {
  const {
    // id,
    source,
    stage,
    modules,
    // defines = {},
    hookFunctions = [],
    inject = {},
    log
  } = options;

  assert(typeof source === 'string', 'shader source must be a string');

  // const isVertex = type === 'vs';
  // const sourceLines = source.split('\n');

  const coreSource = source;

  // Combine Module and Application Defines
  // const allDefines = {};
  // modules.forEach(module => {
  //   Object.assign(allDefines, module.getDefines());
  // });
  // Object.assign(allDefines, defines);

  // Add platform defines (use these to work around platform-specific bugs and limitations)
  // Add common defines (GLSL version compatibility, feature detection)
  // Add precision declaration for fragment shaders
  let assembledSource = '';
  //   prologue
  //     ? `\
  // ${getShaderNameDefine({id, source, type})}
  // ${getShaderType(type)}
  // ${getPlatformShaderDefines(platformInfo)}
  // ${getApplicationDefines(allDefines)}
  // ${isVertex ? '' : FRAGMENT_SHADER_PROLOGUE}
  // `
  // `;

  const hookFunctionMap = normalizeShaderHooks(hookFunctions);

  // Add source of dependent modules in resolved order
  const hookInjections: Record<string, ShaderInjection[]> = {};
  const declInjections: Record<string, ShaderInjection[]> = {};
  const mainInjections: Record<string, ShaderInjection[]> = {};

  for (const key in inject) {
    const injection =
      typeof inject[key] === 'string' ? {injection: inject[key], order: 0} : inject[key];
    const match = /^(v|f)s:(#)?([\w-]+)$/.exec(key);
    if (match) {
      const hash = match[2];
      const name = match[3];
      if (hash) {
        if (name === 'decl') {
          declInjections[key] = [injection as any];
        } else {
          mainInjections[key] = [injection as any];
        }
      } else {
        hookInjections[key] = [injection as any];
      }
    } else {
      // Regex injection
      mainInjections[key] = [injection as any];
    }
  }

  // TODO - hack until shadertool modules support WebGPU
  const modulesToInject = modules;

  for (const module of modulesToInject) {
    if (log) {
      checkShaderModuleDeprecations(module, coreSource, log);
    }
    const moduleSource = getShaderModuleSource(module, 'wgsl');
    // Add the module source, and a #define that declares it presence
    assembledSource += moduleSource;

    const injections = module.injections?.[stage] || {};
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

  assembledSource = injectShader(assembledSource, stage, declInjections);

  assembledSource += getShaderHooks(hookFunctionMap[stage], hookInjections);

  // Add the version directive and actual source of this shader
  assembledSource += coreSource;

  // Apply any requested shader injections
  assembledSource = injectShader(assembledSource, stage, mainInjections);

  return assembledSource;
}

/**
 * Pulls together complete source code for either a vertex or a fragment shader
 * adding prologues, requested module chunks, and any final injections.
 * @param gl
 * @param options
 * @returns
 */
function assembleShaderGLSL(
  platformInfo: PlatformInfo,
  options: {
    id?: string;
    source: string;
    language?: 'glsl' | 'wgsl';
    stage: 'vertex' | 'fragment';
    modules: ShaderModule[];
    defines?: Record<string, ShaderDefine>;
    hookFunctions?: any[];
    inject?: Record<string, string | ShaderInjection>;
    prologue?: boolean;
    log?: any;
  }
) {
  const {
    id,
    source,
    stage,
    language = 'glsl',
    modules,
    defines = {},
    hookFunctions = [],
    inject = {},
    prologue = true,
    log
  } = options;

  assert(typeof source === 'string', 'shader source must be a string');

  const sourceVersion = language === 'glsl' ? getShaderInfo(source).version : -1;
  const targetVersion = platformInfo.shaderLanguageVersion;

  const sourceVersionDirective = sourceVersion === 100 ? '#version 100' : '#version 300 es';

  const sourceLines = source.split('\n');
  // TODO : keep all pre-processor statements at the beginning of the shader.
  const coreSource = sourceLines.slice(1).join('\n');

  // Combine Module and Application Defines
  const allDefines = {};
  modules.forEach(module => {
    Object.assign(allDefines, module.defines);
  });
  Object.assign(allDefines, defines);

  // Add platform defines (use these to work around platform-specific bugs and limitations)
  // Add common defines (GLSL version compatibility, feature detection)
  // Add precision declaration for fragment shaders
  let assembledSource = '';
  switch (language) {
    case 'wgsl':
      break;
    case 'glsl':
      assembledSource = prologue
        ? `\
${sourceVersionDirective}

// ----- PROLOGUE -------------------------
${getShaderNameDefine({id, source, stage})}
${`#define SHADER_TYPE_${stage.toUpperCase()}`}

${getPlatformShaderDefines(platformInfo)}
${stage === 'fragment' ? FRAGMENT_SHADER_PROLOGUE : ''}

// ----- APPLICATION DEFINES -------------------------

${getApplicationDefines(allDefines)}

`
        : `${sourceVersionDirective}
`;
      break;
  }

  const hookFunctionMap = normalizeShaderHooks(hookFunctions);

  // Add source of dependent modules in resolved order
  const hookInjections: Record<string, ShaderInjection[]> = {};
  const declInjections: Record<string, ShaderInjection[]> = {};
  const mainInjections: Record<string, ShaderInjection[]> = {};

  for (const key in inject) {
    const injection: ShaderInjection =
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
      checkShaderModuleDeprecations(module, coreSource, log);
    }
    const moduleSource = getShaderModuleSource(module, stage);
    // Add the module source, and a #define that declares it presence
    assembledSource += moduleSource;

    const injections = module.instance?.normalizedInjections[stage] || {};
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

  assembledSource += '// ----- MAIN SHADER SOURCE -------------------------';

  // For injectShader
  assembledSource += INJECT_SHADER_DECLARATIONS;

  assembledSource = injectShader(assembledSource, stage, declInjections);

  assembledSource += getShaderHooks(hookFunctionMap[stage], hookInjections);

  // Add the version directive and actual source of this shader
  assembledSource += coreSource;

  // Apply any requested shader injections
  assembledSource = injectShader(assembledSource, stage, mainInjections);

  if (language === 'glsl' && sourceVersion !== targetVersion) {
    assembledSource = transpileGLSLShader(assembledSource, stage);
  }

  return assembledSource.trim();
}

/**
 * Returns a combined `getUniforms` covering the options for all the modules,
 * the created function will pass on options to the inidividual `getUniforms`
 * function of each shader module and combine the results into one object that
 * can be passed to setUniforms.
 * @param modules
 * @returns
 */
export function assembleGetUniforms(modules: ShaderModule[]) {
  return function getUniforms(opts: Record<string, any>): Record<string, any> {
    const uniforms = {};
    for (const module of modules) {
      // `modules` is already sorted by dependency level. This guarantees that
      // modules have access to the uniforms that are generated by their dependencies.
      const moduleUniforms = module.getUniforms?.(opts, uniforms);
      Object.assign(uniforms, moduleUniforms);
    }
    return uniforms;
  };
}

/**
 * Generate "glslify-compatible" SHADER_NAME defines
 * These are understood by the GLSL error parsing function
 * If id is provided and no SHADER_NAME constant is present in source, create one
 */
function getShaderNameDefine(options: {
  id?: string;
  source: string;
  stage: 'vertex' | 'fragment';
}): string {
  const {id, source, stage} = options;
  const injectShaderName = id && source.indexOf('SHADER_NAME') === -1;
  return injectShaderName
    ? `
#define SHADER_NAME ${id}_${stage}`
    : '';
}

/** Generates application defines from an object of key value pairs */
function getApplicationDefines(defines: Record<string, ShaderDefine> = {}): string {
  let sourceText = '';
  for (const define in defines) {
    const value = defines[define];
    if (value || Number.isFinite(value)) {
      sourceText += `#define ${define.toUpperCase()} ${defines[define]}\n`;
    }
  }
  return sourceText;
}

/** Extracts the source code chunk for the specified shader type from the named shader module */
export function getShaderModuleSource(
  module: ShaderModule,
  stage: 'vertex' | 'fragment' | 'wgsl'
): string {
  let moduleSource;
  switch (stage) {
    case 'vertex':
      moduleSource = module.vs || '';
      break;
    case 'fragment':
      moduleSource = module.fs || '';
      break;
    case 'wgsl':
      moduleSource = module.source || '';
      break;
    default:
      assert(false);
  }

  if (!module.name) {
    throw new Error('Shader module must have a name');
  }
  const moduleName = module.name.toUpperCase().replace(/[^0-9a-z]/gi, '_');
  let source = `\
// ----- MODULE ${module.name} ---------------

`;
  if (stage !== 'wgsl') {
    source += `#define MODULE_${moduleName}\n`;
  }
  source += `${moduleSource}\n`;
  return source;
}

/*
function getHookFunctions(
  hookFunctions: Record<string, HookFunction>,
  hookInjections: Record<string, Injection[]>
): string {
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
  vs: Record<string, HookFunction>;
  fs: Record<string, HookFunction>;
} {
  const result: {vs: Record<string, any>; fs: Record<string, any>} = {
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
*/
