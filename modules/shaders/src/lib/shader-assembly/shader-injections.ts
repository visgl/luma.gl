// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {MODULE_INJECTORS_VS, MODULE_INJECTORS_FS} from '../../module-injectors';
import {assert} from '../utils/assert';

// TODO - experimental
const MODULE_INJECTORS = {
  vertex: MODULE_INJECTORS_VS,
  fragment: MODULE_INJECTORS_FS
};

const REGEX_START_OF_MAIN = /void\s+main\s*\([^)]*\)\s*\{\n?/; // Beginning of main
const REGEX_END_OF_MAIN = /}\n?[^{}]*$/; // End of main, assumes main is last function
const fragments: string[] = [];

export const DECLARATION_INJECT_MARKER = '__LUMA_INJECT_DECLARATIONS__';

/** Language-specific source inserted at a named shader target. */
export type ShaderInjection = {
  /** Shader stage receiving the injection. */
  stage: 'vertex' | 'fragment';
  /** Unqualified hook name or built-in target such as #main-start. */
  target: string;
  /** GLSL source. Omit to skip this injection for GLSL assembly. */
  glsl?: string;
  /** WGSL source. Omit to skip this injection for WGSL assembly. */
  wgsl?: string;
  /** Relative order at the target; defaults to zero. */
  order?: number;
};

/** Language-selected source and ordering used internally during shader assembly. */
export type ResolvedShaderInjection = {
  /** Plugin responsible for this injection, when supplied by a ShaderPlugin. */
  pluginName?: string;
  injection: string;
  order: number;
};

/** Select language-specific injections while retaining repeated targets and declaration order. */
export function resolveShaderInjections(
  declarations: readonly ShaderInjection[],
  language: 'glsl' | 'wgsl',
  pluginName?: string
): Record<string, ResolvedShaderInjection[]> {
  const resolved: Record<string, ResolvedShaderInjection[]> = {};
  for (const declaration of declarations) {
    const source = declaration[language];
    if (source === undefined) continue;
    if (
      (declaration.stage !== 'vertex' && declaration.stage !== 'fragment') ||
      declaration.target.includes(':')
    ) {
      throw new Error('Shader injection targets require an explicit stage and unqualified target');
    }
    const target = `${declaration.stage === 'vertex' ? 'vs' : 'fs'}:${declaration.target}`;
    if (!/^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][A-Za-z0-9_]*)$/.test(target)) {
      throw new Error(
        `Shader injection target "${target}" must be a named shader injection target`
      );
    }
    resolved[target] ||= [];
    resolved[target].push({
      injection: source,
      order: declaration.order ?? 0,
      ...(pluginName ? {pluginName} : {})
    });
  }
  return resolved;
}

/**
 *  ShaderInjections, parsed and split per shader
 */
export type ShaderInjections = {
  vertex: Record<string, ResolvedShaderInjection>;
  fragment: Record<string, ResolvedShaderInjection>;
};

/**
 *
 */
export function normalizeInjections(
  injections: Record<string, string | ResolvedShaderInjection>
): ShaderInjections {
  const result: ShaderInjections = {vertex: {}, fragment: {}};

  for (const hook in injections) {
    let injection = injections[hook];
    const stage = getHookStage(hook);
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

function getHookStage(hook: string): 'vertex' | 'fragment' {
  const type = hook.slice(0, 2);
  switch (type) {
    case 'vs':
      return 'vertex';
    case 'fs':
      return 'fragment';
    default:
      throw new Error(type);
  }
}

/**
// A minimal shader injection/templating system.
// RFC: https://github.com/visgl/luma.gl/blob/7.0-release/dev-docs/RFCs/v6.0/shader-injection-rfc.md
 * @param source 
 * @param type 
 * @param inject 
 * @param injectStandardStubs 
 * @returns 
 */
// eslint-disable-next-line complexity
export function injectShader(
  source: string,
  stage: 'vertex' | 'fragment',
  inject: Record<string, ResolvedShaderInjection[]>,
  injectStandardStubs = false,
  language: 'glsl' | 'wgsl' = 'glsl',
  entryPoints: {vertex?: string; fragment?: string} = {}
): string {
  const isVertex = stage === 'vertex';

  for (const key in inject) {
    const fragmentData = inject[key];
    fragmentData.sort(
      (a: ResolvedShaderInjection, b: ResolvedShaderInjection): number => a.order - b.order
    );
    fragments.length = fragmentData.length;
    for (let i = 0, len = fragmentData.length; i < len; ++i) {
      fragments[i] = fragmentData[i].injection;
    }
    const fragmentString = `${fragments.join('\n')}\n`;
    switch (key) {
      // declarations are injected before the main function
      case 'vs:#decl':
        if (language === 'wgsl' || isVertex) {
          source = source.replace(DECLARATION_INJECT_MARKER, fragmentString);
        }
        break;
      // inject code at the beginning of the main function
      case 'vs:#main-start':
        if (language === 'wgsl' || isVertex) {
          source =
            language === 'wgsl'
              ? injectWGSLStageMain(source, 'vertex', fragmentString, 'start', entryPoints.vertex)
              : source.replace(REGEX_START_OF_MAIN, (match: string) => match + fragmentString);
        }
        break;
      // inject code at the end of main function
      case 'vs:#main-end':
        if (language === 'wgsl' || isVertex) {
          source =
            language === 'wgsl'
              ? injectWGSLStageMain(source, 'vertex', fragmentString, 'end', entryPoints.vertex)
              : source.replace(REGEX_END_OF_MAIN, (match: string) => fragmentString + match);
        }
        break;
      // declarations are injected before the main function
      case 'fs:#decl':
        if (language === 'wgsl' || !isVertex) {
          source = source.replace(DECLARATION_INJECT_MARKER, fragmentString);
        }
        break;
      // inject code at the beginning of the main function
      case 'fs:#main-start':
        if (language === 'wgsl' || !isVertex) {
          source =
            language === 'wgsl'
              ? injectWGSLStageMain(
                  source,
                  'fragment',
                  fragmentString,
                  'start',
                  entryPoints.fragment
                )
              : source.replace(REGEX_START_OF_MAIN, (match: string) => match + fragmentString);
        }
        break;
      // inject code at the end of main function
      case 'fs:#main-end':
        if (language === 'wgsl' || !isVertex) {
          source =
            language === 'wgsl'
              ? injectWGSLStageMain(source, 'fragment', fragmentString, 'end', entryPoints.fragment)
              : source.replace(REGEX_END_OF_MAIN, (match: string) => fragmentString + match);
        }
        break;

      default:
        // TODO(Tarek): I think this usage should be deprecated.

        // inject code after key, leaving key in place
        source = source.replace(key, (match: string) => match + fragmentString);
    }
  }

  // Remove if it hasn't already been replaced
  source = source.replace(DECLARATION_INJECT_MARKER, '');

  // Finally, if requested, insert an automatic module injector chunk
  if (injectStandardStubs) {
    source = source.replace(/\}\s*$/, (match: string) => match + MODULE_INJECTORS[stage]);
  }

  return source;
}

// Takes an array of inject objects and combines them into one
export function combineInjects(injects: any[]): Record<string, string> {
  const result: Record<string, string> = {};
  assert(Array.isArray(injects) && injects.length > 1);
  injects.forEach(inject => {
    for (const key in inject) {
      result[key] = result[key] ? `${result[key]}\n${inject[key]}` : inject[key];
    }
  });
  return result;
}

function injectWGSLStageMain(
  source: string,
  stage: 'vertex' | 'fragment',
  fragmentString: string,
  position: 'start' | 'end',
  entryPoint?: string
): string {
  const bodyRange = getWGSLStageFunctionBodyRange(source, stage, entryPoint);
  if (!bodyRange) {
    return source;
  }

  if (position === 'start') {
    const insertionIndex = bodyRange.openBraceIndex + 1;
    return `${source.slice(0, insertionIndex)}\n${fragmentString}${source.slice(insertionIndex)}`;
  }

  return `${source.slice(0, bodyRange.closeBraceIndex)}${fragmentString}${source.slice(
    bodyRange.closeBraceIndex
  )}`;
}

function getWGSLStageFunctionBodyRange(
  source: string,
  stage: 'vertex' | 'fragment',
  entryPoint?: string
): {openBraceIndex: number; closeBraceIndex: number} | null {
  const stageAttribute = stage === 'vertex' ? '@vertex' : '@fragment';
  const stageIndex = source.indexOf(stageAttribute);
  if (stageIndex < 0) {
    return null;
  }

  const functionIndex = entryPoint
    ? source.search(new RegExp(`\\bfn\\s+${escapeRegExp(entryPoint)}\\s*\\(`))
    : source.indexOf('fn', stageIndex);
  if (functionIndex < 0) {
    return null;
  }

  const openBraceIndex = source.indexOf('{', functionIndex);
  if (openBraceIndex < 0) {
    return null;
  }

  let braceDepth = 0;
  for (let index = openBraceIndex; index < source.length; index++) {
    const character = source[index];
    if (character === '{') {
      braceDepth++;
    } else if (character === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        return {openBraceIndex, closeBraceIndex: index};
      }
    }
  }

  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
