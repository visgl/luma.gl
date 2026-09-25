// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getShaderModuleDependencies} from '../shader-module/shader-module-dependencies';
import {PlatformInfo} from './platform-info';
import {getPlatformShaderDefines} from './platform-defines';
import {injectShader, DECLARATION_INJECT_MARKER} from './shader-injections';
import {transpileGLSLShader} from '../shader-transpiler/transpile-glsl-shader';
import {checkShaderModuleDeprecations} from '../shader-module/shader-module';
import {
  validateShaderModuleUniformLayout,
  warnIfGLSLUniformBlocksAreNotStd140
} from '../shader-module/shader-module-uniform-layout';
import type {ShaderInjection} from './shader-injections';
import type {ShaderModule} from '../shader-module/shader-module';
import {
  normalizeShaderHooks,
  getShaderHooks,
  validateShaderHookInjections,
  type ShaderHookInput
} from './shader-hooks';
import {assert} from '../utils/assert';
import {getShaderInfo} from '../glsl-utils/get-shader-info';
import {getShaderBindingDebugRowsFromWGSL, type ShaderBindingDebugRow} from './wgsl-binding-debug';
import {scanWGSLInterface} from './wgsl-interface-scan';
import {preprocess} from '../preprocessor/preprocessor';
import type {AttributeShaderType, ShaderLayout} from '@luma.gl/core';
import type {ResolvedShaderPluginVarying} from '../shader-plugin';
import {
  assembleShaderPluginVertexInputsWGSL,
  getShaderPluginVertexInputDeclarationsGLSL
} from './shader-plugin-vertex-inputs';
import {
  assembleShaderPluginVaryingsGLSL,
  assembleShaderPluginVaryingsWGSL
} from './shader-plugin-varyings';
import {
  MODULE_WGSL_BINDING_DECLARATION_REGEXES,
  WGSL_BINDING_DECLARATION_REGEXES,
  WGSL_EXPLICIT_BINDING_DECLARATION_REGEXES,
  getFirstWGSLAutoBindingDeclarationMatch,
  getWGSLBindingDeclarationMatches,
  hasWGSLAutoBinding,
  replaceWGSLBindingDeclarationMatches,
  type WGSLBindingDeclarationMatch
} from './wgsl-binding-scan';

const INJECT_SHADER_DECLARATIONS = `\n\n${DECLARATION_INJECT_MARKER}\n`;
const RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT = 100;

type ShaderAssemblyLog = {
  deprecated?: (...args: unknown[]) => () => unknown;
  removed?: (...args: unknown[]) => () => unknown;
  warn?: (...args: unknown[]) => () => unknown;
};

/**
 * Precision prologue to inject before functions are injected in shader
 * TODO - extract any existing prologue in the fragment source and move it up...
 */
const FRAGMENT_SHADER_PROLOGUE = /* glsl */ `\
precision highp float;
`;

/** Props accepted by `ShaderAssembler` assembly methods. */
export type AssembleShaderProps = AssembleShaderOptions & {
  platformInfo: PlatformInfo;
  /** WGSL: single shader source. */
  source?: string | null;
  /** GLSL vertex shader source. */
  vs?: string | null;
  /** GLSL fragment shader source. */
  fs?: string | null;
};

/** Shared shader assembly options. */
export type AssembleShaderOptions = {
  /** information about the platform (which shader language & version, extensions etc.) */
  platformInfo: PlatformInfo;
  /** Inject shader id #defines */
  id?: string;
  /** Modules to be injected */
  modules?: ShaderModule[];
  /** Boolean or numeric preprocessor defines evaluated before shader assembly. */
  defines?: Record<string, boolean | number>;
  /** GLSL only: Overrides to be injected. In WGSL these are supplied during Pipeline creation time */
  constants?: Record<string, number>;
  /** Hook functions */
  hookFunctions?: ShaderHookInput;
  /** Code injections */
  inject?: Record<string, string | ShaderInjection>;
  /** Ordered code injections contributed by ShaderPlugin descriptors. */
  pluginInjections?: Record<string, ShaderInjection[]>;
  /** Vertex inputs contributed by ShaderPlugin descriptors. */
  pluginVertexInputs?: Record<string, AttributeShaderType>;
  /** Cross-stage varyings contributed by ShaderPlugin descriptors. */
  pluginVaryings?: Record<string, ResolvedShaderPluginVarying>;
  /** WGSL vertex entry point selected by the render pipeline. */
  vertexEntryPoint?: string;
  /** Whether WGSL interface scanning should include vertex attributes. */
  scanVertexAttributes?: boolean;
  /** WGSL fragment entry point selected by the render pipeline. */
  fragmentEntryPoint?: string;
  /** Whether to inject prologue */
  prologue?: boolean;
  /** logger object */
  log?: ShaderAssemblyLog;
};

type AssembleStageOptions = {
  /** Inject shader id #defines */
  id?: string;
  /** Vertex shader */
  source: string;
  stage: 'vertex' | 'fragment';
  /** Modules to be injected */
  modules: any[];
  /** Boolean or numeric preprocessor defines evaluated before shader assembly. */
  defines?: Record<string, boolean | number>;
  /** GLSL only: Overrides to be injected. In WGSL these are supplied during Pipeline creation time */
  constants?: Record<string, number>;
  /** Hook functions */
  hookFunctions?: ShaderHookInput;
  /** Code injections */
  inject?: Record<string, string | ShaderInjection>;
  /** Ordered code injections contributed by ShaderPlugin descriptors. */
  pluginInjections?: Record<string, ShaderInjection[]>;
  /** Vertex inputs contributed by ShaderPlugin descriptors. */
  pluginVertexInputs?: Record<string, AttributeShaderType>;
  /** Cross-stage varyings contributed by ShaderPlugin descriptors. */
  pluginVaryings?: Record<string, ResolvedShaderPluginVarying>;
  /** WGSL vertex entry point selected by the render pipeline. */
  vertexEntryPoint?: string;
  /** WGSL fragment entry point selected by the render pipeline. */
  fragmentEntryPoint?: string;
  /** Whether to inject prologue */
  prologue?: boolean;
  /** logger object */
  log?: ShaderAssemblyLog;
  /** @internal Stable per-assembler WGSL binding assignments. */
  _bindingRegistry?: Map<string, number>;
};

/**
 * getUniforms function returned from the shader module system
 */
export type GetUniformsFunc = (opts: Record<string, any>) => Record<string, any>;

type AssembleWGSLShaderOptions = AssembleShaderOptions & {
  /** Single WGSL shader */
  source: string;
  /** @internal Stable per-assembler WGSL binding assignments. */
  _bindingRegistry?: Map<string, number>;
};

/** Inject shader modules and compute metadata for the resulting WGSL source. */
export function assembleWGSLShader(options: AssembleWGSLShaderOptions): {
  source: string;
  getUniforms: GetUniformsFunc;
  bindingAssignments: WGSLBindingAssignment[];
  bindingTable: ShaderBindingDebugRow[];
  shaderLayout: ShaderLayout | null;
} {
  const assembledShader = assembleWGSLSource(options);
  return {
    ...assembledShader,
    bindingTable: getShaderBindingDebugRowsFromWGSL(
      assembledShader.source,
      assembledShader.bindingAssignments
    ),
    shaderLayout: scanWGSLInterface(assembledShader.source, {
      vertexEntryPoint: options.vertexEntryPoint,
      scanVertexAttributes: options.scanVertexAttributes
    })
  };
}

/** @internal Assemble source without scanning metadata that subsequent preprocessing invalidates. */
export function assembleWGSLSource(options: AssembleWGSLShaderOptions): {
  source: string;
  getUniforms: GetUniformsFunc;
  bindingAssignments: WGSLBindingAssignment[];
} {
  const modules = getShaderModuleDependencies(options.modules || []);
  const {source, bindingAssignments} = assembleShaderWGSL(options.platformInfo, {
    ...options,
    source: options.source,
    stage: 'vertex',
    modules
  });

  return {
    source,
    getUniforms: assembleGetUniforms(modules),
    bindingAssignments
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
export function assembleShaderWGSL(
  platformInfo: PlatformInfo,
  options: AssembleStageOptions
): {source: string; bindingAssignments: WGSLBindingAssignment[]} {
  const {
    // id,
    source,
    stage,
    modules,
    // defines = {},
    defines = {},
    hookFunctions = [],
    inject = {},
    pluginInjections = {},
    pluginVertexInputs = {},
    pluginVaryings = {},
    vertexEntryPoint = 'vertexMain',
    fragmentEntryPoint = 'fragmentMain',
    log
  } = options;

  assert(typeof source === 'string', 'shader source must be a string');

  // const isVertex = type === 'vs';
  // const sourceLines = source.split('\n');

  const preprocessedSource = preprocess(source, {defines});
  const pluginVertexInputAssembly = assembleShaderPluginVertexInputsWGSL(
    preprocessedSource,
    vertexEntryPoint,
    pluginVertexInputs
  );
  const pluginVaryingAssembly = assembleShaderPluginVaryingsWGSL(
    pluginVertexInputAssembly.source,
    vertexEntryPoint,
    fragmentEntryPoint,
    pluginVaryings
  );
  const coreSource = pluginVaryingAssembly.source;

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

  appendInjections(pluginInjections, hookInjections, declInjections, mainInjections);

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
  appendGeneratedVertexInputInjections(
    pluginVertexInputAssembly.declarations,
    pluginVertexInputAssembly.initialization,
    declInjections,
    mainInjections
  );
  appendGeneratedVaryingInjections(pluginVaryingAssembly, declInjections, mainInjections);

  // TODO - hack until shadertool modules support WebGPU
  const modulesToInject = modules.map(module => ({
    module,
    source: preprocess(getShaderModuleSource(module, 'wgsl', log), {defines})
  }));
  const applicationRelocation = relocateWGSLApplicationBindings(coreSource);
  const usedBindingsByGroup = getUsedBindingsByGroupFromApplicationWGSL(
    applicationRelocation.source
  );
  const reservedBindingKeysByGroup = reserveModuleBindings(
    modulesToInject,
    options._bindingRegistry,
    usedBindingsByGroup
  );
  const bindingAssignments: WGSLBindingAssignment[] = [];

  // Resolve all bindings before emitting source, preserving module and declaration order.
  const relocatedModules = modulesToInject.map(({module, source: moduleSource}) => {
    const relocation = relocateWGSLModuleBindings(moduleSource, module, {
      usedBindingsByGroup,
      bindingRegistry: options._bindingRegistry,
      reservedBindingKeysByGroup
    });
    bindingAssignments.push(...relocation.bindingAssignments);
    return {module, source: relocation.source};
  });

  for (const {module, source: moduleSource} of relocatedModules) {
    if (log) {
      checkShaderModuleDeprecations(module, coreSource, log);
    }
    assembledSource += moduleSource;

    const injections = getWGSLModuleInjections(module);
    for (const key in injections) {
      const match = /^(v|f)s:#([\w-]+)$/.exec(key);
      if (match) {
        const name = match[2];
        const injectionType = name === 'decl' ? declInjections : mainInjections;
        injectionType[key] = injectionType[key] || [];
        injectionType[key].push(injections[key]);
      } else if (hasRegisteredWGSLShaderHooksForStage(hookFunctionMap, key)) {
        hookInjections[key] = hookInjections[key] || [];
        hookInjections[key].push(injections[key]);
      }
    }
  }

  validateShaderHookInjections(hookFunctionMap, hookInjections);

  // For injectShader
  assembledSource += INJECT_SHADER_DECLARATIONS;

  assembledSource = injectShader(
    assembledSource,
    stage,
    getWGSLDeclarationInjections(declInjections),
    false,
    'wgsl',
    {vertex: vertexEntryPoint, fragment: fragmentEntryPoint}
  );

  assembledSource += getWGSLShaderHooks(hookFunctionMap, hookInjections);
  assembledSource += formatWGSLBindingAssignmentComments(bindingAssignments);

  // Add the version directive and actual source of this shader
  assembledSource += applicationRelocation.source;

  // Apply any requested shader injections
  assembledSource = injectShader(assembledSource, stage, mainInjections, false, 'wgsl', {
    vertex: vertexEntryPoint,
    fragment: fragmentEntryPoint
  });

  assertNoUnresolvedAutoBindings(assembledSource);

  return {source: assembledSource, bindingAssignments};
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
    defines?: Record<string, boolean | number>;
    hookFunctions?: ShaderHookInput;
    inject?: Record<string, string | ShaderInjection>;
    pluginInjections?: Record<string, ShaderInjection[]>;
    pluginVertexInputs?: Record<string, AttributeShaderType>;
    pluginVaryings?: Record<string, ResolvedShaderPluginVarying>;
    prologue?: boolean;
    log?: ShaderAssemblyLog;
  }
) {
  const {
    source,
    stage,
    language = 'glsl',
    modules,
    defines = {},
    hookFunctions = [],
    inject = {},
    pluginInjections = {},
    pluginVertexInputs = {},
    pluginVaryings = {},
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

  appendInjections(pluginInjections, hookInjections, declInjections, mainInjections);

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
  if (stage === 'vertex') {
    const declarations = getShaderPluginVertexInputDeclarationsGLSL(coreSource, pluginVertexInputs);
    if (declarations) {
      declInjections['vs:#decl'] = declInjections['vs:#decl'] || [];
      declInjections['vs:#decl'].push({
        injection: declarations,
        order: Number.MIN_SAFE_INTEGER
      });
    }
  }
  const pluginVaryingAssembly = assembleShaderPluginVaryingsGLSL(coreSource, stage, pluginVaryings);
  if (pluginVaryingAssembly.declarations) {
    const declarationTarget = stage === 'vertex' ? 'vs:#decl' : 'fs:#decl';
    declInjections[declarationTarget] = declInjections[declarationTarget] || [];
    declInjections[declarationTarget].push({
      injection: pluginVaryingAssembly.declarations,
      order: Number.MIN_SAFE_INTEGER
    });
  }
  if (pluginVaryingAssembly.initialization) {
    mainInjections['vs:#main-start'] = mainInjections['vs:#main-start'] || [];
    mainInjections['vs:#main-start'].push({
      injection: pluginVaryingAssembly.initialization,
      order: Number.MIN_SAFE_INTEGER
    });
  }

  for (const module of modules) {
    if (log) {
      checkShaderModuleDeprecations(module, coreSource, log);
    }
    const moduleSource = getShaderModuleSource(module, stage, log);
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

  validateShaderHookInjections(hookFunctionMap, hookInjections, stage);

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

  if (language === 'glsl') {
    warnIfGLSLUniformBlocksAreNotStd140(assembledSource, stage, log);
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

function appendInjections(
  injections: Record<string, ShaderInjection[]>,
  hookInjections: Record<string, ShaderInjection[]>,
  declInjections: Record<string, ShaderInjection[]>,
  mainInjections: Record<string, ShaderInjection[]>
): void {
  for (const key in injections) {
    const match = /^(v|f)s:(#)?([\w-]+)$/.exec(key);
    if (match) {
      const hash = match[2];
      const name = match[3];
      const injectionType = hash
        ? name === 'decl'
          ? declInjections
          : mainInjections
        : hookInjections;
      injectionType[key] = injectionType[key] || [];
      injectionType[key].push(...injections[key]);
    } else {
      mainInjections[key] = mainInjections[key] || [];
      mainInjections[key].push(...injections[key]);
    }
  }
}

function appendGeneratedVertexInputInjections(
  declarations: string,
  initialization: string,
  declarationInjections: Record<string, ShaderInjection[]>,
  mainInjections: Record<string, ShaderInjection[]>
): void {
  if (declarations) {
    declarationInjections['vs:#decl'] = declarationInjections['vs:#decl'] || [];
    declarationInjections['vs:#decl'].push({
      injection: declarations,
      order: Number.MIN_SAFE_INTEGER
    });
  }
  if (initialization) {
    mainInjections['vs:#main-start'] = mainInjections['vs:#main-start'] || [];
    mainInjections['vs:#main-start'].push({
      injection: initialization,
      order: Number.MIN_SAFE_INTEGER
    });
  }
}

function appendGeneratedVaryingInjections(
  assembly: {
    declarations: string;
    vertexInitialization: string;
    fragmentInitialization: string;
  },
  declarationInjections: Record<string, ShaderInjection[]>,
  mainInjections: Record<string, ShaderInjection[]>
): void {
  if (assembly.declarations) {
    declarationInjections['vs:#decl'] = declarationInjections['vs:#decl'] || [];
    declarationInjections['vs:#decl'].push({
      injection: assembly.declarations,
      order: Number.MIN_SAFE_INTEGER
    });
  }
  if (assembly.vertexInitialization) {
    mainInjections['vs:#main-start'] = mainInjections['vs:#main-start'] || [];
    mainInjections['vs:#main-start'].push({
      injection: assembly.vertexInitialization,
      order: Number.MIN_SAFE_INTEGER
    });
  }
  if (assembly.fragmentInitialization) {
    mainInjections['fs:#main-start'] = mainInjections['fs:#main-start'] || [];
    mainInjections['fs:#main-start'].push({
      injection: assembly.fragmentInitialization,
      order: Number.MIN_SAFE_INTEGER
    });
  }
}

function getWGSLModuleInjections(module: ShaderModule): Record<string, ShaderInjection> {
  return {
    ...(module.instance?.normalizedInjections.vertex || {}),
    ...(module.instance?.normalizedInjections.fragment || {})
  };
}

/**
 * Shader module injections are not language-specific, so WGSL modules may still expose legacy
 * GLSL hook injections. If WGSL declares no hooks for that stage, those injections are inactive.
 */
function hasRegisteredWGSLShaderHooksForStage(
  hookFunctionMap: ReturnType<typeof normalizeShaderHooks>,
  hookName: string
): boolean {
  const stageHooks = hookName.startsWith('vs:') ? hookFunctionMap.vertex : hookFunctionMap.fragment;
  return Object.keys(stageHooks).length > 0;
}

function getWGSLDeclarationInjections(
  declarationInjections: Record<string, ShaderInjection[]>
): Record<string, ShaderInjection[]> {
  const unifiedDeclarations = [
    ...(declarationInjections['vs:#decl'] || []),
    ...(declarationInjections['fs:#decl'] || [])
  ];

  return unifiedDeclarations.length ? {'vs:#decl': unifiedDeclarations} : {};
}

function getWGSLShaderHooks(
  hookFunctionMap: ReturnType<typeof normalizeShaderHooks>,
  hookInjections: Record<string, ShaderInjection[]>
): string {
  return (
    getShaderHooks(hookFunctionMap.vertex, hookInjections, 'wgsl') +
    getShaderHooks(hookFunctionMap.fragment, hookInjections, 'wgsl')
  );
}

/**
 * NOTE: Removed as id injection defeated caching of shaders
 * 
 * Generate "glslify-compatible" SHADER_NAME defines
 * These are understood by the GLSL error parsing function
 * If id is provided and no SHADER_NAME constant is present in source, create one
 unction getShaderNameDefine(options: {
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
*/

/** Generates application defines from an object of key value pairs */
function getApplicationDefines(defines: Record<string, boolean | number> = {}): string {
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
  stage: 'vertex' | 'fragment' | 'wgsl',
  log?: any
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

  validateShaderModuleUniformLayout(module, stage, {log});

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

type BindingRelocationContext = {
  usedBindingsByGroup: Map<number, Set<number>>;
  bindingRegistry?: Map<string, number>;
  reservedBindingKeysByGroup: Map<number, Map<number, string>>;
};

type WGSLBindingAssignment = {
  moduleName: string;
  name: string;
  group: number;
  location: number;
};

type WGSLApplicationRelocationState = {
  sawSupportedBindingDeclaration: boolean;
};

type WGSLRelocationState = {
  sawSupportedBindingDeclaration: boolean;
  nextHintedBindingLocation: number | null;
};

type WGSLRelocationParams = {
  module: ShaderModule;
  context: BindingRelocationContext;
  bindingAssignments: WGSLBindingAssignment[];
  relocationState: WGSLRelocationState;
};

function getUsedBindingsByGroupFromApplicationWGSL(source: string): Map<number, Set<number>> {
  const usedBindingsByGroup = new Map<number, Set<number>>();

  for (const match of getWGSLBindingDeclarationMatches(
    source,
    WGSL_EXPLICIT_BINDING_DECLARATION_REGEXES
  )) {
    const location = Number(match.bindingToken);
    const group = Number(match.groupToken);

    validateApplicationWGSLBinding(group, location, match.name);
    registerUsedBindingLocation(
      usedBindingsByGroup,
      group,
      location,
      `application binding "${match.name}"`
    );
  }

  return usedBindingsByGroup;
}

function relocateWGSLApplicationBindings(source: string): {source: string} {
  const declarationMatches = getWGSLBindingDeclarationMatches(
    source,
    WGSL_BINDING_DECLARATION_REGEXES
  );
  const usedBindingsByGroup = new Map<number, Set<number>>();

  for (const declarationMatch of declarationMatches) {
    if (declarationMatch.bindingToken === 'auto') {
      continue;
    }

    const location = Number(declarationMatch.bindingToken);
    const group = Number(declarationMatch.groupToken);

    validateApplicationWGSLBinding(group, location, declarationMatch.name);
    registerUsedBindingLocation(
      usedBindingsByGroup,
      group,
      location,
      `application binding "${declarationMatch.name}"`
    );
  }

  const relocationState: WGSLApplicationRelocationState = {
    sawSupportedBindingDeclaration: declarationMatches.length > 0
  };

  const relocatedSource = replaceWGSLBindingDeclarationMatches(
    source,
    WGSL_BINDING_DECLARATION_REGEXES,
    declarationMatch =>
      relocateWGSLApplicationBindingMatch(declarationMatch, usedBindingsByGroup, relocationState)
  );

  if (hasWGSLAutoBinding(source) && !relocationState.sawSupportedBindingDeclaration) {
    throw new Error(
      'Unsupported @binding(auto) declaration form in application WGSL. ' +
        'Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.'
    );
  }

  return {source: relocatedSource};
}

function relocateWGSLModuleBindings(
  moduleSource: string,
  module: ShaderModule,
  context: BindingRelocationContext
): {source: string; bindingAssignments: WGSLBindingAssignment[]} {
  const bindingAssignments: WGSLBindingAssignment[] = [];
  const declarationMatches = getWGSLBindingDeclarationMatches(
    moduleSource,
    MODULE_WGSL_BINDING_DECLARATION_REGEXES
  );
  const relocationState: WGSLRelocationState = {
    sawSupportedBindingDeclaration: declarationMatches.length > 0,
    nextHintedBindingLocation:
      typeof module.firstBindingSlot === 'number' ? module.firstBindingSlot : null
  };

  const relocatedSource = replaceWGSLBindingDeclarationMatches(
    moduleSource,
    MODULE_WGSL_BINDING_DECLARATION_REGEXES,
    declarationMatch =>
      relocateWGSLModuleBindingMatch(declarationMatch, {
        module,
        context,
        bindingAssignments,
        relocationState
      })
  );

  if (hasWGSLAutoBinding(moduleSource) && !relocationState.sawSupportedBindingDeclaration) {
    throw new Error(
      `Unsupported @binding(auto) declaration form in module "${module.name}". ` +
        'Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.'
    );
  }

  return {source: relocatedSource, bindingAssignments};
}

function relocateWGSLModuleBindingMatch(
  declarationMatch: WGSLBindingDeclarationMatch,
  params: WGSLRelocationParams
): string {
  const {module, context, bindingAssignments, relocationState} = params;

  const {match, bindingToken, groupToken, name} = declarationMatch;
  const group = Number(groupToken);

  if (bindingToken === 'auto') {
    const registryKey = getBindingRegistryKey(group, module.name, name);
    const registryLocation = context.bindingRegistry?.get(registryKey);
    const location =
      registryLocation !== undefined
        ? registryLocation
        : allocateAutoBindingLocation(
            group,
            context.usedBindingsByGroup,
            module.name,
            relocationState.nextHintedBindingLocation ?? undefined,
            context.bindingRegistry
          );
    validateModuleWGSLBinding(module.name, group, location, name);
    if (
      registryLocation !== undefined &&
      claimReservedBindingLocation(context.reservedBindingKeysByGroup, group, location, registryKey)
    ) {
      bindingAssignments.push({moduleName: module.name, name, group, location});
      return match.replace(/@binding\(\s*auto\s*\)/, `@binding(${location})`);
    }
    registerUsedBindingLocation(
      context.usedBindingsByGroup,
      group,
      location,
      `module "${module.name}" binding "${name}"`
    );
    context.bindingRegistry?.set(registryKey, location);
    bindingAssignments.push({moduleName: module.name, name, group, location});
    if (relocationState.nextHintedBindingLocation !== null && registryLocation === undefined) {
      relocationState.nextHintedBindingLocation = location + 1;
    }
    return match.replace(/@binding\(\s*auto\s*\)/, `@binding(${location})`);
  }

  const location = Number(bindingToken);
  validateModuleWGSLBinding(module.name, group, location, name);
  const registryKey = getBindingRegistryKey(group, module.name, name);
  if (
    !claimReservedBindingLocation(context.reservedBindingKeysByGroup, group, location, registryKey)
  ) {
    registerUsedBindingLocation(
      context.usedBindingsByGroup,
      group,
      location,
      `module "${module.name}" binding "${name}"`
    );
  }
  bindingAssignments.push({moduleName: module.name, name, group, location});
  return match;
}

function relocateWGSLApplicationBindingMatch(
  declarationMatch: WGSLBindingDeclarationMatch,
  usedBindingsByGroup: Map<number, Set<number>>,
  relocationState: WGSLApplicationRelocationState
): string {
  const {match, bindingToken, groupToken, name} = declarationMatch;
  const group = Number(groupToken);

  if (bindingToken === 'auto') {
    const location = allocateApplicationAutoBindingLocation(group, usedBindingsByGroup);
    validateApplicationWGSLBinding(group, location, name);
    registerUsedBindingLocation(
      usedBindingsByGroup,
      group,
      location,
      `application binding "${name}"`
    );
    return match.replace(/@binding\(\s*auto\s*\)/, `@binding(${location})`);
  }

  relocationState.sawSupportedBindingDeclaration = true;
  return match;
}

/** Reserve declared locations before reusing registry assignments or allocating new bindings. */
function reserveModuleBindings(
  modules: {module: ShaderModule; source: string}[],
  bindingRegistry: Map<string, number> | undefined,
  usedBindingsByGroup: Map<number, Set<number>>
): Map<number, Map<number, string>> {
  const reservedBindingKeysByGroup = new Map<number, Map<number, string>>();
  const autoBindings: {module: ShaderModule; name: string; group: number}[] = [];

  function reserveBinding(
    group: number,
    location: number,
    registryKey: string,
    label: string
  ): void {
    registerUsedBindingLocation(usedBindingsByGroup, group, location, label);
    const reservedBindingKeys = reservedBindingKeysByGroup.get(group) || new Map<number, string>();
    reservedBindingKeys.set(location, registryKey);
    reservedBindingKeysByGroup.set(group, reservedBindingKeys);
  }

  for (const {module, source} of modules) {
    for (const binding of getWGSLBindingDeclarationMatches(
      source,
      MODULE_WGSL_BINDING_DECLARATION_REGEXES
    )) {
      const group = Number(binding.groupToken);
      if (binding.bindingToken === 'auto') {
        autoBindings.push({module, name: binding.name, group});
        continue;
      }
      const location = Number(binding.bindingToken);
      validateModuleWGSLBinding(module.name, group, location, binding.name);
      reserveBinding(
        group,
        location,
        getBindingRegistryKey(group, module.name, binding.name),
        `module "${module.name}" binding "${binding.name}"`
      );
    }
  }

  // Only auto declarations reuse registry entries. Explicit declarations already own their slots.
  // Conflicting active assignments remain errors so previously assembled shaders keep their layout.
  for (const {module, name, group} of autoBindings) {
    const registryKey = getBindingRegistryKey(group, module.name, name);
    const location = bindingRegistry?.get(registryKey);
    if (location !== undefined) {
      reserveBinding(group, location, registryKey, `registered module binding "${registryKey}"`);
    }
  }

  return reservedBindingKeysByGroup;
}

function claimReservedBindingLocation(
  reservedBindingKeysByGroup: Map<number, Map<number, string>>,
  group: number,
  location: number,
  registryKey: string
): boolean {
  const reservedBindingKeys = reservedBindingKeysByGroup.get(group);
  if (!reservedBindingKeys) {
    return false;
  }

  const reservedKey = reservedBindingKeys.get(location);
  if (!reservedKey) {
    return false;
  }
  if (reservedKey !== registryKey) {
    throw new Error(
      `Registered module binding "${registryKey}" collided with "${reservedKey}": group ${group}, binding ${location}.`
    );
  }
  reservedBindingKeys.delete(location);
  return true;
}

function validateApplicationWGSLBinding(group: number, location: number, name: string): void {
  if (group === 0 && location >= RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT) {
    throw new Error(
      `Application binding "${name}" in group 0 uses reserved binding ${location}. ` +
        `Application-owned explicit group-0 bindings must stay below ${RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT}.`
    );
  }
}

function validateModuleWGSLBinding(
  moduleName: string,
  group: number,
  location: number,
  name: string
): void {
  if (group === 0 && location < RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT) {
    throw new Error(
      `Module "${moduleName}" binding "${name}" in group 0 uses reserved application binding ${location}. ` +
        `Module-owned explicit group-0 bindings must be ${RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT} or higher.`
    );
  }
}

function registerUsedBindingLocation(
  usedBindingsByGroup: Map<number, Set<number>>,
  group: number,
  location: number,
  label: string
): void {
  const usedBindings = usedBindingsByGroup.get(group) || new Set<number>();
  if (usedBindings.has(location)) {
    throw new Error(
      `Duplicate WGSL binding assignment for ${label}: group ${group}, binding ${location}.`
    );
  }
  usedBindings.add(location);
  usedBindingsByGroup.set(group, usedBindings);
}

function allocateAutoBindingLocation(
  group: number,
  usedBindingsByGroup: Map<number, Set<number>>,
  moduleName: string,
  preferredBindingLocation?: number,
  bindingRegistry?: Map<string, number>
): number {
  const usedBindings = usedBindingsByGroup.get(group) || new Set<number>();
  const registeredBindingLocations = new Set<number>();
  const registryGroupPrefix = `${group}:`;
  const registryModulePrefix = `${registryGroupPrefix}${moduleName}:`;
  for (const [registryKey, location] of bindingRegistry || []) {
    if (registryKey.startsWith(registryModulePrefix)) {
      registeredBindingLocations.add(location);
    }
  }
  let nextBinding =
    preferredBindingLocation ??
    (group === 0
      ? RESERVED_APPLICATION_GROUP_0_BINDING_LIMIT
      : usedBindings.size > 0
        ? Math.max(...usedBindings) + 1
        : 0);

  while (usedBindings.has(nextBinding) || registeredBindingLocations.has(nextBinding)) {
    nextBinding++;
  }

  // Active modules were reserved above; only stale, inactive modules can own this free slot.
  for (const [registryKey, location] of bindingRegistry || []) {
    if (location === nextBinding && registryKey.startsWith(registryGroupPrefix)) {
      bindingRegistry?.delete(registryKey);
    }
  }

  return nextBinding;
}

function allocateApplicationAutoBindingLocation(
  group: number,
  usedBindingsByGroup: Map<number, Set<number>>
): number {
  const usedBindings = usedBindingsByGroup.get(group) || new Set<number>();
  let nextBinding = 0;

  while (usedBindings.has(nextBinding)) {
    nextBinding++;
  }

  return nextBinding;
}

function assertNoUnresolvedAutoBindings(source: string): void {
  const unresolvedBinding = getFirstWGSLAutoBindingDeclarationMatch(
    source,
    MODULE_WGSL_BINDING_DECLARATION_REGEXES
  );
  if (!unresolvedBinding) {
    return;
  }

  const moduleName = getWGSLModuleNameAtIndex(source, unresolvedBinding.index);
  if (moduleName) {
    throw new Error(
      `Unresolved @binding(auto) for module "${moduleName}" binding "${unresolvedBinding.name}" remained in assembled WGSL source.`
    );
  }

  if (isInApplicationWGSLSection(source, unresolvedBinding.index)) {
    throw new Error(
      `Unresolved @binding(auto) for application binding "${unresolvedBinding.name}" remained in assembled WGSL source.`
    );
  }

  throw new Error(
    `Unresolved @binding(auto) remained in assembled WGSL source near "${formatWGSLSourceSnippet(unresolvedBinding.match)}".`
  );
}

function formatWGSLBindingAssignmentComments(bindingAssignments: WGSLBindingAssignment[]): string {
  if (bindingAssignments.length === 0) {
    return '';
  }

  let source = '// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------\n';
  for (const bindingAssignment of bindingAssignments) {
    source += `// ${bindingAssignment.moduleName}.${bindingAssignment.name} -> @group(${bindingAssignment.group}) @binding(${bindingAssignment.location})\n`;
  }
  source += '\n';
  return source;
}

function getBindingRegistryKey(group: number, moduleName: string, bindingName: string): string {
  return `${group}:${moduleName}:${bindingName}`;
}

function getWGSLModuleNameAtIndex(source: string, index: number): string | undefined {
  const moduleHeaderRegex = /^\/\/ ----- MODULE ([^\n]+) ---------------$/gm;
  let moduleName: string | undefined;
  let match: RegExpExecArray | null;

  match = moduleHeaderRegex.exec(source);
  while (match && match.index <= index) {
    moduleName = match[1];
    match = moduleHeaderRegex.exec(source);
  }

  return moduleName;
}

function isInApplicationWGSLSection(source: string, index: number): boolean {
  const injectionMarkerIndex = source.indexOf(INJECT_SHADER_DECLARATIONS);
  return injectionMarkerIndex >= 0 ? index > injectionMarkerIndex : true;
}

function formatWGSLSourceSnippet(source: string): string {
  return source.replace(/\s+/g, ' ').trim();
}
