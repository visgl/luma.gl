// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getShaderModuleDependencies} from '../shader-module/shader-module-dependencies';
import {
  type AssembleShaderOptions,
  type GetUniformsFunc,
  type ShaderAssemblyLog
} from './shader-assembly-types';
import {
  assembleGetUniforms,
  appendInjections,
  getShaderModuleSource,
  INJECT_SHADER_DECLARATIONS
} from './shader-assembly-shared';
import {PlatformInfo} from './platform-info';
import {type ShaderModule, checkShaderModuleDeprecations} from '../shader-module/shader-module';
import {
  type ShaderInjectionTarget,
  normalizeShaderInjectionTargets,
  validateShaderInjectionTargetInjections,
  getShaderInjectionTargets
} from './shader-injection-targets';
import {
  type ShaderInjection,
  type ResolvedShaderInjection,
  injectShader,
  resolveShaderInjections
} from './shader-injections';
import {type AttributeShaderType} from '../../types';
import {type ResolvedShaderPluginInterStageVariable} from '../shader-plugin';
import {assert} from '../utils/assert';
import {getShaderInfo} from '../glsl-utils/get-shader-info';
import {getPlatformShaderDefines} from './platform-defines';
import {getShaderPluginVertexInputDeclarationsGLSL} from './shader-plugin-vertex-inputs';
import {assembleShaderPluginInterStageVariablesGLSL} from './shader-plugin-varyings';
import {transpileGLSLShader} from '../shader-transpiler/transpile-glsl-shader';
import {warnIfGLSLUniformBlocksAreNotStd140} from '../shader-module/shader-module-uniform-layout';

/**
 * Precision prologue to inject before functions are injected in shader
 * TODO - extract any existing prologue in the fragment source and move it up...
 */
export const FRAGMENT_SHADER_PROLOGUE = /* glsl */ `\
precision highp float;
`;

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
export function assembleShaderGLSL(
  platformInfo: PlatformInfo,
  options: {
    id?: string;
    source: string;
    language?: 'glsl' | 'wgsl';
    stage: 'vertex' | 'fragment';
    modules: ShaderModule[];
    defines?: Record<string, boolean | number>;
    injectionTargets?: readonly ShaderInjectionTarget[];
    pluginInjectionTargets?: readonly ShaderInjectionTarget[];
    inject?: readonly ShaderInjection[] | Record<string, string | ResolvedShaderInjection>;
    pluginInjections?: Record<string, ResolvedShaderInjection[]>;
    pluginVertexInputs?: Record<string, AttributeShaderType>;
    pluginInterStageVariables?: Record<string, ResolvedShaderPluginInterStageVariable>;
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
    injectionTargets = [],
    inject = {},
    pluginInjections = {},
    pluginVertexInputs = {},
    pluginInterStageVariables = {},
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

  const injectionTargetMap = normalizeShaderInjectionTargets(
    injectionTargets,
    options.pluginInjectionTargets,
    'glsl'
  );

  // Add source of dependent modules in resolved order
  const targetInjections: Record<string, ResolvedShaderInjection[]> = {};
  const declInjections: Record<string, ResolvedShaderInjection[]> = {};
  const mainInjections: Record<string, ResolvedShaderInjection[]> = {};

  appendInjections(pluginInjections, targetInjections, declInjections, mainInjections);

  const applicationInjections = Array.isArray(inject)
    ? resolveShaderInjections(inject, 'glsl')
    : {};
  appendInjections(applicationInjections, targetInjections, declInjections, mainInjections);
  const injectionMap = Array.isArray(inject)
    ? {}
    : (inject as Record<string, string | ResolvedShaderInjection>);
  for (const key in injectionMap) {
    const injection: ResolvedShaderInjection =
      typeof injectionMap[key] === 'string'
        ? {injection: injectionMap[key], order: 0}
        : injectionMap[key];
    const match = /^(v|f)s:(#)?([\w-]+)$/.exec(key);
    if (match) {
      const hash = match[2];
      const name = match[3];
      if (hash) {
        if (name === 'decl') {
          declInjections[key] = [...(declInjections[key] || []), injection];
        } else {
          mainInjections[key] = [...(mainInjections[key] || []), injection];
        }
      } else {
        targetInjections[key] = [...(targetInjections[key] || []), injection];
      }
    } else {
      // Regex injection
      mainInjections[key] = [...(mainInjections[key] || []), injection];
    }
  }
  // Module helpers may access plugin inputs and varyings. GLSL requires these
  // interface declarations before the helpers, unlike ordinary #decl injections.
  if (stage === 'vertex') {
    const declarations = getShaderPluginVertexInputDeclarationsGLSL(coreSource, pluginVertexInputs);
    if (declarations) assembledSource += `${declarations}\n`;
  }
  const pluginVaryingAssembly = assembleShaderPluginInterStageVariablesGLSL(
    coreSource,
    stage,
    pluginInterStageVariables
  );
  if (pluginVaryingAssembly.declarations) {
    assembledSource += `${pluginVaryingAssembly.declarations}\n`;
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
  }

  // Named hook injections must target a registered hook.
  validateShaderInjectionTargetInjections(injectionTargetMap, targetInjections, stage);

  assembledSource += '// ----- MAIN SHADER SOURCE -------------------------';

  // For injectShader
  assembledSource += INJECT_SHADER_DECLARATIONS;

  assembledSource = injectShader(assembledSource, stage, declInjections);

  assembledSource += getShaderInjectionTargets(injectionTargetMap[stage], targetInjections);

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
export function getApplicationDefines(defines: Record<string, boolean | number> = {}): string {
  let sourceText = '';
  for (const define in defines) {
    const value = defines[define];
    if (value || Number.isFinite(value)) {
      sourceText += `#define ${define.toUpperCase()} ${defines[define]}\n`;
    }
  }
  return sourceText;
}
