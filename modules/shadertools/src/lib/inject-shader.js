import {MODULE_INJECTORS_VS, MODULE_INJECTORS_FS} from '../modules/module-injectors';
import {VERTEX_SHADER, FRAGMENT_SHADER} from './constants';
import {assert} from '../utils';

// TODO - experimental
const MODULE_INJECTORS = {
  [VERTEX_SHADER]: MODULE_INJECTORS_VS,
  [FRAGMENT_SHADER]: MODULE_INJECTORS_FS
};

const REGEX_START_OF_MAIN = /void main\s*\([^)]*\)\s*\{\n?/; // Beginning of main
const REGEX_END_OF_MAIN = /}\n?[^{}]*$/; // End of main, assumes main is last function
const MODULE_REGEXES = {
  PICK_COLOR: /\n\s*##PICK_COLOR\(([\w ]+)\)\s*\n/,
  FRAGMENT_COLOR: /\n\s*##FRAGMENT_COLOR\s*\n/
};

// A minimal shader injection/templating system.
// RFC: https://github.com/uber/luma.gl/blob/7.0-release/dev-docs/RFCs/v6.0/shader-injection-rfc.md
/* eslint-disable complexity */
export default function injectShader(source, type, inject, moduleInjections, injectStandardStubs) {
  const isVertex = type === VERTEX_SHADER;

  for (const key in inject) {
    const fragment = inject[key];
    switch (key) {
      // declarations are injected before the main function
      case 'vs:#decl':
        if (isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, match => `${fragment}\n${match}`);
        }
        break;
      // main code is injected at the end of main function
      case 'vs:#main-start':
        if (isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, match => match + fragment);
        }
        break;
      case 'vs:#main-end':
        if (isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, match => fragment + match);
        }
        break;
      case 'fs:#decl':
        if (!isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, match => `${fragment}\n${match}`);
        }
        break;
      case 'fs:#main-start':
        if (!isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, match => match + fragment);
        }
        break;
      case 'fs:#main-end':
        if (!isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, match => fragment + match);
        }
        break;

      default:
        // inject code after key, leaving key in place
        source = source.replace(key, match => match + fragment);
    }
  }

  for (const key in moduleInjections) {
    const injections = moduleInjections[key];
    if (MODULE_REGEXES[key]) {
      source = source.replace(MODULE_REGEXES[key], (match, args) => {
        let result = '';
        for (const injection of injections) {
          result += `${parseInjection(injection, args || '')};\n`;
        }

        return result;
      });
    }
  }

  // Finally, if requested, insert an automatic module injector chunk
  if (injectStandardStubs) {
    source = source.replace('}s*$', match => match + MODULE_INJECTORS[type]);
  }

  return source;
}

function parseInjection(injection, args) {
  if (typeof injection === 'string') {
    return injection;
  }

  const numInjectionArgs = injection.arguments ? injection.arguments.length : 0;
  args = args.replace(/\s+/g, '');
  if (args.length === 0) {
    assert(numInjectionArgs === 0, `Module injection argument mismatch ${injection.snippet}`);
    return injection.snippet;
  }

  args = args.split(',');

  assert(
    args.length === numInjectionArgs,
    `Module injection argument mismatch ${injection.snippet}`
  );

  let snippet = injection.snippet;
  for (let i = 0; i < numInjectionArgs; ++i) {
    snippet = snippet.replace(new RegExp(`\\b${injection.arguments[i]}\\b`, 'g'), args[i]);
  }

  return snippet;
}

/* eslint-enable complexity */

// Takes an array of inject objects and combines them into one
export function combineInjects(injects) {
  const result = {};
  assert(Array.isArray(injects) && injects.length > 1);
  injects.forEach(inject => {
    for (const key in inject) {
      result[key] = result[key] ? `${result[key]}\n${inject[key]}` : inject[key];
    }
  });
  return result;
}
