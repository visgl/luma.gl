import {MODULE_INJECTORS_VS, MODULE_INJECTORS_FS} from '../../modules/module-injectors';
import type { Injection } from '../shader-module/shader-module-instance';
import {assert} from '../utils/assert';

// TODO - experimental
const MODULE_INJECTORS = {
  vs: MODULE_INJECTORS_VS,
  fs: MODULE_INJECTORS_FS
};

const REGEX_START_OF_MAIN = /void\s+main\s*\([^)]*\)\s*\{\n?/; // Beginning of main
const REGEX_END_OF_MAIN = /}\n?[^{}]*$/; // End of main, assumes main is last function
const fragments: string[] = [];

export const DECLARATION_INJECT_MARKER = '__LUMA_INJECT_DECLARATIONS__';

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
export default function injectShader(
  source: string, 
  type: 'vs' | 'fs', 
  inject: Record<string, Injection[]>, 
  injectStandardStubs = false
): string {
  const isVertex = type === 'vs';

  for (const key in inject) {
    const fragmentData = inject[key];
    fragmentData.sort((a: Injection, b: Injection): number => a.order - b.order);
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
    source = source.replace(/\}\s*$/, (match: string) => match + MODULE_INJECTORS[type]);
  }

  return source;
}

// Takes an array of inject objects and combines them into one
export function combineInjects(injects: any[]): Record<string, string> {
  const result: Record<string, string> = {};
  assert(Array.isArray(injects) && injects.length > 1);
  injects.forEach((inject) => {
    for (const key in inject) {
      result[key] = result[key] ? `${result[key]}\n${inject[key]}` : inject[key];
    }
  });
  return result;
}
