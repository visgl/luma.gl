// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

/**
 *
 */
export type ShaderInjection = {
  injection: string;
  order: number;
};

/**
 *  ShaderInjections, parsed and split per shader
 */
export type ShaderInjections = {
  vertex: Record<string, ShaderInjection>;
  fragment: Record<string, ShaderInjection>;
};

/**
 *
 */
export function normalizeInjections(
  injections: Record<string, string | ShaderInjection>
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
  inject: Record<string, ShaderInjection[]>,
  injectStandardStubs = false
): string {
  const isVertex = stage === 'vertex';

  for (const key in inject) {
    const fragmentData = inject[key];
    fragmentData.sort((a: ShaderInjection, b: ShaderInjection): number => a.order - b.order);
    fragments.length = fragmentData.length;
    for (let i = 0, len = fragmentData.length; i < len; ++i) {
      fragments[i] = fragmentData[i].injection;
    }
    const fragmentString = `${fragments.join('\n')}\n`;
    switch (key) {
      // declarations are injected before the main function
      case 'vs:#decl':
        if (isVertex) {
          source = source.replace(DECLARATION_INJECT_MARKER, fragmentString);
        }
        break;
      // inject code at the beginning of the main function
      case 'vs:#main-start':
        if (isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, (match: string) => match + fragmentString);
        }
        break;
      // inject code at the end of main function
      case 'vs:#main-end':
        if (isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, (match: string) => fragmentString + match);
        }
        break;
      // declarations are injected before the main function
      case 'fs:#decl':
        if (!isVertex) {
          source = source.replace(DECLARATION_INJECT_MARKER, fragmentString);
        }
        break;
      // inject code at the beginning of the main function
      case 'fs:#main-start':
        if (!isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, (match: string) => match + fragmentString);
        }
        break;
      // inject code at the end of main function
      case 'fs:#main-end':
        if (!isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, (match: string) => fragmentString + match);
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
