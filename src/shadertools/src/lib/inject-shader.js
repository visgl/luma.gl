import {MODULE_INJECTORS_VS, MODULE_INJECTORS_FS} from '../modules/module-injectors';
import {VERTEX_SHADER, FRAGMENT_SHADER} from './constants';

// TODO - experimental
const MODULE_INJECTORS = {
  [VERTEX_SHADER]: MODULE_INJECTORS_VS,
  [FRAGMENT_SHADER]: MODULE_INJECTORS_FS
};

const REGEX_DECLARATIONS = /^/; // Beginning of file
const REGEX_START_OF_MAIN = /main\w*\(\w*\)\w*\{/; // Beginning of main
const REGEX_END_OF_MAIN = /}[^{}]*$/; // End of main, assumes main is last function

// A minimal shader injection/templating system.
// RFC: https://github.com/uber/luma.gl/blob/master/dev-docs/RFCs/v6.0/shader-injection-rfc.md
export default function injectShader(source, type, inject, injectStandardStubs) {
  const isVertex = type === VERTEX_SHADER;

  for (const key in inject) {
    const fragment = inject[key];
    switch (key) {
    // declarations are injected at beginning of shader
    case 'vs-decl':
      if (isVertex) {
        source = source.replace(REGEX_DECLARATIONS, fragment);
      }
      break;
    // main code is injected at the end of main function
    case 'vs-main-start':
      if (isVertex) {
        source = source.replace(REGEX_START_OF_MAIN, fragment.concat('\n}\n'));
      }
      break;
    case 'vs-main-end':
      if (isVertex) {
        source = source.replace(REGEX_END_OF_MAIN, fragment.concat('\n}\n'));
      }
      break;
    case 'fs-decl':
      if (!isVertex) {
        source = source.replace(REGEX_DECLARATIONS, fragment);
      }
      break;
    case 'fs-main-start':
      if (!isVertex) {
        source = source.replace(REGEX_START_OF_MAIN, fragment.concat('\n}\n'));
      }
      break;
    case 'fs-main-end':
      if (!isVertex) {
        source = source.replace(REGEX_END_OF_MAIN, fragment.concat('\n}\n'));
      }
      break;
    default:
      // inject code after key, leaving key in place
      source = source.replace(key, key.concat('\n').concat(fragment));
    }
  }

  // Finally, if requested, insert an automatic module injector chunk
  if (injectStandardStubs) {
    source = source.replace('}\s*$', MODULE_INJECTORS[type]);
  }

  return source;
}
